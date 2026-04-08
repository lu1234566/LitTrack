import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Book, LiteraryProfile, Recommendation, FeedItemType, UserGoal } from '../types';
import { safeParseNumber } from '../lib/statsUtils';

interface BookContextType {
  books: Book[];
  loading: boolean;
  literaryProfile: LiteraryProfile | null;
  recommendations: Recommendation[];
  userGoal: UserGoal | null;
  addBook: (book: Omit<Book, 'id' | 'userId' | 'dataCadastro'>) => Promise<void>;
  updateBook: (id: string, book: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  deleteMultipleBooks: (ids: string[]) => Promise<void>;
  getBook: (id: string) => Book | undefined;
  saveLiteraryProfile: (profile: LiteraryProfile) => Promise<void>;
  saveRecommendations: (recommendations: Recommendation[]) => Promise<void>;
  saveUserGoal: (goal: Omit<UserGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  importData: (data: any, mode: 'merge' | 'replace') => Promise<{ imported: number, ignored: number, goals: number }>;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [literaryProfile, setLiteraryProfile] = useState<LiteraryProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !db) {
      setBooks([]);
      setLiteraryProfile(null);
      setRecommendations([]);
      setUserGoal(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch Books
      const q = query(collection(db, 'books'), where('userId', '==', user.userId));
      const unsubscribeBooks = onSnapshot(q, (snapshot) => {
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
      });

      // Fetch Literary Profile
      const profileRef = doc(db, 'profiles', user.userId);
      const unsubscribeProfile = onSnapshot(profileRef, (doc) => {
        if (doc.exists()) {
          setLiteraryProfile(doc.data() as LiteraryProfile);
        }
      });

      // Fetch Recommendations
      const recommendationsRef = doc(db, 'recommendations', user.userId);
      const unsubscribeRecommendations = onSnapshot(recommendationsRef, (doc) => {
        if (doc.exists()) {
          setRecommendations(doc.data().list as Recommendation[]);
        }
      });

      // Fetch User Goal
      const currentYear = new Date().getFullYear();
      const goalRef = doc(db, 'userGoals', `${user.userId}_${currentYear}`);
      const unsubscribeGoal = onSnapshot(goalRef, (doc) => {
        if (doc.exists()) {
          setUserGoal(doc.data() as UserGoal);
        } else {
          setUserGoal(null);
        }
      });

      return () => {
        unsubscribeBooks();
        unsubscribeProfile();
        unsubscribeRecommendations();
        unsubscribeGoal();
      };
    } catch (e) {
      console.error("Error setting up Firestore listeners:", e);
      setLoading(false);
    }
  }, [user]);

  const updateUserStats = async (userId: string) => {
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
      console.error("Error updating user stats: ", error);
    }
  };

  const createFeedItem = async (userId: string, type: FeedItemType, content: string, relatedBookId?: string, metadata?: any) => {
    if (!db || !user) return;
    try {
      await addDoc(collection(db, 'communityFeed'), {
        userId,
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
  };

  const addBook = React.useCallback(async (bookData: Omit<Book, 'id' | 'userId' | 'dataCadastro'>) => {
    if (!user || !db) return;
    try {
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
        await createFeedItem(user.userId, 'finished_book', `terminou de ler ${normalizedData.titulo}`, docRef.id, { bookTitle: normalizedData.titulo, coverUrl: normalizedData.coverUrl, rating: normalizedData.notaGeral });
      } else {
        await createFeedItem(user.userId, 'added_book', `adicionou ${normalizedData.titulo} à sua lista`, docRef.id, { bookTitle: normalizedData.titulo, coverUrl: normalizedData.coverUrl });
      }
    } catch (error) {
      console.error("Error adding book: ", error);
      throw error;
    }
  }, [user, db]);

  const updateBook = React.useCallback(async (id: string, bookData: Partial<Book>) => {
    if (!user || !db) return;
    try {
      const bookRef = doc(db, 'books', id);
      const oldBook = getBook(id);
      
      const normalizedData = { ...bookData };
      if ('pageCount' in normalizedData) {
        normalizedData.pageCount = safeParseNumber(normalizedData.pageCount);
      }

      await updateDoc(bookRef, normalizedData);
      
      await updateUserStats(user.userId);
      
      if (oldBook) {
        if (oldBook.status !== 'lido' && normalizedData.status === 'lido') {
          await createFeedItem(user.userId, 'finished_book', `terminou de ler ${normalizedData.titulo || oldBook.titulo}`, id, { bookTitle: normalizedData.titulo || oldBook.titulo, coverUrl: normalizedData.coverUrl || oldBook.coverUrl, rating: normalizedData.notaGeral || oldBook.notaGeral });
        } else if ((!oldBook.notaGeral || oldBook.notaGeral === 0) && normalizedData.notaGeral && normalizedData.notaGeral > 0) {
          await createFeedItem(user.userId, 'rated_book', `avaliou ${normalizedData.titulo || oldBook.titulo} com ${normalizedData.notaGeral} estrelas`, id, { bookTitle: normalizedData.titulo || oldBook.titulo, coverUrl: normalizedData.coverUrl || oldBook.coverUrl, rating: normalizedData.notaGeral });
        }
      }
    } catch (error) {
      console.error("Error updating book: ", error);
      throw error;
    }
  }, [user, db]);

  const deleteBook = React.useCallback(async (id: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'books', id));
      await updateUserStats(user.userId);
    } catch (error) {
      console.error("Error deleting book: ", error);
      throw error;
    }
  }, [user, db]);

  const deleteMultipleBooks = React.useCallback(async (ids: string[]) => {
    if (!user || !db) return;
    try {
      const promises = ids.map(id => deleteDoc(doc(db, 'books', id)));
      await Promise.all(promises);
      await updateUserStats(user.userId);
    } catch (error) {
      console.error("Error deleting multiple books: ", error);
      throw error;
    }
  }, [user, db]);

  const getBook = React.useCallback((id: string) => {
    return books.find((b) => b.id === id);
  }, [books]);

  const saveLiteraryProfile = React.useCallback(async (profile: LiteraryProfile) => {
    if (!user || !db) return;
    try {
      const profileRef = doc(db, 'profiles', user.userId);
      await setDoc(profileRef, profile);
    } catch (error) {
      console.error("Error saving literary profile: ", error);
      throw error;
    }
  }, [user, db]);

  const saveRecommendations = React.useCallback(async (recs: Recommendation[]) => {
    if (!user || !db) return;
    try {
      const recommendationsRef = doc(db, 'recommendations', user.userId);
      await setDoc(recommendationsRef, { list: recs, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error("Error saving recommendations: ", error);
      throw error;
    }
  }, [user, db]);

  const saveUserGoal = React.useCallback(async (goalData: Omit<UserGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !db) return;
    try {
      const goalId = `${user.userId}_${goalData.year}`;
      const goalRef = doc(db, 'userGoals', goalId);
      const existingGoal = await getDoc(goalRef);
      
      const now = Date.now();
      const goal: UserGoal = {
        ...goalData,
        id: goalId,
        userId: user.userId,
        createdAt: existingGoal.exists() ? existingGoal.data().createdAt : now,
        updatedAt: now
      };
      
      await setDoc(goalRef, goal);
    } catch (error) {
      console.error("Error saving user goal: ", error);
      throw error;
    }
  }, [user, db]);

  const importData = React.useCallback(async (data: any, mode: 'merge' | 'replace') => {
    if (!user || !db) throw new Error("Usuário não autenticado");
    
    let importedCount = 0;
    let ignoredCount = 0;
    let goalsCount = 0;

    try {
      const batch = writeBatch(db);
      
      // 1. Handle Books
      if (data.books && Array.isArray(data.books)) {
        if (mode === 'replace') {
          // Delete existing books
          const q = query(collection(db, 'books'), where('userId', '==', user.userId));
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
        }

        for (const bookData of data.books) {
          // Basic duplicate check for merge mode
          if (mode === 'merge') {
            const isDuplicate = books.some(b => 
              (b.titulo.toLowerCase() === bookData.titulo.toLowerCase() && b.autor.toLowerCase() === bookData.autor.toLowerCase()) ||
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

      // 2. Handle User Goals
      if (data.userGoal) {
        const goals = Array.isArray(data.userGoal) ? data.userGoal : [data.userGoal];
        for (const goalData of goals) {
          if (!goalData.year) continue;
          const goalId = `${user.userId}_${goalData.year}`;
          const goalRef = doc(db, 'userGoals', goalId);
          const { id, userId, createdAt, updatedAt, ...cleanGoalData } = goalData;
          
          batch.set(goalRef, {
            ...cleanGoalData,
            id: goalId,
            userId: user.userId,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }, { merge: true });
          goalsCount++;
        }
      }

      // 3. Handle Literary Profile
      if (data.literaryProfile) {
        const profileRef = doc(db, 'profiles', user.userId);
        batch.set(profileRef, data.literaryProfile, { merge: true });
      }

      await batch.commit();
      await updateUserStats(user.userId);
      
      return { imported: importedCount, ignored: ignoredCount, goals: goalsCount };
    } catch (error) {
      console.error("Error importing data: ", error);
      throw error;
    }
  }, [user, db, books]);

  const value = React.useMemo(() => ({ 
    books, 
    loading, 
    literaryProfile, 
    recommendations, 
    userGoal,
    addBook, 
    updateBook, 
    deleteBook, 
    deleteMultipleBooks, 
    getBook,
    saveLiteraryProfile,
    saveRecommendations,
    saveUserGoal,
    importData
  }), [
    books, loading, literaryProfile, recommendations, userGoal,
    addBook, updateBook, deleteBook, deleteMultipleBooks, getBook, 
    saveLiteraryProfile, saveRecommendations, saveUserGoal, importData
  ]);

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  );
};

export const useBooks = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BookProvider');
  }
  return context;
};
