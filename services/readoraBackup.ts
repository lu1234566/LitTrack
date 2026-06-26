import { Book, BookStatus } from '@/types/book';
import { Quote } from '@/types/quote';
import { ReadingSession } from '@/types/readingSession';
import { ReaderPreferences } from '@/types/preferences';
import { Shelf } from '@/types/shelf';

export type ReadoraBackup = {
  app: 'Readora';
  version: 1;
  exportedAt: string;
  preferences?: ReaderPreferences;
  books: Book[];
  quotes: Quote[];
  shelves: Shelf[];
  sessions: ReadingSession[];
};

type LegacyReadoraBook = Record<string, unknown>;

type LegacyReadoraBackup = {
  user?: { name?: string; email?: string; exportDate?: string; stats?: { totalBooks?: number; totalPages?: number } };
  userGoal?: { booksGoal?: number; pagesGoal?: number; year?: number };
  books?: LegacyReadoraBook[];
  quotes?: unknown[];
  shelves?: unknown[];
  sessions?: unknown[];
};

export function createReadoraBackup(input: Omit<ReadoraBackup, 'app' | 'version' | 'exportedAt'>): ReadoraBackup {
  return {
    app: 'Readora',
    version: 1,
    exportedAt: new Date().toISOString(),
    ...input
  };
}

export function stringifyBackup(backup: ReadoraBackup) {
  return JSON.stringify(backup, null, 2);
}

export function parseReadoraBackup(raw: string): ReadoraBackup {
  const parsed = JSON.parse(raw) as Partial<ReadoraBackup> & LegacyReadoraBackup;
  if (!parsed || typeof parsed !== 'object') throw new Error('Arquivo de backup invalido.');

  if (parsed.app === 'Readora') {
    return {
      app: 'Readora',
      version: 1,
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      preferences: parsed.preferences,
      books: Array.isArray(parsed.books) ? parsed.books : [],
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes as Quote[] : [],
      shelves: Array.isArray(parsed.shelves) ? parsed.shelves as Shelf[] : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions as ReadingSession[] : []
    };
  }

  if (Array.isArray(parsed.books) && parsed.books.some((book) => 'titulo' in book || 'autor' in book || 'notaGeral' in book)) {
    return parseLegacyReadoraBackup(parsed);
  }

  if (Array.isArray(parsed.books)) {
    return {
      app: 'Readora',
      version: 1,
      exportedAt: new Date().toISOString(),
      books: parsed.books as Book[],
      quotes: [],
      shelves: [],
      sessions: []
    };
  }

  throw new Error('Arquivo de backup invalido ou formato nao reconhecido.');
}

function parseLegacyReadoraBackup(parsed: LegacyReadoraBackup): ReadoraBackup {
  const books = (parsed.books || []).map(normalizeLegacyBook).filter(Boolean) as Book[];

  const prefs: Partial<ReaderPreferences> = {};
  if (parsed.user?.name) prefs.readerName = parsed.user.name;
  if (parsed.userGoal?.booksGoal !== undefined) prefs.yearlyGoal = numberValue(parsed.userGoal.booksGoal);
  if (parsed.userGoal?.pagesGoal !== undefined) prefs.dailyPageGoal = numberValue(parsed.userGoal.pagesGoal);
  const preferences = Object.keys(prefs).length ? (prefs as ReaderPreferences) : undefined;

  const quotes: Quote[] = books
    .filter((book) => stringValue(book.favoriteQuote))
    .map((book) => ({
      id: 'legacy-quote-' + book.id,
      bookId: book.id,
      bookTitle: book.title,
      author: book.author,
      text: stringValue(book.favoriteQuote),
      tags: [],
      favorite: true,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt
    }));

  return {
    app: 'Readora',
    version: 1,
    exportedAt: parsed.user?.exportDate || new Date().toISOString(),
    preferences,
    books,
    quotes,
    shelves: [],
    sessions: []
  };
}

const MONTHS_PT: Record<string, number> = {
  janeiro: 0, fevereiro: 1, 'março': 2, marco: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
};

function readingMonthDate(input: LegacyReadoraBook): number | null {
  const year = numberValue(input.anoLeitura);
  const month = MONTHS_PT[stringValue(input.mesLeitura).toLowerCase()];
  if (!year || month === undefined) return null;
  return new Date(year, month, 15).getTime();
}

function normalizeLegacyBook(input: LegacyReadoraBook): Book | null {
  const title = stringValue(input.titulo || input.title || input.nome);
  const author = stringValue(input.autor || input.author);
  if (!title || !author) return null;
  // Anchor the book to its reading month (anoLeitura/mesLeitura) so the
  // Monthly Capsule, Timeline and Retrospective group it correctly. Fall back
  // to registration timestamps when the reading month is absent.
  const reading = readingMonthDate(input);
  const createdAt = reading ?? dateValue(input.dataCadastro || input.addedAt || input.createdAt || Date.now());
  const updatedAt = reading ?? dateValue(input.finishedAt || input.startedAt || input.dataCadastro || input.createdAt || createdAt);
  const reviewParts = [
    stringValue(input.resenha || input.review),
    stringValue(input.pontosFortes) ? 'Pontos fortes: ' + stringValue(input.pontosFortes) : '',
    stringValue(input.pontosFracos) ? 'Pontos fracos: ' + stringValue(input.pontosFracos) : '',
    detailedRatings(input.notasDetalhadas)
  ].filter(Boolean);
  const moods = Array.isArray(input.moods) ? input.moods.map(String).filter(Boolean) : [];

  return {
    id: stringValue(input.id) || 'legacy-' + createdAt + '-' + slug(title),
    title,
    author,
    genre: stringValue(input.genero || input.genre) || 'A definir',
    status: normalizeStatus(stringValue(input.status)),
    rating: legacyRating(input),
    totalPages: numberValue(input.totalPages) || numberValue(input.pageCount),
    currentPage: numberValue(input.currentPage),
    review: reviewParts.join('\n\n'),
    favoriteQuote: stringValue(input.citacaoFavorita || input.favoriteQuote),
    publisher: stringValue(input.publisher),
    publishedDate: stringValue(input.publishedDate),
    isbn: stringValue(input.isbn),
    coverUrl: stringValue(input.coverUrl),
    priority: normalizePriority(stringValue(input.priority)),
    reasonToRead: stringValue(input.reasonToRead || input.description || input.discoveredFrom),
    mood: moods.join(', '),
    notes: legacyNotes(input),
    startedAt: dateValue(input.startedAt),
    finishedAt: dateValue(input.finishedAt),
    createdAt,
    updatedAt
  };
}

function legacyRating(input: LegacyReadoraBook): number {
  // Legacy backups score on a 0-10 scale (notaGeral); the app uses 0-5.
  if (input.notaGeral !== undefined && input.notaGeral !== null && input.notaGeral !== '') {
    return clampRating(numberValue(input.notaGeral) / 2);
  }
  // Other formats already use a 0-5 `rating`.
  return clampRating(numberValue(input.rating));
}

function clampRating(value: number): number {
  const rounded = Math.round(value * 10) / 10;
  return Math.max(0, Math.min(5, rounded));
}

function normalizeStatus(value: string): BookStatus {
  const normalized = value.toLowerCase();
  if (normalized.includes('lido') || normalized.includes('finished') || normalized.includes('read')) return 'finished';
  if (normalized.includes('quero') || normalized.includes('wishlist') || normalized.includes('fila')) return 'wishlist';
  return 'reading';
}

function normalizePriority(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === 'high' || normalized === 'alta') return 'alta';
  if (normalized === 'low' || normalized === 'baixa') return 'baixa';
  return 'media';
}

function legacyNotes(input: LegacyReadoraBook) {
  const notes = [
    stringValue(input.coverSource) ? 'Fonte da capa: ' + stringValue(input.coverSource) : '',
    stringValue(input.discoveredFrom) ? 'Descoberto em: ' + stringValue(input.discoveredFrom) : '',
    numberValue(input.progressPercentage) ? 'Progresso antigo: ' + numberValue(input.progressPercentage) + '%' : '',
    input.favorito === true ? 'Favorito no Readora antigo' : '',
    stringValue(input.userId) ? 'Legacy userId: ' + stringValue(input.userId) : ''
  ].filter(Boolean);
  return notes.join('\n');
}

function detailedRatings(value: unknown) {
  if (!value || typeof value !== 'object') return '';
  const entries = Object.entries(value as Record<string, unknown>).filter(([, score]) => Number(score) > 0);
  if (!entries.length) return '';
  return 'Notas detalhadas: ' + entries.map(([key, score]) => key + ' ' + score + '/10').join(', ');
}

function stringValue(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function numberValue(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function dateValue(value: unknown) {
  if (!value) return Date.now();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : Date.now();
  }
  if (typeof value === 'object') {
    const maybeTimestamp = value as { seconds?: number; nanoseconds?: number };
    if (typeof maybeTimestamp.seconds === 'number') return maybeTimestamp.seconds * 1000 + Math.floor((maybeTimestamp.nanoseconds || 0) / 1000000);
  }
  return Date.now();
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'book';
}
