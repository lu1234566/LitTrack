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

// Merge configurations: envConfig takes precedence.
// If valid ENV config exists, we use ONLY that to avoid cross-project contamination.
const isEnvConfigComplete = !!(envConfig.apiKey && envConfig.projectId && envConfig.appId);

const firebaseConfig = isEnvConfigComplete ? { ...envConfig } : {
  apiKey: appletConfig.apiKey || envConfig.apiKey,
  authDomain: appletConfig.authDomain || envConfig.authDomain,
  projectId: appletConfig.projectId || envConfig.projectId,
  storageBucket: appletConfig.storageBucket || envConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId || envConfig.messagingSenderId,
  appId: appletConfig.appId || envConfig.appId,
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
  // Enhanced Debug Log for AI Studio Stability
  if (import.meta.env.DEV) {
    console.log(`[Firebase] Config Source: ${isEnvConfigComplete ? 'ENV (VITE_FIREBASE_*)' : 'APPLET_CONFIG'}`);
    console.log(`[Firebase] Project: ${firebaseConfig.projectId}`);
  }
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    // Initialize Firestore
    // For the default database, the ID is "(default)". Using projectId here causes connection errors.
    db = appletConfig.firestoreDatabaseId ? getFirestore(app, appletConfig.firestoreDatabaseId) : getFirestore(app);
    
    if (import.meta.env.DEV) {
      console.log(`[Firebase] Database Status: Connected to ${appletConfig.firestoreDatabaseId || '(default)'}`);
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
