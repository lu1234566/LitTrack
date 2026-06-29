import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Book } from '@/types/book';
import { buildWrapped } from '@/services/wrapped';
import { FeedCapsuleArt, FeedCapsuleBook } from '@/components/FeedCapsuleArt';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { haptic } from '@/services/feedback';
import { appFonts } from '@/theme/tokens';

const DURATION = 5200;

type SlideColors = readonly [string, string];

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function CountUp({ value, active, style }: { value: number; active: boolean; style: any }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) { setN(0); return; }
    let raf = 0;
    const start = Date.now();
    const dur = 1000;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / dur);
      setN(Math.round(value * easeOut(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value]);
  return <Text style={style}>{n.toLocaleString('pt-BR')}</Text>;
}

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <ReadoraIcon key={i} name={i < filled ? 'star' : 'starOutline'} size={size} color={i < filled ? '#fff' : 'rgba(255,255,255,0.35)'} />
      ))}
    </View>
  );
}

export function WrappedStory({ books, year, onClose }: { books: Book[]; year: number; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const data = useMemo(() => buildWrapped(books, year), [books, year]);
  const shotRef = useRef<View>(null);
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState('');

  const pagesBricks = Math.max(1, Math.round(data.totalPages / 300));

  const slides = useMemo(() => ([
    {
      colors: ['#2a1458', '#7c3aed'] as SlideColors,
      render: () => (
        <View style={styles.center}>
          <Text style={styles.kicker}>READORA WRAPPED</Text>
          <Text style={styles.bigYear}>{year}</Text>
          <Text style={styles.lead}>Sua retrospectiva literária do ano.</Text>
          <Text style={styles.hint}>toque para começar →</Text>
        </View>
      )
    },
    {
      colors: ['#7c2d12', '#f59e0b'] as SlideColors,
      render: (active: boolean) => (
        <View style={styles.center}>
          <Text style={styles.kicker}>VOCÊ MERGULHOU EM</Text>
          <CountUp value={data.totalBooks} active={active} style={styles.hero} />
          <Text style={styles.heroUnit}>livros este ano</Text>
        </View>
      )
    },
    {
      colors: ['#064e3b', '#10b981'] as SlideColors,
      render: (active: boolean) => (
        <View style={styles.center}>
          <Text style={styles.kicker}>FORAM</Text>
          <CountUp value={data.totalPages} active={active} style={styles.hero} />
          <Text style={styles.heroUnit}>páginas viradas</Text>
          <Text style={styles.lead}>≈ {pagesBricks} livro(s) de 300 páginas empilhados.</Text>
        </View>
      )
    },
    {
      colors: ['#831843', '#ec4899'] as SlideColors,
      render: () => (
        <View style={styles.center}>
          <Text style={styles.kicker}>SEU AUTOR DO ANO</Text>
          <Text style={styles.heroName}>{data.topAuthor}</Text>
          <Text style={styles.lead}>{data.topAuthorCount} livro(s) que você viveu com {data.topAuthor.split(' ')[0]}.</Text>
        </View>
      )
    },
    {
      colors: ['#1e3a8a', '#3b82f6'] as SlideColors,
      render: () => (
        <View style={styles.center}>
          <Text style={styles.kicker}>SEU GÊNERO</Text>
          <Text style={styles.heroName}>{data.topGenre}</Text>
          <Text style={styles.lead}>O território onde você mais habitou.</Text>
        </View>
      )
    },
    {
      colors: ['#4c1d95', '#a855f7'] as SlideColors,
      render: () => (
        <View style={styles.center}>
          <Text style={styles.kicker}>SUA ATMOSFERA</Text>
          <Text style={styles.heroName}>{data.vibe}</Text>
          <Text style={styles.lead}>O tom que guiou suas escolhas.</Text>
        </View>
      )
    },
    {
      colors: ['#7f1d1d', '#ef4444'] as SlideColors,
      render: () => (
        <View style={styles.listWrap}>
          <Text style={[styles.kicker, { marginBottom: 18 }]}>SEU TOP 5 DO ANO</Text>
          {data.top5.length === 0 ? <Text style={styles.lead}>Sem livros suficientes ainda.</Text> : data.top5.map((b, i) => (
            <View key={b.id} style={styles.listRow}>
              <Text style={styles.listRank}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.listTitle}>{b.title}</Text>
                <Text numberOfLines={1} style={styles.listAuthor}>{b.author}</Text>
              </View>
              <Stars rating={b.rating} size={14} />
            </View>
          ))}
        </View>
      )
    },
    {
      colors: ['#92400e', '#fbbf24'] as SlideColors,
      render: () => (
        <View style={styles.center}>
          <Text style={styles.kicker}>SEU LIVRO DO ANO</Text>
          {data.bestBook ? (
            <>
              <View style={styles.bestCover}>
                {data.bestBook.coverUrl
                  ? <Image source={{ uri: data.bestBook.coverUrl }} style={styles.bestCoverImg} resizeMode="cover" />
                  : <ReadoraIcon name="library" size={54} color="rgba(255,255,255,0.5)" />}
              </View>
              <Text style={styles.bestTitle} numberOfLines={2}>{data.bestBook.title}</Text>
              <Text style={styles.lead}>{data.bestBook.author}</Text>
              <View style={{ marginTop: 10 }}><Stars rating={data.bestBook.rating} size={22} /></View>
            </>
          ) : <Text style={styles.lead}>Você ainda não concluiu livros em {year}.</Text>}
        </View>
      )
    },
    {
      colors: ['#0b132b', '#1c2541'] as SlideColors,
      render: () => (
        <View style={styles.center}>
          <Text style={styles.kicker}>SUA READORA WRAPPED</Text>
          <Text style={styles.bigYear}>{year}</Text>
          <View style={styles.recapGrid}>
            <Recap label="LIVROS" value={String(data.totalBooks)} />
            <Recap label="PÁGINAS" value={data.totalPages.toLocaleString('pt-BR')} />
            <Recap label="NOTA MÉDIA" value={data.ratingOutOf10.toFixed(1)} />
            <Recap label="VIBE" value={data.vibe} />
          </View>
          <Pressable style={styles.shareBtn} onPress={handleShare}><ReadoraIcon name="share" size={17} color="#0b132b" /><Text style={styles.shareText}>Compartilhar retrospectiva</Text></Pressable>
          {Platform.OS !== 'web' ? <Pressable style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveText}>Salvar na galeria</Text></Pressable> : null}
          {message ? <Text style={styles.msg}>{message}</Text> : null}
        </View>
      )
    }
  ]), [data, year, message, pagesBricks]);

  const progress = useRef(slides.map(() => new Animated.Value(0))).current;
  const enter = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    progress.forEach((v, i) => v.setValue(i < index ? 1 : 0));
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    anim.current?.stop();
    const a = Animated.timing(progress[index], { toValue: 1, duration: DURATION, useNativeDriver: false });
    anim.current = a;
    a.start(({ finished }) => { if (finished && index < slides.length - 1) setIndex((i) => i + 1); });
    return () => a.stop();
  }, [index]);

  function next() { setIndex((i) => Math.min(slides.length - 1, i + 1)); }
  function prev() { setIndex((i) => Math.max(0, i - 1)); }

  const feedData = {
    monthName: String(year),
    year,
    heading: 'Cápsula Anual',
    periodText: 'Retrospectiva de ' + year,
    favoriteLabel: 'Favorito do Ano',
    totalBooks: data.totalBooks,
    totalPages: data.totalPages,
    ratingOutOf10: data.ratingOutOf10,
    dominantMood: data.vibe,
    books: data.ranked as FeedCapsuleBook[],
    bestBook: data.bestBook,
    literaryCopy: data.totalBooks === 0
      ? year + ' foi um ano de pausa e reflexão silenciosa entre as páginas.'
      : 'Sua jornada em ' + year + ' foi marcada por encontros sublimes e histórias que ecoaram profundamente.'
  };

  async function capture(): Promise<string | null> {
    if (!shotRef.current) return null;
    const urls = [data.bestBook?.coverUrl, ...data.ranked.map((b) => b.coverUrl)].filter(Boolean) as string[];
    await Promise.all(urls.map((u) => Image.prefetch(u).catch(() => false)));
    await new Promise((resolve) => setTimeout(resolve, 350));
    return captureRef(shotRef, { format: 'png', quality: 1, result: 'tmpfile' });
  }

  async function handleShare() {
    if (Platform.OS === 'web') { setMessage('Compartilhamento disponível no app.'); return; }
    try {
      const uri = await capture();
      if (uri && (await Sharing.isAvailableAsync())) { haptic('success'); await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Minha Readora Wrapped' }); }
      else setMessage('Compartilhamento não disponível.');
    } catch { haptic('error'); setMessage('Não foi possível gerar a imagem.'); }
  }

  async function handleSave() {
    if (Platform.OS === 'web') return;
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) { setMessage('Permita o acesso à galeria.'); return; }
      const uri = await capture();
      if (uri) { await MediaLibrary.saveToLibraryAsync(uri); haptic('success'); setMessage('Retrospectiva salva na galeria.'); }
    } catch { haptic('error'); setMessage('Não foi possível salvar.'); }
  }

  const slide = slides[index];

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <LinearGradient colors={slide.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

        {/* progress bars */}
        <View style={[styles.progressRow, { paddingTop: height > 700 ? 56 : 28 }]}>
          {slides.map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progress[i].interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
            </View>
          ))}
        </View>

        <View style={styles.topBar}>
          <Text style={styles.brand}>Readora</Text>
          <Pressable onPress={onClose} hitSlop={14}><ReadoraIcon name="close" size={26} color="#fff" /></Pressable>
        </View>

        <Animated.View style={[styles.slide, { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>
          {slide.render(true)}
        </Animated.View>

        {/* tap zones — disabled on the last slide so its buttons stay tappable */}
        {index < slides.length - 1 ? (
          <View style={styles.tapRow}>
            <Pressable style={styles.tapLeft} onPress={prev} />
            <Pressable style={styles.tapRight} onPress={next} />
          </View>
        ) : (
          <Pressable style={styles.tapBackOnly} onPress={prev} />
        )}

        {/* off-screen capture source */}
        {Platform.OS !== 'web' ? (
          <View style={styles.offscreen} pointerEvents="none"><FeedCapsuleArt ref={shotRef} scale={1} {...feedData} /></View>
        ) : null}
      </View>
    </Modal>
  );
}

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.recapBox}>
      <Text style={styles.recapValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.recapLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  progressRow: { flexDirection: 'row', gap: 5, paddingHorizontal: 16 },
  progressTrack: { flex: 1, height: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 14 },
  brand: { color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 22 },
  slide: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },
  kicker: { color: 'rgba(255,255,255,0.85)', fontWeight: '900', letterSpacing: 4, fontSize: 14, textTransform: 'uppercase', textAlign: 'center' },
  bigYear: { color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 110, lineHeight: 116 },
  lead: { color: 'rgba(255,255,255,0.9)', fontSize: 18, lineHeight: 26, textAlign: 'center', maxWidth: 340 },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '700', marginTop: 18 },
  hero: { color: '#fff', fontFamily: appFonts.display, fontWeight: '900', fontSize: 130, lineHeight: 138 },
  heroUnit: { color: '#fff', fontSize: 24, fontWeight: '900' },
  heroName: { color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 56, lineHeight: 62, textAlign: 'center' },
  listWrap: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, borderBottomColor: 'rgba(255,255,255,0.15)', borderBottomWidth: 1 },
  listRank: { color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 34, minWidth: 40 },
  listTitle: { color: '#fff', fontWeight: '900', fontSize: 19 },
  listAuthor: { color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', fontFamily: appFonts.display, fontSize: 15, marginTop: 2 },
  bestCover: { width: 150, height: 216, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.25)', borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 6 },
  bestCoverImg: { width: '100%', height: '100%' },
  bestTitle: { color: '#fff', fontFamily: appFonts.display, fontWeight: '900', fontSize: 30, lineHeight: 34, textAlign: 'center', marginTop: 8 },
  recapGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 22, maxWidth: 380 },
  recapBox: { width: '45%', backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderRadius: 20, padding: 16, alignItems: 'center' },
  recapValue: { color: '#fff', fontWeight: '900', fontSize: 26 },
  recapLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, letterSpacing: 2, fontWeight: '900', marginTop: 6 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#fff', borderRadius: 999, paddingVertical: 15, paddingHorizontal: 26, marginTop: 28, zIndex: 5 },
  shareText: { color: '#0b132b', fontWeight: '900', fontSize: 15 },
  saveBtn: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 999, borderColor: 'rgba(255,255,255,0.5)', borderWidth: 1, zIndex: 5 },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  msg: { color: '#fff', fontWeight: '900', marginTop: 12, textAlign: 'center' },
  tapRow: { position: 'absolute', top: 90, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  tapLeft: { width: '30%', height: '100%' },
  tapRight: { flex: 1, height: '100%' },
  tapBackOnly: { position: 'absolute', top: 90, left: 0, width: '18%', bottom: 160 },
  offscreen: { position: 'absolute', left: -20000, top: 0 }
});
