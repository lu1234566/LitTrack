import React, { useState } from 'react';
import { useBooks } from '../context/BookContext';
import { useSettings } from '../context/SettingsContext';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, Heart, BookOpen, Clock, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CoverImage } from '../components/CoverImage';

const FiltersContent = ({ filterStatus, setFilterStatus, filterGenre, setFilterGenre, genres, sortBy, setSortBy }: any) => (
  <>
    <select
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value)}
      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none"
    >
      <option value="todos">Todos os Status</option>
      <option value="lido">Lidos</option>
      <option value="lendo">Lendo</option>
      <option value="quero ler">Quero Ler</option>
    </select>

    <select
      value={filterGenre}
      onChange={(e) => setFilterGenre(e.target.value)}
      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none"
    >
      <option value="todos">Todos os Gêneros</option>
      {genres.map((g: string) => (
        <option key={g} value={g}>{g}</option>
      ))}
    </select>

    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value as any)}
      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none"
    >
      <option value="data">Mais Recentes</option>
      <option value="nota">Maior Nota</option>
      <option value="titulo">Ordem Alfabética</option>
    </select>
  </>
);

export const BookList: React.FC = () => {
  const { books, loading } = useBooks();
  const { isMobileLayout } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterGenre, setFilterGenre] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'data' | 'nota' | 'titulo'>('data');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin text-amber-500">
          <BookOpen size={48} />
        </div>
      </div>
    );
  }

  const filteredBooks = books
    .filter((book) => {
      const safeTitulo = book.titulo || '';
      const safeAutor = book.autor || '';
      const matchesSearch = safeTitulo.toLowerCase().includes(searchTerm.toLowerCase()) || safeAutor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'todos' || book.status === filterStatus;
      const matchesGenre = filterGenre === 'todos' || book.genero === filterGenre;
      return matchesSearch && matchesStatus && matchesGenre;
    })
    .sort((a, b) => {
      if (sortBy === 'data') return b.dataCadastro - a.dataCadastro;
      if (sortBy === 'nota') return b.notaGeral - a.notaGeral;
      if (sortBy === 'titulo') return a.titulo.localeCompare(b.titulo);
      return 0;
    });

  const genres = Array.from(new Set(books.map((b) => b.genero)));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-neutral-100 tracking-tight">Meus Livros</h1>
          <p className="text-neutral-400 mt-1 md:mt-2 text-base md:text-lg">Sua biblioteca pessoal de 2026.</p>
        </div>
        <Link to="/adicionar" className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-neutral-950 px-6 py-3 md:py-3 rounded-xl font-medium transition-colors inline-flex items-center justify-center gap-2">
          <BookOpen size={20} />
          Adicionar Leitura
        </Link>
      </header>

      {/* Filters */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-xl">
        <div className="flex w-full gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
            <input
              type="text"
              placeholder="Buscar por título ou autor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 md:py-2.5 pl-10 pr-4 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            />
          </div>
          {isMobileLayout && (
            <button
              onClick={() => setIsFiltersOpen(true)}
              className="bg-neutral-800 text-neutral-200 p-3 rounded-xl flex items-center justify-center"
            >
              <Filter size={20} />
            </button>
          )}
        </div>
        
        {!isMobileLayout && (
          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <FiltersContent 
              filterStatus={filterStatus} 
              setFilterStatus={setFilterStatus} 
              filterGenre={filterGenre} 
              setFilterGenre={setFilterGenre} 
              genres={genres} 
              sortBy={sortBy} 
              setSortBy={setSortBy} 
            />
          </div>
        )}
      </div>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {isMobileLayout && isFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFiltersOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-x-0 bottom-0 bg-neutral-900 border-t border-neutral-800 rounded-t-3xl z-50 p-6 pb-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif font-bold text-neutral-100 flex items-center gap-2">
                  <Filter size={24} className="text-amber-500" />
                  Filtros
                </h3>
                <button onClick={() => setIsFiltersOpen(false)} className="p-2 text-neutral-400 hover:text-neutral-200">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <FiltersContent 
                  filterStatus={filterStatus} 
                  setFilterStatus={setFilterStatus} 
                  filterGenre={filterGenre} 
                  setFilterGenre={setFilterGenre} 
                  genres={genres} 
                  sortBy={sortBy} 
                  setSortBy={setSortBy} 
                />
                <button
                  onClick={() => setIsFiltersOpen(false)}
                  className="w-full mt-4 bg-amber-500 text-neutral-950 py-3 rounded-xl font-bold"
                >
                  Aplicar Filtros
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Book Grid */}
      <div className={isMobileLayout ? "flex flex-col gap-4" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"}>
        {filteredBooks.map((book) => (
          <Link key={book.id} to={`/livro/${book.id}`} className={`group flex ${isMobileLayout ? 'flex-row items-center gap-4 bg-neutral-900/50 p-3 rounded-2xl border border-neutral-800' : 'flex-col items-center text-center'}`}>
            <div className={`relative ${isMobileLayout ? 'w-20 h-28 flex-shrink-0' : 'w-full aspect-[2/3] mb-4'} rounded-xl overflow-hidden shadow-lg border border-neutral-800 group-hover:shadow-amber-500/20 group-hover:border-amber-500/50 transition-all duration-300`}>
              {book.coverUrl || book.ilustracaoUrl ? (
                <CoverImage coverUrl={book.coverUrl} coverSource={book.coverSource} fallbackUrl={book.ilustracaoUrl} alt={book.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center p-2">
                  <BookOpen size={isMobileLayout ? 24 : 40} className="text-amber-500/30 mb-1 md:mb-2" />
                  <span className="text-[10px] md:text-xs text-neutral-600 font-serif italic text-center line-clamp-3">{book.titulo}</span>
                </div>
              )}
              {(book.coverSource === 'manual' || book.coverSource === 'url' || book.coverSource === 'local') && (
                <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-amber-500 text-neutral-950 text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                  Manual
                </div>
              )}
              {book.favorito && (
                <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-neutral-950/80 p-1 md:p-1.5 rounded-full backdrop-blur-sm">
                  <Heart size={12} className="text-rose-500 fill-rose-500" />
                </div>
              )}
              {!isMobileLayout && book.pageCount && (
                <div className="absolute bottom-2 left-2 bg-neutral-950/80 px-2 py-1 rounded-md backdrop-blur-sm text-[10px] font-medium text-neutral-300">
                  {book.pageCount} págs
                </div>
              )}
            </div>
            
            <div className={isMobileLayout ? "flex flex-col flex-1 min-w-0" : "w-full"}>
              <h3 className={`font-serif font-bold text-neutral-100 line-clamp-2 mb-1 group-hover:text-amber-500 transition-colors w-full ${isMobileLayout ? 'text-base text-left' : 'text-sm'}`}>{book.titulo}</h3>
              <p className={`text-neutral-400 mb-2 line-clamp-1 w-full ${isMobileLayout ? 'text-sm text-left' : 'text-xs'}`}>{book.autor}</p>
              
              <div className={`flex items-center gap-1 text-amber-500 font-medium ${isMobileLayout ? 'text-sm' : 'text-xs justify-center'}`}>
                <Star size={14} fill="currentColor" />
                {book.notaGeral.toFixed(1)}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-neutral-800 border-dashed">
          <BookOpen size={48} className="mx-auto text-neutral-700 mb-4" />
          <h3 className="text-xl font-serif font-medium text-neutral-300">Nenhum livro encontrado</h3>
          <p className="text-neutral-500 mt-2">Tente ajustar seus filtros ou adicione um novo livro.</p>
        </div>
      )}
    </motion.div>
  );
};
