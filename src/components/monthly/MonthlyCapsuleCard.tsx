import React from 'react';
import { Book, ReadingSession } from '../../types';
import { MonthlyStats } from '../../lib/monthlyCapsule';
import { BookOpen, Calendar, Clock, Star, Award, Layers, Ghost } from 'lucide-react';
import { motion } from 'framer-motion';

interface MonthlyCapsuleCardProps {
  stats: MonthlyStats;
  userName?: string;
}

export const MonthlyCapsuleCard: React.FC<MonthlyCapsuleCardProps> = ({ stats, userName }) => {
  const {
    monthName,
    year,
    booksCompleted,
    totalBooks,
    totalPages,
    totalSessions,
    totalMinutes,
    averageRating,
    topGenre,
    dominantMood,
    achievements,
    literaryCopy
  } = stats;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div 
      id="monthly-capsule-card"
      className="w-[400px] min-h-[700px] h-fit bg-neutral-950 text-neutral-100 p-8 flex flex-col space-y-8 relative overflow-hidden border border-neutral-800 shadow-2xl"
      style={{
        background: 'radial-gradient(circle at 50% -20%, #262626 0%, #0a0a0a 100%)'
      }}
    >
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] -z-0" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-neutral-500/5 blur-[100px] -z-0" />

      {/* Header */}
      <div className="relative z-10 space-y-2">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500/80 font-bold">
            Readora • Memórias Literárias
          </span>
          <span className="text-[10px] text-neutral-500 tabular-nums">
            {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>
        <h1 className="text-4xl font-serif leading-tight">
          Cápsula de <span className="text-amber-100 italic">{monthName}</span>
        </h1>
        {userName && (
          <p className="text-xs text-neutral-400 font-sans tracking-wide">
            Jornada de {userName} • {year}
          </p>
        )}
      </div>

      {/* Literary Copy */}
      <div className="relative z-10 py-4 border-y border-neutral-800/50">
        <p className="text-sm font-serif italic text-neutral-300 leading-relaxed text-center">
          "{literaryCopy}"
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="relative z-10 grid grid-cols-2 gap-4">
        <StatItem 
          icon={<BookOpen className="w-4 h-4 text-amber-500/70" />}
          label="Livros Lidos"
          value={totalBooks}
        />
        <StatItem 
          icon={<Layers className="w-4 h-4 text-neutral-500" />}
          label="Páginas Vencidas"
          value={totalPages}
        />
        <StatItem 
          icon={<Clock className="w-4 h-4 text-neutral-500" />}
          label="Tempo de Foco"
          value={`${hours}h ${minutes}m`}
        />
        <StatItem 
          icon={<Star className="w-4 h-4 text-amber-500/70" />}
          label="Média do Mês"
          value={averageRating.toFixed(1)}
        />
      </div>

      {/* Highlights Section - List of all completed books */}
      <div className="relative z-10 space-y-4 flex-grow pr-1">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold flex items-center gap-2 sticky top-0 bg-neutral-950/80 backdrop-blur-sm py-1">
          <span className="h-[1px] w-4 bg-neutral-800" />
          Acervo Concluído ({booksCompleted.length})
        </h3>
        
        {booksCompleted.length > 0 ? (
          <div className="space-y-3">
            {booksCompleted.map((book, idx) => (
              <div key={idx} className="flex gap-4 items-center group bg-neutral-900/30 p-2 rounded-lg border border-neutral-800/10 hover:border-neutral-800/50 transition-all">
                <div className="w-10 h-14 bg-neutral-900 border border-neutral-800 flex-shrink-0 relative overflow-hidden rounded-sm shadow-lg">
                  {book.ilustracaoUrl || book.coverUrl ? (
                    <img 
                      src={book.ilustracaoUrl || book.coverUrl} 
                      alt={book.titulo} 
                      className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-3 h-3 text-neutral-700" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-[11px] font-bold text-neutral-200 truncate leading-tight group-hover:text-amber-200 transition-colors">{book.titulo}</h4>
                    <div className="flex gap-0.5 shrink-0 pt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-[10px] h-[10px] ${i < (book.notaGeral || 0) ? 'text-amber-500 fill-amber-500' : 'text-neutral-800'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <p className="text-[9px] text-neutral-500 truncate italic font-serif">by {book.autor}</p>
                    {book.pageCount && (
                      <span className="text-[8px] text-neutral-600 font-mono">{book.pageCount} pgs</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 border border-dashed border-neutral-800 rounded-lg">
            <Ghost className="w-8 h-8 text-neutral-800 mb-2" />
            <p className="text-[10px] text-neutral-600 font-serif italic text-center px-8">
              Páginas em branco aguardando o despertar da primeira história do mês.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="relative z-10 pt-6 border-t border-neutral-800/50 space-y-4">
        <div className="flex justify-between items-center text-[10px]">
          <div className="space-y-1">
            <span className="text-neutral-600 block uppercase tracking-wider">Atmosfera</span>
            <span className="text-neutral-300 font-medium italic">{dominantMood}</span>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-neutral-600 block uppercase tracking-wider">Universo de Foco</span>
            <span className="text-neutral-300 font-medium italic">{topGenre}</span>
          </div>
        </div>

        {achievements.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {achievements.map((ach, idx) => (
              <span 
                key={idx} 
                className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-[8px] text-amber-400 rounded-full flex items-center gap-1"
              >
                <Award className="w-2 h-2" />
                {ach}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Background brand watermark */}
      <div className="absolute -bottom-4 -right-4 text-7xl font-serif text-neutral-900/40 select-none pointer-events-none capitalize opacity-20">
        {monthName}
      </div>
    </div>
  );
};

const StatItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <div className="bg-neutral-900/50 border border-neutral-800/50 p-3 rounded-lg space-y-1 group hover:border-neutral-700 transition-colors">
    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
      {icon}
      <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-medium">{label}</span>
    </div>
    <div className="text-xl font-serif text-amber-50 transition-transform group-hover:scale-105 origin-left duration-300">
      {value}
    </div>
  </div>
);
