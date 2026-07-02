import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ReadingSession } from '@/types/readingSession';
import { loadReadingSessions, saveReadingSessions } from '@/services/readingSessionStorage';

type SessionInput = Omit<ReadingSession, 'id' | 'createdAt' | 'updatedAt'> & { date?: number };

type ReadingSessionContextValue = {
  sessions: ReadingSession[];
  loadingSessions: boolean;
  addSession: (session: SessionInput) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  setSessionList: (nextSessions: ReadingSession[]) => Promise<void>;
  sessionsForBook: (bookId: string) => ReadingSession[];
};

const ReadingSessionContext = createContext<ReadingSessionContextValue>({
  sessions: [],
  loadingSessions: true,
  addSession: async () => {},
  deleteSession: async () => {},
  setSessionList: async () => {},
  sessionsForBook: () => []
});

export function ReadingSessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  // Sempre a lista atual — mutadores chamados de closures antigas (callbacks
  // assíncronos) não podem regravar uma lista desatualizada. Ver BookContext.
  const sessionsRef = useRef<ReadingSession[]>([]);

  useEffect(() => {
    loadReadingSessions().then((loaded) => { sessionsRef.current = loaded; setSessions(loaded); }).finally(() => setLoadingSessions(false));
  }, []);

  async function persist(nextSessions: ReadingSession[]) {
    sessionsRef.current = nextSessions;
    setSessions(nextSessions);
    await saveReadingSessions(nextSessions);
  }

  async function setSessionList(nextSessions: ReadingSession[]) {
    await persist(nextSessions);
  }

  async function addSession(input: SessionInput) {
    const now = Date.now();
    const { date, ...rest } = input;
    // `date` lets the user back-date a session (e.g. logging past reading); it
    // becomes the session's createdAt, which drives the streak and heatmap.
    const createdAt = date ?? now;
    await persist([{ ...rest, id: 'session-' + String(now), createdAt, updatedAt: now }, ...sessionsRef.current]);
  }

  async function deleteSession(sessionId: string) {
    await persist(sessionsRef.current.filter((session) => session.id !== sessionId));
  }

  function sessionsForBook(bookId: string) {
    return sessions.filter((session) => session.bookId === bookId).sort((a, b) => b.createdAt - a.createdAt);
  }

  const value = useMemo(() => ({ sessions, loadingSessions, addSession, deleteSession, setSessionList, sessionsForBook }), [sessions, loadingSessions]);
  return <ReadingSessionContext.Provider value={value}>{children}</ReadingSessionContext.Provider>;
}

export function useReadingSessions() {
  return useContext(ReadingSessionContext);
}
