import React, { useState } from 'react';
import { useBooks } from '../context/BookContext';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Heart, Star, Search, Filter, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logomark } from '../components/Logomark';

export const Gallery: React.FC = () => {
  const { books, loading } = useBooks();
  const [filterGenre, setFilterGenre] = useState<string>('todos');
  const [filterMonth, setFilterMonth] = useState<string>('todos');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 p-2 rounded-2xl shadow-xl shadow-amber-500/10 animate-pulse flex items-center justify-center">
          <Logomark />
        </div>
      </div>
    );
  }

  const booksWithImages = books.filter((b) => b.ilustracaoUrl);

  const filteredBooks = booksWithImages.filter((book) => {
    const matchesGenre = filterGenre === 'todos' || book.genero === filterGenre;
    const matchesMonth = filterMonth === 'todos' || book.mesLeitura === filterMonth;
    const matchesFavorites = !showOnlyFavorites || book.favorito;
    return matchesGenre && matchesMonth && matchesFavorites;
  });

  const genres = Array.from(new Set(booksWithImages.map((b) => b.genero)));
  const months = Array.from(new Set(booksWithImages.map((b) => b.mesLeitura)));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight">Galeria Visual</h1>
          <p className="text-neutral-400 mt-2 text-lg">Artes conceituais geradas por IA inspiradas nas suas leituras.</p>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-xl">
        <div className="flex gap-4 w-full overflow-x-auto pb-2 md:pb-0">
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none min-w-[140px]"
          >
            <option value="todos">Todos os Gêneros</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none min-w-[140px]"
          >
            <option value="todos">Todos os Meses</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
              showOnlyFavorites ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-neutral-950 border border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Heart size={18} className={showOnlyFavorites ? 'fill-rose-500' : ''} />
            Apenas Favoritos
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {filteredBooks.map((book) => (
          <motion.div 
            key={book.id} 
            layoutId={`image-container-${book.id}`}
            className="relative group rounded-3xl overflow-hidden break-inside-avoid shadow-xl cursor-pointer"
            onClick={() => setSelectedImage(book.id)}
          >
            <img src={book.ilustracaoUrl} alt={book.titulo} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 capitalize">
                  {book.estiloIlustracao}
                </span>
                {book.favorito && <Heart size={18} className="text-rose-500 fill-rose-500" />}
              </div>
              <h3 className="text-lg font-serif font-bold text-neutral-100 line-clamp-2 mb-1">{book.titulo}</h3>
              <p className="text-sm text-neutral-400">{book.autor}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-neutral-800 border-dashed">
          <ImageIcon size={48} className="mx-auto text-neutral-700 mb-4" />
          <h3 className="text-xl font-serif font-medium text-neutral-300">Nenhuma ilustração encontrada</h3>
          <p className="text-neutral-500 mt-2">Gere ilustrações na página de detalhes de cada livro.</p>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-8 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            {booksWithImages.find(b => b.id === selectedImage) && (
              <motion.div 
                layoutId={`image-container-${selectedImage}`}
                className="relative max-w-5xl max-h-[90vh] w-full flex flex-col md:flex-row bg-neutral-950 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const book = booksWithImages.find(b => b.id === selectedImage)!;
                  return (
                    <>
                      <div className="flex-1 overflow-hidden bg-black flex items-center justify-center">
                        <img src={book.ilustracaoUrl} alt={book.titulo} className="max-w-full max-h-[60vh] md:max-h-[90vh] object-contain" />
                      </div>
                      <div className="w-full md:w-96 bg-neutral-900/80 p-8 flex flex-col justify-center border-l border-neutral-800">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-xs font-medium uppercase tracking-wider">{book.genero}</span>
                          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-medium capitalize">{book.estiloIlustracao}</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-neutral-100 mb-2">{book.titulo}</h2>
                        <p className="text-lg text-neutral-400 font-serif italic mb-6">{book.autor}</p>
                        
                        <div className="flex items-center gap-4 mb-8">
                          <div className="flex items-center gap-1.5 text-amber-500 font-bold text-lg">
                            <Star size={20} fill="currentColor" />
                            {book.notaGeral.toFixed(1)}
                          </div>
                          {book.favorito && <div className="flex items-center gap-1.5 text-rose-500 font-bold text-lg"><Heart size={20} fill="currentColor" /> Favorito</div>}
                        </div>

                        <Link 
                          to={`/livro/${book.id}`}
                          className="mt-auto w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-3 rounded-xl font-bold transition-colors text-center"
                        >
                          Ver Detalhes do Livro
                        </Link>
                      </div>
                      <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
                      >
                        ✕
                      </button>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
