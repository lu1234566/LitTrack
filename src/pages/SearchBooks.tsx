import React, { useState, useMemo } from 'react';
import { useBooks } from '../context/BookContext';
import { Search, BookOpen, Star, Filter, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CoverImage } from '../components/CoverImage';

export const SearchBooks: React.FC = () => {
  const { books, loading } = useBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('todos');

  const genres = useMemo(() => {
    return ['todos', ...Array.from(new Set(books.map(b => b.genero)))];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = 
        book.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.autor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'todos' || book.genero === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [books, searchTerm, selectedGenre]);

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header>
        <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight">Pesquisar Livros</h1>
        <p className="text-neutral-400 mt-2 text-lg">Encontre rapidamente qualquer livro em sua biblioteca.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por título ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none transition-all"
          >
            {genres.map(genre => (
              <option key={genre} value={genre}>
                {genre === 'todos' ? 'Todos os Gêneros' : genre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredBooks.map((book) => (
            <motion.div
              key={book.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 hover:border-amber-500/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold uppercase tracking-wider">
                  {book.genero}
                </span>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star size={16} fill="currentColor" />
                  {book.notaGeral.toFixed(1)}
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                {book.coverUrl ? (
                  <CoverImage coverUrl={book.coverUrl} coverSource={book.coverSource} alt={book.titulo} className="w-20 h-28 object-cover rounded-lg shadow-md" />
                ) : (
                  <div className="w-20 h-28 bg-neutral-950 rounded-lg flex items-center justify-center border border-neutral-800">
                    <BookOpen size={24} className="text-neutral-800" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-serif font-bold text-neutral-100 mb-1 group-hover:text-amber-500 transition-colors line-clamp-2">
                    {book.titulo}
                  </h3>
                  <p className="text-neutral-400 font-serif italic line-clamp-1">{book.autor}</p>
                </div>
              </div>

              <Link
                to={`/livro/${book.id}`}
                className="mt-auto flex items-center justify-center gap-2 w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-medium transition-all"
              >
                Ver Detalhes
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-20">
          <BookOpen size={48} className="mx-auto text-neutral-800 mb-4" />
          <p className="text-neutral-500 text-lg">Nenhum livro encontrado com esses critérios.</p>
        </div>
      )}
    </motion.div>
  );
};
