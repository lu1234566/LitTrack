import React, { useState, useMemo } from 'react';
import { useBooks } from '../context/BookContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Quote as QuoteIcon, Search, Filter, Plus, Trash2, 
  Heart, Bookmark, BookOpen, Clock, Tag, ChevronRight,
  MessageSquare, Edit3, X
} from 'lucide-react';
import { Quote } from '../types';
import { QuoteModal } from '../components/QuoteModal';

export const Quotes: React.FC = () => {
  const { quotes, books, deleteQuote, updateQuote, addQuote } = useBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBook, setFilterBook] = useState<string>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          q.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.bookAuthor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.personalNote || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBook = filterBook === 'all' || q.bookId === filterBook;
      const matchesMood = filterMood === 'all' || q.moodLabel === filterMood;
      
      return matchesSearch && matchesBook && matchesMood;
    });
  }, [quotes, searchTerm, filterBook, filterMood]);

  const booksWithQuotes = useMemo(() => {
    const bookIds = new Set(quotes.map(q => q.bookId));
    return books.filter(b => bookIds.has(b.id));
  }, [books, quotes]);

  const moods = useMemo(() => {
    const allMoods = quotes.map(q => q.moodLabel).filter(Boolean) as string[];
    return Array.from(new Set(allMoods));
  }, [quotes]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta citação?')) {
      await deleteQuote(id);
    }
  };

  const handleToggleFavorite = async (quote: Quote) => {
    await updateQuote(quote.id, { isFavorite: !quote.isFavorite });
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight flex items-center gap-3">
            <QuoteIcon className="text-amber-500" size={32} />
            Diário de Citações
          </h1>
          <p className="text-neutral-400 mt-2">Sua biblioteca de memórias e passagens marcantes.</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-neutral-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Plus size={20} />
          Nova Citação
        </button>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-amber-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar em textos, livros ou notas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-amber-500/50 transition-all text-sm"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <select 
            value={filterBook}
            onChange={(e) => setFilterBook(e.target.value)}
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-amber-500/50 transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="all">Todos os Livros</option>
            {booksWithQuotes.map(b => (
              <option key={b.id} value={b.id}>{b.titulo}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <select 
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-amber-500/50 transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="all">Todos os Sentimentos</option>
            {moods.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredQuotes.map((quote) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={quote.id}
              className="bg-neutral-900/40 border border-neutral-800 rounded-[2rem] p-8 flex flex-col justify-between group hover:border-neutral-700 transition-all relative overflow-hidden"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    <BookOpen size={12} className="text-amber-500" />
                    <span>{quote.bookTitle}</span>
                    {quote.page && (
                      <>
                        <span className="opacity-30">•</span>
                        <span>Pág. {quote.page}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggleFavorite(quote)}
                      className={`p-2 rounded-full transition-all ${quote.isFavorite ? 'text-amber-500 bg-amber-500/10' : 'text-neutral-600 hover:text-neutral-400'}`}
                    >
                      <Heart size={18} fill={quote.isFavorite ? "currentColor" : "none"} />
                    </button>
                    <button 
                      onClick={() => setEditingQuote(quote)}
                      className="p-2 text-neutral-600 hover:text-neutral-400 rounded-full"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(quote.id)}
                      className="p-2 text-neutral-600 hover:text-rose-500 rounded-full"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <QuoteIcon size={48} className="absolute -top-4 -left-6 text-amber-500/5 -z-10" />
                  <p className="text-xl font-serif text-neutral-200 leading-relaxed italic">
                    "{quote.text}"
                  </p>
                </div>

                {quote.personalNote && (
                  <div className="bg-neutral-950/40 border border-neutral-800/50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2">
                      <MessageSquare size={10} className="text-neutral-500" />
                      Sua Reflexão
                    </div>
                    <p className="text-sm text-neutral-400 italic">
                      {quote.personalNote}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-800 flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Clock size={12} />
                  {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                </div>
                {quote.moodLabel && (
                  <div className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-full font-bold uppercase tracking-widest">
                    {quote.moodLabel}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredQuotes.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto border border-neutral-800 text-neutral-700">
              <QuoteIcon size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-neutral-300">Nenhuma citação encontrada</h3>
              <p className="text-neutral-500">Comece a salvar trechos que tocam sua alma.</p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingQuote) && (
          <QuoteModal 
            quote={editingQuote} 
            books={books}
            onClose={() => {
              setShowAddModal(false);
              setEditingQuote(null);
            }} 
            onSave={async (data) => {
              if (editingQuote) {
                await updateQuote(editingQuote.id, data);
              } else {
                await addQuote(data as any);
              }
              setShowAddModal(false);
              setEditingQuote(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

