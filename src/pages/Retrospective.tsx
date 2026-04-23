import React, { useMemo, useState, useEffect } from 'react';
import { useBooks } from '../context/BookContext';
import { aiService } from '../services/aiService';
import { BookOpen, Star, Award, Calendar, TrendingUp, Heart, ChevronRight, ChevronLeft, Share2, Download, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logomark } from '../components/Logomark';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const Retrospective: React.FC = () => {
  const { books, loading } = useBooks();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [narratives, setNarratives] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const lidos = useMemo(() => books.filter(b => b.status === 'lido'), [books]);

  useEffect(() => {
    const generateNarratives = async () => {
      if (lidos.length >= 3) {
        setIsGenerating(true);
        try {
          const result = await aiService.generateRetrospectiveNarrative(lidos);
          setNarratives(result);
        } catch (error) {
          console.error("Error generating narratives:", error);
        } finally {
          setIsGenerating(false);
        }
      }
    };
    generateNarratives();
  }, [lidos]);

  const stats = useMemo(() => {
    if (lidos.length === 0) return null;

    const totalLidos = lidos.length;
    const mediaGeral = lidos.reduce((acc, b) => acc + b.notaGeral, 0) / totalLidos;
    const melhorLivro = lidos.reduce((prev, current) => (prev.notaGeral > current.notaGeral ? prev : current), lidos[0]);
    const piorLivro = lidos.reduce((prev, current) => (prev.notaGeral < current.notaGeral ? prev : current), lidos[0]);
    
    const autores = lidos.reduce((acc, b) => {
      acc[b.autor] = (acc[b.autor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const autorMaisLido = Object.keys(autores).reduce((a, b) => (autores[a] > autores[b] ? a : b), '');

    const generos = lidos.reduce((acc, b) => {
      acc[b.genero] = (acc[b.genero] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const generoMaisLido = Object.keys(generos).reduce((a, b) => (generos[a] > generos[b] ? a : b), '');

    const meses = lidos.reduce((acc, b) => {
      acc[b.mesLeitura] = (acc[b.mesLeitura] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mesMaisAtivo = Object.keys(meses).reduce((a, b) => (meses[a] > meses[b] ? a : b), '');

    const favoritos = lidos.filter(b => b.favorito).length;
    
    const top5 = [...lidos].sort((a, b) => b.notaGeral - a.notaGeral).slice(0, 5);

    return { totalLidos, mediaGeral, melhorLivro, piorLivro, autorMaisLido, generoMaisLido, mesMaisAtivo, favoritos, top5 };
  }, [lidos]);

  if (loading || isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
        <div className="w-24 h-24 bg-neutral-900 border border-neutral-800 p-2 rounded-3xl shadow-2xl shadow-amber-500/10 animate-pulse flex items-center justify-center">
          <Logomark />
        </div>
        <p className="text-neutral-400 font-serif italic animate-pulse">Preparando sua retrospectiva literária...</p>
      </div>
    );
  }

  if (lidos.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <div className="bg-neutral-900 p-6 rounded-full mb-6">
          <Calendar size={64} className="text-neutral-700" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-neutral-200 mb-4">Sua Retrospectiva</h2>
        <p className="text-neutral-500 leading-relaxed mb-8">
          A retrospectiva será criada conforme você registrar suas leituras. Adicione pelo menos 3 livros lidos para desbloquear sua jornada visual.
        </p>
      </div>
    );
  }

  const slides = [
    {
      title: "Seu Ano Literário",
      content: (
        <div className="text-center space-y-6">
          <div className="text-8xl font-serif font-black text-amber-500 mb-4">{stats?.totalLidos}</div>
          <div className="text-3xl font-serif font-bold text-neutral-100">Livros Lidos</div>
          <p className="text-neutral-400 text-lg max-w-xs mx-auto">Você explorou novos mundos e viveu mil vidas este ano.</p>
        </div>
      ),
      bg: "bg-gradient-to-br from-amber-900/20 to-neutral-950"
    },
    {
      title: "O Resumo da IA",
      content: (
        <div className="space-y-8 max-w-lg mx-auto">
          {narratives.map((text, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.5 }}
              className="text-2xl font-serif italic text-neutral-200 border-l-4 border-amber-500 pl-6 py-2"
            >
              "{text}"
            </motion.div>
          ))}
        </div>
      ),
      bg: "bg-gradient-to-br from-neutral-900 to-neutral-950"
    },
    {
      title: "Sua Média de Estrelas",
      content: (
        <div className="text-center space-y-6">
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={48} fill={s <= Math.round(stats?.mediaGeral || 0) ? "#f59e0b" : "transparent"} className={s <= Math.round(stats?.mediaGeral || 0) ? "text-amber-500" : "text-neutral-800"} />
            ))}
          </div>
          <div className="text-6xl font-bold text-neutral-100">{stats?.mediaGeral.toFixed(1)}</div>
          <p className="text-neutral-400 text-lg">Foi um ano de leituras de alta qualidade.</p>
        </div>
      ),
      bg: "bg-gradient-to-br from-blue-900/20 to-neutral-950"
    },
    {
      title: "O Grande Vencedor",
      content: (
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="absolute -inset-4 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="w-48 h-72 bg-neutral-900 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-2xl relative z-10">
              {stats?.melhorLivro.ilustracaoUrl ? (
                <img src={stats.melhorLivro.ilustracaoUrl} alt={stats.melhorLivro.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><BookOpen size={48} className="text-neutral-800" /></div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-serif font-bold text-neutral-100 mb-2">{stats?.melhorLivro.titulo}</h3>
            <p className="text-xl text-neutral-400 font-serif italic">{stats?.melhorLivro.autor}</p>
          </div>
          <div className="px-4 py-2 bg-amber-500 text-neutral-950 rounded-full font-bold text-sm uppercase tracking-widest">Melhor Livro do Ano</div>
        </div>
      ),
      bg: "bg-gradient-to-br from-amber-500/10 to-neutral-950"
    },
    {
      title: "Seus Favoritos",
      content: (
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <div className="relative">
              <Heart size={120} className="text-rose-500 fill-rose-500 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">{stats?.favoritos}</div>
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-neutral-100">Livros que ganharam seu coração</div>
          <p className="text-neutral-400">Histórias que você levará para sempre.</p>
        </div>
      ),
      bg: "bg-gradient-to-br from-rose-900/20 to-neutral-950"
    },
    {
      title: "Top 5 do Ano",
      content: (
        <div className="w-full max-w-md mx-auto space-y-4">
          {stats?.top5.map((book, i) => (
            <div key={book.id} className="flex items-center gap-4 p-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl">
              <div className="text-2xl font-black text-amber-500 w-8">{i + 1}</div>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-bold text-neutral-100 truncate">{book.titulo}</div>
                <div className="text-sm text-neutral-500 truncate">{book.autor}</div>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star size={14} fill="currentColor" />
                {book.notaGeral.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      ),
      bg: "bg-gradient-to-br from-neutral-900 to-neutral-950"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      <div className="absolute top-8 left-8 flex items-center gap-4 z-20">
        <div className="bg-amber-500 text-neutral-950 p-2 rounded-lg">
          <BookOpen size={24} />
        </div>
        <div className="text-xl font-serif font-bold text-neutral-100">Readora Wrapped</div>
      </div>

      <div className="absolute top-8 right-8 flex items-center gap-2 z-20">
        <button className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors">
          <Share2 size={20} />
        </button>
        <button className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors">
          <Download size={20} />
        </button>
        <button 
          onClick={() => window.history.back()}
          className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors"
        >
          Sair
        </button>
      </div>

      <div className="w-full max-w-4xl h-full flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`w-full h-[70vh] rounded-[40px] p-12 flex flex-col items-center justify-center shadow-2xl border border-neutral-800/50 relative overflow-hidden ${slides[currentSlide].bg}`}
          >
            <div className="absolute top-12 text-xs font-bold uppercase tracking-[0.3em] text-amber-500/60">{slides[currentSlide].title}</div>
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>

        {/* Progress Bars */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 w-full max-w-xs">
          {slides.map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: i === currentSlide ? "100%" : i < currentSlide ? "100%" : "0%" }}
                transition={{ duration: i === currentSlide ? 5 : 0.3 }}
                className="h-full bg-amber-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-8 z-20">
        <button 
          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-400 hover:text-white disabled:opacity-30 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlide === slides.length - 1}
          className="p-4 bg-amber-500 text-neutral-950 rounded-2xl hover:bg-amber-600 disabled:opacity-30 transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};
