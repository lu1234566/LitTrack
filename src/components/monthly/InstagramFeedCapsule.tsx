import React from 'react';
import { InstagramCapsuleData } from '../../lib/monthlyCapsule';
import { BookOpen, Star, Sparkles, Quote, Trophy } from 'lucide-react';

interface Props {
  data: InstagramCapsuleData;
  id?: string;
}

export const InstagramFeedCapsule: React.FC<Props> = ({ data, id = "instagram-feed-capsule" }) => {
  return (
    <div 
      id={id}
      className="w-[1080px] h-[1350px] bg-neutral-950 text-white flex flex-col p-20 relative overflow-hidden font-sans"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #171717 100%)'
      }}
    >
      {/* Decorative grain/noise pattern would go here in CSS */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-amber-500/5 rounded-full blur-[150px] -mr-60 -mt-60" />
      <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-amber-500/5 rounded-full blur-[150px] -ml-60 -mb-60" />

      {/* Header with Branding */}
      <div className="relative z-10 flex justify-between items-start mb-16">
        <div className="space-y-2">
          <h1 className="text-7xl font-serif font-black text-amber-50 italic">
            Cápsula Mensal
          </h1>
          <p className="text-3xl text-neutral-500 uppercase tracking-widest font-black">
            {data.monthName} / {data.year}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-amber-500 text-neutral-950 px-8 py-4 rounded-3xl font-black text-2xl uppercase tracking-widest shadow-xl shadow-amber-500/20">
          <Sparkles size={32} className="fill-neutral-950/20" />
          Readora
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-12 gap-12 flex-grow">
        {/* Left Column: Stats and Best Book */}
        <div className="col-span-12 lg:col-span-5 space-y-12">
          {/* Main Month Summary */}
          <div className="bg-neutral-900/40 border border-white/5 p-12 rounded-[3.5rem] backdrop-blur-md space-y-12">
            <div className="flex items-center gap-8">
              <div className="p-6 bg-amber-500/10 rounded-3xl">
                <Trophy size={48} className="text-amber-500" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl text-neutral-500 font-bold uppercase tracking-widest">Desempenho</p>
                <h2 className="text-5xl font-black text-neutral-50">Explosão Literária</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 pt-8 border-t border-white/5">
              <div className="space-y-1">
                <span className="text-xl text-neutral-500 font-bold uppercase tracking-widest">Livros</span>
                <p className="text-5xl font-black text-amber-50">{data.totalBooks}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xl text-neutral-500 font-bold uppercase tracking-widest">Páginas</span>
                <p className="text-5xl font-black text-amber-50">{data.totalPages.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xl text-neutral-500 font-bold uppercase tracking-widest">Rating</span>
                <p className="text-5xl font-black text-amber-50 font-mono tracking-tighter">{data.averageRating.toFixed(1)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xl text-neutral-500 font-bold uppercase tracking-widest">Vibe</span>
                <p className="text-3xl font-black text-amber-50 truncate">{data.dominantMood}</p>
              </div>
            </div>
          </div>

          {/* Featured Book */}
          {data.bestBook && (
            <div className="relative group px-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-transparent blur-xl rounded-[4rem] group-hover:opacity-100 transition duration-1000 opacity-0" />
              <div className="relative bg-neutral-900/60 p-10 rounded-[3rem] border border-amber-500/10 flex gap-8 items-center">
                <div className="w-24 h-36 bg-neutral-800 rounded-xl overflow-hidden shadow-2xl shrink-0">
                  {data.bestBook.coverUrl ? (
                    <img src={data.bestBook.coverUrl} alt={data.bestBook.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={40} className="text-neutral-700" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-lg bg-amber-500/10 text-amber-500 px-4 py-1 rounded-full font-black uppercase tracking-widest mb-3 inline-block">Favorito do Mês</span>
                  <h3 className="text-3xl font-bold text-neutral-50 truncate leading-tight">{data.bestBook.titulo}</h3>
                  <p className="text-xl text-neutral-400 italic font-serif truncate">{data.bestBook.autor}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Top 5 List */}
        <div className="col-span-12 lg:col-span-7 space-y-10">
          <div className="flex items-center gap-6 mb-4">
            <h2 className="text-3xl font-black uppercase tracking-[0.3em] text-neutral-500">Prateleira de Elite</h2>
            <div className="h-[2px] bg-white/5 flex-grow" />
          </div>

          <div className="space-y-6">
            {data.top5Books.map((book, idx) => (
              <div key={book.id} className="flex items-center gap-8 bg-neutral-900/20 p-8 rounded-[2.5rem] border border-white/5 hover:bg-neutral-900/30 transition-all">
                <span className="text-4xl font-black text-amber-500/40 italic font-serif min-w-[3rem]">{idx + 1}</span>
                
                <div className="w-20 h-28 bg-neutral-900 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-lg">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={30} className="text-neutral-800" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-3xl font-bold text-neutral-50 truncate max-w-[80%]">{book.titulo}</h3>
                    <div className="flex gap-1 shrink-0 pt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={20} 
                          className={`${i < (book.notaGeral || 0) ? 'text-amber-500 fill-amber-500' : 'text-neutral-800'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 font-mono text-xl text-neutral-600">
                    <span className="italic font-serif text-neutral-500 truncate shrink underline decoration-amber-500/20">by {book.autor}</span>
                    <span className="text-neutral-800">/</span>
                    <span>{book.pageCount} pgs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Signature */}
      <div className="relative z-10 pt-12 flex items-center justify-between border-t border-white/5">
        <div className="space-y-1">
          <p className="text-2xl font-serif italic text-neutral-400">"{data.literaryCopy}"</p>
          <p className="text-xl text-neutral-600 font-bold uppercase tracking-[0.2em]">Gerado por seu app Readora</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-3xl font-black uppercase tracking-[0.4em] text-amber-500">READORA</span>
          <span className="text-lg text-neutral-700 font-mono">EST. 2024</span>
        </div>
      </div>
    </div>
  );
};
