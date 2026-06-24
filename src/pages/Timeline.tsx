import React, { useMemo, useState } from 'react';
import { useBooks } from '../context/BookContext';
import { useQuotes } from '../context/QuotesContext';
import { analysisService } from '../services/analysisService';
import { Book as BookIcon, Star, Calendar, ChevronRight, ChevronDown, Award, FileText, TrendingUp, PlusCircle, Filter, Quote as QuoteIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { safeParseNumber, formatPages, formatPagesShort } from '../lib/statsUtils';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const Timeline: React.FC = () => {
  const { books, loading } = useBooks();
  const { quotes } = useQuotes();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const lidos = useMemo(() => books.filter(b => b.status === 'lido'), [books]);

  const years = useMemo(() => {
    const yearsSet = new Set<number>();
    lidos.forEach(b => yearsSet.add(b.anoLeitura));
    if (yearsSet.size === 0) yearsSet.add(new Date().getFullYear());
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [lidos]);

  const timelineData = useMemo(() => {
    const data = MONTHS.map(month => {
      const monthBooks = lidos.filter(b => b.mesLeitura === month && b.anoLeitura === selectedYear);
      
      if (monthBooks.length === 0) return null;

      const totalPages = monthBooks.reduce((acc, b) => acc + safeParseNumber(b.pageCount), 0);
      const avgRating = monthBooks.reduce((acc, b) => acc + b.notaGeral, 0) / monthBooks.length;
      
      // Highlights
      const bestBook = [...monthBooks].sort((a, b) => b.notaGeral - a.notaGeral)[0];
      const longestBook = [...monthBooks].sort((a, b) => safeParseNumber(b.pageCount) - safeParseNumber(a.pageCount))[0];
      
      const genres = monthBooks.reduce((acc, b) => {
        acc[b.genero] = (acc[b.genero] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topGenre = Object.keys(genres).reduce((a, b) => genres[a] > genres[b] ? a : b);

      // Mood & Summary
      const dominantMood = analysisService.getMonthlyMood(monthBooks);
      const summary = analysisService.generateMonthlySummary(month, monthBooks);

      // Quote for the month
      const monthBookIds = monthBooks.map(b => b.id);
      const monthQuote = quotes.find(q => monthBookIds.includes(q.bookId));

      return {
        month,
        books: monthBooks,
        stats: {
          count: monthBooks.length,
          pages: totalPages,
          avgRating: avgRating.toFixed(1)
        },
        highlights: {
          bestBook,
          longestBook,
          topGenre,
          dominantMood,
          summary,
          quote: monthQuote
        }
      };
    }).filter(Boolean);

    return data.reverse(); // Show most recent months first
  }, [lidos, selectedYear, quotes]);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin text-amber-500">
          <BookIcon size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight flex items-center gap-3">
            <Calendar size={36} className="text-amber-500" />
            Linha do Tempo
          </h1>
          <p className="text-neutral-400 mt-2 text-lg">Sua jornada literária mês a mês.</p>
        </div>

        <div className="flex items-center gap-3 bg-neutral-900/50 p-1.5 rounded-2xl border border-neutral-800">
          <Filter size={18} className="ml-3 text-neutral-500" />
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-neutral-200 font-medium px-3 py-2 focus:outline-none cursor-pointer"
          >
            {years.map(year => (
              <option key={year} value={year} className="bg-neutral-900">{year}</option>
            ))}
          </select>
        </div>
      </header>

      {timelineData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-3xl">
          <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-600">
            <BookIcon size={40} />
          </div>
          <div>
            <h3 className="text-xl font-medium text-neutral-200">Sua linha do tempo ainda está vazia em {selectedYear}.</h3>
            <p className="text-neutral-500 mt-2 max-w-xs mx-auto">Marque livros como "Lido" para começar a construir sua história.</p>
          </div>
          <Link 
            to="/adicionar" 
            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <PlusCircle size={20} />
            Adicionar Leitura
          </Link>
        </div>
      ) : (
        <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-800 before:to-transparent">
          {timelineData.map((data, index) => (
            <motion.div 
              key={data!.month}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
            >
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-neutral-800 bg-neutral-950 text-amber-500 shadow-xl z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 top-0 md:top-8">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>

              {/* Content */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ml-16 md:ml-0 bg-neutral-900/40 border border-neutral-800/60 rounded-[2.5rem] p-8 shadow-2xl hover:border-neutral-700/50 transition-all relative overflow-hidden group/card">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/card:opacity-10 transition-opacity">
                   <Sparkles size={120} className="text-neutral-100" />
                </div>

                <div className="flex flex-col mb-8 relative z-10">
                   <div className="flex items-center justify-between">
                     <h2 className="text-4xl font-serif font-black text-neutral-100 tracking-tighter">{data!.month}</h2>
                     <button 
                        onClick={() => toggleMonth(data!.month)}
                        className="p-3 rounded-2xl bg-neutral-950/50 hover:bg-neutral-800 text-neutral-400 transition-colors border border-neutral-800"
                      >
                        {expandedMonths[data!.month] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </button>
                   </div>
                   
                   <p className="text-sm text-neutral-400 font-serif italic mt-3 leading-relaxed max-w-[90%]">
                     "{data!.highlights.summary}"
                   </p>

                   <div className="flex flex-wrap items-center gap-3 mt-6">
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-amber-500/20">
                        {data!.highlights.dominantMood}
                      </span>
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                        <BookIcon size={12} className="text-neutral-600" />
                        {data!.stats.count} {data!.stats.count === 1 ? 'LIVRO' : 'LIVROS'}
                      </span>
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText size={12} className="text-neutral-600" />
                        {formatPagesShort(data!.stats.pages)} PÁGS
                      </span>
                   </div>
                </div>

                {/* Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 relative z-10">
                  <div className="bg-neutral-950/40 border border-neutral-800/40 rounded-2xl p-4 flex items-center gap-4 group/item hover:bg-neutral-950/60 transition-colors">
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-neutral-800 shrink-0 shadow-lg border border-neutral-700/50">
                       {data!.highlights.bestBook.coverUrl ? (
                         <img src={data!.highlights.bestBook.coverUrl} alt="Best" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-neutral-700"><BookIcon size={20} /></div>
                       )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-black text-amber-500/80 tracking-widest mb-1">Membro de Honra</p>
                      <p className="text-xs font-bold text-neutral-200 truncate">{data!.highlights.bestBook.titulo}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{data!.highlights.bestBook.autor}</p>
                    </div>
                  </div>

                  <div className="bg-neutral-950/40 border border-neutral-800/40 rounded-2xl p-4 flex flex-col justify-center gap-1 group/item hover:bg-neutral-950/60 transition-colors">
                     <p className="text-[10px] uppercase font-black text-neutral-500 tracking-widest">Tom Predominante</p>
                     <div className="flex items-center gap-2">
                       <TrendingUp size={14} className="text-blue-500" />
                       <p className="text-sm font-bold text-neutral-200">{data!.highlights.topGenre}</p>
                     </div>
                  </div>
                </div>

                {/* Standing Quote */}
                {data!.highlights.quote && (
                  <div className="mb-8 p-5 bg-neutral-950/60 border-l-2 border-amber-500/50 rounded-r-2xl relative group/quote">
                    <QuoteIcon size={16} className="text-amber-500/30 absolute top-3 right-3" />
                    <p className="text-xs text-neutral-300 font-serif italic line-clamp-3 leading-relaxed">
                      "{data!.highlights.quote.text}"
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-2 font-black uppercase tracking-tighter">
                      — {data!.highlights.quote.author}
                    </p>
                  </div>
                )}

                {/* Books List */}
                <AnimatePresence>
                  {expandedMonths[data!.month] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <div className="pt-4 border-t border-neutral-800/50 space-y-3">
                        {data!.books.map(book => (
                          <Link 
                            key={book.id} 
                            to={`/livro/${book.id}`}
                            className="flex items-center gap-4 p-3 rounded-2xl bg-neutral-950/30 border border-transparent hover:border-neutral-800 hover:bg-neutral-800/30 transition-all group/book"
                          >
                            <div className="w-12 h-16 rounded-lg overflow-hidden bg-neutral-800 shrink-0 shadow-lg">
                              {book.coverUrl ? (
                                <img 
                                  src={book.coverUrl} 
                                  alt={book.titulo} 
                                  className="w-full h-full object-cover group-hover/book:scale-110 transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookIcon size={16} className="text-neutral-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-neutral-200 truncate">{book.titulo}</h4>
                              <p className="text-xs text-neutral-500 truncate">{book.autor}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-medium text-neutral-400 flex items-center gap-1">
                                  <Star size={10} className="text-amber-500" fill="currentColor" />
                                  {book.notaGeral.toFixed(1)}
                                </span>
                                <span className="text-[10px] font-medium text-neutral-400 flex items-center gap-1">
                                  <FileText size={10} className="text-neutral-500" />
                                  {formatPagesShort(safeParseNumber(book.pageCount))}
                                </span>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-neutral-700 group-hover/book:text-amber-500 transition-colors" />
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!expandedMonths[data!.month] && (
                  <button 
                    onClick={() => toggleMonth(data!.month)}
                    className="w-full py-2 text-xs font-bold text-neutral-500 hover:text-amber-500 transition-colors flex items-center justify-center gap-2"
                  >
                    Ver {data!.books.length} {data!.books.length === 1 ? 'livro' : 'livros'}
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
