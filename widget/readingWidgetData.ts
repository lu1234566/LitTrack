import { Book } from '@/types/book';
import { progressFraction, progressLine, progressPercentOf } from '@/services/bookFormat';

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
  /** Se há total para medir (páginas, duração ou % do e-book). */
  hasTotal: boolean;
  /** "pág. 30 de 120 · 25%", "34% lido", "2h10 de 8h · 27%". */
  line: string;
};

/** O livro "lendo agora": o em andamento mexido por último. */
export function pickReadingWidgetData(books: Book[]): ReadingWidgetData {
  const lendo = books
    .filter((b) => b.status === 'reading')
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
  if (!lendo) return { book: null, currentPage: 0, totalPages: 0, percent: 0, hasTotal: false, line: '' };
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
    percent: progressPercentOf(lendo),
    hasTotal: progressFraction(lendo) !== null,
    line: progressLine(lendo)
  };
}
