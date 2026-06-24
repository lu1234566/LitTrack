import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReaderPreferences } from '@/types/preferences';

const KEY = '@readora_native_preferences';

export const defaultPreferences: ReaderPreferences = {
  readerName: 'Lucas',
  yearlyGoal: 24,
  dailyPageGoal: 20,
  favoriteFormat: 'Digital e fisico',
  reminderText: '20:00',
  reminderEnabled: true,
  reminderFrequency: 'daily',
  syncUserId: 'local-reader',
  visualAccent: 'gold',
  visualDensity: 'comfortable',
  textScale: 'normal',
  layoutMode: 'auto'
};

export async function loadPreferences(): Promise<ReaderPreferences> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return defaultPreferences;
  try {
    return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultPreferences;
  }
}

export async function savePreferences(preferences: ReaderPreferences) {
  await AsyncStorage.setItem(KEY, JSON.stringify(preferences));
}
