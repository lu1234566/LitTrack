import { ReadingSession } from '../types';
import { isSameDay, subDays, startOfDay, differenceInDays } from 'date-fns';

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  daysReadThisWeek: number;
  lastReadingDate: number | null;
  activeDaysThisMonth: number;
  isStreakBroken: boolean;
}

export function calculateStreak(sessions: ReadingSession[]): StreakStats {
  if (!sessions || sessions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      daysReadThisWeek: 0,
      lastReadingDate: null,
      activeDaysThisMonth: 0,
      isStreakBroken: false,
    };
  }

  // Extract unique dates (standardized to start of day)
  const uniqueDates = Array.from(
    new Set(
      sessions.map((s) => startOfDay(new Date(s.date)).getTime())
    )
  ).sort((a, b) => b - a); // Sort descending (newest first)

  const today = startOfDay(new Date());
  const lastReadingDate = uniqueDates.length > 0 ? new Date(uniqueDates[0]) : null;

  // Current Streak Calculation
  let currentStreak = 0;
  let isStreakBroken = false;

  if (lastReadingDate) {
    const daysSinceLastRead = differenceInDays(today, lastReadingDate);
    
    // If last read was today or yesterday, streak is active
    if (daysSinceLastRead <= 1) {
      let checkDate = lastReadingDate;
      let dateIdx = 0;

      while (dateIdx < uniqueDates.length) {
        const currentDate = new Date(uniqueDates[dateIdx]);
        if (isSameDay(currentDate, checkDate)) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
          dateIdx++;
        } else {
          break;
        }
      }
    } else {
      isStreakBroken = true;
    }
  }

  // Longest Streak Calculation
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDatesAsc = [...uniqueDates].sort((a, b) => a - b);
  
  if (sortedDatesAsc.length > 0) {
    tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < sortedDatesAsc.length; i++) {
        const prevDate = startOfDay(new Date(sortedDatesAsc[i - 1]));
        const currDate = startOfDay(new Date(sortedDatesAsc[i]));
        const diff = differenceInDays(currDate, prevDate);
        
        if (diff === 1) {
            tempStreak++;
        } else if (diff > 1) {
            tempStreak = 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
    }
  }

  // Days read this week (Sunday to Saturday)
  const startOfCurrentWeek = startOfDay(subDays(today, today.getDay()));
  const daysReadThisWeek = uniqueDates.filter(d => d >= startOfCurrentWeek.getTime()).length;

  // Active days this month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const activeDaysThisMonth = uniqueDates.filter(d => d >= startOfDay(startOfMonth).getTime()).length;

  return {
    currentStreak,
    longestStreak,
    daysReadThisWeek,
    lastReadingDate: uniqueDates[0] || null,
    activeDaysThisMonth,
    isStreakBroken,
  };
}
