import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, setDoc } from 'firebase/firestore';
import { getAuth, initializeAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut as firebaseSignOut, type Auth, type Persistence, type User } from 'firebase/auth';
import * as FirebaseAuthModule from 'firebase/auth';
import { Book } from '@/types/book';
import { Quote } from '@/types/quote';
import { Shelf } from '@/types/shelf';
import { ReadingSession } from '@/types/readingSession';
import { ReaderPreferences } from '@/types/preferences';
import { SessionUser } from '@/types/sessionUser';

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

// On React Native, persist the auth session with AsyncStorage so the user
// stays logged in across app restarts (getAuth defaults to in-memory there).
// getReactNativePersistence only exists in firebase/auth's RN build, so access
// it defensively; fall back to getAuth if anything is unavailable.
function resolveNativeAuth(app: FirebaseApp): Auth {
  if (Platform.OS === 'web') return getAuth(app);
  const rnPersistence = (FirebaseAuthModule as unknown as {
    getReactNativePersistence?: (storage: unknown) => Persistence;
  }).getReactNativePersistence;
  try {
    if (rnPersistence) {
      return initializeAuth(app, { persistence: rnPersistence(AsyncStorage) });
    }
    return initializeAuth(app);
  } catch {
    return getAuth(app);
  }
}

export const nativeAuth = nativeFirebaseApp ? resolveNativeAuth(nativeFirebaseApp) : null;

type SyncBundle = {
  books: Book[];
  quotes: Quote[];
  shelves: Shelf[];
  sessions: ReadingSession[];
  preferences: ReaderPreferences;
};

export function toSessionUser(user: User | null): SessionUser | null {
  if (!user) return null;
  return { uid: user.uid, displayName: user.displayName, email: user.email, photoURL: user.photoURL };
}

export function listenToFirebaseUser(callback: (user: SessionUser | null) => void) {
  if (!nativeAuth) return () => {};
  return onAuthStateChanged(nativeAuth, (user) => callback(toSessionUser(user)));
}

export async function signInFirebaseWithGoogleIdToken(idToken: string) {
  if (!nativeAuth) throw new Error('Firebase Auth não configurado.');
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(nativeAuth, credential);
  return toSessionUser(result.user);
}

export async function signOutFirebaseUser() {
  if (!nativeAuth) return;
  await firebaseSignOut(nativeAuth);
}

// Upserts every local item and deletes ONLY the ids the caller explicitly asks
// to remove (tombstones). It never bulk-deletes "remote docs missing locally":
// doing so would wipe cloud data whenever a device synced from an empty or
// partial local state (e.g. a fresh install before the first pull completes).
async function syncCollection<T extends { id: string }>(userId: string, name: string, items: T[], deleteIds: string[] = []) {
  if (!nativeDb) return 0;
  await Promise.all([
    ...items.map((item) => setDoc(doc(nativeDb, 'users', userId, name, item.id), item)),
    ...deleteIds.map((id) => deleteDoc(doc(nativeDb, 'users', userId, name, id)))
  ]);
  return items.length;
}

async function pullCollection<T>(userId: string, name: string): Promise<T[]> {
  if (!nativeDb) return [];
  const snapshot = await getDocs(collection(nativeDb, 'users', userId, name));
  return snapshot.docs.map((item) => item.data() as T);
}

export async function pushBooksToFirestore(userId: string, books: Book[]) {
  if (!nativeDb) return { ok: false, count: 0 };
  const count = await syncCollection(userId, 'books', books);
  return { ok: true, count };
}

export async function pullBooksFromFirestore(userId: string): Promise<Book[]> {
  return pullCollection<Book>(userId, 'books');
}

export type SyncDeletions = Partial<Record<'books' | 'quotes' | 'shelves' | 'sessions', string[]>>;

export async function pushReadoraBundle(userId: string, bundle: SyncBundle, deletions: SyncDeletions = {}) {
  if (!nativeDb) return { ok: false, count: 0 };
  const books = await syncCollection(userId, 'books', bundle.books, deletions.books);
  const quotes = await syncCollection(userId, 'quotes', bundle.quotes, deletions.quotes);
  const shelves = await syncCollection(userId, 'shelves', bundle.shelves, deletions.shelves);
  const sessions = await syncCollection(userId, 'sessions', bundle.sessions, deletions.sessions);
  await setDoc(doc(nativeDb, 'users', userId, 'settings', 'preferences'), bundle.preferences);
  await setDoc(doc(nativeDb, 'users', userId, 'sync', 'metadata'), { updatedAt: Date.now(), books, quotes, shelves, sessions });
  return { ok: true, count: books + quotes + shelves + sessions };
}

export async function pullReadoraBundle(userId: string): Promise<Partial<SyncBundle>> {
  if (!nativeDb) return {};
  const books = await pullCollection<Book>(userId, 'books');
  const quotes = await pullCollection<Quote>(userId, 'quotes');
  const shelves = await pullCollection<Shelf>(userId, 'shelves');
  const sessions = await pullCollection<ReadingSession>(userId, 'sessions');
  const prefDoc = await getDoc(doc(nativeDb, 'users', userId, 'settings', 'preferences'));
  return { books, quotes, shelves, sessions, preferences: prefDoc.exists() ? prefDoc.data() as ReaderPreferences : undefined };
}
