import { Book } from '@/types/book';

// "O que ler agora?" — surfaces unread books that match a desired mood + length.
// Readora only stores the *user's own* mood tags (mostly on finished books), so
// for unread candidates we infer the likely mood from a genre→mood affinity
// learned from what the user already finished. No external data, no network.

export type LengthBucket = 'any' | 'curto' | 'medio' | 'longo';

export const MOOD_OPTIONS = [
  'Tenso', 'Caótico', 'Sereno', 'Misterioso', 'Sombrio', 'Esperançoso',
  'Reflexivo', 'Romântico', 'Empolgante', 'Engraçado', 'Melancólico', 'Inspirador'
];

export const LENGTH_OPTIONS: { id: LengthBucket; label: string }[] = [
  { id: 'any', label: 'Qualquer' },
  { id: 'curto', label: 'Curto · até 250' },
  { id: 'medio', label: 'Médio · 250–450' },
  { id: 'longo', label: 'Longo · 450+' }
];

export function lengthBucketOf(pages?: number): Exclude<LengthBucket, 'any'> | null {
  if (!pages || pages <= 0) return null;
  if (pages <= 250) return 'curto';
  if (pages <= 450) return 'medio';
  return 'longo';
}

function moodsOf(book: Book): string[] {
  return (book.mood || '').split(',').map((m) => m.trim()).filter(Boolean);
}

/** Learns which moods each genre tends to produce, from the user's finished, mood-tagged books. */
export function buildGenreMoodAffinity(books: Book[]): Record<string, Record<string, number>> {
  const affinity: Record<string, Record<string, number>> = {};
  books.forEach((book) => {
    if (book.status !== 'finished' || !book.genre) return;
    const moods = moodsOf(book);
    if (!moods.length) return;
    affinity[book.genre] = affinity[book.genre] || {};
    moods.forEach((mood) => { affinity[book.genre][mood] = (affinity[book.genre][mood] || 0) + 1; });
  });
  return affinity;
}

export type MoodPick = { book: Book; score: number; reasons: string[]; inferred: boolean };

export type MoodQuery = { moods: string[]; length: LengthBucket };

/**
 * Ranks unread (wishlist + reading) books against the desired mood/length.
 * Direct mood tags win; otherwise the genre→mood affinity infers a fit.
 */
export function pickWhatToRead(books: Book[], query: MoodQuery): MoodPick[] {
  const desired = new Set(query.moods);
  const affinity = buildGenreMoodAffinity(books);
  const candidates = books.filter((b) => b.status === 'wishlist' || b.status === 'reading');

  const scored = candidates.map((book): MoodPick => {
    let score = 0;
    const reasons: string[] = [];
    let inferred = false;

    if (desired.size) {
      const own = moodsOf(book).filter((m) => desired.has(m));
      if (own.length) {
        score += 40 + own.length * 6;
        reasons.push('você marcou como ' + own.join(', '));
      } else {
        // Infer from genre affinity.
        const genreMoods = affinity[book.genre] || {};
        const total = Object.values(genreMoods).reduce((s, n) => s + n, 0);
        const hit = [...desired].reduce((s, m) => s + (genreMoods[m] || 0), 0);
        if (total > 0 && hit > 0) {
          score += Math.round((hit / total) * 30) + 8;
          inferred = true;
          reasons.push('seus livros de ' + book.genre + ' costumam ter esse clima');
        }
      }
    }

    if (query.length !== 'any') {
      const bucket = lengthBucketOf(book.totalPages);
      if (bucket === query.length) { score += 14; reasons.push('tem o tamanho que você pediu'); }
      else if (bucket && bucket !== query.length) { score -= 6; }
    }

    if (book.status === 'wishlist') { score += 5; }
    if (book.status === 'reading') { score += 3; reasons.push('já está em andamento'); }
    if (book.priority === 'alta') { score += 4; }

    return { book, score, reasons, inferred };
  });

  // When moods are chosen, only keep books that actually matched a mood signal.
  const filtered = desired.size
    ? scored.filter((p) => p.reasons.some((r) => r.includes('clima') || r.includes('marcou')))
    : scored;

  return filtered.sort((a, b) => b.score - a.score).slice(0, 12);
}
