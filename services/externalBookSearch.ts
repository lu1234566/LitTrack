import { ExternalBook } from '@/types/externalBook';

function normalizeCover(url?: string) {
  if (!url) return undefined;
  return url.replace('http://', 'https://');
}

function pickIsbn(industryIdentifiers?: Array<{ type: string; identifier: string }>) {
  if (!industryIdentifiers?.length) return undefined;
  return industryIdentifiers.find((item) => item.type === 'ISBN_13')?.identifier || industryIdentifiers[0]?.identifier;
}

export async function searchGoogleBooks(query: string): Promise<ExternalBook[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];
  const url = 'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(cleaned) + '&maxResults=12&langRestrict=pt';
  const response = await fetch(url);
  if (!response.ok) throw new Error('Nao foi possivel buscar livros agora.');
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
}
