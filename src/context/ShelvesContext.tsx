import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';
import { Shelf } from '../types';

interface ShelvesContextType {
  shelves: Shelf[];
  loading: boolean;
  createShelf: (shelf: Omit<Shelf, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateShelf: (id: string, shelf: Partial<Shelf>) => Promise<void>;
  deleteShelf: (id: string) => Promise<void>;
  addBookToShelf: (shelfId: string, bookId: string) => Promise<void>;
  removeBookFromShelf: (shelfId: string, bookId: string) => Promise<void>;
}

const ShelvesContext = createContext<ShelvesContextType | undefined>(undefined);

export const ShelvesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setShelves([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'shelves'), where('userId', '==', user.userId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shelvesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shelf));
      setShelves(shelvesList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching shelves:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createShelf = useCallback(async (shelfData: Omit<Shelf, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'shelves'), {
        ...shelfData,
        userId: user.userId,
        createdAt: Date.now(),
        bookIds: shelfData.bookIds || []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'shelves');
    }
  }, [user]);

  const updateShelf = useCallback(async (id: string, shelfData: Partial<Shelf>) => {
    try {
      await updateDoc(doc(db, 'shelves', id), shelfData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shelves/${id}`);
    }
  }, []);

  const deleteShelf = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shelves', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shelves/${id}`);
    }
  }, []);

  const addBookToShelf = useCallback(async (shelfId: string, bookId: string) => {
    try {
      await updateDoc(doc(db, 'shelves', shelfId), {
        bookIds: arrayUnion(bookId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shelves/${shelfId}`);
    }
  }, []);

  const removeBookFromShelf = useCallback(async (shelfId: string, bookId: string) => {
    try {
      await updateDoc(doc(db, 'shelves', shelfId), {
        bookIds: arrayRemove(bookId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shelves/${shelfId}`);
    }
  }, []);

  return (
    <ShelvesContext.Provider value={{ shelves, loading, createShelf, updateShelf, deleteShelf, addBookToShelf, removeBookFromShelf }}>
      {children}
    </ShelvesContext.Provider>
  );
};

export const useShelves = () => {
  const context = useContext(ShelvesContext);
  if (context === undefined) {
    throw new Error('useShelves must be used within a ShelvesProvider');
  }
  return context;
};
