import React, { useMemo, useState } from 'react';
import { useBooks } from '../context/BookContext';
import { Book, Star, TrendingUp, Award, BookOpen, Calendar, Sparkles, X, Target, FileText, ChevronRight, History, RefreshCw, Plus, Clock, Filter, ArrowUpRight, ArrowDownRight, BookmarkPlus, Zap, Folder, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  safeParseNumber, 
  formatPages, 
  formatPagesShort, 
  formatPagesPerBook, 
  formatPagesLong,
  calculatePeriodStats,
  getStatsRange,
  generateComparison,
  StatsPeriod
} from '../lib/statsUtils';
import { startOfMonth, subMonths, endOfMonth, subDays, startOfYear, endOfYear, addDays, isSameDay, format, differenceInDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Logomark } from '../components/Logomark';
import { ReadingSessionModal } from '../components/ReadingSessionModal';
import { ReadingHeatmap } from '../components/ReadingHeatmap';
import { StreakCard } from '../components/StreakCard';
import { ReadingCompanion } from '../components/ReadingCompanion';
import { analysisService } from '../services/analysisService';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MOODS = ['Sombrio', 'Tenso', 'Reflexivo', 'Aconchegante', 'Emocional', 'Misterioso', 'Caótico', 'Inspirador', 'Cerebral', 'Mágico'];

export const Dashboard: React.FC = () => {
  const { books, loading, userGoal, sessions, shelves } = useBooks();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'livros' | 'paginas'>('livros');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('this_month');

  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTHS[new Date().getMonth()];

  const stats = useMemo(() => {
    if (loading) return null;
    const lidos = books.filter((b) => b.status === 'lido');
    
    // Filter books read in the current year
    const lidosEsteAno = lidos.filter(b => b.anoLeitura === currentYear);
    const totalLidosEsteAno = lidosEsteAno.length;
    const paginasLidasEsteAno = lidosEsteAno.reduce((acc, b) => acc + safeParseNumber(b.pageCount), 0);

    // Current month books
    const lidosEsteMes = lidosEsteAno.filter(b => b.mesLeitura === currentMonthName);

    const lendoAgora = books.filter(b => b.status === 'lendo');
    const maisAvancado = lendoAgora.length > 0 ? [...lendoAgora].sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0))[0] : null;

    // Session stats
    const startOfWeek = new Date();
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const sessionsThisWeek = sessions.filter(s => s.date >= startOfWeek.getTime());
    const pagesThisWeek = sessionsThisWeek.reduce((acc, s) => acc + s.pagesRead, 0);

    const totalLidos = lidos.length;
    const mediaGeral = totalLidos > 0 ? lidos.reduce((acc, b) => acc + b.notaGeral, 0) / totalLidos : 0;
    
    // Page stats
    const lidosComPaginas = lidos.filter(b => {
      const p = safeParseNumber(b.pageCount);
      return p > 0;
    });
    const totalPaginas = lidos.reduce((acc, b) => acc + safeParseNumber(b.pageCount), 0);
    const mediaPaginas = lidosComPaginas.length > 0 ? totalPaginas / lidosComPaginas.length : 0;
    
    // Rich Session Stats
    const sessionCount = sessions.length;
    const totalPagesReadInSessions = sessions.reduce((acc, s) => acc + s.pagesRead, 0);
    const totalDurationMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const avgPagesPerSession = sessionCount > 0 ? Math.round(totalPagesReadInSessions / sessionCount) : 0;
    
    // Day with most pages
    const sessionsByDay: Record<string, number> = {};
    sessions.forEach(s => {
      const d = format(new Date(s.date), 'yyyy-MM-dd');
      sessionsByDay[d] = (sessionsByDay[d] || 0) + s.pagesRead;
    });
    const bestDayDate = Object.keys(sessionsByDay).length > 0 ? Object.keys(sessionsByDay).reduce((a, b) => sessionsByDay[a] > sessionsByDay[b] ? a : b) : null;
    const bestDayVolume = bestDayDate ? sessionsByDay[bestDayDate] : 0;
    
    // Average pages per active day
    const activeDaysCount = Object.keys(sessionsByDay).length;
    const avgPagesPerActiveDay = activeDaysCount > 0 ? Math.round(totalPagesReadInSessions / activeDaysCount) : 0;

    // Mood frequency
    const moodFreq: Record<string, number> = {};
    sessions.forEach(s => {
      if (s.mood) moodFreq[s.mood] = (moodFreq[s.mood] || 0) + 1;
    });
    const topMood = Object.keys(moodFreq).length > 0 ? Object.keys(moodFreq).reduce((a, b) => moodFreq[a] > moodFreq[b] ? a : b) : null;

    const maiorLivro = lidosComPaginas.length > 0 ? lidosComPaginas.reduce((prev, curr) => (safeParseNumber(prev.pageCount) > safeParseNumber(curr.pageCount) ? prev : curr), lidosComPaginas[0]) : null;
    const menorLivro = lidosComPaginas.length > 0 ? lidosComPaginas.reduce((prev, curr) => (safeParseNumber(prev.pageCount) < safeParseNumber(curr.pageCount) ? prev : curr), lidosComPaginas[0]) : null;

    // Pacing metrics
    let totalDaysToFinish = 0;
    let finishDateCount = 0;
    lidos.forEach(b => {
      if (b.startedAt && b.finishedAt) {
        const diff = (b.finishedAt - b.startedAt) / (1000 * 60 * 60 * 24);
        if (diff > 0) {
          totalDaysToFinish += diff;
          finishDateCount++;
        }
      }
    });
    const mediaDiasParaConcluir = finishDateCount > 0 ? Math.round(totalDaysToFinish / finishDateCount) : 0;

    // Livro com maior nota
    const melhorLivro = lidos.length > 0 ? lidos.reduce((prev, current) => (prev.notaGeral > current.notaGeral ? prev : current), lidos[0]) : null;

    // Autor mais lido
    const autores = lidos.reduce((acc, b) => {
      acc[b.autor] = (acc[b.autor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const autorMaisLido = Object.keys(autores).length > 0 ? Object.keys(autores).reduce((a, b) => (autores[a] > autores[b] ? a : b), '') : '';

    // Gênero mais lido
    const generos = lidos.reduce((acc, b) => {
      acc[b.genero] = (acc[b.genero] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const generoMaisLido = Object.keys(generos).length > 0 ? Object.keys(generos).reduce((a, b) => (generos[a] > generos[b] ? a : b), '') : '';

    // Leituras por mês
    const leiturasPorMes = MONTHS.map(mes => {
      const livrosMes = lidos.filter(b => b.mesLeitura === mes && b.anoLeitura === currentYear);
      return {
        name: mes.substring(0, 3),
        fullName: mes,
        quantidade: livrosMes.length,
        paginas: livrosMes.reduce((acc, b) => acc + safeParseNumber(b.pageCount), 0),
        livros: livrosMes
      };
    });

    const mesMaisPaginas = [...leiturasPorMes].sort((a, b) => b.paginas - a.paginas)[0];

    // Wishlist stats
    const queroLer = books.filter(b => b.status === 'quero ler');
    const highPriority = queroLer.filter(b => b.priority === 'high');
    const nextRead = [...queroLer].sort((a, b) => {
      const pMap = { high: 3, medium: 2, low: 1 };
      const pA = pMap[a.priority as 'low'|'medium'|'high'] || 0;
      const pB = pMap[b.priority as 'low'|'medium'|'high'] || 0;
      if (pB !== pA) return pB - pA;
      return (a.addedAt || a.dataCadastro || 0) - (b.addedAt || b.dataCadastro || 0);
    })[0];

    // Top livros
    const topLivros = [...lidos].sort((a, b) => b.notaGeral - a.notaGeral).slice(0, 5);

    // Mood Shelves
    const moodShelves = MOODS.map(mood => {
      const moodBooks = books.filter(b => {
        const bookMoods = b.moods && b.moods.length > 0 ? b.moods : analysisService.inferMoods(b);
        return bookMoods.includes(mood);
      });
      return { mood, books: moodBooks.slice(0, 6) };
    }).filter(shelf => shelf.books.length > 0);

    return { 
      totalLidos, 
      mediaGeral, 
      melhorLivro, 
      autorMaisLido, 
      generoMaisLido, 
      leiturasPorMes, 
      topLivros, 
      moodShelves,
      totalLidosEsteAno, 
      paginasLidasEsteAno, 
      lidosEsteMes,
      lendoAgora,
      maisAvancado,
      sessionsThisWeek,
      pagesThisWeek,
      totalPaginas,
      mediaPaginas,
      sessionCount,
      totalPagesReadInSessions,
      totalDurationMinutes,
      avgPagesPerSession,
      bestDayDate,
      bestDayVolume,
      avgPagesPerActiveDay,
      topMood,
      maiorLivro,
      menorLivro,
      mediaDiasParaConcluir,
      mesMaisPaginas,
      queroLerCount: queroLer.length,
      highPriorityCount: highPriority.length,
      nextRead,
      hasMissingPageCounts: lidos.some(b => !b.pageCount)
    };
  }, [books, loading, currentYear, currentMonthName, sessions]);

  const periodData = useMemo(() => {
    if (loading) return null;
    const range = getStatsRange(statsPeriod);
    const currentStats = calculatePeriodStats(books, sessions, range.start, range.end);
    
    // Previous period for comparison
    let prevStart: Date;
    let prevEnd: Date;
    let unit = 'período';

    if (statsPeriod === 'this_month') {
      prevStart = startOfMonth(subMonths(range.start, 1));
      prevEnd = endOfMonth(prevStart);
      unit = 'mês';
    } else if (statsPeriod === 'last_30_days') {
      prevStart = subDays(range.start, 30);
      prevEnd = subDays(range.end, 30);
      unit = '30 dias';
    } else if (statsPeriod === 'this_quarter') {
      prevStart = subMonths(range.start, 3);
      prevEnd = subMonths(range.end, 3);
      unit = 'trimestre';
    } else {
      prevStart = startOfYear(subMonths(range.start, 12));
      prevEnd = endOfYear(prevStart);
      unit = 'ano';
    }

    const prevStats = calculatePeriodStats(books, sessions, prevStart, prevEnd);
    const comparison = generateComparison(currentStats, prevStats, unit);

    return { current: currentStats, comparison, range };
  }, [books, sessions, statsPeriod, loading]);

  const chartData = useMemo(() => {
    if (!stats || !periodData) return [];
    
    // If period is year or quarter, show monthly evolution
    if (statsPeriod === 'this_year' || statsPeriod === 'this_quarter') {
      return stats.leiturasPorMes;
    }
    
    // Otherwise show daily evolution for the range
    const { start, end } = periodData.range;
    const days = differenceInDays(end, start);
    const data = [];
    
    // Safety check for too many days
    if (days > 100) return stats.leiturasPorMes;

    for (let i = 0; i <= days; i++) {
       const date = addDays(start, i);
       const dateAtStartOfDay = startOfDay(date);
       if (dateAtStartOfDay > new Date()) break; // Don't show future
       
       const daySessions = sessions.filter(s => isSameDay(new Date(s.date), dateAtStartOfDay));
       const dayBooks = books.filter(b => b.status === 'lido' && b.finishedAt && isSameDay(new Date(b.finishedAt), dateAtStartOfDay));
       
       data.push({
         name: format(dateAtStartOfDay, 'dd/MM'),
         fullName: format(dateAtStartOfDay, "eeee, dd 'de' MMMM", { locale: ptBR }),
         quantidade: dayBooks.length,
         paginas: daySessions.reduce((acc, s) => acc + safeParseNumber(s.pagesRead), 0),
         livros: dayBooks
       });
    }
    return data;
  }, [stats, statsPeriod, periodData, sessions, books]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 p-2 rounded-2xl shadow-xl shadow-amber-500/10 animate-pulse flex items-center justify-center">
          <Logomark />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const selectedMonthData = selectedMonth ? stats.leiturasPorMes.find(m => m.name === selectedMonth) : null;

  // Goal Insights
  const getGoalInsights = () => {
    if (!userGoal) return null;
    
    const today = new Date();
    const endOfYear = new Date(currentYear, 11, 31);
    const diffTime = Math.abs(endOfYear.getTime() - today.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const booksGoal = safeParseNumber(userGoal.booksGoal);
    const pagesGoal = safeParseNumber(userGoal.pagesGoal);
    
    // Safety check for zero goals
    if (booksGoal <= 0 && pagesGoal <= 0) {
      return { diffDays, booksRemaining: 0, pagesRemaining: 0, message: "Defina suas metas anuais para acompanhar seu ritmo de leitura." };
    }

    const booksRemaining = booksGoal > 0 ? Math.max(0, booksGoal - stats.totalLidosEsteAno) : 0;
    const pagesRemaining = pagesGoal > 0 ? Math.max(0, pagesGoal - stats.paginasLidasEsteAno) : 0;
    
    const monthsRemaining = Math.max(1, 12 - today.getMonth());
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const expectedProgress = dayOfYear / 365;
    
    let message = "";
    
    if (booksGoal > 0) {
      const actualBooksProgress = stats.totalLidosEsteAno / booksGoal;
      const booksPerMonth = (booksRemaining / monthsRemaining).toFixed(1);
      
      if (actualBooksProgress >= 1) {
        message = "Parabéns! Você já bateu sua meta de livros!";
      } else if (actualBooksProgress >= expectedProgress) {
        message = "Você está em um ótimo ritmo! Continue assim.";
      } else {
        message = `Você precisará ler cerca de ${booksPerMonth.replace('.', ',')} livros por mês para alcançar sua meta.`;
      }
    } else if (pagesGoal > 0) {
      const pagesPerDay = Math.ceil(pagesRemaining / diffDays);
      message = pagesRemaining > 0 
        ? `Você precisa ler cerca de ${formatPagesLong(pagesPerDay)} por dia para atingir sua meta.` 
        : "Meta de páginas do ano concluída!";
    }
    
    return { diffDays, booksRemaining, pagesRemaining, message };
  };

  const insights = getGoalInsights();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="relative py-28 px-8 md:px-20 rounded-[4rem] bg-neutral-900/10 border border-neutral-800/20 overflow-hidden mb-24 group/hero">
        <div className="absolute top-0 right-0 p-12 opacity-[0.015] group-hover/hero:opacity-[0.035] transition-all duration-1000 pointer-events-none">
          <BookOpen size={450} className="text-neutral-100 rotate-12" />
        </div>
        
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-start justify-between gap-20">
          <div className="space-y-12 max-w-3xl">
             <div className="space-y-6">
               <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
                  <div className="w-16 h-1 bg-amber-500/60 rounded-full" />
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.5em] leading-none">Arquivos do Espírito</span>
               </div>
               <h1 className="text-8xl md:text-[10rem] font-serif font-black text-neutral-100 tracking-tighter leading-[0.85] animate-in fade-in slide-in-from-left-6 duration-1000 delay-100">Readora</h1>
               <p className="text-neutral-400 text-xl font-serif italic leading-relaxed max-w-xl animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
                 Sincronia entre o silêncio das páginas e a ressonância da sua própria voz. Onde cada percurso se torna um monumento à sabedoria.
               </p>
             </div>
             
             <div className="flex flex-wrap gap-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <button 
                  onClick={() => setShowSessionModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-14 py-5 rounded-[3rem] font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-3xl shadow-emerald-500/20 active:scale-95 group/btn"
                >
                  <Clock size={16} strokeWidth={3} className="group-hover/btn:rotate-12 transition-transform" />
                  Abrir Sessão
                </button>
                <Link 
                  to="/adicionar" 
                  className="bg-neutral-100 hover:bg-amber-400 text-neutral-950 px-14 py-5 rounded-[3rem] font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-3xl shadow-neutral-100/10 active:scale-95"
                >
                  <Plus size={16} strokeWidth={3} />
                  Nova Jornada
                </Link>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:w-[600px] animate-in fade-in zoom-in-95 duration-1000 delay-500">
             {[
               { label: 'Obras do Ano', value: stats.totalLidosEsteAno, color: 'text-neutral-100', icon: Book },
               { label: 'Páginas do Ciclo', value: formatPagesShort(stats.paginasLidasEsteAno), color: 'text-neutral-100', icon: FileText },
               { label: 'Média Crítica', value: stats.mediaGeral.toFixed(1), color: 'text-rose-500', icon: Star },
               { label: 'Constância', value: sessions.length > 0 ? analysisService.calculateStreak(sessions) : 0, color: 'text-amber-500', unit: 'dias', icon: TrendingUp }
             ].map((item, i) => (
               <div key={i} className="bg-neutral-900/40 backdrop-blur-3xl border border-neutral-800/40 rounded-[3rem] p-10 transition-all hover:bg-neutral-900/60 hover:border-neutral-600/60 group/stat relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/stat:opacity-[0.06] transition-opacity pointer-events-none">
                     <item.icon size={80} />
                  </div>
                  <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-6 group-hover/stat:text-neutral-400 transition-colors relative z-10">{item.label}</p>
                  <div className="flex items-baseline gap-4 relative z-10">
                    <span className={`text-5xl font-black tracking-tighter ${item.color}`}>{item.value}</span>
                    {item.unit && <span className="text-xs text-neutral-700 font-bold italic lowercase">{item.unit}</span>}
                  </div>
               </div>
             ))}
          </div>
        </div>
      </header>

      <section className="space-y-16">
        <div className="flex items-center justify-between px-8">
           <div className="flex items-center gap-8">
             <div className="w-1.5 h-16 bg-amber-500 rounded-full" />
             <div>
                <h2 className="text-6xl font-serif font-black text-neutral-100 tracking-tight italic leading-none">Imersão</h2>
                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.4em] mt-3 ml-1">Onde a mente repousa e se expande</p>
             </div>
           </div>
           <div className="flex bg-neutral-900/50 p-1.5 rounded-2xl border border-neutral-800/40 backdrop-blur-md">
             <Link to="/comparativo-anual" className="p-3.5 text-neutral-500 hover:text-amber-500 transition-all hover:scale-110" title="Comparativo">
               <TrendingUp size={22} />
             </Link>
             <Link to="/retrospectiva" className="p-3.5 text-neutral-500 hover:text-amber-500 transition-all hover:scale-110" title="Retrospectiva">
               <History size={22} />
             </Link>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
            {/* Main Current Reading Focus */}
            <div className="xl:col-span-8 space-y-12">
               {stats.lendoAgora.length > 0 ? (
                  <div className="bg-neutral-900/5 border border-neutral-800/40 rounded-[4rem] p-16 shadow-3xl relative overflow-hidden group/readnow min-h-[500px] flex flex-col">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.01] group-hover/readnow:opacity-[0.03] transition-opacity duration-1000">
                       <RefreshCw size={280} className="text-neutral-100 animate-spin-slow opacity-10" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-20 relative z-10">
                      <div className="flex items-center gap-5">
                        <div className="w-2 h-10 bg-emerald-500 rounded-full" />
                        <div>
                          <h3 className="text-4xl font-serif font-bold text-neutral-100 italic leading-none">Lendo Agora</h3>
                          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] mt-3 ml-0.5">Sua consciência expandida</p>
                        </div>
                      </div>
                      <Link to="/livros?status=lendo" className="text-[10px] font-black text-neutral-500 hover:text-emerald-500 transition-all uppercase tracking-[0.25em] bg-neutral-950/40 px-8 py-3 rounded-full border border-neutral-800/40 flex items-center gap-3 group/link">
                        Biblioteca ({stats.lendoAgora.length})
                        <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 relative z-10 flex-1">
                      {stats.maisAvancado && (
                        <div className="lg:col-span-12 xl:col-span-12">
                          <Link 
                            to={`/livro/${stats.maisAvancado.id}`}
                            className="flex flex-col md:flex-row gap-16 group/maincard items-center lg:items-start"
                          >
                            <div className="w-56 h-80 rounded-2xl overflow-hidden bg-neutral-950 shrink-0 shadow-[0_50px_100px_rgba(0,0,0,0.8)] group-hover/maincard:scale-105 transition-all duration-1000 border border-neutral-800/50 relative">
                              <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 to-transparent opacity-0 group-hover/maincard:opacity-100 transition-opacity" />
                              {stats.maisAvancado.coverUrl ? (
                                <img src={stats.maisAvancado.coverUrl} alt={stats.maisAvancado.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen size={64} className="text-neutral-800" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center min-w-0 py-6 w-full">
                              <div className="mb-12">
                                <h4 className="text-5xl font-bold text-neutral-100 line-clamp-2 leading-[1.1] mb-6 group-hover/maincard:text-amber-500 transition-colors tracking-tighter">
                                  {stats.maisAvancado.titulo}
                                </h4>
                                <p className="text-2xl text-neutral-500 font-serif italic tracking-tight">{stats.maisAvancado.autor}</p>
                              </div>
                              
                              <div className="space-y-8">
                                <div className="flex justify-between items-end text-[11px] font-black uppercase tracking-[0.3em] text-neutral-600">
                                  <span className="text-emerald-500 flex items-center gap-2">
                                    <Sparkles size={12} />
                                    {stats.maisAvancado.progressPercentage || 0}% de Evolução
                                  </span>
                                  <span className="italic font-serif">
                                    Página {stats.maisAvancado.currentPage || 0} de {(stats.maisAvancado.totalPages || stats.maisAvancado.pageCount) || '—'}
                                  </span>
                                </div>
                                <div className="h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/40 p-0.5">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.maisAvancado.progressPercentage || 0}%` }}
                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                                  />
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
               ) : (
                  <div className="bg-neutral-900/5 border border-dashed border-neutral-800/60 rounded-[4rem] p-24 text-center h-[500px] flex flex-col items-center justify-center group/empty">
                     <div className="w-32 h-32 bg-neutral-900/50 rounded-full flex items-center justify-center mb-10 border border-neutral-800/60 group-hover/empty:scale-110 transition-all duration-1000 shadow-inner">
                        <BookOpen size={56} className="text-neutral-700" />
                     </div>
                     <h3 className="text-4xl font-serif font-bold text-neutral-400 italic">Espaço do Possível</h3>
                     <p className="text-lg text-neutral-600 mt-6 font-serif italic max-w-sm leading-relaxed">Suas prateleiras contêm mundos inteiros aguardando a ignição da sua curiosidade.</p>
                     <Link to="/adicionar" className="mt-14 px-14 py-6 bg-neutral-800 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-950 text-[11px] font-black uppercase tracking-[0.4em] rounded-[3rem] transition-all active:scale-95 shadow-xl">Dar o Primeiro Passo</Link>
                  </div>
               )}

               {stats.lendoAgora.length > 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {stats.lendoAgora.filter(b => b.id !== stats.maisAvancado?.id).slice(0, 4).map(book => (
                      <Link 
                        key={book.id} 
                        to={`/livro/${book.id}`}
                        className="flex items-center gap-8 p-6 rounded-[3rem] bg-neutral-950/20 border border-neutral-800/40 hover:bg-neutral-950/40 hover:border-emerald-500/30 transition-all group/subcard shadow-sm"
                      >
                        <div className="w-20 h-28 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800/40 shadow-2xl group-hover/subcard:rotate-3 transition-transform duration-500">
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen size={24} className="text-neutral-800" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-lg font-bold text-neutral-200 truncate group-hover/subcard:text-emerald-500 transition-colors leading-tight mb-3 tracking-tight">{book.titulo}</h5>
                          <div className="flex items-center gap-6">
                            <div className="flex-1 h-2 bg-neutral-950 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500/60 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${book.progressPercentage || 0}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-neutral-600 font-mono">{book.progressPercentage || 0}%</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
               )}
            </div>

            <div className="xl:col-span-4 flex flex-col gap-12">
               {/* Goal Card - Refined */}
               <div className="bg-neutral-900/10 border border-neutral-800/40 rounded-[3rem] p-12 shadow-2xl flex flex-col justify-between group/goal relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.015] group-hover/goal:opacity-[0.04] transition-opacity duration-1000">
                     <Target size={160} />
                  </div>
                  <div className="flex items-center justify-between mb-12 relative z-10">
                    <div>
                      <h3 className="text-3xl font-serif font-bold text-neutral-100 italic">Meta {currentYear}</h3>
                      <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.3em] mt-3">Rumo ao Horizonte</p>
                    </div>
                  </div>

                  {!userGoal ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-10 relative z-10">
                      <div className="w-20 h-20 bg-neutral-900/50 rounded-full flex items-center justify-center border border-neutral-800/60 shadow-inner">
                        <Target className="text-neutral-700" size={32} />
                      </div>
                      <p className="text-base text-neutral-600 font-serif italic leading-relaxed max-w-[200px]">Caminhos sem direção levam a lugares vazios. Documente sua ambição.</p>
                      <Link to="/configuracoes" className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] bg-amber-500/10 px-10 py-5 rounded-[2rem] border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-3 group/link">
                        Definir Metas
                        <Plus size={14} className="group-hover/link:rotate-90 transition-transform" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-12 flex-1 flex flex-col justify-center relative z-10">
                       {safeParseNumber(userGoal.booksGoal) > 0 && (
                          <div className="space-y-6">
                             <div className="flex justify-between items-baseline">
                                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em]">Volume Literário</p>
                                <span className="text-3xl font-black text-neutral-100 italic tracking-tighter">{stats.totalLidosEsteAno} <span className="text-neutral-700 not-italic text-sm">/ {userGoal.booksGoal}</span></span>
                             </div>
                             <div className="h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/40 p-0.5">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (stats.totalLidosEsteAno / safeParseNumber(userGoal.booksGoal)) * 100)}%` }}
                                  className="h-full bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                />
                             </div>
                          </div>
                       )}

                       {safeParseNumber(userGoal.pagesGoal) > 0 && (
                          <div className="space-y-6">
                             <div className="flex justify-between items-baseline">
                                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em]">Densidade de Páginas</p>
                                <span className="text-3xl font-black text-neutral-100 italic tracking-tighter">{formatPagesShort(stats.paginasLidasEsteAno)} <span className="text-neutral-700 not-italic text-sm">/ {formatPagesShort(safeParseNumber(userGoal.pagesGoal))}</span></span>
                             </div>
                             <div className="h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/40 p-0.5">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (stats.paginasLidasEsteAno / safeParseNumber(userGoal.pagesGoal)) * 100)}%` }}
                                  className="h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                                />
                             </div>
                          </div>
                       )}

                       {insights && (
                          <div className="mt-4 p-8 bg-neutral-950/40 rounded-[2.5rem] border border-neutral-800/40 backdrop-blur-sm group-hover/goal:border-amber-500/20 transition-all duration-700">
                             <p className="text-sm text-neutral-400 font-serif italic leading-relaxed text-center opacity-90 group-hover/goal:opacity-100 transition-opacity">
                               "{insights.message}"
                             </p>
                          </div>
                       )}
                    </div>
                  )}
               </div>

               {/* Weekly Rhythm - Compact and Sharp */}
               <div className="bg-neutral-900/30 border border-neutral-800/40 rounded-[3rem] p-8 shadow-xl flex items-center justify-between group/weekly">
                  <div className="flex items-center gap-6">
                    <div className="p-5 bg-amber-500/10 text-amber-500 rounded-2xl shadow-inner group-hover/weekly:scale-105 transition-transform duration-500">
                      <TrendingUp size={32} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">Ritmo Semanal</p>
                      <h4 className="text-4xl font-black text-neutral-100 tracking-tighter italic">{formatPagesShort(stats.pagesThisWeek)}</h4>
                      <p className="text-[10px] text-neutral-700 font-bold uppercase tracking-[0.15em] mt-1">{stats.sessionsThisWeek.length} sessões ativas</p>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-neutral-800 group-hover/weekly:text-amber-500 group-hover/weekly:translate-x-2 transition-all" />
               </div>

               {/* Pulse de Leitura - Rich Insights */}
               <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group/pulse">
                 <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover/pulse:opacity-[0.05] transition-opacity">
                   <Zap size={140} className="text-emerald-500" />
                 </div>
                 
                 <div className="flex items-center justify-between mb-8 relative z-10">
                   <div>
                     <h3 className="text-2xl font-serif font-bold text-neutral-100 italic">Pulse de Leitura</h3>
                     <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mt-2">Sua constância em dados</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-neutral-950/40 p-5 rounded-2xl border border-neutral-800/40">
                       <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">Média por Sessão</p>
                       <p className="text-xl font-bold text-emerald-400 font-mono">{stats.avgPagesPerSession} págs</p>
                    </div>
                    <div className="bg-neutral-950/40 p-5 rounded-2xl border border-neutral-800/40">
                       <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">Tempo Total</p>
                       <p className="text-xl font-bold text-amber-500 font-mono">{Math.floor(stats.totalDurationMinutes / 60)}h {stats.totalDurationMinutes % 60}m</p>
                    </div>
                 </div>

                 <div className="space-y-4 relative z-10">
                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Últimas Incursões</p>
                    {sessions.slice(0, 3).map(session => (
                      <div key={session.id} className="flex gap-4 p-4 bg-neutral-950/60 rounded-2xl border border-neutral-800/60 group/session hover:border-emerald-500/30 transition-all">
                         <div className="w-1.5 h-10 bg-emerald-500/20 rounded-full group-hover/session:h-12 transition-all shrink-0" />
                         <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                               <h4 className="text-sm font-bold text-neutral-200 truncate">{session.bookTitle || 'Leitura Geral'}</h4>
                               <span className="text-[10px] font-mono text-neutral-600">{format(new Date(session.date), 'dd MMM', { locale: ptBR })}</span>
                            </div>
                            <p className="text-[11px] text-neutral-500 italic font-serif truncate mb-2">{session.quickNote || "Sem anotações nesta jornada."}</p>
                            <div className="flex items-center gap-3">
                               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">+{session.pagesRead} págs</span>
                               {session.mood && (
                                  <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-black uppercase">{session.mood}</span>
                               )}
                            </div>
                         </div>
                      </div>
                    ))}
                    {sessions.length === 0 && (
                       <p className="text-xs text-neutral-600 italic font-serif text-center py-4">Nenhum registro de sessão ainda.</p>
                    )}
                 </div>
               </div>
            </div>

            {/* Row 2: Reading Companion & Statistics */}
            <div className="xl:col-span-8">
               <ReadingCompanion 
                  books={books} 
                  sessions={sessions} 
                  onLogAction={() => setShowSessionModal(true)} 
               />
            </div>

            <div className="xl:col-span-4">
               <StreakCard sessions={sessions} />
            </div>
        </div>

        {/* Heatmap Section - Redesigned globally for the "Pass" */}
        <div className="bg-neutral-900/5 border border-neutral-800/20 rounded-[4rem] p-16 shadow-3xl relative overflow-hidden group/habit mt-12 mb-24">
           <div className="absolute top-0 right-0 p-16 opacity-[0.015] group-hover/habit:opacity-[0.04] transition-all duration-1000">
             <Calendar size={320} className="text-neutral-100 rotate-6" />
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 relative z-10">
              <div className="lg:col-span-4 space-y-16 py-4">
                 <div className="space-y-8">
                    <div className="flex items-center gap-6">
                       <div className="w-1.5 h-16 bg-blue-500/60 rounded-full" />
                       <div>
                          <h3 className="text-5xl font-serif font-black text-neutral-100 tracking-tight italic leading-none">Arquitetura</h3>
                          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.4em] mt-3 ml-0.5 whitespace-nowrap">Geometria da sua constância</p>
                       </div>
                    </div>
                    <p className="text-sm text-neutral-500 font-serif italic leading-relaxed max-w-sm">
                      Cada célula é um fragmento de tempo dedicado à expansão do seu mundo interior. A constância é a verdadeira maestria.
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-8 pt-10 border-t border-neutral-800/40">
                    <div>
                       <p className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.3em] mb-4">Densidade Ativa</p>
                       <h4 className="text-5xl font-black text-neutral-100 tracking-tighter italic leading-none">
                         {stats.sessionsThisMonth || 0}
                         <span className="text-sm text-neutral-800 not-italic ml-3 uppercase tracking-widest font-black lowercase">sessões</span>
                       </h4>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.3em] mb-4">Consistência</p>
                       <h4 className="text-5xl font-black text-blue-500 tracking-tighter italic leading-none">
                         {stats.readingFrequency}%
                         <span className="text-sm text-neutral-800 not-italic ml-3 uppercase tracking-widest font-black lowercase">score</span>
                       </h4>
                    </div>
                 </div>
              </div>
              
              <div className="lg:col-span-8 bg-neutral-950/40 p-12 rounded-[3.5rem] border border-neutral-800/40 shadow-inner group-hover/habit:border-blue-500/20 transition-all duration-1000">
                <div className="overflow-x-auto scrollbar-hide flex justify-center py-4">
                   <div className="min-w-max">
                      <ReadingHeatmap sessions={sessions} />
                   </div>
                </div>
                <div className="mt-10 flex justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm bg-neutral-900 border border-neutral-800" />
                    <span className="text-[9px] text-neutral-700 uppercase tracking-widest font-black">Sereno</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/80" />
                    <span className="text-[9px] text-neutral-700 uppercase tracking-widest font-black">Intenso</span>
                  </div>
                </div>
              </div>
           </div>
        </div>

        <section className="space-y-24 py-24">
        <div className="flex items-center justify-between px-8">
           <div className="flex items-center gap-8">
             <div className="w-1.5 h-16 bg-purple-500 rounded-full" />
             <div>
                <h2 className="text-6xl font-serif font-black text-neutral-100 tracking-tight italic leading-none">Atmosfera</h2>
                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.4em] mt-3 ml-1">Onde sua alma encontra ressonância</p>
             </div>
           </div>
           <Link to="/livros" className="text-[10px] font-black text-neutral-500 hover:text-purple-500 transition-all uppercase tracking-[0.3em] flex items-center gap-4 group/link bg-neutral-950/40 px-8 py-3 rounded-full border border-neutral-800/40 backdrop-blur-md">
             Explorar
             <ChevronRight size={14} className="group-hover/link:translate-x-2 transition-transform" />
           </Link>
        </div>

        {/* Atmosferas Literárias - Editorial Shelves */}
        {stats.moodShelves.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 px-2">
            {stats.moodShelves.slice(0, 4).map((shelf) => (
              <div 
                key={shelf.mood} 
                className="group/shelf bg-neutral-900/5 border border-neutral-800/20 rounded-[3.5rem] p-12 hover:bg-neutral-900/10 hover:border-purple-500/30 transition-all duration-700 shadow-xl flex flex-col gap-10 min-h-[440px] relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-20 p-12 opacity-[0.015] group-hover/shelf:opacity-[0.04] transition-opacity duration-1000 rotate-12 pointer-events-none">
                   <Sparkles size={180} className="text-purple-500" />
                </div>

                <div className="space-y-6 relative z-10">
                   <div className="flex items-start justify-between">
                      <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500 group-hover/shelf:scale-110 group-hover/shelf:rotate-3 transition-all duration-700">
                         <Sparkles size={24} />
                      </div>
                      <span className="text-[9px] bg-neutral-950 text-neutral-600 font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-neutral-800/40 backdrop-blur-md">
                        {shelf.books.length} Obras
                      </span>
                   </div>
                   <h4 className="text-4xl font-serif font-black text-neutral-100 capitalize italic leading-tight tracking-tight pt-2">{shelf.mood}</h4>
                </div>

                <div className="flex-1 space-y-4 pt-6 relative z-10">
                   <div className="flex -space-x-4 mb-8">
                     {shelf.books.slice(0, 3).map((book, idx) => (
                       <Link 
                         key={book.id} 
                         to={`/livro/${book.id}`}
                         className="relative w-20 h-28 rounded-xl overflow-hidden border-2 border-neutral-900 shadow-2xl transition-all hover:z-20 hover:-translate-y-4 group/image"
                         style={{ zIndex: 10 - idx }}
                       >
                         {book.coverUrl ? (
                           <img src={book.coverUrl} alt={book.titulo} className="w-full h-full object-cover transition-all group-hover/image:scale-110" referrerPolicy="no-referrer" />
                         ) : (
                           <div className="w-full h-full bg-neutral-950 flex items-center justify-center">
                             <BookOpen size={20} className="text-neutral-800" />
                           </div>
                         )}
                         <div className="absolute inset-0 bg-neutral-950/20 group-hover/image:bg-transparent transition-colors" />
                       </Link>
                     ))}
                     {shelf.books.length > 3 && (
                       <div className="w-20 h-28 rounded-xl border border-dashed border-neutral-800/60 bg-neutral-950/40 flex items-center justify-center text-[11px] font-black text-neutral-700 backdrop-blur-sm">
                         +{shelf.books.length - 3}
                       </div>
                     )}
                   </div>
                   <p className="text-xs text-neutral-600 font-serif italic leading-relaxed line-clamp-3">
                     Uma seleção curada de narrativas que florescem sob a aura {shelf.mood}, preparadas para o seu momento de introspeção.
                   </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Custom Shelves Insight Section */}
      <section className="space-y-16 py-12">
           <div className="flex items-center justify-between px-8">
              <div className="flex items-center gap-8">
                <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 shadow-inner border border-amber-500/10">
                  <Folder size={28} />
                </div>
                <div>
                  <h3 className="text-4xl font-serif font-black text-neutral-100 italic leading-none">Estantes</h3>
                  <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.4em] mt-3 ml-0.5">Sua arquitetura intelectual</p>
                </div>
              </div>
              <Link to="/estantes" className="text-[10px] font-black text-neutral-500 hover:text-amber-500 transition-all uppercase tracking-[0.3em] flex items-center gap-4 group/link bg-neutral-950/40 px-8 py-3 rounded-full border border-neutral-800/40 backdrop-blur-md">
                Gerenciar
                <ChevronRight size={14} className="group-hover/link:translate-x-2 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-2">
               {shelves.filter(s => s.type === 'custom').slice(0, 3).map(shelf => (
                 <Link 
                   key={shelf.id} 
                   to={`/estante/${shelf.id}`}
                   className="group/shelfcard bg-neutral-900/5 border border-neutral-800/20 rounded-[3rem] p-10 hover:bg-neutral-900/10 hover:border-amber-500/30 transition-all duration-700 relative overflow-hidden flex flex-col gap-10 min-h-[300px] shadow-xl"
                 >
                    <div className="absolute -top-10 -right-10 p-12 opacity-[0.015] group-hover/shelfcard:opacity-[0.05] transition-all duration-1000 rotate-12 pointer-events-none">
                       <Folder size={240} style={{ color: shelf.accentColor || '#fbbf24' }} />
                    </div>
                    <div className="relative z-10 space-y-6 flex-1">
                       <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: shelf.accentColor || '#fbbf24' }} />
                       <div className="space-y-4">
                          <h4 className="text-3xl font-serif font-black text-neutral-100 italic group-hover/shelfcard:text-amber-500 transition-colors tracking-tight">{shelf.name}</h4>
                          <div className="inline-flex items-center gap-3 px-4 py-2 bg-neutral-950/60 rounded-full border border-neutral-800/40 backdrop-blur-md">
                             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: shelf.accentColor || '#fbbf24' }} />
                             <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{shelf.bookIds.length} LIVROS</span>
                          </div>
                       </div>
                       <p className="text-xs text-neutral-500 font-serif italic line-clamp-3 leading-relaxed pt-4 border-t border-neutral-800/20">{shelf.description || "Uma coleção singular de narrativas escolhidas com propósito."}</p>
                    </div>
                 </Link>
               ))}
               {shelves.filter(s => s.type === 'custom').length < 3 && (
                 <Link 
                   to="/estantes"
                   className="bg-neutral-900/5 border border-dashed border-neutral-800/60 rounded-[3rem] p-12 flex flex-col items-center justify-center gap-6 group/add transition-all hover:bg-neutral-900/10 hover:border-amber-500/30 group-hover/add:scale-[1.02] shadow-inner"
                 >
                    <div className="w-20 h-20 bg-neutral-950/40 rounded-full flex items-center justify-center border border-neutral-800/60 group-hover/add:scale-110 group-hover/add:border-amber-500/30 transition-all duration-700">
                      <Plus className="text-neutral-700 group-hover/add:text-amber-500 transition-colors" size={32} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-700 group-hover/add:text-amber-500 transition-colors">Nova Estante</span>
                 </Link>
               )}
            </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           {/* Fila de Leitura */}
           {stats.queroLerCount > 0 && (
             <div className="bg-neutral-900/30 border border-neutral-800/40 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group/queue h-full">
               <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover/queue:opacity-[0.05] transition-opacity">
                 <BookmarkPlus size={160} className="text-neutral-100" />
               </div>
               
               <div className="flex items-center justify-between mb-10 relative z-10">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                     <BookmarkPlus size={24} />
                   </div>
                   <h3 className="text-2xl font-serif font-bold text-neutral-100 italic tracking-tight">Fila de Leitura</h3>
                 </div>
                 <Link to="/livros?status=quero+ler" className="text-[11px] font-black text-neutral-600 hover:text-blue-500 transition-all uppercase tracking-[0.15em]">
                    Ver tudo ({stats.queroLerCount})
                 </Link>
               </div>

               <div className="space-y-6 relative z-10">
                 {stats.nextRead && (
                   <Link 
                     to={`/livro/${stats.nextRead.id}`}
                     className="bg-neutral-950/40 border border-neutral-800/40 rounded-[2rem] p-6 flex gap-8 hover:bg-neutral-950/60 hover:border-blue-500/30 transition-all group/next shadow-xl"
                   >
                     <div className="w-20 h-32 rounded-xl overflow-hidden bg-neutral-950 shrink-0 shadow-2xl border border-neutral-800/50 group-hover/next:scale-110 transition-transform duration-700">
                       {stats.nextRead.coverUrl ? (
                         <img src={stats.nextRead.coverUrl} alt={stats.nextRead.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                           <BookOpen size={24} className="text-neutral-800" />
                         </div>
                       )}
                     </div>
                     <div className="flex-1 flex flex-col justify-center min-w-0">
                       <span className="text-[10px] uppercase tracking-[0.2em] text-blue-500/80 font-black mb-2 block">Sugestão de Próxima Jornada</span>
                       <h4 className="text-xl font-bold text-neutral-100 line-clamp-1 mb-1 group-hover/next:text-blue-400 transition-colors tracking-tight leading-none">{stats.nextRead.titulo}</h4>
                       <p className="text-sm text-neutral-500 font-serif italic mb-4">{stats.nextRead.autor}</p>
                       <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex self-start border border-current transition-colors ${
                          stats.nextRead.priority === 'high' ? 'bg-rose-500/5 text-rose-500 border-rose-500/20' :
                          stats.nextRead.priority === 'medium' ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' :
                          'bg-emerald-500/5 text-emerald-500 border-emerald-500/20'
                        }`}>
                           {stats.nextRead.priority === 'high' ? 'Prioritário' : 'Normal'}
                       </div>
                     </div>
                   </Link>
                 )}
               </div>
             </div>
           )}
        </div>
      </section>

      <section className="space-y-20 py-24 mb-24 border-y border-neutral-800/20">
           <div className="flex items-center justify-between px-8">
              <div className="flex items-center gap-8">
                <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500 shadow-inner border border-rose-500/10">
                  <Award size={28} />
                </div>
                <div>
                  <h2 className="text-5xl font-serif font-black text-neutral-100 tracking-tight italic leading-none">Conquistas</h2>
                  <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.4em] mt-3 ml-1">Vantagem literária em {currentMonthName}</p>
                </div>
              </div>
              <Link to="/linha-do-tempo" className="text-[10px] font-black text-neutral-500 hover:text-amber-500 transition-all uppercase tracking-[0.3em] bg-neutral-950/40 px-8 py-3 rounded-full border border-neutral-800/40 backdrop-blur-md group/link">
                 Histórico
                 <ChevronRight size={14} className="group-hover/link:translate-x-2 transition-transform" />
              </Link>
           </div>

           <div className="bg-neutral-900/5 border border-neutral-800/20 rounded-[4rem] p-16 shadow-3xl relative overflow-hidden group/achieve">
             <div className="absolute top-0 right-0 p-16 opacity-[0.015] group-hover/achieve:opacity-[0.05] transition-all duration-1000 rotate-6 pointer-events-none">
               <Trophy size={320} className="text-amber-500" />
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 relative z-10">
                <div className="lg:col-span-5 space-y-12">
                   <div className="space-y-4">
                      <p className="text-sm text-neutral-400 font-serif italic leading-relaxed">
                        Seu rastro através do conhecimento em {currentMonthName}. Monumentos que você ergueu através da leitura persistente.
                      </p>
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                      <div className="p-8 bg-neutral-950/40 rounded-[2.5rem] border border-neutral-800/40 shadow-inner">
                         <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-3">Concluídos</p>
                         <p className="text-4xl font-black text-neutral-100 font-mono tracking-tighter">{stats.lidosEsteMes.length}</p>
                      </div>
                      <div className="p-8 bg-neutral-950/40 rounded-[2.5rem] border border-neutral-800/40 shadow-inner">
                         <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-3">Expansão</p>
                         <p className="text-4xl font-black text-amber-500 font-mono tracking-tighter">+{stats.paginasEsteMes}<span className="text-xs uppercase ml-1">P</span></p>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-7 flex flex-wrap gap-8 items-center justify-end">
                  {stats.lidosEsteMes.length > 0 ? (
                    stats.lidosEsteMes.slice(0, 4).map(book => (
                      <Link 
                        key={book.id} 
                        to={`/livro/${book.id}`}
                        className="group/achitem relative"
                      >
                        <div className="w-40 h-56 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800/40 shadow-[0_30px_60px_rgba(0,0,0,0.6)] transition-all duration-700 group-hover/achitem:-translate-y-6 group-hover/achitem:border-amber-500/40 group-hover/achitem:shadow-amber-500/20 group-hover/achitem:rotate-2">
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.titulo} className="w-full h-full object-cover grayscale-[20%] group-hover/achitem:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen size={32} className="text-neutral-900" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover/achitem:opacity-100 transition-opacity flex flex-col justify-end p-6">
                             <div className="flex items-center gap-2 text-amber-500 mb-2">
                               <Star size={14} fill="currentColor" />
                               <span className="text-sm font-black">{book.notaGeral.toFixed(1)}</span>
                             </div>
                             <p className="text-[10px] text-neutral-300 font-bold uppercase truncate">{book.titulo}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-24 px-12 border border-dashed border-neutral-800/40 rounded-[3rem] bg-neutral-950/10 text-center space-y-8 min-h-[300px]">
                       <div className="w-20 h-20 bg-neutral-900/50 rounded-full flex items-center justify-center border border-neutral-800/60 shadow-inner">
                          <History size={32} className="text-neutral-800 opacity-50" />
                       </div>
                       <p className="text-lg text-neutral-600 font-serif italic leading-relaxed max-w-[280px]">As conquistas deste ciclo aguardam o amadurecimento das suas leituras atuais.</p>
                       <Link to="/livros" className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] hover:text-amber-500 transition-all bg-neutral-950 px-8 py-3 rounded-full border border-neutral-800/40">Explorar Prateleira</Link>
                    </div>
                  )}
                  {stats.lidosEsteMes.length > 4 && (
                    <Link to="/linha-do-tempo" className="w-40 h-56 rounded-2xl border border-dashed border-neutral-800/60 bg-neutral-950/20 flex flex-col items-center justify-center gap-4 hover:border-amber-500/40 transition-all group/morebox shadow-inner">
                       <span className="text-5xl font-black text-neutral-700 group-hover/morebox:text-amber-500 transition-colors tracking-tighter">+{stats.lidosEsteMes.length - 4}</span>
                       <span className="text-[10px] font-black uppercase text-neutral-800 tracking-widest">Obras Masterizadas</span>
                    </Link>
                  )}
                </div>
             </div>
           </div>
        </section>

      <section className="space-y-12 pt-12">
        <div className="flex items-center gap-5 px-4">
           <div className="w-2 h-10 bg-neutral-700 rounded-full" />
           <h2 className="text-3xl font-serif font-black text-neutral-100 tracking-tight italic leading-none">Profundidade Analítica</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard icon={Star} label="Média de Notas" value={stats.mediaGeral > 0 ? stats.mediaGeral.toFixed(1) : '—'} color="text-rose-500" bg="bg-rose-500/5 shadow-[0_15px_35px_rgba(244,63,94,0.05)] border-rose-500/10" />
          <StatCard icon={TrendingUp} label="Autor Preferido" value={stats.autorMaisLido || 'Início de jornada'} color="text-violet-400" bg="bg-violet-500/5 shadow-[0_15px_35px_rgba(139,92,246,0.05)] border-violet-500/10" truncate />
          <StatCard icon={Clock} label="Ritmo Médio" value={stats.mediaDiasParaConcluir > 0 ? `${stats.mediaDiasParaConcluir}d` : 'Calibrando'} subValue="por obra" color="text-amber-400" bg="bg-amber-500/5 shadow-[0_15px_35px_rgba(245,158,11,0.05)] border-amber-500/10" />
          <StatCard icon={Award} label="Maior Obra" value={stats.maiorLivro ? formatPagesShort(safeParseNumber(stats.maiorLivro.pageCount)) : '—'} subValue={stats.maiorLivro?.titulo} color="text-blue-400" bg="bg-blue-500/5 shadow-[0_15px_35px_rgba(59,130,246,0.05)] border-blue-500/10" truncate />
        </div>

        <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group/performance">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/performance:opacity-10 transition-opacity">
             <TrendingUp size={120} className="text-neutral-100" />
           </div>
           
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
             <div className="space-y-1">
               <h3 className="text-2xl font-serif font-bold text-neutral-100 italic">Desempenho no Período</h3>
               <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Estatísticas detalhadas</p>
             </div>
             
             <div className="flex bg-neutral-950/60 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-800/50 self-start">
               {[
                 { id: 'this_month', label: 'Mês' },
                 { id: 'last_30_days', label: '30 Dias' },
                 { id: 'this_quarter', label: 'Trimestre' },
                 { id: 'this_year', label: 'Ano' }
               ].map((p) => (
                 <button
                   key={p.id}
                   onClick={() => setStatsPeriod(p.id as StatsPeriod)}
                   className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${statsPeriod === p.id ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-300'}`}
                 >
                   {p.label}
                 </button>
               ))}
             </div>
           </div>

           {periodData && (
             <div className="space-y-10 relative z-10">
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Livros</p>
                    <h4 className="text-4xl font-black text-neutral-100 italic tracking-tighter">{periodData.current.booksFinished}</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Páginas</p>
                    <h4 className="text-4xl font-black text-neutral-100 italic tracking-tighter">{formatPagesShort(periodData.current.pagesRead)}</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Dias Ativos</p>
                    <h4 className="text-4xl font-black text-neutral-100 italic tracking-tighter">{periodData.current.activeReadingDays}</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Leitura Focada</p>
                    <h4 className="text-4xl font-black text-neutral-100 italic tracking-tighter">{(periodData.current.pagesRead / (periodData.current.sessionsCount || 1)).toFixed(0)}</h4>
                    <p className="text-[8px] text-neutral-700 uppercase font-black tracking-widest">Pág/Sessão</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Pág/Livro</p>
                    <h4 className="text-4xl font-black text-neutral-100 italic tracking-tighter">{Math.round(stats.mediaPaginas)}</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Sessões</p>
                    <h4 className="text-4xl font-black text-neutral-100 italic tracking-tighter">{periodData.current.sessionsCount}</h4>
                  </div>
               </div>

               <div className="bg-neutral-950/40 border border-neutral-800/50 rounded-3xl p-6 flex flex-col md:flex-row md:items-center gap-6">
                  <div className={`p-4 rounded-2xl shrink-0 ${periodData.comparison.isImprovement ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500 shadow-inner'}`}>
                    {periodData.comparison.isImprovement ? <ArrowUpRight size={28} /> : <ArrowDownRight size={28} />}
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Tendência de Leitura</h5>
                    <p className="text-lg text-neutral-200 font-serif italic leading-relaxed">
                      {periodData.comparison.bookMsg} {periodData.comparison.pageMsg}
                    </p>
                  </div>
               </div>
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
           {/* Chart Evolution */}
           <div className="xl:col-span-2 bg-neutral-900/40 border border-neutral-800/60 rounded-[2.5rem] p-8 shadow-xl flex flex-col relative overflow-hidden group/chart">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <Calendar className="text-amber-500" size={24} />
                  <h3 className="text-xl font-serif font-bold text-neutral-100 italic">
                    {statsPeriod === 'this_year' ? 'Evolução Anual' : statsPeriod === 'this_month' ? 'Ritmo Mensal' : 'Ritmo no Período'}
                  </h3>
                </div>
                <div className="flex bg-neutral-950/60 p-1 rounded-xl border border-neutral-800/50 backdrop-blur-sm">
                  <button 
                    onClick={() => setChartMode('livros')}
                    className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${chartMode === 'livros' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    Livros
                  </button>
                  <button 
                    onClick={() => setChartMode('paginas')}
                    className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${chartMode === 'paginas' ? 'bg-blue-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    Páginas
                  </button>
                </div>
              </div>
              
              <div className="h-64 w-full mb-4 relative z-10" style={{ minWidth: 0, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#404040" 
                      tick={{ fill: '#404040', fontSize: 9, fontWeight: 700 }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#404040" 
                      tick={{ fill: '#404040', fontSize: 9, fontWeight: 700 }} 
                      axisLine={false} 
                      tickLine={false} 
                      allowDecimals={false} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#171717', opacity: 0.4 }} 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', padding: '12px' }}
                      itemStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      labelStyle={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '13px', color: '#f59e0b', marginBottom: '6px' }}
                      formatter={(value: any) => [value.toLocaleString(), chartMode === 'livros' ? 'Livros' : 'Páginas']}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) return payload[0].payload.fullName;
                        return label;
                      }}
                    />
                    <Bar 
                      dataKey={chartMode === 'livros' ? 'quantidade' : 'paginas'} 
                      radius={[4, 4, 0, 0]} 
                      onClick={(data) => {
                        if (data && data.name && (statsPeriod === 'this_year' || statsPeriod === 'this_quarter')) {
                          setSelectedMonth(selectedMonth === data.name ? null : data.name);
                        }
                      }}
                      className="cursor-pointer transition-all duration-300 hover:opacity-80"
                      maxBarSize={40}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={selectedMonth === entry.name ? (chartMode === 'livros' ? '#f59e0b' : '#3b82f6') : (selectedMonth ? '#171717' : (chartMode === 'livros' ? '#f59e0b' : '#3b82f6'))} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Top Books List - Ranking Polish */}
           <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group/toplist">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover/toplist:opacity-[0.05] transition-opacity">
                <Star size={150} className="text-neutral-100" />
              </div>

              <div className="flex items-center justify-between mb-10 relative z-10 px-2">
                 <div className="flex items-center gap-3">
                   <TrendingUp className="text-rose-500" size={22} />
                   <h3 className="text-xl font-serif font-bold text-neutral-100 italic">Olimpo Literário</h3>
                 </div>
                 <Link to="/livros?sort=nota" className="text-[10px] font-black text-neutral-600 hover:text-rose-500 transition-colors uppercase tracking-widest">
                    Ranking
                 </Link>
              </div>

              <div className="space-y-3 relative z-10">
                {stats.topLivros.map((livro, index) => (
                  <Link key={livro.id} to={`/livro/${livro.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-950/20 border border-neutral-800/20 hover:border-rose-500/30 hover:bg-neutral-950/40 transition-all group/topitem shadow-sm">
                    <div className="w-9 h-9 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center font-black text-rose-500 text-xs shadow-inner group-hover/topitem:border-rose-500/40 transition-colors">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-200 truncate group-hover/topitem:text-rose-500 transition-colors tracking-tight">{livro.titulo}</p>
                      <p className="text-[10px] text-neutral-500 truncate font-serif italic">{livro.autor}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-black text-[11px] bg-neutral-950 px-3 py-1.5 rounded-full border border-neutral-800/40 group-hover/topitem:border-amber-500/30 transition-colors">
                      <Star size={12} fill="currentColor" />
                      {livro.notaGeral.toFixed(1)}
                    </div>
                  </Link>
                ))}
                {stats.topLivros.length === 0 && (
                   <div className="py-16 flex flex-col items-center justify-center border border-dashed border-neutral-800/50 rounded-[2rem] bg-neutral-950/10">
                      <Star size={32} className="text-neutral-900 mb-3" />
                      <p className="text-xs text-neutral-700 font-serif italic text-center">Inicie sua jornada para<br/>ranquear suas obras favoritas.</p>
                   </div>
                )}
              </div>
           </div>
        </div>

        {/* Volume Insights - Final Alignment */}
        <div className="bg-neutral-950/40 border border-neutral-800/50 rounded-[2.5rem] p-10 shadow-inner relative overflow-hidden group/volume">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover/volume:opacity-[0.05] transition-opacity">
             <Sparkles size={120} className="text-neutral-100" />
          </div>
          
          <div className="flex items-center gap-3 mb-10 relative z-10 px-2">
             <Sparkles className="text-amber-500/40" size={20} />
             <h3 className="text-xl font-serif font-bold text-neutral-400 italic">Volume & Curiosidade</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-10 relative z-10">
             <div className="space-y-2 group/vitem">
                <p className="text-[8px] font-black text-neutral-700 uppercase tracking-widest group-hover/vitem:text-amber-500/60 transition-colors">Jornada Vitalícia</p>
                <p className="text-base text-neutral-300 font-serif italic leading-relaxed"><span className="text-amber-500 font-black not-italic">{formatPages(stats.totalPaginas)}</span> páginas percorridas em sua vida literária registrada.</p>
             </div>
             <div className="space-y-2 group/vitem">
                <p className="text-[8px] font-black text-neutral-700 uppercase tracking-widest group-hover/vitem:text-amber-500/60 transition-colors">Ápice Histórico</p>
                <p className="text-base text-neutral-300 font-serif italic leading-relaxed"><span className="text-amber-500 font-black not-italic">{stats.mesMaisPaginas?.fullName || 'N/A'}</span> foi onde seu ritmo atingiu o ponto mais alto até hoje.</p>
             </div>
             <div className="space-y-2 group/vitem">
                <p className="text-[8px] font-black text-neutral-700 uppercase tracking-widest group-hover/vitem:text-amber-500/60 transition-colors">Extensão Máxima</p>
                <p className="text-base text-neutral-300 font-serif italic leading-relaxed">"{stats.maiorLivro?.titulo.slice(0, 20) || '...'}" foi sua obra de maior <span className="text-amber-500 font-black not-italic">envergadura física</span>.</p>
             </div>
             <div className="space-y-2 group/vitem">
                <p className="text-[8px] font-black text-neutral-700 uppercase tracking-widest group-hover/vitem:text-amber-500/60 transition-colors">Frequência Recente</p>
                <p className="text-base text-neutral-300 font-serif italic leading-relaxed">Você manteve <span className="text-amber-500 font-black not-italic">{stats.sessionsThisWeek.length}</span> sessões de foco ininterrupto nos últimos 7 dias.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Selected Month Books */}
      <AnimatePresence>
        {selectedMonthData && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl relative">
              <button 
                onClick={() => setSelectedMonth(null)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-serif font-semibold mb-6 flex items-center gap-2">
                <BookOpen className="text-amber-500" size={24} />
                Livros lidos em {selectedMonthData.fullName}
              </h2>
              
              {selectedMonthData.livros.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {selectedMonthData.livros.map(livro => (
                    <div key={livro.id} className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800">
                      {livro.coverUrl ? (
                        <img 
                          src={livro.coverUrl} 
                          alt={livro.titulo} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center border border-neutral-700">
                          <Book className="text-neutral-600 mb-2" size={32} />
                          <span className="text-xs font-medium text-neutral-400 line-clamp-3">{livro.titulo}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                        <p className="text-sm font-bold text-white line-clamp-2">{livro.titulo}</p>
                        <p className="text-xs text-neutral-300 line-clamp-1">{livro.autor}</p>
                        <div className="flex items-center gap-1 text-amber-500 mt-1">
                          <Star size={12} fill="currentColor" />
                          <span className="text-xs font-bold">{livro.notaGeral.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-8">Nenhum livro registrado como lido neste mês.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const StatCard = ({ icon: Icon, label, value, subValue, color, bg }: any) => (
  <div className="bg-neutral-900/20 border border-neutral-800/40 rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-between hover:border-neutral-700/60 hover:bg-neutral-900/40 transition-all duration-700 group/stats h-full relative overflow-hidden">
    <div className="absolute top-0 right-0 p-12 opacity-[0.015] group-hover/stats:opacity-[0.04] transition-opacity duration-1000 pointer-events-none">
       <Icon size={120} />
    </div>
    <div className="flex items-center justify-between mb-12 relative z-10">
      <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.25em] group-hover/stats:text-neutral-400 transition-colors uppercase leading-none">{label}</p>
      <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center shadow-inner group-hover/stats:scale-110 group-hover/stats:rotate-3 transition-all duration-700`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
    <div className="min-w-0 relative z-10">
      <h3 className="text-5xl font-black text-neutral-100 truncate italic tracking-tighter leading-none mb-4 group-hover/stats:text-amber-500 transition-colors duration-700">{value}</h3>
      {subValue ? (
        <p className="text-xs text-neutral-600 font-serif italic truncate group-hover/stats:text-neutral-400 transition-colors uppercase tracking-widest">{subValue}</p>
      ) : (
        <div className="h-[12px] w-12 bg-neutral-800/30 rounded-full" />
      )}
    </div>
  </div>
);
