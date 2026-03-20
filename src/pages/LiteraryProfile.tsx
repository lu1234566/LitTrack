import React, { useState } from 'react';
import { useBooks } from '../context/BookContext';
import { aiService } from '../services/aiService';
import { UserCircle, Sparkles, Loader2, RefreshCw, BookOpen, Star, Heart, TrendingUp, Brain, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export const LiteraryProfile: React.FC = () => {
  const { books, literaryProfile, saveLiteraryProfile, loading } = useBooks();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleUpdateAnalysis = async () => {
    if (books.length < 3) {
      alert("Adicione pelo menos 3 livros para uma análise precisa.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const profile = await aiService.generateLiteraryProfile(books);
      await saveLiteraryProfile(profile);
    } catch (error) {
      console.error("Error updating analysis:", error);
      alert("Ocorreu um erro ao atualizar sua análise literária.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
          Precisamos de um pouco mais de dados para entender seu gosto. Adicione pelo menos 3 livros com resenhas e notas detalhadas para gerar sua análise de IA.
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight">Perfil Literário</h1>
          <p className="text-neutral-400 mt-2 text-lg">Uma análise inteligente da sua identidade como leitor.</p>
        </div>
        <button 
          onClick={handleUpdateAnalysis}
          disabled={isAnalyzing}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          {isAnalyzing ? (
            <><Loader2 size={18} className="animate-spin" /> Analisando...</>
          ) : (
            <><RefreshCw size={18} /> Atualizar Análise</>
          )}
        </button>
      </header>

      {!literaryProfile ? (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
          <Sparkles size={48} className="mx-auto text-amber-500/30 mb-4" />
          <h3 className="text-xl font-serif font-medium text-neutral-300 mb-2">Pronto para a descoberta?</h3>
          <p className="text-neutral-500 mb-8 max-w-sm mx-auto">Clique no botão acima para que nossa IA analise seu histórico e gere seu perfil literário exclusivo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Insights */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-serif font-bold text-amber-500 mb-6 flex items-center gap-3">
                <Brain size={24} />
                Insights da IA
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {literaryProfile.insights.map((insight, index) => (
                  <div key={index} className="bg-neutral-950/50 border border-neutral-800 p-5 rounded-2xl flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <p className="text-neutral-300 text-sm leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-serif font-bold text-amber-500 mb-6">Análise Detalhada</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {literaryProfile.analiseDetalhada}
                </p>
              </div>
            </div>

            {literaryProfile.rankingAutores && literaryProfile.rankingAutores.length > 0 && (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
                <h2 className="text-2xl font-serif font-bold text-amber-500 mb-6 flex items-center gap-3">
                  <Award size={24} />
                  Top Autores: Frequência & Consistência
                </h2>
                <div className="space-y-4">
                  {literaryProfile.rankingAutores.map((ranking, index) => (
                    <div key={index} className="bg-neutral-950/50 border border-neutral-800 p-5 rounded-2xl flex items-start gap-4 hover:border-amber-500/30 transition-colors">
                      <div className="text-2xl font-black text-amber-500/50 w-8 pt-1">{index + 1}</div>
                      <div>
                        <h4 className="text-lg font-bold text-neutral-100">{ranking.autor}</h4>
                        <p className="text-neutral-400 text-sm leading-relaxed mt-1">{ranking.motivo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Stats */}
          <div className="lg:col-span-4 space-y-6">
            <ProfileCard 
              label="Gênero Favorito" 
              value={literaryProfile.generoFavorito} 
              icon={TrendingUp} 
              color="text-amber-500" 
              bg="bg-amber-500/10" 
            />
            <ProfileCard 
              label="Tipo de Narrativa" 
              value={literaryProfile.tipoNarrativaFavorita} 
              icon={BookOpen} 
              color="text-blue-500" 
              bg="bg-blue-500/10" 
            />
            <ProfileCard 
              label="Elemento que Valoriza" 
              value={literaryProfile.elementoMaisValorizado} 
              icon={Heart} 
              color="text-rose-500" 
              bg="bg-rose-500/10" 
            />
            <ProfileCard 
              label="Ponto Crítico" 
              value={literaryProfile.pontoMaisCritico} 
              icon={RefreshCw} 
              color="text-emerald-500" 
              bg="bg-emerald-500/10" 
            />
            <ProfileCard 
              label="Autor Compatível" 
              value={literaryProfile.autorMaisCompativel} 
              icon={Star} 
              color="text-violet-500" 
              bg="bg-violet-500/10" 
            />
            
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 text-center">
              <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-2">Seu Estilo de Leitor</p>
              <h3 className="text-2xl font-serif font-bold text-neutral-100">{literaryProfile.estiloLeitor}</h3>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const ProfileCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl ${bg} ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</p>
        <h3 className="text-lg font-bold text-neutral-100">{value}</h3>
      </div>
    </div>
  </div>
);
