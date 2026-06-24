import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Book, BookStatus, ReadingStats } from '@/types/book';
import { calculateProgress, loadBooks, saveBooks } from '@/services/bookStorage';

type BookInput = Omit<Book, 'id' | 'createdAt' | 'updatedAt'>;

interface BookContextValue {
  books: Book[];
  loading: boolean;
  stats: ReadingStats;
  addBook: (book: BookInput) => Promise<void>;
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
  pagesRead: 0
};

const fallbackContext: BookContextValue = {
  books: [],
  loading: true,
  stats: emptyStats,
  addBook: async () => {},
  updateProgress: async () => {},
  updateStatus: async () => {},
  getBook: () => undefined
};

const BookContext = createContext<BookContextValue>(fallbackContext);

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

  async function addBook(input: BookInput) {
    const now = Date.now();
    const nextBook: Book = { ...input, id: 'book-' + String(now), createdAt: now, updatedAt: now };
    await persist([nextBook, ...books]);
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
        updatedAt: Date.now()
      };
    });
    await persist(nextBooks);
  }

  async function updateStatus(bookId: string, status: BookStatus) {
    const nextBooks = books.map((book) => book.id === bookId ? { ...book, status, updatedAt: Date.now() } : book);
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
    return { totalBooks, finishedBooks, readingBooks, wishlistBooks, averageRating, pagesRead };
  }, [books]);

  const value = useMemo(() => ({ books, loading, stats, addBook, updateProgress, updateStatus, getBook }), [books, loading, stats]);

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}

export function useBooks() {
  return useContext(BookContext);
}

export { calculateProgress };
