import React from 'react';
import { InstagramCapsuleData } from '../../lib/monthlyCapsule';
import { BookOpen, Star, Sparkles, Trophy } from 'lucide-react';

interface Props {
  data: InstagramCapsuleData;
  id?: string;
}

export const InstagramStoryCapsule: React.FC<Props> = ({ data, id = "instagram-story-capsule" }) => {
  return (
    <div 
      id={id}
      className="w-[1080px] h-[1920px] bg-neutral-950 text-white flex flex-col p-16 relative overflow-hidden font-sans"
      style={{
        background: 'radial-gradient(circle at 50% 0%, #1a1a1a 0%, #030303 100%)'
      }}
    >
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-amber-500/5 rounded-full blur-[150px] -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] -ml-20 -mb-20" />
      
      {/* Header - More compact */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4 pt-4">
        <div className="flex items-center gap-3 text-amber-500">
          <Sparkles size={36} className="fill-amber-500/20" />
          <span className="text-xl uppercase tracking-[0.5em] font-black">Readora</span>
        </div>
        
        <div className="space-y-1">
          <h1 className="text-7xl font-serif font-black text-amber-50 italic">
            Cápsula de {data.monthName}
          </h1>
          <p className="text-2xl text-neutral-500 uppercase tracking-[0.4em] font-bold">
            Jornada Literária {data.year}
          </p>
        </div>
      </div>

      {/* Main Stats Grid - More compact gap */}
      <div className="relative z-10 grid grid-cols-2 gap-8 mt-16">
        <StatCard 
          label="Livros Lidos"
          value={data.totalBooks}
          subtext="concluídos"
        />
        <StatCard 
          label="Páginas"
          value={data.totalPages.toLocaleString()}
          subtext="percorridas"
        />
        <StatCard 
          label="Média"
          value={data.averageRating.toFixed(1)}
          subtext="nota mensal"
        />
        <StatCard 
          label="Atmosfera"
          value={data.dominantMood}
          subtext="vibe do mês"
        />
      </div>

      {/* Favorite of the Month - NEW SECTION */}
      {data.bestBook && (
        <div className="relative z-10 mt-16 px-4">
          <div className="bg-neutral-900/80 border border-amber-500/10 p-10 rounded-[3rem] flex items-center gap-10">
            <div className="w-32 h-48 bg-neutral-900 rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-white/10 relative">
              {data.coverDataUrls?.[data.bestBook.id] || data.bestBook.coverUrl ? (
                <img 
                  src={data.coverDataUrls?.[data.bestBook.id] || data.bestBook.coverUrl} 
                  alt={data.bestBook.titulo} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <BookOpen size={48} className="text-neutral-800 mb-2" />
                  <span className="text-[10px] text-neutral-700 font-bold uppercase truncate w-full">{data.bestBook.titulo}</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xl bg-amber-500 text-neutral-950 px-6 py-2 rounded-full font-black uppercase tracking-[0.2em] mb-4 inline-block shadow-lg shadow-amber-500/20">Favorito do Mês</span>
              <h3 className="text-5xl font-black text-white truncate mb-2">{data.bestBook.titulo}</h3>
              <p className="text-3xl text-amber-50/60 italic font-serif truncate">por {data.bestBook.autor}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top 5 Section - Adjusted heights to fit */}
      <div className="relative z-10 mt-16 flex-grow flex flex-col min-h-0">
        <div className="flex items-center gap-6 mb-10">
          <div className="h-[2px] bg-amber-500/20 flex-grow" />
          <h2 className="text-3xl uppercase tracking-[0.3em] font-black text-neutral-500 shrink-0">
            Top 5 do Mês
          </h2>
          <div className="h-[2px] bg-amber-500/20 flex-grow" />
        </div>

        <div className="flex-grow space-y-4">
          {data.top5Books.map((book, idx) => (
            <div key={book.id} className="flex items-center gap-6 bg-neutral-900/30 p-5 rounded-[2rem] border border-white/5 h-[170px]">
              <div className="w-10 h-10 bg-neutral-800 text-amber-500 flex items-center justify-center rounded-xl text-2xl font-black shrink-0 border border-white/5">
                {idx + 1}
              </div>
              
              <div className="w-20 h-28 bg-neutral-900 rounded-lg overflow-hidden shrink-0 shadow-xl border border-white/10 relative">
                {data.coverDataUrls?.[book.id] || book.coverUrl ? (
                  <img 
                    src={data.coverDataUrls?.[book.id] || book.coverUrl} 
                    alt={book.titulo} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                    <BookOpen size={30} className="text-neutral-800 mb-1" />
                    <span className="text-[8px] text-neutral-700 font-bold uppercase truncate w-full">{book.titulo}</span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-3xl font-bold text-neutral-100 truncate mb-1">{book.titulo}</h3>
                  <div className="flex gap-1 shrink-0 pt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={18} 
                        className={`${i < (book.notaGeral || 0) ? 'text-amber-500 fill-amber-500' : 'text-neutral-800'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xl text-neutral-500 italic font-serif truncate mb-3">{book.autor}</p>
                <div className="flex items-center gap-4 text-lg font-mono text-neutral-600">
                  <span className="text-neutral-400">{book.pageCount} páginas</span>
                  <span>|</span>
                  <span className="text-amber-500/50 uppercase tracking-widest font-black">Lido</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Minimal to save space */}
      <div className="relative z-10 text-center pt-8 pb-4">
        <div className="flex items-center justify-center gap-4 opacity-30">
          <div className="w-10 h-[1px] bg-white" />
          <span className="text-lg uppercase tracking-[0.4em] font-bold">readora.app</span>
          <div className="w-10 h-[1px] bg-white" />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subtext }: { label: string; value: string | number; subtext: string }) => (
  <div className="bg-neutral-900/60 p-8 rounded-[3rem] border border-white/5 text-center space-y-2">
    <span className="text-xl uppercase tracking-[0.2em] font-black text-amber-500 block">{label}</span>
    <span className="text-7xl font-black text-neutral-50 tabular-nums leading-none block">{value}</span>
    <span className="text-xl text-neutral-500 font-bold block">{subtext}</span>
  </div>
);
