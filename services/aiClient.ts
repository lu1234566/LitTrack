import { Book } from '@/types/book';
import { nativeAuth } from '@/services/firebaseNative';
import { stripHtml } from '@/services/plainText';

// AI features (OCR + "chat with the book") via Google's Gemini API.
//
// Two modes, chosen by env (EXPO_PUBLIC_*, set only in EAS — never in git):
//  1. Proxy mode  — set EXPO_PUBLIC_AI_PROXY_URL. The app posts to YOUR backend
//     (e.g. a Firebase Cloud Function) which holds the Gemini key server-side.
//     This is the right setup for a public release: no key ships in the APK.
//  2. Direct mode — set EXPO_PUBLIC_GEMINI_API_KEY. The app calls Google
//     directly with the key embedded in the build. Fine for a personal/internal
//     APK; not recommended for a public store listing.
// Proxy mode wins if both are set.

const PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL;
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
// O Google aposentou o gemini-2.5-flash para contas novas (erro 404 pedindo o
// 3.8). A variável EXPO_PUBLIC_GEMINI_MODEL, se existir, vence este padrão.
const MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.8-flash';

export const isAiConfigured = Boolean(PROXY_URL || API_KEY);

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiContent = { role: 'user' | 'model'; parts: Part[] };
export type ChatTurn = { role: 'user' | 'assistant'; content: string };

type GeminiBody = {
  contents: GeminiContent[];
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: { maxOutputTokens?: number; thinkingConfig?: { thinkingBudget: number } };
};

// Modelos 2.5 "pensam" antes de responder por padrão, e os tokens de
// raciocínio saem do free tier e do maxOutputTokens (podendo truncar a
// resposta). OCR e papo sobre livro não precisam disso — orçamento zero.
// Desliga o "pensar" nos modelos 2.5, que gastam a cota nisso. Para outros
// modelos o campo é retirado na hora da chamada (ver `semThinking`).
const NO_THINKING = { thinkingBudget: 0 };

function semThinking(body: GeminiBody): GeminiBody {
  if (!body.generationConfig?.thinkingConfig) return body;
  const { thinkingConfig, ...resto } = body.generationConfig;
  return { ...body, generationConfig: resto };
}

// In proxy mode, attach the signed-in user's Firebase ID token so the backend
// can verify the caller and reject strangers. No-op in direct mode.
async function proxyAuthHeader(): Promise<Record<string, string>> {
  if (!PROXY_URL) return {};
  try {
    const user = (nativeAuth as { currentUser?: { getIdToken?: () => Promise<string> } } | null)?.currentUser;
    const token = user?.getIdToken ? await user.getIdToken() : null;
    return token ? { authorization: 'Bearer ' + token } : {};
  } catch {
    return {};
  }
}

/** Sobrecarga (503) e limite de ritmo (429) passam sozinhos: vale insistir. */
const PASSAGEIRO = new Set([429, 500, 503]);
const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Modelos de reserva, perguntados ao próprio Google (ListModels) em vez de
 * adivinhados — o nome "-lite" que eu supus não existia e virou 404.
 *
 * Fica com os "flash" que geram texto, os leves primeiro (mais folga nos
 * picos). Consulta uma vez por sessão; se a lista falhar, não há reserva.
 */
let reservasEmCache: Promise<string[]> | null = null;

export function pickFallbackModels(nomes: string[], principal: string): string[] {
  return nomes
    .map((n) => n.replace(/^models\//, ''))
    .filter((n) => n !== principal && /flash/.test(n) && !/(image|tts|audio|live|embedding|preview|exp)/.test(n))
    .sort((x, y) => Number(/lite/.test(y)) - Number(/lite/.test(x)))
    .slice(0, 2);
}

function modelosReserva(): Promise<string[]> {
  if (PROXY_URL) return Promise.resolve([]);
  if (!reservasEmCache) {
    reservasEmCache = fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=' + API_KEY)
      .then((r) => (r.ok ? r.json() : { models: [] }))
      .then((data) => {
        const modelos: Array<{ name?: string; supportedGenerationMethods?: string[] }> = data?.models || [];
        const nomes = modelos
          .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
          .map((m) => m.name || '');
        return pickFallbackModels(nomes, MODEL);
      })
      .catch(() => []);
  }
  return reservasEmCache;
}

const statusDe = (erro: unknown) => (erro as { status?: number })?.status;

async function tentarModelo(body: GeminiBody, modelo: string): Promise<string> {
  let ultimo: unknown;
  // Pico de demanda no Gemini é comum no plano gratuito e dura segundos:
  // três tentativas espaçadas resolvem a maioria sem o usuário perceber.
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    if (tentativa > 0) await esperar(tentativa === 1 ? 1500 : 4000);
    try {
      return await chamarModelo(body, modelo);
    } catch (erro) {
      ultimo = erro;
      const status = statusDe(erro);
      if (!status || !PASSAGEIRO.has(status)) break;
    }
  }
  throw ultimo;
}

async function callGemini(body: GeminiBody): Promise<string> {
  if (!isAiConfigured) throw new Error('IA não configurada.');
  // Com proxy, quem escolhe o modelo é o servidor.
  if (PROXY_URL) return tentarModelo(body, '');

  let erroPrincipal: unknown;
  try {
    return await tentarModelo(body, MODEL);
  } catch (erro) {
    erroPrincipal = erro;
  }
  // Só troca de modelo quando o problema é do modelo (sobrecarga ou nome
  // aposentado). Chave inválida falharia igual em qualquer um.
  const status = statusDe(erroPrincipal);
  if (!status || (!PASSAGEIRO.has(status) && status !== 404)) throw erroPrincipal;

  for (const reserva of await modelosReserva()) {
    try {
      return await tentarModelo(body, reserva);
    } catch {
      // segue para o próximo
    }
  }
  // O erro que importa é o do modelo principal: o 404 de uma reserva
  // escondia o motivo real (a sobrecarga) na tela.
  throw erroPrincipal;
}

async function chamarModelo(body: GeminiBody, modelo: string): Promise<string> {
  const url = PROXY_URL
    ? PROXY_URL
    : 'https://generativelanguage.googleapis.com/v1beta/models/' + modelo + ':generateContent?key=' + API_KEY;
  // thinkingBudget é da família 2.5; no modelo de reserva pode não valer.
  const corpo = /gemini-2\.5/.test(modelo) || PROXY_URL ? body : semThinking(body);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(await proxyAuthHeader()) },
    body: JSON.stringify(corpo)
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    // Diz QUEM falhou: com o proxy ligado, o erro é do nosso servidor, não do
    // Gemini — e o conserto é em outro lugar. A página de erro do Google Cloud
    // vem em HTML; sem tirar as tags, ela chegava inteira na tela.
    const origem = PROXY_URL ? 'Servidor proxy (Cloud Function)' : 'Gemini';
    const texto = stripHtml(detail).replace(/\s+/g, ' ').trim();
    const erro = new Error(origem + ' ' + res.status + (texto ? ': ' + texto.slice(0, 180) : '')) as Error & { status?: number };
    erro.status = res.status;
    throw erro;
  }
  const data = await res.json();
  const blocked = data?.candidates?.[0]?.finishReason && data.candidates[0].finishReason !== 'STOP';
  const text = (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p?.text || '').join('').trim();
  if (!text) throw new Error(blocked ? 'A resposta foi bloqueada pela IA.' : 'Resposta vazia da IA.');
  return text;
}

/** OCR: extracts the quote/passage text from a photo of a physical page. */
export async function extractQuoteFromImage(base64: string, mimeType = 'image/jpeg'): Promise<string> {
  const prompt = 'Esta é a foto da página de um livro. Transcreva fielmente apenas o trecho/citação principal em destaque (ou todo o texto legível, se não houver destaque). Responda só com o texto transcrito, sem aspas, sem comentários, sem tradução.';
  return callGemini({
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] }],
    generationConfig: { maxOutputTokens: 1024, thinkingConfig: NO_THINKING }
  });
}

/** "Converse com o livro": answers a question grounded in the book's metadata. */
export async function askAboutBook(book: Book, question: string, history: ChatTurn[] = []): Promise<string> {
  const facts = [
    'Título: ' + book.title,
    'Autor: ' + book.author,
    book.genre ? 'Gênero: ' + book.genre : '',
    book.publishedDate ? 'Ano: ' + book.publishedDate : '',
    book.description ? 'Sinopse: ' + book.description : ''
  ].filter(Boolean).join('\n');
  const system = 'Você é uma companhia de leitura no app Readora. Converse em português brasileiro sobre o livro abaixo, ajudando o leitor a refletir, esclarecer dúvidas e aprofundar. Evite spoilers de pontos da trama que o usuário ainda não mencionou, a menos que ele peça explicitamente. Seja conciso e caloroso.\n\nLIVRO:\n' + facts;
  const contents: GeminiContent[] = [
    ...history.map((t) => ({ role: (t.role === 'assistant' ? 'model' : 'user') as 'user' | 'model', parts: [{ text: t.content }] })),
    { role: 'user', parts: [{ text: question }] }
  ];
  return callGemini({ contents, systemInstruction: { parts: [{ text: system }] }, generationConfig: { maxOutputTokens: 1024, thinkingConfig: NO_THINKING } });
}

export type AiBookFacts = { description?: string; totalPages?: number; genre?: string };

/**
 * Último recurso quando nenhum catálogo tem os dados (ex.: Google Books com
 * cota estourada, ou edição que não existe nas bases). O modelo conhece os
 * livros mais comuns, então serve para preencher sinopse/gênero.
 *
 * IMPORTANTE: é conteúdo GERADO, não catálogo. O prompt exige `null` quando o
 * modelo não tem certeza — melhor um campo vazio do que um número inventado —
 * e quem chama deve deixar claro na interface que o dado veio da IA.
 */
/**
 * Por que a IA não preencheu nada. Sem isto, "chave ausente", "chave inválida"
 * e "o modelo não conhece o livro" devolvem todos `null` — indistinguíveis
 * para quem está olhando a tela, e impossíveis de depurar à distância.
 */
export type AiFactsStatus = 'ok' | 'off' | 'error' | 'unknown-book';
export type AiFactsResult = {
  facts: AiBookFacts | null;
  status: AiFactsStatus;
  /** A mensagem do Google, quando houve erro — é ela que diz o que consertar. */
  detail?: string;
};

/** A chave nunca vai para a tela, mesmo que apareça numa mensagem de erro. */
function semChave(texto: string) {
  return texto.replace(/AIza[0-9A-Za-z_-]{10,}/g, '***').slice(0, 220);
}

export async function fetchBookFactsFromAi(title: string, author: string): Promise<AiBookFacts | null> {
  return (await fetchBookFactsDetailed(title, author)).facts;
}

export async function fetchBookFactsDetailed(title: string, author: string): Promise<AiFactsResult> {
  if (!isAiConfigured) return { facts: null, status: 'off' };
  if (!title.trim()) return { facts: null, status: 'unknown-book' };
  const prompt = [
    'Livro: "' + title + '"' + (author ? ' de ' + author : ''),
    '',
    'Responda APENAS com um JSON válido, sem markdown, no formato:',
    '{"description": string|null, "totalPages": number|null, "genre": string|null}',
    '',
    '- description: sinopse em português do Brasil, 2 a 4 frases, sem spoilers do final.',
    '- totalPages: número aproximado de páginas da edição mais comum.',
    '- genre: um único gênero, em português.',
    '',
    'Use null em QUALQUER campo sobre o qual você não tenha certeza. Nunca invente.',
    'Se não conhecer o livro, responda {"description":null,"totalPages":null,"genre":null}.'
  ].join('\n');

  try {
    const raw = await callGemini({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2048, thinkingConfig: NO_THINKING }
    });
    // O modelo às vezes embrulha o JSON em ```json ... ```
    const json = raw.replace(/```json|```/g, '').trim();
    const start = json.indexOf('{');
    const end = json.lastIndexOf('}');
    if (start < 0 || end < 0) return { facts: null, status: 'error' };
    const parsed = JSON.parse(json.slice(start, end + 1));

    const pages = Number(parsed?.totalPages);
    const facts: AiBookFacts = {
      description: typeof parsed?.description === 'string' && parsed.description.trim() ? parsed.description.trim() : undefined,
      // Faixa sanitária: descarta valores absurdos que denunciam alucinação.
      totalPages: Number.isFinite(pages) && pages > 20 && pages < 5000 ? Math.round(pages) : undefined,
      genre: typeof parsed?.genre === 'string' && parsed.genre.trim() ? parsed.genre.trim() : undefined
    };
    // Tudo nulo quer dizer que o modelo OBEDECEU o prompt: ele não conhece o
    // livro. É um resultado legítimo, não uma falha — e precisa aparecer
    // diferente de "a chave não funcionou".
    return facts.description || facts.totalPages || facts.genre
      ? { facts, status: 'ok' }
      : { facts: null, status: 'unknown-book' };
  } catch (erro) {
    // `callGemini` já monta "IA 400: <resposta do Google>". Descartar isso era
    // transformar um diagnóstico pronto em "não deu certo".
    return { facts: null, status: 'error', detail: semChave(String((erro as Error)?.message || erro)) };
  }
}
