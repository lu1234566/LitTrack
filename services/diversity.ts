import { Book } from '@/types/book';

// Reading-diversity stats from data Readora already has: how spread out your
// reading is across publication decades, genres and authors. No external data.

export type DecadeBar = { decade: number; label: string; count: number };

export type DiversityStats = {
  distinctGenres: number;
  distinctAuthors: number;
  decades: DecadeBar[];
  oldest: { year: number; title: string } | null;
  newest: { year: number; title: string } | null;
  spanYears: number;
  withYear: number;
};

/** Pulls a 4-digit publication year out of a free-form publishedDate string. */
export function parseYear(value?: string): number | null {
  const match = String(value || '').match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

export function buildDiversity(books: Book[]): DiversityStats {
  const finished = books.filter((b) => b.status === 'finished');

  const genres = new Set<string>();
  const authors = new Set<string>();
  finished.forEach((b) => {
    if (b.genre && b.genre.trim()) genres.add(b.genre.trim().toLowerCase());
    if (b.author && b.author.trim()) authors.add(b.author.trim().toLowerCase());
  });

  const dated = finished
    .map((b) => ({ year: parseYear(b.publishedDate), title: b.title }))
    .filter((d): d is { year: number; title: string } => d.year !== null);

  const decadeCounts: Record<number, number> = {};
  dated.forEach((d) => { const dec = Math.floor(d.year / 10) * 10; decadeCounts[dec] = (decadeCounts[dec] || 0) + 1; });
  const decades: DecadeBar[] = Object.keys(decadeCounts)
    .map(Number)
    .sort((a, b) => a - b)
    .map((decade) => ({ decade, label: decade + 's', count: decadeCounts[decade] }));

  const sorted = [...dated].sort((a, b) => a.year - b.year);
  const oldest = sorted[0] || null;
  const newest = sorted[sorted.length - 1] || null;

  return {
    distinctGenres: genres.size,
    distinctAuthors: authors.size,
    decades,
    oldest,
    newest,
    spanYears: oldest && newest ? newest.year - oldest.year : 0,
    withYear: dated.length
  };
}
