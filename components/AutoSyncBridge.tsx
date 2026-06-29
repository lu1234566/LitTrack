import { useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { useSession } from '@/contexts/SessionContext';
import { useShelves } from '@/contexts/ShelfContext';
import { isNativeFirebaseConfigured, pullReadoraBundle, pushReadoraBundle } from '@/services/firebaseNative';
import { addTombstones, clearTombstones, dropTombstoned, loadTombstones, SyncCollectionName, tombstoneIds } from '@/services/syncTombstones';
import { appColors } from '@/theme/tokens';

const SYNC_KEY = '@readora_last_sync';

function formatSyncTime(ts: number) {
  return new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function AutoSyncBridge() {
  const { user } = useSession();
  const { books, replaceBooks } = useBooks();
  const { quotes, setQuoteList } = useQuotes();
  const { shelves, setShelfList } = useShelves();
  const { sessions, setSessionList } = useReadingSessions();
  const { preferences, updatePreferences } = usePreferences();
  const [status, setStatus] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const firstPullDone = useRef(false);
  const lastPayload = useRef('');
  // Snapshot of the ids present after the last sync, per collection. Comparing
  // against the current ids tells us exactly what the user deleted, so we can
  // propagate that deletion instead of inferring it destructively.
  const prevIds = useRef<Record<SyncCollectionName, Set<string>>>({ books: new Set(), quotes: new Set(), shelves: new Set(), sessions: new Set() });

  // Restore the last successful sync time so the user sees it on open.
  useEffect(() => {
    if (Platform.OS === 'web' || !user) return;
    AsyncStorage.getItem(SYNC_KEY).then((raw) => {
      const ts = Number(raw);
      if (ts) setStatus('Última sincronização ' + formatSyncTime(ts));
    });
  }, [user]);

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
        // Drop remote items the user already deleted locally (pending tombstones)
        // so a stale cloud copy doesn't resurrect them before the delete syncs.
        const tombstones = await loadTombstones();
        if (bundle.books?.length) await replaceBooks(mergeByUpdatedAt(books, dropTombstoned(bundle.books, tombstones, 'books')));
        if (bundle.quotes?.length) await setQuoteList(mergeByUpdatedAt(quotes, dropTombstoned(bundle.quotes, tombstones, 'quotes')));
        if (bundle.shelves?.length) await setShelfList(mergeByUpdatedAt(shelves, dropTombstoned(bundle.shelves, tombstones, 'shelves')));
        if (bundle.sessions?.length) await setSessionList(mergeByUpdatedAt(sessions, dropTombstoned(bundle.sessions, tombstones, 'sessions')));
        if (bundle.preferences) await updatePreferences({ ...preferences, ...bundle.preferences });
        setStatus('Dados sincronizados.');
      } catch {
        setStatus('Não foi possível receber dados remotos.');
      } finally {
        // Only after the initial pull do we let the push run — this is what
        // prevents a fresh/empty local state from overwriting the cloud.
        if (!cancelled) setHydrated(true);
      }
    }
    pull(userId);
    return () => { cancelled = true; };
  }, [user?.uid]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const userId: string = user?.uid ?? '';
    if (!userId || !isNativeFirebaseConfigured || !hydrated) return;

    // Diff current ids against the last snapshot to find what was deleted, and
    // tombstone those ids so the deletion propagates to the cloud explicitly.
    const current: Record<SyncCollectionName, Set<string>> = {
      books: new Set(books.map((b) => b.id)),
      quotes: new Set(quotes.map((q) => q.id)),
      shelves: new Set(shelves.map((s) => s.id)),
      sessions: new Set(sessions.map((s) => s.id))
    };
    (Object.keys(current) as SyncCollectionName[]).forEach((name) => {
      const removed = [...prevIds.current[name]].filter((id) => !current[name].has(id));
      if (removed.length) void addTombstones(name, removed);
      prevIds.current[name] = current[name];
    });

    const payload = JSON.stringify({ books, quotes, shelves, sessions, preferences });
    if (payload === lastPayload.current) return;
    lastPayload.current = payload;
    const timeout = setTimeout(async () => {
      try {
        setStatus('Salvando na nuvem...');
        const tombstones = await loadTombstones();
        const deletions = {
          books: tombstoneIds(tombstones, 'books'),
          quotes: tombstoneIds(tombstones, 'quotes'),
          shelves: tombstoneIds(tombstones, 'shelves'),
          sessions: tombstoneIds(tombstones, 'sessions')
        };
        const result = await pushReadoraBundle(userId, { books, quotes, shelves, sessions, preferences }, deletions);
        if (result.ok) {
          // Deletions confirmed remotely — drop their tombstones.
          await Promise.all((Object.keys(deletions) as SyncCollectionName[]).map((name) => clearTombstones(name, deletions[name])));
          const ts = Date.now();
          await AsyncStorage.setItem(SYNC_KEY, String(ts));
          setStatus('Sincronizado · ' + formatSyncTime(ts));
        } else {
          setStatus('Firebase não configurado.');
        }
      } catch {
        setStatus('Erro ao sincronizar com a nuvem.');
      }
    }, 1800);
    return () => clearTimeout(timeout);
  }, [hydrated, user?.uid, books, quotes, shelves, sessions, preferences]);

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
