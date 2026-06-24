import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ReadingSession } from '@/types/readingSession';
import { loadReadingSessions, saveReadingSessions } from '@/services/readingSessionStorage';

type SessionInput = Omit<ReadingSession, 'id' | 'createdAt' | 'updatedAt'>;

type ReadingSessionContextValue = {
  sessions: ReadingSession[];
  loadingSessions: boolean;
  addSession: (session: SessionInput) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  sessionsForBook: (bookId: string) => ReadingSession[];
};

const ReadingSessionContext = createContext<ReadingSessionContextValue>({
  sessions: [],
  loadingSessions: true,
  addSession: async () => {},
  deleteSession: async () => {},
  sessionsForBook: () => []
});

export function ReadingSessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    loadReadingSessions().then(setSessions).finally(() => setLoadingSessions(false));
  }, []);

  async function persist(nextSessions: ReadingSession[]) {
    setSessions(nextSessions);
    await saveReadingSessions(nextSessions);
  }

  async function addSession(input: SessionInput) {
    const now = Date.now();
    await persist([{ ...input, id: 'session-' + String(now), createdAt: now, updatedAt: now }, ...sessions]);
  }

  async function deleteSession(sessionId: string) {
    await persist(sessions.filter((session) => session.id !== sessionId));
  }

  function sessionsForBook(bookId: string) {
    return sessions.filter((session) => session.bookId === bookId).sort((a, b) => b.createdAt - a.createdAt);
  }

  const value = useMemo(() => ({ sessions, loadingSessions, addSession, deleteSession, sessionsForBook }), [sessions, loadingSessions]);
  return <ReadingSessionContext.Provider value={value}>{children}</ReadingSessionContext.Provider>;
}

export function useReadingSessions() {
  return useContext(ReadingSessionContext);
}
