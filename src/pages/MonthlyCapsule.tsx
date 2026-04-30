import React, { useState, useMemo } from 'react';
import { useBooksState } from '../context/BooksContext';
import { useReadingSessions } from '../context/ReadingSessionsContext';
import { useAuth } from '../context/AuthContext';
import { MonthlyCapsuleCard } from '../components/monthly/MonthlyCapsuleCard';
import { getMonthlyStats, getInstagramCapsuleData, InstagramCapsuleData } from '../lib/monthlyCapsule';
import { toPng } from 'html-to-image';
import { Download, ChevronLeft, ChevronRight, Sparkles, Instagram, Copy, Check, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InstagramStoryCapsule } from '../components/monthly/InstagramStoryCapsule';
import { InstagramFeedCapsule } from '../components/monthly/InstagramFeedCapsule';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const COVER_PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180"><rect width="100%" height="100%" rx="16" fill="#111111"/><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" fill="#666666" font-size="16" font-family="Arial">Readora</text><text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" fill="#444444" font-size="10" font-family="Arial">sem capa</text></svg>');

const normalizeCoverUrl = (url: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('http://')) return `https://${trimmed.slice(7)}`;
  return trimmed;
};

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao converter imagem.'));
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

async function imageToCanvasDataUrl(url: string): Promise<string | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.crossOrigin = 'anonymous';
      element.referrerPolicy = 'no-referrer';
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Falha ao carregar imagem em canvas.'));
      element.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 120;
    canvas.height = img.naturalHeight || 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

const buildCoverCandidates = (rawUrl: string) => {
  const url = normalizeCoverUrl(rawUrl);
  if (!url) return [];

  const withoutProtocol = url.replace(/^https?:\/\//, '');
  const candidates = [url];

  if (url.includes('books.google.com') || url.includes('googleusercontent.com')) {
    candidates.push(url.replace(/&zoom=\d+/g, '&zoom=3'));
    candidates.push(url.replace(/&zoom=\d+/g, '&zoom=2'));
    if (!url.includes('&img=1')) candidates.push(`${url}${url.includes('?') ? '&' : '?'}img=1`);
  }

  candidates.push(`https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}&w=240&h=360&fit=inside&output=jpg`);
  candidates.push(`https://wsrv.nl/?url=${encodeURIComponent(withoutProtocol)}&w=240&h=360&fit=inside&output=jpg`);

  return [...new Set(candidates)];
};

async function resolveCoverDataUrl(rawUrl: string): Promise<string> {
  const candidates = buildCoverCandidates(rawUrl);

  for (const candidate of candidates) {
    const fetched = await fetchAsDataUrl(candidate);
    if (fetched) return fetched;
  }

  for (const candidate of candidates) {
    const canvasUrl = await imageToCanvasDataUrl(candidate);
    if (canvasUrl) return canvasUrl;
  }

  return COVER_PLACEHOLDER;
}

export const MonthlyCapsule: React.FC = () => {
  const { books } = useBooksState();
  const { sessions } = useReadingSessions();
  const { user } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [resolvedInstagramData, setResolvedInstagramData] = useState<InstagramCapsuleData | null>(null);
  const [exportType, setExportType] = useState<'app' | 'instagram'>('app');
  const [copying, setCopying] = useState(false);

  const stats = useMemo(() => {
    return getMonthlyStats(books, sessions, currentDate.getMonth(), currentDate.getFullYear());
  }, [books, sessions, currentDate]);

  const instagramData = useMemo(() => {
    return getInstagramCapsuleData(stats, user?.name);
  }, [stats, user]);

  const handlePrevMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => {
    const next = addMonths(currentDate, 1);
    if (next <= new Date()) setCurrentDate(next);
  };

  const copyCaption = () => {
    const caption = `Minha cápsula literária de ${stats.monthName} no Readora 📚✨\n\n📖 Livros concluídos: ${stats.totalBooks}\n📄 Páginas lidas: ${stats.totalPages}\n⭐ Média do mês: ${stats.averageRating.toFixed(1)}\n🎭 Vibe: ${stats.dominantMood}\n\nGerado automaticamente pelo @readora.app 📱\n#Readora #CapsulaLiteraria #Leitura #Books #MonthlyWrapUp`;
    navigator.clipboard.writeText(caption);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const prepareInstagramData = async () => {
    const coverDataUrls: Record<string, string> = {};
    const uniqueBooks = [
      ...(instagramData.bestBook ? [instagramData.bestBook] : []),
      ...instagramData.top5Books,
    ].filter((book, index, arr) => arr.findIndex((b) => b.id === book.id) === index);

    await Promise.all(
      uniqueBooks.map(async (book) => {
        const coverUrl = book.coverUrl || book.ilustracaoUrl || '';
        coverDataUrls[book.id] = coverUrl ? await resolveCoverDataUrl(coverUrl) : COVER_PLACEHOLDER;
      })
    );

    const prepared = { ...instagramData, coverDataUrls };
    setResolvedInstagramData(prepared);
    await wait(300);
    return prepared;
  };

  const triggerDownload = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAsImage = async (nodeId: string, fileName: string) => {
    setIsExporting(true);
    try {
      const isInstagramExport = nodeId.includes('instagram');
      if (isInstagramExport) {
        await prepareInstagramData();
      }

      const node = document.getElementById(nodeId);
      if (!node) throw new Error(`Elemento ${nodeId} não encontrado.`);

      if ('fonts' in document) {
        await (document as any).fonts.ready;
      }
      await wait(450);

      const dataUrl = await toPng(node as HTMLElement, {
        quality: 1,
        pixelRatio: 1,
        backgroundColor: '#0a0a0a',
        cacheBust: false,
        skipAutoScale: true,
        imagePlaceholder: COVER_PLACEHOLDER,
        style: { transform: 'none' },
      });

      if (!dataUrl || dataUrl.length < 500) {
        throw new Error('Falha ao gerar imagem.');
      }

      triggerDownload(dataUrl, fileName);
    } catch (err: any) {
      console.error('Erro ao exportar:', err);
      const details = err?.message ? `\nErro: ${err.message}` : '';
      alert(`Não foi possível baixar a imagem. Tente novamente em alguns segundos ou salve via "captura de tela".${details}`);
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
            <button onClick={handlePrevMonth} className="p-3 text-neutral-400 hover:text-neutral-100 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="px-6 py-2 text-center min-w-[160px]">
              <span className="text-xs uppercase tracking-widest text-neutral-500 block">Período</span>
              <span className="text-sm font-medium capitalize">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</span>
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={currentDate.toISOString()} className="shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden">
                  <MonthlyCapsuleCard stats={stats} userName={user?.name} />
                </motion.div>
              </div>

              <div className="space-y-12 py-6">
                <div className="space-y-6">
                  <h2 className="text-2xl font-serif italic text-amber-50">Sua Essência de {stats.monthName}</h2>
                  <div className="grid grid-cols-1 gap-6">
                    <InfoBlock title="Páginas percorridas" value={stats.totalPages} description="A distância mística que seus olhos atravessaram este mês." />
                    <InfoBlock title="Histórias concluídas" value={stats.totalBooks} description="O número de universos que agora fazem parte da sua história." />
                    <InfoBlock title="Atmosfera Dominante" value={stats.dominantMood} description="O sentimento que guiou suas escolhas e momentos de leitura." />
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
                      <InstagramStoryCapsule data={instagramData} />
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
                      <InstagramFeedCapsule data={instagramData} />
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

              <div className="fixed left-[-99999px] top-0 pointer-events-none opacity-100 overflow-hidden">
                <InstagramStoryCapsule data={resolvedInstagramData || instagramData} id="instagram-story-capsule" exportSafe />
                <InstagramFeedCapsule data={resolvedInstagramData || instagramData} id="instagram-feed-capsule" exportSafe />
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
    <p className="text-xs text-neutral-600 italic group-hover:text-neutral-500 transition-colors">{description}</p>
  </div>
);
