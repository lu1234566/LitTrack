export type BookStatus = 'reading' | 'finished' | 'wishlist';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  status: BookStatus;
  rating?: number;
  totalPages?: number;
  currentPage?: number;
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
