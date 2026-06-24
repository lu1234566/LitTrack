import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration from environment variables
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
};

// Attempt to load the applet config from the project root
let appletConfig: any = {};
try {
  // Use import.meta.glob to find the config file in the root
  const configs = import.meta.glob('../../firebase-applet-config.json', { eager: true });
  const configKey = Object.keys(configs).find(k => k.endsWith('firebase-applet-config.json'));
  
  if (configKey && configs[configKey]) {
    appletConfig = (configs[configKey] as any).default || configs[configKey];
  }
} catch (e) {
  console.warn("Firebase applet config loading failed:", e);
}

// Merge configurations: if valid ENV config exists, we use ONLY that.
const isEnvConfigComplete = !!(envConfig.apiKey && envConfig.projectId && envConfig.appId);

const firebaseConfig = isEnvConfigComplete ? { ...envConfig } : {
  apiKey: appletConfig.apiKey || envConfig.apiKey,
  authDomain: appletConfig.authDomain || envConfig.authDomain,
  projectId: appletConfig.projectId || envConfig.projectId,
  storageBucket: appletConfig.storageBucket || envConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId || envConfig.messagingSenderId,
  appId: appletConfig.appId || envConfig.appId,
};

// If ENV is complete, we use ONLY envConfig.databaseId (ignoring appletConfig)
// This ensures we connect to the default database of the ENV project unless explicitly specified.
const activeDatabaseId = isEnvConfigComplete ? envConfig.databaseId : (envConfig.databaseId || appletConfig.firestoreDatabaseId);

// Validation for initialization
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
  if (import.meta.env.DEV) {
    console.log(`[Firebase] Config Source: ${isEnvConfigComplete ? 'ENV (VITE_FIREBASE_*)' : 'APPLET_CONFIG'}`);
    console.log(`[Firebase] Project: ${firebaseConfig.projectId}`);
    console.log(`[Firebase] Auth Domain: ${firebaseConfig.authDomain}`);
  }
  
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    // Initialize Firestore
    // Use getFirestore(app) (default database) unless activeDatabaseId is explicitly set and non-empty
    db = (activeDatabaseId && activeDatabaseId.trim() !== "") ? getFirestore(app, activeDatabaseId) : getFirestore(app);
    
    if (import.meta.env.DEV) {
      console.log(`[Firebase] Initialization SUCCESS`);
      console.log(`[Firebase] Configured Project: ${firebaseConfig.projectId}`);
      console.log(`[Firebase] Active Firestore Database: ${activeDatabaseId || '(default)'}`);
      
      if (!isEnvConfigComplete && !appletConfig.projectId) {
        console.warn("[Firebase] WARNING: No project ID found in applet config or ENV.");
      }
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
