import React, { useState } from 'react';
import { X, Calendar, Book as BookIcon, Check, Clock, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooks } from '../context/BookContext';
import { Book, Quote } from '../types';

interface ReadingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBookId?: string;
}

export const ReadingSessionModal: React.FC<ReadingSessionModalProps> = ({ isOpen, onClose, initialBookId }) => {
  const { books, addSession, addQuote } = useBooks();
  const [selectedBookId, setSelectedBookId] = useState(initialBookId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [endPage, setEndPage] = useState<number | ''>('');
  const [duration, setDuration] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedBook = books.find(b => b.id === selectedBookId);
  const currentStatusBooks = books.filter(b => b.status === 'lendo');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !endPage) return;

    setLoading(true);
    try {
      const book = books.find(b => b.id === selectedBookId)!;
      const startPage = book.currentPage || 0;
      const pagesRead = Number(endPage) - startPage;

      await addSession({
        bookId: selectedBookId,
        date: new Date(date).getTime(),
        startPage,
        endPage: Number(endPage),
        pagesRead: Math.max(0, pagesRead),
        durationMinutes: duration ? Number(duration) : undefined,
        note: note.trim() || undefined
      });

      if (quoteText.trim()) {
        await addQuote({
          bookId: selectedBookId,
          bookTitle: book.titulo,
          bookAuthor: book.autor,
          text: quoteText.trim(),
          page: Number(endPage) || undefined,
          isFavorite: false
        });
      }

      setSelectedBookId('');
      setEndPage('');
      setDuration('');
      setNote('');
      setQuoteText('');
      onClose();
    } catch (error) {
      console.error("Error adding session:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <Clock size={20} />
                </div>
                <h3 className="text-xl font-serif font-bold text-neutral-100">Registrar Sessão</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Seleção do Livro */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-neutral-500 font-black">Livro</label>
                <div className="grid grid-cols-1 gap-2">
                  {currentStatusBooks.length > 0 ? (
                    <select 
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    >
                      <option value="">Selecione um livro...</option>
                      {currentStatusBooks.map(book => (
                        <option key={book.id} value={book.id}>
                          {book.titulo} (pág {book.currentPage || 0})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 bg-neutral-950 border border-dashed border-neutral-800 rounded-xl text-center text-sm text-neutral-500">
                      Você não tem livros com status "Lendo" no momento.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-neutral-500 font-black">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                    <input 
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-neutral-500 font-black">Parei na página</label>
                  <input 
                    type="number"
                    value={endPage}
                    onChange={(e) => setEndPage(e.target.value ? Number(e.target.value) : '')}
                    placeholder={selectedBook ? `Atual: ${selectedBook.currentPage || 0}` : "Ex: 142"}
                    required
                    min={selectedBook ? (selectedBook.currentPage || 0) + 1 : 1}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-neutral-500 font-black flex items-center gap-1">
                    Duração <span className="text-[10px] text-neutral-600 font-medium">(minutos)</span>
                  </label>
                  <input 
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Opcional"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                  />
                </div>
                <div className="flex items-end mb-1">
                  {selectedBook && endPage !== '' && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl w-full text-center">
                      <p className="text-[10px] uppercase font-black text-emerald-500/70">Lidas nesta sessão</p>
                      <p className="text-xl font-mono font-bold text-emerald-400">
                        {Math.max(0, Number(endPage) - (selectedBook.currentPage || 0))} págs
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-neutral-500 font-black">O que achou desta leitura?</label>
                <div className="relative">
                  <Edit3 className="absolute left-4 top-4 text-neutral-500" size={16} />
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Notas, reflexões ou sentimentos..."
                    rows={2}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-neutral-500 font-black flex items-center justify-between">
                  <span>Alguma citação marcante?</span>
                  <span className="text-[10px] text-amber-500 font-bold">NOVO</span>
                </label>
                <div className="relative">
                  <BookIcon className="absolute left-4 top-4 text-neutral-500" size={16} />
                  <textarea 
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder="Salve um trecho que você amou..."
                    rows={2}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none italic font-serif"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={loading || !selectedBookId || !endPage}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 transition-all group"
                >
                  {loading ? (
                    <Clock className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Check size={20} className="group-hover:scale-110 transition-transform" />
                      Finalizar Registro
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
