import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Try to get config from environment variables as a fallback
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Attempt to load the applet config using a pattern that won't break if missing
// We use import.meta.glob which is a Vite feature to safely check for file existence
let appletConfig: any = {};
try {
  const configs = import.meta.glob('../../firebase-applet-config.json', { eager: true });
  const configPath = '../../firebase-applet-config.json';
  if (configs[configPath]) {
    appletConfig = (configs[configPath] as any).default || configs[configPath];
  }
} catch (e) {
  console.warn("Firebase applet config could not be loaded statically:", e);
}

// Merge configurations: envConfig takes precedence over appletConfig as requested
const firebaseConfig = {
  apiKey: envConfig.apiKey || appletConfig.apiKey,
  authDomain: envConfig.authDomain || appletConfig.authDomain,
  projectId: envConfig.projectId || appletConfig.projectId,
  storageBucket: envConfig.storageBucket || appletConfig.storageBucket,
  messagingSenderId: envConfig.messagingSenderId || appletConfig.messagingSenderId,
  appId: envConfig.appId || appletConfig.appId,
};

// Validate if we have enough to initialize
export const isConfigValid = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.appId
);

let app: any = null;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;
let initialized = false;

if (isConfigValid) {
  // Debug log (redacted)
  if (import.meta.env.DEV) {
    console.log("Initializing Firebase with:", {
      projectId: firebaseConfig.projectId,
      hasApiKey: !!firebaseConfig.apiKey,
      apiKeyPrefix: firebaseConfig.apiKey?.substring(0, 6) + "...",
      authDomain: firebaseConfig.authDomain
    });
  }
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    // Safety: Custom database ID might be in appletConfig or env
    const firestoreDatabaseId = appletConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID;
    
    if (firestoreDatabaseId) {
      db = getFirestore(app, firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
    
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    initialized = true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export const isFirebaseConfigured = initialized;
export { auth, db, googleProvider };
