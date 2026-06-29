import AsyncStorage from '@react-native-async-storage/async-storage';

// Tombstones record items the user deleted locally so the deletion can be
// propagated to Firestore *explicitly* — instead of inferring deletions from
// "any remote doc missing locally", which would wipe cloud data whenever a
// device synced with an empty/partial local state.
//
// Shape: { [collection]: { [id]: deletedAt } }. Persisted so a deletion that
// happens offline (or right before the app closes) survives until it syncs.

const KEY = '@readora_tombstones';

export type SyncCollectionName = 'books' | 'quotes' | 'shelves' | 'sessions';
export type Tombstones = Partial<Record<SyncCollectionName, Record<string, number>>>;

export async function loadTombstones(): Promise<Tombstones> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Tombstones) : {};
  } catch {
    return {};
  }
}

async function save(tombstones: Tombstones): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(tombstones));
  } catch {
    /* best-effort */
  }
}

/** Marks ids as deleted in a collection. Merges with any existing tombstones. */
export async function addTombstones(collection: SyncCollectionName, ids: string[]): Promise<Tombstones> {
  if (!ids.length) return loadTombstones();
  const tombstones = await loadTombstones();
  const bucket = { ...(tombstones[collection] || {}) };
  const now = Date.now();
  ids.forEach((id) => { bucket[id] = now; });
  const next = { ...tombstones, [collection]: bucket };
  await save(next);
  return next;
}

/** Removes tombstones once their deletion has been confirmed remotely. */
export async function clearTombstones(collection: SyncCollectionName, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const tombstones = await loadTombstones();
  const bucket = { ...(tombstones[collection] || {}) };
  ids.forEach((id) => { delete bucket[id]; });
  await save({ ...tombstones, [collection]: bucket });
}

export function tombstoneIds(tombstones: Tombstones, collection: SyncCollectionName): string[] {
  return Object.keys(tombstones[collection] || {});
}

/** Drops items whose id is tombstoned — keeps a just-deleted item from being
 *  resurrected by stale remote data before its deletion has synced. */
export function dropTombstoned<T extends { id: string }>(items: T[], tombstones: Tombstones, collection: SyncCollectionName): T[] {
  const dead = tombstones[collection];
  if (!dead) return items;
  return items.filter((item) => !(item.id in dead));
}
