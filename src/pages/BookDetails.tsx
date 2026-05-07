import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBooks } from '../context/BookContext';
import { Book, Edit, Trash2, Star, Heart, Image as ImageIcon, Loader2, ArrowLeft, Calendar, BookOpen, Quote as QuoteIcon, RefreshCw, Clock, Plus, History, BookmarkPlus, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote } from '../types';
import { CoverImage } from '../components/CoverImage';
import { ReadingSessionModal } from '../components/ReadingSessionModal';
import { AddToShelfModal } from '../components/AddToShelfModal';
import { QuoteModal } from '../components/QuoteModal';

export const BookDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBook, deleteBook, updateBook, loading, getSessionsByBook, shelves, books, getQuotesByBook, addQuote, updateQuote, deleteQuote } = useBooks();
  const book = getBook(id || '');
  const sessions = getSessionsByBook(id || '');
  const bookQuotes = getQuotesByBook(id || '');

  const [isDeleting, setIsDeleting] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin text-amber-500">
          <BookOpen size={48} />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-neutral-400">
        <BookOpen size={64} className="mb-4 text-neutral-700" />
        <h2 className="text-2xl font-serif font-bold text-neutral-200">Livro não encontrado</h2>
        <button onClick={() => navigate('/livros')} className="mt-6 text-amber-500 hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Voltar para a biblioteca
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteBook(book.id);
      navigate('/livros');
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("Erro ao excluir o livro.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-serif font-bold text-neutral-100 mb-2">Excluir Livro</h3>
            <p className="text-neutral-400 mb-6">Tem certeza que deseja excluir "{book.titulo}"? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleting(false)}
                className="px-4 py-2 rounded-xl font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors"
              >
                Excluir
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-neutral-400 hover:text-amber-500 transition-colors">
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          {book.status === 'lendo' && (
            <button 
              onClick={() => setShowSessionModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Clock size={18} />
              Registrar Sessão
            </button>
          )}
              <button 
                onClick={() => setShowShelfModal(true)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <BookmarkPlus size={18} />
                Estantes
              </button>
              <Link to={`/editar/${book.id}`} className="p-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-amber-500 hover:border-amber-500/50 rounded-xl transition-all">
            <Edit size={18} />
          </Link>
          <button onClick={() => setIsDeleting(true)} className="p-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-rose-500 hover:border-rose-500/50 rounded-xl transition-all">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <ReadingSessionModal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} initialBookId={book.id} />
      <AddToShelfModal 
        isOpen={showShelfModal} 
        onClose={() => setShowShelfModal(false)} 
        book={book} 
        shelves={shelves} 
      />
      
      <AnimatePresence>
        {(showQuoteModal || editingQuote) && (
          <QuoteModal 
            quote={editingQuote}
            books={books}
            initialBookId={book.id}
            onClose={() => {
              setShowQuoteModal(false);
              setEditingQuote(null);
            }}
            onSave={async (data) => {
              if (editingQuote) {
                await updateQuote(editingQuote.id, data);
              } else {
                await addQuote(data as any);
              }
              setShowQuoteModal(false);
              setEditingQuote(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col items-center justify-center group w-full p-6">
            {book.coverUrl ? (
              <div className="relative">
                <CoverImage coverUrl={book.coverUrl} coverSource={book.coverSource} alt={`Capa de ${book.titulo}`} className="w-48 h-auto object-cover rounded-lg shadow-lg" />
                {(book.coverSource === 'manual' || book.coverSource === 'url' || book.coverSource === 'local') && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-neutral-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                    Manual
                  </div>
                )}
              </div>
            ) : (
              <div className="w-48 h-72 bg-neutral-900 rounded-lg flex flex-col items-center justify-center border border-neutral-800 border-dashed gap-4 shadow-lg">
                <BookOpen size={48} className="text-neutral-700" />
                <span className="text-sm text-neutral-500 text-center px-4">Nenhuma capa disponível</span>
              </div>
            )}
            <p className="text-neutral-500 font-medium mt-4 text-sm uppercase tracking-wider">
              {(book.coverSource === 'manual' || book.coverSource === 'url' || book.coverSource === 'local') ? 'Capa Manual' : 'Capa Oficial'}
            </p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col items-center justify-center group w-full">
            {book.ilustracaoUrl && (
              <>
                <img src={book.ilustracaoUrl} alt={`Ilustração para ${book.titulo}`} className="w-full h-auto object-contain" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-xs font-medium uppercase tracking-wider">{book.genero}</span>
              {book.favorito && <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Heart size={12} fill="currentColor" /> Favorito</span>}
            </div>
            <h1 className="text-5xl font-serif font-bold text-neutral-100 leading-tight mb-2">{book.titulo}</h1>
            <p className="text-2xl text-neutral-400 font-serif italic">{book.autor}</p>
          </div>

          <div className="flex flex-wrap gap-6 py-6 border-y border-neutral-800/50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-neutral-800 rounded-2xl text-neutral-400">
                {book.status === 'lido' ? <Star size={24} fill="currentColor" className="text-amber-500" /> : <Clock size={24} className={book.status === 'lendo' ? 'text-emerald-500' : 'text-neutral-500'} />}
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Status</p>
                <p className="text-xl font-bold text-neutral-100 capitalize">{book.status}</p>
              </div>
            </div>
            {book.status === 'lido' && (
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500"><Star size={24} fill="currentColor" /></div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Nota Geral</p>
                  <p className="text-2xl font-bold text-neutral-100">{book.notaGeral.toFixed(1)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Calendar size={24} /></div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">{book.status === 'lido' ? 'Lido em' : (book.status === 'lendo' ? 'Começado em' : 'Adicionado em')}</p>
                <p className="text-xl font-bold text-neutral-100">{book.mesLeitura} {book.anoLeitura}</p>
              </div>
            </div>
            {(book.pageCount || book.totalPages) && (
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><BookOpen size={24} /></div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Páginas</p>
                  <p className="text-xl font-bold text-neutral-100">{book.totalPages || book.pageCount}</p>
                </div>
              </div>
            )}
          </div>

          {book.status === 'quero ler' && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-serif font-semibold text-blue-500 flex items-center gap-3">
                  <BookmarkPlus size={24} />
                  Fila de Leitura
                </h3>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
                  book.priority === 'high' ? 'bg-rose-500/10 text-rose-500' : 
                  book.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' : 
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  Prioridade {book.priority === 'high' ? 'Alta' : book.priority === 'medium' ? 'Média' : 'Baixa'}
                </div>
              </div>

              <div className="space-y-6">
                {book.reasonToRead && (
                  <div className="bg-neutral-950/50 p-6 rounded-2xl border border-neutral-800/50">
                    <p className="text-xs text-neutral-500 uppercase font-black mb-3 tracking-widest">Por que quero ler?</p>
                    <p className="text-neutral-200 italic leading-relaxed">"{book.reasonToRead}"</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {book.discoveredFrom && (
                    <div className="p-4 bg-neutral-950/50 rounded-2xl border border-neutral-800/50">
                      <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Origem da Recomendação</p>
                      <p className="text-sm font-bold text-white">{book.discoveredFrom}</p>
                    </div>
                  )}
                  {book.addedAt && (
                    <div className="p-4 bg-neutral-950/50 rounded-2xl border border-neutral-800/50">
                      <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Adicionado em</p>
                      <p className="text-sm font-bold text-white">{new Date(book.addedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {book.status === 'lendo' && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-serif font-semibold text-emerald-500 flex items-center gap-3">
                  <RefreshCw size={24} className="animate-spin-slow" />
                  Progresso da Leitura
                </h3>
                <div className="text-right">
                   <p className="text-3xl font-black text-white italic">{book.progressPercentage || 0}%</p>
                   <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Concluído</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative h-4 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${book.progressPercentage || 0}%` }}
                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-neutral-950/50 rounded-2xl border border-neutral-800/50">
                    <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Página Atual</p>
                    <p className="text-xl font-mono font-bold text-white">{book.currentPage || 0}</p>
                  </div>
                  <div className="p-4 bg-neutral-950/50 rounded-2xl border border-neutral-800/50">
                    <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Total</p>
                    <p className="text-xl font-mono font-bold text-white">{book.totalPages || book.pageCount || '?'}</p>
                  </div>
                  <div className="p-4 bg-neutral-950/50 rounded-2xl border border-neutral-800/50">
                    <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Faltam</p>
                    <p className="text-xl font-mono font-bold text-emerald-500">
                      {(book.totalPages || book.pageCount || 0) - (book.currentPage || 0) > 0 
                        ? (book.totalPages || book.pageCount || 0) - (book.currentPage || 0) 
                        : 0}
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-950/50 rounded-2xl border border-neutral-800/50">
                    <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Início</p>
                    <p className="text-xs font-bold text-neutral-300">
                      {book.startedAt ? new Date(book.startedAt).toLocaleDateString('pt-BR') : 'Não registrado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {sessions.length > 0 && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
              <h3 className="text-xl font-serif font-semibold text-neutral-100 flex items-center gap-3 mb-6">
                <History className="text-emerald-500" size={24} />
                Histórico de Leitura
              </h3>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="p-4 bg-neutral-950/50 border border-neutral-800/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-200">
                          {new Date(session.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Página {session.startPage} → {session.endPage} ({session.pagesRead} págs)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {session.durationMinutes && (
                        <div className="flex items-center gap-1.5 text-neutral-500">
                          <Clock size={14} />
                          <span className="text-xs font-mono">{session.durationMinutes} min</span>
                        </div>
                      )}
                      {session.quickNote && (
                        <div className="text-xs text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 max-w-[200px] truncate">
                          {session.quickNote}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {book.description && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-serif font-semibold text-amber-500 mb-4">Sinopse</h3>
              <p className="text-neutral-300 leading-relaxed text-sm">
                {book.description}
              </p>
            </div>
          )}

          {book.resenha && (
            <div className="relative">
              <QuoteIcon className="absolute -top-4 -left-4 text-neutral-800/50 rotate-180" size={48} />
              <p className="text-lg text-neutral-300 leading-relaxed relative z-10 pl-4 border-l-2 border-amber-500/30">
                {book.resenha}
              </p>
            </div>
          )}

          {/* New Quotes Section */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-serif font-semibold text-amber-500 flex items-center gap-3">
                <QuoteIcon size={24} />
                Diário de Citações
              </h3>
              <button 
                onClick={() => setShowQuoteModal(true)}
                className="p-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-xl transition-all shadow-lg shadow-amber-500/20"
              >
                <Plus size={20} />
              </button>
            </div>

            {bookQuotes.length > 0 ? (
              <div className="space-y-6">
                {bookQuotes.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)).map((q) => (
                  <div key={q.id} className="relative p-6 bg-neutral-950/50 border border-neutral-800/50 rounded-2xl group transition-all hover:border-neutral-700">
                    {q.isFavorite && (
                      <div className="absolute top-4 right-4 text-amber-500">
                        <Heart size={16} fill="currentColor" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3">
                      {q.page && <span>Pág. {q.page}</span>}
                      {q.moodLabel && (
                        <>
                          <span className="opacity-30">•</span>
                          <span className="text-amber-500/70">{q.moodLabel}</span>
                        </>
                      )}
                    </div>
                    <p className="text-lg font-serif italic text-neutral-200 leading-relaxed mb-4">
                      "{q.text}"
                    </p>
                    {q.personalNote && (
                      <div className="mt-4 p-4 bg-neutral-900/50 border-l-2 border-neutral-800 rounded-r-xl">
                        <p className="text-sm text-neutral-400 italic">
                          {q.personalNote}
                        </p>
                      </div>
                    )}
                    <div className="mt-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => setEditingQuote(q)} className="p-2 text-neutral-500 hover:text-amber-500 transition-colors">
                          <Edit3 size={16} />
                       </button>
                       <button onClick={() => deleteQuote(q.id)} className="p-2 text-neutral-500 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-neutral-800 rounded-3xl">
                <QuoteIcon size={40} className="mx-auto text-neutral-800 mb-4" />
                <p className="text-neutral-500 text-sm">Nenhuma citação registrada para este livro.</p>
                <button 
                  onClick={() => setShowQuoteModal(true)}
                  className="mt-4 text-amber-500 text-xs font-bold uppercase tracking-widest hover:underline"
                >
                  Adicionar primeira citação
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {book.pontosFortes && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6">
                <h4 className="text-emerald-500 font-bold mb-2 uppercase tracking-wider text-xs">Pontos Fortes</h4>
                <p className="text-neutral-300 text-sm leading-relaxed">{book.pontosFortes}</p>
              </div>
            )}
            {book.pontosFracos && (
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-6">
                <h4 className="text-rose-500 font-bold mb-2 uppercase tracking-wider text-xs">Pontos Fracos</h4>
                <p className="text-neutral-300 text-sm leading-relaxed">{book.pontosFracos}</p>
              </div>
            )}
          </div>

          {/* Detailed Ratings */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-serif font-semibold text-amber-500 mb-6">Análise Detalhada</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {Object.entries(book.notasDetalhadas).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-neutral-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-neutral-200 font-bold">{value as number}/10</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${((value as number) / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
