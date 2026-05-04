import React, { useMemo } from 'react';
import { useBooks } from '../context/BookContext';
import { 
  Book as BookIcon, 
  Star, 
  BookOpen, 
  ChevronRight, 
  Plus, 
  Folder, 
  Sparkles, 
  BookMarked, 
  Library,
  Layers,
  Quote as QuoteIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  safeParseNumber, 
  formatPagesShort, 
} from '../lib/statsUtils';
import { Logomark } from '../components/Logomark';
import { analysisService } from '../services/analysisService';

const MOODS = ['Sombrio', 'Tenso', 'Reflexivo', 'Aconchegante', 'Emocional', 'Misterioso', 'Inspirador', 'Mágico'];

export const Dashboard: React.FC = () => {
  const { books, loading, shelves } = useBooks();
  const currentYear = new Date().getFullYear();

  // Diagnostic logs for development mode
  React.useEffect(() => {
    if (import.meta.env.DEV && !loading) {
      console.log('[Dashboard Diagnostic] Books:', books.length);
      console.log('[Dashboard Diagnostic] Shelves:', shelves.length);
      if (shelves.length === 0) {
        console.warn('[Dashboard Diagnostic] No shelves found for this user.');
      }
    }
  }, [loading, books, shelves]);

  const stats = useMemo(() => {
    if (loading) return null;
    
    const lidos = books.filter((b) => b.status === 'lido');
    const lidosEsteAno = lidos.filter(b => b.anoLeitura === currentYear);
    const paginasLidasEsteAno = lidosEsteAno.reduce((acc, b) => acc + safeParseNumber(b.pageCount), 0);
    
    const lendoAgora = books.filter(b => b.status === 'lendo');
    const maisAvancado = lendoAgora.length > 0 
      ? [...lendoAgora].sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0))[0] 
      : null;

    const mediaGeral = lidos.length > 0 
      ? lidos.reduce((acc, b) => acc + b.notaGeral, 0) / lidos.length 
      : 0;

    const melhorLivro = lidos.length > 0 
      ? lidos.reduce((prev, current) => (prev.notaGeral > current.notaGeral ? prev : current), lidos[0]) 
      : null;

    const autores = lidos.reduce((acc, b) => {
      acc[b.autor] = (acc[b.autor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const autorMaisLido = Object.keys(autores).length > 0 
      ? Object.keys(autores).reduce((a, b) => (autores[a] > autores[b] ? a : b)) 
      : '';

    const lidosComPaginas = lidos.filter(b => safeParseNumber(b.pageCount) > 0);
    const maiorLivro = lidosComPaginas.length > 0 
      ? lidosComPaginas.reduce((prev, curr) => (safeParseNumber(prev.pageCount) > safeParseNumber(curr.pageCount) ? prev : curr)) 
      : null;

    const ultimasLeituras = [...lidos].sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)).slice(0, 10);

    const moodShelves = MOODS.map(mood => {
      const moodBooks = books.filter(b => {
        const bookMoods = b.moods && b.moods.length > 0 ? b.moods : analysisService.inferMoods(b);
        return bookMoods.includes(mood);
      });
      return { mood, books: moodBooks.slice(0, 4), total: moodBooks.length };
    }).filter(shelf => shelf.books.length > 0);

    const allMoods = books.flatMap(b => b.moods && b.moods.length > 0 ? b.moods : analysisService.inferMoods(b));
    const moodCounts = allMoods.reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const atmosferaPredominante = Object.keys(moodCounts).length > 0 
      ? Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b) 
      : 'Equilibrada';

    const queroLer = books.filter(b => b.status === 'quero ler');
    const nextRead = [...queroLer].sort((a, b) => {
      const pMap = { high: 3, medium: 2, low: 1 };
      const pA = pMap[a.priority as 'low'|'medium'|'high'] || 0;
      const pB = pMap[b.priority as 'low'|'medium'|'high'] || 0;
      return pB !== pA ? pB - pA : (a.addedAt || 0) - (b.addedAt || 0);
    })[0];

    return { 
      totalLidos: lidos.length, 
      mediaGeral, 
      melhorLivro, 
      autorMaisLido, 
      moodShelves,
      totalLidosEsteAno: lidosEsteAno.length, 
      paginasLidasEsteAno, 
      lendoAgora,
      maisAvancado,
      maiorLivro,
      ultimasLeituras,
      atmosferaPredominante,
      nextRead,
      totalRegistrados: books.length
    };
  }, [books, loading, currentYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl animate-pulse">
          <Logomark />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-7xl mx-auto space-y-16 pb-24 px-4 sm:px-6 lg:px-8"
    >
      {/* 1. HERO PRINCIPAL - Elegant & Literary */}
      <header className="relative mt-8 py-20 lg:py-32 rounded-[4rem] bg-neutral-950 border border-neutral-800/40 overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.05),transparent_70%)]" />
        <div className="absolute -top-24 -right-24 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-1000">
           <BookOpen size={500} className="rotate-12" />
        </div>

        <div className="relative z-10 text-center space-y-8 px-6">
          <div className="space-y-4">
             <div className="flex items-center justify-center gap-4 opacity-40">
                <div className="w-8 h-px bg-neutral-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-neutral-400">Readora — Literary Journal</span>
                <div className="w-8 h-px bg-neutral-500" />
             </div>
             <h1 className="text-6xl md:text-8xl font-serif font-black text-neutral-100 tracking-tighter">Readora</h1>
             <div className="max-w-xl mx-auto flex gap-4 items-start justify-center text-neutral-500 font-serif italic text-lg leading-relaxed">
               <QuoteIcon size={18} className="shrink-0 mt-1 opacity-20" />
               <p>"Os livros são uma forma única de magia portátil." — Stephen King</p>
             </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link 
              to="/adicionar" 
              className="bg-neutral-100 hover:bg-amber-400 text-neutral-950 px-10 py-4 rounded-full font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 active:scale-95 shadow-2xl hover:shadow-amber-500/10"
            >
              <Plus size={14} strokeWidth={3} /> Nova Jornada
            </Link>
            <Link 
              to="/livros" 
              className="bg-neutral-900/50 hover:bg-neutral-800 text-neutral-100 px-10 py-4 rounded-full font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 border border-neutral-800 active:scale-95 shadow-xl"
            >
              <Library size={14} strokeWidth={3} /> Biblioteca
            </Link>
          </div>
        </div>
      </header>

      {/* 2. CORE CARDS - Literary Summary */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <CoreStatCard label={`Obras em ${currentYear}`} value={stats.totalLidosEsteAno} />
        <CoreStatCard label="Páginas do Ciclo" value={formatPagesShort(stats.paginasLidasEsteAno)} />
        <CoreStatCard label="Média Crítica" value={stats.mediaGeral.toFixed(1)} isRating />
        <CoreStatCard 
          label="Em Foco" 
          value={stats.maisAvancado?.titulo || stats.ultimasLeituras[0]?.titulo || '—'} 
          isText 
        />
      </section>

      {/* 3. CONTINUAR LEITURA / PRÓXIMA JORNADA - Compact & Focused */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <JourneyCard 
          title="Continuar Leitura" 
          accent="bg-emerald-500" 
          book={stats.maisAvancado} 
          type="active" 
        />
        <JourneyCard 
          title="Próxima Jornada" 
          accent="bg-blue-500" 
          book={stats.nextRead} 
          type="next" 
          queueCount={books.filter(b => b.status === 'quero ler').length}
        />
      </section>

      {/* 4. ÚLTIMAS LEITURAS - horizontal bookstore gallery */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-serif font-black text-neutral-100 italic tracking-tight flex items-center gap-3">
             <div className="w-1 h-6 bg-amber-500 rounded-full" />
             Últimas Leituras
          </h2>
          <Link to="/livros?status=lido" className="text-[10px] font-black text-neutral-500 hover:text-amber-500 transition-colors uppercase tracking-widest flex items-center gap-1">
            Minha Coleção <ChevronRight size={14} />
          </Link>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 no-scrollbar">
          {stats.ultimasLeituras.map(book => (
            <Link key={book.id} to={`/livro/${book.id}`} className="w-36 shrink-0 group space-y-3">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-xl group-hover:-translate-y-2 group-hover:border-amber-500/30 transition-all duration-500">
                {book.coverUrl ? (
                  <img src={book.coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-800"><BookIcon size={32} /></div>
                )}
              </div>
              <div className="px-1">
                <h4 className="font-bold text-neutral-200 text-xs line-clamp-1 group-hover:text-amber-500 transition-colors uppercase tracking-tight">{book.titulo}</h4>
                <div className="flex items-center gap-1 text-amber-500 mt-1">
                  <Star size={10} fill="currentColor" />
                  <span className="text-[10px] font-black">{book.notaGeral.toFixed(1)}</span>
                </div>
              </div>
            </Link>
          ))}
          {stats.ultimasLeituras.length === 0 && (
            <div className="w-full py-16 bg-neutral-900/10 rounded-[3rem] border border-dashed border-neutral-800 flex items-center justify-center text-neutral-600 font-serif italic">
               Sua estante de finalizados aguarda a primeira obra.
            </div>
          )}
        </div>
      </section>

      {/* 5. MINHAS ESTANTES - Beautifully corrected and integrated */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-serif font-black text-neutral-100 italic tracking-tight flex items-center gap-3">
             <div className="w-1 h-6 bg-purple-500 rounded-full" />
             Minhas Estantes
          </h2>
          <Link to="/estantes" className="text-[10px] font-black text-neutral-500 hover:text-purple-500 transition-colors uppercase tracking-widest flex items-center gap-1">
            Ver todas <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shelves.length > 0 ? (
            shelves.slice(0, 4).map(shelf => (
              <ShelfCard key={shelf.id} shelf={shelf} books={books.filter(b => shelf.bookIds.includes(b.id))} />
            ))
          ) : (
            <div className="lg:col-span-4 p-12 bg-neutral-950/20 rounded-[3rem] border border-dashed border-neutral-800 text-center space-y-4">
              <Layers className="mx-auto text-neutral-800" size={32} />
              <p className="text-neutral-500 font-serif italic">Suas coleções personalizadas ganharão vida em breve.</p>
              <Link to="/estantes" className="inline-block text-[10px] font-black text-purple-500 uppercase tracking-widest">Organizar agora</Link>
            </div>
          )}
        </div>
      </section>

      {/* 6. ATMOSFERAS - mood-based discovery */}
      <section className="space-y-8">
        <h2 className="text-2xl font-serif font-black text-neutral-100 italic tracking-tight px-2 flex items-center gap-3">
           <div className="w-1 h-6 bg-rose-500 rounded-full" />
           Atmosferas
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 no-scrollbar">
          {stats.moodShelves.map(shelf => (
            <div key={shelf.mood} className="shrink-0 w-60 bg-neutral-900/30 border border-neutral-800/40 rounded-[2.5rem] p-8 flex flex-col gap-6 group hover:bg-neutral-900/50 transition-all">
              <div className="flex justify-between items-center">
                <h4 className="font-serif font-black italic text-neutral-100 uppercase tracking-tight">{shelf.mood}</h4>
                <span className="text-[9px] font-black text-rose-500">{shelf.total}</span>
              </div>
              <div className="flex -space-x-3">
                {shelf.books.map((b, i) => (
                  <div key={b.id} className="w-10 h-14 rounded-lg bg-neutral-950 border-2 border-neutral-900 overflow-hidden shadow-2xl group-hover:-translate-y-1 transition-transform" style={{ zIndex: 10 - i }}>
                    {b.coverUrl && <img src={b.coverUrl} className="w-full h-full object-cover" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. RETRATO LITERÁRIO & 8. CÁPSULA (Merged for vertical density) */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-neutral-900/40 border border-neutral-800/40 rounded-[3.5rem] p-12 lg:p-16 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 opacity-[0.01] pointer-events-none group-hover:opacity-[0.02] transition-opacity duration-700">
             <Sparkles size={200} />
           </div>
           <header className="mb-10">
              <h2 className="text-4xl font-serif font-black italic text-neutral-100 mb-4 tracking-tight">Retrato Literário</h2>
              <p className="text-neutral-500 font-serif italic max-w-sm">A essência da sua caminhada entre páginas e narrativas.</p>
           </header>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PortraitItem label="Mestre das Palavras" value={stats.autorMaisLido || '—'} />
              <PortraitItem label="Aura Dominante" value={stats.atmosferaPredominante} />
              <PortraitItem label="Obra Prima" value={stats.melhorLivro?.titulo || '—'} />
              <PortraitItem label="Vastidão" value={stats.maiorLivro ? formatPagesShort(safeParseNumber(stats.maiorLivro.pageCount)) : '—'} />
           </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
           <div className="flex-1 bg-amber-500 p-10 rounded-[3.5rem] flex flex-col justify-between group overflow-hidden relative shadow-2xl shadow-amber-500/10">
              <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <Sparkles size={200} className="text-neutral-950" />
              </div>
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 bg-neutral-950 rounded-2xl flex items-center justify-center text-amber-500 shadow-xl">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-4xl font-serif font-black italic tracking-tighter text-neutral-950 leading-none">Cápsula Mensal</h3>
                <p className="text-neutral-900/60 font-serif italic text-lg leading-tight">Reviva suas memórias deste ciclo em uma composição única.</p>
              </div>
              <Link 
                to="/capsula" 
                className="mt-8 bg-neutral-950 text-white py-4 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all shadow-xl"
              >
                Gerar Cápsula <ChevronRight size={14} />
              </Link>
           </div>
           <div className="bg-neutral-900/60 border border-neutral-800/60 p-8 rounded-[2.5rem] flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400">
                   <Library size={18} />
                 </div>
                 <div>
                   <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Acervo Total</p>
                   <p className="text-xl font-black text-neutral-100">{stats.totalRegistrados} Livros</p>
                 </div>
              </div>
              <div className="text-neutral-700">/</div>
              <div className="text-right">
                 <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Horizontes</p>
                 <p className="text-xl font-black text-neutral-100">{stats.totalLidos} Lidos</p>
              </div>
           </div>
        </div>
      </section>
    </motion.div>
  );
};

const CoreStatCard = ({ label, value, isRating, isText }: any) => (
  <div className="bg-neutral-950/40 border border-neutral-800/40 p-8 rounded-[2.5rem] hover:border-neutral-700/60 transition-all flex flex-col gap-4">
    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em]">{label}</p>
    <div className="flex items-baseline gap-2 overflow-hidden">
      <span className={`text-4xl font-black tracking-tighter truncate leading-none ${isRating ? 'text-amber-500' : 'text-neutral-100'} ${isText ? 'text-lg italic font-serif' : ''}`}>
        {value}
      </span>
    </div>
  </div>
);

const JourneyCard = ({ title, accent, book, type, queueCount }: any) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-serif font-black text-neutral-100 italic tracking-tight px-1 flex items-center gap-3">
       <div className={`w-1 h-6 ${accent} rounded-full`} />
       {title}
    </h2>
    {book ? (
      <Link 
        to={`/livro/${book.id}`}
        className="flex gap-8 p-8 bg-neutral-950 border border-neutral-800/60 rounded-[3rem] hover:border-neutral-600 transition-all group shadow-2xl"
      >
        <div className="w-28 h-40 rounded-xl overflow-hidden bg-neutral-900 shrink-0 shadow-2xl group-hover:scale-105 transition-transform duration-700">
          {book.coverUrl ? (
            <img src={book.coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-800"><BookIcon size={32} /></div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <span className={`text-[9px] font-black uppercase mb-2 tracking-widest ${type === 'active' ? 'text-emerald-500' : 'text-blue-500'}`}>
            {type === 'active' ? `${book.progressPercentage || 0}% de Progresso` : 'Indicado para Início'}
          </span>
          <h3 className="text-2xl font-serif font-black text-neutral-100 line-clamp-1 mb-1 tracking-tight italic uppercase">{book.titulo}</h3>
          <p className="text-neutral-500 font-serif italic mb-6">{book.autor}</p>
          {type === 'active' && (
            <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
              <div className={`h-full ${accent} rounded-full transition-all duration-1000`} style={{ width: `${book.progressPercentage || 0}%` }} />
            </div>
          )}
        </div>
      </Link>
    ) : (
      <div className="p-12 border border-dashed border-neutral-800 rounded-[3rem] text-center space-y-4 bg-neutral-950/20">
         <BookOpen size={32} className="text-neutral-800 mx-auto opacity-20" />
         <p className="text-neutral-600 font-serif italic">Nenhuma obra em foco nesta categoria.</p>
         {type === 'next' && queueCount === 0 && (
           <Link to="/procurar" className="inline-block text-[9px] font-black text-blue-500 uppercase tracking-widest">Encontrar nova jornada</Link>
         )}
      </div>
    )}
  </div>
);

const ShelfCard = ({ shelf, books }: any) => (
  <Link 
    to={`/estante/${shelf.id}`}
    className="group bg-neutral-950/30 border border-neutral-800/40 rounded-[2.5rem] p-8 hover:bg-neutral-950/50 hover:border-purple-500/20 transition-all flex flex-col gap-6 shadow-xl"
  >
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-purple-500/30 transition-all shadow-inner">
        <Folder size={16} style={{ color: shelf.accentColor || '#a855f7' }} />
      </div>
      <span className="text-[10px] font-black uppercase text-neutral-600 font-mono tracking-widest">{shelf.bookIds.length}</span>
    </div>
    <div className="space-y-1">
      <h4 className="text-lg font-serif font-black italic text-neutral-300 uppercase tracking-tight group-hover:text-purple-500 transition-colors line-clamp-1">{shelf.name}</h4>
      <p className="text-[11px] text-neutral-600 font-serif italic line-clamp-2 leading-relaxed">
        {shelf.description || "Curadoria pessoal organizada por temas e sentimentos."}
      </p>
    </div>
    <div className="flex -space-x-3 mt-auto">
      {books.slice(0, 4).map((b: any, i: number) => (
        <div key={i} className="w-10 h-14 rounded-lg bg-neutral-950 border-2 border-neutral-900 shadow-2xl transform group-hover:rotate-6 transition-transform">
          {b.coverUrl && <img src={b.coverUrl} className="w-full h-full object-cover" />}
        </div>
      ))}
    </div>
  </Link>
);

const PortraitItem = ({ label, value }: any) => (
  <div className="bg-neutral-950/60 p-6 rounded-3xl border border-neutral-800/40 group/item hover:border-amber-500/20 transition-all">
    <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-3">{label}</p>
    <p className="text-xl font-serif font-black italic text-neutral-200 line-clamp-1 group-hover/item:text-amber-500 transition-colors uppercase tracking-tight">{value}</p>
  </div>
);
