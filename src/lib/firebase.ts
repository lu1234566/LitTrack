import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

type ExtendedFirebaseOptions = FirebaseOptions & {
  firestoreDatabaseId?: string;
};

const env = (import.meta as any)?.env ?? {};

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildEnvConfig(): ExtendedFirebaseOptions | null {
  const config: ExtendedFirebaseOptions = {
    apiKey: readString(env.VITE_FIREBASE_API_KEY),
    authDomain: readString(env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: readString(env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: readString(env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: readString(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: readString(env.VITE_FIREBASE_APP_ID),
    measurementId: readString(env.VITE_FIREBASE_MEASUREMENT_ID),
    firestoreDatabaseId: readString(env.VITE_FIRESTORE_DATABASE_ID),
  };

  const hasRequiredFields = Boolean(
    config.apiKey && config.authDomain && config.projectId && config.appId
  );

  return hasRequiredFields ? config : null;
}

function buildGlobalConfig(): ExtendedFirebaseOptions | null {
  const globalConfig = (globalThis as any).__FIREBASE_CONFIG__ || (globalThis as any).firebaseConfig;

  if (!globalConfig || typeof globalConfig !== 'object') {
    return null;
  }

  const config: ExtendedFirebaseOptions = {
    apiKey: readString(globalConfig.apiKey),
    authDomain: readString(globalConfig.authDomain),
    projectId: readString(globalConfig.projectId),
    storageBucket: readString(globalConfig.storageBucket),
    messagingSenderId: readString(globalConfig.messagingSenderId),
    appId: readString(globalConfig.appId),
    measurementId: readString(globalConfig.measurementId),
    firestoreDatabaseId: readString(globalConfig.firestoreDatabaseId),
  };

  const hasRequiredFields = Boolean(
    config.apiKey && config.authDomain && config.projectId && config.appId
  );

  return hasRequiredFields ? config : null;
}

function resolveFirebaseConfig(): ExtendedFirebaseOptions | null {
  return buildEnvConfig() || buildGlobalConfig();
}

const firebaseConfig = resolveFirebaseConfig();

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let isFirebaseConfigured = false;

if (firebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    if (firebaseConfig.firestoreDatabaseId) {
      db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }

    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    isFirebaseConfigured = true;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.warn(
    'Firebase configuration is unavailable. Readora is running in safe mode without Firebase.'
  );
}

export { auth, db, googleProvider, isFirebaseConfigured };
