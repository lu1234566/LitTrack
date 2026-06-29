import { createReadoraBackup, stringifyBackup, parseReadoraBackup } from '@/services/readoraBackup';

describe('readoraBackup', () => {
  it('round-trips a modern backup', () => {
    const book = { id: 'b1', title: 'Eragon', author: 'Paolini', genre: 'Fantasia', status: 'finished', createdAt: 1, updatedAt: 2 };
    const backup = createReadoraBackup({ books: [book] as any, quotes: [], shelves: [], sessions: [] });
    const parsed = parseReadoraBackup(stringifyBackup(backup));
    expect(parsed.app).toBe('Readora');
    expect(parsed.books).toHaveLength(1);
    expect(parsed.books[0].title).toBe('Eragon');
  });

  it('imports a legacy backup and anchors the book to its reading month', () => {
    const legacy = JSON.stringify({
      books: [{ titulo: 'A Inquilina', autor: 'Freida McFadden', anoLeitura: 2026, mesLeitura: 'Junho', notaGeral: 9, status: 'lido', pageCount: 304 }]
    });
    const parsed = parseReadoraBackup(legacy);
    expect(parsed.books).toHaveLength(1);
    expect(parsed.books[0].title).toBe('A Inquilina');
    const d = new Date(parsed.books[0].createdAt);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // June
  });

  it('throws on invalid content', () => {
    expect(() => parseReadoraBackup('{"foo":true}')).toThrow();
  });
});
