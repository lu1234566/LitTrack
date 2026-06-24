import { Book } from '@/types/book';
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
  const parsed = JSON.parse(raw) as Partial<ReadoraBackup>;
  if (!parsed || parsed.app !== 'Readora') throw new Error('Arquivo de backup invalido.');
  return {
    app: 'Readora',
    version: 1,
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    preferences: parsed.preferences,
    books: Array.isArray(parsed.books) ? parsed.books : [],
    quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
    shelves: Array.isArray(parsed.shelves) ? parsed.shelves : [],
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
  };
}
