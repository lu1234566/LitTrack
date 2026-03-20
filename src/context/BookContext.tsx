import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Book, LiteraryProfile, Recommendation } from '../types';

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

  const addBook = async (bookData: Omit<Book, 'id' | 'userId' | 'dataCadastro'>) => {
    if (!user || !db) return;
    try {
      await addDoc(collection(db, 'books'), {
        ...bookData,
        userId: user.userId,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding book: ", error);
      throw error;
    }
  };

  const updateBook = async (id: string, bookData: Partial<Book>) => {
    if (!user || !db) return;
    try {
      const bookRef = doc(db, 'books', id);
      await updateDoc(bookRef, bookData);
    } catch (error) {
      console.error("Error updating book: ", error);
      throw error;
    }
  };

  const deleteBook = async (id: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'books', id));
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
