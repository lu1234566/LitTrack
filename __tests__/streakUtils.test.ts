import { calculateStreak } from '@/services/streakUtils';
import { ReadingSession } from '@/types/readingSession';

const DAY = 86400000;
function sess(daysAgo: number): ReadingSession {
  const ts = Date.now() - daysAgo * DAY;
  return { id: 's' + daysAgo + '-' + Math.random(), bookId: 'b', bookTitle: 't', pagesRead: 10, minutesRead: 5, createdAt: ts, updatedAt: ts };
}

describe('calculateStreak', () => {
  it('returns zeros for no sessions', () => {
    const s = calculateStreak([]);
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(0);
    expect(s.isStreakBroken).toBe(false);
  });

  it('counts consecutive days ending today', () => {
    const s = calculateStreak([sess(0), sess(1), sess(2)]);
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
    expect(s.isStreakBroken).toBe(false);
  });

  it('ignores duplicate sessions on the same day', () => {
    const s = calculateStreak([sess(0), sess(0), sess(1)]);
    expect(s.currentStreak).toBe(2);
  });

  it('marks the streak as broken when the last read is older than yesterday', () => {
    const s = calculateStreak([sess(5), sess(6)]);
    expect(s.currentStreak).toBe(0);
    expect(s.isStreakBroken).toBe(true);
    expect(s.longestStreak).toBe(2);
  });

  it('keeps an active streak when the last read was yesterday', () => {
    const s = calculateStreak([sess(1), sess(2)]);
    expect(s.currentStreak).toBe(2);
    expect(s.isStreakBroken).toBe(false);
  });
});
