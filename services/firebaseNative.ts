import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, setDoc } from 'firebase/firestore';
// Firebase 12 exposes getReactNativePersistence from its React Native bundle at runtime,
// but its generic TypeScript declarations used by Expo can omit that conditional export.
// @ts-ignore -- valid RN conditional export; see Firebase RN auth persistence docs.
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type User
} from 'firebase/auth';
import { Book } from '@/types/book';
import { Quote } from '@/types/quote';
import { Shelf } from '@/types/shelf';
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

// React Native does not have browser localStorage. Firebase must be initialized
// explicitly with the RN persistence adapter or the authenticated user can live
// only in memory and disappear after the process is killed. Importing
// getReactNativePersistence directly is intentional: Metro can omit the
// RN-specific export from a namespace/dynamic lookup, which previously made the
// code silently fall back to non-persistent auth.
function resolveNativeAuth(app: FirebaseApp): Auth {
  if (Platform.OS === 'web') return getAuth(app);

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    // During Fast Refresh / module reload the Auth instance may already exist.
    // Reuse it in that case. On a normal cold start initializeAuth above is the
    // path taken, so the instance is backed by AsyncStorage.
    return getAuth(app);
  }
}

export const nativeAuth = nativeFirebaseApp ? resolveNativeAuth(nativeFirebaseApp) : null;

type SyncBundle = {
  books: Book[];
  quotes: Quote[];
  shelves: Shelf[];
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

/**
 * Login na WEB. No navegador não existe o fluxo nativo do expo-auth-session
 * (que depende do redirect por esquema de URI do app), então usamos o popup do
 * próprio Firebase. O uid resultante é o MESMO do app — é isso que faz a
 * biblioteca do celular aparecer no site.
 */
export async function signInFirebaseWithGooglePopup() {
  if (!nativeAuth) throw new Error('Firebase Auth não configurado.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(nativeAuth, provider);
  return toSessionUser(result.user);
}

export async function signOutFirebaseUser() {
  if (!nativeAuth) return;
  await firebaseSignOut(nativeAuth);
}

// Firestore rejeita valores `undefined` (setDoc lança na hora) — e campos
// opcionais como startedAt/finishedAt existem como undefined em objetos recém-
// importados na memória. O round-trip JSON descarta essas chaves.
function dropUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// Upserts every local item and deletes ONLY the ids the caller explicitly asks
// to remove (tombstones). It never bulk-deletes "remote docs missing locally":
// doing so would wipe cloud data whenever a device synced from an empty or
// partial local state (e.g. a fresh install before the first pull completes).
async function syncCollection<T extends { id: string }>(userId: string, name: string, items: T[], deleteIds: string[] = []) {
  if (!nativeDb) return 0;
  await Promise.all([
    ...items.map((item) => setDoc(doc(nativeDb, 'users', userId, name, item.id), dropUndefined(item))),
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

export type SyncDeletions = Partial<Record<'books' | 'quotes' | 'shelves', string[]>>;

export async function pushReadoraBundle(userId: string, bundle: SyncBundle, deletions: SyncDeletions = {}) {
  if (!nativeDb) return { ok: false, count: 0 };
  const books = await syncCollection(userId, 'books', bundle.books, deletions.books);
  const quotes = await syncCollection(userId, 'quotes', bundle.quotes, deletions.quotes);
  const shelves = await syncCollection(userId, 'shelves', bundle.shelves, deletions.shelves);
  await setDoc(doc(nativeDb, 'users', userId, 'settings', 'preferences'), dropUndefined(bundle.preferences));
  await setDoc(doc(nativeDb, 'users', userId, 'sync', 'metadata'), { updatedAt: Date.now(), books, quotes, shelves });
  return { ok: true, count: books + quotes + shelves };
}

export async function pullReadoraBundle(userId: string): Promise<Partial<SyncBundle>> {
  if (!nativeDb) return {};
  const books = await pullCollection<Book>(userId, 'books');
  const quotes = await pullCollection<Quote>(userId, 'quotes');
  const shelves = await pullCollection<Shelf>(userId, 'shelves');
  const prefDoc = await getDoc(doc(nativeDb, 'users', userId, 'settings', 'preferences'));
  return { books, quotes, shelves, preferences: prefDoc.exists() ? prefDoc.data() as ReaderPreferences : undefined };
}

/**
 * Apaga a coleção `sessions` que ficou na nuvem de quando existiam sessões de
 * leitura. Roda uma vez por dispositivo depois do primeiro pull: nada mais lê
 * esses documentos, e deixá-los só ocupa espaço e confunde quem abrir o banco.
 * Falha silenciosa de propósito — é limpeza, não pode atrapalhar o app.
 */
export async function purgeRemoteReadingSessions(userId: string) {
  if (!nativeDb) return 0;
  try {
    const snapshot = await getDocs(collection(nativeDb, 'users', userId, 'sessions'));
    if (snapshot.empty) return 0;
    await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
    return snapshot.size;
  } catch {
    return 0;
  }
}
