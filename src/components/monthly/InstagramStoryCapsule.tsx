import React from 'react';
import { InstagramCapsuleData } from '../../lib/monthlyCapsule';
import { BookOpen, Star, Sparkles, Trophy } from 'lucide-react';

interface Props {
  data: InstagramCapsuleData;
  id?: string;
}

export const InstagramStoryCapsule: React.FC<Props> = ({ data, id = 'instagram-story-capsule' }) => {
  const featuredBooks = data.top5Books.slice(0, 3);
  const remainingBooks = Math.max(0, data.top5Books.length - featuredBooks.length);
  const bestBook = data.bestBook || featuredBooks[0];

  return (
    <div
      id={id}
      className="w-[1080px] h-[1920px] bg-neutral-950 text-white relative overflow-hidden font-sans"
      style={{
        background:
          'radial-gradient(circle at 50% -10%, rgba(245,158,11,0.18) 0%, rgba(10,10,10,0.98) 34%, #030303 100%)',
      }}
    >
      {/* Background atmosphere */}
      <div className="absolute inset-0 opacity-70">
        <div className="absolute -top-44 -right-32 w-[720px] h-[720px] bg-amber-500/10 rounded-full blur-[130px]" />
        <div className="absolute top-[760px] -left-40 w-[680px] h-[680px] bg-amber-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-240px] right-[-140px] w-[760px] h-[760px] bg-white/[0.03] rounded-full blur-[90px]" />
      </div>

      <div className="relative z-10 h-full flex flex-col px-20 py-24">
        {/* Brand */}
        <header className="text-center space-y-8 shrink-0">
          <div className="flex items-center justify-center gap-4 text-amber-500">
            <Sparkles size={34} className="fill-amber-500/20" />
            <span className="text-[22px] uppercase tracking-[0.55em] font-black">Readora</span>
          </div>

          <div className="space-y-3">
            <p className="text-[24px] text-neutral-500 uppercase tracking-[0.42em] font-black">
              Cápsula Literária
            </p>
            <h1 className="text-[92px] leading-[0.95] font-serif font-black text-amber-50 italic tracking-[-0.04em]">
              {data.monthName}
            </h1>
            <p className="text-[28px] text-neutral-500 uppercase tracking-[0.36em] font-black">
              Jornada {data.year}
            </p>
          </div>
        </header>

        {/* Main metrics */}
        <section className="grid grid-cols-2 gap-6 mt-20 shrink-0">
          <HeroStat label="Livros" value={data.totalBooks} subtext="concluídos" />
          <HeroStat label="Páginas" value={data.totalPages.toLocaleString('pt-BR')} subtext="percorridas" />
          <HeroStat label="Média" value={data.averageRating.toFixed(1)} subtext="nota mensal" />
          <HeroStat label="Vibe" value={data.dominantMood} subtext="atmosfera" />
        </section>

        {/* Favorite book */}
        {bestBook && (
          <section className="mt-16 shrink-0">
            <div className="bg-neutral-900/80 border border-amber-500/15 rounded-[42px] p-9 flex items-center gap-9 shadow-[0_40px_110px_rgba(0,0,0,0.55)]">
              <div className="w-[150px] h-[220px] rounded-[24px] overflow-hidden bg-neutral-950 border border-white/10 shadow-2xl shrink-0">
                {data.coverDataUrls?.[bestBook.id] || bestBook.coverUrl ? (
                  <img
                    src={data.coverDataUrls?.[bestBook.id] || bestBook.coverUrl}
                    alt={bestBook.titulo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookFallback title={bestBook.titulo} />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                <div className="inline-flex items-center gap-3 bg-amber-500 text-neutral-950 px-6 py-3 rounded-full font-black uppercase tracking-[0.18em] text-[18px] shadow-lg shadow-amber-500/20">
                  <Trophy size={24} />
                  Favorito do mês
                </div>
                <div className="space-y-2">
                  <h2 className="text-[52px] leading-[0.98] font-black text-white line-clamp-2 tracking-[-0.04em]">
                    {bestBook.titulo}
                  </h2>
                  <p className="text-[28px] text-neutral-400 italic font-serif line-clamp-1">
                    {bestBook.autor}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Top reads */}
        <section className="mt-16 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center gap-5 mb-8 shrink-0">
            <div className="h-[2px] bg-amber-500/20 flex-1" />
            <h3 className="text-[25px] uppercase tracking-[0.34em] font-black text-neutral-500 whitespace-nowrap">
              Top do mês
            </h3>
            <div className="h-[2px] bg-amber-500/20 flex-1" />
          </div>

          <div className="space-y-5">
            {featuredBooks.map((book, idx) => (
              <div
                key={book.id}
                className="h-[158px] bg-neutral-900/55 border border-white/5 rounded-[30px] p-5 flex items-center gap-6"
              >
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/15 text-amber-500 flex items-center justify-center text-[24px] font-black shrink-0">
                  {idx + 1}
                </div>

                <div className="w-[74px] h-[112px] rounded-xl overflow-hidden bg-neutral-950 border border-white/10 shrink-0 shadow-xl">
                  {data.coverDataUrls?.[book.id] || book.coverUrl ? (
                    <img
                      src={data.coverDataUrls?.[book.id] || book.coverUrl}
                      alt={book.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookFallback title={book.titulo} compact />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-[32px] leading-tight font-black text-neutral-100 line-clamp-1 tracking-[-0.03em]">
                    {book.titulo}
                  </h4>
                  <p className="text-[21px] text-neutral-500 italic font-serif line-clamp-1 mb-3">
                    {book.autor}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[18px] text-neutral-500 font-mono">
                      {book.pageCount || 0} pág.
                    </span>
                    <div className="flex gap-1 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={19}
                          className={`${i < Math.round(book.notaGeral || 0) / 2 ? 'text-amber-500 fill-amber-500' : 'text-neutral-800'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {remainingBooks > 0 && (
              <div className="h-[86px] rounded-[26px] border border-dashed border-amber-500/20 bg-amber-500/[0.04] flex items-center justify-center text-[22px] font-black text-amber-500 uppercase tracking-[0.22em]">
                + {remainingBooks} leituras no mês
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-10 shrink-0 text-center space-y-4">
          <p className="text-[25px] font-serif italic text-neutral-400 leading-tight line-clamp-2 px-8">
            “{data.literaryCopy}”
          </p>
          <div className="flex items-center justify-center gap-4 opacity-35">
            <div className="w-12 h-[1px] bg-white" />
            <span className="text-[18px] uppercase tracking-[0.45em] font-black">readora.app</span>
            <div className="w-12 h-[1px] bg-white" />
          </div>
        </footer>
      </div>
    </div>
  );
};

const HeroStat = ({ label, value, subtext }: { label: string; value: string | number; subtext: string }) => (
  <div className="bg-neutral-900/70 border border-white/5 rounded-[34px] px-7 py-8 text-center min-h-[190px] flex flex-col items-center justify-center shadow-[0_28px_70px_rgba(0,0,0,0.35)]">
    <span className="text-[18px] uppercase tracking-[0.22em] font-black text-amber-500 block mb-3">
      {label}
    </span>
    <span className="text-[58px] leading-none font-black text-neutral-50 tabular-nums tracking-[-0.05em] max-w-full truncate">
      {value}
    </span>
    <span className="text-[18px] text-neutral-500 font-bold block mt-3">
      {subtext}
    </span>
  </div>
);

const BookFallback = ({ title, compact = false }: { title: string; compact?: boolean }) => (
  <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 bg-neutral-950">
    <BookOpen size={compact ? 26 : 42} className="text-neutral-800 mb-2" />
    <span className={`${compact ? 'text-[7px]' : 'text-[10px]'} text-neutral-600 font-black uppercase line-clamp-3`}>
      {title}
    </span>
  </div>
);
