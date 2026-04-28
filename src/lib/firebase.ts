import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app;
let auth: any;
let db: any;
let googleProvider: any;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // CRITICAL: Must use firestoreDatabaseId from config
  db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export const isFirebaseConfigured = true;
export { auth, db, googleProvider };
