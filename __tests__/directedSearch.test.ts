import { lookupByTitleAuthor } from '@/services/externalBookSearch';
import { enrichBookDetailed, enrichBookPatch, patchForCandidate } from '@/services/bookEnrichment';
import { Book } from '@/types/book';

function mockFetch(routes: Record<string, unknown>) {
  return jest.fn((url: string) => {
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) return Promise.resolve({ ok: false, json: async () => ({}) });
    return Promise.resolve({ ok: true, json: async () => routes[key] });
  });
}

const livroBase: Book = {
  id: 'b1', title: 'New Heights', author: 'TurtleMe', genre: 'A definir',
  status: 'finished', rating: 5, totalPages: 0, currentPage: 0,
  coverUrl: '', description: '', createdAt: 1, updatedAt: 1
} as Book;

describe('busca dirigida por titulo e autor', () => {
  afterEach(() => { (global as any).fetch = undefined; });

  it('usa intitle/inauthor no Google Books em vez de texto livre', async () => {
    const chamadas: string[] = [];
    (global as any).fetch = jest.fn((url: string) => {
      chamadas.push(url);
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });
    await lookupByTitleAuthor('New Heights', 'TurtleMe');
    const google = chamadas.find((u) => u.includes('googleapis.com/books'));
    expect(google).toBeDefined();
    expect(decodeURIComponent(google!)).toContain('intitle:"New Heights"');
    expect(decodeURIComponent(google!)).toContain('inauthor:"TurtleMe"');
  });

  it('usa os parametros title/author da Open Library', async () => {
    const chamadas: string[] = [];
    (global as any).fetch = jest.fn((url: string) => {
      chamadas.push(url);
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });
    await lookupByTitleAuthor('New Heights', 'TurtleMe');
    const ol = chamadas.find((u) => u.includes('openlibrary.org/search.json'));
    expect(decodeURIComponent(ol!)).toContain('title=New Heights');
    expect(decodeURIComponent(ol!)).toContain('author=TurtleMe');
  });

  it('descarta candidato cujo titulo e de outro livro', async () => {
    (global as any).fetch = mockFetch({
      'googleapis.com/books': {
        items: [{ id: 'g9', volumeInfo: { title: 'Divergente', authors: ['Veronica Roth'], pageCount: 487 } }]
      }
    });
    // Busca por "Divergence": o catalogo devolve "Divergente", outro livro.
    const achados = await lookupByTitleAuthor('Divergence', 'TurtleMe');
    expect(achados).toEqual([]);
  });

  it('aceita quando o titulo realmente corresponde', async () => {
    (global as any).fetch = mockFetch({
      'googleapis.com/books': {
        items: [{ id: 'g1', volumeInfo: { title: 'New Heights', authors: ['TurtleMe'], pageCount: 412 } }]
      }
    });
    const achados = await lookupByTitleAuthor('New Heights', 'TurtleMe');
    expect(achados).toHaveLength(1);
    expect(achados[0].totalPages).toBe(412);
  });
});

describe('enriquecimento nao preenche com livro errado', () => {
  afterEach(() => { (global as any).fetch = undefined; });

  it('prefere nao preencher a usar dados de outro titulo', async () => {
    // Todas as fontes devolvem um livro diferente do procurado.
    (global as any).fetch = mockFetch({
      'googleapis.com/books': {
        items: [{
          id: 'g9',
          volumeInfo: {
            title: 'Divergente', authors: ['Veronica Roth'], pageCount: 487,
            description: 'Sinopse do livro errado', imageLinks: { thumbnail: 'http://x/errada.jpg' }
          }
        }]
      }
    });
    const patch = await enrichBookPatch({ ...livroBase, title: 'Divergence' });
    // Antes isto retornava paginas/capa/sinopse de "Divergente".
    expect(patch).toBeNull();
  });

  it('devolve os candidatos duvidosos em vez de so desistir', async () => {
    (global as any).fetch = mockFetch({
      'googleapis.com/books': {
        items: [{
          id: 'g9',
          volumeInfo: {
            title: 'Divergente', authors: ['Veronica Roth'], pageCount: 487,
            description: 'Sinopse da edicao brasileira', imageLinks: { thumbnail: 'http://x/capa.jpg' }
          }
        }]
      }
    });
    const livro = { ...livroBase, title: 'Divergence' };
    const { patch, candidates } = await enrichBookDetailed(livro);
    expect(patch).toBeNull();
    // O usuario ve a opcao e decide — antes ela era descartada em silencio.
    expect(candidates).toHaveLength(1);
    expect(candidates[0].external.title).toBe('Divergente');
    expect(candidates[0].wouldFill).toEqual(expect.arrayContaining(['páginas', 'capa', 'sinopse']));
  });

  it('aplicar um candidato escolhido preenche so o que falta', async () => {
    const livro = { ...livroBase, title: 'Divergence', totalPages: 300 };
    const patch = patchForCandidate(
      { id: 'g9', title: 'Divergente', author: 'Veronica Roth', genre: 'Ficção', totalPages: 487, coverUrl: 'https://x/capa.jpg', source: 'google-books' },
      livro
    );
    // Paginas ja preenchidas pelo usuario continuam valendo.
    expect(patch.totalPages).toBeUndefined();
    expect(patch.coverUrl).toBe('https://x/capa.jpg');
    expect(patch.genre).toBe('Ficção');
  });
});
