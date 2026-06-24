import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Layout, Palette, Image as ImageIcon } from 'lucide-react';
import { Shelf } from '../types';
import { useBooks } from '../context/BookContext';

interface ShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  shelf?: Shelf | null;
}

const HEX_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#6366f1', '#f97316', '#06b6d4', '#ec4899', '#64748b'
];

export const ShelfModal: React.FC<ShelfModalProps> = ({ isOpen, onClose, shelf }) => {
  const { createShelf, updateShelf, deleteShelf } = useBooks();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState(HEX_COLORS[0]);
  const [coverImage, setCoverImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shelf) {
      setName(shelf.name);
      setDescription(shelf.description || '');
      setAccentColor(shelf.accentColor || HEX_COLORS[0]);
      setCoverImage(shelf.coverImage || '');
    } else {
      setName('');
      setDescription('');
      setAccentColor(HEX_COLORS[0]);
      setCoverImage('');
    }
  }, [shelf, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (shelf) {
        await updateShelf(shelf.id, {
          name: name.trim(),
          description: description.trim(),
          accentColor,
          coverImage: coverImage.trim() || undefined
        });
      } else {
        await createShelf({
          name: name.trim(),
          description: description.trim(),
          accentColor,
          coverImage: coverImage.trim() || undefined,
          bookIds: [],
          type: 'custom'
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving shelf:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!shelf) return;
    if (window.confirm('Tem certeza que deseja excluir esta estante? Os livros não serão removidos da sua biblioteca.')) {
      setIsSubmitting(true);
      try {
        await deleteShelf(shelf.id);
        onClose();
      } catch (error) {
        console.error("Error deleting shelf:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-neutral-900 border border-neutral-800/60 rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl space-y-8 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif font-bold text-neutral-100 flex items-center gap-3">
                  <Palette className="text-amber-500" />
                  {shelf ? 'Personalizar Estante' : 'Nova Curadoria'}
                </h2>
                <p className="text-sm text-neutral-500 font-serif italic">
                  {shelf ? 'Ajuste os detalhes da sua coleção.' : 'Crie um novo espaço para seus livros.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-3 text-neutral-500 hover:text-neutral-100 hover:bg-neutral-800 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 text-left">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Nome da Estante</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800/60 rounded-2xl px-6 py-4 text-neutral-100 focus:outline-none focus:border-amber-500/50 font-medium text-lg placeholder:text-neutral-700"
                    placeholder="Ex: Noites Insones"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Essência (Descrição)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800/60 rounded-2xl px-6 py-4 text-neutral-100 focus:outline-none focus:border-amber-500/50 h-32 resize-none font-serif italic text-lg placeholder:text-neutral-700"
                    placeholder="O que define esta coleção?"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Cor Vibrante (Destaque)</label>
                    <div className="flex flex-wrap gap-3">
                      {HEX_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAccentColor(c)}
                          className={`w-10 h-10 rounded-xl transition-all transform active:scale-95 ${accentColor === c ? 'ring-4 ring-amber-500/30 border-2 border-white scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">URL da Capa (Opcional)</label>
                    <div className="relative">
                       <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                       <input
                        type="url"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800/60 rounded-2xl pl-12 pr-6 py-4 text-neutral-100 focus:outline-none focus:border-amber-500/50 font-medium placeholder:text-neutral-700 text-sm"
                        placeholder="https://exemplo.com/imagem.jpg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-neutral-800/60">
                {shelf && shelf.type !== 'system' && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="p-5 bg-rose-500/5 text-rose-500 border border-rose-500/20 rounded-2xl hover:bg-rose-500/10 transition-all active:scale-95 group"
                    title="Excluir Estante"
                  >
                    <Trash2 size={24} className="group-hover:rotate-12 transition-transform" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-neutral-100 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-amber-500/5 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={20} />
                      {shelf ? 'Preservar Alterações' : 'Inaugurar Estante'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
