import { Book } from '@/types/book';
import { Quote } from '@/types/quote';
import { Shelf } from '@/types/shelf';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
};

/**
 * Páginas lidas a partir do próprio livro: o total quando concluído, o
 * progresso atual quando em andamento. Mesma conta do ReadingStats — antes
 * isto vinha das sessões de leitura, que foram removidas.
 */
function pagesRead(books: Book[]) {
  return books.reduce((sum, book) => sum + (book.status === 'finished' ? (book.totalPages || 0) : (book.currentPage || 0)), 0);
}

export function buildAchievements(books: Book[], quotes: Quote[], shelves: Shelf[]): Achievement[] {
  const finishedBooks = books.filter((book) => book.status === 'finished').length;
  const pages = pagesRead(books);
  const favoriteQuotes = quotes.filter((quote) => quote.favorite).length;
  const ratedBooks = books.filter((book) => (book.rating || 0) > 0).length;
  const withCover = books.filter((book) => book.coverUrl).length;

  return [
    make('first-book', 'Primeira leitura', 'Concluir o primeiro livro.', finishedBooks, 1),
    make('five-books', 'Estante viva', 'Concluir 5 livros.', finishedBooks, 5),
    make('twenty-books', 'Maratonista', 'Concluir 20 livros.', finishedBooks, 20),
    make('hundred-pages', 'Cem páginas', 'Acumular 100 páginas lidas.', pages, 100),
    make('thousand-pages', 'Mil páginas', 'Acumular 1.000 páginas lidas.', pages, 1000),
    make('ten-thousand-pages', 'Dez mil páginas', 'Acumular 10.000 páginas lidas.', pages, 10000),
    make('five-quotes', 'Guardião de trechos', 'Salvar 5 citações.', quotes.length, 5),
    make('favorite-quotes', 'Curador de frases', 'Favoritar 3 citações.', favoriteQuotes, 3),
    make('three-shelves', 'Bibliotecário', 'Criar 3 estantes.', shelves.length, 3),
    make('rated-books', 'Crítico literário', 'Avaliar 10 livros.', ratedBooks, 10),
    make('covered-books', 'Parede de capas', 'Ter 15 livros com capa.', withCover, 15)
  ];
}

function make(id: string, title: string, description: string, progress: number, target: number): Achievement {
  return { id, title, description, progress: Math.min(progress, target), target, unlocked: progress >= target };
}
