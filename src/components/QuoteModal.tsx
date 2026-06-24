import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Quote, Book } from '../types';

interface QuoteModalProps {
  quote?: Quote | null;
  books: Book[];
  initialBookId?: string;
  onClose: () => void;
  onSave: (data: Partial<Quote>) => Promise<void>;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({ quote, books, initialBookId, onClose, onSave }) => {
  const [text, setText] = useState(quote?.text || '');
  const [bookId, setBookId] = useState(quote?.bookId || initialBookId || (books.length > 0 ? books[0].id : ''));
  const [page, setPage] = useState(quote?.page?.toString() || '');
  const [personalNote, setPersonalNote] = useState(quote?.personalNote || '');
  const [moodLabel, setMoodLabel] = useState(quote?.moodLabel || '');
  const [isFavorite, setIsFavorite] = useState(quote?.isFavorite || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !bookId) return;

    const selectedBook = books.find(b => b.id === bookId);
    
    await onSave({
      text,
      bookId,
      bookTitle: selectedBook?.titulo || 'Desconhecido',
      bookAuthor: selectedBook?.autor || 'Desconhecido',
      page: page ? parseInt(page) : undefined,
      personalNote,
      moodLabel,
      isFavorite
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-serif font-bold text-neutral-100 italic">
            {quote ? 'Editar Citação' : 'Nova Citação'}
          </h2>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-neutral-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">Livro</label>
            <select 
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-4 px-5 focus:outline-none focus:border-amber-500/50 transition-all text-sm appearance-none cursor-pointer"
              required
              disabled={!!initialBookId}
            >
              <option value="" disabled>Selecione um livro</option>
              {books.map(b => (
                <option key={b.id} value={b.id}>{b.titulo}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">Texto da Citação</label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite aqui o trecho marcante..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-4 px-5 focus:outline-none focus:border-amber-500/50 transition-all text-sm min-h-[120px] italic font-serif leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">Página</label>
              <input 
                type="number"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder="Ex: 142"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-4 px-5 focus:outline-none focus:border-amber-500/50 transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">Impacto/Mood</label>
              <input 
                type="text"
                value={moodLabel}
                onChange={(e) => setMoodLabel(e.target.value)}
                placeholder="Ex: Inspirador, Triste..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-4 px-5 focus:outline-none focus:border-amber-500/50 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">Sua Nota Pessoal</label>
            <textarea 
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder="Por que esta citação é importante para você?"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-4 px-5 focus:outline-none focus:border-amber-500/50 transition-all text-sm min-h-[80px]"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-neutral-950/50 border border-neutral-800 rounded-2xl cursor-pointer select-none"
               onClick={() => setIsFavorite(!isFavorite)}>
            <div className={`w-10 h-6 rounded-full p-1 transition-all ${isFavorite ? 'bg-amber-500' : 'bg-neutral-800'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-all ${isFavorite ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-xs font-bold text-neutral-300">Marcar como favorita</span>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 py-4 rounded-2xl font-bold transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-amber-500/20"
            >
              {quote ? 'Salvar Alterações' : 'Adicionar Citação'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
