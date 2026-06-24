import { initializeApp, getApp, getApps } from 'firebase/app';
import { collection, doc, getDocs, getFirestore, setDoc } from 'firebase/firestore';
import { Book } from '@/types/book';

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

export async function pushBooksToFirestore(userId: string, books: Book[]) {
  if (!nativeDb) return { ok: false, count: 0 };
  await Promise.all(books.map((book) => setDoc(doc(nativeDb, 'users', userId, 'books', book.id), book)));
  return { ok: true, count: books.length };
}

export async function pullBooksFromFirestore(userId: string): Promise<Book[]> {
  if (!nativeDb) return [];
  const snapshot = await getDocs(collection(nativeDb, 'users', userId, 'books'));
  return snapshot.docs.map((item) => item.data() as Book);
}
