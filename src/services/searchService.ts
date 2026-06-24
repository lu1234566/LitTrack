import { Book, Quote, Shelf } from '../types';

export interface SearchResults {
  books: Book[];
  quotes: Quote[];
  shelves: Shelf[];
  suggestedMoodMatch?: string;
}

export const searchService = {
  performUnifiedSearch(
    query: string, 
    books: Book[], 
    quotes: Quote[], 
    shelves: Shelf[]
  ): SearchResults {
    const q = query.toLowerCase().trim();
    if (!q) return { books: [], quotes: [], shelves: [] };

    const tokens = q.split(/\s+/).filter(t => t.length > 2);
    if (tokens.length === 0 && q.length > 0) tokens.push(q);

    // 1. Books Search
    const matchedBooks = books.filter(book => {
      const searchBlob = [
        book.titulo,
        book.autor,
        book.genero,
        book.resenha,
        book.pontosFortes,
        book.pontosFracos,
        book.description,
        book.publisher,
        ...(book.moods || []),
        book.reasonToRead
      ].map(s => s?.toLowerCase() || '').join(' ');

      return tokens.some(token => searchBlob.includes(token));
    }).sort((a, b) => {
      // Basic relevance: count how many tokens match
      const aBlob = [a.titulo, a.autor, a.genero, ...(a.moods || [])].join(' ').toLowerCase();
      const bBlob = [b.titulo, b.autor, b.genero, ...(b.moods || [])].join(' ').toLowerCase();
      
      const aMatches = tokens.filter(t => aBlob.includes(t)).length;
      const bMatches = tokens.filter(t => bBlob.includes(t)).length;
      
      if (aMatches !== bMatches) return bMatches - aMatches;

      const aTitle = a.titulo.toLowerCase();
      const bTitle = b.titulo.toLowerCase();
      if (aTitle.startsWith(q) && !bTitle.startsWith(q)) return -1;
      if (!aTitle.startsWith(q) && bTitle.startsWith(q)) return 1;
      return 0;
    });

    // 2. Quotes Search
    const matchedQuotes = quotes.filter(quote => {
      const searchBlob = [
        quote.text,
        quote.personalNote,
        quote.bookTitle,
        quote.bookAuthor
      ].map(s => s?.toLowerCase() || '').join(' ');

      return tokens.some(token => searchBlob.includes(token));
    });

    // 3. Shelves Search
    const matchedShelves = shelves.filter(shelf => {
      const searchBlob = [
        shelf.name,
        shelf.description
      ].map(s => s?.toLowerCase() || '').join(' ');

      return tokens.some(token => searchBlob.includes(token));
    });

    return {
      books: matchedBooks,
      quotes: matchedQuotes,
      shelves: matchedShelves
    };
  }
};
