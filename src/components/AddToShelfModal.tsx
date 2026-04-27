import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, BookmarkPlus, Plus } from 'lucide-react';
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
    const isBookOnShelf = shelf.bookIds.includes(book.id);
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
        color: 'bg-amber-500'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-neutral-100 flex items-center gap-3">
                <BookmarkPlus size={24} className="text-amber-500" />
                Organizar Estantes
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-neutral-500 hover:text-neutral-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-left">
                <div className="w-12 h-16 bg-neutral-800 rounded-md overflow-hidden flex-shrink-0">
                   {book.coverUrl && <img src={book.coverUrl} alt={book.titulo} className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-neutral-100 truncate">{book.titulo}</h4>
                  <p className="text-xs text-neutral-500 truncate">{book.autor}</p>
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {shelves.map((shelf) => {
                  const isActive = shelf.bookIds && shelf.bookIds.includes(book.id);
                  return (
                    <button
                      key={shelf.id}
                      onClick={() => handleToggleShelf(shelf)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive ? 'bg-amber-500/10 border-amber-500/50' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${shelf.color || 'bg-amber-500'}`} />
                        <span className={`font-medium ${isActive ? 'text-amber-500' : 'text-neutral-300'}`}>{shelf.name}</span>
                      </div>
                      {isActive && <Check size={18} className="text-amber-500" />}
                    </button>
                  );
                })}

                {shelves.length === 0 && !isCreating && (
                  <p className="text-center py-8 text-neutral-500 text-sm italic">
                    Você ainda não tem estantes personalizadas.
                  </p>
                )}
              </div>

              {isCreating ? (
                <form onSubmit={handleCreateShelf} className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newShelfName}
                    onChange={(e) => setNewShelfName(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-neutral-100 focus:outline-none focus:border-amber-500/50 text-sm"
                    placeholder="Nome da nova estante..."
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-neutral-950 px-4 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
                  >
                    Criar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="p-2 text-neutral-500 hover:text-neutral-100"
                  >
                    <X size={20} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full py-3 border border-dashed border-neutral-800 rounded-2xl text-neutral-500 hover:text-amber-500 hover:border-amber-500/30 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Plus size={18} />
                  Nova Estante
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-2xl font-bold transition-all uppercase tracking-widest text-xs"
            >
              Concluído
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
