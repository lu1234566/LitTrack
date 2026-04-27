import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, MessageSquare, ChevronRight, Share2, Plus, Edit2, CheckCircle2, Clock, Trophy } from 'lucide-react';
import { Community, CommunityMember, SharedBook } from '../types';
import { useCommunity } from '../context/CommunityContext';
import { useBooks } from '../context/BookContext';

interface ClubSharedReadProps {
  community: Community;
  members: CommunityMember[];
  isOwner: boolean;
  onUpdateSharedBook: (sharedBook: SharedBook | null) => Promise<void>;
}

export const ClubSharedRead: React.FC<ClubSharedReadProps> = ({ community, members, isOwner, onUpdateSharedBook }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState(community.sharedBook?.title || '');
  const [author, setAuthor] = useState(community.sharedBook?.author || '');
  const [coverUrl, setCoverUrl] = useState(community.sharedBook?.coverUrl || '');
  const [prompt, setPrompt] = useState(community.sharedBook?.discussionPrompt || '');
  const { books } = useBooks();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSharedBook({
      title,
      author,
      coverUrl,
      discussionPrompt: prompt,
      startDate: Date.now()
    });
    setIsModalOpen(false);
  };

  const selectBookFromLibrary = (book: any) => {
    setTitle(book.titulo);
    setAuthor(book.autor);
    setCoverUrl(book.coverUrl || '');
  };

  const sortedMembers = [...members].sort((a, b) => (b.sharedBookProgress || 0) - (a.sharedBookProgress || 0));

  return (
    <div className="space-y-8">
      {/* Shared Book Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
        {community.sharedBook ? (
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 lg:w-1/4">
              <img 
                src={community.sharedBook.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.sharedBook.title)}&background=222&color=fff&size=512`} 
                alt={community.sharedBook.title}
                className="w-full aspect-[2/3] object-cover"
              />
            </div>
            <div className="p-8 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
                    Livro do Mês
                  </span>
                  {isOwner && (
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="p-2 text-neutral-400 hover:text-amber-500 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>
                <h2 className="text-3xl font-serif font-bold text-neutral-100 mb-1 leading-tight">{community.sharedBook.title}</h2>
                <p className="text-xl text-neutral-400 mb-6 font-serif italic">{community.sharedBook.author}</p>
                
                {community.sharedBook.discussionPrompt && (
                  <div className="bg-neutral-950/50 border border-neutral-800 p-5 rounded-2xl mb-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/30" />
                    <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MessageSquare size={12} />
                      Foco da Leitura / Provocação
                    </h4>
                    <p className="text-neutral-200 italic leading-relaxed">"{community.sharedBook.discussionPrompt}"</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-500 pt-4 border-t border-neutral-800/50">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-amber-500/70" />
                  <span>Iniciada em {new Date(community.sharedBook.startDate || Date.now()).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-amber-500/70" />
                  <span>{members.length} participantes</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-neutral-950 rounded-2xl flex items-center justify-center mx-auto border border-neutral-800 text-neutral-700">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-serif font-bold text-neutral-200">Nenhuma leitura coletiva ativa</h3>
            <p className="text-neutral-500 max-w-sm mx-auto">Comece uma jornada compartilhada definindo o livro do mês para o clube.</p>
            {isOwner && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-neutral-950 px-8 py-3 rounded-xl font-bold transition-all shadow-xl shadow-amber-500/20 mt-4 active:scale-95"
              >
                Definir Livro do Mês
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Comparison */}
        <div className="bg-neutral-900 shadow-xl rounded-3xl border border-neutral-800 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
            <h3 className="text-lg font-serif font-bold text-neutral-100 flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              Ranking de Progresso
            </h3>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
            {sortedMembers.map((member, index) => (
              <div key={member.id} className="bg-neutral-950/50 border border-neutral-800/50 rounded-2xl p-4 flex items-center gap-4 transition-all hover:border-neutral-700">
                <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm rounded-lg ${
                  index === 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'text-neutral-600'
                }`}>
                  #{index + 1}
                </div>
                <img src={member.userPhotoURL} alt={member.userDisplayName} className="w-10 h-10 rounded-full object-cover border border-neutral-800" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-neutral-200 truncate text-sm">{member.userDisplayName}</span>
                    <span className={`text-[10px] font-mono font-bold ${member.sharedBookFinished ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {member.sharedBookFinished ? 'CONCLUÍDO' : `${Math.round(member.sharedBookProgress || 0)}%`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${member.sharedBookFinished ? 100 : member.sharedBookProgress || 0}%` }}
                      className={`h-full ${member.sharedBookFinished ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    />
                  </div>
                </div>
                {member.sharedBookFinished && (
                  <div className="text-emerald-500 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                )}
              </div>
            ))}

            {members.length === 0 && (
              <div className="text-center py-12 text-neutral-600">Nenhum membro participando ainda.</div>
            )}
          </div>
        </div>

        {/* Historico Section */}
        <div className="bg-neutral-900 shadow-xl rounded-3xl border border-neutral-800 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
            <h3 className="text-lg font-serif font-bold text-neutral-100 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              Histórico do Clube
            </h3>
          </div>
          
          <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[500px]">
            {community.pastSharedBooks && community.pastSharedBooks.length > 0 ? (
              community.pastSharedBooks.map((book, idx) => (
                <div key={idx} className="flex gap-4 p-3 bg-neutral-950/30 border border-neutral-800/30 rounded-2xl hover:bg-neutral-900/50 transition-colors">
                  <img 
                    src={book.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(book.title)}&background=222`} 
                    className="w-16 h-24 object-cover rounded-lg shadow-lg"
                    alt={book.title}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="font-bold text-neutral-200 truncate">{book.title}</h4>
                    <p className="text-sm text-neutral-500 mb-2 truncate italic">{book.author}</p>
                    <div className="text-[10px] text-neutral-600 flex items-center gap-2 font-bold uppercase tracking-wider">
                      <Calendar size={10} />
                      {book.startDate && new Date(book.startDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                      {book.endDate && ` — ${new Date(book.endDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-600 space-y-3">
                <Clock size={32} className="opacity-20" />
                <p>Nenhuma leitura finalizada ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Update Shared Book */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 w-full max-w-xl shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold text-neutral-100">Definir Leitura Coletiva</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-neutral-100">
                  <Edit2 size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-3 pb-4 border-b border-neutral-800">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Sugerir de sua Biblioteca</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {books.filter(b => b.status === 'lendo' || b.status === 'quero ler').slice(0, 8).map(book => (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => selectBookFromLibrary(book)}
                        className="flex-shrink-0 group"
                      >
                        <img 
                          src={book.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(book.titulo)}&background=222`} 
                          alt={book.titulo}
                          className="w-12 h-16 object-cover rounded shadow-lg border border-neutral-800 group-hover:border-amber-500 transition-colors"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Título do Livro</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:border-amber-500/50"
                    placeholder="Ex: Dom Casmurro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Autor</label>
                  <input 
                    type="text" 
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:border-amber-500/50"
                    placeholder="Ex: Machado de Assis"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">URL da Capa (Opcional)</label>
                  <input 
                    type="url" 
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:border-amber-500/50"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Provocação / Discussão</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:border-amber-500/50 h-24 resize-none"
                    placeholder="O que os membros devem observar na leitura?"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                     type="button"
                     onClick={() => {
                       onUpdateSharedBook(null);
                       setIsModalOpen(false);
                     }}
                     className="flex-1 py-3 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl font-bold transition-all"
                   >
                     Encerrar Atual
                   </button>
                   <button 
                     type="submit"
                     className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
                   >
                     Salvar Mudanças
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
