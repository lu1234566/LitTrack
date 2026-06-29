import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '@/types/book';

const STORAGE_KEY = '@readora_native_books';
const now = Date.now();
const day = 86400000;

export async function loadBooks(): Promise<Book[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveBooks(books: Book[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export function calculateProgress(book: Book) {
  if (!book.totalPages || !book.currentPage) return book.status === 'finished' ? 100 : 0;
  return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
}

export function statusLabel(status: Book['status']) {
  if (status === 'finished') return 'Lido';
  if (status === 'wishlist') return 'Quero ler';
  return 'Lendo';
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
    review: 'Fantasia de formacao com dragao, jornada e vinculo emocional forte.',
    favoriteQuote: 'Uma porta aberta para Alagaesia.',
    publisher: 'Rocco',
    publishedDate: '2003',
    priority: 'alta',
    reasonToRead: 'Universo de fantasia, dragao e aventura classica.',
    mood: 'epico',
    notes: 'Bom exemplo para testar perfil literario e tags de fantasia.',
    createdAt: now - day * 20,
    updatedAt: now - day * 10,
    startedAt: now - day * 18,
    finishedAt: now - day * 10
  },
  {
    id: 'seed-brisingr',
    title: 'Brisingr',
    author: 'Christopher Paolini',
    genre: 'Fantasia',
    status: 'reading',
    rating: 4,
    totalPages: 760,
    currentPage: 245,
    review: 'Leitura longa, com ritmo de saga e muita construcao de mundo.',
    favoriteQuote: 'A forca de uma promessa move a jornada.',
    publisher: 'Rocco',
    publishedDate: '2008',
    priority: 'alta',
    reasonToRead: 'Continuar a saga da Heranca.',
    mood: 'imersivo',
    notes: 'Livro ideal para testar progresso e paginas lidas.',
    createdAt: now - day * 7,
    updatedAt: now - day
  },
  {
    id: 'seed-verity',
    title: 'Verity',
    author: 'Colleen Hoover',
    genre: 'Suspense',
    status: 'finished',
    rating: 4,
    totalPages: 320,
    currentPage: 320,
    review: 'Suspense de leitura rapida com tensao e reviravoltas.',
    favoriteQuote: 'Nem todo narrador merece confianca.',
    publisher: 'Galera',
    publishedDate: '2018',
    priority: 'media',
    reasonToRead: 'Testar categorias de suspense e leituras rapidas.',
    mood: 'tenso',
    notes: 'Ajuda a diversificar o perfil literario.',
    createdAt: now - day * 40,
    updatedAt: now - day * 35,
    startedAt: now - day * 39,
    finishedAt: now - day * 35
  },
  {
    id: 'seed-wishlist',
    title: 'O Nome do Vento',
    author: 'Patrick Rothfuss',
    genre: 'Fantasia',
    status: 'wishlist',
    rating: 0,
    totalPages: 656,
    currentPage: 0,
    review: '',
    favoriteQuote: '',
    publisher: 'Arqueiro',
    publishedDate: '2007',
    priority: 'media',
    reasonToRead: 'Fantasia musical, academica e memoravel.',
    mood: 'curioso',
    notes: 'Fica na lista de proximas leituras.',
    createdAt: now - day * 2,
    updatedAt: now - day * 2
  }
];
