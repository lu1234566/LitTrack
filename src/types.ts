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
  description?: string;
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
  dataCadastro: number;
}
