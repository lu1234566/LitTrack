import React, { useState, useMemo, useEffect } from 'react';
import { useBooks } from '../context/BookContext';
import { Search, BookOpen, Star, Filter, ArrowRight, Quote as QuoteIcon, Library, Sparkles, MessageSquare, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CoverImage } from '../components/CoverImage';
import { searchService } from '../services/searchService';

export const SearchBooks: React.FC = () => {
  const { books, quotes, shelves, loading } = useBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const results = useMemo(() => {
    return searchService.performUnifiedSearch(debouncedTerm, books, quotes, shelves);
  }, [debouncedTerm, books, quotes, shelves]);

  const hasResults = results.books.length > 0 || results.quotes.length > 0 || results.shelves.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin text-amber-500">
          <BookOpen size={48} />
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <header className="relative py-10 px-6 rounded-[3rem] bg-gradient-to-br from-neutral-900 via-neutral-900/50 to-transparent border border-neutral-800 overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Library size={180} className="text-neutral-100" />
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl font-serif font-black text-neutral-100 tracking-tighter">Explorar Acervo</h1>
          <p className="text-neutral-400 mt-3 text-lg font-serif italic max-w-xl">
            Redescubra cada detalhe da sua jornada literária — de livros a pensamentos guardados.
          </p>
        </div>
      </header>

      <div className="sticky top-6 z-30 px-2">
        <div className="relative group max-w-3xl mx-auto">
          <div className="absolute inset-0 bg-amber-500/10 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-amber-500 transition-colors" size={24} />
          <input
            type="text"
            placeholder="Títulos, autores, moods, resenhas, quotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-950/90 backdrop-blur-xl border border-neutral-800 rounded-3xl py-6 pl-16 pr-6 text-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xl transition-all"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!debouncedTerm ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {['Sombrio', 'Emocional', 'Suspense', 'Filosófico'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchTerm(tag)}
                className="p-6 bg-neutral-900/30 border border-neutral-800 rounded-3xl text-left hover:border-neutral-600 transition-all group"
              >
                <Tag size={18} className="text-neutral-600 mb-4 group-hover:text-amber-500" />
                <p className="text-sm font-black text-neutral-500 uppercase tracking-widest mb-1">Buscar por</p>
                <p className="text-xl font-serif font-bold text-neutral-200">{tag}</p>
              </button>
            ))}
          </motion.div>
        ) : !hasResults ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-800">
               <Search size={40} className="text-neutral-700" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-neutral-300">Nenhum rastro encontrado</h3>
            <p className="text-neutral-500 max-w-sm mx-auto mt-2">
              Sua biblioteca é vasta, mas não encontramos nada com "{debouncedTerm}". Tente outros termos.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-16">
            {/* Books Results */}
            {results.books.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8 px-2">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl"><BookOpen size={20} /></div>
                  <h2 className="text-2xl font-serif font-bold text-neutral-100">Livros Encontrados</h2>
                  <span className="text-xs font-black text-neutral-600 bg-neutral-900 px-2 py-1 rounded-full uppercase tracking-widest">{results.books.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.books.map((book) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-neutral-900/40 border border-neutral-800 rounded-[2rem] p-6 hover:border-amber-500/30 transition-all group relative overflow-hidden"
                    >
                      <div className="flex gap-5">
                        <div className="relative shrink-0">
                          {book.coverUrl ? (
                            <CoverImage coverUrl={book.coverUrl} coverSource={book.coverSource} alt={book.titulo} className="w-24 h-36 object-cover rounded-xl shadow-2xl group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-24 h-36 bg-neutral-950 rounded-xl flex items-center justify-center border border-neutral-800">
                              <BookOpen size={24} className="text-neutral-800" />
                            </div>
                          )}
                          <div className="absolute -top-2 -right-2 bg-neutral-950 border border-neutral-800 p-1.5 rounded-lg shadow-xl">
                             <Star size={12} className="text-amber-500" fill="currentColor" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 block">{book.genero}</span>
                          <h3 className="text-xl font-serif font-bold text-neutral-100 group-hover:text-amber-500 transition-colors line-clamp-2 leading-tight">
                            {book.titulo}
                          </h3>
                          <p className="text-sm text-neutral-400 font-serif italic mb-4">{book.autor}</p>
                          
                          <div className="flex flex-wrap gap-1">
                             {book.moods?.slice(0, 2).map((m: string) => (
                               <span key={m} className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 text-neutral-500 rounded-md text-[9px] uppercase font-black tracking-tighter">
                                 {m}
                               </span>
                             ))}
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/livro/${book.id}`}
                        className="absolute inset-0 z-10"
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Quotes Results */}
            {results.quotes.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8 px-2">
                  <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl"><QuoteIcon size={20} /></div>
                  <h2 className="text-2xl font-serif font-bold text-neutral-100">Citações & Pensamentos</h2>
                  <span className="text-xs font-black text-neutral-600 bg-neutral-900 px-2 py-1 rounded-full uppercase tracking-widest">{results.quotes.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.quotes.map((quote) => (
                    <motion.div
                      key={quote.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-neutral-950/50 border border-neutral-800 border-l-4 border-l-purple-500 p-6 rounded-3xl relative group"
                    >
                      <QuoteIcon className="absolute top-4 right-4 text-neutral-800 group-hover:text-purple-500/20 transition-colors" size={40} />
                      <p className="text-neutral-200 font-serif italic text-lg leading-relaxed mb-4 relative z-10">
                        "{quote.text}"
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-neutral-400 uppercase tracking-widest truncate">{quote.bookTitle}</p>
                          <p className="text-[10px] text-neutral-600 uppercase font-black">{quote.bookAuthor}</p>
                        </div>
                        <Link 
                          to={`/quotes`} 
                          className="p-2 bg-neutral-900 rounded-xl text-neutral-500 hover:text-purple-500 transition-colors"
                        >
                          <ArrowRight size={18} />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Shelves Results */}
            {results.shelves.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8 px-2">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl"><Library size={20} /></div>
                  <h2 className="text-2xl font-serif font-bold text-neutral-100">Coleções & Estantes</h2>
                </div>
                <div className="flex overflow-x-auto pb-4 gap-4 -mx-4 px-4 overflow-visible">
                  {results.shelves.map((shelf) => (
                    <Link
                      key={shelf.id}
                      to="/estantes"
                      className="shrink-0 w-64 p-6 bg-neutral-900/60 border border-neutral-800 rounded-3xl hover:border-blue-500/30 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center p-2" style={{ backgroundColor: `${shelf.color || '#3b82f6'}20`, color: shelf.color || '#3b82f6' }}>
                         <Library size={20} />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-neutral-100 mb-1">{shelf.name}</h3>
                      <p className="text-sm text-neutral-500 uppercase font-black tracking-widest">{shelf.bookIds.length} títulos</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

