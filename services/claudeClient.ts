import { Book } from '@/types/book';

// Minimal client for Anthropic's Messages API. We call the REST endpoint with
// fetch (no SDK) because this runs inside a React Native client: it avoids a new
// dependency and the SDK's browser-environment gating, and needs no native
// rebuild. The API key and model come from EAS env vars (EXPO_PUBLIC_*), never
// from git. Default model follows the Claude API guidance: claude-opus-4-8.

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const MODEL = process.env.EXPO_PUBLIC_ANTHROPIC_MODEL || 'claude-opus-4-8';

export const isClaudeConfigured = Boolean(API_KEY);

type TextBlock = { type: 'text'; text: string };
type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };
type ContentBlock = TextBlock | ImageBlock;
export type ChatTurn = { role: 'user' | 'assistant'; content: string };

async function callClaude(messages: Array<{ role: 'user' | 'assistant'; content: ContentBlock[] | string }>, opts?: { system?: string; maxTokens?: number }): Promise<string> {
  if (!API_KEY) throw new Error('Claude API não configurada.');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts?.maxTokens || 1024,
      ...(opts?.system ? { system: opts.system } : {}),
      messages
    })
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error('Claude API ' + res.status + (detail ? ': ' + detail.slice(0, 180) : ''));
  }
  const data = await res.json();
  const text = (data?.content || []).filter((b: any) => b?.type === 'text').map((b: any) => b.text).join('').trim();
  if (!text) throw new Error('Resposta vazia da Claude API.');
  return text;
}

/** OCR: extracts the quote/passage text from a photo of a physical page. */
export async function extractQuoteFromImage(base64: string, mediaType = 'image/jpeg'): Promise<string> {
  const prompt = 'Esta é a foto da página de um livro. Transcreva fielmente apenas o trecho/citação principal em destaque (ou todo o texto legível, se não houver destaque). Responda só com o texto transcrito, sem aspas, sem comentários, sem tradução.';
  return callClaude([
    { role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
      { type: 'text', text: prompt }
    ] }
  ], { maxTokens: 1024 });
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
  const messages = [
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: 'user' as const, content: question }
  ];
  return callClaude(messages, { system, maxTokens: 1024 });
}
