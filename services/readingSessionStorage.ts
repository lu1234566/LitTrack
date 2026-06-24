import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingSession } from '@/types/readingSession';

const KEY = '@readora_native_reading_sessions';
const now = Date.now();

export const seedReadingSessions: ReadingSession[] = [
  {
    id: 'session-seed-brisingr-1',
    bookId: 'seed-brisingr',
    bookTitle: 'Brisingr',
    pagesRead: 32,
    minutesRead: 45,
    mood: 'imersivo',
    note: 'Sessao focada em avancar na jornada principal.',
    createdAt: now - 86400000,
    updatedAt: now - 86400000
  },
  {
    id: 'session-seed-eragon-1',
    bookId: 'seed-eragon',
    bookTitle: 'Eragon',
    pagesRead: 51,
    minutesRead: 70,
    mood: 'nostalgico',
    note: 'Trecho marcante para rever o vinculo com Saphira.',
    createdAt: now - 172800000,
    updatedAt: now - 172800000
  }
];

export async function loadReadingSessions(): Promise<ReadingSession[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return seedReadingSessions;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedReadingSessions;
  } catch {
    return seedReadingSessions;
  }
}

export async function saveReadingSessions(sessions: ReadingSession[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
}
