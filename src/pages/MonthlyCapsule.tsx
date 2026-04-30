import React, { useState, useRef, useMemo } from 'react';
import { useBooksState } from '../context/BooksContext';
import { useReadingSessions } from '../context/ReadingSessionsContext';
import { useAuth } from '../context/AuthContext';
import { MonthlyCapsuleCard } from '../components/monthly/MonthlyCapsuleCard';
import { getMonthlyStats, getInstagramCapsuleData, InstagramCapsuleData } from '../lib/monthlyCapsule';
import { toBlob } from 'html-to-image';
import { Download, ChevronLeft, ChevronRight, Sparkles, Instagram, Copy, Check, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InstagramStoryCapsule } from '../components/monthly/InstagramStoryCapsule';
import { InstagramFeedCapsule } from '../components/monthly/InstagramFeedCapsule';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForImages = async (node: HTMLElement) => {
  const images = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      try {
        if (img.complete && img.naturalWidth > 0) return;
        if ('decode' in img) {
          await Promise.race([img.decode().catch(() => undefined), wait(1200)]);
        } else {
          await Promise.race([
            new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }),
            wait(1200),
          ]);
        }
      } catch {
        return;
      }
    })
  );
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = url;
  document.body.appendChild(link);
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 1500);
};

export const MonthlyCapsule: React.FC = () => {
  const { books } = useBooksState();
  const { sessions } = useReadingSessions();
  const { user } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [resolvedInstagramData, setResolvedInstagramData] = useState<InstagramCapsuleData | null>(null);
  const [exportType, setExportType] = useState<'app' | 'instagram'>('app');
  const [copying, setCopying] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    return getMonthlyStats(
      books,
      sessions,
      currentDate.getMonth(),
      currentDate.getFullYear()
    );
  }, [books, sessions, currentDate]);

  const instagramData = useMemo(() => {
    return getInstagramCapsuleData(stats, user?.name);
  }, [stats, user]);

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => {
    const next = addMonths(currentDate, 1);
    if (next <= new Date()) {
      setCurrentDate(next);
    }
  };

  const copyCaption = () => {
    const caption = `Minha cápsula literária de ${stats.monthName} no Readora 📚✨\n\n📖 Livros concluídos: ${stats.totalBooks}\n📄 Páginas lidas: ${stats.totalPages}\n⭐ Média do mês: ${stats.averageRating.toFixed(1)}\n🎭 Vibe: ${stats.dominantMood}\n\nGerado automaticamente pelo @readora.app 📱\n#Readora #CapsulaLiteraria #Leitura #Books #MonthlyWrapUp`;
    navigator.clipboard.writeText(caption);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const exportAsImage = async (nodeId: string, fileName: string) => {
    setIsExporting(true);
    
    try {
      if (nodeId.includes('instagram')) {
        const coverDataUrls: Record<string, string> = {};
        const uniqueBooks = [
          ...(instagramData.bestBook ? [instagramData.bestBook] : []),
          ...instagramData.top5Books,
        ].filter((book, index, arr) => arr.findIndex((b) => b.id === book.id) === index);

        await Promise.all(uniqueBooks.map(async (book) => {
          const coverUrl = book.exportCoverDataUrl || book.coverUrl || book.ilustracaoUrl;
          if (!coverUrl) return;

          try {
            if (coverUrl.startsWith('data:image')) {
              coverDataUrls[book.id] = coverUrl;
              return;
            }
            const response = await fetch(coverUrl, { cache: 'no-cache', mode: 'cors', credentials: 'omit' });
            if (response.ok) {
              const blob = await response.blob();
              const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Thumbnail conversion failed'));
                reader.readAsDataURL(blob);
              });
              coverDataUrls[book.id] = dataUrl;
            }
          } catch {
            return;
          }
        }));

        setResolvedInstagramData({
          ...instagramData,
          coverDataUrls
        });

        await wait(300);
      }

      const node = document.getElementById(nodeId);
      if (!node) {
        throw new Error(`O elemento "${nodeId}" não foi encontrado no DOM.`);
      }
      
      try {
        await Promise.race([
          document.fonts.ready,
          wait(1800),
        ]);
      } catch {
        // non-fatal
      }

      await waitForImages(node);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      
      const isStory = nodeId.includes('story');
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
      const baseWidth = isStory ? 1080 : 1080;
      const baseHeight = isStory ? 1920 : 1350;

      const attempts = isMobile
        ? [
            { pixelRatio: 0.55, scale: 0.72 },
            { pixelRatio: 0.45, scale: 0.62 },
            { pixelRatio: 0.38, scale: 0.55 },
          ]
        : [
            { pixelRatio: 1, scale: 1 },
            { pixelRatio: 0.85, scale: 0.9 },
            { pixelRatio: 0.7, scale: 0.8 },
          ];

      let blob: Blob | null = null;
      let lastError: any = null;

      for (const attempt of attempts) {
        const width = Math.round(baseWidth * attempt.scale);
        const height = Math.round(baseHeight * attempt.scale);

        try {
          blob = await toBlob(node, {
            quality: 0.9,
            pixelRatio: attempt.pixelRatio,
            canvasWidth: width,
            canvasHeight: height,
            backgroundColor: '#030303',
            cacheBust: false,
            width: baseWidth,
            height: baseHeight,
            style: {
              transform: 'none',
              transformOrigin: 'top left',
              margin: '0',
              padding: '0',
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              visibility: 'visible',
              opacity: '1',
              borderRadius: '0',
              overflow: 'hidden',
            }
          });

          if (blob && blob.size > 2000) break;
        } catch (captureErr: any) {
          lastError = captureErr;
        }
      }

      if (!blob || blob.size < 2000) {
        throw new Error(`O navegador falhou ao capturar a imagem. Verifique se há memória disponível.\nErro: ${lastError?.message || 'Render Error'}`);
      }

      downloadBlob(blob, fileName);
      
    } catch (err: any) {
      console.error('Erro detalhado ao exportar:', err);
      const errorMsg = err?.message || (typeof err === 'string' ? err : 'Ocorreu um erro desconhecido na geração da imagem.');
      alert(`Não foi possível baixar a imagem. Tente novamente.\n\nDetalhes: ${errorMsg}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Sparkles size={16} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Resumo Mensal v1.2</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif leading-tight">Cápsula Literária</h1>
            <p className="text-neutral-500 text-sm max-w-xl">
              Um resumo visual e poético da sua jornada literária mês a mês. Perfeito para compartilhar suas conquistas.
            </p>
          </div>

          <div className="flex items-center bg-neutral-900/50 border border-neutral-800 rounded-2xl p-1 shrink-0">
            <button 
              onClick={handlePrevMonth}
              className="p-3 text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-6 py-2 text-center min-w-[160px]">
              <span className="text-xs uppercase tracking-widest text-neutral-500 block">Período</span>
              <span className="text-sm font-medium capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </span>
            </div>
            <button 
              onClick={handleNextMonth} 
              disabled={addMonths(currentDate, 1) > new Date()}
              className="p-3 text-neutral-400 hover:text-neutral-100 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      <div className="space-y-8">
        <div className="flex p-1 bg-neutral-900/50 border border-neutral-800 rounded-2xl w-fit mx-auto">
          <button 
            onClick={() => setExportType('app')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${exportType === 'app' ? 'bg-amber-500 text-neutral-950 shadow-lg' : 'text-neutral-400 hover:text-neutral-100'}`}
          >
            <Camera size={18} />
            <span>App Capsule</span>
          </button>
          <button 
            onClick={() => setExportType('instagram')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${exportType === 'instagram' ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20' : 'text-neutral-400 hover:text-neutral-100'}`}
          >
            <Instagram size={18} />
            <span>Instagram</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {exportType === 'app' ? (
            <motion.div 
              key="app-export"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
            >
              <div className="flex justify-center bg-neutral-900/30 rounded-[3rem] p-12 border border-neutral-800/40 shadow-inner overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={currentDate.toISOString()}
                  className="shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden"
                >
                  <MonthlyCapsuleCard stats={stats} userName={user?.name} />
                </motion.div>
              </div>

              <div className="space-y-12 py-6">
                <div className="space-y-6">
                  <h2 className="text-2xl font-serif italic text-amber-50">Sua Essência de {stats.monthName}</h2>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <InfoBlock 
                      title="Páginas percorridas"
                      value={stats.totalPages}
                      description="A distância mística que seus olhos atravessaram este mês."
                    />
                    <InfoBlock 
                      title="Histórias concluídas"
                      value={stats.totalBooks}
                      description="O número de universos que agora fazem parte da sua história."
                    />
                    <InfoBlock 
                      title="Atmosfera Dominante"
                      value={stats.dominantMood}
                      description="O sentimento que guiou suas escolhas e momentos de leitura."
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-neutral-800/50">
                  <button
                    onClick={() => exportAsImage('monthly-capsule-card', `readora-capsula-${format(currentDate, 'yyyy-MM')}.png`)}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-5 rounded-2xl transition-all shadow-xl shadow-amber-500/10 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                        <span>Preparando...</span>
                      </>
                    ) : (
                      <>
                        <Download size={20} />
                        <span>Baixar para Galeria (PNG)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="instagram-export"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-serif italic text-amber-50">Instagram Stories (9:16)</h3>
                    <button 
                      onClick={() => exportAsImage('instagram-story-capsule', `readora_capsula_${format(currentDate, 'yyyy_MM')}_stories.png`)}
                      disabled={isExporting}
                      className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <Download size={14} />
                      Baixar Stories
                    </button>
                  </div>
                  <div className="bg-neutral-900/50 rounded-[2rem] p-8 border border-neutral-800/50 flex justify-center overflow-hidden">
                    <div className="scale-[0.3] origin-top shadow-2xl">
                      <InstagramStoryCapsule data={resolvedInstagramData || instagramData} />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-serif italic text-amber-50">Instagram Feed (4:5)</h3>
                    <button 
                      onClick={() => exportAsImage('instagram-feed-capsule', `readora_capsula_${format(currentDate, 'yyyy_MM')}_feed.png`)}
                      disabled={isExporting}
                      className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <Download size={14} />
                      Baixar Feed
                    </button>
                  </div>
                  <div className="bg-neutral-900/50 rounded-[2rem] p-8 border border-neutral-800/50 flex justify-center overflow-hidden">
                    <div className="scale-[0.3] origin-top shadow-2xl">
                      <InstagramFeedCapsule data={resolvedInstagramData || instagramData} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Copy size={18} className="text-amber-500" />
                      Legenda Sugerida
                    </h3>
                    <p className="text-xs text-neutral-500">Pronta para copiar e colar no seu post.</p>
                  </div>
                  <button 
                    onClick={copyCaption}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${copying ? 'bg-green-500 text-white' : 'bg-amber-500 text-neutral-950'}`}
                  >
                    {copying ? <Check size={18} /> : <Copy size={18} />}
                    {copying ? 'Copiada!' : 'Copiar Legenda'}
                  </button>
                </div>
                <div className="bg-neutral-950/50 border border-neutral-800 p-6 rounded-2xl">
                  <p className="text-sm text-neutral-400 font-mono leading-relaxed whitespace-pre-wrap">
                    Minha cápsula literária de {stats.monthName} no Readora 📚✨{"\n\n"}
                    📖 Livros concluídos: {stats.totalBooks}{"\n"}
                    📄 Páginas lidas: {stats.totalPages}{"\n"}
                    ⭐ Média do mês: {stats.averageRating.toFixed(1)}{"\n"}
                    🎭 Vibe: {stats.dominantMood}{"\n\n"}
                    Gerado automaticamente pelo @readora.app 📱{"\n"}
                    #Readora #CapsulaLiteraria #Leitura #Books #MonthlyWrapUp
                  </p>
                </div>
              </div>

              <div
                className="fixed pointer-events-none overflow-hidden"
                style={{
                  left: '-20000px',
                  top: '0',
                  width: '1080px',
                  height: '1920px',
                  opacity: 1,
                }}
              >
                <InstagramStoryCapsule data={resolvedInstagramData || instagramData} id="instagram-story-capsule" />
              </div>

              <div
                className="fixed pointer-events-none overflow-hidden"
                style={{
                  left: '-20000px',
                  top: '0',
                  width: '1080px',
                  height: '1350px',
                  opacity: 1,
                }}
              >
                <InstagramFeedCapsule data={resolvedInstagramData || instagramData} id="instagram-feed-capsule" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const InfoBlock = ({ title, value, description }: { title: string; value: string | number; description: string }) => (
  <div className="space-y-2 group">
    <div className="flex items-baseline gap-3">
      <span className="text-3xl font-serif text-amber-100 tabular-nums">{value}</span>
      <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-[0.1em]">{title}</h3>
    </div>
    <p className="text-xs text-neutral-600 italic group-hover:text-neutral-500 transition-colors">
      {description}
    </p>
  </div>
);
