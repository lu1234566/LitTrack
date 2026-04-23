import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';
import { LiteraryProfile } from '../types';

interface LiteraryProfileContextType {
  literaryProfile: LiteraryProfile | null;
  saveLiteraryProfile: (profile: LiteraryProfile) => Promise<void>;
}

const LiteraryProfileContext = createContext<LiteraryProfileContextType | undefined>(undefined);

export const LiteraryProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [literaryProfile, setLiteraryProfile] = useState<LiteraryProfile | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !db) {
      setLiteraryProfile(null);
      return;
    }

    const profileRef = doc(db, 'profiles', user.userId);
    const unsubscribe = onSnapshot(profileRef, (doc) => {
      if (doc.exists()) {
        setLiteraryProfile(doc.data() as LiteraryProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${user.userId}`);
    });

    return unsubscribe;
  }, [user]);

  const saveLiteraryProfile = useCallback(async (profile: LiteraryProfile) => {
    if (!user || !db) return;
    try {
      const profileRef = doc(db, 'profiles', user.userId);
      await setDoc(profileRef, profile);
    } catch (error) {
      console.error("Error saving literary profile: ", error);
      throw error;
    }
  }, [user]);

  const value = useMemo(() => ({ literaryProfile, saveLiteraryProfile }), [literaryProfile, saveLiteraryProfile]);

  return <LiteraryProfileContext.Provider value={value}>{children}</LiteraryProfileContext.Provider>;
};

export const useLiteraryProfile = () => {
  const context = useContext(LiteraryProfileContext);
  if (context === undefined) throw new Error('useLiteraryProfile must be used within a LiteraryProfileProvider');
  return context;
};
