import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quote } from '@/types/quote';

const KEY = '@readora_native_quotes';
const now = Date.now();

export const seedQuotes: Quote[] = [
  {
    id: 'quote-seed-eragon',
    bookId: 'seed-eragon',
    bookTitle: 'Eragon',
    author: 'Christopher Paolini',
    text: 'Uma porta aberta para Alagaesia.',
    page: 42,
    tags: ['fantasia', 'dragao'],
    favorite: true,
    createdAt: now - 60000,
    updatedAt: now - 60000
  },
  {
    id: 'quote-seed-verity',
    bookId: 'seed-verity',
    bookTitle: 'Verity',
    author: 'Colleen Hoover',
    text: 'Nem todo narrador merece confianca.',
    page: 118,
    tags: ['suspense'],
    favorite: false,
    createdAt: now - 30000,
    updatedAt: now - 30000
  }
];

export async function loadQuotes(): Promise<Quote[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return seedQuotes;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedQuotes;
  } catch {
    return seedQuotes;
  }
}

export async function saveQuotes(quotes: Quote[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(quotes));
}
