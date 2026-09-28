import { Book } from '@/types/book';

/**
 * O que o widget mostra, tirado da mesma lista de livros do app.
 *
 * O widget roda fora do app (o Android o atualiza com o app fechado), então
 * lê os livros direto do armazenamento — daí esta função ser pura e separada.
 */
export type ReadingWidgetData = {
  book: { id: string; title: string; author: string; coverUrl: string } | null;
  currentPage: number;
  totalPages: number;
  percent: number;
};

/** O livro "lendo agora": o em andamento mexido por último. */
export function pickReadingWidgetData(books: Book[]): ReadingWidgetData {
  const lendo = books
    .filter((b) => b.status === 'reading')
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
  if (!lendo) return { book: null, currentPage: 0, totalPages: 0, percent: 0 };
  const total = lendo.totalPages || 0;
  const atual = Math.min(lendo.currentPage || 0, total || Infinity);
  return {
    book: {
      id: lendo.id,
      title: lendo.title,
      author: lendo.author,
      // O widget só desenha https e imagem embutida; http sobe para https.
      coverUrl: /^(https?:|data:image)/i.test(lendo.coverUrl || '') ? (lendo.coverUrl || '').replace(/^http:\/\//i, 'https://') : ''
    },
    currentPage: atual,
    totalPages: total,
    percent: total > 0 ? Math.round((atual / total) * 100) : 0
  };
}
