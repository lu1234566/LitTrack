import { Book } from '@/types/book';
import { ExternalBook } from '@/types/externalBook';
import { lookupExternalBooks } from '@/services/externalBookSearch';

const UNSET_GENRES = ['', 'a definir', 'diverso', 'indefinido'];

/** True when the book is missing data that hurts stats/capsule (pages, cover, genre). */
export function bookNeedsEnrichment(book: Book): boolean {
  const noPages = !book.totalPages || book.totalPages <= 0;
  const noCover = !book.coverUrl;
  const noGenre = !book.genre || UNSET_GENRES.includes(book.genre.trim().toLowerCase());
  return noPages || noCover || noGenre;
}

function bestMatch(results: ExternalBook[], book: Book): ExternalBook | undefined {
  const title = book.title.trim().toLowerCase();
  const author = book.author.trim().toLowerCase();
  const exact = results.find((r) => r.title.trim().toLowerCase() === title && (!author || r.author.trim().toLowerCase().includes(author.split(',')[0])));
  return exact || results.find((r) => r.title.trim().toLowerCase() === title) || results[0];
}

/**
 * Looks the book up by ISBN (preferred) or title+author and returns a patch with
 * ONLY the fields that were missing — never overwrites data the user already has.
 * Returns null when nothing useful is found (offline, no match, no new data).
 */
export async function enrichBookPatch(book: Book): Promise<Partial<Book> | null> {
  const query = book.isbn?.trim()
    ? 'isbn:' + book.isbn.trim().replace(/[^0-9Xx]/g, '')
    : [book.title, book.author].filter(Boolean).join(' ').trim();
  if (!query) return null;

  const results = await lookupExternalBooks(query);
  if (!results.length) return null;
  const match = bestMatch(results, book);
  if (!match) return null;

  const patch: Partial<Book> = {};
  if ((!book.totalPages || book.totalPages <= 0) && (match.totalPages || 0) > 0) patch.totalPages = match.totalPages;
  if (!book.coverUrl && match.coverUrl) patch.coverUrl = match.coverUrl;
  if ((!book.genre || UNSET_GENRES.includes(book.genre.trim().toLowerCase())) && match.genre && !UNSET_GENRES.includes(match.genre.trim().toLowerCase())) patch.genre = match.genre;
  if (!book.description && match.description) patch.description = match.description;
  if (!book.publisher && match.publisher) patch.publisher = match.publisher;
  if (!book.publishedDate && match.publishedDate) patch.publishedDate = match.publishedDate;
  if (!book.isbn && match.isbn) patch.isbn = match.isbn;

  return Object.keys(patch).length ? patch : null;
}

export type EnrichProgress = { done: number; total: number; updated: number; currentTitle: string };

/**
 * Enriches every book that needs it, sequentially (gentle on the API), applying
 * each patch through `applyPatch`. Reports progress so the UI can show a count.
 */
export async function enrichLibrary(
  books: Book[],
  applyPatch: (bookId: string, patch: Partial<Book>) => Promise<void>,
  onProgress?: (p: EnrichProgress) => void
): Promise<{ updated: number; checked: number }> {
  const targets = books.filter(bookNeedsEnrichment);
  let updated = 0;
  for (let i = 0; i < targets.length; i++) {
    const book = targets[i];
    onProgress?.({ done: i, total: targets.length, updated, currentTitle: book.title });
    try {
      const patch = await enrichBookPatch(book);
      if (patch) {
        await applyPatch(book.id, patch);
        updated += 1;
      }
    } catch {
      /* skip this book, keep going */
    }
  }
  onProgress?.({ done: targets.length, total: targets.length, updated, currentTitle: '' });
  return { updated, checked: targets.length };
}
