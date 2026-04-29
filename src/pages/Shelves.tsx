import React, { useState, useMemo } from 'react';
import { useBooks } from '../context/BookContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Plus, Search, Filter, BookOpen, Star, Hash, LayoutGrid, List, MoreVertical, Edit2, Trash2, ChevronRight, Folder } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Shelf, Book } from '../types';
import { ShelfModal } from '../components/ShelfModal';

export const Shelves: React.FC = () => {
  const { shelves, books, loading, deleteShelf } = useBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);

  const getShelfStats = (shelf: Shelf) => {
    const shelfBooks = books.filter(b => shelf.bookIds.includes(b.id));
    const count = shelfBooks.length;
    
    if (count === 0) return { 
      count: 0, 
      avgRating: 0, 
      dominantGenre: 'N/A',
      covers: [] 
    };

    const avgRating = shelfBooks.reduce((acc, b) => acc + (b.notaGeral || 0), 0) / count;
    
    const genres: Record<string, number> = {};
    shelfBooks.forEach(b => {
      if (b.genero) genres[b.genero] = (genres[b.genero] || 0) + 1;
    });
    
    const dominantGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Variado';
    const covers = shelfBooks.slice(0, 3).map(b => b.coverUrl).filter(Boolean) as string[];

    return {
      count,
      avgRating: Number(avgRating.toFixed(1)),
      dominantGenre,
      covers
    };
  };

  const filteredShelves = useMemo(() => {
    return shelves.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shelves, searchTerm]);

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh] animate-pulse text-neutral-500">Caregando suas estantes...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-20"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-amber-500">
            <Folder size={20} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Personal Organization</span>
          </div>
          <h1 className="text-5xl font-serif font-bold text-neutral-100 tracking-tight italic">Minhas Estantes</h1>
          <p className="text-neutral-400 text-lg max-w-2xl font-serif">A sua curadoria pessoal, organizada por temas, sentimentos e intenções.</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingShelf(null);
            setIsModalOpen(true);
          }}
          className="bg-neutral-100 text-neutral-950 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 self-start md:self-end"
        >
          <Plus size={20} />
          Nova Estante
        </button>
      </header>

      {/* Search & Stats Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-neutral-900/30 border border-neutral-800/40 p-4 rounded-3xl backdrop-blur-md">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-amber-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar estantes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800/60 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all font-medium"
          />
        </div>
        
        <div className="flex items-center gap-6 px-4">
           <div className="flex flex-col items-center">
             <span className="text-xl font-bold text-neutral-100">{shelves.length}</span>
             <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Total</span>
           </div>
           <div className="w-px h-8 bg-neutral-800" />
           <div className="flex flex-col items-center">
             <span className="text-xl font-bold text-neutral-100">{shelves.filter(s => s.type === 'system').length}</span>
             <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Sistema</span>
           </div>
           <div className="w-px h-8 bg-neutral-800" />
           <div className="flex flex-col items-center">
             <span className="text-xl font-bold text-neutral-100">{shelves.filter(s => s.type === 'custom').length}</span>
             <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Personalizadas</span>
           </div>
        </div>
      </div>

      {/* Shelves Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode='popLayout'>
          {filteredShelves.map((shelf) => {
            const stats = getShelfStats(shelf);
            return (
              <motion.div
                key={shelf.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative h-full"
              >
                <div className="h-full bg-neutral-900/40 border border-neutral-800/40 rounded-[2.5rem] overflow-hidden flex flex-col transition-all duration-500 hover:border-neutral-700/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50">
                  {/* Visual Header / Cover */}
                  <div className="relative h-40 overflow-hidden bg-neutral-950">
                    {shelf.coverImage ? (
                      <img src={shelf.coverImage} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                    ) : (
                      <div 
                        className="w-full h-full opacity-20 transition-opacity group-hover:opacity-30" 
                        style={{ backgroundColor: shelf.accentColor || '#404040' }} 
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
                    
                    {/* Badge */}
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: shelf.accentColor || '#fbbf24' }} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-neutral-100/90 shadow-sm">{shelf.type === 'system' ? 'Sistema' : 'Curadoria'}</span>
                    </div>

                    {/* Book Previews */}
                    <div className="absolute bottom-4 right-6 flex -space-x-4">
                       {stats.covers.length > 0 ? stats.covers.map((url, i) => (
                         <div key={i} className="w-12 h-16 rounded-lg overflow-hidden border-2 border-neutral-900 shadow-xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                           <img src={url} className="w-full h-full object-cover" />
                         </div>
                       )) : (
                         <div className="w-12 h-16 rounded-lg border-2 border-dashed border-neutral-800 flex items-center justify-center">
                           <BookOpen size={16} className="text-neutral-800" />
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-serif font-bold text-neutral-100 tracking-tight group-hover:text-amber-500 transition-colors leading-tight">{shelf.name}</h3>
                      <div className="flex items-center gap-1">
                         <button 
                           onClick={(e) => { e.preventDefault(); setEditingShelf(shelf); setIsModalOpen(true); }}
                           className="p-2 text-neutral-600 hover:text-neutral-100 hover:bg-neutral-800 rounded-xl transition-all"
                         >
                           <Edit2 size={16} />
                         </button>
                         {shelf.type !== 'system' && (
                           <button 
                             onClick={(e) => { e.preventDefault(); deleteShelf(shelf.id); }}
                             className="p-2 text-neutral-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                           >
                             <Trash2 size={16} />
                           </button>
                         )}
                      </div>
                    </div>

                    <p className="text-sm text-neutral-500 line-clamp-2 font-serif italic mb-6 leading-relaxed">
                      {shelf.description || "Nenhuma descrição definida para esta estante."}
                    </p>

                    <div className="mt-auto grid grid-cols-2 gap-4">
                      <div className="bg-neutral-950/40 p-4 rounded-2xl border border-neutral-800/50">
                         <span className="block text-[9px] font-black uppercase tracking-widest text-neutral-600 mb-1">Volume</span>
                         <span className="text-lg font-bold text-neutral-100">{stats.count} {stats.count === 1 ? 'livro' : 'livros'}</span>
                      </div>
                      <div className="bg-neutral-950/40 p-4 rounded-2xl border border-neutral-800/50">
                         <span className="block text-[9px] font-black uppercase tracking-widest text-neutral-600 mb-1">Avaliação Média</span>
                         <div className="flex items-center gap-1.5 font-bold text-amber-500">
                           <Star size={14} fill="currentColor" />
                           <span className="text-lg">{stats.avgRating > 0 ? stats.avgRating : '—'}</span>
                         </div>
                      </div>
                    </div>

                    <Link 
                      to={`/estante/${shelf.id}`}
                      className="mt-8 group/link flex items-center justify-center gap-2 w-full py-4 bg-neutral-950/60 border border-neutral-800 hover:border-neutral-600 rounded-2xl text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-100 transition-all shadow-inner"
                    >
                      Explorar Estante
                      <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredShelves.length === 0 && (
        <div className="py-20 flex flex-col items-center text-center space-y-6 bg-neutral-900/20 border border-dashed border-neutral-800/60 rounded-[3rem]">
          <div className="p-6 bg-neutral-900 rounded-full text-neutral-700">
            <LayoutGrid size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold text-neutral-300">Nenhuma estante encontrada</h3>
            <p className="text-neutral-600 max-w-sm">Refine sua pesquisa ou crie uma nova curadoria personalizada.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-amber-500 font-black uppercase tracking-widest text-xs hover:text-amber-400 transition-colors"
          >
            Começar Nova Curadoria
          </button>
        </div>
      )}

      {isModalOpen && (
        <ShelfModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setEditingShelf(null);
          }} 
          shelf={editingShelf}
        />
      )}
    </motion.div>
  );
};
