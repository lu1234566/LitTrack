import { bookNeedsEnrichment, enrichBookPatch } from '@/services/bookEnrichment';
import { Book } from '@/types/book';

function book(p: Partial<Book>): Book {
  return {
    id: '1', title: 'Dom Casmurro', author: 'Machado de Assis', genre: 'Ficção', status: 'finished',
    totalPages: 200, coverUrl: 'http://x/cover.jpg', createdAt: 0, updatedAt: 0, ...p
  } as Book;
}

describe('bookNeedsEnrichment', () => {
  it('is false when pages, cover and genre are present', () => {
    expect(bookNeedsEnrichment(book({}))).toBe(false);
  });
  it('is true when pages are missing', () => {
    expect(bookNeedsEnrichment(book({ totalPages: 0 }))).toBe(true);
  });
  it('is true when cover is missing', () => {
    expect(bookNeedsEnrichment(book({ coverUrl: undefined }))).toBe(true);
  });
  it('is true when genre is unset', () => {
    expect(bookNeedsEnrichment(book({ genre: 'A definir' }))).toBe(true);
  });
});

describe('enrichBookPatch', () => {
  afterEach(() => { (global as any).fetch = undefined; });

  it('fills only the missing fields from the provider', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{
          id: 'g1',
          volumeInfo: { title: 'Dom Casmurro', authors: ['Machado de Assis'], pageCount: 256, categories: ['Romance'], imageLinks: { thumbnail: 'http://img/c.jpg' } }
        }]
      })
    });

    const patch = await enrichBookPatch(book({ totalPages: 0, coverUrl: undefined, genre: 'A definir' }));
    expect(patch?.totalPages).toBe(256);
    expect(patch?.coverUrl).toBeTruthy();
    expect(patch?.genre).toBe('Romance');
  });

  it('returns null when nothing is found', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    const patch = await enrichBookPatch(book({ totalPages: 0 }));
    expect(patch).toBeNull();
  });
});
