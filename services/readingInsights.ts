import { Book } from '@/types/book';
import { Quote } from '@/types/quote';
import { ReadingSession } from '@/types/readingSession';
import { Shelf } from '@/types/shelf';

export function topItems(items: string[], limit = 5) {
  const counts = items.filter(Boolean).reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, count]) => ({ label, count }));
}

export function buildReadingInsights(books: Book[], quotes: Quote[], shelves: Shelf[], sessions: ReadingSession[]) {
  const topAuthors = topItems(books.map((book) => book.author));
  const topGenres = topItems(books.map((book) => book.genre));
  const topQuoteTags = topItems(quotes.flatMap((quote) => quote.tags));
  const topMoods = topItems(sessions.map((session) => session.mood || ''));
  const totalPages = sessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const totalMinutes = sessions.reduce((sum, session) => sum + session.minutesRead, 0);
  const averagePagesPerSession = sessions.length ? Math.round(totalPages / sessions.length) : 0;
  const averageMinutesPerSession = sessions.length ? Math.round(totalMinutes / sessions.length) : 0;
  const largestShelf = [...shelves].sort((a, b) => b.bookIds.length - a.bookIds.length)[0];
  const longestBook = [...books].sort((a, b) => (b.totalPages || 0) - (a.totalPages || 0))[0];
  const highestRated = [...books].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

  return {
    topAuthors,
    topGenres,
    topQuoteTags,
    topMoods,
    totalPages,
    totalMinutes,
    averagePagesPerSession,
    averageMinutesPerSession,
    largestShelf,
    longestBook,
    highestRated
  };
}
