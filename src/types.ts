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

export type IllustrationStyle =
  | 'aquarela'
  | 'fantasia sombria'
  | 'thriller cinematográfico'
  | 'minimalista'
  | 'clássico editorial'
  | 'dreamlike'
  | 'Dark Fantasy'
  | 'Vintage Book Illustration'
  | 'Minimalist Poster'
  | 'Surreal Dreamlike'
  | 'Anime Inspired'
  | 'Oil Painting'
  | 'Watercolor'
  | 'Noir Thriller';

export type ImageAspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

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
  date: number;
  startPage?: number;
  endPage: number;
  pagesRead: number;
  durationMinutes?: number;
  note?: string;
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
  estiloIlustracao?: IllustrationStyle;
  proporcaoIlustracao?: ImageAspectRatio;
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
  dataCadastro: number;
  createdAt?: any;
}

export interface UserProfile {
  id: string;
  displayName: string;
  photoURL: string;
  bio: string;
  communityPublic: boolean;
  showBooksPublicly: boolean;
  showStatsPublicly: boolean;
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

export type FeedItemType = 'finished_book' | 'added_book' | 'rated_book' | 'milestone' | 'leaderboard' | 'manual' | 'challenge_completed' | 'badge_earned' | 'community_created' | 'shared_book_updated' | 'club_post';

export type CommunityVisibility = 'public' | 'private';
export type CommunityRole = 'owner' | 'admin' | 'member';

export interface SharedBook {
  bookId?: string;
  title: string;
  author: string;
  coverUrl?: string;
  startDate?: number;
  endDate?: number;
  discussionPrompt?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  bannerUrl?: string;
  ownerId: string;
  visibility: CommunityVisibility;
  inviteCode: string;
  createdAt: number;
  memberCount: number;
  sharedBook?: SharedBook;
  pastSharedBooks?: SharedBook[];
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  role: CommunityRole;
  joinedAt: number;
  sharedBookProgress?: number;
  sharedBookFinished?: boolean;
  lastProgressUpdate?: number;
}

export interface CommunityFeedItem {
  id: string;
  userId: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  type: FeedItemType;
  content: string;
  createdAt: number;
  relatedBookId?: string;
  metadata?: any;
  likesCount?: number;
  commentsCount?: number;
}

export interface Comment {
  id: string;
  feedItemId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  content: string;
  createdAt: number;
}

export interface Like {
  id: string;
  feedItemId: string;
  userId: string;
  reactionType: string; // 'biblio', 'star', etc
  createdAt: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  goalType: 'books_read' | 'pages_read' | 'streak' | 'genre' | 'specific_book';
  goalValue: number | string;
  active: boolean;
  icon?: string;
}

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  completedAt?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: number;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: number;
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
  color?: string;
  bookIds: string[];
  createdAt: number;
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
