import { csvToBooks, detectSource, mergeImported, parseCsv } from '@/services/csvImport';
import { Book } from '@/types/book';

describe('parseCsv', () => {
  it('handles quoted fields with commas, newlines and escaped quotes', () => {
    const csv = 'a,b,c\n1,"hello, world","line1\nline2"\n2,"she said ""hi""",z';
    const rows = parseCsv(csv);
    expect(rows[0]).toEqual(['a', 'b', 'c']);
    expect(rows[1]).toEqual(['1', 'hello, world', 'line1\nline2']);
    expect(rows[2]).toEqual(['2', 'she said "hi"', 'z']);
  });

  it('drops empty trailing rows', () => {
    expect(parseCsv('a,b\n1,2\n\n')).toHaveLength(2);
  });
});

describe('detectSource', () => {
  it('detects goodreads and storygraph by headers', () => {
    expect(detectSource(['Title', 'Author', 'Exclusive Shelf'])).toBe('goodreads');
    expect(detectSource(['Title', 'Authors', 'Read Status', 'Moods'])).toBe('storygraph');
    expect(detectSource(['Foo', 'Bar'])).toBe('unknown');
  });
});

describe('csvToBooks - Goodreads', () => {
  const csv = [
    'Title,Author,ISBN,ISBN13,My Rating,Publisher,Number of Pages,Year Published,Date Read,Exclusive Shelf,My Review',
    'The Divorce,Freida McFadden,="123",="9781234567890",5,Poisoned Pen,600,2024,2025/03/14,read,"Loved, it"',
    'Wishlisted Book,Jane Doe,,,0,,300,2020,,to-read,'
  ].join('\n');

  it('maps fields and strips Goodreads ="..." wrappers', () => {
    const { source, books } = csvToBooks(csv, 1000);
    expect(source).toBe('goodreads');
    expect(books).toHaveLength(2);
    const div = books[0];
    expect(div.title).toBe('The Divorce');
    expect(div.isbn).toBe('9781234567890');
    expect(div.rating).toBe(5);
    expect(div.totalPages).toBe(600);
    expect(div.status).toBe('finished');
    expect(div.currentPage).toBe(600);
    expect(div.review).toBe('Loved, it');
    expect(books[1].status).toBe('wishlist');
  });
});

describe('csvToBooks - StoryGraph', () => {
  const csv = [
    'Title,Authors,ISBN/UID,Read Status,Star Rating,Review,Moods,Content Warnings,Content Warning Description,Last Date Read',
    'Ward D,Freida McFadden,9780593,did-not-finish,4.5,Tense,"tense, dark",violence,"graphic scenes",2025/05/11',
    'To Read,Someone,,to-read,0,,,,,'
  ].join('\n');

  it('maps read status (incl. DNF), half-star rating, moods and content warnings', () => {
    const { source, books } = csvToBooks(csv, 2000);
    expect(source).toBe('storygraph');
    const ward = books[0];
    expect(ward.status).toBe('dnf');
    expect(ward.rating).toBe(4.5);
    expect(ward.mood).toBe('tense, dark');
    expect(ward.contentWarnings).toBe('violence — graphic scenes');
    expect(books[1].status).toBe('wishlist');
  });
});

describe('csvToBooks - errors', () => {
  it('throws on unknown layout', () => {
    expect(() => csvToBooks('Foo,Bar\n1,2')).toThrow(/não reconhecido/);
  });
});

describe('mergeImported', () => {
  const mk = (p: Partial<Book>): Book => ({ id: p.id || 'x', title: p.title || 'T', author: p.author || 'A', genre: '', status: 'finished', isbn: p.isbn, createdAt: 0, updatedAt: 0 } as Book);

  it('skips duplicates by isbn or title+author and prepends new ones', () => {
    const existing = [mk({ id: 'e1', title: 'Owned', author: 'Me', isbn: '111' })];
    const imported = [
      mk({ id: 'i1', title: 'Owned', author: 'Me', isbn: '999' }), // dup by title+author
      mk({ id: 'i2', title: 'Other', author: 'You', isbn: '111' }), // dup by isbn
      mk({ id: 'i3', title: 'New', author: 'New', isbn: '222' })
    ];
    const { merged, added, skipped } = mergeImported(existing, imported);
    expect(added).toBe(1);
    expect(skipped).toBe(2);
    expect(merged[0].id).toBe('i3');
    expect(merged).toHaveLength(2);
  });
});
