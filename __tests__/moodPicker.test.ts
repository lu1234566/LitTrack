import { buildGenreMoodAffinity, lengthBucketOf, pickWhatToRead } from '@/services/moodPicker';
import { Book } from '@/types/book';

function mk(p: Partial<Book>): Book {
  return {
    id: p.id || Math.random().toString(),
    title: p.title || 'T',
    author: p.author || 'A',
    genre: p.genre || '',
    status: p.status || 'wishlist',
    rating: p.rating,
    totalPages: p.totalPages,
    mood: p.mood,
    priority: p.priority,
    createdAt: 0,
    updatedAt: 0
  } as Book;
}

describe('lengthBucketOf', () => {
  it('buckets by page count', () => {
    expect(lengthBucketOf(undefined)).toBeNull();
    expect(lengthBucketOf(0)).toBeNull();
    expect(lengthBucketOf(200)).toBe('curto');
    expect(lengthBucketOf(300)).toBe('medio');
    expect(lengthBucketOf(600)).toBe('longo');
  });
});

describe('buildGenreMoodAffinity', () => {
  it('learns genre→mood from finished, tagged books only', () => {
    const books = [
      mk({ status: 'finished', genre: 'Thriller', mood: 'Tenso, Caótico' }),
      mk({ status: 'finished', genre: 'Thriller', mood: 'Tenso' }),
      mk({ status: 'wishlist', genre: 'Thriller', mood: 'Sereno' }), // ignored (not finished)
      mk({ status: 'finished', genre: 'Romance', mood: '' }) // ignored (no mood)
    ];
    const aff = buildGenreMoodAffinity(books);
    expect(aff.Thriller).toEqual({ Tenso: 2, Caótico: 1 });
    expect(aff.Romance).toBeUndefined();
  });
});

describe('pickWhatToRead', () => {
  const finished = [
    mk({ status: 'finished', genre: 'Thriller', mood: 'Tenso, Caótico' }),
    mk({ status: 'finished', genre: 'Thriller', mood: 'Tenso' })
  ];

  it('infers mood for an unread book via its genre affinity', () => {
    const books = [...finished, mk({ id: 'w1', status: 'wishlist', genre: 'Thriller', totalPages: 300 })];
    const picks = pickWhatToRead(books, { moods: ['Tenso'], length: 'any' });
    expect(picks).toHaveLength(1);
    expect(picks[0].book.id).toBe('w1');
    expect(picks[0].inferred).toBe(true);
  });

  it('prefers a direct mood tag over an inferred one', () => {
    const books = [
      ...finished,
      mk({ id: 'tagged', status: 'wishlist', genre: 'Romance', mood: 'Tenso' }),
      mk({ id: 'inferred', status: 'wishlist', genre: 'Thriller' })
    ];
    const picks = pickWhatToRead(books, { moods: ['Tenso'], length: 'any' });
    expect(picks[0].book.id).toBe('tagged');
    expect(picks[0].inferred).toBe(false);
  });

  it('filters out books with no mood signal when a mood is selected', () => {
    const books = [...finished, mk({ id: 'unrelated', status: 'wishlist', genre: 'Poesia' })];
    expect(pickWhatToRead(books, { moods: ['Tenso'], length: 'any' })).toHaveLength(0);
  });

  it('rewards a length match', () => {
    const books = [
      ...finished,
      mk({ id: 'short', status: 'wishlist', genre: 'Thriller', totalPages: 200 }),
      mk({ id: 'long', status: 'wishlist', genre: 'Thriller', totalPages: 700 })
    ];
    const picks = pickWhatToRead(books, { moods: ['Tenso'], length: 'curto' });
    expect(picks[0].book.id).toBe('short');
  });

  it('returns unread books even with no mood selected', () => {
    const books = [mk({ id: 'a', status: 'wishlist' }), mk({ id: 'b', status: 'reading' }), mk({ id: 'c', status: 'finished' })];
    const picks = pickWhatToRead(books, { moods: [], length: 'any' });
    expect(picks.map((p) => p.book.id).sort()).toEqual(['a', 'b']);
  });
});
