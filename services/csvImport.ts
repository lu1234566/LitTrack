import { Book, BookStatus } from '@/types/book';

// Imports a Goodreads or StoryGraph CSV export into Readora books. No network —
// just parsing + field mapping. Recognizes both layouts from their headers.

/** RFC4180-ish parser: handles quoted fields, escaped "" quotes, and CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  // Drop fully-empty rows (e.g. trailing newline).
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

export type CsvSource = 'goodreads' | 'storygraph' | 'unknown';

export function detectSource(headers: string[]): CsvSource {
  const set = new Set(headers.map((h) => h.trim().toLowerCase()));
  if (set.has('exclusive shelf')) return 'goodreads';
  if (set.has('read status') || set.has('moods')) return 'storygraph';
  return 'unknown';
}

function clean(value?: string): string {
  // Goodreads wraps ISBNs as ="123" — strip that and surrounding quotes.
  return String(value ?? '').replace(/^="?|"?$/g, '').trim();
}

function goodreadsStatus(shelf: string): BookStatus {
  const s = shelf.trim().toLowerCase();
  if (s === 'read') return 'finished';
  if (s === 'currently-reading') return 'reading';
  return 'wishlist';
}

function storygraphStatus(status: string): BookStatus {
  const s = status.trim().toLowerCase();
  if (s === 'read') return 'finished';
  if (s === 'currently-reading' || s === 'currently reading') return 'reading';
  if (s === 'did-not-finish' || s === 'did not finish') return 'dnf';
  return 'wishlist';
}

function toTimestamp(value: string): number | undefined {
  const v = clean(value);
  if (!v) return undefined;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? undefined : t;
}

export type CsvImportResult = { source: CsvSource; books: Book[] };

/** Parses the CSV text into ready-to-store Books. Throws on unknown layouts. */
export function csvToBooks(text: string, now: number = Date.now()): CsvImportResult {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('CSV vazio ou sem linhas de dados.');
  const headers = rows[0].map((h) => h.trim());
  const source = detectSource(headers);
  if (source === 'unknown') throw new Error('CSV não reconhecido. Use a exportação do Goodreads ou do StoryGraph.');

  const idx = (name: string) => headers.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
  const col = (row: string[], name: string) => { const i = idx(name); return i >= 0 ? clean(row[i]) : ''; };

  const books: Book[] = [];
  rows.slice(1).forEach((row, n) => {
    const title = col(row, 'Title');
    if (!title) return;

    let book: Partial<Book>;
    if (source === 'goodreads') {
      const finishedAt = toTimestamp(col(row, 'Date Read'));
      book = {
        title,
        author: col(row, 'Author'),
        isbn: clean(col(row, 'ISBN13')) || clean(col(row, 'ISBN')),
        rating: Number(col(row, 'My Rating')) || 0,
        publisher: col(row, 'Publisher'),
        publishedDate: col(row, 'Year Published') || col(row, 'Original Publication Year'),
        totalPages: Number(col(row, 'Number of Pages')) || 0,
        status: goodreadsStatus(col(row, 'Exclusive Shelf')),
        review: col(row, 'My Review'),
        finishedAt
      };
    } else {
      const finishedAt = toTimestamp(col(row, 'Last Date Read'));
      const warnings = [col(row, 'Content Warnings'), col(row, 'Content Warning Description')].filter(Boolean).join(' — ');
      book = {
        title,
        author: col(row, 'Authors'),
        isbn: col(row, 'ISBN/UID'),
        rating: Number(col(row, 'Star Rating')) || 0,
        status: storygraphStatus(col(row, 'Read Status')),
        review: col(row, 'Review'),
        mood: col(row, 'Moods'),
        contentWarnings: warnings,
        finishedAt
      };
    }

    books.push({
      id: 'csv-' + now + '-' + n,
      genre: '',
      currentPage: book.status === 'finished' ? (book.totalPages || 0) : 0,
      createdAt: now,
      updatedAt: now,
      ...book
    } as Book);
  });

  return { source, books };
}

/** Merges imported books into the library, skipping duplicates (ISBN or title+author). */
export function mergeImported(existing: Book[], imported: Book[]): { merged: Book[]; added: number; skipped: number } {
  const norm = (v?: string) => String(v || '').trim().toLowerCase();
  const isbns = new Set(existing.map((b) => norm(b.isbn)).filter(Boolean));
  const titleAuthors = new Set(existing.map((b) => norm(b.title) + '|' + norm(b.author)));
  let added = 0;
  let skipped = 0;
  const fresh: Book[] = [];
  imported.forEach((book) => {
    const isbn = norm(book.isbn);
    const ta = norm(book.title) + '|' + norm(book.author);
    if ((isbn && isbns.has(isbn)) || titleAuthors.has(ta)) { skipped++; return; }
    if (isbn) isbns.add(isbn);
    titleAuthors.add(ta);
    fresh.push(book);
    added++;
  });
  return { merged: [...fresh, ...existing], added, skipped };
}
