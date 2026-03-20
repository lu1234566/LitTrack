import React, { useState } from 'react';
import { X, Search, Loader2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface BookSearchResult {
  id: string;
  title: string;
  authors?: string[];
  description?: string;
  pageCount?: number;
  thumbnail?: string;
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
}

interface BookSearchModalProps {
  initialQuery: string;
  onSelect: (book: BookSearchResult) => void;
  onClose: () => void;
}

export const BookSearchModal: React.FC<BookSearchModalProps> = ({ initialQuery, onSelect, onClose }) => {
  const [queryTitle, setQueryTitle] = useState(initialQuery);
  const [queryAuthor, setQueryAuthor] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  React.useEffect(() => {
    if (initialQuery && !hasSearched) {
      handleSearch();
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const searchTitle = queryTitle.trim();
    const searchAuthor = queryAuthor.trim();
    
    if (!searchTitle && !searchAuthor) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const queryParts = [];
      if (searchTitle) queryParts.push(searchTitle);
      if (searchAuthor) queryParts.push(`inauthor:${searchAuthor}`);
      const q = encodeURIComponent(queryParts.join(' '));

      let googleData = null;
      try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=15`);
        if (response.ok) {
          googleData = await response.json();
        } else {
          console.error("Google Books API error:", response.status, response.statusText);
        }
      } catch (err) {
        console.warn("Google Books API failed, trying fallback", err);
      }

      if (googleData && googleData.items && googleData.items.length > 0) {
        const parsedResults: BookSearchResult[] = googleData.items.map((item: any) => {
          const vol = item.volumeInfo;
          let isbn = '';
          if (vol.industryIdentifiers) {
            const isbn13 = vol.industryIdentifiers.find((i: any) => i.type === 'ISBN_13');
            const isbn10 = vol.industryIdentifiers.find((i: any) => i.type === 'ISBN_10');
            isbn = isbn13 ? isbn13.identifier : (isbn10 ? isbn10.identifier : '');
          }

          return {
            id: item.id,
            title: vol.title,
            authors: vol.authors,
            description: vol.description,
            pageCount: vol.pageCount,
            thumbnail: vol.imageLinks?.thumbnail?.replace('http:', 'https:'),
            isbn,
            publisher: vol.publisher,
            publishedDate: vol.publishedDate,
          };
        });
        setResults(parsedResults);
        return;
      }

      // Fallback to Open Library Search API
      const olQueryParts = [];
      if (searchTitle) olQueryParts.push(`title=${encodeURIComponent(searchTitle)}`);
      if (searchAuthor) olQueryParts.push(`author=${encodeURIComponent(searchAuthor)}`);
      const olQuery = olQueryParts.join('&');
      
      try {
        const olResponse = await fetch(`https://openlibrary.org/search.json?${olQuery}&limit=15`);
        if (olResponse.ok) {
          const olData = await olResponse.json();
          if (olData.docs && olData.docs.length > 0) {
            const parsedResults: BookSearchResult[] = olData.docs.map((doc: any) => ({
              id: doc.key,
              title: doc.title,
              authors: doc.author_name,
              description: '', // Open Library search doesn't return full descriptions
              pageCount: doc.number_of_pages_median,
              thumbnail: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
              isbn: doc.isbn ? doc.isbn[0] : undefined,
              publisher: doc.publisher ? doc.publisher[0] : undefined,
              publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : undefined,
            }));
            setResults(parsedResults);
            return;
          }
        } else {
          console.error("Open Library API error:", olResponse.status, olResponse.statusText);
        }
      } catch (err) {
        console.warn("Open Library API failed", err);
      }

      setResults([]);
    } catch (error) {
      console.error("Error searching books:", error);
      alert("Erro ao buscar livros. Verifique sua conexão.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-neutral-200 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-serif font-bold text-neutral-100 mb-6">Buscar Livro Online</h2>

        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Título</label>
              <input 
                type="text" 
                value={queryTitle} 
                onChange={(e) => setQueryTitle(e.target.value)} 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" 
                placeholder="Ex: O Nome do Vento" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Autor (Opcional)</label>
              <input 
                type="text" 
                value={queryAuthor} 
                onChange={(e) => setQueryAuthor(e.target.value)} 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" 
                placeholder="Ex: Patrick Rothfuss" 
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isSearching || (!queryTitle && !queryAuthor)}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            Buscar
          </button>
        </form>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-[300px]">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500">
              <Loader2 size={40} className="animate-spin text-amber-500 mb-4" />
              <p>Buscando livros...</p>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500">
              <BookOpen size={48} className="mb-4 opacity-50" />
              <p>Nenhum livro encontrado com esses termos.</p>
            </div>
          ) : (
            results.map((book) => (
              <div 
                key={book.id} 
                className="flex gap-4 p-4 bg-neutral-950 border border-neutral-800 rounded-2xl hover:border-amber-500/50 transition-colors cursor-pointer group"
                onClick={() => onSelect(book)}
              >
                {book.thumbnail ? (
                  <img src={book.thumbnail} alt={book.title} className="w-16 h-24 object-cover rounded-lg shadow-md" />
                ) : (
                  <div className="w-16 h-24 bg-neutral-900 rounded-lg flex items-center justify-center border border-neutral-800">
                    <BookOpen size={24} className="text-neutral-700" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-serif font-bold text-neutral-100 mb-1 group-hover:text-amber-500 transition-colors truncate">{book.title}</h3>
                  <p className="text-sm text-neutral-400 font-serif italic mb-2 truncate">{book.authors?.join(', ') || 'Autor desconhecido'}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                    {book.pageCount && <span>{book.pageCount} páginas</span>}
                    {book.publishedDate && <span>Ano: {book.publishedDate.substring(0, 4)}</span>}
                    {book.publisher && <span className="truncate max-w-[150px]">Ed: {book.publisher}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
