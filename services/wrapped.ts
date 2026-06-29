import { Book } from '@/types/book';
import { FeedCapsuleBook } from '@/components/FeedCapsuleArt';

export type WrappedData = {
  year: number;
  totalBooks: number;
  totalPages: number;
  ratingOutOf10: number;
  topAuthor: string;
  topAuthorCount: number;
  topGenre: string;
  vibe: string;
  longestBook: FeedCapsuleBook | null;
  bestBook: FeedCapsuleBook | null;
  top5: FeedCapsuleBook[];
  ranked: FeedCapsuleBook[];
};

function toCard(book: Book): FeedCapsuleBook {
  return { id: book.id, title: book.title, author: book.author, pageCount: book.totalPages || 0, rating: book.rating || 0, coverUrl: book.coverUrl };
}

function topEntry(counts: Record<string, number>): [string, number] {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0] || ['', 0];
}

/** Aggregates a year's finished books into a Spotify-Wrapped-style summary. */
export function buildWrapped(books: Book[], year: number): WrappedData {
  const finished = books.filter((book) => {
    if (book.status !== 'finished') return false;
    return new Date(book.finishedAt || book.updatedAt || book.createdAt).getFullYear() === year;
  });

  const totalBooks = finished.length;
  const totalPages = finished.reduce((sum, b) => sum + (b.totalPages || 0), 0);
  const rated = finished.filter((b) => (b.rating || 0) > 0);
  const ratingOutOf10 = rated.length ? (rated.reduce((s, b) => s + (b.rating || 0), 0) / rated.length) * 2 : 0;

  const authorCounts: Record<string, number> = {};
  const genreCounts: Record<string, number> = {};
  const moodCounts: Record<string, number> = {};
  finished.forEach((b) => {
    if (b.author) authorCounts[b.author] = (authorCounts[b.author] || 0) + 1;
    if (b.genre) genreCounts[b.genre] = (genreCounts[b.genre] || 0) + 1;
    (b.mood || '').split(',').map((m) => m.trim()).filter(Boolean).forEach((m) => { moodCounts[m] = (moodCounts[m] || 0) + 1; });
  });

  const [topAuthor, topAuthorCount] = topEntry(authorCounts);
  const [topGenre] = topEntry(genreCounts);
  const [vibe] = topEntry(moodCounts);

  const ranked = [...finished]
    .sort((a, b) => {
      if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
      if ((b.totalPages || 0) !== (a.totalPages || 0)) return (b.totalPages || 0) - (a.totalPages || 0);
      return a.title.localeCompare(b.title);
    })
    .map(toCard);

  const longest = [...finished].filter((b) => (b.totalPages || 0) > 0).sort((a, b) => (b.totalPages || 0) - (a.totalPages || 0))[0];

  return {
    year,
    totalBooks,
    totalPages,
    ratingOutOf10,
    topAuthor: topAuthor || '—',
    topAuthorCount,
    topGenre: topGenre || 'Diverso',
    vibe: vibe || 'Sereno',
    longestBook: longest ? toCard(longest) : null,
    bestBook: ranked[0] || null,
    top5: ranked.slice(0, 5),
    ranked: ranked.slice(0, 10)
  };
}
