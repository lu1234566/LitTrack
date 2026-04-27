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

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

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

    return { 
      totalLidos, 
      mediaGeral, 
      melhorLivro, 
      autorMaisLido, 
      generoMaisLido, 
      leiturasPorMes, 
      topLivros, 
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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight">Dashboard {currentYear}</h1>
          <p className="text-neutral-400 mt-2 text-lg">Seu ano literário em números.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setShowSessionModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Clock size={20} />
            Registrar Sessão
          </button>
          <Link 
            to="/adicionar" 
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Nova Leitura
          </Link>
          <Link 
            to="/comparativo-anual" 
            className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <History size={20} />
            Comparativo
          </Link>
          <Link 
            to="/retrospectiva" 
            className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            Retrospectiva
          </Link>
        </div>
      </header>

      <ReadingSessionModal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} />

      <ReadingCompanion 
        books={books} 
        sessions={sessions} 
        onLogAction={() => setShowSessionModal(true)} 
      />

      {/* Goals Widget */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-semibold text-neutral-100 flex items-center gap-3">
            <Target className="text-amber-500" size={28} />
            Meta Anual {currentYear}
          </h2>
          {insights && (
            <span className="text-sm text-neutral-500 font-medium bg-neutral-800 px-4 py-1.5 rounded-full">
              Faltam {insights.diffDays} dias para o fim do ano
            </span>
          )}
        </div>

        {!userGoal ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-600">
              <Target size={40} />
            </div>
            <div>
              <h3 className="text-xl font-medium text-neutral-200">Você ainda não definiu sua meta anual.</h3>
              <p className="text-neutral-500 mt-2">Defina metas de livros e páginas para acompanhar seu progresso.</p>
            </div>
            <Link 
              to="/configuracoes" 
              className="bg-amber-500 hover:bg-amber-600 text-neutral-950 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              Definir meta agora
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Books Progress */}
              <div className="space-y-4">
                {safeParseNumber(userGoal.booksGoal) > 0 ? (
                  <>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                          <BookOpen size={16} className="text-amber-500" />
                          Livros Lidos
                        </p>
                        <h4 className="text-3xl font-bold text-neutral-100">
                          {stats.totalLidosEsteAno} <span className="text-neutral-600 text-xl font-medium">/ {userGoal.booksGoal}</span>
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-500">
                          {userGoal.booksGoal > 0 ? Math.min(100, Math.round((stats.totalLidosEsteAno / userGoal.booksGoal) * 100)) : 0}%
                        </p>
                        <p className="text-xs text-neutral-500">concluído</p>
                      </div>
                    </div>
                    <div className="relative h-4 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${userGoal.booksGoal > 0 ? Math.min(100, (stats.totalLidosEsteAno / userGoal.booksGoal) * 100) : 0}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute h-full rounded-full ${stats.totalLidosEsteAno >= (userGoal.booksGoal || 0) && (userGoal.booksGoal || 0) > 0 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'}`}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-neutral-500">
                        {stats.totalLidosEsteAno >= (userGoal.booksGoal || 0) && (userGoal.booksGoal || 0) > 0 ? 'Meta alcançada!' : `Faltam ${Math.max(0, (userGoal.booksGoal || 0) - stats.totalLidosEsteAno)} livros`}
                      </span>
                      <span className="text-neutral-400">Objetivo: {userGoal.booksGoal}</span>
                    </div>
                  </>
                ) : (
                  <div className="bg-neutral-950/20 border border-dashed border-neutral-800 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-neutral-500 mb-2">Meta de livros não definida.</p>
                    <Link to="/configuracoes" className="text-xs font-bold text-amber-500 hover:underline">Configurar Meta</Link>
                  </div>
                )}
              </div>

              {/* Pages Progress */}
              <div className="space-y-4">
                {safeParseNumber(userGoal.pagesGoal) > 0 ? (
                  <>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                          <FileText size={16} className="text-blue-500" />
                          Páginas Lidas
                        </p>
                        <h4 className="text-3xl font-bold text-neutral-100">
                          {formatPages(stats.paginasLidasEsteAno)} <span className="text-neutral-600 text-xl font-medium">/ {formatPages(userGoal.pagesGoal)}</span>
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-500">
                          {userGoal.pagesGoal > 0 ? Math.min(100, Math.round((stats.paginasLidasEsteAno / userGoal.pagesGoal) * 100)) : 0}%
                        </p>
                        <p className="text-xs text-neutral-500">concluído</p>
                      </div>
                    </div>
                    <div className="relative h-4 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${userGoal.pagesGoal > 0 ? Math.min(100, (stats.paginasLidasEsteAno / userGoal.pagesGoal) * 100) : 0}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute h-full rounded-full ${stats.paginasLidasEsteAno >= (userGoal.pagesGoal || 0) && (userGoal.pagesGoal || 0) > 0 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]'}`}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-neutral-500">
                        {stats.paginasLidasEsteAno >= (userGoal.pagesGoal || 0) && (userGoal.pagesGoal || 0) > 0 ? 'Meta alcançada!' : `Faltam ${formatPagesLong(Math.max(0, (userGoal.pagesGoal || 0) - stats.paginasLidasEsteAno))}`}
                      </span>
                      <span className="text-neutral-400">Objetivo: {formatPages(userGoal.pagesGoal)}</span>
                    </div>
                  </>
                ) : (
                  <div className="bg-neutral-950/20 border border-dashed border-neutral-800 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-neutral-500 mb-2">Meta de páginas não definida.</p>
                    <Link to="/configuracoes" className="text-xs font-bold text-amber-500 hover:underline">Configurar Meta</Link>
                  </div>
                )}
              </div>
            </div>

            {insights && (
              <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-2xl p-6 flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h5 className="text-neutral-200 font-bold mb-1">Insights de Ritmo</h5>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {insights.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <StreakCard sessions={sessions} />

      {/* Performance Section - Momento de Leitura */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
               <TrendingUp size={24} />
             </div>
             <div>
               <h2 className="text-2xl font-serif font-semibold text-neutral-100">Desempenho no Período</h2>
               <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Acompanhe sua evolução</p>
             </div>
          </div>
          
          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start">
            {[
              { id: 'this_month', label: 'Mês Atual' },
              { id: 'last_30_days', label: '30 Dias' },
              { id: 'this_quarter', label: 'Trimestre' },
              { id: 'this_year', label: 'Ano' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setStatsPeriod(p.id as StatsPeriod)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statsPeriod === p.id ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {periodData && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="p-6 bg-neutral-950/40 rounded-2xl border border-neutral-800/50 space-y-1">
                 <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Livros Concluídos</p>
                 <h4 className="text-3xl font-bold text-neutral-100">{periodData.current.booksFinished}</h4>
               </div>
               <div className="p-6 bg-neutral-950/40 rounded-2xl border border-neutral-800/50 space-y-1">
                 <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Páginas Lidas</p>
                 <h4 className="text-3xl font-bold text-neutral-100">{formatPagesShort(periodData.current.pagesRead)}</h4>
               </div>
               <div className="p-6 bg-neutral-950/40 rounded-2xl border border-neutral-800/50 space-y-1">
                 <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Dias Ativos</p>
                 <h4 className="text-3xl font-bold text-neutral-100">{periodData.current.activeReadingDays}</h4>
               </div>
               <div className="p-6 bg-neutral-950/40 rounded-2xl border border-neutral-800/50 space-y-1">
                 <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Nota Média</p>
                 <h4 className="text-3xl font-bold text-neutral-100">{periodData.current.averageRating.toFixed(1)}</h4>
               </div>
            </div>

            <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-2xl p-6">
               <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl shrink-0 ${periodData.comparison.isImprovement ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {periodData.comparison.isImprovement ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-neutral-200 mb-1">Visão Comparativa</h5>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {periodData.comparison.bookMsg} {periodData.comparison.pageMsg}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap de Leitura */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-semibold text-neutral-100 flex items-center gap-3">
            <Calendar className="text-emerald-500" size={28} />
            Consistência de Leitura
          </h2>
          <div className="text-right">
            <p className="text-sm text-neutral-400 font-medium">{currentYear}</p>
          </div>
        </div>
        <ReadingHeatmap sessions={sessions} />
      </div>

      {/* Lendo Agora */}
      <AnimatePresence>
        {stats.lendoAgora.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-semibold text-neutral-100 flex items-center gap-3">
                <RefreshCw className="text-emerald-500 animate-spin-slow" size={28} />
                Lendo Agora
              </h2>
              <span className="text-sm text-neutral-500 font-medium bg-neutral-800 px-4 py-1.5 rounded-full">
                {stats.lendoAgora.length} {stats.lendoAgora.length === 1 ? 'livro' : 'livros'} em progresso
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Mais Avançado / Destaque */}
              {stats.maisAvancado && (
                <Link 
                  to={`/livro/${stats.maisAvancado.id}`}
                  className="bg-neutral-950/50 border border-neutral-800/50 rounded-2xl p-6 flex gap-6 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="w-24 h-36 rounded-xl overflow-hidden bg-neutral-800 shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500 border border-neutral-800">
                    {stats.maisAvancado.coverUrl ? (
                      <img src={stats.maisAvancado.coverUrl} alt={stats.maisAvancado.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={24} className="text-neutral-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-black mb-1 block">Mais Avançado</span>
                      <h4 className="text-xl font-bold text-neutral-100 line-clamp-1 mb-1">{stats.maisAvancado.titulo}</h4>
                      <p className="text-sm text-neutral-400">{stats.maisAvancado.autor}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-end text-xs font-bold text-neutral-500">
                        <span className="text-neutral-200">{stats.maisAvancado.progressPercentage}% concluído</span>
                        <span>{stats.maisAvancado.currentPage} / {stats.maisAvancado.totalPages || stats.maisAvancado.pageCount}</span>
                      </div>
                      <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.maisAvancado.progressPercentage}%` }}
                          className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Lista compacta de outros livros */}
              <div className="space-y-4">
                {stats.lendoAgora.filter(b => b.id !== stats.maisAvancado?.id).slice(0, 3).map(book => (
                  <Link 
                    key={book.id} 
                    to={`/livro/${book.id}`}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-neutral-950/20 border border-neutral-800/30 hover:bg-neutral-800/20 hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-neutral-800">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen size={12} className="text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-bold text-neutral-200 truncate group-hover:text-emerald-500 transition-colors">{book.titulo}</h5>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-neutral-900 rounded-full overflow-hidden max-w-[80px]">
                          <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${book.progressPercentage}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500">{book.progressPercentage}%</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-neutral-700" />
                  </Link>
                ))}
                
                {stats.lendoAgora.length > (stats.maisAvancado ? 4 : 3) && (
                  <Link to="/livros?status=lendo" className="block text-center text-xs font-bold text-neutral-500 hover:text-emerald-500 transition-colors py-2 border border-dashed border-neutral-800 rounded-xl">
                    Ver todos os {stats.lendoAgora.length} livros lendo
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fila de Espera / Wishlist */}
      {stats.queroLerCount > 0 && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif font-semibold text-neutral-100 flex items-center gap-3">
              <BookmarkPlus className="text-blue-500" size={28} />
              Fila de Leitura
            </h2>
            <Link 
              to="/livros?status=quero+ler" 
              className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1 group"
            >
              Organizar fila completa
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Wishlist Summary Card */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-neutral-950/40 rounded-2xl border border-neutral-800/50 space-y-1">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-tight">Livros na Fila</p>
                <h4 className="text-3xl font-bold text-neutral-100">{stats.queroLerCount}</h4>
              </div>
              <div className="p-6 bg-neutral-950/40 rounded-2xl border border-neutral-800/50 space-y-1">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-tight">Alta Prioridade</p>
                <h4 className="text-3xl font-bold text-neutral-100 text-rose-500">{stats.highPriorityCount}</h4>
              </div>
            </div>

            {/* Next Read Highlight */}
            {stats.nextRead && (
              <Link 
                to={`/livro/${stats.nextRead.id}`}
                className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-4 hover:border-blue-500/40 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <BookmarkPlus size={64} className="text-blue-500" />
                </div>
                <div className="w-16 h-24 rounded-lg overflow-hidden bg-neutral-800 shrink-0 shadow-lg border border-neutral-800 group-hover:scale-105 transition-transform duration-500">
                  {stats.nextRead.coverUrl ? (
                    <img src={stats.nextRead.coverUrl} alt={stats.nextRead.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={20} className="text-neutral-700" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <span className="text-[10px] uppercase tracking-widest text-blue-500 font-black mb-1 block">Sugestão: Próxima Leitura</span>
                  <h4 className="text-base font-bold text-neutral-100 line-clamp-1 mb-0.5">{stats.nextRead.titulo}</h4>
                  <p className="text-xs text-neutral-400 truncate mb-2">{stats.nextRead.autor}</p>
                  {stats.nextRead.priority && (
                    <div className={`text-[9px] font-black uppercase tracking-tighter inline-block px-2 py-0.5 rounded border self-start ${
                      stats.nextRead.priority === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                      stats.nextRead.priority === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    }`}>
                      Prioridade {stats.nextRead.priority === 'high' ? 'Alta' : stats.nextRead.priority === 'medium' ? 'Média' : 'Baixa'}
                    </div>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Timeline Preview */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-semibold text-neutral-100 flex items-center gap-3">
            <History className="text-amber-500" size={28} />
            Linha do Tempo: {currentMonthName}
          </h2>
          <Link 
            to="/linha-do-tempo" 
            className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1 group"
          >
            Ver linha do tempo completa
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {stats.lidosEsteMes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.lidosEsteMes.slice(0, 3).map(book => (
              <Link 
                key={book.id} 
                to={`/livro/${book.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-950/30 border border-neutral-800/50 hover:border-amber-500/50 hover:bg-neutral-800/30 transition-all group"
              >
                <div className="w-16 h-24 rounded-xl overflow-hidden bg-neutral-800 shrink-0 shadow-lg">
                  {book.coverUrl ? (
                    <img 
                      src={book.coverUrl} 
                      alt={book.titulo} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={24} className="text-neutral-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-neutral-100 truncate">{book.titulo}</h4>
                  <p className="text-sm text-neutral-400 truncate">{book.autor}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-bold">{book.notaGeral.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-500">
                      <FileText size={14} />
                      <span className="text-xs">{formatPagesShort(safeParseNumber(book.pageCount))}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {stats.lidosEsteMes.length > 3 && (
              <Link 
                to="/linha-do-tempo"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-950/30 border border-dashed border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800/30 transition-all group"
              >
                <span className="text-2xl font-bold text-amber-500">+{stats.lidosEsteMes.length - 3}</span>
                <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">mais este mês</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-neutral-950/30 rounded-2xl border border-dashed border-neutral-800">
            <p className="text-neutral-500 text-sm">Nenhuma leitura concluída em {currentMonthName} ainda.</p>
            <Link to="/adicionar" className="text-amber-500 text-sm font-bold mt-2 hover:underline">Adicionar livro</Link>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard icon={BookOpen} label="Total Lidos" value={stats.totalLidos.toString()} color="text-amber-500" bg="bg-amber-500/10" />
        <StatCard icon={FileText} label="Total de Páginas" value={formatPagesLong(stats.totalPaginas)} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard icon={Clock} label="Esta Semana" value={`${stats.sessionsThisWeek.length} sessões`} subValue={`${formatPagesShort(stats.pagesThisWeek)} lidas`} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard icon={Star} label="Média Geral" value={stats.mediaGeral.toFixed(1)} color="text-rose-500" bg="bg-rose-500/10" />
        <StatCard icon={TrendingUp} label="Autor Mais" value={stats.autorMaisLido || '-'} subValue={stats.generoMaisLido ? `Gênero: ${stats.generoMaisLido}` : ''} color="text-violet-500" bg="bg-violet-500/10" />
      </div>

      {/* Page Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Média / Livro</p>
            <h3 className="text-xl font-bold text-neutral-100">{formatPagesPerBook(Math.round(stats.mediaPaginas))}</h3>
          </div>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <Award size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Maior Livro</p>
            <h3 className="text-xl font-bold text-neutral-100 truncate">{formatPagesShort(safeParseNumber(stats.maiorLivro?.pageCount))}</h3>
            <p className="text-[10px] text-neutral-500 truncate">{stats.maiorLivro?.titulo}</p>
          </div>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Mês Intenso</p>
            <h3 className="text-xl font-bold text-neutral-100">{stats.mesMaisPaginas?.fullName || '-'}</h3>
            <p className="text-[10px] text-neutral-500">{formatPagesShort(stats.mesMaisPaginas?.paginas || 0)}</p>
          </div>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <BookOpen size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Menor Livro</p>
            <h3 className="text-xl font-bold text-neutral-100 truncate">{formatPagesShort(safeParseNumber(stats.menorLivro?.pageCount))}</h3>
            <p className="text-[10px] text-neutral-500 truncate">{stats.menorLivro?.titulo}</p>
          </div>
        </div>
      </div>

      {/* Volume Insights */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
        <h2 className="text-2xl font-serif font-semibold text-neutral-100 flex items-center gap-3 mb-6">
          <Sparkles className="text-amber-500" size={28} />
          Volume de Leitura
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <p className="text-neutral-300">Você já leu um total de <span className="text-amber-500 font-bold">{formatPages(stats.totalPaginas)}</span> páginas em sua jornada.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <p className="text-neutral-300">Seu ritmo médio é de <span className="text-amber-500 font-bold">{formatPagesPerBook(Math.round(stats.mediaPaginas))}</span>.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <p className="text-neutral-300">Seu maior desafio foi <span className="text-amber-500 font-bold">"{stats.maiorLivro?.titulo}"</span> com {formatPagesLong(safeParseNumber(stats.maiorLivro?.pageCount))}.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <p className="text-neutral-300">O mês de <span className="text-amber-500 font-bold">{stats.mesMaisPaginas?.fullName}</span> foi o seu mais produtivo em volume de páginas.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <p className="text-neutral-300">A leitura mais rápida foi <span className="text-amber-500 font-bold">"{stats.menorLivro?.titulo}"</span> com apenas {formatPagesLong(safeParseNumber(stats.menorLivro?.pageCount))}.</p>
            </div>
            {stats.hasMissingPageCounts && (
              <div className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-500">Alguns livros ainda não possuem número de páginas, o que pode afetar as estatísticas de volume.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
              <Calendar className="text-amber-500" size={20} />
              {statsPeriod === 'this_year' ? 'Evolução Anual' : statsPeriod === 'this_month' ? 'Ritmo Mensal' : 'Ritmo no Período'}
            </h2>
            <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button 
                onClick={() => setChartMode('livros')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${chartMode === 'livros' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Livros
              </button>
              <button 
                onClick={() => setChartMode('paginas')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${chartMode === 'paginas' ? 'bg-blue-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Páginas
              </button>
            </div>
          </div>
          <p className="text-sm text-neutral-400 mb-6">
            {statsPeriod === 'this_year' || statsPeriod === 'this_quarter' 
              ? 'Clique em uma barra para ver os livros lidos no mês.' 
              : 'Evolução diária de páginas e livros concluídos.'}
          </p>
          <div className="h-72 w-full" style={{ minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="name" stroke="#737373" tick={{ fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#737373" tick={{ fill: '#737373' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#262626' }} 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
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
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={selectedMonth === entry.name ? (chartMode === 'livros' ? '#f59e0b' : '#3b82f6') : (selectedMonth ? '#404040' : (chartMode === 'livros' ? '#f59e0b' : '#3b82f6'))} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Books */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-serif font-semibold mb-6 flex items-center gap-2">
            <Award className="text-amber-500" size={20} />
            Top Livros
          </h2>
          <div className="space-y-4">
            {stats.topLivros.map((livro, index) => (
              <div key={livro.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-800/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-amber-500 text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-200 truncate">{livro.titulo}</p>
                  <p className="text-xs text-neutral-500 truncate">{livro.autor}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-medium text-sm">
                  <Star size={14} fill="currentColor" />
                  {livro.notaGeral.toFixed(1)}
                </div>
              </div>
            ))}
            {stats.topLivros.length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-4">Nenhum livro lido ainda.</p>
            )}
          </div>
        </div>
      </div>

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
  <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">{label}</p>
      <div className={`p-2 rounded-xl ${bg} ${color}`}>
        <Icon size={20} />
      </div>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-neutral-100 truncate">{value}</h3>
      {subValue && <p className="text-xs text-neutral-500 mt-1 truncate">{subValue}</p>}
    </div>
  </div>
);
