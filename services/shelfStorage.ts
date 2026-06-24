import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shelf } from '@/types/shelf';

const KEY = '@readora_native_shelves';
const now = Date.now();

export const seedShelves: Shelf[] = [
  {
    id: 'shelf-seed-fantasy',
    name: 'Fantasia e dragões',
    description: 'Livros de fantasia, jornadas e mundos imaginarios.',
    color: 'gold',
    bookIds: ['seed-eragon', 'seed-brisingr', 'seed-wishlist'],
    createdAt: now - 90000,
    updatedAt: now - 90000
  },
  {
    id: 'shelf-seed-favorites',
    name: 'Favoritos para revisitar',
    description: 'Livros que merecem releitura ou anotacoes futuras.',
    color: 'emerald',
    bookIds: ['seed-eragon', 'seed-verity'],
    createdAt: now - 80000,
    updatedAt: now - 80000
  }
];

export async function loadShelves(): Promise<Shelf[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return seedShelves;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedShelves;
  } catch {
    return seedShelves;
  }
}

export async function saveShelves(shelves: Shelf[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(shelves));
}
