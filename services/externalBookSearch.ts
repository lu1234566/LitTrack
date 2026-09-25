import { ExternalBook } from '@/types/externalBook';
import { stripHtml } from '@/services/plainText';

function normalizeCover(url?: string) {
  if (!url) return undefined;
  return url
    .replace('http://', 'https://')
    // O Google Books devolve a miniatura (~128px), que fica borrada numa capa
    // de 250px. `zoom=2` pede a versão maior, e `edge=curl` desenha uma dobra
    // de página falsa que só atrapalha. Ambos são no-op se não estiverem na URL.
    .replace(/([?&])zoom=1(&|$)/, '$1zoom=2$2')
    .replace(/&edge=curl/, '');
}

function pickIsbn(industryIdentifiers?: Array<{ type: string; identifier: string }>) {
  if (!industryIdentifiers?.length) return undefined;
  return industryIdentifiers.find((item) => item.type === 'ISBN_13')?.identifier || industryIdentifiers[0]?.identifier;
}

/**
 * Sem chave, o Google Books joga todas as requisições anônimas numa COTA
 * COMPARTILHADA (consumer "project_number:624717413613") que estoura com o uso
 * de terceiros — devolvendo 429 mesmo para livros comuns. Com a chave em
 * EXPO_PUBLIC_GOOGLE_BOOKS_KEY o app passa a ter a própria cota.
 */
const GOOGLE_BOOKS_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY;
function googleKeyParam() {
  return GOOGLE_BOOKS_KEY ? '&key=' + GOOGLE_BOOKS_KEY : '';
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
    const url = 'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(query) + '&maxResults=12' + googleKeyParam();
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
        description: stripHtml(info.description),
        source: 'google-books'
      };
    });
  } catch {
    return [];
  }
}

/**
 * Detalhe de um volume do Google Books. A busca em lista (`volumes?q=`) costuma
 * vir sem `description` e às vezes sem `pageCount`; o endpoint do volume traz a
 * ficha completa. Usado só para o resultado escolhido.
 */
async function fromGoogleVolume(volumeId: string): Promise<ExternalBook[]> {
  if (!volumeId) return [];
  try {
    const response = await fetchWithTimeout('https://www.googleapis.com/books/v1/volumes/' + encodeURIComponent(volumeId) + '?' + googleKeyParam().slice(1), 7000);
    if (!response.ok) return [];
    const item = await response.json();
    const info = item?.volumeInfo;
    if (!info) return [];
    const categories = Array.isArray(info.categories) ? info.categories : [];
    return [{
      id: String(item.id || volumeId),
      title: info.title || '',
      author: Array.isArray(info.authors) ? info.authors.join(', ') : '',
      genre: categories[0] || 'A definir',
      publisher: info.publisher || '',
      publishedDate: info.publishedDate || '',
      totalPages: Number(info.pageCount) || 0,
      isbn: pickIsbn(info.industryIdentifiers),
      coverUrl: normalizeCover(info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail),
      description: stripHtml(info.description),
      source: 'google-books'
    }];
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
      description: stripHtml(typeof item.notes === 'string' ? item.notes : ''),
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
        description: stripHtml(row?.sinopse),
        source: 'mercado-editorial'
      };
    }).filter((b: ExternalBook) => b.title);
  } catch {
    return [];
  }
}

/** A sinopse da Apple vem em HTML; o app mostra texto puro. */
/**
 * Apple Books (iTunes Search API) — gratuita e sem chave. Vale muito porque
 * funciona por TÍTULO (não exige ISBN) e, com country=BR, devolve a sinopse em
 * português da loja brasileira. Não traz número de páginas.
 */
async function fromAppleBooks(query: string): Promise<ExternalBook[]> {
  if (!query) return [];
  try {
    const url = 'https://itunes.apple.com/search?media=ebook&country=BR&limit=5&term=' + encodeURIComponent(query);
    const response = await fetchWithTimeout(url, 7000);
    if (!response.ok) return [];
    const data = await response.json();
    const rows = Array.isArray(data?.results) ? data.results : [];
    return rows.map((row: any): ExternalBook => ({
      id: 'apple-' + (row?.trackId || row?.trackName || ''),
      title: row?.trackName || '',
      author: row?.artistName || '',
      genre: Array.isArray(row?.genres) ? (row.genres[0] || 'A definir') : 'A definir',
      publisher: '',
      publishedDate: String(row?.releaseDate || '').slice(0, 4),
      totalPages: 0,
      isbn: undefined,
      // artworkUrl100 é 100px; pedindo 600x600 vem uma capa utilizável.
      coverUrl: normalizeCover(String(row?.artworkUrl100 || '').replace(/100x100bb/, '600x600bb')),
      description: stripHtml(row?.description),
      source: 'apple-books'
    })).filter((b: ExternalBook) => b.title);
  } catch {
    return [];
  }
}

/**
 * Ficha da OBRA na Open Library (/works/OL...W.json). É onde mora a sinopse —
 * o endpoint de busca não a devolve.
 */
async function fromOpenLibraryWork(workKey: string): Promise<ExternalBook[]> {
  if (!workKey || !workKey.startsWith('/works/')) return [];
  try {
    const response = await fetchWithTimeout('https://openlibrary.org' + workKey + '.json', 7000);
    if (!response.ok) return [];
    const data = await response.json();
    // `description` vem como string ou como { type, value }.
    const description = typeof data?.description === 'string' ? data.description : (data?.description?.value || '');
    const subjects = Array.isArray(data?.subjects) ? data.subjects : [];
    if (!description && !subjects.length) return [];
    return [{
      id: 'ol-work-' + workKey,
      title: data?.title || '',
      author: '',
      genre: subjects[0] || 'A definir',
      publisher: '',
      publishedDate: '',
      totalPages: 0,
      isbn: undefined,
      coverUrl: undefined,
      description: stripHtml(String(description)),
      source: 'open-library'
    }];
  } catch {
    return [];
  }
}

function normalizeTitle(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // tira acentos
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Guarda-corpo para fontes casadas por TEXTO (Apple Books): só aceita o
 * complemento se o título bater, senão a sinopse de outro livro entraria na
 * ficha. Fontes casadas por ISBN não precisam disso — já são 1:1.
 */
export function looksLikeSameBook(a: string, b: string) {
  const x = normalizeTitle(a);
  const y = normalizeTitle(b);
  if (!x || !y) return false;
  return x === y || x.startsWith(y) || y.startsWith(x);
}

/** Palavras que aparecem em quase todo titulo e nao distinguem nada. */
const VAZIAS = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'on', 'for', 'vol', 'volume', 'book', 'part',
  'o', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na', 'livro'
]);

function tokens(value: string): string[] {
  return normalizeTitle(value).split(' ').filter(Boolean);
}

/** Tokens que carregam significado — cai para todos quando o titulo so tem vazias. */
function tokensUteis(value: string): string[] {
  const todos = tokens(value);
  const uteis = todos.filter((t) => !VAZIAS.has(t) && t.length > 1);
  return uteis.length ? uteis : todos;
}

/** Distancia de edicao, limitada: so precisamos saber se e "quase igual". */
function distancia(a: string, b: string): number {
  if (a === b) return 0;
  const linha = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const guardado = linha[j];
      linha[j] = Math.min(
        linha[j] + 1,
        linha[j - 1] + 1,
        anterior + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      anterior = guardado;
    }
  }
  return linha[b.length];
}

/**
 * Duas palavras são a mesma a menos de um erro de digitação? O acervo do
 * usuário está cheio deles ("beggining", "Divergence") e a comparação exata
 * jogava fora justamente o livro certo.
 */
function mesmaPalavra(a: string, b: string): boolean {
  if (a === b) return true;
  const menor = Math.min(a.length, b.length);
  if (menor < 5) return false;
  return distancia(a, b) <= (menor >= 8 ? 2 : 1);
}

/** 0 a 1: quanto do titulo procurado aparece no titulo do candidato. */
export function titleRelevance(candidato: string, procurado: string): number {
  const alvo = tokensUteis(procurado);
  const tem = tokensUteis(candidato);
  if (!alvo.length || !tem.length) return 0;
  const achados = alvo.filter((palavra) => tem.some((t) => mesmaPalavra(palavra, t)));
  return achados.length / alvo.length;
}

/**
 * Nota do candidato para virar OPÇÃO na tela (não para ser aplicado sozinho).
 *
 * O título pesa mais, mas o autor desempata: "The beginning after the end,
 * vol. 1" de TurtleMe tem que aparecer antes de uma tese acadêmica que só
 * repete a palavra "divergence".
 */
export function candidateScore(candidato: ExternalBook, titulo: string, autor: string): number {
  const nota = titleRelevance(candidato.title, titulo);
  if (nota <= 0) return 0;
  const querido = tokensUteis(autor || '');
  const dele = tokensUteis(candidato.author || '');
  // Sem autor conhecido dos dois lados, não dá para desempatar: fica neutro.
  const notaAutor = !querido.length || !dele.length
    ? 0.4
    : querido.filter((p) => dele.some((d) => mesmaPalavra(p, d))).length / querido.length;
  return nota * 0.68 + notaAutor * 0.32;
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

/**
 * Busca DIRIGIDA por campo, em vez de texto livre.
 *
 * `q=Divergence` devolve qualquer livro que cite a palavra; `intitle:"Divergence"
 * inauthor:"TurtleMe"` devolve o livro certo. A diferenca e enorme para titulos
 * curtos e genericos — comuns em volumes de serie e obras autopublicadas, que
 * sao justamente os que o texto livre errava.
 */
async function fromGoogleBooksFielded(title: string, author: string): Promise<ExternalBook[]> {
  const partes = ['intitle:"' + title.replace(/"/g, '') + '"'];
  if (author) partes.push('inauthor:"' + author.split(',')[0].replace(/"/g, '') + '"');
  return fromGoogleBooks(partes.join(' '));
}

/** A Open Library tem parametros proprios de titulo e autor, mais precisos que `q`. */
async function fromOpenLibraryFielded(title: string, author: string): Promise<ExternalBook[]> {
  try {
    const params = ['title=' + encodeURIComponent(title)];
    if (author) params.push('author=' + encodeURIComponent(author.split(',')[0]));
    const url = 'https://openlibrary.org/search.json?' + params.join('&') + '&limit=12';
    const response = await fetchWithTimeout(url, 7000);
    if (!response.ok) return [];
    const data = await response.json();
    const docs = Array.isArray(data.docs) ? data.docs : [];
    return docs.map((item: any): ExternalBook => ({
      id: String(item.key || item.cover_edition_key || item.title),
      title: item.title || '',
      author: Array.isArray(item.author_name) ? item.author_name.join(', ') : '',
      genre: Array.isArray(item.subject) ? item.subject[0] : 'A definir',
      publisher: Array.isArray(item.publisher) ? item.publisher[0] : '',
      publishedDate: String(item.first_publish_year || ''),
      totalPages: Number(item.number_of_pages_median) || 0,
      isbn: Array.isArray(item.isbn) ? item.isbn[0] : undefined,
      coverUrl: item.cover_i ? 'https://covers.openlibrary.org/b/id/' + item.cover_i + '-L.jpg' : undefined,
      description: '',
      source: 'open-library'
    })).filter((b: ExternalBook) => b.title);
  } catch {
    return [];
  }
}

/**
 * Candidatos para um livro que temos titulo e autor — todas as fontes dirigidas
 * em paralelo. Usada pelo enriquecimento ANTES do texto livre: quando ela acha,
 * a chance de ser o livro certo e muito maior.
 */
export type DirectedLookup = {
  /** O livro, quando as fontes concordam que e ele. */
  match?: ExternalBook;
  /** TUDO que as fontes devolveram, inclusive o que nao passou no filtro. */
  seen: ExternalBook[];
};

/**
 * Como `lookupByTitleAuthor`, mas devolve tambem o que foi descartado.
 *
 * O filtro de semelhanca continua valendo para o preenchimento automatico —
 * mas o descarte ia direto para o lixo, e com ele sumiam as opcoes da Open
 * Library e da Apple. Quem precisa PERGUNTAR ao usuario usa `seen`.
 */
export async function lookupByTitleAuthorDetailed(title: string, author = ''): Promise<DirectedLookup> {
  const limpo = title.trim();
  if (!limpo) return { seen: [] };
  const livre = [limpo, author].filter(Boolean).join(' ');
  const [google, openLibrary, apple, olLivre] = await Promise.all([
    fromGoogleBooksFielded(limpo, author).catch(() => []),
    fromOpenLibraryFielded(limpo, author).catch(() => []),
    fromAppleBooks(livre).catch(() => []),
    // Titulo com erro de digitacao nao casa nos campos `title=`/`author=`, mas
    // o `q=` da Open Library perdoa — e traz capa onde o Google nao tem.
    fromOpenLibrarySearch(livre).catch(() => [])
  ]);
  const seen = [...google, ...openLibrary, ...apple, ...olLivre];
  // So o que realmente parece ser o mesmo livro: uma busca dirigida que erra o
  // alvo e pior do que nao achar nada, porque preenche dado de outro livro.
  const candidatos = seen.filter((c) => looksLikeSameBook(c.title, limpo));
  if (!candidatos.length) return { seen };
  return { match: mergeBooks(candidatos[0], candidatos.slice(1)), seen };
}

export async function lookupByTitleAuthor(title: string, author = ''): Promise<ExternalBook[]> {
  const { match } = await lookupByTitleAuthorDetailed(title, author);
  return match ? [match] : [];
}

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
  const complements = [...olIsbn, ...mercado, ...olSearch.slice(0, 1)];

  // 2ª etapa: busca dirigida ao livro já identificado. Roda quando ainda falta
  // algo, consultando TODAS as fontes que ajudam nesse caso — inclusive as que
  // não puderam entrar na 1ª etapa por dependerem do ISBN, que só agora é
  // conhecido. Tudo em paralelo: o custo é uma rodada de rede, não uma por fonte.
  const stillIncomplete = () => !first.description || !(first.totalPages || 0) || !first.coverUrl;
  if (stillIncomplete()) {
    const matchIsbn = cleanIsbn(first.isbn);
    const titleQuery = [first.title, first.author].filter((v) => v && v !== 'Autor desconhecido').join(' ').trim();
    const workKey = first.source === 'open-library' && first.id.startsWith('/works/') ? first.id : '';

    const [olByMatch, meByMatch, apple, olWork, googleDetail] = await Promise.all([
      !isbnQuery && matchIsbn ? fromOpenLibraryIsbn(matchIsbn) : Promise.resolve([]),
      !isbnQuery && matchIsbn ? fromMercadoEditorial(matchIsbn) : Promise.resolve([]),
      fromAppleBooks(titleQuery),
      fromOpenLibraryWork(workKey),
      first.source === 'google-books' ? fromGoogleVolume(first.id) : Promise.resolve([])
    ]);

    const appleMatch = apple.filter((candidate) => looksLikeSameBook(candidate.title, first.title)).slice(0, 1);
    complements.push(...olByMatch, ...meByMatch, ...olWork, ...googleDetail, ...appleMatch);
  }

  return [mergeBooks(first, complements.filter((c) => c !== first)), ...rest];
}

export async function searchGoogleBooks(query: string): Promise<ExternalBook[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];
  const results = await lookupExternalBooks(cleaned);
  return results.length ? results : fallbackBooks(cleaned);
}

export type CoverCandidate = {
  url: string;
  /** Título como a fonte devolveu — ajuda a perceber que veio outra edição. */
  title: string;
  author: string;
  source: string;
};

/**
 * Capas candidatas para escolher à mão, a partir do título (o autor é
 * opcional e só melhora a pontaria).
 *
 * Diferente de `lookupExternalBooks`, que identifica UM livro e o completa:
 * aqui o objetivo é o oposto — juntar quantas capas diferentes for possível,
 * de todas as fontes, para o usuário bater o olho e escolher. Livros
 * brasileiros costumam ter capa nacional só no Mercado Editorial, e edições em
 * inglês só na Apple, então nenhuma fonte sozinha resolve.
 */
export async function searchBookCovers(title: string, author = '', isbn = ''): Promise<CoverCandidate[]> {
  const termo = [title, author].filter(Boolean).join(' ').trim();
  if (!termo) return [];
  const isbnLimpo = cleanIsbn(isbn);

  const [google, openLibrary, apple, olIsbn, mercado] = await Promise.all([
    fromGoogleBooks(termo).catch(() => []),
    fromOpenLibrarySearch(termo).catch(() => []),
    fromAppleBooks(termo).catch(() => []),
    isbnLimpo ? fromOpenLibraryIsbn(isbnLimpo).catch(() => []) : Promise.resolve([]),
    isbnLimpo ? fromMercadoEditorial(isbnLimpo).catch(() => []) : Promise.resolve([])
  ]);

  const candidatos: CoverCandidate[] = [];
  const vistas = new Set<string>();
  const adicionar = (livros: ExternalBook[], fonte: string) => {
    livros.forEach((livro) => {
      if (!livro.coverUrl || vistas.has(livro.coverUrl)) return;
      vistas.add(livro.coverUrl);
      candidatos.push({ url: livro.coverUrl, title: livro.title, author: livro.author, source: fonte });
    });
  };

  // Busca por ISBN primeiro: quando existe, é a capa da edição exata.
  adicionar(mercado, 'Mercado Editorial');
  adicionar(olIsbn, 'Open Library');
  adicionar(google, 'Google Books');
  adicionar(apple, 'Apple Books');
  adicionar(openLibrary, 'Open Library');

  return candidatos.slice(0, 12);
}
