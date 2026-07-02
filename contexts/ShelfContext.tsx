import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Shelf } from '@/types/shelf';
import { loadShelves, saveShelves } from '@/services/shelfStorage';

type ShelfInput = Omit<Shelf, 'id' | 'createdAt' | 'updatedAt'>;

type ShelfContextValue = {
  shelves: Shelf[];
  loadingShelves: boolean;
  addShelf: (shelf: ShelfInput) => Promise<void>;
  updateShelf: (shelfId: string, patch: Partial<Shelf>) => Promise<void>;
  deleteShelf: (shelfId: string) => Promise<void>;
  setShelfList: (nextShelves: Shelf[]) => Promise<void>;
  toggleBookInShelf: (shelfId: string, bookId: string) => Promise<void>;
};

const ShelfContext = createContext<ShelfContextValue>({
  shelves: [],
  loadingShelves: true,
  addShelf: async () => {},
  updateShelf: async () => {},
  deleteShelf: async () => {},
  setShelfList: async () => {},
  toggleBookInShelf: async () => {}
});

export function ShelfProvider({ children }: { children: React.ReactNode }) {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loadingShelves, setLoadingShelves] = useState(true);
  // Sempre a lista atual — mutadores chamados de closures antigas (callbacks
  // assíncronos) não podem regravar uma lista desatualizada. Ver BookContext.
  const shelvesRef = useRef<Shelf[]>([]);

  useEffect(() => {
    loadShelves().then((loaded) => { shelvesRef.current = loaded; setShelves(loaded); }).finally(() => setLoadingShelves(false));
  }, []);

  async function persist(nextShelves: Shelf[]) {
    shelvesRef.current = nextShelves;
    setShelves(nextShelves);
    await saveShelves(nextShelves);
  }

  async function setShelfList(nextShelves: Shelf[]) {
    await persist(nextShelves);
  }

  async function addShelf(input: ShelfInput) {
    const now = Date.now();
    await persist([{ ...input, id: 'shelf-' + String(now), createdAt: now, updatedAt: now }, ...shelvesRef.current]);
  }

  async function updateShelf(shelfId: string, patch: Partial<Shelf>) {
    await persist(shelvesRef.current.map((shelf) => shelf.id === shelfId ? { ...shelf, ...patch, updatedAt: Date.now() } : shelf));
  }

  async function deleteShelf(shelfId: string) {
    await persist(shelvesRef.current.filter((shelf) => shelf.id !== shelfId));
  }

  async function toggleBookInShelf(shelfId: string, bookId: string) {
    await persist(shelvesRef.current.map((shelf) => {
      if (shelf.id !== shelfId) return shelf;
      const hasBook = shelf.bookIds.includes(bookId);
      const bookIds = hasBook ? shelf.bookIds.filter((item) => item !== bookId) : [...shelf.bookIds, bookId];
      return { ...shelf, bookIds, updatedAt: Date.now() };
    }));
  }

  const value = useMemo(() => ({ shelves, loadingShelves, addShelf, updateShelf, deleteShelf, setShelfList, toggleBookInShelf }), [shelves, loadingShelves]);
  return <ShelfContext.Provider value={value}>{children}</ShelfContext.Provider>;
}

export function useShelves() {
  return useContext(ShelfContext);
}
