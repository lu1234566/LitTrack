import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';
import { Recommendation } from '../types';

interface RecommendationsContextType {
  recommendations: Recommendation[];
  saveRecommendations: (recommendations: Recommendation[]) => Promise<void>;
}

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

export const RecommendationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !db) {
      setRecommendations([]);
      return;
    }

    const recommendationsRef = doc(db, 'recommendations', user.userId);
    const unsubscribe = onSnapshot(recommendationsRef, (doc) => {
      if (doc.exists()) {
        setRecommendations(doc.data().list as Recommendation[]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `recommendations/${user.userId}`);
    });

    return unsubscribe;
  }, [user]);

  const saveRecommendations = useCallback(async (recs: Recommendation[]) => {
    if (!user || !db) return;
    try {
      const recommendationsRef = doc(db, 'recommendations', user.userId);
      await setDoc(recommendationsRef, { list: recs, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error("Error saving recommendations: ", error);
      throw error;
    }
  }, [user]);

  const value = useMemo(() => ({ recommendations, saveRecommendations }), [recommendations, saveRecommendations]);

  return <RecommendationsContext.Provider value={value}>{children}</RecommendationsContext.Provider>;
};

export const useRecommendations = () => {
  const context = useContext(RecommendationsContext);
  if (context === undefined) throw new Error('useRecommendations must be used within a RecommendationsProvider');
  return context;
};
