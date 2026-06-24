import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBooks } from '../context/BookContext';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MoreVertical, Star, BookOpen, Clock, Hash, GripVertical, Trash2, Plus, LayoutGrid, List as ListIcon, Share2, Info } from 'lucide-react';
import { Book, Shelf } from '../types';
import { ShelfModal } from '../components/ShelfModal';

export const ShelfDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shelves, books, reorderBooksInShelf, removeBookFromShelf, loading } = useBooks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const shelf = useMemo(() => shelves.find(s => s.id === id), [shelves, id]);
  
  // Important: Get books in the order defined by shelf.bookIds
  const shelfBooks = useMemo(() => {
    if (!shelf) return [];
    return shelf.bookIds
      .map(bookId => books.find(b => b.id === bookId))
      .filter((b): b is Book => !!b);
  }, [shelf, books]);

  const stats = useMemo(() => {
    if (shelfBooks.length === 0) return { books: 0, pages: 0, avgRating: 0, genres: [] };
    
    const pages = shelfBooks.reduce((acc, b) => acc + (b.pageCount || 0), 0);
    const ratings = shelfBooks.filter(b => b.notaGeral > 0);
    const avgRating = ratings.length > 0 
      ? ratings.reduce((acc, b) => acc + b.notaGeral, 0) / ratings.length 
      : 0;
      
    const genreMap: Record<string, number> = {};
    shelfBooks.forEach(b => { if (b.genero) genreMap[b.genero] = (genreMap[b.genero] || 0) + 1; });
    const genres = Object.entries(genreMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return {
      books: shelfBooks.length,
      pages,
      avgRating: Number(avgRating.toFixed(1)),
      genres
    };
  }, [shelfBooks]);

  const handleReorder = (newOrder: Book[]) => {
    if (!shelf) return;
    reorderBooksInShelf(shelf.id, newOrder.map(b => b.id));
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh] animate-pulse text-neutral-500">Lendo arquivos da estante...</div>;
  if (!shelf) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <h2 className="text-2xl font-serif text-neutral-400">Estante não encontrada</h2>
      <Link to="/estantes" className="text-amber-500 font-bold hover:underline">Voltar para Estantes</Link>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <Link to="/estantes" className="inline-flex items-center gap-2 text-neutral-500 hover:text-amber-500 transition-colors text-xs font-black uppercase tracking-widest group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Minhas Estantes
            </Link>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-5xl font-serif font-bold text-neutral-100 tracking-tight italic" style={{ color: shelf.accentColor }}>{shelf.name}</h1>
                {shelf.type === 'system' && (
                  <span className="px-3 py-1 bg-neutral-900 border border-neutral-800 text-neutral-500 rounded-full text-[9px] font-black uppercase tracking-widest">Sistema</span>
                )}
              </div>
              <p className="text-neutral-400 text-lg font-serif italic leading-relaxed">{shelf.description || "Esta curadoria aguarda sua definição poética."}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsModalOpen(true)}
              className="p-4 bg-neutral-900/50 border border-neutral-800/60 rounded-2xl text-neutral-400 hover:text-neutral-100 transition-all"
              title="Personalizar Estante"
             >
                <Edit2Icon className="w-5 h-5" />
             </button>
             <button 
              className="p-4 bg-neutral-900/50 border border-neutral-800/60 rounded-2xl text-neutral-400 hover:text-neutral-100 transition-all"
              title="Compartilhar Curadoria"
             >
                <Share2 size={20} />
             </button>
          </div>
        </div>

        {/* Dynamic Shelf Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <StatCard label="Volume" value={`${stats.books} obras`} icon={<BookOpen size={18} />} color={shelf.accentColor} />
           <StatCard label="Páginas" value={`${stats.pages.toLocaleString()}`} icon={<Hash size={18} />} color={shelf.accentColor} />
           <StatCard label="Média" value={stats.avgRating} icon={<Star size={18} />} color={shelf.accentColor} isRating />
           <div className="col-span-1 md:col-span-1 bg-neutral-900/30 border border-neutral-800/40 p-6 rounded-[2rem] flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-2">Essência</span>
              <div className="flex flex-wrap gap-2">
                 {stats.genres.length > 0 ? stats.genres.map(([g]) => (
                   <span key={g} className="px-2.5 py-1 bg-neutral-950/60 border border-neutral-800/60 rounded-lg text-[10px] font-bold text-neutral-400">{g}</span>
                 )) : <span className="text-[10px] text-neutral-700 font-serif italic">Nenhum gênero detectado</span>}
              </div>
           </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800/60 pb-6">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-serif font-bold text-neutral-200">Composição da Estante</h2>
            <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800/60">
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-neutral-800 text-amber-500 shadow-inner' : 'text-neutral-600 hover:text-neutral-400'}`}
               >
                 <LayoutGrid size={18} />
               </button>
               <button 
                 onClick={() => setViewMode('list')}
                 className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-neutral-800 text-amber-500 shadow-inner' : 'text-neutral-600 hover:text-neutral-400'}`}
               >
                 <ListIcon size={18} />
               </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-neutral-600 text-xs font-medium">
             <Info size={14} />
             Arraste para reordenar sua jornada literária
          </div>
        </div>

        <Reorder.Group 
          axis="y" 
          values={shelfBooks} 
          onReorder={handleReorder}
          className="space-y-4"
        >
          <AnimatePresence mode='popLayout'>
            {shelfBooks.map((book) => (
              <Reorder.Item 
                key={book.id} 
                value={book}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative bg-neutral-900/20 hover:bg-neutral-900/40 border border-neutral-800/40 rounded-3xl p-4 transition-all duration-300 ${viewMode === 'list' ? 'flex items-center gap-6' : 'inline-block w-full'}`}
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="cursor-grab active:cursor-grabbing p-2 text-neutral-700 hover:text-neutral-400 transition-colors">
                    <GripVertical size={20} />
                  </div>
                  
                  <div className="w-16 h-24 rounded-xl overflow-hidden shadow-2xl border border-neutral-800/60 shrink-0 group-hover:scale-105 transition-transform duration-500">
                    <img 
                      src={book.coverUrl || 'https://via.placeholder.com/150x225?text=Readora'} 
                      alt={book.titulo} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-neutral-100 truncate group-hover:text-amber-500 transition-colors">{book.titulo}</h3>
                      {book.favorito && <Star size={14} className="text-rose-500 fill-rose-500 shadow-sm" />}
                    </div>
                    <p className="text-sm text-neutral-500 font-serif italic truncate">{book.autor}</p>
                    <div className="flex items-center gap-4 mt-3">
                       <div className="flex items-center gap-1.5 text-amber-500 text-xs font-black">
                         <Star size={12} fill="currentColor" />
                         {book.notaGeral.toFixed(1)}
                       </div>
                       <span className="text-[10px] text-neutral-600 font-black uppercase tracking-widest px-2 py-0.5 bg-neutral-950 rounded-lg">{book.genero}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-4">
                    <Link to={`/livro/${book.id}`} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 hover:text-neutral-100 hover:border-neutral-600 transition-all">
                       <BookOpen size={18} />
                    </Link>
                    <button 
                      onClick={() => removeBookFromShelf(shelf.id, book.id)}
                      className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-600 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all shadow-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {shelfBooks.length === 0 && (
          <div className="py-24 text-center space-y-6 bg-neutral-900/10 border border-dashed border-neutral-800/40 rounded-[3rem]">
             <div className="p-6 bg-neutral-900/50 inline-block rounded-full text-neutral-700">
                <BookOpen size={48} />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-neutral-400">Estante em Branco</h3>
                <p className="text-neutral-600 font-serif italic max-w-sm mx-auto">Sua curadoria começa com a primeira obra. Adicione livros à sua biblioteca e organize-os aqui.</p>
             </div>
             <Link to="/livros" className="inline-flex items-center gap-2 text-amber-500 font-black uppercase tracking-widest text-xs hover:text-amber-400 transition-all">
                Explorar Meus Livros
                <ChevronLeft size={16} className="rotate-180" />
             </Link>
          </div>
        )}
      </section>

      {isModalOpen && (
        <ShelfModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          shelf={shelf}
        />
      )}
    </div>
  );
};

const Edit2Icon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
  </svg>
);

const StatCard = ({ label, value, icon, color, isRating }: any) => (
  <div className="bg-neutral-900/30 border border-neutral-800/40 p-6 rounded-[2rem] group relative overflow-hidden h-full">
    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity" style={{ color }}>
       {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-2 block">{label}</span>
    <div className="flex items-center gap-2">
      {isRating && <Star size={20} className="text-amber-500" fill="currentColor" />}
      <span className="text-2xl font-bold text-neutral-100">{value || '—'}</span>
    </div>
  </div>
);
