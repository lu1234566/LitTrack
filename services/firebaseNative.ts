import { initializeApp, getApp, getApps } from 'firebase/app';
import { collection, doc, getDocs, getFirestore, setDoc } from 'firebase/firestore';
import { Book } from '@/types/book';
import { Quote } from '@/types/quote';
import { Shelf } from '@/types/shelf';
import { ReadingSession } from '@/types/readingSession';
import { ReaderPreferences } from '@/types/preferences';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

export const isNativeFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

export const nativeFirebaseApp = isNativeFirebaseConfigured ? getApps().length > 0 ? getApp() : initializeApp(firebaseConfig) : null;
export const nativeDb = nativeFirebaseApp ? getFirestore(nativeFirebaseApp) : null;

type SyncBundle = {
  books: Book[];
  quotes: Quote[];
  shelves: Shelf[];
  sessions: ReadingSession[];
  preferences: ReaderPreferences;
};

async function pushCollection<T extends { id: string }>(userId: string, name: string, items: T[]) {
  if (!nativeDb) return 0;
  await Promise.all(items.map((item) => setDoc(doc(nativeDb, 'users', userId, name, item.id), item)));
  return items.length;
}

async function pullCollection<T>(userId: string, name: string): Promise<T[]> {
  if (!nativeDb) return [];
  const snapshot = await getDocs(collection(nativeDb, 'users', userId, name));
  return snapshot.docs.map((item) => item.data() as T);
}

export async function pushBooksToFirestore(userId: string, books: Book[]) {
  if (!nativeDb) return { ok: false, count: 0 };
  const count = await pushCollection(userId, 'books', books);
  return { ok: true, count };
}

export async function pullBooksFromFirestore(userId: string): Promise<Book[]> {
  return pullCollection<Book>(userId, 'books');
}

export async function pushReadoraBundle(userId: string, bundle: SyncBundle) {
  if (!nativeDb) return { ok: false, count: 0 };
  const books = await pushCollection(userId, 'books', bundle.books);
  const quotes = await pushCollection(userId, 'quotes', bundle.quotes);
  const shelves = await pushCollection(userId, 'shelves', bundle.shelves);
  const sessions = await pushCollection(userId, 'sessions', bundle.sessions);
  await setDoc(doc(nativeDb, 'users', userId, 'settings', 'preferences'), bundle.preferences);
  return { ok: true, count: books + quotes + shelves + sessions };
}

export async function pullReadoraBundle(userId: string): Promise<Partial<SyncBundle>> {
  if (!nativeDb) return {};
  const books = await pullCollection<Book>(userId, 'books');
  const quotes = await pullCollection<Quote>(userId, 'quotes');
  const shelves = await pullCollection<Shelf>(userId, 'shelves');
  const sessions = await pullCollection<ReadingSession>(userId, 'sessions');
  const prefs = await pullCollection<ReaderPreferences>(userId, 'settings');
  return { books, quotes, shelves, sessions, preferences: prefs[0] };
}
