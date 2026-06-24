import { 
  startOfMonth, endOfMonth, subMonths, 
  startOfQuarter, endOfQuarter, 
  startOfYear, endOfYear,
  subDays, isWithinInterval, startOfDay,
  differenceInDays
} from 'date-fns';
import { Book, ReadingSession } from '../types';

/**
 * Utility functions for safe reading statistics calculations and formatting
 */

/**
 * Safely parses a value to a finite number.
 * Returns 0 if the value is invalid, null, undefined, or not a finite number.
 */
export const safeParseNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  
  const parsed = typeof value === 'number' ? value : Number(value);
  
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Formats a number of pages into a human-readable string.
 * Example: 1240 -> "1.240"
 */
export const formatPages = (pages: number): string => {
  const safePages = safeParseNumber(pages);
  return new Intl.NumberFormat('pt-BR').format(Math.floor(safePages));
};

/**
 * Formats pages with a suffix.
 * Example: 392 -> "392 pág."
 */
export const formatPagesShort = (pages: number): string => {
  return `${formatPages(pages)} pág.`;
};

/**
 * Formats pages per book.
 * Example: 280 -> "280 pág./livro"
 */
export const formatPagesPerBook = (pages: number): string => {
  return `${formatPages(pages)} pág./livro`;
};

/**
 * Formats pages with full suffix.
 * Example: 1240 -> "1.240 páginas"
 */
export const formatPagesLong = (pages: number): string => {
  const safePages = safeParseNumber(pages);
  const suffix = Math.floor(safePages) === 1 ? 'página' : 'páginas';
  return `${formatPages(pages)} ${suffix}`;
};

export interface PeriodStats {
  booksFinished: number;
  pagesRead: number;
  averageRating: number;
  sessionsCount: number;
  activeReadingDays: number;
}

export type StatsPeriod = 'this_month' | 'last_30_days' | 'this_quarter' | 'this_year';

export function getStatsRange(period: StatsPeriod): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case 'this_month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last_30_days':
      return { start: startOfDay(subDays(now, 29)), end: now };
    case 'this_quarter':
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case 'this_year':
      return { start: startOfYear(now), end: endOfYear(now) };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

export function calculatePeriodStats(
  books: Book[],
  sessions: ReadingSession[],
  start: Date,
  end: Date
): PeriodStats {
  const interval = { start, end };

  // Filter books finished in this period
  // We prefer finishedAt timestamp, but could use mapping of mesLeitura/anoLeitura if needed
  // For precise period filtering, timestamps are better.
  const finishedBooks = books.filter(b => {
    if (b.status !== 'lido') return false;
    // If finishedAt exists, use it. Otherwise, we can't reliably place it in a short period like "last 30 days"
    // without more data. For now, assume finishedAt is the truth if available.
    if (b.finishedAt) {
      return isWithinInterval(new Date(b.finishedAt), interval);
    }
    return false;
  });

  // Filter sessions in this period
  const periodSessions = sessions.filter(s => 
    isWithinInterval(new Date(s.date), interval)
  );

  const pagesRead = periodSessions.reduce((acc, s) => acc + safeParseNumber(s.pagesRead), 0);
  const totalRating = finishedBooks.reduce((acc, b) => acc + safeParseNumber(b.notaGeral), 0);
  const averageRating = finishedBooks.length > 0 ? totalRating / finishedBooks.length : 0;
  
  const activeReadingDays = new Set(
    periodSessions.map(s => startOfDay(new Date(s.date)).getTime())
  ).size;

  return {
    booksFinished: finishedBooks.length,
    pagesRead,
    averageRating,
    sessionsCount: periodSessions.length,
    activeReadingDays
  };
}

export function generateComparison(current: PeriodStats, previous: PeriodStats, unit: string = 'mês') {
  const bookDiff = current.booksFinished - previous.booksFinished;
  const pageDiff = current.pagesRead - previous.pagesRead;
  const pagePercent = previous.pagesRead > 0 
    ? ((current.pagesRead - previous.pagesRead) / previous.pagesRead) * 100 
    : 0;

  let bookMsg = '';
  if (bookDiff > 0) {
    bookMsg = `Você leu ${bookDiff} ${bookDiff === 1 ? 'livro' : 'livros'} a mais que no ${unit} passado.`;
  } else if (bookDiff < 0) {
    bookMsg = `Você leu ${Math.abs(bookDiff)} ${Math.abs(bookDiff) === 1 ? 'livro' : 'livros'} a menos que no ${unit} passado.`;
  } else {
    bookMsg = `Você leu a mesma quantidade de livros que no ${unit} passado.`;
  }

  let pageMsg = '';
  if (pagePercent > 0) {
    pageMsg = `Seu volume de leitura subiu ${Math.abs(pagePercent).toFixed(0)}% em relação ao ${unit} passado.`;
  } else if (pagePercent < 0) {
    pageMsg = `Seu volume de leitura caiu ${Math.abs(pagePercent).toFixed(0)}% em relação ao ${unit} passado.`;
  }

  return {
    bookMsg,
    pageMsg,
    isImprovement: pagePercent >= 0 && bookDiff >= 0
  };
}
