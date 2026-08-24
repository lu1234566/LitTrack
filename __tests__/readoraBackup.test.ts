import { createReadoraBackup, stringifyBackup, parseReadoraBackup } from '@/services/readoraBackup';

describe('readoraBackup', () => {
  it('round-trips a modern backup', () => {
    const book = { id: 'b1', title: 'Eragon', author: 'Paolini', genre: 'Fantasia', status: 'finished', createdAt: 1, updatedAt: 2 };
    const backup = createReadoraBackup({ books: [book] as any, quotes: [], shelves: [] });
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

  it('anchors finishedAt to the reading month instead of the import time', () => {
    const legacy = JSON.stringify({
      books: [{ titulo: 'Brisingr', autor: 'Paolini', anoLeitura: 2025, mesLeitura: 'Março', notaGeral: 8, status: 'lido' }]
    });
    const parsed = parseReadoraBackup(legacy);
    const finishedAt = parsed.books[0].finishedAt;
    expect(finishedAt).toBeDefined();
    const d = new Date(finishedAt as number);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(2); // março — não o mês da importação
  });

  it('leaves finishedAt/startedAt undefined when the legacy book has no dates', () => {
    const legacy = JSON.stringify({
      books: [{ titulo: 'Verity', autor: 'Hoover', notaGeral: 7, status: 'lido' }]
    });
    const parsed = parseReadoraBackup(legacy);
    expect(parsed.books[0].finishedAt).toBeUndefined();
    expect(parsed.books[0].startedAt).toBeUndefined();
  });

  it('throws on invalid content', () => {
    expect(() => parseReadoraBackup('{"foo":true}')).toThrow();
  });
});
