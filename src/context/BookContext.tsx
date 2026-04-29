import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Book, LiteraryProfile, Recommendation, UserGoal, BackupHistory, ReadingSession, Shelf, Quote } from '../types';
import { BooksProvider, useBooksState } from './BooksContext';
import { GoalsProvider, useGoals } from './GoalsContext';
import { LiteraryProfileProvider, useLiteraryProfile } from './LiteraryProfileContext';
import { RecommendationsProvider, useRecommendations } from './RecommendationsContext';
import { BackupProvider, useBackup } from './BackupContext';
import { ReadingSessionsProvider, useReadingSessions } from './ReadingSessionsContext';
import { ShelvesProvider, useShelves } from './ShelvesContext';
import { QuotesProvider, useQuotes } from './QuotesContext';
import { RetrospectiveProvider, useRetrospective } from './RetrospectiveContext';

interface BookContextType {
  books: Book[];
  loading: boolean;
  literaryProfile: LiteraryProfile | null;
  recommendations: Recommendation[];
  userGoal: UserGoal | null;
  backupHistory: BackupHistory[];
  sessions: ReadingSession[];
  shelves: Shelf[];
  quotes: Quote[];
  narratives: string[];
  saveRetrospectiveNarratives: (year: number, narratives: string[]) => Promise<void>;
  addBook: (book: Omit<Book, 'id' | 'userId' | 'dataCadastro'>) => Promise<void>;
  updateBook: (id: string, book: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  deleteMultipleBooks: (ids: string[]) => Promise<void>;
  getBook: (id: string) => Book | undefined;
  saveLiteraryProfile: (profile: LiteraryProfile) => Promise<void>;
  saveRecommendations: (recommendations: Recommendation[]) => Promise<void>;
  saveUserGoal: (goal: Omit<UserGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  importData: (data: any, mode: 'merge' | 'replace') => Promise<{ imported: number, ignored: number, goals: number }>;
  logBackupAction: (action: Omit<BackupHistory, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  addSession: (session: Omit<ReadingSession, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  getSessionsByBook: (bookId: string) => ReadingSession[];
  createShelf: (shelf: Omit<Shelf, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateShelf: (id: string, shelf: Partial<Shelf>) => Promise<void>;
  deleteShelf: (id: string) => Promise<void>;
  addBookToShelf: (shelfId: string, bookId: string) => Promise<void>;
  removeBookFromShelf: (shelfId: string, bookId: string) => Promise<void>;
  reorderBooksInShelf: (shelfId: string, bookIds: string[]) => Promise<void>;
  addQuote: (quote: Omit<Quote, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  getQuotesByBook: (bookId: string) => Quote[];
}

const BookContext = createContext<BookContextType | undefined>(undefined);

const BookContextBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { books, loading, addBook, updateBook, deleteBook, deleteMultipleBooks, getBook, updateUserStats } = useBooksState();
  const { userGoal, saveUserGoal } = useGoals();
  const { literaryProfile, saveLiteraryProfile } = useLiteraryProfile();
  const { recommendations, saveRecommendations } = useRecommendations();
  const { backupHistory, logBackupAction } = useBackup();
  const { sessions, addSession, getSessionsByBook } = useReadingSessions();
  const { shelves, createShelf, updateShelf, deleteShelf, addBookToShelf, removeBookFromShelf, reorderBooksInShelf } = useShelves();
  const { quotes, addQuote, updateQuote, deleteQuote, getQuotesByBook } = useQuotes();
  const { getNarratives, saveNarratives } = useRetrospective();

  const importData = useCallback(async (data: any, mode: 'merge' | 'replace') => {
    if (!user || !db) throw new Error('Usuário não autenticado');

    let importedCount = 0;
    let ignoredCount = 0;
    let goalsCount = 0;

    try {
      const batch = writeBatch(db);

      const replaceUserCollection = async (collectionName: string) => {
        const q = query(collection(db, collectionName), where('userId', '==', user.userId));
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
      };

      if (data.books && Array.isArray(data.books)) {
        if (mode === 'replace') {
          await replaceUserCollection('books');
        }

        for (const bookData of data.books) {
          if (mode === 'merge') {
            const isDuplicate = books.some(
              (b) =>
                (b.titulo.toLowerCase() === bookData.titulo.toLowerCase() &&
                  b.autor.toLowerCase() === bookData.autor.toLowerCase()) ||
                (b.isbn && bookData.isbn && b.isbn === bookData.isbn)
            );

            if (isDuplicate) {
              ignoredCount++;
              continue;
            }
          }

          const newBookRef = doc(collection(db, 'books'));
          const { id, userId, createdAt, dataCadastro, ...cleanBookData } = bookData;

          batch.set(newBookRef, {
            ...cleanBookData,
            userId: user.userId,
            createdAt: serverTimestamp(),
          });
          importedCount++;
        }
      }

      if (data.userGoal) {
        const goals = Array.isArray(data.userGoal) ? data.userGoal : [data.userGoal];
        for (const goalData of goals) {
          if (!goalData.year) continue;
          const goalId = `${user.userId}_${goalData.year}`;
          const goalRef = doc(db, 'userGoals', goalId);
          const { id, userId, createdAt, updatedAt, ...cleanGoalData } = goalData;

          batch.set(
            goalRef,
            {
              ...cleanGoalData,
              id: goalId,
              userId: user.userId,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            { merge: true }
          );
          goalsCount++;
        }
      }

      if (Array.isArray(data.sessions) && data.sessions.length > 0) {
        if (mode === 'replace') {
          await replaceUserCollection('reading_sessions');
        }

        for (const sessionData of data.sessions) {
          const newSessionRef = doc(collection(db, 'reading_sessions'));
          const { id, userId, createdAt, ...cleanSessionData } = sessionData;
          batch.set(newSessionRef, {
            ...cleanSessionData,
            userId: user.userId,
            createdAt: serverTimestamp(),
          });
        }
      }

      if (Array.isArray(data.quotes) && data.quotes.length > 0) {
        if (mode === 'replace') {
          await replaceUserCollection('quotes');
        }

        for (const quoteData of data.quotes) {
          const newQuoteRef = doc(collection(db, 'quotes'));
          const { id, userId, createdAt, ...cleanQuoteData } = quoteData;
          batch.set(newQuoteRef, {
            ...cleanQuoteData,
            userId: user.userId,
            createdAt: Date.now(),
          });
        }
      }

      if (Array.isArray(data.shelves) && data.shelves.length > 0) {
        if (mode === 'replace') {
          await replaceUserCollection('shelves');
        }

        for (const shelfData of data.shelves) {
          const newShelfRef = doc(collection(db, 'shelves'));
          const { id, userId, createdAt, updatedAt, ...cleanShelfData } = shelfData;
          batch.set(newShelfRef, {
            ...cleanShelfData,
            userId: user.userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }

      if (data.literaryProfile) {
        const profileRef = doc(db, 'profiles', user.userId);
        batch.set(profileRef, data.literaryProfile, { merge: true });
      }

      await batch.commit();
      await updateUserStats(user.userId);

      await logBackupAction({
        actionType: mode === 'replace' ? 'restore_backup' : 'import_json',
        format: 'json',
        status: 'sucesso',
        details: `${importedCount} livros importados, ${ignoredCount} duplicados ignorados, ${goalsCount} metas tratadas`,
        affectedRecords: importedCount,
      });

      return { imported: importedCount, ignored: ignoredCount, goals: goalsCount };
    } catch (error) {
      console.error('Error importing data: ', error);
      await logBackupAction({
        actionType: mode === 'replace' ? 'restore_backup' : 'import_json',
        format: 'json',
        status: 'falha',
        details: 'Erro durante a importação de dados',
        affectedRecords: 0,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, [user, books, updateUserStats, logBackupAction]);

  const value = useMemo(
    () => ({
      books,
      loading,
      literaryProfile,
      recommendations,
      userGoal,
      backupHistory,
      sessions,
      shelves,
      quotes,
      narratives: getNarratives(new Date().getFullYear()),
      saveRetrospectiveNarratives: saveNarratives,
      addBook,
      updateBook,
      deleteBook,
      deleteMultipleBooks,
      getBook,
      saveLiteraryProfile,
      saveRecommendations,
      saveUserGoal,
      importData,
      logBackupAction,
      addSession,
      getSessionsByBook,
      createShelf,
      updateShelf,
      deleteShelf,
      addBookToShelf,
      removeBookFromShelf,
      reorderBooksInShelf,
      addQuote,
      updateQuote,
      deleteQuote,
      getQuotesByBook,
    }),
    [
      books,
      loading,
      literaryProfile,
      recommendations,
      userGoal,
      backupHistory,
      sessions,
      shelves,
      quotes,
      getNarratives,
      saveNarratives,
      addBook,
      updateBook,
      deleteBook,
      deleteMultipleBooks,
      getBook,
      saveLiteraryProfile,
      saveRecommendations,
      saveUserGoal,
      importData,
      logBackupAction,
      addSession,
      getSessionsByBook,
      createShelf,
      updateShelf,
      deleteShelf,
      addBookToShelf,
      removeBookFromShelf,
      reorderBooksInShelf,
      addQuote,
      updateQuote,
      deleteQuote,
      getQuotesByBook,
    ]
  );

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
};

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BooksProvider>
      <ShelvesProvider>
        <ReadingSessionsProvider>
          <QuotesProvider>
            <RetrospectiveProvider>
              <GoalsProvider>
                <LiteraryProfileProvider>
                  <RecommendationsProvider>
                    <BackupProvider>
                      <BookContextBridge>{children}</BookContextBridge>
                    </BackupProvider>
                  </RecommendationsProvider>
                </LiteraryProfileProvider>
              </GoalsProvider>
            </RetrospectiveProvider>
          </QuotesProvider>
        </ReadingSessionsProvider>
      </ShelvesProvider>
    </BooksProvider>
  );
};

export const useBooks = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBooks deve ser usado dentro de um BookProvider');
  }
  return context;
};
