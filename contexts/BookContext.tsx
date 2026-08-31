import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Book, BookStatus, ReadingStats } from '@/types/book';
import { calculateProgress, loadBooks, saveBooks } from '@/services/bookStorage';
import { looksLikeHtml, stripHtml } from '@/services/plainText';

/**
 * Livros salvos antes da limpeza de HTML guardam a marcação crua do Google
 * Books (`<p>`, `<b>`, `&quot;`) nos campos de texto livre. Normaliza uma única
 * vez, na carga.
 *
 * São três campos, não só a sinopse: a importação copia a `description` para
 * `reasonToRead` (é esse que aparece no cartão da lista), e a `review` pode ter
 * vindo de um backup antigo pelo mesmo caminho.
 *
 * `updatedAt` fica intacto de propósito: isto é correção de formatação/dados,
 * não edição do usuário, e não deve ganhar a disputa contra uma alteração real
 * feita no outro aparelho.
 */
const TEXT_FIELDS = ['description', 'reasonToRead', 'review'] as const;

/**
 * Capas salvas antes da normalização guardam `http://`. O Android bloqueia HTTP
 * puro em build de produção, então a imagem falhava em silêncio e sobrava uma
 * caixa preta no lugar do livro.
 */
function needsHttps(url: string | undefined) {
  return Boolean(url && /^http:\/\//i.test(url));
}

function normalizedIsbn(isbn: string | undefined) {
  const clean = String(isbn || '').replace(/[^0-9Xx]/g, '').toUpperCase();
  return clean.length === 10 || clean.length === 13 ? clean : '';
}

/**
 * O ImagePicker grava a imagem escolhida primeiro no cache privado do Android.
 * Backups antigos acabaram persistindo esse caminho `file://.../cache/...` como
 * se fosse uma URL permanente. Depois de limpar cache, reinstalar ou migrar a
 * base, o arquivo deixa de existir. Quando há ISBN podemos trocar esse caminho
 * descartável por uma capa remota estável sem perder a capa do livro.
 */
function repairedCover(book: Book) {
  const url = book.coverUrl;
  if (!url) return url;
  if (needsHttps(url)) return url.replace(/^http:\/\//i, 'https://');

  const staleImagePickerCache = /^file:\/\/\/data\/user\/0\/[^/]+\/cache\/ImagePicker\//i.test(url);
  if (!staleImagePickerCache) return url;

  const isbn = normalizedIsbn(book.isbn);
  return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : url;
}

/**
 * Algumas importações antigas copiaram a categoria do catálogo/NYT para o
 * campo de "vibe". O caso mais visível é `nyt:combined-print...`, mas a mesma
 * contaminação aparece como `Fiction / Medical`, `Husbands`, etc. Nessas
 * entradas o `mood` é literalmente igual ao `genre`, portanto é seguro limpar
 * somente esse metadado importado e preservar vibes realmente escolhidas pelo
 * usuário (ex.: "Mágico, Sombrio").
 */
function hasCatalogMoodNoise(book: Book) {
  const mood = String(book.mood || '').trim();
  if (!mood) return false;
  if (/^nyt:/i.test(mood) || /^series:/i.test(mood) || /^a definir$/i.test(mood)) return true;
  const genre = String(book.genre || '').trim();
  return Boolean(genre && mood.localeCompare(genre, undefined, { sensitivity: 'accent' }) === 0);
}

function withCleanText(books: Book[]) {
  return books.map((book) => {
    const dirty = TEXT_FIELDS.filter((field) => looksLikeHtml(book[field]));
    const nextCover = repairedCover(book);
    const fixCover = nextCover !== book.coverUrl;
    const fixMood = hasCatalogMoodNoise(book);
    if (!dirty.length && !fixCover && !fixMood) return book;

    const patch: Partial<Book> = {};
    dirty.forEach((field) => { patch[field] = stripHtml(book[field]); });
    if (fixCover) patch.coverUrl = nextCover;
    if (fixMood) patch.mood = '';
    return { ...book, ...patch };
  });
}

type BookInput = Omit<Book, 'id' | 'createdAt' | 'updatedAt'>;

interface BookContextValue {
  books: Book[];
  loading: boolean;
  stats: ReadingStats;
  addBook: (book: BookInput) => Promise<Book>;
  updateBook: (bookId: string, patch: Partial<Book>) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  replaceBooks: (nextBooks: Book[]) => Promise<void>;
  reload: () => Promise<void>;
  updateProgress: (bookId: string, currentPage: number) => Promise<void>;
  updateStatus: (bookId: string, status: BookStatus) => Promise<void>;
  getBook: (bookId: string) => Book | undefined;
}

const emptyStats: ReadingStats = {
  totalBooks: 0,
  finishedBooks: 0,
  readingBooks: 0,
  wishlistBooks: 0,
  averageRating: 0,
  pagesRead: 0,
  completionRate: 0,
  favoriteGenre: 'A definir',
  currentProgress: 0
};

const fallbackContext: BookContextValue = {
  books: [],
  loading: true,
  stats: emptyStats,
  addBook: async () => ({} as Book),
  updateBook: async () => {},
  deleteBook: async () => {},
  replaceBooks: async () => {},
  reload: async () => {},
  updateProgress: async () => {},
  updateStatus: async () => {},
  getBook: () => undefined
};

const BookContext = createContext<BookContextValue>(fallbackContext);

function favoriteGenreFrom(books: Book[]) {
  const counts = books.reduce<Record<string, number>>((acc, book) => {
    acc[book.genre] = (acc[book.genre] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || 'A definir';
}

export function BookProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  // Fonte da verdade SEMPRE atual para os mutadores. Callbacks assíncronos
  // (ex.: o enriquecimento em segundo plano após salvar um livro) guardam a
  // função do render em que nasceram; se ela lesse `books` da closure, um
  // updateBook tardio regravaria uma lista antiga — apagando livros criados
  // nesse meio-tempo. Foi exatamente o bug do "salvei e o livro sumiu".
  const booksRef = useRef<Book[]>([]);

  useEffect(() => {
    loadBooks().then(async (loaded) => {
      const cleaned = withCleanText(loaded);
      booksRef.current = cleaned;
      setBooks(cleaned);
      // Só regrava se algo realmente mudou — o mapa devolve o mesmo objeto
      // quando os dados já estão limpos.
      if (cleaned.some((book, index) => book !== loaded[index])) await saveBooks(cleaned);
    }).finally(() => setLoading(false));
  }, []);

  async function persist(nextBooks: Book[]) {
    booksRef.current = nextBooks;
    setBooks(nextBooks);
    await saveBooks(nextBooks);
  }

  async function replaceBooks(nextBooks: Book[]) {
    // Caminho da sincronização: a nuvem pode trazer HTML, URL de cache antiga
    // ou metadado de catálogo salvo por um aparelho que não recebeu a correção.
    await persist(withCleanText(nextBooks));
  }

  async function reload() {
    setLoading(true);
    try {
      const next = withCleanText(await loadBooks());
      booksRef.current = next;
      setBooks(next);
      await saveBooks(next);
    } finally {
      setLoading(false);
    }
  }

  async function addBook(input: BookInput) {
    const now = Date.now();
    const nextBook: Book = { ...input, id: 'book-' + String(now), createdAt: now, updatedAt: now };
    await persist([nextBook, ...booksRef.current]);
    return nextBook;
  }

  async function updateBook(bookId: string, patch: Partial<Book>) {
    const nextBooks = booksRef.current.map((book) => book.id === bookId ? { ...book, ...patch, updatedAt: Date.now() } : book);
    await persist(nextBooks);
  }

  async function deleteBook(bookId: string) {
    await persist(booksRef.current.filter((book) => book.id !== bookId));
  }

  async function updateProgress(bookId: string, currentPage: number) {
    const nextBooks = booksRef.current.map((book) => {
      if (book.id !== bookId) return book;
      const totalPages = book.totalPages || 0;
      const nextCurrentPage = Math.max(0, Math.min(currentPage, totalPages || currentPage));
      return {
        ...book,
        currentPage: nextCurrentPage,
        status: totalPages > 0 && nextCurrentPage >= totalPages ? 'finished' : book.status,
        // Só carimba a conclusão se ainda não houver data — assim o mês de
        // leitura escolhido à mão não é sobrescrito por "hoje".
        finishedAt: totalPages > 0 && nextCurrentPage >= totalPages ? (book.finishedAt || Date.now()) : book.finishedAt,
        updatedAt: Date.now()
      };
    });
    await persist(nextBooks);
  }

  async function updateStatus(bookId: string, status: BookStatus) {
    // Idem: preserva o mês de leitura já definido pelo usuário.
    const nextBooks = booksRef.current.map((book) => book.id === bookId ? { ...book, status, updatedAt: Date.now(), finishedAt: status === 'finished' ? (book.finishedAt || Date.now()) : book.finishedAt } : book);
    await persist(nextBooks);
  }

  function getBook(bookId: string) {
    return books.find((book) => book.id === bookId);
  }

  const stats = useMemo<ReadingStats>(() => {
    const totalBooks = books.length;
    const finishedBooks = books.filter((book) => book.status === 'finished').length;
    const readingBooks = books.filter((book) => book.status === 'reading').length;
    const wishlistBooks = books.filter((book) => book.status === 'wishlist').length;
    const ratedBooks = books.filter((book) => book.rating && book.rating > 0);
    const averageRating = ratedBooks.length ? Number((ratedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / ratedBooks.length).toFixed(1)) : 0;
    const pagesRead = books.reduce((sum, book) => sum + (book.status === 'finished' ? book.totalPages || 0 : book.currentPage || 0), 0);
    const completionRate = totalBooks ? Math.round((finishedBooks / totalBooks) * 100) : 0;
    const currentReading = books.filter((book) => book.status === 'reading');
    const currentProgress = currentReading.length ? Math.round(currentReading.reduce((sum, book) => sum + calculateProgress(book), 0) / currentReading.length) : 0;
    return { totalBooks, finishedBooks, readingBooks, wishlistBooks, averageRating, pagesRead, completionRate, favoriteGenre: favoriteGenreFrom(books), currentProgress };
  }, [books]);

  const value = useMemo(() => ({ books, loading, stats, addBook, updateBook, deleteBook, replaceBooks, reload, updateProgress, updateStatus, getBook }), [books, loading, stats]);

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}

export function useBooks() {
  return useContext(BookContext);
}

export { calculateProgress };
