import React, { useMemo, useState } from 'react';
import { useBooks } from '../context/BookContext';
import { Book, Star, TrendingUp, Award, BookOpen, Calendar, Sparkles, X, Target, FileText, ChevronRight, History } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { safeParseNumber, formatPages, formatPagesShort, formatPagesPerBook, formatPagesLong } from '../lib/statsUtils';
import { Logomark } from '../components/Logomark';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const Dashboard: React.FC = () => {
  const { books, loading, userGoal } = useBooks();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'livros' | 'paginas'>('livros');

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
      totalPaginas,
      mediaPaginas,
      maiorLivro,
      menorLivro,
      mesMaisPaginas,
      hasMissingPageCounts: lidos.some(b => !b.pageCount)
    };
  }, [books, loading, currentYear, currentMonthName]);

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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const booksRemaining = Math.max(0, userGoal.booksGoal - stats.totalLidosEsteAno);
    const pagesRemaining = Math.max(0, userGoal.pagesGoal - stats.paginasLidasEsteAno);
    
    const monthsRemaining = 12 - today.getMonth();
    const booksPerMonth = (booksRemaining / monthsRemaining).toFixed(1);
    
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const expectedProgress = dayOfYear / 365;
    const actualBooksProgress = stats.totalLidosEsteAno / userGoal.booksGoal;
    
    let message = "";
    if (actualBooksProgress >= 1) {
      message = "Parabéns! Você já bateu sua meta de livros!";
    } else if (actualBooksProgress >= expectedProgress) {
      message = "Você está adiantado em relação ao esperado. Continue assim!";
    } else {
      message = `Você precisará ler cerca de ${booksPerMonth} livros por mês para alcançar sua meta.`;
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
          <Link 
            to="/retrospectiva" 
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            Retrospectiva
          </Link>
          <Link 
            to="/configuracoes" 
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-105"
          >
            <Target size={20} />
            Ajustar Metas
          </Link>
        </div>
      </header>

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
                      {Math.min(100, Math.round((stats.totalLidosEsteAno / userGoal.booksGoal) * 100))}%
                    </p>
                    <p className="text-xs text-neutral-500">concluído</p>
                  </div>
                </div>
                <div className="relative h-4 bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (stats.totalLidosEsteAno / userGoal.booksGoal) * 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`absolute h-full rounded-full ${stats.totalLidosEsteAno >= userGoal.booksGoal ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'}`}
                  />
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-neutral-500">
                    {stats.totalLidosEsteAno >= userGoal.booksGoal ? 'Meta alcançada!' : `Faltam ${userGoal.booksGoal - stats.totalLidosEsteAno} livros`}
                  </span>
                  <span className="text-neutral-400">Objetivo: {userGoal.booksGoal}</span>
                </div>
              </div>

              {/* Pages Progress */}
              <div className="space-y-4">
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
                      {Math.min(100, Math.round((stats.paginasLidasEsteAno / userGoal.pagesGoal) * 100))}%
                    </p>
                    <p className="text-xs text-neutral-500">concluído</p>
                  </div>
                </div>
                <div className="relative h-4 bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (stats.paginasLidasEsteAno / userGoal.pagesGoal) * 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`absolute h-full rounded-full ${stats.paginasLidasEsteAno >= userGoal.pagesGoal ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]'}`}
                  />
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-neutral-500">
                    {stats.paginasLidasEsteAno >= userGoal.pagesGoal ? 'Meta alcançada!' : `Faltam ${formatPages(userGoal.pagesGoal - stats.paginasLidasEsteAno)} páginas`}
                  </span>
                  <span className="text-neutral-400">Objetivo: {formatPages(userGoal.pagesGoal)}</span>
                </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={BookOpen} label="Total Lidos" value={stats.totalLidos.toString()} color="text-amber-500" bg="bg-amber-500/10" />
        <StatCard icon={FileText} label="Páginas Lidas" value={formatPages(stats.totalPaginas)} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard icon={Star} label="Média Geral" value={stats.mediaGeral.toFixed(1)} color="text-rose-500" bg="bg-rose-500/10" />
        <StatCard icon={TrendingUp} label="Autor Mais Lido" value={stats.autorMaisLido || '-'} subValue={stats.generoMaisLido ? `Gênero: ${stats.generoMaisLido}` : ''} color="text-emerald-500" bg="bg-emerald-500/10" />
      </div>

      {/* Page Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Média / Livro</p>
            <h3 className="text-xl font-bold text-neutral-100">{formatPagesShort(Math.round(stats.mediaPaginas))}</h3>
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
              Evolução de Leituras
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
          <p className="text-sm text-neutral-400 mb-6">Clique em uma barra para ver os livros lidos no mês.</p>
          <div className="h-72 w-full" style={{ minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={stats.leiturasPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="name" stroke="#737373" tick={{ fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#737373" tick={{ fill: '#737373' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#262626' }} 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px' }}
                  formatter={(value: any) => [value.toLocaleString(), chartMode === 'livros' ? 'Livros' : 'Páginas']}
                />
                <Bar 
                  dataKey={chartMode === 'livros' ? 'quantidade' : 'paginas'} 
                  radius={[4, 4, 0, 0]} 
                  onClick={(data) => {
                    if (data && data.name) {
                      setSelectedMonth(selectedMonth === data.name ? null : data.name);
                    }
                  }}
                  className="cursor-pointer transition-all duration-300 hover:opacity-80"
                >
                  {stats.leiturasPorMes.map((entry, index) => (
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
