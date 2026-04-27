import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { 
  Download, Share2, Sparkles, BookOpen, Star, 
  Heart, Flame, Activity, X, ChevronRight, ChevronLeft,
  Smartphone, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, LiteraryProfile } from '../types';
import { Logomark } from './Logomark';

interface ShareableProfileCardsProps {
  profile: LiteraryProfile;
  books: Book[];
  onClose: () => void;
}

type CardType = 'archetype' | 'full_profile' | 'genres' | 'mood' | 'stats' | 'book_of_year';
type AspectRatio = 'square' | 'story';

export const ShareableProfileCards: React.FC<ShareableProfileCardsProps> = ({ profile, books, onClose }) => {
  const [activeCard, setActiveCard] = useState<CardType>('archetype');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('story');
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const lidosEsteAno = books.filter(b => b.status === 'lido' && b.anoLeitura === new Date().getFullYear());
  const bestBook = [...books].filter(b => b.status === 'lido').sort((a, b) => b.notaGeral - a.notaGeral)[0];

  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#0a0a0a',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `readora-${activeCard}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Ops, algo deu errado!', err);
    } finally {
      setIsExporting(false);
    }
  };

  const cardTypes: { id: CardType, label: string }[] = [
    { id: 'archetype', label: 'Arquétipo' },
    { id: 'full_profile', label: 'Perfil Completo' },
    { id: 'genres', label: 'Gêneros' },
    { id: 'mood', label: 'Atmosfera' },
    { id: 'stats', label: 'Meu Ano' },
    { id: 'book_of_year', label: 'Livro do Ano' },
  ];

  const renderCardContent = () => {
    switch (activeCard) {
      case 'mood':
        return (
          <div className="flex flex-col h-full justify-between p-10 items-center text-center">
            <div className="space-y-4">
              <Logomark className="w-12 h-12 text-amber-500 mb-6 mx-auto" />
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-4">Minha Atmosfera Predominante</p>
              <h2 className="text-4xl font-serif font-bold text-neutral-100 italic">
                {profile.moodMap.sort((a, b) => b.intensity - a.intensity)[0]?.mood || 'Equilibrada'}
              </h2>
            </div>

            <div className="relative group w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
              <Flame size={80} className="text-amber-500 relative z-10" />
            </div>

            <div className="space-y-4 w-full">
               <div className="flex justify-between items-center px-4">
                  <span className="text-[10px] font-black text-neutral-600 uppercase">Intensidade</span>
                  <span className="text-xs font-bold text-amber-500">
                    {profile.moodMap.sort((a, b) => b.intensity - a.intensity)[0]?.intensity || 7}/10
                  </span>
               </div>
               <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden mx-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(profile.moodMap.sort((a, b) => b.intensity - a.intensity)[0]?.intensity || 7) * 10}%` }}
                    className="h-full bg-amber-500"
                  />
               </div>
            </div>

            <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-600">readora.app</div>
          </div>
        );
      case 'archetype':
        return (
          <div className="flex flex-col h-full justify-between items-center text-center p-12">
            <div className="space-y-4">
              <Logomark className="w-12 h-12 mx-auto text-amber-500 mb-8" />
              <div className="inline-flex px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-widest">
                Meu Arquétipo Literário
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-100 leading-tight">
                {profile.archetype.name}
              </h2>
            </div>
            
            <div className="w-24 h-24 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center shadow-2xl">
              <Sparkles className="text-amber-500" size={40} />
            </div>

            <p className="text-lg text-neutral-400 italic max-w-xs leading-relaxed px-4">
              "{profile.archetype.description.split('.')[0]}."
            </p>

            <div className="mt-8 border-t border-neutral-800 pt-6 w-full opacity-50 flex justify-center items-center gap-4">
               <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">readora.app</div>
            </div>
          </div>
        );
      case 'full_profile':
        return (
          <div className="flex flex-col h-full justify-between p-10">
            <div className="flex justify-between items-start">
               <Logomark className="w-8 h-8 text-amber-500" />
               <div className="text-right">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Identidade Literária</p>
                  <p className="text-xs font-bold text-neutral-300">Resumo de Jornada</p>
               </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                 <h2 className="text-3xl font-serif font-bold text-neutral-100">{profile.archetype.name}</h2>
                 <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">{profile.generoFavorito}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: 'Nota Média', value: profile.genreMetrics[0]?.averageRating.toFixed(1) || '0.0', icon: <Star size={14}/> },
                   { label: 'Preferência', value: profile.tipoNarrativaFavorita, icon: <BookOpen size={14}/> },
                   { label: 'Ressonância', value: profile.archetype.emotionalResonance, icon: <Heart size={14}/> },
                   { label: 'Critério', value: profile.archetype.demandingGenre, icon: <Activity size={14}/> }
                 ].map((stat, i) => (
                   <div key={i} className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl space-y-1">
                      <div className="text-amber-500">{stat.icon}</div>
                      <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-xs font-bold text-neutral-200 truncate">{stat.value}</p>
                   </div>
                 ))}
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl italic text-sm text-neutral-400 text-center">
               "{profile.insights[0]}"
            </div>

            <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-600 text-center">readora.app</div>
          </div>
        );
      case 'genres':
        return (
          <div className="flex flex-col h-full justify-between p-10">
            <div className="space-y-2">
              <Logomark className="w-10 h-10 text-emerald-500 mb-4" />
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Domínios Literários</p>
              <h2 className="text-3xl font-serif font-bold text-neutral-100">Exploração de Gêneros</h2>
            </div>

            <div className="space-y-4">
              {profile.genreMetrics.slice(0, 4).map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-300">{m.genre}</span>
                    <span className="text-neutral-500 font-mono italic">{m.averageRating.toFixed(1)} ★</span>
                  </div>
                  <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${m.intensity * 10}%` }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-3xl text-center space-y-1">
               <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Gênero Alvo</p>
               <p className="text-xl font-bold text-emerald-500">{profile.generoFavorito}</p>
            </div>

            <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-600 text-center">readora.app</div>
          </div>
        );
      case 'stats':
        return (
          <div className="flex flex-col h-full justify-between p-10 items-center text-center">
            <div className="space-y-2">
              <Logomark className="w-12 h-12 text-rose-500 mb-6 mx-auto" />
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Resumo do Ano</p>
              <h2 className="text-4xl font-serif font-bold text-neutral-100">{new Date().getFullYear()}</h2>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full">
               <div className="space-y-1">
                  <h4 className="text-3xl font-bold text-rose-500">{lidosEsteAno.length}</h4>
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Livros</p>
               </div>
               <div className="space-y-1">
                  <h4 className="text-3xl font-bold text-neutral-100">{lidosEsteAno.reduce((acc, b) => acc + (b.pageCount || 0), 0)}</h4>
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Páginas</p>
               </div>
            </div>

            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
               <div className="h-full bg-rose-500 w-2/3" />
            </div>

            <div className="space-y-1">
               <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Ritmo Dominante</p>
               <p className="text-lg font-bold text-neutral-200">
                  {profile.evolutionData ? profile.evolutionData[profile.evolutionData.length - 1]?.topGenre : profile.generoFavorito}
               </p>
            </div>

            <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-600">readora.app</div>
          </div>
        );
      case 'book_of_year':
        return (
          <div className="flex flex-col h-full justify-between p-10 items-center text-center">
             <div className="space-y-2">
              <Logomark className="w-10 h-10 text-amber-500 mb-4 mx-auto" />
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">A Escolha do Ano</p>
              <h2 className="text-3xl font-serif font-bold text-neutral-100">Destaque Máximo</h2>
            </div>

            {bestBook ? (
              <div className="space-y-6 w-full">
                <div className="w-32 h-44 bg-neutral-800 mx-auto rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-neutral-700 relative">
                  {bestBook.coverUrl ? (
                    <img src={bestBook.coverUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <BookOpen size={32} className="text-neutral-700" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500 text-neutral-950 text-[10px] font-black rounded shadow-lg">
                    {bestBook.notaGeral.toFixed(1)} ★
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-neutral-100 line-clamp-1">{bestBook.titulo}</h3>
                  <p className="text-sm text-neutral-500">{bestBook.autor}</p>
                </div>
              </div>
            ) : (
              <div className="italic text-neutral-500 text-sm">Nenhum livro finalizado este ano.</div>
            )}

            <div className="text-[10px] font-black text-neutral-600 uppercase tracking-widest italic px-8">
               "Minha melhor leitura de {new Date().getFullYear()}"
            </div>

            <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-600">readora.app</div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/90 backdrop-blur-sm"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-5xl h-full max-h-[85vh] overflow-hidden flex flex-col md:flex-row shadow-2xl"
      >
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center">
          {/* Aspect Ratio Switcher */}
          <div className="flex gap-4 mb-8 bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
             <button 
                onClick={() => setAspectRatio('square')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${aspectRatio === 'square' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
             >
                <Square size={14} /> Quadrado
             </button>
             <button 
                onClick={() => setAspectRatio('story')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${aspectRatio === 'story' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
             >
                <Smartphone size={14} /> Story
             </button>
          </div>

          <div 
            ref={cardRef}
            className={`bg-[#0a0a0a] shadow-2xl relative overflow-hidden transition-all duration-500 ${
              aspectRatio === 'square' ? 'aspect-square w-full max-w-[400px]' : 'aspect-[9/16] w-full max-w-[340px]'
            }`}
          >
            {/* Design patterns */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />
            <div className="absolute inset-0 border-[20px] border-[#0a0a0a] z-50 pointer-events-none" />
            
            <div className="relative z-10 h-full w-full">
               {renderCardContent()}
            </div>
          </div>
        </div>

        <div className="w-full md:w-[380px] bg-neutral-950 border-t md:border-t-0 md:border-l border-neutral-800 p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-xl font-serif font-bold text-neutral-100 flex items-center gap-2">
                <Share2 size={24} className="text-amber-500" />
                Compartilhar
             </h2>
             <button 
                onClick={onClose}
                className="p-2 hover:bg-neutral-900 rounded-full transition-colors text-neutral-500"
              >
                <X size={20} />
             </button>
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-4">
               <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">Escolha o Tema</p>
               <div className="grid grid-cols-1 gap-2">
                  {cardTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setActiveCard(type.id)}
                      className={`flex items-center justify-between w-full p-4 rounded-2xl text-sm font-bold border transition-all ${
                        activeCard === type.id 
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-lg' 
                          : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      {type.label}
                      <ChevronRight size={16} />
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-neutral-100 hover:bg-white disabled:bg-neutral-800 text-neutral-950 p-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all mt-8"
          >
            {isExporting ? (
              <><Loader2 size={18} className="animate-spin" /> Exportando...</>
            ) : (
              <><Download size={18} /> Baixar Imagem</>
            )}
          </button>
          <p className="text-[10px] text-neutral-600 text-center mt-4">Readora • Inteligência Literária</p>
        </div>
      </motion.div>
    </div>
  );
};

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <Activity className={className} size={size} />
);
