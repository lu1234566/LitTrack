import React, { useState, useRef, useMemo } from 'react';
import { useBooksState } from '../context/BooksContext';
import { useReadingSessions } from '../context/ReadingSessionsContext';
import { useAuth } from '../context/AuthContext';
import { MonthlyCapsuleCard } from '../components/monthly/MonthlyCapsuleCard';
import { getMonthlyStats } from '../lib/monthlyCapsule';
import { toPng } from 'html-to-image';
import { Download, ChevronLeft, ChevronRight, Share2, Sparkles, Filter } from 'lucide-react';
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
    if (!node) return;

    setIsExporting(true);
    try {
      // Small delay to ensure any animations finish
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(node, {
        quality: 0.95,
        pixelRatio: 2, // High resolution for sharing
        backgroundColor: '#0a0a0a'
      });
      
      const link = document.createElement('a');
      link.download = `readora-capsula-${format(currentDate, 'yyyy-MM', { locale: ptBR })}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao exportar imagem:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Sparkles size={16} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Premium Feature</span>
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
