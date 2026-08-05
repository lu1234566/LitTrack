import { ExternalBook } from '@/types/externalBook';

function normalizeCover(url?: string) {
  if (!url) return undefined;
  return url.replace('http://', 'https://');
}

function pickIsbn(industryIdentifiers?: Array<{ type: string; identifier: string }>) {
  if (!industryIdentifiers?.length) return undefined;
  return industryIdentifiers.find((item) => item.type === 'ISBN_13')?.identifier || industryIdentifiers[0]?.identifier;
}

async function fetchWithTimeout(url: string, timeoutMs = 7000) {
  return Promise.race([
    fetch(url),
    new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
  ]);
}

const demoBooks: ExternalBook[] = [
  {
    id: 'demo-eragon',
    title: 'Eragon',
    author: 'Christopher Paolini',
    genre: 'Fantasia',
    publisher: 'Rocco',
    publishedDate: '2003',
    totalPages: 468,
    isbn: '9788532518485',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780375826689-L.jpg',
    description: 'Um jovem encontra uma pedra azul que revela ser um ovo de dragao, iniciando uma jornada em Alagaesia.',
    source: 'open-library'
  },
  {
    id: 'demo-brisingr',
    title: 'Brisingr',
    author: 'Christopher Paolini',
    genre: 'Fantasia',
    publisher: 'Rocco',
    publishedDate: '2008',
    totalPages: 748,
    isbn: '9780375826726',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780375826726-L.jpg',
    description: 'A saga de Eragon continua em meio a aliancas, conflitos e descobertas sobre os Cavaleiros de Dragao.',
    source: 'open-library'
  },
  {
    id: 'demo-verity',
    title: 'Verity',
    author: 'Colleen Hoover',
    genre: 'Suspense',
    publisher: 'Galera',
    publishedDate: '2018',
    totalPages: 336,
    isbn: '9781538724736',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781538724736-L.jpg',
    description: 'Um suspense psicologico sobre manuscritos, segredos e uma narradora pouco confiavel.',
    source: 'open-library'
  }
];

function fallbackBooks(query: string) {
  const normalized = query.toLowerCase();
  const filtered = demoBooks.filter((book) => (book.title + ' ' + book.author + ' ' + book.genre).toLowerCase().includes(normalized));
  return filtered.length ? filtered : demoBooks;
}

/** Extrai só os dígitos (e o X final) de um ISBN digitado com hífens/espaços. */
function cleanIsbn(value?: string) {
  const digits = String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
  return digits.length === 10 || digits.length === 13 ? digits : '';
}

// ---------------------------------------------------------------------------
// Provedores. Cada um devolve [] em caso de erro/timeout — nenhum é obrigatório,
// então um provedor fora do ar nunca derruba a busca inteira.
// ---------------------------------------------------------------------------

async function fromGoogleBooks(query: string): Promise<ExternalBook[]> {
  try {
    const url = 'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(query) + '&maxResults=12';
    const response = await fetchWithTimeout(url, 7000);
    if (!response.ok) return [];
    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map((item: any): ExternalBook => {
      const info = item.volumeInfo || {};
      const categories = Array.isArray(info.categories) ? info.categories : [];
      return {
        id: String(item.id),
        title: info.title || 'Titulo desconhecido',
        author: Array.isArray(info.authors) ? info.authors.join(', ') : 'Autor desconhecido',
        genre: categories[0] || 'A definir',
        publisher: info.publisher || '',
        publishedDate: info.publishedDate || '',
        totalPages: Number(info.pageCount) || 0,
        isbn: pickIsbn(info.industryIdentifiers),
        coverUrl: normalizeCover(info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail),
        description: info.description || '',
        source: 'google-books'
      };
    });
  } catch {
    return [];
  }
}

async function fromOpenLibrarySearch(query: string): Promise<ExternalBook[]> {
  try {
    const url = 'https://openlibrary.org/search.json?q=' + encodeURIComponent(query) + '&limit=12';
    const response = await fetchWithTimeout(url, 7000);
    if (!response.ok) return [];
    const data = await response.json();
    const docs = Array.isArray(data.docs) ? data.docs : [];
    return docs.map((item: any): ExternalBook => {
      const isbn = Array.isArray(item.isbn) ? item.isbn[0] : undefined;
      return {
        id: String(item.key || item.cover_edition_key || item.title),
        title: item.title || 'Titulo desconhecido',
        author: Array.isArray(item.author_name) ? item.author_name.join(', ') : 'Autor desconhecido',
        genre: Array.isArray(item.subject) ? item.subject[0] : 'A definir',
        publisher: Array.isArray(item.publisher) ? item.publisher[0] : '',
        publishedDate: item.first_publish_year ? String(item.first_publish_year) : '',
        totalPages: Number(item.number_of_pages_median) || 0,
        isbn,
        coverUrl: isbn ? 'https://covers.openlibrary.org/b/isbn/' + isbn + '-L.jpg' : undefined,
        description: '',
        source: 'open-library'
      };
    });
  } catch {
    return [];
  }
}

/** Open Library por ISBN — costuma ter contagem de páginas da EDIÇÃO exata. */
async function fromOpenLibraryIsbn(isbn: string): Promise<ExternalBook[]> {
  if (!isbn) return [];
  try {
    const url = 'https://openlibrary.org/api/books?bibkeys=ISBN:' + isbn + '&format=json&jscmd=data';
    const response = await fetchWithTimeout(url, 7000);
    if (!response.ok) return [];
    const data = await response.json();
    const item = data?.['ISBN:' + isbn];
    if (!item) return [];
    return [{
      id: 'ol-isbn-' + isbn,
      title: item.title || 'Titulo desconhecido',
      author: Array.isArray(item.authors) ? item.authors.map((a: any) => a?.name).filter(Boolean).join(', ') : 'Autor desconhecido',
      genre: Array.isArray(item.subjects) ? (item.subjects[0]?.name || 'A definir') : 'A definir',
      publisher: Array.isArray(item.publishers) ? (item.publishers[0]?.name || '') : '',
      publishedDate: item.publish_date || '',
      totalPages: Number(item.number_of_pages) || 0,
      isbn,
      coverUrl: normalizeCover(item.cover?.large || item.cover?.medium),
      description: typeof item.notes === 'string' ? item.notes : '',
      source: 'open-library'
    }];
  } catch {
    return [];
  }
}

/**
 * Mercado Editorial — base da agência brasileira do ISBN. É a melhor fonte para
 * edições nacionais (sinopse e título em português), justamente onde o Google
 * Books e a Open Library costumam falhar. Gratuita e sem chave.
 * O parser é defensivo: se o formato da resposta mudar, devolve [] em vez de
 * inventar dados.
 */
async function fromMercadoEditorial(isbn: string): Promise<ExternalBook[]> {
  if (!isbn) return [];
  try {
    const url = 'https://api.mercadoeditorial.org/api/v1.2/book?isbn=' + isbn;
    const response = await fetchWithTimeout(url, 7000);
    if (!response.ok) return [];
    const data = await response.json();
    const rows = Array.isArray(data?.books) ? data.books : [];
    return rows.map((row: any): ExternalBook => {
      const authors = Array.isArray(row?.autores)
        ? row.autores.map((a: any) => (typeof a === 'string' ? a : a?.nome)).filter(Boolean).join(', ')
        : '';
      const covers = row?.imagens?.imagem_primeira_capa || {};
      return {
        id: 'me-' + (row?.isbn || isbn),
        title: row?.titulo || '',
        author: authors,
        genre: row?.assunto || 'A definir',
        publisher: typeof row?.editora === 'string' ? row.editora : (row?.editora?.nome || ''),
        publishedDate: String(row?.ano_edicao || row?.data_publicacao || '').slice(0, 4),
        totalPages: Number(row?.paginas) || 0,
        isbn: row?.isbn || isbn,
        coverUrl: normalizeCover(covers?.grande || covers?.media || covers?.pequena),
        description: row?.sinopse || '',
        source: 'mercado-editorial'
      };
    }).filter((b: ExternalBook) => b.title);
  } catch {
    return [];
  }
}

/** Escolhe o valor "mais completo" entre o atual e o candidato. */
function betterText(current: string | undefined, candidate: string | undefined) {
  const a = (current || '').trim();
  const b = (candidate || '').trim();
  if (!b) return a;
  if (!a) return b;
  return b.length > a.length ? b : a;
}

const VAGUE_GENRES = ['', 'a definir', 'diverso', 'indefinido', 'general', 'fiction'];

/**
 * Mescla o mesmo livro vindo de fontes diferentes, campo a campo: cada provedor
 * preenche o que os outros não têm (ex.: sinopse em PT do Mercado Editorial +
 * número de páginas da Open Library + capa do Google Books).
 */
function mergeBooks(primary: ExternalBook, extras: ExternalBook[]): ExternalBook {
  return extras.reduce<ExternalBook>((acc, extra) => ({
    ...acc,
    title: acc.title || extra.title,
    author: acc.author && acc.author !== 'Autor desconhecido' ? acc.author : (extra.author || acc.author),
    genre: VAGUE_GENRES.includes((acc.genre || '').trim().toLowerCase()) && extra.genre && !VAGUE_GENRES.includes(extra.genre.trim().toLowerCase())
      ? extra.genre
      : acc.genre,
    publisher: acc.publisher || extra.publisher,
    publishedDate: acc.publishedDate || extra.publishedDate,
    totalPages: (acc.totalPages || 0) > 0 ? acc.totalPages : (extra.totalPages || 0),
    isbn: acc.isbn || extra.isbn,
    coverUrl: acc.coverUrl || extra.coverUrl,
    description: betterText(acc.description, extra.description)
  }), primary);
}

// Strict lookup: real provider results only, never the demo fallback. Use this
// for auto-enrichment, where a wrong match (e.g. demo "Eragon") would corrupt
// real book data. Returns [] when nothing is found or the network fails.
//
// Consulta os provedores EM PARALELO e mescla os campos do melhor resultado de
// cada um. Antes a busca parava no primeiro provedor que respondesse: se o
// Google Books achasse o livro mas sem número de páginas, a Open Library nem
// era consultada e o livro seguia incompleto.
export async function lookupExternalBooks(query: string): Promise<ExternalBook[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];

  // "isbn:9788535914849" (usado pelo enriquecimento) ou um ISBN digitado direto.
  const isbnQuery = cleanIsbn(cleaned.replace(/^isbn:/i, ''));

  const [google, olSearch, olIsbn, mercado] = await Promise.all([
    fromGoogleBooks(cleaned),
    isbnQuery ? Promise.resolve([]) : fromOpenLibrarySearch(cleaned),
    fromOpenLibraryIsbn(isbnQuery),
    fromMercadoEditorial(isbnQuery)
  ]);

  const primaryList = google.length ? google : (olSearch.length ? olSearch : (mercado.length ? mercado : olIsbn));
  if (!primaryList.length) return [];

  // Só o primeiro resultado é enriquecido com as outras fontes — é o único que
  // temos certeza de ser o mesmo livro (busca por ISBN é 1:1; por texto, é o
  // melhor palpite do provedor).
  const [first, ...rest] = primaryList;
  const complements = [...olIsbn, ...mercado, ...olSearch.slice(0, 1)].filter((c) => c.id !== first.id);
  return [mergeBooks(first, complements), ...rest];
}

export async function searchGoogleBooks(query: string): Promise<ExternalBook[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];
  const results = await lookupExternalBooks(cleaned);
  return results.length ? results : fallbackBooks(cleaned);
}
