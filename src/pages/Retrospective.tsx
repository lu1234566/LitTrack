import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useBooks } from '../context/BookContext';
import { useGoals } from '../context/GoalsContext';
import { useLiteraryProfile } from '../context/LiteraryProfileContext';
import { analysisService } from '../services/analysisService';
import { BookOpen, Star, Award, Calendar, TrendingUp, Heart, ChevronRight, ChevronLeft, Share2, Download, Brain, User, Target, Bookmark, FileText, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Logomark } from '../components/Logomark';
import { formatPagesLong, formatPages } from '../lib/statsUtils';
import { CoverImage } from '../components/CoverImage';
import { toPng, toBlob } from 'html-to-image';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const Retrospective: React.FC = () => {
  const { books, loading, quotes, narratives: cachedNarratives, saveRetrospectiveNarratives } = useBooks();
  const { userGoal } = useGoals();
  const { literaryProfile } = useLiteraryProfile();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [narratives, setNarratives] = useState<string[]>(cachedNarratives || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cachedNarratives && cachedNarratives.length > 0) {
      setNarratives(cachedNarratives);
    }
  }, [cachedNarratives]);

  const handleExport = async () => {
    if (!slideRef.current) return;
    setIsExporting(true);
    
    try {
      // Small delay to allow React to render any hide-on-export classes if needed
      await new Promise(r => setTimeout(r, 100));
      
      const dataUrl = await toPng(slideRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        skipFonts: true, // Sometimes fonts with OKLCH variables could cause issues
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `readora-wrapped-${currentSlide + 1}.png`;
      link.click();
    } catch (error) {
      console.error('Error exporting slide:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!slideRef.current) return;
    setIsExporting(true);
    
    try {
      await new Promise(r => setTimeout(r, 100));
      
      const blob = await toBlob(slideRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        skipFonts: true,
      });
      if (!blob) return;
      
      const file = new File([blob], `readora-wrapped-${currentSlide + 1}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Meu Ano Literário - Readora Wrapped',
          text: 'Um vislumbre do meu ano de leituras! ✨',
          files: [file],
        });
      } else {
        // Fallback
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `readora-wrapped-${currentSlide + 1}.png`;
        link.click();
      }
    } catch (error) {
      console.error('Error sharing slide:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const lidos = useMemo(() => books.filter(b => b.status === 'lido'), [books]);
  const currentYear = new Date().getFullYear();

  const generateNarratives = async (force = false) => {
    if (lidos.length >= 3 && (force || narratives.length === 0)) {
      setIsGenerating(true);
      try {
        // Small delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 800));
        const result = analysisService.generateRetrospectiveNarrative(lidos);
        setNarratives(result);
        if (saveRetrospectiveNarratives) {
          await saveRetrospectiveNarratives(currentYear, result);
        }
      } catch (error) {
        console.error("Error generating narratives:", error);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  useEffect(() => {
    if (lidos.length >= 3 && narratives.length === 0) {
      generateNarratives();
    }
  }, [lidos.length, narratives.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

    const favoritados = lidos.filter(b => b.favorito).length;
    
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

    const maiorLivro = lidos.filter(b => (b.pageCount || 0) > 0).sort((a, b) => (b.pageCount || 0) - (a.pageCount || 0))[0];
    const menorLivro = lidos.filter(b => (b.pageCount || 0) > 0).sort((a, b) => (a.pageCount || 0) - (b.pageCount || 0))[0];

    // Total pages in retrospective
    const totalPaginas = lidos.reduce((acc, b) => acc + (Number(b.pageCount) || 0), 0);
    const mediaPaginas = totalLidos > 0 ? Math.round(totalPaginas / totalLidos) : 0;

    const citacoes = lidos.filter(b => b.citacaoFavorita && b.citacaoFavorita.length > 5);
    // Find the longest or best quote
    const melhorCitacao = citacoes.length > 0 ? [...citacoes].sort((a, b) => (b.notaGeral - a.notaGeral))[0] : null;

    const top5 = [...lidos].sort((a, b) => b.notaGeral - a.notaGeral).slice(0, 5);

    const bestQuote = quotes.find(q => q.isFavorite) || (quotes.length > 0 ? quotes[0] : null);

    return { 
      totalLidos, mediaGeral, melhorLivro, piorLivro, 
      autorMaisLido, autorLivros: autores[autorMaisLido] || 0,
      generoMaisLido, generoCount: generos[generoMaisLido] || 0,
      mesMaisAtivo, mesLivros: meses[mesMaisAtivo] || 0,
      favoritos: favoritados, 
      totalPaginas, mediaPaginas,
      mediaDiasParaConcluir,
      maiorLivro, menorLivro,
      melhorCitacao,
      bestQuote,
      top5 
    };
  }, [lidos]);

  if (loading) {
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

  const slides: { title: string; content: React.ReactNode; bg: string; layout?: 'hero' | 'wide' }[] = [];

  slides.push({
    title: "Introdução",
    layout: 'hero',
    content: (
      <div className="text-center space-y-8 md:space-y-10 flex flex-col items-center h-full justify-center px-4">
        <div className="space-y-2 relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 bg-amber-500/20 blur-[60px] rounded-full pointer-events-none" />
           <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-8xl md:text-[10rem] leading-none font-serif font-black text-amber-500 relative z-10 drop-shadow-2xl">
             {stats?.totalLidos}
           </motion.div>
           <div className="text-xl md:text-2xl font-serif font-bold text-neutral-100 uppercase tracking-[0.2em] relative z-10">
             Livros Lidos
           </div>
        </div>
        <div className="inline-flex items-center justify-center px-6 py-2.5 border border-neutral-700/50 bg-neutral-800/30 rounded-full backdrop-blur">
          <span className="text-sm md:text-base text-neutral-300 font-serif italic drop-shadow">
            Através de <span className="text-amber-500 font-bold not-italic">{formatPagesLong(stats?.totalPaginas || 0)}</span>
          </span>
        </div>
        <p className="text-neutral-300 text-lg md:text-xl font-serif italic max-w-sm mx-auto mt-2 leading-relaxed drop-shadow-md pb-4">
          Entre páginas e emoções, este foi o seu ano literário.
        </p>
      </div>
    ),
    bg: "bg-gradient-to-br from-amber-900/40 via-neutral-900 to-neutral-950"
  });

  if ((stats?.totalPaginas || 0) > 0) {
    slides.push({
      title: "Volume de Leitura",
      content: (
        <div className="text-center space-y-6 w-full h-full flex flex-col items-center justify-center">
          <FileText size={64} className="text-amber-500 mb-2 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" strokeWidth={1.5} />
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-7xl md:text-8xl font-bold text-neutral-100 tracking-tighter">
            {formatPages(stats?.totalPaginas || 0)}
          </motion.div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-neutral-100 uppercase tracking-widest">
            Páginas Lidas
          </div>
          {stats?.mediaPaginas ? (
            <p className="text-neutral-400 text-lg md:text-xl font-serif italic">Com média de {formatPages(stats.mediaPaginas)} páginas por obra.</p>
          ) : null}
        </div>
      ),
      bg: "bg-gradient-to-br from-indigo-900/40 via-neutral-900 to-neutral-950"
    });
  }

  if (stats?.mediaDiasParaConcluir && stats.mediaDiasParaConcluir > 0) {
    slides.push({
      title: "Ritmo de Fôlego",
      content: (
        <div className="text-center space-y-8 w-full h-full flex flex-col items-center justify-center px-4">
          <Zap size={64} className="text-purple-500 mb-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" strokeWidth={1.5} />
          <div className="space-y-1">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-7xl md:text-8xl font-black text-neutral-100 tracking-tighter">
              {stats.mediaDiasParaConcluir}
            </motion.div>
            <div className="text-xl md:text-2xl font-serif font-bold text-neutral-100 uppercase tracking-widest">
              Dias por Livro
            </div>
          </div>
          <div className="bg-neutral-800/40 border border-neutral-700/50 p-6 rounded-[2rem] backdrop-blur w-full max-w-[280px]">
            <p className="text-neutral-400 text-sm font-serif italic mb-2">Seus extremos de fôlego:</p>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-bold uppercase tracking-tighter">Mais Largo</span>
                <span className="text-amber-500 font-bold">{stats.maiorLivro?.pageCount} págs</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-bold uppercase tracking-tighter">Mais Curto</span>
                <span className="text-blue-500 font-bold">{stats.menorLivro?.pageCount} págs</span>
              </div>
            </div>
          </div>
        </div>
      ),
      bg: "bg-gradient-to-br from-purple-900/40 via-neutral-900 to-neutral-950"
    });
  }

  slides.push({
    title: "Retrato Literário",
    layout: 'hero',
    content: (
      <div className="w-full h-full flex flex-col items-center justify-center relative px-6">
        {isGenerating ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-500 font-serif italic">Tecendo sua jornada em palavras...</p>
          </div>
        ) : narratives.length > 0 ? (
          <div className="space-y-6 md:space-y-10 text-center w-full z-10">
            <Brain size={48} className="text-neutral-500/30 mx-auto mb-2" strokeWidth={1} />
            {narratives.map((text, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.4 }}
                className="text-lg md:text-2xl font-serif italic text-neutral-200 leading-relaxed font-medium"
              >
                "{text}"
              </motion.div>
            ))}
            <button 
              onClick={() => generateNarratives(true)}
              className="mt-8 text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] hover:text-amber-500 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={10} />
              Redefinir Narrativa
            </button>
          </div>
        ) : (
          <div className="text-center space-y-6 flex flex-col items-center justify-center z-10">
            <Brain size={64} className="text-neutral-700/50 mb-4" strokeWidth={1.5} />
            <p className="text-lg md:text-xl font-serif italic text-neutral-400 max-w-sm leading-relaxed">
              "Ainda não há dados suficientes para gerar um retrato mais profundo do seu ano literário. Continue lendo e avaliando!"
            </p>
          </div>
        )}
      </div>
    ),
    bg: "bg-gradient-to-br from-indigo-950/50 via-neutral-900 to-neutral-950"
  });

  slides.push({
    title: "Critério Pessoal",
    content: (
      <div className="text-center space-y-6 w-full h-full flex flex-col items-center justify-center">
        <div className="flex justify-center gap-2 md:gap-3 mb-2">
          {[1, 2, 3, 4, 5].map(s => (
            <Star 
              key={s} 
              size={56} 
              className={`${s <= Math.round(stats?.mediaGeral || 0) ? "text-amber-500 fill-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "text-neutral-800"} md:w-16 md:h-16`} 
              strokeWidth={1} 
            />
          ))}
        </div>
        <div className="text-7xl md:text-8xl font-bold text-neutral-100 tracking-tighter">
          {stats?.mediaGeral.toFixed(1)}
        </div>
        <p className="text-neutral-400 text-lg md:text-xl uppercase tracking-widest font-medium">de 5 estrelas</p>
        <p className="text-amber-500/80 text-base md:text-lg font-serif italic max-w-sm">
          Sua curadoria refletiu um gosto refinado e opiniões marcantes.
        </p>
      </div>
    ),
    bg: "bg-gradient-to-br from-blue-950/40 via-neutral-900 to-neutral-950"
  });
  if (stats?.autorMaisLido) {
    slides.push({
      title: "Voz Favorita",
      content: (
        <div className="text-center space-y-6 w-full h-full flex flex-col items-center justify-center">
          <User size={64} className="text-rose-500 mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" strokeWidth={1.5} />
          <p className="text-neutral-400 text-base md:text-lg mb-2 font-serif italic">O autor que mais te cativou nesta jornada</p>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-4xl md:text-6xl font-serif font-black text-neutral-100 leading-tight">
            {stats.autorMaisLido}
          </motion.div>
          <div className="text-xl md:text-2xl font-bold text-rose-500">
            {stats.autorLivros} {stats.autorLivros === 1 ? 'obra lida' : 'obras lidas'}
          </div>
        </div>
      ),
      bg: "bg-gradient-to-br from-rose-900/30 via-neutral-900 to-neutral-950"
    });
  }

  if (stats?.generoMaisLido) {
    slides.push({
      title: "Refúgio Literário",
      layout: 'hero',
      content: (
        <div className="text-center space-y-6 w-full h-full flex flex-col items-center justify-center">
          <Bookmark size={64} className="text-indigo-500 mb-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" strokeWidth={1.5} />
          <p className="text-neutral-400 text-base md:text-lg mb-2 font-serif italic">O gênero onde você sempre encontrou abrigo.</p>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-4xl md:text-6xl xl:text-7xl px-4 font-serif font-black text-neutral-100 uppercase text-balance text-center w-full break-words">
            {stats.generoMaisLido}
          </motion.div>
          <div className="text-xl md:text-2xl font-bold text-indigo-500">
            {stats.generoCount} {stats.generoCount === 1 ? 'história' : 'histórias'}
          </div>
        </div>
      ),
      bg: "bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-neutral-950"
    });
  }

  if (stats?.mesMaisAtivo) {
    slides.push({
      title: "Ápice Literário",
      layout: 'hero',
      content: (
        <div className="text-center space-y-6 w-full h-full flex flex-col items-center justify-center">
          <Calendar size={64} className="text-emerald-500 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" strokeWidth={1.5} />
          <p className="text-neutral-400 text-base md:text-lg mb-2 font-serif italic">O momento em que as páginas viraram mais rápido.</p>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-5xl md:text-7xl font-serif font-black text-neutral-100 uppercase">
            {stats.mesMaisAtivo}
          </motion.div>
          <div className="text-xl md:text-2xl font-bold text-emerald-500">
            {stats.mesLivros} {stats.mesLivros === 1 ? 'livro lido' : 'livros lidos'} num só mês
          </div>
        </div>
      ),
      bg: "bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-950"
    });
  }

  if (userGoal && (userGoal.booksGoal > 0 || userGoal.pagesGoal > 0)) {
    const booksPercent = userGoal.booksGoal > 0 ? Math.min(100, Math.round((stats.totalLidos / userGoal.booksGoal) * 100)) : 0;
    const pagesPercent = userGoal.pagesGoal > 0 ? Math.min(100, Math.round((stats.totalPaginas / userGoal.pagesGoal) * 100)) : 0;
    
    slides.push({
      title: "Metas e Conquistas",
      layout: 'hero',
      content: (
        <div className="text-center space-y-8 w-full max-w-md mx-auto h-full flex flex-col items-center justify-center">
          <Target size={64} className="text-blue-500 mb-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" strokeWidth={1.5} />
          
          {userGoal.booksGoal > 0 && (
            <div className="w-full space-y-2">
              <div className="flex justify-between text-neutral-300">
                <span className="font-medium">Livros</span>
                <span className="font-bold text-blue-500">{stats.totalLidos} / {userGoal.booksGoal}</span>
              </div>
              <div className="relative h-4 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${booksPercent}%` }} className={`absolute h-full rounded-full ${booksPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              </div>
              <p className="text-sm text-neutral-500 text-right">{booksPercent}% concluído</p>
            </div>
          )}

          {userGoal.pagesGoal > 0 && (
            <div className="w-full space-y-2 mt-4">
              <div className="flex justify-between text-neutral-300">
                <span className="font-medium">Páginas</span>
                <span className="font-bold text-indigo-500">{stats.totalPaginas} / {userGoal.pagesGoal}</span>
              </div>
              <div className="relative h-4 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pagesPercent}%` }} className={`absolute h-full rounded-full ${pagesPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
              </div>
              <p className="text-sm text-neutral-500 text-right">{pagesPercent}% concluído</p>
            </div>
          )}

          <div className="pt-4 text-xl md:text-2xl font-serif italic text-neutral-200">
            {booksPercent >= 100 && pagesPercent >= 100 ? "Um ano de promessas cumpridas!" : booksPercent >= 100 ? "Meta de livros alcançada!" : "Toda jornada tem seu ritmo."}
          </div>
        </div>
      ),
      bg: "bg-gradient-to-br from-blue-950/40 via-neutral-900 to-neutral-950"
    });
  }

  slides.push({
    title: "Obra-Prima",
    layout: 'wide',
    content: (
      <div className="flex flex-col md:flex-row items-center justify-center text-center md:text-left w-full h-full md:gap-16 px-4 md:px-12 py-6">
        <div className="md:flex-1 w-full max-w-[280px] md:max-w-none flex flex-col justify-center items-center md:items-end order-2 md:order-1 mt-6 md:mt-0">
          <p className="text-neutral-400 text-sm md:text-xl xl:text-2xl mb-4 md:mb-8 font-serif italic text-center md:text-right">
            Houve muitas histórias, mas esta ressoou mais alto.
          </p>
          <div className="space-y-4 w-full text-center md:text-right">
            <div className="inline-block px-5 py-2 mb-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest text-center shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              Melhor Livro do Ano
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-black text-neutral-100 leading-snug line-clamp-3 md:line-clamp-4">
              {stats?.melhorLivro?.titulo}
            </h3>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-neutral-400 font-serif italic line-clamp-2">
              por {stats?.melhorLivro?.autor}
            </p>
          </div>
        </div>
        
        <div className="relative group perspective-1000 md:flex-1 flex justify-center md:justify-start order-1 md:order-2 shrink-0">
          <div className="absolute inset-0 bg-amber-500/20 blur-[50px] rounded-full animate-pulse opacity-60 scale-150" />
          <motion.div 
            initial={{ rotateY: 15, rotateX: 5 }}
            animate={{ rotateY: 0, rotateX: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-40 h-60 sm:w-48 sm:h-72 md:w-64 md:h-96 lg:w-[320px] lg:h-[480px] rounded-lg md:rounded-2xl overflow-hidden border border-neutral-700/50 shadow-2xl relative z-10 bg-neutral-900 shrink-0"
          >
            {stats?.melhorLivro?.coverUrl || stats?.melhorLivro?.ilustracaoUrl ? (
              <CoverImage 
                coverUrl={stats?.melhorLivro?.coverUrl}
                coverSource={stats?.melhorLivro?.coverSource}
                fallbackUrl={stats?.melhorLivro?.ilustracaoUrl}
                alt={stats?.melhorLivro?.titulo || "Capa do livro"} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-neutral-800 bg-neutral-950 text-neutral-800">
                <BookOpen size={64} className="mb-4 text-neutral-700 opacity-50" />
                <div className="w-1/2 h-1 bg-neutral-800 rounded-full mb-2" />
                <div className="w-1/3 h-1 bg-neutral-800 rounded-full" />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    ),
    bg: "bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950/30"
  });

  if (stats?.bestQuote || stats?.melhorCitacao) {
    const quoteToDisplay = stats.bestQuote ? stats.bestQuote.text : (stats.melhorCitacao?.citacaoFavorita || '');
    const titleToDisplay = stats.bestQuote ? stats.bestQuote.bookTitle : (stats.melhorCitacao?.titulo || '');
    const authorToDisplay = stats.bestQuote ? stats.bestQuote.bookAuthor : (stats.melhorCitacao?.autor || '');

    slides.push({
      title: "Ecos da Leitura",
      layout: 'wide',
      content: (
        <div className="text-center space-y-6 w-full max-w-lg md:max-w-3xl mx-auto h-full flex flex-col items-center justify-center px-6">
          <BookOpen size={40} className="text-amber-500/30 mb-2 md:mb-6 shrink-0" strokeWidth={1} />
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-lg md:text-2xl lg:text-3xl font-serif italic text-neutral-100 leading-relaxed relative flex-1 min-h-[120px] max-h-[300px] overflow-hidden flex flex-col justify-center">
            <div className="relative inline-block w-full">
              <span className="text-3xl md:text-5xl text-amber-500/20 absolute -top-4 -left-6 md:-top-6 md:-left-8 font-sans">"</span>
              <div className="line-clamp-[8] md:line-clamp-6 text-balance break-words pb-2 whitespace-pre-wrap">
                {quoteToDisplay}
              </div>
              <span className="text-3xl md:text-5xl text-amber-500/20 absolute bottom-0 -right-4 font-sans leading-none translate-y-1/2">"</span>
            </div>
          </motion.div>
          <div className="mt-6 md:mt-8 text-neutral-400 shrink-0">
            <p className="font-bold text-amber-500 line-clamp-1">{titleToDisplay}</p>
            <p className="text-sm md:text-base line-clamp-1 truncate text-neutral-500 mt-1">{authorToDisplay}</p>
          </div>
        </div>
      ),
      bg: "bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950/20"
    });
  }

  slides.push({
    title: "Coleção de Afetos",
    layout: 'hero',
    content: (
      <div className="flex flex-col items-center justify-center text-center space-y-10 h-full">
        <div className="flex justify-center relative">
          <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full" />
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }} 
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="relative z-10"
          >
             <Heart size={140} className="text-rose-500 fill-rose-500/80 drop-shadow-xl" strokeWidth={1.5} />
             <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-white mix-blend-overlay">
               {stats?.favoritos}
             </div>
          </motion.div>
        </div>
        <div className="space-y-4">
          <div className="text-3xl md:text-4xl font-serif font-bold text-neutral-100">Favoritados</div>
          <p className="text-neutral-400 text-base md:text-lg max-w-sm mx-auto px-4 font-serif italic">
            Nem todo livro permanece. Estes, porém, ganharam morada em você.
          </p>
        </div>
      </div>
    ),
    bg: "bg-gradient-to-br from-rose-950/40 via-neutral-900 to-neutral-950"
  });

  slides.push({
    title: "A Elite do Ano",
    layout: 'wide',
    content: (
      <div className="w-full max-w-3xl mx-auto flex flex-col justify-center h-full px-4 md:px-8">
        <p className="text-neutral-400 text-sm md:text-lg lg:text-xl font-serif italic mb-6 md:mb-10 text-center w-full shrink-0">
          A curadoria dos momentos que mais ressoaram com você.
        </p>
        <div className="flex flex-col gap-3 md:gap-4 w-full flex-1 overflow-hidden justify-center min-h-0">
          {stats?.top5.map((book, i) => (
            <motion.div 
              key={book.id} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-4 p-3 md:p-4 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl md:rounded-[20px] shadow-lg text-left relative overflow-hidden transition-all shrink-0 ${
                i === 0 ? 'bg-gradient-to-r from-amber-950/40 via-neutral-900/60 to-neutral-900/60 border-amber-900/40 shadow-amber-900/5 md:flex-row' : ''
              }`}
            >
              {i === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-full" />}
              
              <div className={`font-serif font-black text-center shrink-0 pr-2 md:pr-4 flex items-center justify-center ${i === 0 ? 'text-4xl md:text-6xl text-amber-500 drop-shadow-md w-12 md:w-20 pl-2' : 'text-2xl md:text-4xl text-neutral-600 w-10 md:w-16'}`}>
                {i + 1}
              </div>
              
              <div className={`shrink-0 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700/50 shadow-md ${i === 0 ? 'w-16 h-24 md:w-20 md:h-32' : 'w-12 h-16 md:w-16 md:h-24'}`}>
                 {book.coverUrl || book.ilustracaoUrl ? (
                   <CoverImage 
                    coverUrl={book.coverUrl}
                    coverSource={book.coverSource}
                    fallbackUrl={book.ilustracaoUrl}
                    alt={book.titulo}
                    className="w-full h-full object-cover"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-neutral-600"><BookOpen size={i === 0 ? 32 : 20} className="opacity-50" /></div>
                 )}
              </div>
              
              <div className="flex-1 min-w-0 pr-2 md:pr-4 flex flex-col justify-center h-full">
                <div className={`font-bold text-neutral-100 truncate w-full tracking-tight ${i === 0 ? 'text-lg md:text-2xl mb-1' : 'text-base md:text-lg'}`}>
                  {book.titulo}
                </div>
                <div className={`text-neutral-400 truncate w-full font-serif italic ${i === 0 ? 'text-sm md:text-lg' : 'text-xs md:text-base'}`}>
                  por {book.autor}
                </div>
              </div>
              
              <div className={`flex flex-col items-center justify-center gap-1 font-bold bg-neutral-950/50 rounded-xl shrink-0 border border-neutral-800 ${i === 0 ? 'text-amber-500 px-3 md:px-4 py-2 md:py-3 text-sm md:text-lg shadow-inner' : 'text-amber-500/80 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm'}`}>
                <Star size={i === 0 ? 18 : 14} fill="currentColor" className={i===0 ? "drop-shadow-sm mb-0.5" : "mb-0.5"} />
                {book.notaGeral.toFixed(1)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    bg: "bg-gradient-to-br from-neutral-950 via-neutral-900/80 to-neutral-800"
  });

  if (literaryProfile?.estiloLeitor || stats?.generoMaisLido) {
    const readerTitle = literaryProfile?.estiloLeitor || `O Curador de ${stats?.generoMaisLido}`;
    slides.push({
      title: "Perfil Literário",
      content: (
        <div className="flex flex-col items-center justify-center text-center space-y-8 h-full w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
            <motion.div 
              initial={{ scale: 0.8, rotate: -5 }} 
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="bg-neutral-900 border border-neutral-700/50 shadow-2xl rounded-2xl p-8 relative z-10 w-64 md:w-80"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20">
                  <User size={32} />
                </div>
                <div className="text-sm font-bold tracking-widest text-neutral-500 uppercase">Perfil Detectado</div>
                <h3 className="text-2xl md:text-3xl font-serif font-black text-neutral-100">{readerTitle}</h3>
                {literaryProfile?.generoFavorito && (
                  <p className="text-sm text-neutral-400 mt-4 p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 italic">
                    Sua biblioteca respira <span className="text-amber-500">{literaryProfile.generoFavorito}</span>.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      ),
      bg: "bg-gradient-to-br from-neutral-900 via-neutral-950 to-amber-900/20"
    });
  }

  slides.push({
    title: "Epílogo",
    layout: 'hero',
    content: (
      <div className="flex flex-col items-center justify-center text-center h-full w-full relative">
        <div className="absolute inset-0 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="flex-1 flex flex-col items-center justify-center z-10 w-full mt-4">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border border-amber-500/30 bg-neutral-950/50 backdrop-blur shadow-[0_0_50px_rgba(245,158,11,0.1)] flex items-center justify-center mb-6 md:mb-8">
              <Logomark className="w-10 h-10 md:w-14 md:h-14" />
            </div>
            <div className="space-y-4 max-w-[280px] md:max-w-md px-4 mb-4">
               <h2 className="text-3xl md:text-5xl font-serif font-black text-neutral-100 leading-tight text-balance">
                O Próximo Capítulo Aguarda
              </h2>
              <div className="w-12 h-1 bg-amber-500/50 mx-auto rounded-full mt-6 mb-6" />
               <p className="text-lg md:text-2xl text-neutral-300 font-serif italic mb-2 leading-relaxed">
                Cada livro deixou um traço. Este foi o mapa do seu ano.
              </p>
            </div>
        </div>
        
        <div className={`w-full flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 px-6 md:px-12 mt-auto pb-4 md:mb-8 z-10 transition-opacity duration-300 ${isExporting ? 'opacity-0' : 'opacity-100'}`}>
          <button 
            onClick={handleShare}
            disabled={isExporting}
            className="w-full md:w-auto min-w-[220px] flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(245,158,11,0.2)] md:text-lg"
          >
            <Share2 size={20} className="shrink-0" />
            <span>Compartilhar</span>
          </button>
          
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="w-full md:w-auto min-w-[220px] flex items-center justify-center gap-2 px-6 py-4 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-white font-bold rounded-2xl transition-all disabled:opacity-50 shadow-xl md:text-lg"
          >
            <Download size={20} className="shrink-0" />
            <span>Salvar Imagem</span>
          </button>
          
          <Link 
            to="/comparativo-anual"
            className="w-full md:w-auto min-w-[220px] flex items-center justify-center gap-2 px-6 py-4 bg-neutral-800/80 backdrop-blur border border-neutral-700 hover:bg-neutral-700 text-amber-500 font-bold rounded-2xl transition-all shadow-xl md:text-lg"
          >
            <History size={20} className="shrink-0" />
            <span>Comparar Anos</span>
          </Link>
        </div>
      </div>
    ),
    bg: "bg-gradient-to-b from-neutral-900 via-neutral-950 to-amber-950/20"
  });

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      <div className="absolute top-8 left-8 flex items-center gap-4 z-20">
        <div className="bg-amber-500 text-neutral-950 p-2 rounded-lg">
          <BookOpen size={24} />
        </div>
        <div className="text-xl font-serif font-bold text-neutral-100">Readora Wrapped</div>
      </div>

      <div className="absolute top-8 right-8 flex items-center gap-2 z-20">
        <button 
          onClick={handleShare}
          disabled={isExporting}
          className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
          title="Compartilhar slide"
        >
          <Share2 size={20} />
        </button>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
          title="Baixar imagem"
        >
          <Download size={20} />
        </button>
        <button 
          onClick={() => window.history.back()}
          className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors ml-2"
        >
          Sair
        </button>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center relative px-2 md:px-12 pt-24 pb-8 min-h-0">
        <div className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-4 z-40">
           <button 
             onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
             disabled={currentSlide === 0}
             className="w-14 h-14 bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-full text-neutral-400 hover:text-white disabled:opacity-0 transition-all flex items-center justify-center hover:scale-110 shadow-xl"
           >
             <ChevronLeft size={28} />
           </button>
        </div>

        <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-4 z-40">
           <button 
             onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
             disabled={currentSlide === slides.length - 1}
             className="w-14 h-14 bg-amber-500/90 backdrop-blur text-neutral-950 border border-amber-400 rounded-full disabled:opacity-0 transition-all flex items-center justify-center hover:scale-110 hover:bg-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
           >
             <ChevronRight size={28} />
           </button>
        </div>

        <motion.div 
          layout
          ref={slideRef} 
          className="relative flex justify-center w-full shrink-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" 
          style={{ 
            maxWidth: slides[currentSlide].layout === 'wide' ? '1000px' : '420px',
            aspectRatio: window.innerWidth >= 768 ? (slides[currentSlide].layout === 'wide' ? '16/9' : '9/16') : '9/16',
            maxHeight: slides[currentSlide].layout === 'wide' ? 'min(75vh, 600px)' : 'min(75vh, 800px)' 
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute inset-0 rounded-[32px] md:rounded-[40px] p-6 pt-16 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-neutral-800/50 overflow-hidden ${slides[currentSlide].bg}`}
            >
              <div className="absolute top-6 md:top-10 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-amber-500/60 z-10 text-center w-full px-4">
                {slides[currentSlide].title}
              </div>
              {slides[currentSlide].content}
              
              {/* Optional tiny logo watermark on export */}
              <div className={`absolute bottom-6 font-serif italic text-[10px] text-neutral-500/40 transition-opacity duration-300 ${isExporting ? 'opacity-100' : 'opacity-0'}`}>
                Readora Wrapped {new Date().getFullYear()}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Progress Bars */}
        <div className="flex gap-2 w-full max-w-[360px] md:max-w-2xl mt-8 z-30">
          {slides.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentSlide(i)} 
              className="h-1.5 flex-1 rounded-full overflow-hidden relative cursor-pointer opacity-80 hover:opacity-100 transition-opacity" 
              title={`Ir para slide ${i + 1}`}
            >
              <div className="absolute inset-0 bg-neutral-800" />
              <motion.div 
                className="absolute inset-y-0 left-0 bg-amber-500"
                initial={false}
                animate={{ width: i <= currentSlide ? "100%" : "0%" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Navigation (Hidden on Desktop) */}
      <div className="flex md:hidden gap-4 mb-4 z-20 w-full px-6 justify-between max-w-[420px]">
        <button 
          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-400 hover:text-white disabled:opacity-0 transition-opacity"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlide === slides.length - 1}
          className="p-4 bg-amber-500 text-neutral-950 rounded-2xl hover:bg-amber-600 disabled:opacity-0 transition-opacity"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};
