import React, { useState } from 'react';
import { useBooks } from '../context/BookContext';
import { aiService } from '../services/aiService';
import { Sparkles, Loader2, RefreshCw, BookOpen, Star, Heart, TrendingUp, Brain, Filter, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logomark } from '../components/Logomark';

export const Recommendations: React.FC = () => {
  const { books, recommendations, saveRecommendations, loading } = useBooks();
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterGenre, setFilterGenre] = useState('todos');

  const handleGenerateRecommendations = async () => {
    if (books.length < 3) {
      alert("Adicione pelo menos 3 livros para que possamos entender seu gosto.");
      return;
    }
    setIsGenerating(true);
    try {
      const recs = await aiService.generateRecommendations(books);
      await saveRecommendations(recs);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      alert("Ocorreu um erro ao gerar suas recomendações.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredRecs = recommendations.filter(rec => 
    filterGenre === 'todos' || rec.genero.toLowerCase().includes(filterGenre.toLowerCase())
  );

  const genres = Array.from(new Set(recommendations.map(r => r.genero)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 p-2 rounded-2xl shadow-xl shadow-amber-500/10 animate-pulse flex items-center justify-center">
          <Logomark />
        </div>
      </div>
    );
  }

  if (books.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <div className="bg-neutral-900 p-6 rounded-full mb-6">
          <Sparkles size={64} className="text-neutral-700" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-neutral-200 mb-4">Recomendações Personalizadas</h2>
        <p className="text-neutral-500 leading-relaxed mb-8">
          Precisamos conhecer um pouco mais do seu gosto para recomendar livros. Adicione pelo menos 3 leituras com resenhas para desbloquear o motor de recomendações.
        </p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight">Recomendações</h1>
          <p className="text-neutral-400 mt-2 text-lg">Livros selecionados pela nossa IA com base no seu DNA de leitor.</p>
        </div>
        <button 
          onClick={handleGenerateRecommendations}
          disabled={isGenerating}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          {isGenerating ? (
            <><Loader2 size={18} className="animate-spin" /> Gerando...</>
          ) : (
            <><RefreshCw size={18} /> Gerar Novas Recomendações</>
          )}
        </button>
      </header>

      {recommendations.length > 0 && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
          <Filter className="text-neutral-500 ml-2" size={20} />
          <select 
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none min-w-[200px]"
          >
            <option value="todos">Todos os Gêneros</option>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
          <Brain size={48} className="mx-auto text-amber-500/30 mb-4" />
          <h3 className="text-xl font-serif font-medium text-neutral-300 mb-2">O que ler em seguida?</h3>
          <p className="text-neutral-500 mb-8 max-w-sm mx-auto">Nossa IA analisará seus livros favoritos, gêneros mais lidos e padrões de notas para sugerir sua próxima grande leitura.</p>
          <button 
            onClick={handleGenerateRecommendations}
            disabled={isGenerating}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-8 py-3 rounded-xl font-bold transition-all"
          >
            Começar Análise
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredRecs.map((rec, index) => (
              <motion.div 
                key={rec.titulo}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col hover:border-amber-500/30 transition-colors group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold uppercase tracking-wider">{rec.genero}</span>
                  <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm">
                    <TrendingUp size={14} />
                    {rec.compatibilidade}%
                  </div>
                </div>

                <h3 className="text-xl font-serif font-bold text-neutral-100 mb-1 group-hover:text-amber-500 transition-colors">{rec.titulo}</h3>
                <p className="text-neutral-400 font-serif italic mb-4">{rec.autor}</p>
                
                <div className="bg-neutral-950/50 rounded-2xl p-4 mb-6 flex-1">
                  <p className="text-sm text-neutral-300 leading-relaxed italic">"{rec.motivo}"</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-neutral-800/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 uppercase font-medium tracking-wider">Clima</span>
                    <span className="text-neutral-200 font-bold">{rec.clima}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 uppercase font-medium tracking-wider">Tipo de Final</span>
                    <span className="text-neutral-200 font-bold">{rec.tipoFinal}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 uppercase font-medium tracking-wider">Impacto</span>
                    <span className="text-neutral-200 font-bold">{rec.impactoEmocional}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
