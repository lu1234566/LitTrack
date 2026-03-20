import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Book, LiteraryProfile, Recommendation, FeedItemType } from '../types';

interface BookContextType {
  books: Book[];
  loading: boolean;
  literaryProfile: LiteraryProfile | null;
  recommendations: Recommendation[];
  addBook: (book: Omit<Book, 'id' | 'userId' | 'dataCadastro'>) => Promise<void>;
  updateBook: (id: string, book: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  deleteMultipleBooks: (ids: string[]) => Promise<void>;
  getBook: (id: string) => Book | undefined;
  saveLiteraryProfile: (profile: LiteraryProfile) => Promise<void>;
  saveRecommendations: (recommendations: Recommendation[]) => Promise<void>;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [literaryProfile, setLiteraryProfile] = useState<LiteraryProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !db) {
      setBooks([]);
      setLiteraryProfile(null);
      setRecommendations([]);
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

      return () => {
        unsubscribeBooks();
        unsubscribeProfile();
        unsubscribeRecommendations();
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
          if (data.pageCount) pagesRead += data.pageCount;
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

  const addBook = async (bookData: Omit<Book, 'id' | 'userId' | 'dataCadastro'>) => {
    if (!user || !db) return;
    try {
      const docRef = await addDoc(collection(db, 'books'), {
        ...bookData,
        userId: user.userId,
        createdAt: serverTimestamp(),
      });
      
      await updateUserStats(user.userId);
      
      if (bookData.status === 'lido') {
        await createFeedItem(user.userId, 'finished_book', `terminou de ler ${bookData.titulo}`, docRef.id, { bookTitle: bookData.titulo, coverUrl: bookData.coverUrl, rating: bookData.notaGeral });
      } else {
        await createFeedItem(user.userId, 'added_book', `adicionou ${bookData.titulo} à sua lista`, docRef.id, { bookTitle: bookData.titulo, coverUrl: bookData.coverUrl });
      }
    } catch (error) {
      console.error("Error adding book: ", error);
      throw error;
    }
  };

  const updateBook = async (id: string, bookData: Partial<Book>) => {
    if (!user || !db) return;
    try {
      const bookRef = doc(db, 'books', id);
      const oldBook = getBook(id);
      await updateDoc(bookRef, bookData);
      
      await updateUserStats(user.userId);
      
      if (oldBook) {
        if (oldBook.status !== 'lido' && bookData.status === 'lido') {
          await createFeedItem(user.userId, 'finished_book', `terminou de ler ${bookData.titulo || oldBook.titulo}`, id, { bookTitle: bookData.titulo || oldBook.titulo, coverUrl: bookData.coverUrl || oldBook.coverUrl, rating: bookData.notaGeral || oldBook.notaGeral });
        } else if ((!oldBook.notaGeral || oldBook.notaGeral === 0) && bookData.notaGeral && bookData.notaGeral > 0) {
          await createFeedItem(user.userId, 'rated_book', `avaliou ${bookData.titulo || oldBook.titulo} com ${bookData.notaGeral} estrelas`, id, { bookTitle: bookData.titulo || oldBook.titulo, coverUrl: bookData.coverUrl || oldBook.coverUrl, rating: bookData.notaGeral });
        }
      }
    } catch (error) {
      console.error("Error updating book: ", error);
      throw error;
    }
  };

  const deleteBook = async (id: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'books', id));
      await updateUserStats(user.userId);
    } catch (error) {
      console.error("Error deleting book: ", error);
      throw error;
    }
  };

  const deleteMultipleBooks = async (ids: string[]) => {
    if (!user || !db) return;
    try {
      const promises = ids.map(id => deleteDoc(doc(db, 'books', id)));
      await Promise.all(promises);
      await updateUserStats(user.userId);
    } catch (error) {
      console.error("Error deleting multiple books: ", error);
      throw error;
    }
  };

  const getBook = (id: string) => {
    return books.find((b) => b.id === id);
  };

  const saveLiteraryProfile = async (profile: LiteraryProfile) => {
    if (!user || !db) return;
    try {
      const profileRef = doc(db, 'profiles', user.userId);
      await setDoc(profileRef, profile);
    } catch (error) {
      console.error("Error saving literary profile: ", error);
      throw error;
    }
  };

  const saveRecommendations = async (recs: Recommendation[]) => {
    if (!user || !db) return;
    try {
      const recommendationsRef = doc(db, 'recommendations', user.userId);
      await setDoc(recommendationsRef, { list: recs, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error("Error saving recommendations: ", error);
      throw error;
    }
  };

  return (
    <BookContext.Provider value={{ 
      books, 
      loading, 
      literaryProfile, 
      recommendations, 
      addBook, 
      updateBook, 
      deleteBook, 
      deleteMultipleBooks, 
      getBook,
      saveLiteraryProfile,
      saveRecommendations
    }}>
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
