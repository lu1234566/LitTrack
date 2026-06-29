import { useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { useSession } from '@/contexts/SessionContext';
import { useShelves } from '@/contexts/ShelfContext';
import { isNativeFirebaseConfigured, pullReadoraBundle, pushReadoraBundle } from '@/services/firebaseNative';
import { appColors } from '@/theme/tokens';

export function AutoSyncBridge() {
  const { user } = useSession();
  const { books, replaceBooks } = useBooks();
  const { quotes, setQuoteList } = useQuotes();
  const { shelves, setShelfList } = useShelves();
  const { sessions, setSessionList } = useReadingSessions();
  const { preferences, updatePreferences } = usePreferences();
  const [status, setStatus] = useState('');
  const firstPullDone = useRef(false);
  const lastPayload = useRef('');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const userId: string = user?.uid ?? '';
    if (!userId || !isNativeFirebaseConfigured || firstPullDone.current) return;
    firstPullDone.current = true;
    let cancelled = false;
    async function pull(currentUserId: string) {
      setStatus('Sincronizando dados remotos...');
      try {
        const bundle = await pullReadoraBundle(currentUserId);
        if (cancelled) return;
        if (bundle.books?.length) await replaceBooks(mergeByUpdatedAt(books, bundle.books));
        if (bundle.quotes?.length) await setQuoteList(mergeByUpdatedAt(quotes, bundle.quotes));
        if (bundle.shelves?.length) await setShelfList(mergeByUpdatedAt(shelves, bundle.shelves));
        if (bundle.sessions?.length) await setSessionList(mergeByUpdatedAt(sessions, bundle.sessions));
        if (bundle.preferences) await updatePreferences({ ...preferences, ...bundle.preferences });
        setStatus('Dados sincronizados.');
      } catch {
        setStatus('Não foi possível receber dados remotos.');
      }
    }
    pull(userId);
    return () => { cancelled = true; };
  }, [user?.uid]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const userId: string = user?.uid ?? '';
    if (!userId || !isNativeFirebaseConfigured) return;
    const payload = JSON.stringify({ books, quotes, shelves, sessions, preferences });
    if (payload === lastPayload.current) return;
    lastPayload.current = payload;
    const timeout = setTimeout(async () => {
      try {
        setStatus('Salvando na nuvem...');
        const result = await pushReadoraBundle(userId, { books, quotes, shelves, sessions, preferences });
        setStatus(result.ok ? 'Sincronizado com a nuvem.' : 'Firebase não configurado.');
      } catch {
        setStatus('Erro ao sincronizar com a nuvem.');
      }
    }, 1800);
    return () => clearTimeout(timeout);
  }, [user?.uid, books, quotes, shelves, sessions, preferences]);

  if (Platform.OS === 'web' || !user || !status) return null;
  return <View style={{ position: 'absolute', right: 14, bottom: 14, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, zIndex: 100 }}><Text style={{ color: appColors.textMuted, fontSize: 11, fontWeight: '900' }}>{status}</Text></View>;
}

function mergeByUpdatedAt<T extends { id: string; updatedAt?: number }>(local: T[], remote: T[]) {
  const map = new Map<string, T>();
  [...local, ...remote].forEach((item) => {
    const current = map.get(item.id);
    // Strictly-newer wins; on a tie the first seen (local) is kept, so an
    // offline edit isn't clobbered by stale remote data with the same timestamp.
    if (!current || (item.updatedAt || 0) > (current.updatedAt || 0)) map.set(item.id, item);
  });
  return Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
