// In-memory AsyncStorage so the tombstone persistence can be tested in node.
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __reset: () => { store = {}; },
    getItem: jest.fn((k: string) => Promise.resolve(k in store ? store[k] : null)),
    setItem: jest.fn((k: string, v: string) => { store[k] = v; return Promise.resolve(); }),
    removeItem: jest.fn((k: string) => { delete store[k]; return Promise.resolve(); })
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { addTombstones, clearTombstones, dropTombstoned, loadTombstones, tombstoneIds } from '@/services/syncTombstones';

beforeEach(() => {
  (AsyncStorage as unknown as { __reset: () => void }).__reset();
});

describe('dropTombstoned', () => {
  it('removes items whose id is tombstoned and keeps the rest', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const result = dropTombstoned(items, { books: { b: 123 } }, 'books');
    expect(result.map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('returns items unchanged when the collection has no tombstones', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    expect(dropTombstoned(items, {}, 'books')).toHaveLength(2);
    expect(dropTombstoned(items, { quotes: { a: 1 } }, 'books')).toHaveLength(2);
  });
});

describe('tombstone persistence', () => {
  it('adds, lists and clears tombstones across the storage round-trip', async () => {
    await addTombstones('books', ['x', 'y']);
    let t = await loadTombstones();
    expect(tombstoneIds(t, 'books').sort()).toEqual(['x', 'y']);

    // Adding more merges instead of replacing.
    await addTombstones('books', ['z']);
    t = await loadTombstones();
    expect(tombstoneIds(t, 'books').sort()).toEqual(['x', 'y', 'z']);

    // Clearing only removes the confirmed ids.
    await clearTombstones('books', ['x', 'z']);
    t = await loadTombstones();
    expect(tombstoneIds(t, 'books')).toEqual(['y']);
  });

  it('keeps collections independent', async () => {
    await addTombstones('books', ['a']);
    await addTombstones('sessions', ['s1']);
    const t = await loadTombstones();
    expect(tombstoneIds(t, 'books')).toEqual(['a']);
    expect(tombstoneIds(t, 'sessions')).toEqual(['s1']);
    expect(tombstoneIds(t, 'quotes')).toEqual([]);
  });

  it('no-ops gracefully on empty input', async () => {
    await addTombstones('books', []);
    await clearTombstones('books', []);
    const t = await loadTombstones();
    expect(tombstoneIds(t, 'books')).toEqual([]);
  });
});
