import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, setDoc } from 'firebase/firestore';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';
import { Book, FeedItemType } from '../types';
import { safeParseNumber } from '../lib/statsUtils';

interface BooksContextType {
  books: Book[];
  loading: boolean;
  addBook: (book: Omit<Book, 'id' | 'userId' | 'dataCadastro'>) => Promise<void>;
  updateBook: (id: string, book: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  deleteMultipleBooks: (ids: string[]) => Promise<void>;
  getBook: (id: string) => Book | undefined;
  updateUserStats: (userId: string) => Promise<void>;
}

const BooksContext = createContext<BooksContextType | undefined>(undefined);

export const BooksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !db) {
      setBooks([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'books'), where('userId', '==', user.userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData: Book[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        booksData.push({
          ...data,
          id: doc.id,
          pageCount: safeParseNumber(data.pageCount),
          dataCadastro: data.createdAt?.toMillis() || Date.now(),
        } as Book);
      });
      booksData.sort((a, b) => b.dataCadastro - a.dataCadastro);
      setBooks(booksData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'books');
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const updateUserStats = useCallback(async (userId: string) => {
    if (!db) return;
    try {
      const q = query(collection(db, 'books'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      let booksRead = 0;
      let pagesRead = 0;
      let totalRating = 0;
      let ratedBooks = 0;
      const genres: Record<string, number> = {};
      let lastReadDate: number | undefined = undefined;

      snapshot.forEach((doc) => {
        const data = doc.data() as Book;
        if (data.status === 'lido') {
          booksRead++;
          const pages = safeParseNumber(data.pageCount);
          if (pages > 0) pagesRead += pages;
          if (data.notaGeral && data.notaGeral > 0) {
            totalRating += data.notaGeral;
            ratedBooks++;
          }
          if (data.genero) {
            genres[data.genero] = (genres[data.genero] || 0) + 1;
          }
          
          const readDate = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
          if (!lastReadDate || readDate > lastReadDate) {
            lastReadDate = readDate;
          }
        }
      });

      const averageRating = ratedBooks > 0 ? Number((totalRating / ratedBooks).toFixed(1)) : 0;
      
      let favoriteGenre = '';
      let maxGenreCount = 0;
      for (const [genre, count] of Object.entries(genres)) {
        if (count > maxGenreCount) {
          maxGenreCount = count;
          favoriteGenre = genre;
        }
      }

      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        booksRead,
        pagesRead,
        averageRating,
        favoriteGenre,
        lastReadDate,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/stats`);
    }
  }, []);

  const createFeedItem = useCallback(async (type: FeedItemType, content: string, relatedBookId?: string, metadata?: any) => {
    if (!db || !user) return;
    try {
      await addDoc(collection(db, 'communityFeed'), {
        userId: user.userId,
        userDisplayName: user.name,
        userPhotoURL: user.profilePhoto,
        type,
        content,
        relatedBookId,
        metadata,
        createdAt: Date.now(),
        likesCount: 0,
        commentsCount: 0
      });
    } catch (error) {
      console.error("Error creating feed item: ", error);
    }
  }, [user]);

  const addBook = useCallback(async (bookData: Omit<Book, 'id' | 'userId' | 'dataCadastro'>) => {
    if (!user || !db) return;
    const normalizedData = {
      ...bookData,
      pageCount: safeParseNumber(bookData.pageCount)
    };
    const docRef = await addDoc(collection(db, 'books'), {
      ...normalizedData,
      userId: user.userId,
      createdAt: serverTimestamp(),
    });
    
    await updateUserStats(user.userId);
    
    if (normalizedData.status === 'lido') {
      await createFeedItem('finished_book', `terminou de ler ${normalizedData.titulo}`, docRef.id, { bookTitle: normalizedData.titulo, coverUrl: normalizedData.coverUrl, rating: normalizedData.notaGeral });
    } else {
      await createFeedItem('added_book', `adicionou ${normalizedData.titulo} à sua lista`, docRef.id, { bookTitle: normalizedData.titulo, coverUrl: normalizedData.coverUrl });
    }
  }, [user, updateUserStats, createFeedItem]);

  const updateBook = useCallback(async (id: string, bookData: Partial<Book>) => {
    if (!user || !db) return;
    const bookRef = doc(db, 'books', id);
    const oldBook = books.find(b => b.id === id);
    
    const normalizedData = { ...bookData };
    if ('pageCount' in normalizedData) {
      normalizedData.pageCount = safeParseNumber(normalizedData.pageCount);
    }

    await updateDoc(bookRef, normalizedData);
    await updateUserStats(user.userId);
    
    if (oldBook) {
      if (oldBook.status !== 'lido' && normalizedData.status === 'lido') {
        await createFeedItem('finished_book', `terminou de ler ${normalizedData.titulo || oldBook.titulo}`, id, { bookTitle: normalizedData.titulo || oldBook.titulo, coverUrl: normalizedData.coverUrl || oldBook.coverUrl, rating: normalizedData.notaGeral || oldBook.notaGeral });
      } else if ((!oldBook.notaGeral || oldBook.notaGeral === 0) && normalizedData.notaGeral && normalizedData.notaGeral > 0) {
        await createFeedItem('rated_book', `avaliou ${normalizedData.titulo || oldBook.titulo} com ${normalizedData.notaGeral} estrelas`, id, { bookTitle: normalizedData.titulo || oldBook.titulo, coverUrl: normalizedData.coverUrl || oldBook.coverUrl, rating: normalizedData.notaGeral });
      }
    }
  }, [user, books, updateUserStats, createFeedItem]);

  const deleteBook = useCallback(async (id: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'books', id));
    await updateUserStats(user.userId);
  }, [user, updateUserStats]);

  const deleteMultipleBooks = useCallback(async (ids: string[]) => {
    if (!user || !db) return;
    const promises = ids.map(id => deleteDoc(doc(db, 'books', id)));
    await Promise.all(promises);
    await updateUserStats(user.userId);
  }, [user, updateUserStats]);

  const getBook = useCallback((id: string) => {
    return books.find((b) => b.id === id);
  }, [books]);

  const value = useMemo(() => ({
    books,
    loading,
    addBook,
    updateBook,
    deleteBook,
    deleteMultipleBooks,
    getBook,
    updateUserStats
  }), [books, loading, addBook, updateBook, deleteBook, deleteMultipleBooks, getBook, updateUserStats]);

  return <BooksContext.Provider value={value}>{children}</BooksContext.Provider>;
};

export const useBooksState = () => {
  const context = useContext(BooksContext);
  if (context === undefined) throw new Error('useBooksState must be used within a BooksProvider');
  return context;
};
