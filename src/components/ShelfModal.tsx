import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Layout } from 'lucide-react';
import { Shelf } from '../types';

interface ShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shelfData: Omit<Shelf, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  shelf?: Shelf;
}

const COLORS = [
  'bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-violet-500',
  'bg-indigo-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500', 'bg-slate-500'
];

export const ShelfModal: React.FC<ShelfModalProps> = ({ isOpen, onClose, onSave, onDelete, shelf }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shelf) {
      setName(shelf.name);
      setDescription(shelf.description || '');
      setColor(shelf.color || COLORS[0]);
    } else {
      setName('');
      setDescription('');
      setColor(COLORS[0]);
    }
  }, [shelf, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        color,
        bookIds: shelf?.bookIds || []
      });
      onClose();
    } catch (error) {
      console.error("Error saving shelf:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!shelf || !onDelete) return;
    if (window.confirm('Tem certeza que deseja excluir esta estante? Os livros não serão removidos da sua biblioteca.')) {
      setIsSubmitting(true);
      try {
        await onDelete(shelf.id);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-neutral-100 flex items-center gap-3">
                <Layout className="text-amber-500" />
                {shelf ? 'Editar Estante' : 'Nova Estante'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-neutral-500 hover:text-neutral-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Nome da Estante</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:border-amber-500/50"
                  placeholder="Ex: Favoritos da Vida"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Descrição (Opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:border-amber-500/50 h-24 resize-none"
                  placeholder="Sobre o que é esta coleção?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Cor de Destaque</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full ${c} transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 border-2 border-neutral-900' : 'opacity-70 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                {shelf && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 py-4 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {shelf ? 'Salvar Alterações' : 'Criar Estante'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
