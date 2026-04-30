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
      className="w-[1080px] h-[1920px] bg-neutral-950 text-white flex flex-col p-20 relative overflow-hidden font-sans"
      style={{
        background: 'radial-gradient(circle at 50% 0%, #1a1a1a 0%, #050505 100%)'
      }}
    >
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[100px] -ml-20 -mb-20" />
      
      {/* Header */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 pt-12">
        <div className="flex items-center gap-3 text-amber-500">
          <Sparkles size={40} className="fill-amber-500/20" />
          <span className="text-2xl uppercase tracking-[0.4em] font-black">Readora</span>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-8xl font-serif font-black text-amber-50 italic">
            Cápsula de {data.monthName}
          </h1>
          <p className="text-3xl text-neutral-500 uppercase tracking-widest font-bold">
            Resumo Literário {data.year}
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="relative z-10 grid grid-cols-2 gap-10 mt-32">
        <StatCard 
          label="Livros Lidos"
          value={data.totalBooks}
          subtext="obras concluídas"
        />
        <StatCard 
          label="Páginas"
          value={data.totalPages.toLocaleString()}
          subtext="percorridas"
        />
        <StatCard 
          label="Média"
          value={data.averageRating.toFixed(1)}
          subtext="avaliação mensal"
        />
        <StatCard 
          label="Atmosfera"
          value={data.dominantMood}
          subtext="do período"
        />
      </div>

      {/* Literary Copy */}
      <div className="relative z-10 mt-24 px-10">
        <div className="bg-neutral-900/40 border border-neutral-800/50 p-12 rounded-[3rem] backdrop-blur-sm">
          <p className="text-4xl text-center font-serif leading-relaxed italic text-neutral-200">
            "{data.literaryCopy}"
          </p>
        </div>
      </div>

      {/* Top 5 Section */}
      <div className="relative z-10 mt-24 flex-grow space-y-12">
        <div className="flex items-center gap-6">
          <div className="h-[2px] bg-amber-500/30 flex-grow" />
          <h2 className="text-3xl uppercase tracking-[0.3em] font-black text-neutral-500 shrink-0">
            Top 5 Livros do Mês
          </h2>
          <div className="h-[2px] bg-amber-500/30 flex-grow" />
        </div>

        <div className="space-y-6">
          {data.top5Books.map((book, idx) => (
            <div key={book.id} className="flex items-center gap-8 bg-neutral-900/20 p-6 rounded-3xl border border-white/5">
              <div className="w-10 h-10 bg-amber-500 text-neutral-950 flex items-center justify-center rounded-xl text-2xl font-black shrink-0">
                {idx + 1}
              </div>
              
              <div className="w-24 h-36 bg-neutral-900 rounded-lg overflow-hidden shrink-0 shadow-2xl border border-white/10">
                {book.coverUrl ? (
                  <img 
                    src={book.coverUrl} 
                    alt={book.titulo} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={40} className="text-neutral-800" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-grow">
                <h3 className="text-4xl font-bold text-neutral-100 truncate mb-2">{book.titulo}</h3>
                <p className="text-2xl text-neutral-500 italic font-serif truncate mb-4">{book.autor}</p>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={24} 
                        className={`${i < (book.notaGeral || 0) ? 'text-amber-500 fill-amber-500' : 'text-neutral-800'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-xl font-mono text-neutral-600">|</span>
                  <span className="text-xl font-mono text-neutral-400">{book.pageCount} pgs</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-12 pt-20">
        <p className="text-3xl font-serif italic text-amber-50/40 mb-4">
          Minha jornada literária em {data.monthName}
        </p>
        <div className="flex items-center justify-center gap-3 opacity-30">
          <div className="w-12 h-[1px] bg-white" />
          <span className="text-xl uppercase tracking-[0.3em] font-bold">readora.app</span>
          <div className="w-12 h-[1px] bg-white" />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subtext }: { label: string; value: string | number; subtext: string }) => (
  <div className="bg-neutral-900/60 p-12 rounded-[3.5rem] border border-white/10 text-center space-y-4">
    <span className="text-2xl uppercase tracking-[0.2em] font-black text-amber-500 mb-2 block">{label}</span>
    <span className="text-8xl font-black text-neutral-50 tabular-nums leading-none block">{value}</span>
    <span className="text-2xl text-neutral-500 font-bold block">{subtext}</span>
  </div>
);
