export type BookStatus = 'lido' | 'lendo' | 'quero ler';

export type BookGenre =
  | 'Ficção'
  | 'Não Ficção'
  | 'Fantasia'
  | 'Ficção Científica'
  | 'Romance'
  | 'Suspense'
  | 'Terror'
  | 'Biografia'
  | 'História'
  | 'Autoajuda'
  | 'Outro';

export interface BookRatings {
  historia: number;
  personagens: number;
  ritmo: number;
  originalidade: number;
  impactoEmocional: number;
  final: number;
}

export interface AuthorRanking {
  autor: string;
  motivo: string;
}

export interface MoodActivity {
  mood: string;
  intensity: number;
}

export interface ReadingBehavior {
  pattern: string;
  description: string;
}

export interface GenreMetric {
  genre: string;
  intensity: number;
  strictness: number;
  averageRating: number;
}

export interface EvolutionMetric {
  period: string; // Ex: "Jan 2024" ou "2024"
  topGenre: string;
  averageRating: number;
  booksCount: number;
  pagesRead: number;
  averageBookLength: number;
}

export interface LiteraryProfile {
  generoFavorito: string;
  tipoNarrativaFavorita: string;
  elementoMaisValorizado: string;
  pontoMaisCritico: string;
  autorMaisCompativel: string;
  estiloLeitor: string;
  insights: string[];
  analiseDetalhada: string;
  rankingAutores: AuthorRanking[];
  dataAtualizacao: number;
  
  // Mood and advanced analysis
  moodMap: MoodActivity[];
  readingStyleBehavior: ReadingBehavior[];
  genreMetrics: GenreMetric[];
  evolutionData?: EvolutionMetric[];
  evolutionInsights?: string[];
  archetype: {
    name: string;
    description: string;
    emotionalResonance: string;
    demandingGenre: string;
  };
  preferredLength: 'short' | 'medium' | 'long' | 'varied';
  readingPace?: {
    avgPagesPerBook: number;
    avgDaysToFinish: number;
    shortestBook?: { title: string; pages: number };
    longestBook?: { title: string; pages: number };
    preferredRange: string;
    avgPagesPerMonth: number;
  };
}

export interface Recommendation {
  titulo: string;
  autor: string;
  genero: string;
  motivo: string;
  compatibilidade: number;
  clima: string;
  tipoFinal: string;
  impactoEmocional: string;
}

export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  bookTitle?: string;
  date: number;
  startPage?: number;
  endPage: number;
  pagesRead: number;
  durationMinutes?: number;
  mood?: string;
  quickNote?: string;
  createdAt: any;
}

export interface Book {
  id: string;
  userId: string;
  titulo: string;
  autor: string;
  mesLeitura: string;
  anoLeitura: number;
  genero: BookGenre;
  status: BookStatus;
  notaGeral: number;
  resenha: string;
  pontosFortes: string;
  pontosFracos: string;
  citacaoFavorita?: string;
  favorito: boolean;
  notasDetalhadas: BookRatings;
  ilustracaoUrl?: string;
  coverUrl?: string;
  coverSource?: 'automatic' | 'url' | 'local' | 'placeholder' | 'manual';
  pageCount?: number;
  currentPage?: number;
  totalPages?: number;
  progressPercentage?: number;
  startedAt?: number;
  finishedAt?: number;
  // Wishlist / Queue fields
  priority?: 'low' | 'medium' | 'high';
  reasonToRead?: string;
  discoveredFrom?: string;
  queueOrder?: number;
  addedAt?: number;
  description?: string;
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
  moods?: string[];
  dataCadastro: number;
  createdAt?: any;
}

export interface UserProfile {
  id: string;
  displayName: string;
  photoURL: string;
  bio: string;
  booksRead: number;
  pagesRead: number;
  averageRating: number;
  favoriteGenre: string;
  favoriteBookId?: string;
  readingStreak: number;
  lastReadDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserGoal {
  id: string;
  userId: string;
  year: number;
  booksGoal: number;
  pagesGoal: number;
  createdAt: number;
  updatedAt: number;
}

export interface Shelf {
  id: string;
  userId: string;
  name: string;
  description?: string;
  accentColor?: string;
  coverImage?: string;
  bookIds: string[];
  type: 'system' | 'custom';
  sortOrder?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Quote {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  text: string;
  page?: number;
  personalNote?: string;
  moodLabel?: string;
  isFavorite: boolean;
  createdAt: number;
}

export type BackupActionType = 'export_json' | 'export_pdf' | 'import_json' | 'restore_backup';
export type BackupStatus = 'sucesso' | 'falha' | 'parcial';

export interface BackupHistory {
  id: string;
  userId: string;
  actionType: BackupActionType;
  format: 'json' | 'pdf';
  status: BackupStatus;
  details: string;
  affectedRecords: number;
  createdAt: number;
  fileName?: string;
  scope?: string;
  errorMessage?: string;
}

export interface ReminderSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'weekdays';
  time: string; // HH:mm
  types: {
    reading: boolean;
    logging: boolean;
    updateProgress: boolean;
  };
}
