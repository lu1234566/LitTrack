import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useBooks } from '../context/BookContext';
import { useGoals } from '../context/GoalsContext';
import { useLiteraryProfile } from '../context/LiteraryProfileContext';
import { aiService } from '../services/aiService';
import { BookOpen, Star, Award, Calendar, TrendingUp, Heart, ChevronRight, ChevronLeft, Share2, Download, Brain, User, Target, Bookmark, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logomark } from '../components/Logomark';
import { formatPagesLong, formatPages } from '../lib/statsUtils';
import { CoverImage } from '../components/CoverImage';
import { toPng, toBlob } from 'html-to-image';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const Retrospective: React.FC = () => {
  const { books, loading } = useBooks();
  const { userGoal } = useGoals();
  const { literaryProfile } = useLiteraryProfile();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [narratives, setNarratives] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

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
    
    // Total pages in retrospective
    const totalPaginas = lidos.reduce((acc, b) => acc + (Number(b.pageCount) || 0), 0);
    const mediaPaginas = totalLidos > 0 ? Math.round(totalPaginas / totalLidos) : 0;

    const citacoes = lidos.filter(b => b.citacaoFavorita && b.citacaoFavorita.length > 5);
    // Find the longest or best quote
    const melhorCitacao = citacoes.length > 0 ? [...citacoes].sort((a, b) => (b.notaGeral - a.notaGeral))[0] : null;

    const top5 = [...lidos].sort((a, b) => b.notaGeral - a.notaGeral).slice(0, 5);

    return { 
      totalLidos, mediaGeral, melhorLivro, piorLivro, 
      autorMaisLido, autorLivros: autores[autorMaisLido] || 0,
      generoMaisLido, generoCount: generos[generoMaisLido] || 0,
      mesMaisAtivo, mesLivros: meses[mesMaisAtivo] || 0,
      favoritos: favoritados, 
      totalPaginas, mediaPaginas,
      melhorCitacao,
      top5 
    };
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

  const slides = [];

  slides.push({
    title: "Como foi seu ano?",
    content: (
      <div className="text-center space-y-4 md:space-y-6 flex flex-col items-center h-full justify-center">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-7xl md:text-8xl font-serif font-black text-amber-500 mb-2 drop-shadow-lg">
          {stats?.totalLidos}
        </motion.div>
        <div className="text-2xl md:text-3xl font-serif font-bold text-neutral-100 uppercase tracking-widest">
          Livros Lidos
        </div>
        <div className="text-lg md:text-xl font-medium text-amber-500/80">
          e {formatPagesLong(stats?.totalPaginas || 0)}
        </div>
        <p className="text-neutral-400 text-base md:text-lg max-w-xs mx-auto mt-6">
          Você explorou novos mundos e viveu mil vidas este ano.
        </p>
      </div>
    ),
    bg: "bg-gradient-to-br from-amber-900/40 via-neutral-900 to-neutral-950"
  });

  if ((stats?.totalPaginas || 0) > 0) {
    slides.push({
      title: "Sua Maratona",
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
            <p className="text-neutral-400 text-lg md:text-xl uppercase tracking-widest font-medium">Média de {formatPages(stats.mediaPaginas)} por livro</p>
          ) : null}
        </div>
      ),
      bg: "bg-gradient-to-br from-indigo-900/40 via-neutral-900 to-neutral-950"
    });
  }

  slides.push({
    title: "A Essência do Seu Ano",
    content: (
      <div className="w-full h-full flex flex-col items-center justify-center relative px-6">
        {narratives.length > 0 ? (
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
    title: "Seu Nível de Exigência",
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
        <p className="text-amber-500/80 text-base max-w-xs">
          Seu ano literário foi marcado por curiosidade, seletividade e opiniões fortes.
        </p>
      </div>
    ),
    bg: "bg-gradient-to-br from-blue-950/40 via-neutral-900 to-neutral-950"
  });
  if (stats?.autorMaisLido) {
    slides.push({
      title: "Autor do Ano",
      content: (
        <div className="text-center space-y-6 w-full h-full flex flex-col items-center justify-center">
          <User size={64} className="text-rose-500 mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" strokeWidth={1.5} />
          <p className="text-neutral-400 text-base md:text-lg mb-2 uppercase tracking-widest">A voz que mais ecoou</p>
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
      title: "Gênero do Ano",
      content: (
        <div className="text-center space-y-6 w-full h-full flex flex-col items-center justify-center">
          <Bookmark size={64} className="text-indigo-500 mb-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" strokeWidth={1.5} />
          <p className="text-neutral-400 text-base md:text-lg mb-2 uppercase tracking-widest">Sua zona de conforto literária</p>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-5xl md:text-7xl font-serif font-black text-neutral-100 uppercase">
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
      title: "Mês Mais Intenso",
      content: (
        <div className="text-center space-y-6 w-full h-full flex flex-col items-center justify-center">
          <Calendar size={64} className="text-emerald-500 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" strokeWidth={1.5} />
          <p className="text-neutral-400 text-base md:text-lg mb-2 uppercase tracking-widest">Quando a leitura decolou</p>
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
      title: "Suas Metas",
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
    title: "A Leitura do Ano",
    content: (
      <div className="flex flex-col items-center justify-center text-center w-full max-w-md mx-auto h-full space-y-6 md:space-y-8">
        <p className="text-neutral-400 text-base md:text-lg mb-2">
          Houve muitas histórias, mas esta ressoou mais alto.
        </p>
        <div className="relative group perspective-1000 mt-4 md:mt-0">
          <div className="absolute -inset-8 bg-amber-500/20 blur-3xl rounded-full animate-pulse opacity-70" />
          <motion.div 
            initial={{ rotateY: 15, rotateX: 5 }}
            animate={{ rotateY: 0, rotateX: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-48 h-72 md:w-56 md:h-80 rounded-lg overflow-hidden border border-neutral-700/50 shadow-2xl relative z-10 bg-neutral-900"
          >
            {stats?.melhorLivro?.coverUrl || stats?.melhorLivro?.ilustracaoUrl ? (
              <CoverImage 
                coverUrl={stats?.melhorLivro?.coverUrl}
                coverSource={stats?.melhorLivro?.coverSource}
                fallbackUrl={stats?.melhorLivro?.ilustracaoUrl}
                alt={stats?.melhorLivro?.titulo} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-neutral-800 text-neutral-700">
                <BookOpen size={48} />
              </div>
            )}
          </motion.div>
        </div>
        <div className="space-y-3 px-4 w-full">
          <div className="inline-block px-4 py-1.5 mb-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest">
            A Obra-Prima
          </div>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-neutral-100 line-clamp-2 leading-tight">
            {stats?.melhorLivro?.titulo}
          </h3>
          <p className="text-base md:text-xl text-neutral-400 font-serif italic truncate">
            por {stats?.melhorLivro?.autor}
          </p>
        </div>
      </div>
    ),
    bg: "bg-gradient-to-br from-amber-900/30 via-neutral-900 to-neutral-950"
  });

  if (stats?.melhorCitacao) {
    slides.push({
      title: "Palavras que Ficam",
      content: (
        <div className="text-center space-y-6 w-full max-w-2xl mx-auto h-full flex flex-col items-center justify-center px-4">
          <BookOpen size={48} className="text-amber-500/50 mb-4" strokeWidth={1} />
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-xl md:text-3xl font-serif italic text-neutral-100 leading-relaxed relative">
            <span className="text-4xl text-amber-500/30 absolute -top-4 -left-6">"</span>
            {stats.melhorCitacao.citacaoFavorita}
            <span className="text-4xl text-amber-500/30 absolute -bottom-4 -right-6">"</span>
          </motion.div>
          <div className="mt-8 text-neutral-400">
            <p className="font-bold text-amber-500">{stats.melhorCitacao.titulo}</p>
            <p className="text-sm">{stats.melhorCitacao.autor}</p>
          </div>
        </div>
      ),
      bg: "bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950/20"
    });
  }

  slides.push({
    title: "Amor à Primeira Página",
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
          <p className="text-neutral-400 text-base md:text-lg max-w-sm mx-auto px-4">
            Nem todo livro fica. Estas foram as histórias que se provaram inesquecíveis.
          </p>
        </div>
      </div>
    ),
    bg: "bg-gradient-to-br from-rose-950/40 via-neutral-900 to-neutral-950"
  });

  slides.push({
    title: "Os Inesquecíveis",
    content: (
      <div className="w-full max-w-md md:max-w-xl mx-auto flex flex-col justify-center h-full text-center">
        <p className="text-neutral-400 text-base md:text-lg font-serif italic mb-6">
          Sua curadoria pessoal dos melhores momentos literários do ano.
        </p>
        <div className="space-y-3">
          {stats?.top5.map((book, i) => (
            <motion.div 
              key={book.id} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 + 0.3 }}
              className="flex items-center gap-4 py-2 md:p-3 bg-neutral-900/40 md:bg-neutral-900/60 border border-neutral-800/80 rounded-2xl md:rounded-xl shadow-lg px-3 text-left"
            >
              <div className="text-xl md:text-3xl font-serif font-black text-amber-500/50 w-6 md:w-8 shrink-0 text-center">
                {i + 1}
              </div>
              <div className="w-10 h-14 md:w-12 md:h-16 shrink-0 rounded overflow-hidden bg-neutral-800 border border-neutral-700/50">
                 {book.coverUrl || book.ilustracaoUrl ? (
                   <CoverImage 
                    coverUrl={book.coverUrl}
                    coverSource={book.coverSource}
                    fallbackUrl={book.ilustracaoUrl}
                    alt={book.titulo}
                    className="w-full h-full object-cover"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-neutral-600"><BookOpen size={16} /></div>
                 )}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-neutral-100 truncate text-sm md:text-base leading-tight md:leading-normal">
                  {book.titulo}
                </div>
                <div className="text-xs md:text-sm text-neutral-400 truncate mt-0.5 md:mt-0 text-ellipsis">
                  {book.autor}
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-500/10 px-2 py-1.5 md:py-1 rounded-lg text-xs shrink-0 self-center border border-amber-500/10">
                <Star size={12} fill="currentColor" />
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
      title: "Sua Identidade",
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
                    Tendência marcada por <span className="text-amber-500">{literaryProfile.generoFavorito}</span>.
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
    title: "Fim da Jornada",
    content: (
      <div className="flex flex-col items-center justify-center text-center h-full w-full">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-amber-500/20 bg-neutral-900 shadow-[0_0_40px_rgba(245,158,11,0.15)] flex items-center justify-center mb-6">
          <BookOpen size={48} className="text-amber-500" strokeWidth={1.5} />
        </div>
        <div className="space-y-4 max-w-sm px-4 mb-10">
          <h2 className="text-3xl md:text-5xl font-serif font-black text-neutral-100 leading-tight">
            Apenas o Começo
          </h2>
          <div className="w-12 h-1 bg-amber-500 mx-auto rounded-full mt-4 mb-6" />
          <p className="text-lg md:text-xl text-neutral-300 font-serif italic mb-2">
            Seu ano foi marcante.
          </p>
          <p className="text-sm md:text-base text-neutral-500">
            Continue explorando, porque a próxima história já está esperando.
          </p>
        </div>
        
        <div className={`flex flex-col w-full gap-3 px-8 mt-auto mb-8 transition-opacity duration-300 ${isExporting ? 'opacity-0' : 'opacity-100'}`}>
          <button 
            onClick={handleShare}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl transition-all disabled:opacity-50"
          >
            <Share2 size={20} />
            Compartilhar Retrospectiva
          </button>
          
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl border border-neutral-700 transition-all disabled:opacity-50"
          >
            <Download size={20} />
            Baixar como Imagem
          </button>
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

      <div className="flex-1 w-full flex flex-col items-center justify-center relative px-2 pt-24 pb-8 min-h-0">
        <div 
          ref={slideRef} 
          className="relative flex justify-center w-full max-w-[420px] aspect-[9/16] shrink-0" 
          style={{ maxHeight: 'min(75vh, 800px)' }}
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
        </div>

        {/* Progress Bars */}
        <div className="flex gap-2 w-full max-w-[360px] md:max-w-[420px] mt-6 z-30">
          {slides.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentSlide(i)} 
              className="h-1.5 flex-1 rounded-full overflow-hidden relative cursor-pointer" 
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

      <div className="flex gap-4 mb-4 z-20">
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
