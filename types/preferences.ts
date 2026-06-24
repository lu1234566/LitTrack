export type VisualAccent = 'gold' | 'emerald' | 'violet' | 'rose';
export type VisualDensity = 'comfortable' | 'compact';
export type TextScale = 'normal' | 'large';
export type LayoutMode = 'auto' | 'desktop' | 'mobile';
export type ReminderFrequency = 'daily' | 'weekdays' | 'weekly';

export interface ReaderPreferences {
  readerName: string;
  yearlyGoal: number;
  dailyPageGoal: number;
  favoriteFormat: string;
  reminderText: string;
  reminderEnabled: boolean;
  reminderFrequency: ReminderFrequency;
  syncUserId: string;
  visualAccent: VisualAccent;
  visualDensity: VisualDensity;
  textScale: TextScale;
  layoutMode: LayoutMode;
}
