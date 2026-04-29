import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';
import { ReadingSession } from '../types';
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

    setLoading(true);
    const q = query(collection(db, 'reading_sessions'), where('userId', '==', user.userId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessionsData: ReadingSession[] = [];
        snapshot.forEach((docSnap) => {
          sessionsData.push({ id: docSnap.id, ...docSnap.data() } as ReadingSession);
        });
        sessionsData.sort((a, b) => b.date - a.date);
        setSessions(sessionsData);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'reading_sessions');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const addSession = useCallback(async (sessionData: Omit<ReadingSession, 'id' | 'userId' | 'createdAt'>) => {
    if (!user || !db) return;

    try {
      const book = books.find((b) => b.id === sessionData.bookId);

      await addDoc(collection(db, 'reading_sessions'), {
        ...sessionData,
        bookTitle: book?.titulo || sessionData.bookTitle,
        userId: user.userId,
        createdAt: serverTimestamp(),
      });

      if (book) {
        const currentPage = book.currentPage || 0;
        const inferredEndPage = sessionData.endPage || currentPage + Math.max(0, sessionData.pagesRead || 0);
        const total = book.totalPages || book.pageCount || 0;

        const newCurrentPage = total > 0 ? Math.min(total, Math.max(currentPage, inferredEndPage)) : Math.max(currentPage, inferredEndPage);
        const progressPercentage = total > 0 ? Math.min(100, Math.round((newCurrentPage / total) * 100)) : book.progressPercentage || 0;
        const newStatus = progressPercentage === 100 && book.status === 'lendo' ? 'lido' : book.status;

        await updateBook(book.id, {
          currentPage: newCurrentPage,
          progressPercentage,
          status: newStatus,
          finishedAt: newStatus === 'lido' && !book.finishedAt ? Date.now() : book.finishedAt,
          updatedAt: Date.now(),
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
    return sessions.filter((s) => s.bookId === bookId);
  }, [sessions]);

  const value = useMemo(() => ({
    sessions,
    loading,
    addSession,
    deleteSession,
    getSessionsByBook,
  }), [sessions, loading, addSession, deleteSession, getSessionsByBook]);

  return <ReadingSessionsContext.Provider value={value}>{children}</ReadingSessionsContext.Provider>;
};

export const useReadingSessions = () => {
  const context = useContext(ReadingSessionsContext);
  if (context === undefined) throw new Error('useReadingSessions must be used within a ReadingSessionsProvider');
  return context;
};
