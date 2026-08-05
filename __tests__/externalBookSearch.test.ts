import { lookupExternalBooks } from '@/services/externalBookSearch';

/**
 * Cada provedor é simulado por URL. O objetivo é provar a regra central:
 * os campos de fontes diferentes se COMPLEMENTAM (antes a busca parava no
 * primeiro provedor que respondesse e o livro seguia incompleto).
 */
function mockFetch(routes: Record<string, unknown>) {
  return jest.fn((url: string) => {
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) return Promise.resolve({ ok: false, json: async () => ({}) });
    return Promise.resolve({ ok: true, json: async () => routes[key] });
  });
}

const googleNoPages = {
  items: [{
    id: 'g1',
    volumeInfo: {
      title: 'A Inquilina', authors: ['Freida McFadden'],
      imageLinks: { thumbnail: 'http://x/capa.jpg' },
      industryIdentifiers: [{ type: 'ISBN_13', identifier: '9788595084742' }]
      // sem pageCount e sem description — o buraco que o teste cobre
    }
  }]
};

const openLibraryIsbn = {
  'ISBN:9788595084742': { title: 'A Inquilina', number_of_pages: 304, authors: [{ name: 'Freida McFadden' }] }
};

const mercadoEditorial = {
  books: [{
    isbn: '9788595084742', titulo: 'A Inquilina', paginas: '304',
    sinopse: 'Uma sinopse em portugues vinda da base brasileira do ISBN.',
    autores: [{ nome: 'Freida McFadden' }], editora: { nome: 'Editora BR' }, ano_edicao: '2023'
  }]
};

describe('lookupExternalBooks', () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it('completa paginas e sinopse de outras fontes quando o Google Books nao tem', async () => {
    global.fetch = mockFetch({
      'googleapis.com': googleNoPages,
      'openlibrary.org/api/books': openLibraryIsbn,
      'mercadoeditorial.org': mercadoEditorial
    }) as never;

    const [book] = await lookupExternalBooks('isbn:9788595084742');
    expect(book.title).toBe('A Inquilina');
    expect(book.totalPages).toBe(304);              // veio da Open Library
    expect(book.description).toContain('portugues'); // veio do Mercado Editorial
    expect(book.coverUrl).toContain('capa.jpg');     // manteve a capa do Google
  });

  it('funciona quando so o Mercado Editorial responde (edicao nacional)', async () => {
    global.fetch = mockFetch({ 'mercadoeditorial.org': mercadoEditorial }) as never;
    const [book] = await lookupExternalBooks('isbn:9788595084742');
    expect(book.totalPages).toBe(304);
    expect(book.author).toBe('Freida McFadden');
    expect(book.publisher).toBe('Editora BR');
  });

  it('busca por TITULO tambem consulta as fontes por ISBN usando o ISBN do resultado', async () => {
    // A busca textual acha o livro (com ISBN) mas sem paginas/sinopse. A 2a etapa
    // precisa usar esse ISBN para consultar Mercado Editorial e Open Library.
    global.fetch = mockFetch({
      'googleapis.com/books/v1/volumes?q': googleNoPages,
      'openlibrary.org/api/books': openLibraryIsbn,
      'mercadoeditorial.org': mercadoEditorial
    }) as never;

    const [book] = await lookupExternalBooks('A Inquilina Freida McFadden');
    expect(book.totalPages).toBe(304);
    expect(book.description).toContain('portugues');
  });

  it('completa a sinopse pelo volume detalhado do Google Books', async () => {
    global.fetch = mockFetch({
      'googleapis.com/books/v1/volumes?q': googleNoPages,
      'googleapis.com/books/v1/volumes/g1': {
        id: 'g1',
        volumeInfo: { title: 'A Inquilina', pageCount: 304, description: 'Sinopse completa do volume detalhado.' }
      }
    }) as never;

    const [book] = await lookupExternalBooks('A Inquilina Freida McFadden');
    expect(book.description).toContain('volume detalhado');
    expect(book.totalPages).toBe(304);
  });

  it('usa a Apple Books para a sinopse quando o titulo confere (e limpa o HTML)', async () => {
    global.fetch = mockFetch({
      'googleapis.com/books/v1/volumes?q': googleNoPages,
      'itunes.apple.com': {
        results: [{
          trackId: 1, trackName: 'A Inquilina', artistName: 'Freida McFadden',
          description: '<p>Sinopse <b>vinda</b> da Apple.</p>', artworkUrl100: 'http://x/100x100bb.jpg'
        }]
      }
    }) as never;

    const [book] = await lookupExternalBooks('A Inquilina Freida McFadden');
    expect(book.description).toBe('Sinopse vinda da Apple.');
    expect(book.description).not.toContain('<');
  });

  it('IGNORA resultado da Apple quando o titulo e de outro livro', async () => {
    global.fetch = mockFetch({
      'googleapis.com/books/v1/volumes?q': googleNoPages,
      'itunes.apple.com': {
        results: [{ trackId: 9, trackName: 'Outro Livro Totalmente Diferente', description: '<p>Sinopse errada.</p>' }]
      }
    }) as never;

    const [book] = await lookupExternalBooks('A Inquilina Freida McFadden');
    expect(book.description || '').not.toContain('errada');
  });

  it('pega a sinopse da obra na Open Library quando o Google nao acha nada', async () => {
    global.fetch = mockFetch({
      'openlibrary.org/search.json': {
        docs: [{ key: '/works/OL123W', title: 'A Inquilina', author_name: ['Freida McFadden'], number_of_pages_median: 304 }]
      },
      'openlibrary.org/works/OL123W.json': { description: { value: 'Sinopse da obra na Open Library.' }, subjects: ['Suspense'] }
    }) as never;

    const [book] = await lookupExternalBooks('A Inquilina Freida McFadden');
    expect(book.description).toContain('Open Library');
    expect(book.totalPages).toBe(304);
  });

  it('nao quebra quando todos os provedores falham', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('offline'))) as never;
    await expect(lookupExternalBooks('isbn:9788595084742')).resolves.toEqual([]);
  });

  it('ignora resposta com formato inesperado em vez de inventar dados', async () => {
    global.fetch = mockFetch({ 'mercadoeditorial.org': { books: [{ foo: 'bar' }] } }) as never;
    await expect(lookupExternalBooks('isbn:9788595084742')).resolves.toEqual([]);
  });
});
