import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, browserPopupRedirectResolver } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';

async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc from server to test connection
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The Firestore client is offline.");
    }
    // Skip logging for other errors (like permission denied), as this is simply a connection test.
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

interface UserData {
  userId: string;
  name: string;
  email: string;
  profilePhoto: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  isConfigured: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setLoading(false);
      return;
    }

    testConnection().catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData: UserData = {
          userId: firebaseUser.uid,
          name: firebaseUser.displayName || 'Usuário',
          email: firebaseUser.email || '',
          profilePhoto: firebaseUser.photoURL || '',
        };
        
        try {
          if (!db) {
            console.warn("Firestore is not available. User profile will not be synced.");
            setUser(userData);
            setLoading(false);
            return;
          }

          // Test connection and permissions
          const userRef = doc(db, 'users', firebaseUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (e) {
            handleFirestoreError(e, OperationType.GET, `users/${firebaseUser.uid}`);
          }
          
          if (!userSnap?.exists()) {
            try {
              await setDoc(userRef, {
                id: firebaseUser.uid,
                displayName: firebaseUser.displayName || 'Usuário',
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || '',
                bio: '',
                booksRead: 0,
                pagesRead: 0,
                averageRating: 0,
                favoriteGenre: '',
                readingStreak: 0,
                createdAt: Date.now(),
                updatedAt: Date.now()
              });
            } catch (e) {
              handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}`);
            }
          }
        } catch (e) {
          console.error("Error syncing user to Firestore:", e);
        }
        
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = React.useCallback(async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      alert("Configuração do Firebase indisponível. O app está em modo seguro.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        console.error('Network error during sign-in. This often happens if the Firebase Auth Domain is not correctly configured or allowlisted.');
        alert("Erro de rede ao fazer login. Verifique se o domínio do app está autorizado no console do Firebase.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("O popup de login foi bloqueado pelo navegador. Por favor, permita popups para este site.");
      } else {
        console.error('Error signing in with Google:', error);
        alert(`Erro ao entrar com Google: ${error.message}`);
      }
      throw error;
    }
  }, []);

  const logout = React.useCallback(async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  const value = React.useMemo(() => ({ 
    user, 
    loading, 
    isConfigured: isFirebaseConfigured, 
    loginWithGoogle, 
    logout 
  }), [user, loading, loginWithGoogle, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
