import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, onSnapshot, arrayUnion, arrayRemove, getDocs } from 'firebase/firestore';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';
import { Shelf } from '../types';

interface ShelvesContextType {
  shelves: Shelf[];
  loading: boolean;
  createShelf: (shelf: Omit<Shelf, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateShelf: (id: string, shelf: Partial<Shelf>) => Promise<void>;
  deleteShelf: (id: string) => Promise<void>;
  addBookToShelf: (shelfId: string, bookId: string) => Promise<void>;
  removeBookFromShelf: (shelfId: string, bookId: string) => Promise<void>;
  reorderBooksInShelf: (shelfId: string, bookIds: string[]) => Promise<void>;
}

const ShelvesContext = createContext<ShelvesContextType | undefined>(undefined);

export const ShelvesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);

  const initializeSystemShelves = useCallback(async (userId: string) => {
    if (!db) return;

    const systemShelves = [
      { name: 'Quero Ler', type: 'system' as const, accentColor: '#3b82f6', description: 'Obras que despertaram o interesse e aguardam o momento certo.', sortOrder: -4 },
      { name: 'Favoritos', type: 'system' as const, accentColor: '#ef4444', description: 'Livros que deixaram uma marca profunda na alma e no pensamento.', sortOrder: -3 },
      { name: 'Reler', type: 'system' as const, accentColor: '#8b5cf6', description: 'Jornadas que merecem ser revisitadas sob novas perspectivas.', sortOrder: -2 },
      { name: 'Abandonados', type: 'system' as const, accentColor: '#6b7280', description: 'Caminhos que foram interrompidos, aguardando talvez um novo fôlego.', sortOrder: -1 },
    ];

    try {
      const q = query(collection(db, 'shelves'), where('userId', '==', userId), where('type', '==', 'system'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const now = Date.now();
        const promises = systemShelves.map((shelf) =>
          addDoc(collection(db, 'shelves'), {
            ...shelf,
            userId,
            bookIds: [],
            createdAt: now,
            updatedAt: now,
          })
        );
        await Promise.all(promises);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'shelves/system');
    }
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setShelves([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    initializeSystemShelves(user.userId);

    const q = query(collection(db, 'shelves'), where('userId', '==', user.userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const shelvesList = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Shelf));
        shelvesList.sort((a, b) => {
          if ((a.sortOrder || 0) !== (b.sortOrder || 0)) {
            return (a.sortOrder || 0) - (b.sortOrder || 0);
          }
          return a.name.localeCompare(b.name);
        });
        setShelves(shelvesList);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'shelves');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, initializeSystemShelves]);

  const createShelf = useCallback(async (shelfData: Omit<Shelf, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user || !db) return;
    try {
      const now = Date.now();
      await addDoc(collection(db, 'shelves'), {
        ...shelfData,
        userId: user.userId,
        createdAt: now,
        updatedAt: now,
        type: shelfData.type || 'custom',
        bookIds: shelfData.bookIds || [],
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'shelves');
    }
  }, [user]);

  const updateShelf = useCallback(async (id: string, shelfData: Partial<Shelf>) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'shelves', id), {
        ...shelfData,
        updatedAt: Date.now(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shelves/${id}`);
    }
  }, []);

  const deleteShelf = useCallback(async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'shelves', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shelves/${id}`);
    }
  }, []);

  const addBookToShelf = useCallback(async (shelfId: string, bookId: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'shelves', shelfId), {
        bookIds: arrayUnion(bookId),
        updatedAt: Date.now(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shelves/${shelfId}`);
    }
  }, []);

  const removeBookFromShelf = useCallback(async (shelfId: string, bookId: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'shelves', shelfId), {
        bookIds: arrayRemove(bookId),
        updatedAt: Date.now(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shelves/${shelfId}`);
    }
  }, []);

  const reorderBooksInShelf = useCallback(async (shelfId: string, bookIds: string[]) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'shelves', shelfId), {
        bookIds,
        updatedAt: Date.now(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shelves/${shelfId}`);
    }
  }, []);

  const value = useMemo(
    () => ({
      shelves,
      loading,
      createShelf,
      updateShelf,
      deleteShelf,
      addBookToShelf,
      removeBookFromShelf,
      reorderBooksInShelf,
    }),
    [shelves, loading, createShelf, updateShelf, deleteShelf, addBookToShelf, removeBookFromShelf, reorderBooksInShelf]
  );

  return <ShelvesContext.Provider value={value}>{children}</ShelvesContext.Provider>;
};

export const useShelves = () => {
  const context = useContext(ShelvesContext);
  if (context === undefined) {
    throw new Error('useShelves must be used within a ShelvesProvider');
  }
  return context;
};
