import React, { useMemo, useState } from 'react';
import { useBooks } from '../context/BookContext';
import { ReadingHeatmap } from '../components/ReadingHeatmap';
import { StreakCard } from '../components/StreakCard';
import { analysisService } from '../services/analysisService';
import { 
  UserCircle, Sparkles, Loader2, RefreshCw, BookOpen, Star, Heart, TrendingUp, 
  Brain, Award, ShieldAlert, Activity, Smile, History, Ghost, Zap, Wind, 
  Search, Target, Flame, Download, Clock, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Cell 
} from 'recharts';
import { ShareableProfileCards } from '../components/ShareableProfileCards';
import { Quote as QuoteIcon } from 'lucide-react';

export const LiteraryProfile: React.FC = () => {
  const { books, literaryProfile, saveLiteraryProfile, loading, sessions, quotes } = useBooks();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleUpdateAnalysis = async () => {
    if (books.length < 3) {
      alert("Adicione pelo menos 3 livros para uma análise precisa.");
      return;
    }
    setIsAnalyzing(true);
    try {
      // Small timeout to give feedback of "processing"
      await new Promise(resolve => setTimeout(resolve, 800));
      const profile = analysisService.analyzeLiteraryProfile(books);
      await saveLiteraryProfile(profile);
    } catch (error) {
      console.error("Error updating analysis:", error);
      alert("Ocorreu um erro ao atualizar sua análise literária.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentProfile = literaryProfile;
  const favQuotes = useMemo(() => quotes.filter(q => q.isFavorite).slice(0, 3), [quotes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin text-amber-500">
          <BookOpen size={48} />
        </div>
      </div>
    );
  }

  if (books.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <div className="bg-neutral-900 p-6 rounded-full mb-6">
          <Brain size={64} className="text-neutral-700" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-neutral-200 mb-4">Seu Perfil Literário está sendo construído</h2>
        <p className="text-neutral-500 leading-relaxed mb-8">
          Precisamos de um pouco mais de dados para entender seu gosto. Adicione pelo menos 3 livros com resenhas e notas detalhadas para gerar sua análise literária.
        </p>
        <button 
          disabled
          className="bg-neutral-800 text-neutral-500 px-8 py-3 rounded-xl font-medium cursor-not-allowed"
        >
          Análise Indisponível
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-serif font-bold text-neutral-100 tracking-tight">Identidade Literária</h1>
          <p className="text-neutral-400 mt-3 text-xl max-w-2xl">
            Uma análise profunda dos seus hábitos, humores e padrões emocionais como leitor.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          {currentProfile && (
            <button 
              onClick={() => setShowShareModal(true)}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-100 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <Download size={20} /> Exportar Identidade
            </button>
          )}
          <button 
            onClick={handleUpdateAnalysis}
            disabled={isAnalyzing}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 group uppercase tracking-widest text-xs"
          >
            {isAnalyzing ? (
              <><Loader2 size={20} className="animate-spin" /> Processando Identidade...</>
            ) : (
              <><RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" /> Gerar Nova Análise</>
            )}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showShareModal && currentProfile && (
          <ShareableProfileCards 
            profile={currentProfile} 
            books={books} 
            onClose={() => setShowShareModal(false)} 
          />
        )}
      </AnimatePresence>

      {/* Heatmap de Leitura */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Activity size={120} />
        </div>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <TrendingUp size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-neutral-100">Ritmo de Leitura</h2>
              <p className="text-neutral-500 text-sm">Sua consistência ao longo do ano.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] bg-neutral-950 px-4 py-2 rounded-full border border-neutral-800">
              Atividade Global
            </span>
          </div>
        </div>
        <ReadingHeatmap sessions={sessions} />
      </div>

      <StreakCard sessions={sessions} />

      {!currentProfile ? (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent" />
          <Sparkles size={64} className="mx-auto text-amber-500/20 mb-6" />
          <h3 className="text-3xl font-serif font-bold text-neutral-100 mb-4">Pronto para encontrar seu Arquétipo?</h3>
          <p className="text-neutral-400 mb-10 max-w-md mx-auto text-lg">Nosso motor de análise identificará seus humores literários, padrões emocionais e nível de rigor para criar sua identidade única.</p>
          <button 
            onClick={handleUpdateAnalysis}
            className="px-10 py-5 bg-amber-500 rounded-2xl text-neutral-950 font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-2xl shadow-amber-500/20"
          >
            Iniciar Análise Literária
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Archetype Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12">
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700/50 rounded-[3rem] p-10 md:p-16 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 p-20 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                  <div className="w-32 h-32 md:w-48 md:h-48 bg-neutral-950 rounded-[2.5rem] flex items-center justify-center border border-neutral-700 shadow-2xl shrink-0 group hover:rotate-3 transition-transform duration-700">
                    <Sparkles size={64} className="text-amber-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-center md:text-left space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-widest">
                      Seu Arquétipo de Leitor
                    </div>
                    <h2 className="text-4xl md:text-6xl font-serif font-bold text-neutral-100 leading-tight">
                      {currentProfile.archetype.name}
                    </h2>
                    <p className="text-xl text-neutral-400 max-w-3xl leading-relaxed">
                      {currentProfile.archetype.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reading Pace and Length Analytics */}
          {currentProfile.readingPace && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                  <Wind size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-neutral-100">Análise de Ritmo e Extensão</h2>
                  <p className="text-neutral-500 text-sm">Comportamento de fôlego e velocidade de conclusão.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <PaceStatCard 
                  label="Duração Média" 
                  value={`${currentProfile.readingPace.avgDaysToFinish} dias`} 
                  sub="para concluir uma obra"
                  icon={Clock}
                />
                <PaceStatCard 
                  label="Intensidade Mensal" 
                  value={`${currentProfile.readingPace.avgPagesPerMonth} págs`} 
                  sub="em média por mês ativo"
                  icon={Zap}
                />
                <PaceStatCard 
                  label="Extensão Média" 
                  value={`${currentProfile.readingPace.avgPagesPerBook} págs`} 
                  sub="por livro concluído"
                  icon={BookOpen}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest pl-2">Livros Significativos</h3>
                  <div className="bg-neutral-950/40 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-6">
                    {currentProfile.readingPace.longestBook && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                            <Plus size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-200">{currentProfile.readingPace.longestBook.title}</p>
                            <p className="text-[10px] text-neutral-500 uppercase font-black">Sua leitura mais longa</p>
                          </div>
                        </div>
                        <span className="text-sm font-mono text-amber-500">{currentProfile.readingPace.longestBook.pages} págs</span>
                      </div>
                    )}
                    {currentProfile.readingPace.shortestBook && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                            <Wind size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-200">{currentProfile.readingPace.shortestBook.title}</p>
                            <p className="text-[10px] text-neutral-500 uppercase font-black">Sua leitura mais curta</p>
                          </div>
                        </div>
                        <span className="text-sm font-mono text-blue-500">{currentProfile.readingPace.shortestBook.pages} págs</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-900/30 border border-neutral-800 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-4 bg-amber-500/10 rounded-full text-amber-500 mb-4 z-10">
                    <Target size={32} />
                  </div>
                  <h4 className="text-lg font-serif font-bold text-neutral-200 mb-2 z-10">Banda de Extensão Preferida</h4>
                  <p className="text-3xl font-black text-neutral-100 mb-2 tracking-tight z-10">{currentProfile.readingPace.preferredRange}</p>
                  <p className="text-sm text-neutral-500 italic max-w-xs z-10">
                    Suas leituras mais satisfatórias costumam ficar dentro desta faixa de volume.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Taste Evolution Section */}
          {currentProfile.evolutionData && currentProfile.evolutionData.length > 0 && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                    <History size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-neutral-100">Evolução de Gosto</h2>
                    <p className="text-neutral-500 text-sm">Como sua identidade literária amadureceu ao longo do tempo.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                {/* Evolution Chart */}
                <div className="bg-neutral-950/40 border border-neutral-800/50 rounded-3xl p-6">
                  <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest mb-6">Tendência de Nota e Volume</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentProfile.evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis dataKey="period" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} />
                        <YAxis yAxisId="left" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px' }}
                        />
                        <Bar yAxisId="left" dataKey="booksCount" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Livros" />
                        <Bar yAxisId="right" dataKey="averageRating" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Nota Média" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Evolution Insights */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest mb-2 pl-2">Análise de Amadurecimento</h3>
                  {currentProfile.evolutionInsights?.map((insight, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-3xl relative overflow-hidden group hover:border-amber-500/50 transition-colors"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/20 group-hover:bg-amber-500 transition-colors" />
                      <p className="text-neutral-300 leading-relaxed italic">"{insight}"</p>
                    </motion.div>
                  )) || (
                    <div className="bg-neutral-900/20 border border-dashed border-neutral-800 p-8 rounded-3xl text-center text-neutral-600 italic">
                      Gere uma nova análise para carregar seus insights de evolução.
                    </div>
                  )}
                </div>
              </div>

              {/* Period Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentProfile.evolutionData.slice(-4).map((data, idx) => (
                  <div key={idx} className="bg-neutral-950/40 border border-neutral-800/50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">{data.period}</p>
                    <p className="text-xs font-bold text-amber-500 mb-1">{data.topGenre}</p>
                    <div className="flex items-center justify-between text-[10px] text-neutral-500">
                      <span>{data.booksCount} livros</span>
                      <span>{data.averageBookLength} pág/méd</span>
                      <span>{data.averageRating.toFixed(1)} ★</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emotional Dynamics & Behavior */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-8">
              {/* Mood Radar */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 shadow-xl">
                <h3 className="text-xl font-serif font-bold text-neutral-100 mb-8 flex items-center gap-3">
                  <Flame className="text-amber-500" size={24} />
                  Mapa de Atmosferas
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={currentProfile.moodMap}>
                      <PolarGrid stroke="#333" />
                      <PolarAngleAxis dataKey="mood" tick={{ fill: '#737373', fontSize: 10, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                      <Radar
                        name="Intensidade"
                        dataKey="intensity"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                    Dominância Sensorial
                  </p>
                </div>
              </div>

              {/* Behavior Cards */}
              <div className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-neutral-100 pl-4 mb-2 flex items-center gap-3">
                   <Target className="text-blue-500" size={24} />
                   Padrões Comportamentais
                </h3>
                {currentProfile.readingStyleBehavior.map((behavior, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx} 
                    className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-3xl hover:border-neutral-700 transition-colors"
                  >
                    <h4 className="text-neutral-100 font-bold mb-2 flex items-center gap-2">
                       <Zap size={16} className="text-amber-500" />
                       {behavior.pattern}
                    </h4>
                    <p className="text-neutral-400 text-sm leading-relaxed">{behavior.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-8">
              {/* Genre Metrics (Intensity & Strictness) */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-serif font-bold text-neutral-100 flex items-center gap-3">
                    <Activity className="text-emerald-500" size={24} />
                    Métricas por Gênero
                  </h3>
                  <div className="hidden sm:flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Leitura</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-neutral-700" />
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Rigor</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentProfile.genreMetrics} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis 
                         dataKey="genre" 
                         type="category" 
                         width={100} 
                         tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 600 }}
                         axisLine={false}
                         tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px' }}
                        cursor={{ fill: '#262626' }}
                      />
                      <Bar dataKey="intensity" radius={[0, 8, 8, 0]} barSize={24}>
                        {currentProfile.genreMetrics.map((_, index) => (
                          <Cell key={`cell-i-${index}`} fill="#f59e0b" fillOpacity={0.8} />
                        ))}
                      </Bar>
                      <Bar dataKey="strictness" radius={[0, 8, 8, 0]} barSize={12}>
                        {currentProfile.genreMetrics.map((_, index) => (
                          <Cell key={`cell-s-${index}`} fill="#3f3f46" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-neutral-950/50 rounded-2xl border border-neutral-800">
                  <p className="text-xs text-neutral-400 text-center italic">
                    "Intensidade reflete quanto você lê; Rigor reflete quão difícil é ganhar suas 5 estrelas."
                  </p>
                </div>
              </div>

              {/* Identity Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                  <Heart size={32} className="text-rose-500 mb-4" />
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Ressonância Emocional</p>
                  <h4 className="text-2xl font-serif font-bold text-neutral-100">{currentProfile.archetype.emotionalResonance}</h4>
                  <p className="text-xs text-neutral-500 mt-2">O gênero que mais toca sua alma.</p>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                  <ShieldAlert size={32} className="text-blue-500 mb-4" />
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Gênero Mais Exigente</p>
                  <h4 className="text-2xl font-serif font-bold text-neutral-100">{currentProfile.archetype.demandingGenre}</h4>
                  <p className="text-xs text-neutral-500 mt-2">Onde seu senso crítico é implacável.</p>
                </div>
                <div className="md:col-span-2 bg-neutral-900/50 border border-neutral-800 p-8 rounded-[2.5rem] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                       <BookOpen size={24} className="text-neutral-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Escopo de Leitura</p>
                      <h4 className="text-xl font-bold text-neutral-100">
                        {currentProfile.preferredLength === 'short' && 'Preferência por Brevidade'}
                        {currentProfile.preferredLength === 'medium' && 'Equilíbrio Substancial'}
                        {currentProfile.preferredLength === 'long' && 'Amante de Epopeias'}
                        {currentProfile.preferredLength === 'varied' && 'Oportunista Versátil'}
                      </h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-neutral-400 bg-neutral-950 px-4 py-2 rounded-lg border border-neutral-800 uppercase">
                      {currentProfile.preferredLength}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Sections (Ranking, Analysis, etc) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-8 space-y-8">
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-10 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Brain size={120} />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-amber-500 mb-8 flex items-center gap-4">
                    <Sparkles size={28} />
                    Insights de Transparência
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentProfile.insights.map((insight, index) => (
                      <motion.div 
                        whileHover={{ y: -5 }}
                        key={index} 
                        className="bg-neutral-950/40 border border-neutral-800/50 p-6 rounded-3xl flex items-start gap-4"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-2 shrink-0 shadow-lg shadow-amber-500/40" />
                        <p className="text-neutral-300 text-sm leading-relaxed font-medium">{insight}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-10 shadow-xl">
                  <div className="flex items-center gap-4 mb-8">
                     <Search size={28} className="text-amber-500" />
                     <h2 className="text-3xl font-serif font-bold text-amber-500">Fluxo de Pensamento</h2>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-neutral-300 text-lg leading-relaxed whitespace-pre-wrap italic opacity-80 border-l-4 border-amber-500/20 pl-8">
                      {currentProfile.analiseDetalhada}
                    </p>
                  </div>
                </div>
             </div>

             <div className="lg:col-span-4 space-y-6">
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 shadow-xl">
                  <h2 className="text-xl font-serif font-bold text-amber-500 mb-8 flex items-center gap-3">
                    <Award size={24} />
                    Ranking de Mentores
                  </h2>
                  <div className="space-y-6">
                    {currentProfile.rankingAutores.map((ranking, index) => (
                      <div key={index} className="relative group">
                        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-amber-500/0 group-hover:bg-amber-500 transition-all rounded-full" />
                        <div className="pl-4">
                          <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest">Nível {index + 1}</span>
                          <h4 className="text-xl font-bold text-neutral-100 group-hover:text-amber-500 transition-colors">{ranking.autor}</h4>
                          <p className="text-neutral-500 text-sm leading-relaxed mt-2">{ranking.motivo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <ProfileCard label="Gênero Favorito" value={currentProfile.generoFavorito} icon={TrendingUp} color="text-amber-500" bg="bg-amber-500/10" />
                  <ProfileCard label="Narrativa Preferida" value={currentProfile.tipoNarrativaFavorita} icon={BookOpen} color="text-blue-500" bg="bg-blue-500/10" />
                  <ProfileCard label="Valor Fundamental" value={currentProfile.elementoMaisValorizado} icon={Heart} color="text-rose-500" bg="bg-rose-500/10" />
                  <ProfileCard label="Ponto de Atrito" value={currentProfile.pontoMaisCritico} icon={ShieldAlert} color="text-emerald-500" bg="bg-emerald-500/10" />
                </div>

                <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 shadow-xl mt-6">
                  <h2 className="text-xl font-serif font-bold text-neutral-100 mb-6 flex items-center gap-3">
                    <QuoteIcon className="text-amber-500" size={24} />
                    Citações Emblemáticas
                  </h2>
                  {favQuotes.length > 0 ? (
                    <div className="space-y-6">
                      {favQuotes.map((q) => (
                        <div key={q.id} className="relative p-6 bg-neutral-950/40 border border-neutral-800/50 rounded-2xl italic font-serif text-neutral-300">
                          <span className="text-amber-500/20 text-4xl absolute -top-2 -left-2">"</span>
                          <p className="relative z-10 leading-relaxed italic">
                            {q.text}
                          </p>
                          <div className="mt-4 text-right not-italic font-sans text-[10px] uppercase font-bold text-neutral-500 tracking-widest">
                            — {q.bookTitle}, {q.bookAuthor}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500 italic text-sm">
                      Favorite suas citações preferidas para elas aparecerem aqui.
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const ProfileCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <motion.div 
    whileHover={{ x: 5 }}
    className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl"
  >
    <div className="flex items-center gap-5">
      <div className={`p-4 rounded-[1.25rem] ${bg} ${color} shadow-inner`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-lg font-bold text-neutral-100 leading-tight">{value}</h3>
      </div>
    </div>
  </motion.div>
);

const PaceStatCard = ({ label, value, sub, icon: Icon }: any) => (
  <div className="bg-neutral-950/40 border border-neutral-800 p-6 rounded-3xl group hover:border-purple-500/50 transition-colors shadow-lg">
    <div className="flex items-center gap-4 mb-3">
      <div className="p-3 bg-neutral-900 rounded-xl text-neutral-500 group-hover:text-purple-500 transition-colors">
        <Icon size={20} />
      </div>
      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-3xl font-black text-neutral-100 mb-1">{value}</p>
    <p className="text-xs text-neutral-600 font-medium">{sub}</p>
  </div>
);
