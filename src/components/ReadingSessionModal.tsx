import React, { useState, useMemo } from 'react';
import { X, Calendar, Book as BookIcon, Check, Clock, Edit3, Smile, Frown, Meh, Star, Heart, Zap, Coffee, Moon, Sun, Ghost } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooks } from '../context/BookContext';
import { Book, Quote } from '../types';

interface ReadingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBookId?: string;
}

const MOODS = [
  { id: 'Inspirado', icon: <Zap size={18} />, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { id: 'Relaxado', icon: <Coffee size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'Reflexivo', icon: <Moon size={18} />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'Focado', icon: <Sun size={18} />, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'Emocionado', icon: <Heart size={18} />, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: 'Intrigado', icon: <Ghost size={18} />, color: 'text-violet-400', bg: 'bg-violet-400/10' },
];

export const ReadingSessionModal: React.FC<ReadingSessionModalProps> = ({ isOpen, onClose, initialBookId }) => {
  const { books, addSession, addQuote } = useBooks();
  const [selectedBookId, setSelectedBookId] = useState(initialBookId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [endPage, setEndPage] = useState<number | ''>('');
  const [pagesRead, setPagesRead] = useState<number | ''>('');
  const [duration, setDuration] = useState<number | ''>('');
  const [mood, setMood] = useState<string>('');
  const [note, setNote] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<'endPage' | 'pagesRead'>('endPage');

  const selectedBook = useMemo(() => books.find(b => b.id === selectedBookId), [books, selectedBookId]);
  const currentStatusBooks = useMemo(() => books.filter(b => b.status === 'lendo'), [books]);

  const calculatedPagesRead = useMemo(() => {
    if (inputMode === 'pagesRead') return Number(pagesRead) || 0;
    if (selectedBook && endPage !== '') {
      return Math.max(0, Number(endPage) - (selectedBook.currentPage || 0));
    }
    return 0;
  }, [inputMode, pagesRead, selectedBook, endPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || (inputMode === 'endPage' && !endPage) || (inputMode === 'pagesRead' && !pagesRead)) return;

    setLoading(true);
    try {
      const book = books.find(b => b.id === selectedBookId)!;
      const startPage = book.currentPage || 0;
      
      const finalPagesRead = inputMode === 'pagesRead' ? Number(pagesRead) : Math.max(0, Number(endPage) - startPage);
      const finalEndPage = inputMode === 'endPage' ? Number(endPage) : startPage + Number(pagesRead);

      await addSession({
        bookId: selectedBookId,
        bookTitle: book.titulo,
        date: new Date(date).getTime(),
        startPage,
        endPage: finalEndPage,
        pagesRead: finalPagesRead,
        durationMinutes: duration ? Number(duration) : undefined,
        mood: mood || undefined,
        quickNote: note.trim() || undefined
      });

      if (quoteText.trim()) {
        await addQuote({
          bookId: selectedBookId,
          bookTitle: book.titulo,
          bookAuthor: book.autor,
          text: quoteText.trim(),
          page: finalEndPage || undefined,
          isFavorite: false
        });
      }

      // Reset
      setEndPage('');
      setPagesRead('');
      setDuration('');
      setNote('');
      setMood('');
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
            className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-neutral-800/60 flex items-center justify-between bg-neutral-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-neutral-100 italic">Registrar Percurso</h3>
                  <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mt-1">Sessão de Leitura Diária</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-3 hover:bg-neutral-800 rounded-2xl transition-all text-neutral-500 hover:text-neutral-100"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
              {/* Seleção do Livro */}
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black ml-1">Seu Livro Atual</label>
                {currentStatusBooks.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    <select 
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      required
                      className="w-full bg-neutral-950 border border-neutral-800/80 rounded-2xl px-6 py-4 text-neutral-100 focus:outline-none focus:border-emerald-500/50 transition-all font-medium appearance-none shadow-inner"
                    >
                      <option value="">Qual livro você está lendo?</option>
                      {currentStatusBooks.map(book => (
                        <option key={book.id} value={book.id}>
                          {book.titulo} (atual: {book.currentPage || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-6 bg-neutral-950/40 border border-dashed border-neutral-800/60 rounded-2xl text-center text-sm text-neutral-500 font-serif italic">
                    Nenhum livro marcado como "Lendo". Adicione um para registrar sessões.
                  </div>
                )}
              </div>

              {/* Progress Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black ml-1">Data da Viagem</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                    <input 
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full bg-neutral-950 border border-neutral-800/80 rounded-2xl pl-14 pr-6 py-4 text-neutral-100 focus:outline-none focus:border-emerald-500/50 transition-all font-medium shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black">Progresso</label>
                    <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800/60">
                       <button 
                         type="button"
                         onClick={() => setInputMode('endPage')}
                         className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md transition-all ${inputMode === 'endPage' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-600'}`}
                       >
                         Final
                       </button>
                       <button 
                         type="button"
                         onClick={() => setInputMode('pagesRead')}
                         className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md transition-all ${inputMode === 'pagesRead' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-600'}`}
                       >
                         Lidas
                       </button>
                    </div>
                  </div>
                  {inputMode === 'endPage' ? (
                    <input 
                      type="number"
                      value={endPage}
                      onChange={(e) => setEndPage(e.target.value ? Number(e.target.value) : '')}
                      placeholder={selectedBook ? `Parei na página...` : "Ex: 142"}
                      required
                      min={selectedBook ? (selectedBook.currentPage || 0) + 1 : 1}
                      className="w-full bg-neutral-950 border border-neutral-800/80 rounded-2xl px-6 py-4 text-neutral-100 focus:outline-none focus:border-emerald-500/50 transition-all font-mono text-lg shadow-inner"
                    />
                  ) : (
                    <input 
                      type="number"
                      value={pagesRead}
                      onChange={(e) => setPagesRead(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Quantas páginas leu hoje?"
                      required
                      min={1}
                      className="w-full bg-neutral-950 border border-neutral-800/80 rounded-2xl px-6 py-4 text-neutral-100 focus:outline-none focus:border-emerald-500/50 transition-all font-mono text-lg shadow-inner"
                    />
                  )}
                </div>
              </div>

              {/* Mood & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black ml-1">Humor da Leitura</label>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMood(mood === m.id ? '' : m.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${mood === m.id ? `bg-neutral-950 border-emerald-500/50 ${m.color} shadow-lg shadow-emerald-500/5 scale-105` : 'bg-neutral-950/40 border-neutral-800/60 text-neutral-600 hover:border-neutral-700 hover:text-neutral-400'}`}
                        title={m.id}
                      >
                        {m.icon}
                        <span className="text-[8px] font-black uppercase tracking-tighter">{m.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black ml-1 flex items-center gap-2">
                    Tempo de Imersão <span className="text-[9px] text-neutral-700 normal-case">(minutos)</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                    <input 
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Opcional"
                      className="w-full bg-neutral-950 border border-neutral-800/80 rounded-2xl pl-14 pr-6 py-4 text-neutral-100 focus:outline-none focus:border-emerald-500/50 transition-all font-mono shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black ml-1">Reflexão Rápida</label>
                <div className="relative">
                  <Edit3 className="absolute left-5 top-5 text-neutral-600" size={18} />
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Algum pensamento que flutuou durante a leitura?"
                    rows={2}
                    className="w-full bg-neutral-950 border border-neutral-800/80 rounded-2xl pl-14 pr-6 py-4 text-neutral-100 focus:outline-none focus:border-emerald-500/50 transition-all resize-none shadow-inner font-serif italic"
                  />
                </div>
              </div>

              {/* Quote */}
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black ml-1 flex items-center justify-between">
                  <span>Citação Lapidar</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-amber-500/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <BookIcon className="absolute left-5 top-5 text-neutral-600 group-focus-within:text-amber-500/60 transition-colors" size={18} />
                  <textarea 
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder="Um trecho que merece ser eternizado..."
                    rows={2}
                    className="w-full bg-neutral-950 border border-neutral-800/80 rounded-2xl pl-14 pr-6 py-4 text-neutral-100 focus:outline-none focus:border-amber-500/30 transition-all resize-none shadow-inner italic font-serif relative z-10"
                  />
                </div>
              </div>

              {/* Impact Preview */}
              <AnimatePresence>
                {calculatedPagesRead > 0 && selectedBook && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] flex items-center justify-between shadow-inner"
                  >
                     <div>
                        <p className="text-[10px] uppercase font-black text-emerald-500/70 tracking-widest leading-none mb-1">Impacto Previsto</p>
                        <p className="text-xl font-serif font-bold text-neutral-100 leading-none">+{calculatedPagesRead} páginas</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] uppercase font-black text-emerald-500/70 tracking-widest leading-none mb-1">Novo Progresso</p>
                        <p className="text-xl font-mono font-bold text-emerald-400 leading-none">
                           {Math.min(100, Math.round((( (selectedBook.currentPage || 0) + calculatedPagesRead ) / (selectedBook.totalPages || selectedBook.pageCount || 1)) * 100))}%
                        </p>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action */}
              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={loading || !selectedBookId || (inputMode === 'endPage' ? !endPage : !pagesRead)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-[0.25em] text-xs py-5 rounded-2xl flex items-center justify-center gap-4 shadow-2xl shadow-emerald-900/30 transition-all active:scale-[0.98] group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={20} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                      Eternizar Sessão
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
