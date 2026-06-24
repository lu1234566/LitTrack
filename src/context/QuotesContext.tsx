import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';
import { Quote } from '../types';

interface QuotesContextType {
  quotes: Quote[];
  loading: boolean;
  addQuote: (quote: Omit<Quote, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  getQuotesByBook: (bookId: string) => Quote[];
}

const QuotesContext = createContext<QuotesContextType | undefined>(undefined);

export const QuotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !db) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'quotes'), where('userId', '==', user.userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quotesData: Quote[] = [];
      snapshot.forEach((docSnap) => {
        quotesData.push({ id: docSnap.id, ...docSnap.data() } as Quote);
      });
      quotesData.sort((a, b) => b.createdAt - a.createdAt);
      setQuotes(quotesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'quotes');
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addQuote = useCallback(async (quoteData: Omit<Quote, 'id' | 'userId' | 'createdAt'>) => {
    if (!user || !db) return;

    try {
      const cleanedData = {
        ...quoteData,
        page: quoteData.page ?? null,
        personalNote: quoteData.personalNote ?? '',
        moodLabel: quoteData.moodLabel ?? '',
        userId: user.userId,
        createdAt: Date.now(),
      };

      await addDoc(collection(db, 'quotes'), cleanedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'quotes');
    }
  }, [user]);

  const updateQuote = useCallback(async (id: string, quoteUpdate: Partial<Quote>) => {
    if (!user || !db) return;
    try {
      // Avoid sending undefined fields to Firestore
      const cleanedUpdate = Object.entries(quoteUpdate).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key as string] = value;
        }
        return acc;
      }, {} as any);

      await updateDoc(doc(db, 'quotes', id), cleanedUpdate);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'quotes');
    }
  }, [user]);

  const deleteQuote = useCallback(async (id: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'quotes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'quotes');
    }
  }, [user]);

  const getQuotesByBook = useCallback((bookId: string) => {
    return quotes.filter(q => q.bookId === bookId);
  }, [quotes]);

  const value = useMemo(() => ({
    quotes,
    loading,
    addQuote,
    updateQuote,
    deleteQuote,
    getQuotesByBook
  }), [quotes, loading, addQuote, updateQuote, deleteQuote, getQuotesByBook]);

  return <QuotesContext.Provider value={value}>{children}</QuotesContext.Provider>;
};

export const useQuotes = () => {
  const context = useContext(QuotesContext);
  if (context === undefined) throw new Error('useQuotes must be used within a QuotesProvider');
  return context;
};
