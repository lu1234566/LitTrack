import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '@/types/book';

const STORAGE_KEY = '@readora_native_books';

export async function loadBooks(): Promise<Book[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return seedBooks;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedBooks;
  } catch {
    return seedBooks;
  }
}

export async function saveBooks(books: Book[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export function calculateProgress(book: Book) {
  if (!book.totalPages || !book.currentPage) return 0;
  return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
}

export const seedBooks: Book[] = [
  {
    id: 'seed-eragon',
    title: 'Eragon',
    author: 'Christopher Paolini',
    genre: 'Fantasia',
    status: 'finished',
    rating: 5,
    totalPages: 509,
    currentPage: 509,
    review: 'Uma fantasia de formação com dragões, jornada e vínculo emocional forte.',
    favoriteQuote: 'A leitura que abre uma porta para Alagaësia.',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  },
  {
    id: 'seed-current',
    title: 'Leitura atual',
    author: 'Adicionar autor',
    genre: 'A definir',
    status: 'reading',
    rating: 0,
    totalPages: 320,
    currentPage: 72,
    review: '',
    favoriteQuote: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];
