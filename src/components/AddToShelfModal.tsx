import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, BookmarkPlus, Plus, Sparkles, Folder } from 'lucide-react';
import { Shelf, Book } from '../types';
import { useBooks } from '../context/BookContext';

interface AddToShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  shelves: Shelf[];
}

export const AddToShelfModal: React.FC<AddToShelfModalProps> = ({ isOpen, onClose, book, shelves }) => {
  const { addBookToShelf, removeBookFromShelf, createShelf } = useBooks();
  const [isCreating, setIsCreating] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');

  const handleToggleShelf = async (shelf: Shelf) => {
    const isBookOnShelf = shelf.bookIds && shelf.bookIds.includes(book.id);
    if (isBookOnShelf) {
      await removeBookFromShelf(shelf.id, book.id);
    } else {
      await addBookToShelf(shelf.id, book.id);
    }
  };

  const handleCreateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelfName.trim()) return;

    try {
      await createShelf({
        name: newShelfName.trim(),
        bookIds: [book.id],
        accentColor: '#f59e0b',
        type: 'custom'
      });
      setNewShelfName('');
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating shelf:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-neutral-900 border border-neutral-800/60 rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif font-bold text-neutral-100 flex items-center gap-3">
                  <BookmarkPlus size={28} className="text-amber-500" />
                  Organizar por Intenção
                </h2>
                <p className="text-sm text-neutral-500 font-serif italic">Selecione onde esta leitura deve repousar.</p>
              </div>
              <button
                onClick={onClose}
                className="p-3 text-neutral-500 hover:text-neutral-100 hover:bg-neutral-800 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-6 p-6 bg-neutral-950/60 rounded-[2rem] border border-neutral-800/60 shadow-inner group">
                <div className="w-16 h-24 bg-neutral-900 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl border border-neutral-800 group-hover:scale-105 transition-transform duration-500">
                   {book.coverUrl && <img src={book.coverUrl} alt={book.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xl font-bold text-neutral-100 truncate mb-1">{book.titulo}</h4>
                  <p className="text-sm text-neutral-500 font-serif italic truncate">{book.autor}</p>
                  <div className="flex items-center gap-2 mt-3">
                     <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80 px-2 py-1 bg-amber-500/5 rounded-lg border border-amber-500/10">Sendo Organizado</span>
                  </div>
                </div>
              </div>

              <div className="max-h-[320px] overflow-y-auto pr-4 space-y-3 custom-scrollbar scroll-smooth">
                {shelves.map((shelf) => {
                  const isActive = shelf.bookIds && shelf.bookIds.includes(book.id);
                  return (
                    <button
                      key={shelf.id}
                      onClick={() => handleToggleShelf(shelf)}
                      className={`w-full group/shelf flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${isActive ? 'bg-amber-500/5 border-amber-500/40 shadow-lg shadow-amber-500/5' : 'bg-neutral-950/40 border-neutral-800/60 hover:border-neutral-700/80 hover:bg-neutral-900/40'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-6 rounded-full transition-all group-hover/shelf:h-8" style={{ backgroundColor: shelf.accentColor || '#fbbf24' }} />
                        <div className="text-left">
                           <span className={`block font-bold text-base transition-colors ${isActive ? 'text-amber-500' : 'text-neutral-300'}`}>{shelf.name}</span>
                           <span className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">{shelf.type === 'system' ? 'Sistema' : 'Curadoria Pessoal'}</span>
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-amber-500 text-neutral-950 scale-110 shadow-lg shadow-amber-500/20' : 'bg-neutral-900 text-neutral-700'}`}>
                        {isActive ? <Check size={16} strokeWidth={3} /> : <Plus size={16} />}
                      </div>
                    </button>
                  );
                })}

                {shelves.length === 0 && !isCreating && (
                  <div className="py-12 border border-dashed border-neutral-800/60 rounded-3xl flex flex-col items-center gap-4">
                    <Folder className="text-neutral-800" size={32} />
                    <p className="text-neutral-600 text-sm italic font-serif">Você ainda não tem estantes personalizadas.</p>
                  </div>
                )}
              </div>

              {isCreating ? (
                <form onSubmit={handleCreateShelf} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <input
                    type="text"
                    autoFocus
                    value={newShelfName}
                    onChange={(e) => setNewShelfName(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800/80 rounded-2xl px-6 py-4 text-neutral-100 focus:outline-none focus:border-amber-500/50 text-sm font-medium"
                    placeholder="Nome da nova estante..."
                  />
                  <button
                    type="submit"
                    className="bg-neutral-100 hover:bg-amber-400 text-neutral-950 px-8 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-500/5 active:scale-95"
                  >
                    Inaugurar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="p-4 text-neutral-500 hover:text-neutral-100 hover:bg-neutral-800 rounded-2xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="group/new w-full py-5 border border-dashed border-neutral-800/60 rounded-2xl text-neutral-600 hover:text-amber-500 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em]"
                >
                  <Sparkles size={16} className="group-hover/new:rotate-12 transition-transform" />
                  Nova Curadoria
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-5 bg-neutral-100 hover:bg-amber-400 text-neutral-950 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl shadow-amber-500/5 active:scale-[0.98]"
            >
              Concluir Organização
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
