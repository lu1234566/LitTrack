import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';
import { ReadingSession, Book } from '../types';
import { useBooksState } from './BooksContext';

interface ReadingSessionsContextType {
  sessions: ReadingSession[];
  loading: boolean;
  addSession: (session: Omit<ReadingSession, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  getSessionsByBook: (bookId: string) => ReadingSession[];
}

const ReadingSessionsContext = createContext<ReadingSessionsContextType | undefined>(undefined);

export const ReadingSessionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { books, updateBook } = useBooksState();

  useEffect(() => {
    if (!user || !db) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'reading_sessions'), where('userId', '==', user.userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData: ReadingSession[] = [];
      snapshot.forEach((doc) => {
        sessionsData.push({ id: doc.id, ...doc.data() } as ReadingSession);
      });
      sessionsData.sort((a, b) => b.date - a.date);
      setSessions(sessionsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reading_sessions');
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addSession = useCallback(async (sessionData: Omit<ReadingSession, 'id' | 'userId' | 'createdAt'>) => {
    if (!user || !db) return;

    try {
      const book = books.find(b => b.id === sessionData.bookId);
      
      const docRef = await addDoc(collection(db, 'reading_sessions'), {
        ...sessionData,
        bookTitle: book?.titulo || sessionData.bookTitle,
        userId: user.userId,
        createdAt: serverTimestamp(),
      });

      // Update book progress if a book is linked
      if (book) {
        // Ensure we don't regress current page
        const newCurrentPage = Math.max(book.currentPage || 0, sessionData.endPage || (book.currentPage || 0) + sessionData.pagesRead);
        const total = book.totalPages || book.pageCount || 0;
        let progressPercentage = book.progressPercentage || 0;
        let newStatus = book.status;

        if (total > 0) {
          progressPercentage = Math.min(100, Math.round((newCurrentPage / total) * 100));
        }

        // If progress is 100%, consider book as finished
        if (progressPercentage === 100 && book.status === 'lendo') {
          newStatus = 'lido';
        }

        await updateBook(book.id, {
          currentPage: newCurrentPage,
          progressPercentage,
          status: newStatus,
          finishedAt: newStatus === 'lido' && !book.finishedAt ? Date.now() : book.finishedAt,
          updatedAt: Date.now()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reading_sessions');
    }
  }, [user, books, updateBook]);

  const deleteSession = useCallback(async (id: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'reading_sessions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'reading_sessions');
    }
  }, [user]);

  const getSessionsByBook = useCallback((bookId: string) => {
    return sessions.filter(s => s.bookId === bookId);
  }, [sessions]);

  const value = useMemo(() => ({
    sessions,
    loading,
    addSession,
    deleteSession,
    getSessionsByBook
  }), [sessions, loading, addSession, deleteSession, getSessionsByBook]);

  return <ReadingSessionsContext.Provider value={value}>{children}</ReadingSessionsContext.Provider>;
};

export const useReadingSessions = () => {
  const context = useContext(ReadingSessionsContext);
  if (context === undefined) throw new Error('useReadingSessions must be used within a ReadingSessionsProvider');
  return context;
};
