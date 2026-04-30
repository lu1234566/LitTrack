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

export const getMonthlyStats = (
  books: Book[],
  sessions: ReadingSession[],
  month: number, // 0-11
  year: number
): MonthlyStats => {
  const MONTHS_MAP = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const targetMonthName = MONTHS_MAP[month];
  const startDate = startOfMonth(new Date(year, month));
  const endDate = endOfMonth(new Date(year, month));
  const monthName = format(startDate, 'MMMM', { locale: ptBR });

  // Filter books finished in the month - matching Timeline.tsx logic
  const booksFinished = books.filter(book => {
    if (book.status !== 'lido') return false;
    
    // Primary: Match manual fields (This is the source of truth for the monthly list in Timeline)
    if (book.mesLeitura === targetMonthName && book.anoLeitura === year) {
      return true;
    }
    
    // Secondary: Match via timestamp if manual fields don't match but status is 'lido'
    if (book.finishedAt) {
      const finishDate = new Date(book.finishedAt);
      return isSameMonth(finishDate, startDate) && finishDate.getFullYear() === year;
    }
    
    return false;
  });

  // Filter sessions in the month
  const monthlySessions = sessions.filter(session => {
    const sessionDate = new Date(session.date);
    return isWithinInterval(sessionDate, { start: startDate, end: endDate });
  });

  // Pages from sessions
  const sessionPages = monthlySessions.reduce((acc, s) => acc + (s.pagesRead || 0), 0);
  const totalMinutes = monthlySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  // Fallback: Pages from books finished this month if no sessions exist for those books
  // (Simplified: if sessionPages is 0, we can use the sum of pages of finished books as a heuristic)
  let totalPages = sessionPages;
  if (sessionPages === 0 && booksFinished.length > 0) {
    totalPages = booksFinished.reduce((acc, b) => acc + safeParseNumber(b.pageCount), 0);
  }
  
  const totalRating = booksFinished.reduce((acc, b) => acc + (b.notaGeral || 0), 0);
  const averageRating = booksFinished.length > 0 ? totalRating / booksFinished.length : 0;

  // Top Genre
  const genresCount: Record<string, number> = {};
  booksFinished.forEach(b => {
    if (b.genero) genresCount[b.genero] = (genresCount[b.genero] || 0) + 1;
  });
  const topGenre = Object.entries(genresCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Diverso';

  // Top Author
  const authorsCount: Record<string, number> = {};
  booksFinished.forEach(b => {
    if (b.autor) authorsCount[b.autor] = (authorsCount[b.autor] || 0) + 1;
  });
  const topAuthor = Object.entries(authorsCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Vários';

  // Dominant Mood
  const moodsCount: Record<string, number> = {};
  monthlySessions.forEach(s => {
    if (s.mood) moodsCount[s.mood] = (moodsCount[s.mood] || 0) + 1;
  });
  const dominantMood = Object.entries(moodsCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sereno';

  // Achievements
  const achievements: string[] = [];
  if (totalPages >= 1000) achievements.push('Titã das Páginas (1000+ pgs)');
  if (booksFinished.length >= 5) achievements.push('Maratona Literária (5+ livros)');
  if (averageRating >= 4.5 && booksFinished.length >= 2) achievements.push('Mês de Ouro');
  if (totalMinutes >= 600) achievements.push('Foco Absoluto (10h leitura)');
  if (new Set(booksFinished.map(b => b.genero)).size >= 3) achievements.push('Explorador de Horizontes');

  // Literary Copy
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
    literaryCopy
  };
};

export interface InstagramCapsuleData {
  monthName: string;
  year: number;
  totalBooks: number;
  totalPages: number;
  averageRating: number;
  dominantMood: string;
  top5Books: Book[];
  bestBook: Book | null;
  literaryCopy: string;
  userName?: string;
  coverDataUrls?: Record<string, string>;
}

export const getInstagramCapsuleData = (
  stats: MonthlyStats,
  userName?: string
): InstagramCapsuleData => {
  // Sort books for Top 5:
  // 1. Higher rating
  // 2. Higher page count
  // 3. Alphabetical title
  const sortedBooks = [...stats.booksCompleted].sort((a, b) => {
    if ((b.notaGeral || 0) !== (a.notaGeral || 0)) {
      return (b.notaGeral || 0) - (a.notaGeral || 0);
    }
    const aPages = safeParseNumber(a.pageCount);
    const bPages = safeParseNumber(b.pageCount);
    if (bPages !== aPages) {
      return bPages - aPages;
    }
    return a.titulo.localeCompare(b.titulo);
  });

  const top5Books = sortedBooks.slice(0, 5);
  const bestBook = top5Books[0] || null;

  return {
    monthName: stats.monthName,
    year: stats.year,
    totalBooks: stats.totalBooks,
    totalPages: stats.totalPages,
    averageRating: stats.averageRating,
    dominantMood: stats.dominantMood,
    top5Books,
    bestBook,
    literaryCopy: stats.literaryCopy,
    userName
  };
};
