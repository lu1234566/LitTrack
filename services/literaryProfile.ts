import { Book } from '@/types/book';

// Native port of the subset of the web analysisService.analyzeLiteraryProfile
// used by the shareable profile cards. Native books use English fields and a
// 0-5 rating (the web used notaGeral 0-10), so ratings here stay on 0-5.

export type GenreMetric = { genre: string; averageRating: number; intensity: number };
export type MoodSlice = { mood: string; intensity: number };
export type Archetype = { name: string; description: string; emotionalResonance: string; demandingGenre: string };

export type NativeLiteraryProfile = {
  generoFavorito: string;
  tipoNarrativaFavorita: string;
  genreMetrics: GenreMetric[];
  moodMap: MoodSlice[];
  insights: string[];
  archetype: Archetype;
};

const GENRE_MOODS: Record<string, string[]> = {
  'Mistério': ['Misterioso', 'Tenso'],
  'Suspense': ['Tenso', 'Sombrio'],
  'Terror': ['Sombrio', 'Tenso', 'Caótico'],
  'Romance': ['Emocional', 'Aconchegante'],
  'Fantasia': ['Mágico', 'Inspirador'],
  'Ficção Científica': ['Cerebral', 'Reflexivo'],
  'Biografia': ['Inspirador'],
  'História': ['Reflexivo'],
  'Autoajuda': ['Inspirador', 'Aconchegante'],
  'Não Ficção': ['Cerebral', 'Reflexivo'],
  'Ficção': ['Reflexivo']
};

const KEYWORD_MOODS: Record<string, string[]> = {
  sombrio: ['Sombrio'], escuro: ['Sombrio'], tenso: ['Tenso'], ansiedade: ['Tenso'],
  'angústia': ['Tenso', 'Emocional'], triste: ['Emocional'], emocionante: ['Emocional'],
  conforto: ['Aconchegante'], doce: ['Aconchegante'], pensa: ['Reflexivo'], 'filosófico': ['Reflexivo'],
  'mistério': ['Misterioso'], enigma: ['Misterioso'], caos: ['Caótico'], 'mágico': ['Mágico'],
  encantamento: ['Mágico'], intenso: ['Tenso', 'Emocional']
};

function inferMoods(book: Book): string[] {
  const moods = new Set<string>();
  (GENRE_MOODS[book.genre] || []).forEach((m) => moods.add(m));
  const text = ((book.review || '') + ' ' + (book.notes || '')).toLowerCase();
  Object.entries(KEYWORD_MOODS).forEach(([kw, ms]) => {
    if (text.includes(kw)) ms.forEach((m) => moods.add(m));
  });
  return Array.from(moods);
}

function bookMoods(book: Book): string[] {
  const fromField = (book.mood || '').split(',').map((m) => m.trim()).filter(Boolean);
  return fromField.length ? fromField : inferMoods(book);
}

function inferNarrativeType(genre: string): string {
  const map: Record<string, string> = {
    'Mistério': 'Investigativa',
    'Romance': 'Centrada em Personagens',
    'Fantasia': 'World-building denso',
    'Ficção Científica': 'Especulativa'
  };
  return map[genre] || 'Linear e Envolvente';
}

export function analyzeLiteraryProfile(books: Book[]): NativeLiteraryProfile {
  const finished = books.filter((b) => b.status === 'finished');
  const count = finished.length || 1;

  const genreCounts: Record<string, number> = {};
  const genreRatingSum: Record<string, number> = {};
  const genreRatingN: Record<string, number> = {};
  finished.forEach((b) => {
    const g = b.genre || 'A definir';
    genreCounts[g] = (genreCounts[g] || 0) + 1;
    if (b.rating && b.rating > 0) {
      genreRatingSum[g] = (genreRatingSum[g] || 0) + b.rating;
      genreRatingN[g] = (genreRatingN[g] || 0) + 1;
    }
  });
  const favoriteGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Explorador';

  const avgRating = finished.reduce((acc, b) => acc + (b.rating || 0), 0) / count;
  const avgPages = finished.reduce((acc, b) => acc + (b.totalPages || 0), 0) / count;

  const moodCounts: Record<string, number> = {};
  finished.forEach((b) => bookMoods(b).forEach((m) => { moodCounts[m] = (moodCounts[m] || 0) + 1; }));
  const moodMap: MoodSlice[] = Object.entries(moodCounts)
    .map(([mood, c]) => ({ mood, intensity: (c / count) * 100 }))
    .sort((a, b) => b.intensity - a.intensity);
  const dominantMood = moodMap[0]?.mood || 'Neutro';

  let archetype: Archetype = {
    name: 'O Explorador Silencioso',
    description: 'Você lê com curiosidade, buscando novos mundos sem preconceitos de gênero.',
    emotionalResonance: 'Curiosidade',
    demandingGenre: 'Ficção'
  };
  if (dominantMood === 'Sombrio' || dominantMood === 'Tenso') {
    archetype = { name: 'O Estrategista Sombrio', description: 'Você é atraído pelas sombras e pela tensão, buscando entender os labirintos da mente humana.', emotionalResonance: dominantMood, demandingGenre: 'Suspense / Noir' };
  } else if (dominantMood === 'Aconchegante') {
    archetype = { name: 'O Leitor de Atmosferas', description: 'Sua leitura é um refúgio. Você busca histórias que abraçam e trazem conforto.', emotionalResonance: 'Calma', demandingGenre: 'Romance / Slice of Life' };
  } else if (dominantMood === 'Reflexivo' || dominantMood === 'Cerebral') {
    archetype = { name: 'O Analista Metafísico', description: 'Ler para você é pensar. Você busca obras que desafiam sua percepção e expandem seu intelecto.', emotionalResonance: 'Intelecto', demandingGenre: 'Filosofia / Hard Sci-Fi' };
  } else if (avgRating > 4.5) {
    archetype = { name: 'O Entusiasta Devoto', description: 'Você encontra beleza e significado em quase tudo o que lê, mergulhando profundamente em cada história.', emotionalResonance: 'Empatia', demandingGenre: favoriteGenre };
  }

  const lengthInsights: string[] = [];
  if (avgPages < 250) lengthInsights.push('Sua preferência recai sobre leituras curtas e dinâmicas.');
  else if (avgPages > 500) lengthInsights.push('Você não teme a densidade e prefere habitar universos vastos.');
  else lengthInsights.push('Você tende a preferir livros de tamanho médio, entre 250 e 400 páginas.');

  const genreMetrics: GenreMetric[] = Object.entries(genreCounts)
    .map(([genre, c]) => ({ genre, intensity: (c / count) * 100, averageRating: genreRatingN[genre] ? genreRatingSum[genre] / genreRatingN[genre] : 0 }))
    .sort((a, b) => b.intensity - a.intensity);

  return {
    generoFavorito: favoriteGenre,
    tipoNarrativaFavorita: inferNarrativeType(favoriteGenre),
    genreMetrics,
    moodMap,
    insights: [
      'Seu clima literário predominante é ' + dominantMood + '.',
      'Você demonstra uma preferência clara por obras de ' + favoriteGenre + '.',
      ...lengthInsights
    ],
    archetype
  };
}
