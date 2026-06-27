import { ReadingSession } from '@/types/readingSession';

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  daysReadThisWeek: number;
  lastReadingDate: number | null;
  activeDaysThisMonth: number;
  isStreakBroken: boolean;
}

function startOfDay(value: number | Date): number {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayDiff(a: number, b: number): number {
  return Math.round((startOfDay(a) - startOfDay(b)) / 86400000);
}

/** Reading streak metrics derived from session dates (native uses createdAt). */
export function calculateStreak(sessions: ReadingSession[]): StreakStats {
  if (!sessions || sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, daysReadThisWeek: 0, lastReadingDate: null, activeDaysThisMonth: 0, isStreakBroken: false };
  }

  const uniqueDates = Array.from(new Set(sessions.map((s) => startOfDay(s.createdAt)))).sort((a, b) => b - a);
  const today = startOfDay(Date.now());
  const last = uniqueDates[0];

  let currentStreak = 0;
  let isStreakBroken = false;
  if (dayDiff(today, last) <= 1) {
    let check = last;
    for (let i = 0; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === check) {
        currentStreak += 1;
        check = startOfDay(check - 86400000);
      } else {
        break;
      }
    }
  } else {
    isStreakBroken = true;
  }

  const asc = [...uniqueDates].sort((a, b) => a - b);
  let longestStreak = 1;
  let temp = 1;
  for (let i = 1; i < asc.length; i++) {
    const diff = dayDiff(asc[i], asc[i - 1]);
    if (diff === 1) temp += 1;
    else if (diff > 1) temp = 1;
    longestStreak = Math.max(longestStreak, temp);
  }

  const now = new Date();
  const startOfWeek = startOfDay(Date.now() - now.getDay() * 86400000);
  const daysReadThisWeek = uniqueDates.filter((d) => d >= startOfWeek).length;
  const startOfMonth = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1).getTime());
  const activeDaysThisMonth = uniqueDates.filter((d) => d >= startOfMonth).length;

  return { currentStreak, longestStreak, daysReadThisWeek, lastReadingDate: last, activeDaysThisMonth, isStreakBroken };
}
