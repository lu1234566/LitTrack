export type VisualAccent = 'gold' | 'emerald' | 'violet' | 'rose';
export type VisualDensity = 'comfortable' | 'compact';
export type TextScale = 'normal' | 'large';

export interface ReaderPreferences {
  readerName: string;
  yearlyGoal: number;
  dailyPageGoal: number;
  favoriteFormat: string;
  reminderText: string;
  syncUserId: string;
  visualAccent: VisualAccent;
  visualDensity: VisualDensity;
  textScale: TextScale;
}
