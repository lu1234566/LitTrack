import React, { useMemo, useState } from 'react';
import { useBooks } from '../context/BookContext';
import { Book, Star, TrendingUp, Award, BookOpen, Calendar, Sparkles, X, Target, FileText, ChevronRight, History, RefreshCw, Plus, Clock, Filter, ArrowUpRight, ArrowDownRight, BookmarkPlus } from 'lucide-react';
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
  const { books, loading, userGoal, sessions } = useBooks();
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
      <header className="relative py-12 px-8 rounded-[3.5rem] bg-gradient-to-br from-neutral-900 via-neutral-900/60 to-transparent border border-neutral-800 overflow-hidden mb-12">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <BookOpen size={220} className="text-neutral-100" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
             <h1 className="text-6xl font-serif font-black text-neutral-100 tracking-tighter">Readora</h1>
             <p className="text-neutral-400 text-lg font-serif italic max-w-xl leading-relaxed">
               Sua curadoria literária pessoal. Transformando cada página em um rastro de sabedoria.
             </p>
             
             <div className="flex flex-wrap gap-3 pt-6">
                <button 
                  onClick={() => setShowSessionModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95"
                >
                  <Clock size={16} />
                  Registrar Sessão
                </button>
                <Link 
                  to="/adicionar" 
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95"
                >
                  <Plus size={16} />
                  Nova Leitura
                </Link>
                <div className="flex bg-neutral-950/40 p-1 rounded-2xl border border-neutral-800/50 backdrop-blur-sm">
                   <Link to="/comparativo-anual" className="p-3 text-neutral-500 hover:text-amber-500 transition-colors" title="Comparativo">
                     <History size={18} />
                   </Link>
                   <Link to="/retrospectiva" className="p-3 text-neutral-500 hover:text-amber-500 transition-colors" title="Retrospectiva">
                     <History size={18} />
                   </Link>
                </div>
             </div>
          </div>

          {/* Compact Overview Row - Balanced */}
          <div className="grid grid-cols-2 gap-3 lg:w-[400px]">
             <div className="bg-neutral-950/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl p-4 flex flex-col justify-center">
                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">Livros</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-neutral-100 tracking-tighter">{stats.totalLidosEsteAno}</span>
                  <span className="text-[10px] text-neutral-600 font-bold italic">ano</span>
                </div>
             </div>
             <div className="bg-neutral-950/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl p-4 flex flex-col justify-center">
                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">Páginas</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-neutral-100 tracking-tighter">{formatPagesShort(stats.paginasLidasEsteAno)}</span>
                </div>
             </div>
             <div className="bg-neutral-950/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl p-4 flex flex-col justify-center">
                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">Média</p>
                <div className="flex items-baseline gap-2">
                   <span className="text-2xl font-black text-rose-500 tracking-tighter">{stats.mediaGeral.toFixed(1)}</span>
                </div>
             </div>
             <div className="bg-neutral-950/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl p-4 flex flex-col justify-center">
                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">Streak</p>
                <div className="flex items-baseline gap-2">
                   <span className="text-2xl font-black text-amber-500 tracking-tighter">
                     {sessions.length > 0 ? analysisService.calculateStreak(sessions) : 0}
                   </span>
                   <span className="text-[10px] text-neutral-600 font-bold italic">dias</span>
                </div>
             </div>
          </div>
        </div>
      </header>

      <section className="space-y-12">
        <div className="flex items-center gap-3 px-2">
           <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
           <h2 className="text-3xl font-serif font-black text-neutral-100 tracking-tight italic">Momento de Leitura</h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Row 1: Lendo Agora + Meta */}
            <div className="xl:col-span-8">
               {stats.lendoAgora.length > 0 ? (
                  <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group/readnow h-full">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/readnow:opacity-10 transition-opacity">
                       <RefreshCw size={120} className="text-neutral-100 animate-spin-slow" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-neutral-100 italic">Lendo Agora</h3>
                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Sua imersão atual</p>
                      </div>
                      <Link to="/livros?status=lendo" className="text-[10px] font-black text-neutral-600 hover:text-amber-500 transition-colors uppercase tracking-widest">
                        Gerenciar todos ({stats.lendoAgora.length})
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                      {stats.maisAvancado && (
                        <Link 
                          to={`/livro/${stats.maisAvancado.id}`}
                          className="flex gap-6 group/maincard"
                        >
                          <div className="w-28 h-40 rounded-xl overflow-hidden bg-neutral-950 shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover/maincard:scale-105 transition-transform duration-500 border border-neutral-800">
                            {stats.maisAvancado.coverUrl ? (
                              <img src={stats.maisAvancado.coverUrl} alt={stats.maisAvancado.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen size={24} className="text-neutral-800" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-center py-2 min-w-0">
                            <h4 className="text-xl font-bold text-neutral-100 line-clamp-2 leading-tight mb-2 group-hover/maincard:text-amber-500 transition-colors tracking-tight">
                              {stats.maisAvancado.titulo}
                            </h4>
                            <p className="text-sm text-neutral-500 font-serif italic mb-6 truncate">{stats.maisAvancado.autor}</p>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                <span className="text-emerald-500">{stats.maisAvancado.progressPercentage || 0}% CONCLUÍDO</span>
                                <span>
                                  {stats.maisAvancado.currentPage || 0} / {(stats.maisAvancado.totalPages || stats.maisAvancado.pageCount) || '—'}
                                </span>
                              </div>
                              <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/50">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${stats.maisAvancado.progressPercentage || 0}%` }}
                                  className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                />
                              </div>
                            </div>
                          </div>
                        </Link>
                      )}

                      <div className="space-y-4">
                        {stats.lendoAgora.filter(b => b.id !== stats.maisAvancado?.id).slice(0, 2).map(book => (
                          <Link 
                            key={book.id} 
                            to={`/livro/${book.id}`}
                            className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-neutral-950/20 border border-neutral-800/30 hover:bg-neutral-950/40 hover:border-emerald-500/30 transition-all group/subcard"
                          >
                            <div className="w-12 h-16 rounded-lg overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800">
                              {book.coverUrl ? (
                                <img src={book.coverUrl} alt={book.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen size={12} className="text-neutral-800" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-bold text-neutral-300 truncate group-hover/subcard:text-emerald-500 transition-colors leading-tight">{book.titulo}</h5>
                              <div className="mt-2 flex items-center gap-3">
                                <div className="flex-1 h-1 bg-neutral-950 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${book.progressPercentage || 0}%` }} />
                                </div>
                                <span className="text-[10px] font-black text-neutral-600">{book.progressPercentage || 0}%</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
               ) : (
                  <div className="bg-neutral-900/40 border border-dashed border-neutral-800 rounded-[2.5rem] p-12 text-center h-full flex flex-col items-center justify-center">
                     <BookOpen size={40} className="mx-auto text-neutral-800 mb-4" />
                     <h3 className="text-xl font-serif font-bold text-neutral-400 italic">Nenhum mergulho ativo</h3>
                     <p className="text-xs text-neutral-600 mt-2 font-serif italic">Que tal começar uma nova história hoje?</p>
                     <Link to="/adicionar" className="inline-block mt-6 px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors">Iniciar Leitura</Link>
                  </div>
               )}
            </div>

            <div className="xl:col-span-4">
               {/* Goal Card - Solid and compact */}
               <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[2.5rem] p-8 shadow-xl h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-neutral-100 italic">Meta de {currentYear}</h3>
                      <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Horizonte literário</p>
                    </div>
                    <Target className="text-amber-500/30" size={24} />
                  </div>

                  {!userGoal ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-8 text-center space-y-4">
                      <p className="text-xs text-neutral-600 font-serif italic leading-relaxed">Seu horizonte ainda não foi definido para este ciclo.</p>
                      <Link to="/configuracoes" className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:underline">Configurar Agora</Link>
                    </div>
                  ) : (
                    <div className="space-y-8 flex-1 flex flex-col justify-center">
                       {safeParseNumber(userGoal.booksGoal) > 0 && (
                          <div className="space-y-3">
                             <div className="flex justify-between items-baseline">
                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Livros</p>
                                <span className="text-lg font-black text-neutral-100 italic">{stats.totalLidosEsteAno} / {userGoal.booksGoal}</span>
                             </div>
                             <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/50">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (stats.totalLidosEsteAno / safeParseNumber(userGoal.booksGoal)) * 100)}%` }}
                                  className="h-full bg-amber-500 rounded-full"
                                />
                             </div>
                          </div>
                       )}

                       {safeParseNumber(userGoal.pagesGoal) > 0 && (
                          <div className="space-y-3">
                             <div className="flex justify-between items-baseline">
                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Páginas</p>
                                <span className="text-lg font-black text-neutral-100 italic">{formatPagesShort(stats.paginasLidasEsteAno)} / {formatPagesShort(safeParseNumber(userGoal.pagesGoal))}</span>
                             </div>
                             <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/50">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (stats.paginasLidasEsteAno / safeParseNumber(userGoal.pagesGoal)) * 100)}%` }}
                                  className="h-full bg-blue-500 rounded-full"
                                />
                             </div>
                          </div>
                       )}

                       {insights && (
                          <div className="mt-4 p-4 bg-neutral-950/40 rounded-2xl border border-neutral-800/50">
                             <p className="text-[10px] text-neutral-400 font-serif italic leading-relaxed text-center">
                               {insights.message}
                             </p>
                          </div>
                       )}
                    </div>
                  )}
               </div>
            </div>

            {/* Row 2: Companion + Ritmo semanal */}
            <div className="xl:col-span-8">
               <ReadingCompanion 
                  books={books} 
                  sessions={sessions} 
                  onLogAction={() => setShowSessionModal(true)} 
               />
            </div>

            <div className="xl:col-span-4">
               <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[2.5rem] p-8 shadow-xl h-full flex flex-col justify-center gap-6">
                  <div className="flex items-center gap-4">
                     <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl shadow-inner shrink-0">
                       <TrendingUp size={28} />
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Ritmo Semanal</p>
                       <h4 className="text-3xl font-black text-neutral-100 tracking-tighter italic">{formatPagesShort(stats.pagesThisWeek)}</h4>
                       <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">{stats.sessionsThisWeek.length} sessões</p>
                     </div>
                  </div>
                  <StreakCard sessions={sessions} />
               </div>
            </div>
        </div>

        {/* Heatmap Section - Proportional */}
        <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[2.5rem] p-8 shadow-xl overflow-hidden relative group/heatmap">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/heatmap:opacity-[0.06] transition-opacity">
             <Calendar size={120} className="text-neutral-100" />
          </div>
          <div className="flex items-center justify-between mb-8 relative z-10 px-2">
             <div className="flex items-center gap-3">
               <Calendar className="text-emerald-500" size={22} />
               <h3 className="text-xl font-serif font-bold text-neutral-100 italic">Hábito de Leitura</h3>
             </div>
             <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">Atividade nos últimos meses</p>
          </div>
          <div className="relative z-10 overflow-x-auto custom-scrollbar-hide flex justify-center">
            <div className="min-w-max scale-[0.98] lg:scale-100 origin-center py-2">
              <ReadingHeatmap sessions={sessions} />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-12 pt-12">
        <div className="flex items-center gap-3 px-2">
           <div className="w-1.5 h-8 bg-purple-500 rounded-full" />
           <h2 className="text-3xl font-serif font-black text-neutral-100 tracking-tight italic">Descoberta & Curadoria</h2>
        </div>

        {/* Atmosferas Literárias */}
        {stats.moodShelves.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Sparkles className="text-purple-500" size={24} />
                <h3 className="text-xl font-serif font-bold text-neutral-100 italic">Atmosferas Literárias</h3>
              </div>
              <Link to="/livros" className="text-xs font-black text-neutral-600 hover:text-purple-500 transition-colors uppercase tracking-widest flex items-center gap-1 group">
                Explorar mais
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-8 pt-2 custom-scrollbar-hide scroll-smooth">
              {stats.moodShelves.slice(0, 4).map((shelf) => (
                <div 
                  key={shelf.mood} 
                  className="flex-shrink-0 w-64 bg-neutral-900/40 border border-neutral-800/60 rounded-[2rem] p-6 hover:border-purple-500/30 transition-all flex flex-col gap-6 shadow-xl group/shelf"
                >
                  <div className="flex items-center justify-between">
                     <h4 className="text-base font-serif font-bold text-neutral-300 capitalize italic group-hover/shelf:text-purple-400 transition-colors tracking-tight">{shelf.mood}</h4>
                     <span className="text-[8px] bg-neutral-950 text-neutral-600 font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-neutral-800/50">
                       {shelf.books.length}
                     </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {shelf.books.slice(0, 3).map((book) => (
                      <Link 
                        key={book.id} 
                        to={`/livro/${book.id}`}
                        className="aspect-[2/3] rounded-lg overflow-hidden border border-neutral-800/50 group/book relative transition-all hover:scale-110 hover:z-10 shadow-md"
                        title={book.titulo}
                      >
                        {book.coverUrl ? (
                           <img src={book.coverUrl} alt={book.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-neutral-950 flex items-center justify-center">
                             <BookOpen size={14} className="text-neutral-800" />
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Fila de Leitura */}
           {stats.queroLerCount > 0 && (
             <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group/queue">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/queue:opacity-10 transition-opacity">
                 <BookmarkPlus size={120} className="text-neutral-100" />
               </div>
               
               <div className="flex items-center justify-between mb-8 relative z-10">
                 <div className="flex items-center gap-3">
                   <BookmarkPlus className="text-blue-500" size={24} />
                   <h3 className="text-xl font-serif font-bold text-neutral-100 italic">Fila de Leitura</h3>
                 </div>
                 <Link to="/livros?status=quero+ler" className="text-xs font-black text-neutral-600 hover:text-blue-500 transition-colors uppercase tracking-widest">
                    Ver tudo ({stats.queroLerCount})
                 </Link>
               </div>

               <div className="space-y-4 relative z-10">
                 {stats.nextRead && (
                   <Link 
                     to={`/livro/${stats.nextRead.id}`}
                     className="bg-neutral-950/40 border border-neutral-800/50 rounded-2xl p-4 flex gap-6 hover:border-blue-500/30 transition-all group/next"
                   >
                     <div className="w-16 h-24 rounded-xl overflow-hidden bg-neutral-950 shrink-0 shadow-xl border border-neutral-800 group-hover/next:scale-105 transition-transform duration-500">
                       {stats.nextRead.coverUrl ? (
                         <img src={stats.nextRead.coverUrl} alt={stats.nextRead.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                           <BookOpen size={20} className="text-neutral-800" />
                         </div>
                       )}
                     </div>
                     <div className="flex-1 flex flex-col justify-center min-w-0">
                       <span className="text-[9px] uppercase tracking-widest text-blue-500 font-black mb-1 block">Sugestão de Próxima Leitura</span>
                       <h4 className="text-base font-bold text-neutral-100 line-clamp-1 mb-0.5 group-hover/next:text-blue-500 transition-colors tracking-tight">{stats.nextRead.titulo}</h4>
                       <p className="text-xs text-neutral-500 font-serif italic mb-3">{stats.nextRead.autor}</p>
                       <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex self-start ${
                          stats.nextRead.priority === 'high' ? 'bg-rose-500/10 text-rose-500' :
                          stats.nextRead.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {stats.nextRead.priority === 'high' ? 'Prioritário' : 'Normal'}
                       </div>
                     </div>
                   </Link>
                 )}
               </div>
             </div>
           )}

           {/* Timeline Monthly Preview - Editorial Style */}
           <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group/timeline">
             <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover/timeline:opacity-[0.05] transition-opacity">
               <History size={150} className="text-neutral-100" />
             </div>

             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-4">
               <div>
                 <div className="flex items-center gap-3">
                   <Award className="text-amber-500" size={22} />
                   <h3 className="text-xl font-serif font-bold text-neutral-100 italic">Conquistas de {currentMonthName}</h3>
                 </div>
                 <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mt-1">Marcos literários do mês</p>
               </div>
               <Link to="/linha-do-tempo" className="text-[10px] font-black text-neutral-500 hover:text-amber-500 transition-colors uppercase tracking-widest flex items-center gap-1 group/link">
                  Linha do Tempo
                  <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
               </Link>
             </div>

             <div className="flex flex-wrap gap-5 relative z-10">
                {stats.lidosEsteMes.length > 0 ? (
                  stats.lidosEsteMes.slice(0, 4).map(book => (
                    <Link 
                      key={book.id} 
                      to={`/livro/${book.id}`}
                      className="group/titem relative"
                    >
                      <div className="w-24 h-32 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-[0_15px_30px_rgba(0,0,0,0.4)] transition-all group-hover/titem:-translate-y-2 group-hover/titem:border-amber-500/50 group-hover/titem:shadow-amber-500/10">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen size={20} className="text-neutral-800" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/titem:opacity-100 transition-opacity flex items-end p-2.5">
                           <div className="flex items-center gap-1 text-amber-500">
                             <Star size={10} fill="currentColor" />
                             <span className="text-[10px] font-black">{book.notaGeral.toFixed(1)}</span>
                           </div>
                        </div>
                      </div>
                      <p className="mt-3 text-[10px] font-bold text-neutral-500 truncate max-w-[96px] group-hover/titem:text-neutral-300 transition-colors tracking-tight">{book.titulo}</p>
                    </Link>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 border border-dashed border-neutral-800/60 rounded-[2rem] bg-neutral-950/20">
                     <p className="text-xs text-neutral-700 font-serif italic">Nenhuma obra concluída este mês.</p>
                     <Link to="/livros" className="mt-2 text-[9px] font-black text-neutral-600 uppercase tracking-widest hover:text-amber-500 transition-colors">Ver Estante</Link>
                  </div>
                )}
                {stats.lidosEsteMes.length > 4 && (
                  <Link to="/linha-do-tempo" className="w-24 h-32 rounded-xl border border-dashed border-neutral-800/80 bg-neutral-950/20 flex flex-col items-center justify-center gap-1 hover:border-amber-500/50 transition-all group/morebox shadow-inner">
                     <span className="text-xl font-black text-neutral-600 group-hover/morebox:text-amber-500 transition-colors tracking-tighter">+{stats.lidosEsteMes.length - 4}</span>
                     <span className="text-[8px] font-black uppercase text-neutral-700">Explorar</span>
                  </Link>
                )}
             </div>
           </div>
        </div>
      </section>

      <section className="space-y-12 pt-12">
        <div className="flex items-center gap-3 px-2">
           <div className="w-1.5 h-8 bg-neutral-700 rounded-full" />
           <h2 className="text-3xl font-serif font-black text-neutral-100 tracking-tight italic">Profundidade Analítica</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Star} label="Média de Notas" value={stats.mediaGeral > 0 ? stats.mediaGeral.toFixed(1) : '—'} color="text-rose-500" bg="bg-rose-500/10" />
          <StatCard icon={TrendingUp} label="Autor Preferido" value={stats.autorMaisLido || 'A definir'} color="text-violet-500" bg="bg-violet-500/10" truncate />
          <StatCard icon={Clock} label="Ritmo Médio" value={stats.mediaDiasParaConcluir > 0 ? `${stats.mediaDiasParaConcluir}d` : 'Construindo'} subValue="por livro" color="text-amber-500" bg="bg-amber-500/10" />
          <StatCard icon={Award} label="Maior Obra" value={stats.maiorLivro ? formatPagesShort(safeParseNumber(stats.maiorLivro.pageCount)) : '—'} subValue={stats.maiorLivro?.titulo} color="text-blue-500" bg="bg-blue-500/10" truncate />
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
  <div className="bg-neutral-900/50 border border-neutral-800/60 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between hover:border-neutral-700 transition-colors group/stats">
    <div className="flex items-center justify-between mb-6">
      <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest group-hover/stats:text-neutral-400 transition-colors">{label}</p>
      <div className={`p-2.5 rounded-xl ${bg} ${color} shadow-inner group-hover/stats:scale-110 transition-transform`}>
        <Icon size={18} />
      </div>
    </div>
    <div className="min-w-0">
      <h3 className="text-2xl font-black text-neutral-100 truncate italic tracking-tighter leading-none mb-1">{value}</h3>
      {subValue && <p className="text-[10px] text-neutral-600 font-serif italic truncate group-hover/stats:text-neutral-500 transition-colors">{subValue}</p>}
    </div>
  </div>
);
