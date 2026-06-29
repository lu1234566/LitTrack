import { Book } from '@/types/book';

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
const MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash';

export const isAiConfigured = Boolean(PROXY_URL || API_KEY);

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiContent = { role: 'user' | 'model'; parts: Part[] };
export type ChatTurn = { role: 'user' | 'assistant'; content: string };

type GeminiBody = {
  contents: GeminiContent[];
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: { maxOutputTokens?: number };
};

async function callGemini(body: GeminiBody): Promise<string> {
  if (!isAiConfigured) throw new Error('IA não configurada.');
  const url = PROXY_URL
    ? PROXY_URL
    : 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + API_KEY;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error('IA ' + res.status + (detail ? ': ' + detail.slice(0, 180) : ''));
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
    generationConfig: { maxOutputTokens: 1024 }
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
  return callGemini({ contents, systemInstruction: { parts: [{ text: system }] }, generationConfig: { maxOutputTokens: 1024 } });
}
