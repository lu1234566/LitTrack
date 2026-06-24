import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';

interface RetrospectiveNarrative {
  year: number;
  narratives: string[];
  updatedAt: number;
}

interface RetrospectiveContextType {
  getNarratives: (year: number) => string[];
  saveNarratives: (year: number, narratives: string[]) => Promise<void>;
  loading: boolean;
}

const RetrospectiveContext = createContext<RetrospectiveContextType | undefined>(undefined);

export const RetrospectiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !db) {
      setData({});
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'retrospectives', user.userId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const docData = doc.data();
        setData(docData.narrativesByYear || {});
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `retrospectives/${user.userId}`);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const getNarratives = useCallback((year: number) => {
    return data[year] || [];
  }, [data]);

  const saveNarratives = useCallback(async (year: number, narratives: string[]) => {
    if (!user || !db) return;
    try {
      const docRef = doc(db, 'retrospectives', user.userId);
      const docSnap = await getDoc(docRef);
      
      let narrativesByYear = {};
      if (docSnap.exists()) {
        narrativesByYear = docSnap.data().narrativesByYear || {};
      }

      await setDoc(docRef, {
        userId: user.userId,
        narrativesByYear: {
          ...narrativesByYear,
          [year]: narratives
        },
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving retrospective narratives:", error);
    }
  }, [user]);

  const value = useMemo(() => ({ getNarratives, saveNarratives, loading }), [getNarratives, saveNarratives, loading]);

  return <RetrospectiveContext.Provider value={value}>{children}</RetrospectiveContext.Provider>;
};

export const useRetrospective = () => {
  const context = useContext(RetrospectiveContext);
  if (context === undefined) throw new Error('useRetrospective must be used within a RetrospectiveProvider');
  return context;
};
