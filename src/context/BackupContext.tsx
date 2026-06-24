import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';
import { BackupHistory } from '../types';

interface BackupContextType {
  backupHistory: BackupHistory[];
  logBackupAction: (action: Omit<BackupHistory, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
}

const BackupContext = createContext<BackupContextType | undefined>(undefined);

export const BackupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !db) {
      setBackupHistory([]);
      return;
    }

    const historyQ = query(collection(db, 'backupHistory'), where('userId', '==', user.userId));
    const unsubscribe = onSnapshot(historyQ, (snapshot) => {
      const historyData: BackupHistory[] = [];
      snapshot.forEach((doc) => {
        historyData.push({ ...doc.data(), id: doc.id } as BackupHistory);
      });
      historyData.sort((a, b) => b.createdAt - a.createdAt);
      setBackupHistory(historyData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'backupHistory');
    });

    return unsubscribe;
  }, [user]);

  const logBackupAction = useCallback(async (actionData: Omit<BackupHistory, 'id' | 'userId' | 'createdAt'>) => {
    if (!user || !db) return;
    try {
      await addDoc(collection(db, 'backupHistory'), {
        ...actionData,
        userId: user.userId,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error("Error logging backup action: ", error);
    }
  }, [user]);

  const value = useMemo(() => ({ backupHistory, logBackupAction }), [backupHistory, logBackupAction]);

  return <BackupContext.Provider value={value}>{children}</BackupContext.Provider>;
};

export const useBackup = () => {
  const context = useContext(BackupContext);
  if (context === undefined) throw new Error('useBackup must be used within a BackupProvider');
  return context;
};
