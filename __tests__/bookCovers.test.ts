import { coverFallbackChain, lookupExternalBooks } from '@/services/externalBookSearch';

/**
 * Capas que "existem" mas nao sao capa: o Google devolve uma imagem escrita
 * "image not available" e a Open Library devolve um PNG transparente de 1x1.
 * As duas CARREGAM com sucesso, entao o `onError` do app nunca dispara e o
 * usuario ve um retangulo branco no lugar da capa.
 */
function mockFetch(routes: Record<string, unknown>) {
  return jest.fn((url: string) => {
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) return Promise.resolve({ ok: false, json: async () => ({}) });
    return Promise.resolve({ ok: true, json: async () => routes[key] });
  });
}

describe('capas falsas', () => {
  afterEach(() => { (global as any).fetch = undefined; });

  it('ignora a imagem de "image not available" do Google', async () => {
    (global as any).fetch = mockFetch({
      'googleapis.com/books': {
        items: [{
          id: 'g1',
          volumeInfo: {
            title: 'The Beginning After the End, Vol. 7',
            authors: ['TurtleMe'],
            pageCount: 320,
            imageLinks: { thumbnail: 'https://books.google.com/googlebooks/images/no_cover_thumb.gif' }
          }
        }]
      }
    });
    const [livro] = await lookupExternalBooks('The Beginning After the End');
    // Sem capa e melhor do que uma capa que diz "image not available".
    expect(livro.coverUrl).toBeUndefined();
  });

  it('pede 404 em vez do 1x1 transparente da Open Library', async () => {
    (global as any).fetch = mockFetch({
      'openlibrary.org/search.json': {
        docs: [{ key: '/works/OL1W', title: 'Divergente', author_name: ['Veronica Roth'], isbn: ['9788580570823'], number_of_pages_median: 487 }]
      }
    });
    const [livro] = await lookupExternalBooks('Divergente');
    expect(livro.coverUrl).toContain('default=false');
  });
});

describe('cadeia de fallback da capa', () => {
  it('tenta o zoom original quando o zoom=2 pode nao existir', () => {
    const chain = coverFallbackChain({
      coverUrl: 'https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=2'
    });
    expect(chain).toHaveLength(2);
    expect(chain[1]).toContain('zoom=1');
  });

  it('cai para a Open Library pelo ISBN quando o Google nao tem capa', () => {
    const chain = coverFallbackChain({ isbn: '978-85-8057-082-3' });
    expect(chain).toEqual(['https://covers.openlibrary.org/b/isbn/9788580570823-M.jpg?default=false']);
  });

  it('nao oferece nada quando nao ha capa nem ISBN', () => {
    expect(coverFallbackChain({})).toEqual([]);
  });

  it('descarta o placeholder tambem na cadeia', () => {
    expect(coverFallbackChain({ coverUrl: 'https://books.google.com/googlebooks/images/no_cover_thumb.gif' })).toEqual([]);
  });
});
