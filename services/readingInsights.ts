import { Book } from '@/types/book';
import { Quote } from '@/types/quote';
import { Shelf } from '@/types/shelf';

export function topItems(items: string[], limit = 5) {
  const counts = items.filter(Boolean).reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, count]) => ({ label, count }));
}

export function buildReadingInsights(books: Book[], quotes: Quote[], shelves: Shelf[]) {
  const topAuthors = topItems(books.map((book) => book.author));
  const topGenres = topItems(books.map((book) => book.genre));
  const topQuoteTags = topItems(quotes.flatMap((quote) => quote.tags));
  const topMoods = topItems(books.map((book) => book.mood || ''));
  // Páginas a partir do próprio livro: total quando concluído, progresso atual
  // quando em andamento. Antes vinha das sessões de leitura, removidas.
  const totalPages = books.reduce((sum, book) => sum + (book.status === 'finished' ? (book.totalPages || 0) : (book.currentPage || 0)), 0);
  const finishedBooks = books.filter((book) => book.status === 'finished');
  const averagePagesPerBook = finishedBooks.length
    ? Math.round(finishedBooks.reduce((sum, book) => sum + (book.totalPages || 0), 0) / finishedBooks.length)
    : 0;
  const largestShelf = [...shelves].sort((a, b) => b.bookIds.length - a.bookIds.length)[0];
  const longestBook = [...books].sort((a, b) => (b.totalPages || 0) - (a.totalPages || 0))[0];
  const highestRated = [...books].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

  return {
    topAuthors,
    topGenres,
    topQuoteTags,
    topMoods,
    totalPages,
    averagePagesPerBook,
    largestShelf,
    longestBook,
    highestRated
  };
}
