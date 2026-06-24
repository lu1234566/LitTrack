import { Book } from '@/types/book';
import { Quote } from '@/types/quote';
import { ReadingSession } from '@/types/readingSession';
import { Shelf } from '@/types/shelf';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
};

function daysBetween(a: number, b: number) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.abs(Math.floor((startOfDay(a) - startOfDay(b)) / oneDay));
}

function startOfDay(value: number) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function calculateReadingStreak(sessions: ReadingSession[]) {
  if (!sessions.length) return 0;
  const uniqueDays = Array.from(new Set(sessions.map((session) => startOfDay(session.createdAt)))).sort((a, b) => b - a);
  let streak = 1;
  for (let index = 0; index < uniqueDays.length - 1; index += 1) {
    if (daysBetween(uniqueDays[index], uniqueDays[index + 1]) === 1) streak += 1;
    else break;
  }
  return streak;
}

export function buildAchievements(books: Book[], quotes: Quote[], shelves: Shelf[], sessions: ReadingSession[]): Achievement[] {
  const finishedBooks = books.filter((book) => book.status === 'finished').length;
  const pagesInSessions = sessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const minutes = sessions.reduce((sum, session) => sum + session.minutesRead, 0);
  const favoriteQuotes = quotes.filter((quote) => quote.favorite).length;
  const streak = calculateReadingStreak(sessions);

  return [
    make('first-book', 'Primeira leitura', 'Concluir o primeiro livro.', finishedBooks, 1),
    make('five-books', 'Estante viva', 'Concluir 5 livros.', finishedBooks, 5),
    make('ten-sessions', 'Ritual de leitura', 'Registrar 10 sessoes.', sessions.length, 10),
    make('hundred-pages', 'Cem paginas', 'Registrar 100 paginas em sessoes.', pagesInSessions, 100),
    make('thousand-pages', 'Mil paginas', 'Registrar 1000 paginas em sessoes.', pagesInSessions, 1000),
    make('five-quotes', 'Guardiao de trechos', 'Salvar 5 citacoes.', quotes.length, 5),
    make('favorite-quotes', 'Curador de frases', 'Favoritar 3 citacoes.', favoriteQuotes, 3),
    make('three-shelves', 'Bibliotecario', 'Criar 3 estantes.', shelves.length, 3),
    make('reading-streak', 'Sequencia leitora', 'Ler em 3 dias diferentes em sequencia.', streak, 3),
    make('focus-time', 'Foco profundo', 'Registrar 300 minutos de leitura.', minutes, 300)
  ];
}

function make(id: string, title: string, description: string, progress: number, target: number): Achievement {
  return { id, title, description, progress: Math.min(progress, target), target, unlocked: progress >= target };
}
