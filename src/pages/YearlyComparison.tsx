import React, { useMemo, useState, useEffect } from 'react';
import { useBooks } from '../context/BookContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Minus, BookOpen, FileText, Star, 
  Calendar, ChevronRight, History, Sparkles, Filter, ArrowLeft,
  Users, Bookmark, Clock
} from 'lucide-react';
import { safeParseNumber, formatPagesLong, formatPages } from '../lib/statsUtils';
import { aiService } from '../services/aiService';
import { Link } from 'react-router-dom';

const METRIC_LABELS = {
  booksTotal: 'Livros Lidos',
  pagesTotal: 'Páginas Lidas',
  avgRating: 'Nota Média',
  activeDays: 'Dias Ativos',
  sessionsCount: 'Sessões',
  avgPagesPerBook: 'Média Páginas/Livro'
};

export const YearlyComparison: React.FC = () => {
  const { books, sessions, loading } = useBooks();
  const [yearA, setYearA] = useState<number>(new Date().getFullYear());
  const [yearB, setYearB] = useState<number>(new Date().getFullYear() - 1);
  const [insights, setInsights] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear()); // Always include current
    books.forEach(b => {
      if (b.anoLeitura) years.add(b.anoLeitura);
      if (b.dataCadastro) years.add(new Date(b.dataCadastro).getFullYear());
    });
    sessions.forEach(s => years.add(new Date(s.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [books, sessions]);

  const calculateYearStats = (year: number) => {
    const lidosNoAno = books.filter(b => b.status === 'lido' && b.anoLeitura === year);
    const sessionsNoAno = sessions.filter(s => new Date(s.date).getFullYear() === year);

    const booksTotal = lidosNoAno.length;
    const pagesTotal = lidosNoAno.reduce((acc, b) => acc + safeParseNumber(b.pageCount), 0);
    const avgRating = booksTotal > 0 ? lidosNoAno.reduce((acc, b) => acc + b.notaGeral, 0) / booksTotal : 0;
    
    const activeDays = new Set(sessionsNoAno.map(s => new Date(s.date).toDateString())).size;
    const sessionsCount = sessionsNoAno.length;
    const avgPagesPerBook = booksTotal > 0 ? pagesTotal / booksTotal : 0;

    // Top Genre
    const genres = lidosNoAno.reduce((acc, b) => {
      acc[b.genero] = (acc[b.genero] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topGenre = Object.keys(genres).length > 0 
      ? Object.keys(genres).reduce((a, b) => genres[a] > genres[b] ? a : b) 
      : 'Nenhum';

    // Top Author
    const authors = lidosNoAno.reduce((acc, b) => {
      acc[b.autor] = (acc[b.autor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topAuthor = Object.keys(authors).length > 0 
      ? Object.keys(authors).reduce((a, b) => authors[a] > authors[b] ? a : b) 
      : 'Nenhum';

    // Most intense month
    const months = lidosNoAno.reduce((acc, b) => {
      acc[b.mesLeitura] = (acc[b.mesLeitura] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const values = Object.values(months);
    const topMonthValue = values.length > 0 ? Math.max(...(values as number[])) : 0;
    const topMonth = Object.keys(months).find(m => months[m] === topMonthValue) || 'Nenhum';

    return {
      year,
      metrics: {
        booksTotal,
        pagesTotal,
        avgRating,
        activeDays,
        sessionsCount,
        avgPagesPerBook
      },
      topGenre,
      topAuthor,
      topMonth,
      lidosNoAno
    };
  };

  const statsA = useMemo(() => calculateYearStats(yearA), [yearA, books, sessions]);
  const statsB = useMemo(() => calculateYearStats(yearB), [yearB, books, sessions]);

  useEffect(() => {
    const fetchInsights = async () => {
      if (statsA.metrics.booksTotal > 0 || statsB.metrics.booksTotal > 0) {
        setIsGenerating(true);
        try {
          const res = await aiService.generateYearComparisonInsights(statsA, statsB);
          setInsights(res);
        } catch (error) {
          console.error("Error generating comparison insights:", error);
        } finally {
          setIsGenerating(false);
        }
      }
    };
    fetchInsights();
  }, [yearA, yearB, statsA.metrics.booksTotal, statsB.metrics.booksTotal]);

  const ComparisonCard = ({ label, valA, valB, format = (v: any) => v }: any) => {
    const diff = valA - valB;
    const percent = valB > 0 ? (diff / valB) * 100 : 0;

    return (
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-start">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">{label}</p>
          {diff !== 0 && (
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${diff > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(percent).toFixed(0)}%
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-neutral-600 font-bold uppercase">{yearA}</p>
            <h4 className="text-2xl font-bold text-neutral-100">{format(valA)}</h4>
          </div>
          <div className="space-y-1 border-l border-neutral-800 pl-4">
            <p className="text-[10px] text-neutral-600 font-bold uppercase">{yearB}</p>
            <h4 className="text-2xl font-bold text-neutral-400">{format(valB)}</h4>
          </div>
        </div>
      </div>
    );
  };

  const chartData = [
    { name: 'Livros', [yearA]: statsA.metrics.booksTotal, [yearB]: statsB.metrics.booksTotal },
    { name: 'Sessões', [yearA]: statsA.metrics.sessionsCount, [yearB]: statsB.metrics.sessionsCount },
    { name: 'Ativos', [yearA]: statsA.metrics.activeDays, [yearB]: statsB.metrics.activeDays },
  ];

  if (loading) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors mb-4 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>
          <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight">Comparativo Anual</h1>
          <p className="text-neutral-400 mt-2">Uma visão lado a lado da sua evolução como leitor.</p>
        </div>

        <div className="flex items-center gap-4 bg-neutral-900/50 p-2 border border-neutral-800 rounded-2xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-neutral-500 uppercase px-2">Comparar</span>
            <select 
              value={yearA} 
              onChange={(e) => setYearA(Number(e.target.value))}
              className="bg-transparent text-amber-500 font-bold focus:outline-none px-2 py-1 appearance-none cursor-pointer"
            >
              {availableYears.map(y => <option key={y} value={y} className="bg-neutral-900">{y}</option>)}
            </select>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-neutral-500 uppercase px-2">com</span>
            <select 
              value={yearB} 
              onChange={(e) => setYearB(Number(e.target.value))}
              className="bg-transparent text-neutral-400 font-bold focus:outline-none px-2 py-1 appearance-none cursor-pointer"
            >
              {availableYears.map(y => <option key={y} value={y} className="bg-neutral-900">{y}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ComparisonCard 
          label="Livros Lidos" 
          valA={statsA.metrics.booksTotal} 
          valB={statsB.metrics.booksTotal} 
        />
        <ComparisonCard 
          label="Páginas Lidas" 
          valA={statsA.metrics.pagesTotal} 
          valB={statsB.metrics.pagesTotal} 
          format={formatPages}
        />
        <ComparisonCard 
          label="Nota Média" 
          valA={statsA.metrics.avgRating} 
          valB={statsB.metrics.avgRating} 
          format={(v: number) => v.toFixed(1)}
        />
      </div>

      {/* AI Insights Section */}
      <AnimatePresence mode="wait">
        {(isGenerating || insights.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles size={120} className="text-amber-500" />
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                <Sparkles size={24} />
              </div>
              <h2 className="text-xl font-serif font-bold text-neutral-100">Análise de Evolução</h2>
            </div>

            {isGenerating ? (
              <div className="flex gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex-1 h-24 bg-neutral-950/40 rounded-2xl animate-pulse border border-neutral-800/50" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {insights.map((insight, idx) => (
                  <div key={idx} className="bg-neutral-950/40 border border-neutral-800/50 p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/20 group-hover:bg-amber-500 transition-colors" />
                    <p className="text-neutral-300 italic text-sm leading-relaxed">"{insight}"</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Comparison Chart */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 shadow-xl">
          <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest mb-8">Volume e Atividade</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey={yearA} fill="#f59e0b" radius={[4, 4, 0, 0]} name={`Ano ${yearA}`} />
                <Bar dataKey={yearB} fill="#525252" radius={[4, 4, 0, 0]} name={`Ano ${yearB}`} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Hits Section */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 shadow-xl space-y-8">
          <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest">Destaques Comparados</h3>
          
          <div className="space-y-6">
            <ComparisonRow 
              icon={<Bookmark size={20} />} 
              label="Gênero Dominante" 
              valA={statsA.topGenre} 
              valB={statsB.topGenre} 
              colorA="text-amber-500" 
              colorB="text-neutral-500" 
            />
            <ComparisonRow 
              icon={<Users size={20} />} 
              label="Autor Mais Lido" 
              valA={statsA.topAuthor} 
              valB={statsB.topAuthor} 
              colorA="text-rose-500" 
              colorB="text-neutral-500" 
            />
            <ComparisonRow 
              icon={<Calendar size={20} />} 
              label="Mês de Ápice" 
              valA={statsA.topMonth} 
              valB={statsB.topMonth} 
              colorA="text-emerald-500" 
              colorB="text-neutral-500" 
            />
            <ComparisonRow 
              icon={<Clock size={20} />} 
              label="Frequência" 
              valA={`${statsA.metrics.sessionsCount} sessões`} 
              valB={`${statsB.metrics.sessionsCount} sessões`} 
              colorA="text-blue-500" 
              colorB="text-neutral-500" 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ComparisonRow = ({ icon, label, valA, valB, colorA, colorB }: any) => (
  <div className="flex items-center gap-6 group">
    <div className={`p-4 bg-neutral-950 rounded-2xl border border-neutral-800 group-hover:border-neutral-700 transition-all ${colorA}`}>
      {icon}
    </div>
    <div className="flex-1 space-y-2">
      <p className="text-[10px] font-black text-neutral-600 uppercase tracking-tighter">{label}</p>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className={`text-sm font-bold truncate ${colorA}`}>{valA}</p>
        </div>
        <div className="w-12 h-px bg-neutral-800" />
        <div className="flex-1">
          <p className={`text-sm font-bold truncate ${colorB}`}>{valB}</p>
        </div>
      </div>
    </div>
  </div>
);
