export interface ExternalBook {
  id: string;
  title: string;
  author: string;
  genre: string;
  publisher?: string;
  publishedDate?: string;
  totalPages?: number;
  isbn?: string;
  coverUrl?: string;
  description?: string;
  source: 'google-books' | 'open-library';
}
