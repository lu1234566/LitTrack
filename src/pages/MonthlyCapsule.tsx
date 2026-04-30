import React, { useState, useRef, useMemo } from 'react';
import { useBooksState } from '../context/BooksContext';
import { useReadingSessions } from '../context/ReadingSessionsContext';
import { useAuth } from '../context/AuthContext';
import { MonthlyCapsuleCard } from '../components/monthly/MonthlyCapsuleCard';
import { getMonthlyStats } from '../lib/monthlyCapsule';
import { toPng } from 'html-to-image';
import { Download, ChevronLeft, ChevronRight, Share2, Sparkles, Filter, BookOpen, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MonthlyCapsule: React.FC = () => {
  const { books } = useBooksState();
  const { sessions } = useReadingSessions();
  const { user } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    return getMonthlyStats(
      books,
      sessions,
      currentDate.getMonth(),
      currentDate.getFullYear()
    );
  }, [books, sessions, currentDate]);

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => {
    const next = addMonths(currentDate, 1);
    if (next <= new Date()) {
      setCurrentDate(next);
    }
  };

  const exportAsImage = async () => {
    const node = document.getElementById('monthly-capsule-card');
    if (!node) {
      alert('Erro: O card da cápsula não foi encontrado na página.');
      return;
    }

    setIsExporting(true);
    try {
      // Ensure the node is visible and images/fonts have a chance to load
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 1500)); // Slightly longer delay for stability
      
      const dataUrl = await toPng(node, {
        quality: 1,
        pixelRatio: 3, // Higher resolution for better quality
        backgroundColor: '#0a0a0a',
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        // Filter out problematic elements if any
        filter: (node) => {
          const shadowRoot = (node as any).shadowRoot;
          return !shadowRoot;
        }
      });

      if (!dataUrl || dataUrl.length < 500) {
        throw new Error('Falha ao gerar imagem de alta resolução.');
      }

      const link = document.createElement('a');
      link.download = `readora-capsula-${format(currentDate, 'yyyy-MM', { locale: ptBR })}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err: any) {
      console.error('Erro ao exportar imagem:', err);
      
      // Fallback 1: Try with lower resolution
      try {
        console.log("Tentando exportação em baixa resolução...");
        const dataUrl = await toPng(node, { quality: 0.8, pixelRatio: 1 });
        const link = document.createElement('a');
        link.download = `readora-capsula-${format(currentDate, 'yyyy-MM', { locale: ptBR })}.png`;
        link.href = dataUrl;
        link.click();
      } catch (fallbackErr) {
        alert(`Não foi possível baixar a imagem automaticamente. Erro: ${err.message || 'Erro de processamento'}`);
        
        // Fallback 2: Open in new window
        try {
          const dataUrl = await toPng(node);
          const win = window.open();
          if (win) {
            win.document.write(`
              <html>
                <body style="margin:0; background: #0a0a0a; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
                  <img src="${dataUrl}" style="max-width: 90%; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border-radius: 8px;" />
                  <p style="color: white; font-family: sans-serif; position: fixed; bottom: 20px; font-size: 14px;">Clique com o botão direito para salvar</p>
                </body>
              </html>
            `);
          }
        } catch (finalErr) {
          console.error("Todos os métodos de exportação falharam:", finalErr);
        }
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Sparkles size={16} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Resumo Mensal v1.2</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif leading-tight">Cápsula Literária</h1>
            <p className="text-neutral-500 text-sm max-w-xl">
              Um resumo visual e poético da sua jornada literária mês a mês. Perfeito para compartilhar suas conquistas.
            </p>
          </div>

          <div className="flex items-center bg-neutral-900/50 border border-neutral-800 rounded-2xl p-1 shrink-0">
            <button 
              onClick={handlePrevMonth}
              className="p-3 text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-6 py-2 text-center min-w-[160px]">
              <span className="text-xs uppercase tracking-widest text-neutral-500 block">Período</span>
              <span className="text-sm font-medium capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </span>
            </div>
            <button 
              onClick={handleNextMonth} 
              disabled={addMonths(currentDate, 1) > new Date()}
              className="p-3 text-neutral-400 hover:text-neutral-100 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Preview Container */}
        <div className="flex justify-center bg-neutral-900/30 rounded-[3rem] p-12 border border-neutral-800/40 shadow-inner overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentDate.toISOString()}
            className="shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden"
          >
            <MonthlyCapsuleCard stats={stats} userName={user?.name} />
          </motion.div>
        </div>

        {/* Actions & Information */}
        <div className="space-y-12 py-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-serif italic text-amber-50">Sua Essência de {stats.monthName}</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <InfoBlock 
                title="Páginas percorridas"
                value={stats.totalPages}
                description="A distância mística que seus olhos atravessaram este mês."
              />
              <InfoBlock 
                title="Histórias concluídas"
                value={stats.totalBooks}
                description="O número de universos que agora fazem parte da sua história."
              />
              <InfoBlock 
                title="Atmosfera Dominante"
                value={stats.dominantMood}
                description="O sentimento que guiou suas escolhas e momentos de leitura."
              />
            </div>

            {stats.booksCompleted.length > 0 && (
              <div className="pt-10 border-t border-neutral-800/50 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-[0.2em] flex items-center gap-2">
                    <BookOpen size={16} className="text-amber-500" />
                    Livros e Avaliações de {stats.monthName}
                  </h3>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                    {stats.booksCompleted.length} obras concluídas
                  </span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {stats.booksCompleted.map((book) => (
                    <div key={book.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800/60 group hover:border-amber-500/20 transition-all">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-14 bg-neutral-800 rounded-lg overflow-hidden shrink-0 shadow-lg border border-neutral-700/50">
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen size={14} className="text-neutral-700" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-neutral-100 group-hover:text-amber-500 transition-colors">{book.titulo}</h4>
                          <p className="text-xs text-neutral-500 italic font-serif">{book.autor}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-neutral-800/50">
                        <div className="flex flex-col items-end sm:items-center">
                          <span className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mb-1">Páginas</span>
                          <span className="text-xs font-mono text-neutral-300">{book.pageCount || '—'}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mb-1">Nota</span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={12} 
                                className={`${i < (book.notaGeral || 0) ? 'text-amber-500 fill-amber-500' : 'text-neutral-800'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl">
                      <Star className="text-amber-500" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400 font-medium">Média Literária do Mês</p>
                      <h4 className="text-2xl font-serif font-bold text-amber-50 italic">{stats.averageRating.toFixed(1)} / 5.0</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-400 font-medium">Foco do Período</p>
                    <h4 className="text-sm font-bold text-neutral-200">{stats.topGenre}</h4>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-neutral-800/50">
            <button
              onClick={exportAsImage}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-5 rounded-2xl transition-all shadow-xl shadow-amber-500/10 active:scale-[0.98] disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Preparando sua cápsula...</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Baixar Cápsula Literária (PNG)</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-neutral-600 text-center uppercase tracking-widest leading-relaxed">
              Resolução otimizada para Stories e compartilhamento social.
            </p>
          </div>

          {stats.totalBooks === 0 && stats.totalSessions === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 bg-neutral-900/80 border border-neutral-800 rounded-2xl flex items-start gap-4"
            >
              <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                <Filter className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-amber-100">Silêncio nas Prateleiras</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Não encontramos registros de leitura para este mês. Que tal começar uma nova história hoje para preencher sua próxima cápsula?
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoBlock = ({ title, value, description }: { title: string; value: string | number; description: string }) => (
  <div className="space-y-2 group">
    <div className="flex items-baseline gap-3">
      <span className="text-3xl font-serif text-amber-100 tabular-nums">{value}</span>
      <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-[0.1em]">{title}</h3>
    </div>
    <p className="text-xs text-neutral-600 italic group-hover:text-neutral-500 transition-colors">
      {description}
    </p>
  </div>
);
