export type BookStatus = 'reading' | 'finished' | 'wishlist' | 'dnf';
/** Sem valor = físico (livros antigos). Ver services/bookFormat. */
export type BookFormat = 'physical' | 'ebook' | 'audiobook';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  status: BookStatus;
  rating?: number;
  totalPages?: number;
  currentPage?: number;
  format?: BookFormat;
  /** E-book: porcentagem lida (0–100). */
  progressPercent?: number;
  /** Audiolivro: duração total e tempo ouvido, em minutos. */
  totalMinutes?: number;
  listenedMinutes?: number;
  review?: string;
  favoriteQuote?: string;
  publisher?: string;
  publishedDate?: string;
  isbn?: string;
  coverUrl?: string;
  description?: string;
  priority?: string;
  reasonToRead?: string;
  mood?: string;
  contentWarnings?: string;
  notes?: string;
  startedAt?: number;
  finishedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ReadingStats {
  totalBooks: number;
  finishedBooks: number;
  readingBooks: number;
  wishlistBooks: number;
  averageRating: number;
  pagesRead: number;
  completionRate: number;
  favoriteGenre: string;
  currentProgress: number;
}
