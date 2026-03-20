import React, { useMemo } from 'react';
import { useBooks } from '../context/BookContext';
import { Book, Star, TrendingUp, Award, BookOpen, Calendar, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const Dashboard: React.FC = () => {
  const { books, loading } = useBooks();

  const stats = useMemo(() => {
    if (loading) return null;
    const lidos = books.filter((b) => b.status === 'lido');
    const totalLidos = lidos.length;
    const mediaGeral = totalLidos > 0 ? lidos.reduce((acc, b) => acc + b.notaGeral, 0) / totalLidos : 0;
    
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
    const leiturasPorMes = MONTHS.map(mes => ({
      name: mes.substring(0, 3),
      quantidade: lidos.filter(b => b.mesLeitura === mes).length
    }));

    // Top livros
    const topLivros = [...lidos].sort((a, b) => b.notaGeral - a.notaGeral).slice(0, 5);

    return { totalLidos, mediaGeral, melhorLivro, autorMaisLido, generoMaisLido, leiturasPorMes, topLivros };
  }, [books, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin text-amber-500">
          <BookOpen size={48} />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight">Dashboard 2026</h1>
          <p className="text-neutral-400 mt-2 text-lg">Seu ano literário em números.</p>
        </div>
        <Link 
          to="/retrospectiva" 
          className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-105"
        >
          <Sparkles size={20} />
          Ver Retrospectiva 2026
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={BookOpen} label="Livros Lidos" value={stats.totalLidos.toString()} color="text-amber-500" bg="bg-amber-500/10" />
        <StatCard icon={Star} label="Média Geral" value={stats.mediaGeral.toFixed(1)} color="text-rose-500" bg="bg-rose-500/10" />
        <StatCard icon={Award} label="Melhor Livro" value={stats.melhorLivro?.titulo || '-'} subValue={stats.melhorLivro?.autor} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard icon={TrendingUp} label="Autor Mais Lido" value={stats.autorMaisLido || '-'} subValue={stats.generoMaisLido ? `Gênero: ${stats.generoMaisLido}` : ''} color="text-blue-500" bg="bg-blue-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-serif font-semibold mb-6 flex items-center gap-2">
            <Calendar className="text-amber-500" size={20} />
            Evolução de Leituras
          </h2>
          <div className="h-72 w-full" style={{ minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={stats.leiturasPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="name" stroke="#737373" tick={{ fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#737373" tick={{ fill: '#737373' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#262626' }} contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px' }} />
                <Bar dataKey="quantidade" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
