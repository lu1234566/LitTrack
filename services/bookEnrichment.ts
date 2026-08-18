import { Book } from '@/types/book';
import { ExternalBook } from '@/types/externalBook';
import { lookupExternalBooks } from '@/services/externalBookSearch';
import { stripHtml } from '@/services/plainText';

const UNSET_GENRES = ['', 'a definir', 'diverso', 'indefinido'];

/** True when the book is missing data that hurts stats/capsule (pages, cover, genre). */
/** Nomes (em PT) dos dados que faltam neste livro — vazio quando está completo. */
export function missingFields(book: Book): string[] {
  const missing: string[] = [];
  if (!book.totalPages || book.totalPages <= 0) missing.push('páginas');
  if (!book.coverUrl) missing.push('capa');
  if (!book.genre || UNSET_GENRES.includes(book.genre.trim().toLowerCase())) missing.push('gênero');
  if (!book.description || !book.description.trim()) missing.push('sinopse');
  return missing;
}

export function bookNeedsEnrichment(book: Book): boolean {
  return missingFields(book).length > 0;
}

/** Rótulo em PT de cada campo que um patch preencheu. */
function filledLabels(patch: Partial<Book>): string[] {
  const labels: string[] = [];
  if (patch.totalPages) labels.push('páginas');
  if (patch.coverUrl) labels.push('capa');
  if (patch.genre) labels.push('gênero');
  if (patch.description) labels.push('sinopse');
  if (patch.publisher) labels.push('editora');
  if (patch.publishedDate) labels.push('ano');
  if (patch.isbn) labels.push('ISBN');
  return labels;
}

/** O candidato traz algo que este livro ainda não tem? */
function isUsefulFor(candidate: ExternalBook, book: Book): boolean {
  const needsPages = !book.totalPages || book.totalPages <= 0;
  const needsCover = !book.coverUrl;
  const needsGenre = !book.genre || UNSET_GENRES.includes(book.genre.trim().toLowerCase());
  return (
    (needsPages && (candidate.totalPages || 0) > 0) ||
    (needsCover && Boolean(candidate.coverUrl)) ||
    (needsGenre && Boolean(candidate.genre) && !UNSET_GENRES.includes(candidate.genre.trim().toLowerCase())) ||
    (!book.description && Boolean(candidate.description))
  );
}

/** Campos do resultado externo que o livro ainda não tem — nunca sobrescreve. */
function patchFrom(match: ExternalBook, book: Book): Partial<Book> {
  const patch: Partial<Book> = {};
  if ((!book.totalPages || book.totalPages <= 0) && (match.totalPages || 0) > 0) patch.totalPages = match.totalPages;
  if (!book.coverUrl && match.coverUrl) patch.coverUrl = match.coverUrl;
  if ((!book.genre || UNSET_GENRES.includes(book.genre.trim().toLowerCase())) && match.genre && !UNSET_GENRES.includes(match.genre.trim().toLowerCase())) patch.genre = match.genre;
  if (!book.description && match.description) patch.description = match.description;
  if (!book.publisher && match.publisher) patch.publisher = match.publisher;
  if (!book.publishedDate && match.publishedDate) patch.publishedDate = match.publishedDate;
  if (!book.isbn && match.isbn) patch.isbn = match.isbn;
  return patch;
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
  const isbn = (book.isbn || '').replace(/[^0-9Xx]/g, '');
  const titleQuery = [book.title, book.author].filter(Boolean).join(' ').trim();

  // Busca por ISBN primeiro (1:1, mais confiável). Se ela não vier ou não trouxer
  // o que falta, cai para título+autor — antes o código escolhia UMA das duas e
  // desistia, então um ISBN sem correspondência deixava o livro incompleto.
  let match: ExternalBook | undefined;
  if (isbn) {
    const byIsbn = await lookupExternalBooks('isbn:' + isbn);
    match = byIsbn[0];
  }
  if ((!match || !isUsefulFor(match, book)) && titleQuery) {
    const byTitle = await lookupExternalBooks(titleQuery);
    const titleMatch = bestMatch(byTitle, book);
    if (titleMatch && (!match || isUsefulFor(titleMatch, book))) match = titleMatch;
  }
  // Último recurso: quando os catálogos não têm (ou estão fora do ar / com cota
  // estourada), a IA do app preenche sinopse, gênero e páginas aproximadas.
  // Só entra no que continuar faltando — nunca sobrescreve catálogo.
  const afterCatalogs: Book = match ? { ...book, ...patchFrom(match, book) } : book;
  const gaps = missingFields(afterCatalogs);
  if (gaps.length) {
    // Import sob demanda: o aiClient puxa o Firebase, que não deve entrar na
    // árvore de módulos (nem no bundle inicial) de quem só quer os catálogos.
    const facts = await import('@/services/aiClient')
      .then((ai) => (ai.isAiConfigured ? ai.fetchBookFactsFromAi(book.title, book.author) : null))
      .catch(() => null);
    if (facts) {
      const aiPatch: Partial<Book> = {};
      if (gaps.includes('sinopse') && facts.description) aiPatch.description = stripHtml(facts.description);
      if (gaps.includes('páginas') && facts.totalPages) aiPatch.totalPages = facts.totalPages;
      if (gaps.includes('gênero') && facts.genre) aiPatch.genre = facts.genre;
      if (Object.keys(aiPatch).length) {
        return { ...(match ? patchFrom(match, book) : {}), ...aiPatch };
      }
    }
  }

  if (!match) return null;

  const patch = patchFrom(match, book);

  return Object.keys(patch).length ? patch : null;
}

export type EnrichProgress = { done: number; total: number; updated: number; currentTitle: string };

/**
 * Enriches every book that needs it, sequentially (gentle on the API), applying
 * each patch through `applyPatch`. Reports progress so the UI can show a count.
 */
export type EnrichedBookReport = { title: string; filled: string[]; stillMissing: string[] };

export async function enrichLibrary(
  books: Book[],
  applyPatch: (bookId: string, patch: Partial<Book>) => Promise<void>,
  onProgress?: (p: EnrichProgress) => void
): Promise<{ updated: number; checked: number; reports: EnrichedBookReport[] }> {
  const targets = books.filter(bookNeedsEnrichment);
  const reports: EnrichedBookReport[] = [];
  let updated = 0;
  for (let i = 0; i < targets.length; i++) {
    const book = targets[i];
    onProgress?.({ done: i, total: targets.length, updated, currentTitle: book.title });
    try {
      const patch = await enrichBookPatch(book);
      if (patch) {
        await applyPatch(book.id, patch);
        updated += 1;
        // O que ficou faltando DEPOIS do patch — é isso que explica um livro
        // continuar na contagem de incompletos mesmo tendo sido atualizado.
        reports.push({
          title: book.title,
          filled: filledLabels(patch),
          stillMissing: missingFields({ ...book, ...patch })
        });
      } else {
        reports.push({ title: book.title, filled: [], stillMissing: missingFields(book) });
      }
    } catch {
      reports.push({ title: book.title, filled: [], stillMissing: missingFields(book) });
    }
  }
  onProgress?.({ done: targets.length, total: targets.length, updated, currentTitle: '' });
  return { updated, checked: targets.length, reports };
}
