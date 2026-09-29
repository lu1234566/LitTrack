import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/TranslatedText';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Book } from '@/types/book';
import { Quote } from '@/types/quote';
import { buildWrappedStory, Insight, WrappedImage } from '@/services/wrappedInsights';
import { getAiWrappedLetter } from '@/services/wrappedLetter';
import { WrappedBackground } from '@/components/WrappedBackground';
import { FeedCapsuleBook } from '@/components/FeedCapsuleArt';
import { SHARE_H, SHARE_W, WrappedShareCard } from '@/components/WrappedShareCard';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { haptic } from '@/services/feedback';
import { appFonts } from '@/theme/tokens';
import { appLocale, t } from '@/services/i18n';

const DURATION = 5200;

// Arte de fundo por tipo de tela. Os slides agora mudam de leitor para
// leitor, então cada tipo aponta para a arte que combina com ele — e a paleta
// do gênero do leitor tinge a arte por cima (WrappedBackground).
const IMAGES: Record<WrappedImage, number> = {
  intro: require('../assets/wrapped/01-intro.jpg'),
  livros: require('../assets/wrapped/02-livros.jpg'),
  paginas: require('../assets/wrapped/03-paginas.jpg'),
  autor: require('../assets/wrapped/04-autor.jpg'),
  genero: require('../assets/wrapped/05-genero.jpg'),
  atmosfera: require('../assets/wrapped/06-atmosfera.jpg'),
  mes: require('../assets/wrapped/07-mes.jpg'),
  top5: require('../assets/wrapped/08-top5.jpg'),
  livro: require('../assets/wrapped/09-livro-do-ano.jpg'),
  maior: require('../assets/wrapped/10-maior-livro.jpg'),
  final: require('../assets/wrapped/11-final.jpg')
};

type SlideColors = readonly [string, string];
type Slide = { colors: SlideColors; image: WrappedImage; duration?: number; render: (active: boolean) => React.ReactNode };

// Gradiente de reserva (aparece enquanto a arte carrega). A cor que manda de
// verdade é a tinta do gênero, aplicada por cima da arte.
const BASE: SlideColors[] = [['#2a1458', '#7c3aed'], ['#7c2d12', '#f59e0b'], ['#064e3b', '#10b981'], ['#831843', '#ec4899'], ['#1e3a8a', '#3b82f6'], ['#4c1d95', '#a855f7']];

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
  // Números grandes (ex: 8.300 páginas) encolhem para caber numa linha em vez
  // de quebrar no meio do algarismo.
  return <Text style={style} numberOfLines={1} adjustsFontSizeToFit>{n.toLocaleString(appLocale)}</Text>;
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

export function WrappedStory({ books, quotes = [], readerName, year, onClose }: { books: Book[]; quotes?: Quote[]; readerName?: string; year: number; onClose: () => void }) {
  const { height } = useWindowDimensions();
  // Calculado uma vez ao abrir: as telas não mudam enquanto a pessoa assiste.
  const story = useMemo(() => buildWrappedStory(books, quotes, year, new Date(), readerName), []);
  const { data, persona, palette, insights, partial } = story;
  const [aiLetter, setAiLetter] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    if (data.totalBooks > 0) getAiWrappedLetter(year, story.facts, readerName).then((texto) => { if (vivo && texto) setAiLetter(texto); });
    return () => { vivo = false; };
  }, []);
  const shotRef = useRef<View>(null);
  const rootRef = useRef<View>(null);
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [capturing, setCapturing] = useState(false);

  const slides = useMemo<Slide[]>(() => {
    const cor = (i: number) => BASE[i % BASE.length];
    const lista: Slide[] = [];
    lista.push({
      colors: cor(0), image: 'intro',
      render: () => (
        <View style={styles.center}>
          <Text style={styles.kicker}>READORA WRAPPED</Text>
          <Text style={styles.bigYear}>{year}</Text>
          <Text style={styles.lead}>{partial ? 'Seu ano de leitura até agora.' : 'Sua retrospectiva literária do ano.'}</Text>
          <Text style={styles.hint}>toque para começar →</Text>
        </View>
      )
    });
    lista.push({
      colors: cor(1), image: 'livros',
      render: (active) => (
        <View style={styles.center}>
          <Text style={styles.kicker}>VOCÊ MERGULHOU EM</Text>
          <CountUp value={data.totalBooks} active={active} style={styles.hero} />
          <Text style={styles.heroUnit}>{partial ? 'livros até agora' : 'livros este ano'}</Text>
          {data.totalBooks === 0 ? <Text style={styles.lead}>Um ano de pausa também faz parte da jornada.</Text> : null}
        </View>
      )
    });

    // As descobertas escolhidas para ESTE leitor.
    insights.forEach((insight, i) => lista.push({ colors: cor(i + 2), image: insight.image, render: (active) => <InsightSlide insight={insight} active={active} accent={palette.accent} /> }));

    if (data.totalBooks > 0) {
      lista.push({
        colors: cor(4), image: 'autor', duration: 7000,
        render: () => (
          <View style={styles.center}>
            <Text style={styles.kicker}>{partial ? 'SEU TIPO DE LEITOR ATÉ AGORA' : 'SEU TIPO DE LEITOR'}</Text>
            <Text style={[styles.heroName, persona.name.length > 24 && styles.heroNameLong]} numberOfLines={3} adjustsFontSizeToFit>{persona.name}</Text>
            <Text style={styles.lead}>{persona.description}</Text>
            <View style={styles.chips}>
              {persona.chips.map((chip) => <View key={chip} style={[styles.chip, { borderColor: palette.accent }]}><Text style={styles.chipText} numberOfLines={1}>{chip}</Text></View>)}
            </View>
          </View>
        )
      });
    }

    if (data.top5.length >= 3) {
      lista.push({
        colors: cor(5), image: 'top5',
        render: () => (
          <View style={styles.listWrap}>
            <Text style={[styles.kicker, { marginBottom: 18 }]}>SEU TOP 5 DO ANO</Text>
            {data.top5.map((b, i) => (
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
      });
    }

    if (data.bestBook && data.bestBook.rating > 0) {
      lista.push({
        colors: cor(6), image: 'livro',
        render: () => (
          <View style={styles.center}>
            <Text style={styles.kicker}>SEU LIVRO DO ANO</Text>
            <Cover book={data.bestBook!} />
            <Text style={styles.bestTitle} numberOfLines={2}>{data.bestBook!.title}</Text>
            <Text style={styles.lead}>{data.bestBook!.author}</Text>
            <View style={{ marginTop: 10 }}><Stars rating={data.bestBook!.rating} size={22} /></View>
            <Text style={[styles.lead, { marginTop: 12 }]}>{data.favLead}</Text>
          </View>
        )
      });
    }

    // Carta do ano: montada pelo app na hora; se a IA responder, ela assume.
    lista.push({
      colors: cor(7), image: 'final', duration: 16000,
      render: () => (
        <View style={styles.center}>
          <Text style={styles.kicker}>UMA CARTA PARA VOCÊ</Text>
          <Text style={styles.letter}>{aiLetter || story.letter}</Text>
          {aiLetter ? <Text style={styles.letterNote}>Escrita pela IA do Readora a partir das suas leituras.</Text> : null}
        </View>
      )
    });

    lista.push({
      colors: ['#0b132b', '#1c2541'], image: 'final',
      render: () => (
        <View style={styles.center}>
          <Text style={styles.kicker}>SUA READORA WRAPPED</Text>
          <Text style={styles.bigYear}>{year}</Text>
          {data.totalBooks > 0 ? <Text style={[styles.personaTag, { color: palette.accent }]}>{persona.name}</Text> : null}
          <View style={styles.recapGrid}>
            <Recap label="LIVROS" value={String(data.totalBooks)} />
            <Recap label="PÁGINAS" value={data.totalPages.toLocaleString(appLocale)} />
            <Recap label="NOTA MÉDIA" value={data.ratingOutOf10.toFixed(1)} />
            <Recap label="AUTORES" value={String(story.authors)} />
          </View>
          <Pressable style={styles.shareBtn} onPress={handleShare}><ReadoraIcon name="share" size={17} color="#0b132b" /><Text style={styles.shareText}>Compartilhar retrospectiva</Text></Pressable>
          {message ? <Text style={styles.msg}>{message}</Text> : null}
        </View>
      )
    });
    return lista;
  }, [data, year, message, aiLetter]);

  const progress = useRef(slides.map(() => new Animated.Value(0))).current;
  const enter = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    setMessage('');
    progress.forEach((v, i) => v.setValue(i < index ? 1 : 0));
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    anim.current?.stop();
    const a = Animated.timing(progress[index], { toValue: 1, duration: slides[index].duration || DURATION, useNativeDriver: false });
    anim.current = a;
    a.start(({ finished }) => { if (finished && index < slides.length - 1) setIndex((i) => i + 1); });
    return () => a.stop();
  }, [index]);

  function next() { setIndex((i) => Math.min(slides.length - 1, i + 1)); }
  function prev() { setIndex((i) => Math.max(0, i - 1)); }

  async function capture(): Promise<string | null> {
    if (!shotRef.current) return null;
    const urls = [data.bestBook?.coverUrl, ...data.top5.map((b) => b.coverUrl)].filter((u): u is string => Boolean(u) && /^https?:/.test(u as string));
    await Promise.all(urls.map((u) => Image.prefetch(u).catch(() => false)));
    await new Promise((resolve) => setTimeout(resolve, 350));
    // Desenhada em 360×640, sai em 1080×1920: o tamanho de um story.
    return captureRef(shotRef, { format: 'png', quality: 1, result: 'tmpfile', width: SHARE_W * 3, height: SHARE_H * 3 });
  }

  async function handleShare() {
    if (Platform.OS === 'web') { setMessage('Compartilhamento disponível no app.'); return; }
    try {
      const uri = await capture();
      if (uri && (await Sharing.isAvailableAsync())) { haptic('success'); await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Minha Readora Wrapped' }); }
      else setMessage('Compartilhamento não disponível.');
    } catch { haptic('error'); setMessage('Não foi possível gerar a imagem.'); }
  }

  // Captura o slide visível (com a marca Readora e a barra de progresso), sem
  // os controles de UI — para que cada slide possa virar um story.
  async function captureSlide(): Promise<string | null> {
    if (!rootRef.current) return null;
    setCapturing(true);
    await new Promise((resolve) => setTimeout(resolve, 140));
    try {
      return await captureRef(rootRef, { format: 'png', quality: 1, result: 'tmpfile' });
    } finally {
      setCapturing(false);
    }
  }

  async function shareSlide() {
    if (Platform.OS === 'web') { setMessage('Compartilhamento disponível no app.'); return; }
    try {
      const uri = await captureSlide();
      if (uri && (await Sharing.isAvailableAsync())) { haptic('success'); await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Meu slide Readora Wrapped' }); }
      else setMessage('Compartilhamento não disponível.');
    } catch { haptic('error'); setMessage('Não foi possível gerar a imagem.'); }
  }

  const slide = slides[index];

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View ref={rootRef} collapsable={false} style={styles.root}>
        {/* A tinta alterna de direção a cada tela para não ficar chapada. */}
        <WrappedBackground colors={slide.colors} image={IMAGES[slide.image]} tint={palette.tint ? (index % 2 ? [palette.tint[1], palette.tint[0]] as const : palette.tint) : undefined} />

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
          {!capturing ? <Pressable onPress={onClose} hitSlop={14}><ReadoraIcon name="close" size={26} color="#fff" /></Pressable> : null}
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

        {/* per-slide share controls — hidden on the final slide (it has its own)
            and while capturing, so they don't appear in the saved image */}
        {!capturing && index < slides.length - 1 ? (
          <View style={styles.slideActions} pointerEvents="box-none">
            {message ? <View style={styles.toast}><Text style={styles.toastText}>{message}</Text></View> : null}
            <View style={styles.actionRow}>
              <Pressable style={styles.actionBtn} onPress={shareSlide} hitSlop={8}>
                <ReadoraIcon name="share" size={16} color="#0b132b" />
                <Text style={styles.actionText}>Compartilhar slide</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* off-screen capture source */}
        {Platform.OS !== 'web' ? (
          <View style={styles.offscreen} pointerEvents="none"><WrappedShareCard ref={shotRef} story={story} year={year} /></View>
        ) : null}
      </View>
    </Modal>
  );
}

function Cover({ book, small = false }: { book: FeedCapsuleBook; small?: boolean }) {
  return (
    <View style={small ? styles.smallCover : styles.bestCover}>
      {book.coverUrl
        ? <Image source={{ uri: book.coverUrl }} style={styles.bestCoverImg} resizeMode="cover" />
        : <Text style={styles.coverLetter}>{book.title.slice(0, 1).toUpperCase()}</Text>}
    </View>
  );
}

/** Uma descoberta: número, nome, capa(s), gráfico ou citação — o que ela tiver. */
function InsightSlide({ insight, active, accent }: { insight: Insight; active: boolean; accent: string }) {
  const letters = 'JFMAMJJASOND';
  return (
    <View style={styles.center}>
      <Text style={styles.kicker}>{insight.kicker}</Text>
      {insight.cover ? <Cover book={insight.cover} /> : null}
      {insight.covers?.length ? (
        <View style={styles.coverRow}>
          {insight.covers.map((b, i) => <View key={b.id} style={[styles.coverRowItem, i > 0 && { marginLeft: -18 }, { zIndex: 10 - i }]}><Cover book={b} small /></View>)}
        </View>
      ) : null}
      {insight.big ? (
        <>
          <CountUp value={insight.big.value} active={active} style={styles.hero} />
          <Text style={styles.heroUnit}>{insight.big.unit}</Text>
        </>
      ) : null}
      {insight.name ? <Text style={[styles.heroName, insight.name.length > 22 && styles.heroNameLong]} numberOfLines={3} adjustsFontSizeToFit>{insight.name}</Text> : null}
      {insight.chart ? (
        <View style={styles.miniChart}>
          {insight.chart.monthly.map((c, i) => {
            const max = Math.max(1, ...insight.chart!.monthly);
            const destaque = insight.chart!.highlight.includes(i);
            return (
              <View key={i} style={styles.miniCol}>
                <View style={styles.miniTrack}>
                  <View style={[styles.miniBar, { height: (Math.round((c / max) * 100) + '%') as `${number}%`, backgroundColor: destaque ? accent : 'rgba(255,255,255,0.35)' }]} />
                </View>
                <Text style={styles.miniLetter}>{letters[i]}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
      {insight.quote ? (
        <>
          <Text style={styles.quote}>“{insight.quote.text}”</Text>
          <Text style={styles.quoteSource}>{insight.quote.source}</Text>
        </>
      ) : null}
      {insight.lead ? <Text style={styles.lead}>{insight.lead}</Text> : null}
    </View>
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

// Sombra aplicada ao texto branco para garantir leitura sobre fundos claros.
const TS = { textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 } as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  progressRow: { flexDirection: 'row', gap: 5, paddingHorizontal: 16 },
  progressTrack: { flex: 1, height: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 14 },
  brand: { ...TS, color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 22 },
  // paddingBottom reserva a faixa dos botões "Compartilhar slide" (posicionados
  // em absolute, bottom 38) para o conteúdo centralizado nunca ficar por baixo.
  slide: { flex: 1, paddingHorizontal: 30, paddingBottom: 118, justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },
  kicker: { ...TS, color: 'rgba(255,255,255,0.9)', fontWeight: '900', letterSpacing: 4, fontSize: 14, textTransform: 'uppercase', textAlign: 'center' },
  bigYear: { ...TS, color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 110, lineHeight: 116, textShadowRadius: 18 },
  lead: { ...TS, color: '#fff', fontSize: 18, lineHeight: 26, textAlign: 'center', maxWidth: 360 },
  hint: { ...TS, color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700', marginTop: 18 },
  hero: { ...TS, color: '#fff', fontFamily: appFonts.display, fontWeight: '900', fontSize: 130, lineHeight: 138, textShadowRadius: 20 },
  heroUnit: { ...TS, color: '#fff', fontSize: 24, fontWeight: '900' },
  heroName: { ...TS, color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 56, lineHeight: 62, textAlign: 'center', textShadowRadius: 14 },
  heroNameLong: { fontSize: 38, lineHeight: 44 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10, maxWidth: 380 },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: 'rgba(0,0,0,0.35)', maxWidth: 360 },
  chipText: { ...TS, color: '#fff', fontWeight: '800', fontSize: 13 },
  coverRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },
  coverRowItem: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  smallCover: { width: 70, height: 104, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.45)', borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coverLetter: { ...TS, color: 'rgba(255,255,255,0.85)', fontFamily: appFonts.display, fontWeight: '900', fontSize: 34 },
  quote: { ...TS, color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 26, lineHeight: 36, textAlign: 'center', maxWidth: 380 },
  quoteSource: { ...TS, color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  letter: { ...TS, color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 19, lineHeight: 29, textAlign: 'center', maxWidth: 400 },
  letterNote: { ...TS, color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  personaTag: { ...TS, fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 22, textAlign: 'center', marginTop: -6 },
  listWrap: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, borderBottomColor: 'rgba(255,255,255,0.15)', borderBottomWidth: 1 },
  listRank: { ...TS, color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 34, minWidth: 40 },
  listTitle: { ...TS, color: '#fff', fontWeight: '900', fontSize: 19 },
  listAuthor: { ...TS, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', fontFamily: appFonts.display, fontSize: 15, marginTop: 2 },
  bestCover: { width: 150, height: 216, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.25)', borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 6 },
  bestCoverImg: { width: '100%', height: '100%' },
  bestTitle: { ...TS, color: '#fff', fontFamily: appFonts.display, fontWeight: '900', fontSize: 30, lineHeight: 34, textAlign: 'center', marginTop: 8 },
  synopsis: { ...TS, color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 360, marginTop: 14 },
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, marginTop: 28, width: '100%', maxWidth: 420, alignSelf: 'center' },
  miniCol: { flex: 1, alignItems: 'center', gap: 7 },
  miniTrack: { width: '62%', height: 120, justifyContent: 'flex-end', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 5, overflow: 'hidden' },
  miniBar: { width: '100%', borderRadius: 5, minHeight: 3 },
  miniLetter: { ...TS, color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '900' },
  recapGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 22, maxWidth: 380 },
  recapBox: { width: '45%', backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.22)', borderWidth: 1, borderRadius: 20, padding: 16, alignItems: 'center' },
  recapValue: { ...TS, color: '#fff', fontWeight: '900', fontSize: 26 },
  recapLabel: { ...TS, color: 'rgba(255,255,255,0.85)', fontSize: 11, letterSpacing: 2, fontWeight: '900', marginTop: 6 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#fff', borderRadius: 999, paddingVertical: 15, paddingHorizontal: 26, marginTop: 28, zIndex: 5 },
  shareText: { color: '#0b132b', fontWeight: '900', fontSize: 15 },
  saveBtn: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 999, borderColor: 'rgba(255,255,255,0.6)', borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 5 },
  saveText: { ...TS, color: '#fff', fontWeight: '900', fontSize: 14 },
  msg: { ...TS, color: '#fff', fontWeight: '900', marginTop: 12, textAlign: 'center' },
  slideActions: { position: 'absolute', left: 0, right: 0, bottom: 38, alignItems: 'center', gap: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 999, paddingVertical: 13, paddingHorizontal: 22 },
  actionText: { color: '#0b132b', fontWeight: '900', fontSize: 14 },
  actionIcon: { width: 48, height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderColor: 'rgba(255,255,255,0.6)', borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  toast: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  toastText: { ...TS, color: '#fff', fontWeight: '900', fontSize: 13, textAlign: 'center' },
  tapRow: { position: 'absolute', top: 90, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  tapLeft: { width: '30%', height: '100%' },
  tapRight: { flex: 1, height: '100%' },
  tapBackOnly: { position: 'absolute', top: 90, left: 0, width: '18%', bottom: 160 },
  offscreen: { position: 'absolute', left: -20000, top: 0 }
});
