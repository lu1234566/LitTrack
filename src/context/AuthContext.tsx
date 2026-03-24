import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, browserPopupRedirectResolver } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData: UserData = {
          userId: firebaseUser.uid,
          name: firebaseUser.displayName || 'Usuário',
          email: firebaseUser.email || '',
          profilePhoto: firebaseUser.photoURL || '',
        };
        
        try {
          // Save user to Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              id: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              bio: '',
              communityPublic: true,
              showBooksPublicly: true,
              showStatsPublicly: true,
              booksRead: 0,
              pagesRead: 0,
              averageRating: 0,
              favoriteGenre: '',
              readingStreak: 0,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
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
    if (!isFirebaseConfigured || !auth) {
      alert("Firebase não está configurado. Verifique as variáveis de ambiente.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    } catch (error) {
      console.error('Error signing in with Google:', error);
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
