import { ExternalBook } from '@/types/externalBook';

function normalizeCover(url?: string) {
  if (!url) return undefined;
  return url.replace('http://', 'https://');
}

function pickIsbn(industryIdentifiers?: Array<{ type: string; identifier: string }>) {
  if (!industryIdentifiers?.length) return undefined;
  return industryIdentifiers.find((item) => item.type === 'ISBN_13')?.identifier || industryIdentifiers[0]?.identifier;
}

async function fetchWithTimeout(url: string, timeoutMs = 2500) {
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

export async function searchGoogleBooks(query: string): Promise<ExternalBook[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];

  try {
    const url = 'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(cleaned) + '&maxResults=12';
    const response = await fetchWithTimeout(url, 2200);
    if (response.ok) {
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      const results = items.map((item: any): ExternalBook => {
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
      if (results.length) return results;
    }
  } catch {}

  try {
    const url = 'https://openlibrary.org/search.json?q=' + encodeURIComponent(cleaned) + '&limit=12';
    const response = await fetchWithTimeout(url, 2200);
    if (response.ok) {
      const data = await response.json();
      const docs = Array.isArray(data.docs) ? data.docs : [];
      const results = docs.map((item: any): ExternalBook => {
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
          description: 'Resultado importado da Open Library.',
          source: 'open-library'
        };
      });
      if (results.length) return results;
    }
  } catch {}

  return fallbackBooks(cleaned);
}
