import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';
import { UserGoal } from '../types';

interface GoalsContextType {
  userGoal: UserGoal | null;
  saveUserGoal: (goal: Omit<UserGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const GoalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !db) {
      setUserGoal(null);
      return;
    }

    const currentYear = new Date().getFullYear();
    const goalRef = doc(db, 'userGoals', `${user.userId}_${currentYear}`);
    const unsubscribe = onSnapshot(goalRef, (doc) => {
      if (doc.exists()) {
        setUserGoal(doc.data() as UserGoal);
      } else {
        setUserGoal(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `userGoals/${user.userId}_${currentYear}`);
    });

    return unsubscribe;
  }, [user]);

  const saveUserGoal = useCallback(async (goalData: Omit<UserGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !db) return;
    try {
      const goalId = `${user.userId}_${goalData.year}`;
      const goalRef = doc(db, 'userGoals', goalId);
      const existingGoal = await getDoc(goalRef);
      
      const now = Date.now();
      const goal: UserGoal = {
        ...goalData,
        id: goalId,
        userId: user.userId,
        createdAt: existingGoal.exists() ? existingGoal.data().createdAt : now,
        updatedAt: now
      };
      
      await setDoc(goalRef, goal);
    } catch (error) {
      console.error("Error saving user goal: ", error);
      throw error;
    }
  }, [user]);

  const value = useMemo(() => ({ userGoal, saveUserGoal }), [userGoal, saveUserGoal]);

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
};

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (context === undefined) throw new Error('useGoals must be used within a GoalsProvider');
  return context;
};
