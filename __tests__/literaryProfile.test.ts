import { analyzeLiteraryProfile } from '@/services/literaryProfile';
import { Book } from '@/types/book';

function book(p: Partial<Book>): Book {
  return {
    id: Math.random().toString(), title: 'T', author: 'A', genre: 'Ficção', status: 'finished',
    rating: 4, totalPages: 300, createdAt: 0, updatedAt: 0, mood: '', ...p
  } as Book;
}

describe('analyzeLiteraryProfile', () => {
  it('handles an empty library without crashing', () => {
    const p = analyzeLiteraryProfile([]);
    expect(p.generoFavorito).toBeTruthy();
    expect(Array.isArray(p.genreMetrics)).toBe(true);
    expect(p.archetype.name).toBeTruthy();
  });

  it('picks the most frequent genre as favorite', () => {
    const p = analyzeLiteraryProfile([
      book({ genre: 'Fantasia', rating: 5 }),
      book({ genre: 'Fantasia', rating: 5 }),
      book({ genre: 'Romance', rating: 4 })
    ]);
    expect(p.generoFavorito).toBe('Fantasia');
    expect(p.genreMetrics[0].genre).toBe('Fantasia');
  });

  it('only counts finished books', () => {
    const p = analyzeLiteraryProfile([
      book({ genre: 'Fantasia', status: 'finished' }),
      book({ genre: 'Romance', status: 'reading' }),
      book({ genre: 'Romance', status: 'wishlist' })
    ]);
    expect(p.generoFavorito).toBe('Fantasia');
  });

  it('averages ratings per genre on the 0-5 scale', () => {
    const p = analyzeLiteraryProfile([
      book({ genre: 'Suspense', rating: 4 }),
      book({ genre: 'Suspense', rating: 2 })
    ]);
    const suspense = p.genreMetrics.find((m) => m.genre === 'Suspense');
    expect(suspense?.averageRating).toBeCloseTo(3, 5);
  });
});
