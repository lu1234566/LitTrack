import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Book, BookStatus, ReadingStats } from '@/types/book';
import { calculateProgress, loadBooks, saveBooks } from '@/services/bookStorage';

type BookInput = Omit<Book, 'id' | 'createdAt' | 'updatedAt'>;

interface BookContextValue {
  books: Book[];
  loading: boolean;
  stats: ReadingStats;
  addBook: (book: BookInput) => Promise<void>;
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
  addBook: async () => {},
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

  useEffect(() => {
    loadBooks().then(setBooks).finally(() => setLoading(false));
  }, []);

  async function persist(nextBooks: Book[]) {
    setBooks(nextBooks);
    await saveBooks(nextBooks);
  }

  async function replaceBooks(nextBooks: Book[]) {
    await persist(nextBooks);
  }

  async function reload() {
    setLoading(true);
    try {
      const next = await loadBooks();
      setBooks(next);
    } finally {
      setLoading(false);
    }
  }

  async function addBook(input: BookInput) {
    const now = Date.now();
    const nextBook: Book = { ...input, id: 'book-' + String(now), createdAt: now, updatedAt: now };
    await persist([nextBook, ...books]);
  }

  async function updateBook(bookId: string, patch: Partial<Book>) {
    const nextBooks = books.map((book) => book.id === bookId ? { ...book, ...patch, updatedAt: Date.now() } : book);
    await persist(nextBooks);
  }

  async function deleteBook(bookId: string) {
    await persist(books.filter((book) => book.id !== bookId));
  }

  async function updateProgress(bookId: string, currentPage: number) {
    const nextBooks = books.map((book) => {
      if (book.id !== bookId) return book;
      const totalPages = book.totalPages || 0;
      const nextCurrentPage = Math.max(0, Math.min(currentPage, totalPages || currentPage));
      return {
        ...book,
        currentPage: nextCurrentPage,
        status: totalPages > 0 && nextCurrentPage >= totalPages ? 'finished' : book.status,
        finishedAt: totalPages > 0 && nextCurrentPage >= totalPages ? Date.now() : book.finishedAt,
        updatedAt: Date.now()
      };
    });
    await persist(nextBooks);
  }

  async function updateStatus(bookId: string, status: BookStatus) {
    const nextBooks = books.map((book) => book.id === bookId ? { ...book, status, updatedAt: Date.now(), finishedAt: status === 'finished' ? Date.now() : book.finishedAt } : book);
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
