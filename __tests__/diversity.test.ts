import { buildDiversity, parseYear } from '@/services/diversity';
import { Book } from '@/types/book';

const mk = (p: Partial<Book>): Book => ({
  id: p.id || Math.random().toString(), title: p.title || 'T', author: p.author || 'A',
  genre: p.genre || '', status: p.status || 'finished', publishedDate: p.publishedDate,
  createdAt: 0, updatedAt: 0
} as Book);

describe('parseYear', () => {
  it('extracts a 4-digit year from free-form strings', () => {
    expect(parseYear('2003')).toBe(2003);
    expect(parseYear('2008-05-01')).toBe(2008);
    expect(parseYear('May 1997')).toBe(1997);
    expect(parseYear('')).toBeNull();
    expect(parseYear('sem ano')).toBeNull();
  });
});

describe('buildDiversity', () => {
  it('counts distinct genres/authors over finished books only', () => {
    const books = [
      mk({ status: 'finished', genre: 'Thriller', author: 'A' }),
      mk({ status: 'finished', genre: 'thriller', author: 'a' }), // case-insensitive dup
      mk({ status: 'finished', genre: 'Romance', author: 'B' }),
      mk({ status: 'wishlist', genre: 'Fantasia', author: 'C' }) // ignored
    ];
    const d = buildDiversity(books);
    expect(d.distinctGenres).toBe(2);
    expect(d.distinctAuthors).toBe(2);
  });

  it('builds a sorted decade distribution and oldest/newest span', () => {
    const books = [
      mk({ status: 'finished', publishedDate: '2003', title: 'X' }),
      mk({ status: 'finished', publishedDate: '2008', title: 'Y' }),
      mk({ status: 'finished', publishedDate: '1995', title: 'Z' })
    ];
    const d = buildDiversity(books);
    expect(d.decades.map((x) => x.label)).toEqual(['1990s', '2000s']);
    expect(d.decades.find((x) => x.decade === 2000)!.count).toBe(2);
    expect(d.oldest).toEqual({ year: 1995, title: 'Z' });
    expect(d.newest).toEqual({ year: 2008, title: 'Y' });
    expect(d.spanYears).toBe(13);
    expect(d.withYear).toBe(3);
  });

  it('handles no dated books gracefully', () => {
    const d = buildDiversity([mk({ status: 'finished', publishedDate: '' })]);
    expect(d.decades).toEqual([]);
    expect(d.oldest).toBeNull();
    expect(d.spanYears).toBe(0);
  });
});
