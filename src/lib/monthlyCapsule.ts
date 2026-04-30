import { Book, ReadingSession } from '../types';
import { format, isSameMonth, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeParseNumber } from './statsUtils';

export interface MonthlyStats {
  month: number;
  year: number;
  monthName: string;
  booksCompleted: Book[];
  totalBooks: number;
  totalPages: number;
  totalSessions: number;
  totalMinutes: number;
  averageRating: number;
  topGenre: string;
  topAuthor: string;
  dominantMood: string;
  achievements: string[];
  literaryCopy: string;
}

const MONTHS_MAP = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const normalizeMonthName = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const isBookCompletedInMonth = (book: Book, targetMonthName: string, year: number, monthStart: Date) => {
  if (book.status !== 'lido') return false;

  const normalizedBookMonth = normalizeMonthName(book.mesLeitura);
  const normalizedTargetMonth = normalizeMonthName(targetMonthName);
  const bookYear = safeParseNumber(book.anoLeitura as unknown as number);

  if (normalizedBookMonth === normalizedTargetMonth && bookYear === year) {
    return true;
  }

  if (book.finishedAt) {
    const finishDate = new Date(book.finishedAt);
    if (isSameMonth(finishDate, monthStart) && finishDate.getFullYear() === year) {
      return true;
    }
  }

  return false;
};

export const getMonthlyStats = (
  books: Book[],
  sessions: ReadingSession[],
  month: number,
  year: number
): MonthlyStats => {
  const targetMonthName = MONTHS_MAP[month];
  const startDate = startOfMonth(new Date(year, month));
  const endDate = endOfMonth(new Date(year, month));
  const monthName = format(startDate, 'MMMM', { locale: ptBR });

  const booksFinished = books
    .filter((book) => isBookCompletedInMonth(book, targetMonthName, year, startDate))
    .sort((a, b) => {
      const aTime = a.finishedAt || a.createdAt || a.dataCadastro || 0;
      const bTime = b.finishedAt || b.createdAt || b.dataCadastro || 0;
      return bTime - aTime;
    });

  const monthlySessions = sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    return isWithinInterval(sessionDate, { start: startDate, end: endDate });
  });

  const sessionPages = monthlySessions.reduce((acc, s) => acc + safeParseNumber(s.pagesRead), 0);
  const totalMinutes = monthlySessions.reduce((acc, s) => acc + safeParseNumber(s.durationMinutes), 0);
  const booksPages = booksFinished.reduce((acc, b) => acc + safeParseNumber(b.pageCount), 0);

  const totalPages = sessionPages > 0 ? sessionPages : booksPages;

  const ratedBooks = booksFinished.filter((b) => safeParseNumber(b.notaGeral) > 0);
  const totalRating = ratedBooks.reduce((acc, b) => acc + safeParseNumber(b.notaGeral), 0);
  const averageRating = ratedBooks.length > 0 ? totalRating / ratedBooks.length : 0;

  const genresCount: Record<string, number> = {};
  booksFinished.forEach((b) => {
    if (b.genero) genresCount[b.genero] = (genresCount[b.genero] || 0) + 1;
  });
  const topGenre = Object.entries(genresCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Diverso';

  const authorsCount: Record<string, number> = {};
  booksFinished.forEach((b) => {
    if (b.autor) authorsCount[b.autor] = (authorsCount[b.autor] || 0) + 1;
  });
  const topAuthor = Object.entries(authorsCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Vários';

  const moodsCount: Record<string, number> = {};
  monthlySessions.forEach((s) => {
    if (s.mood) moodsCount[s.mood] = (moodsCount[s.mood] || 0) + 1;
  });
  const dominantMood = Object.entries(moodsCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sereno';

  const achievements: string[] = [];
  if (totalPages >= 1000) achievements.push('Titã das Páginas');
  if (booksFinished.length >= 5) achievements.push('Maratona Literária');
  if (averageRating >= 4.5 && booksFinished.length >= 2) achievements.push('Mês de Ouro');
  if (totalMinutes >= 600) achievements.push('Foco Absoluto');
  if (new Set(booksFinished.map((b) => b.genero).filter(Boolean)).size >= 3) achievements.push('Explorador de Horizontes');

  let literaryCopy = '';
  if (booksFinished.length === 0) {
    literaryCopy = `${monthName} foi um período de pausa e reflexão silenciosa entre as páginas.`;
  } else if (averageRating >= 4) {
    literaryCopy = `Sua jornada em ${monthName} foi marcada por encontros sublimes e histórias que ecoaram profundamente.`;
  } else if (totalPages > 500) {
    literaryCopy = `Em ${monthName}, você mergulhou intensamente em novos mundos, percorrendo caminhos de papel e tinta.`;
  } else {
    literaryCopy = `Um mês de descobertas e novos começos literários. ${monthName} deixou sua marca em sua estante.`;
  }

  return {
    month,
    year,
    monthName,
    booksCompleted: booksFinished,
    totalBooks: booksFinished.length,
    totalPages,
    totalSessions: monthlySessions.length,
    totalMinutes,
    averageRating,
    topGenre,
    topAuthor,
    dominantMood,
    achievements,
    literaryCopy,
  };
};
