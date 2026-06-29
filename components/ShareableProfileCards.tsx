import { forwardRef, useMemo, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Book } from '@/types/book';
import { analyzeLiteraryProfile, NativeLiteraryProfile } from '@/services/literaryProfile';
import { ReadoraIcon, ReadoraIconName } from '@/components/ReadoraIcon';
import { haptic } from '@/services/feedback';
import { appColors, appFonts } from '@/theme/tokens';

type CardType = 'archetype' | 'full_profile' | 'genres' | 'mood' | 'stats' | 'book_of_year';
type Aspect = 'square' | 'story';

const C = {
  bg: '#0a0a0a',
  card: '#171717',
  cardSoft: 'rgba(23,23,23,0.55)',
  border: 'rgba(255,255,255,0.07)',
  amber: '#f59e0b',
  amberSoft: 'rgba(245,158,11,0.10)',
  emerald: '#10b981',
  emeraldSoft: 'rgba(16,185,129,0.10)',
  rose: '#f43f5e',
  n100: '#f5f5f5',
  n200: '#e5e5e5',
  n400: '#a3a3a3',
  n500: '#737373',
  n600: '#525252',
  n800: '#262626'
};

const CARD_TYPES: { id: CardType; label: string }[] = [
  { id: 'archetype', label: 'Arquétipo' },
  { id: 'full_profile', label: 'Perfil Completo' },
  { id: 'genres', label: 'Gêneros' },
  { id: 'mood', label: 'Atmosfera' },
  { id: 'stats', label: 'Meu Ano' },
  { id: 'book_of_year', label: 'Livro do Ano' }
];

type ArtData = {
  profile: NativeLiteraryProfile;
  bestBook: Book | null;
  yearBooks: number;
  yearPages: number;
  year: number;
};

type ArtProps = ArtData & { card: CardType; aspect: Aspect; scale: number };

function Brand({ u, color }: { u: (n: number) => number; color: string }) {
  return <ReadoraIcon name="brand" size={u(64)} color={color} />;
}

function Footer({ u }: { u: (n: number) => number }) {
  return <Text style={{ color: C.n600, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(22), textTransform: 'uppercase', letterSpacing: u(5), textAlign: 'center' }}>readora.app</Text>;
}

const ProfileCardArt = forwardRef<View, ArtProps>(function ProfileCardArt({ card, aspect, scale, profile, bestBook, yearBooks, yearPages, year }, ref) {
  const u = (n: number) => n * scale;
  const W = u(1080);
  const H = u(aspect === 'square' ? 1080 : 1920);
  const label = (t: string) => ({ color: C.n500, fontFamily: appFonts.body as string, fontWeight: '900' as const, fontSize: u(22), textTransform: 'uppercase' as const, letterSpacing: u(5) });

  const topMood = profile.moodMap[0];
  const moodScore = topMood ? Math.max(1, Math.min(10, Math.round(topMood.intensity / 10))) : 7;

  let content: React.ReactNode = null;

  if (card === 'archetype') {
    content = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', gap: u(20) }}>
          <Brand u={u} color={C.amber} />
          <View style={{ backgroundColor: C.amberSoft, borderColor: 'rgba(245,158,11,0.2)', borderWidth: 1, borderRadius: u(999), paddingHorizontal: u(28), paddingVertical: u(12) }}>
            <Text style={[label(''), { color: C.amber, fontSize: u(22) }]}>Meu Arquétipo Literário</Text>
          </View>
          <Text style={{ color: C.n100, fontFamily: appFonts.display, fontWeight: '900', fontSize: u(96), lineHeight: u(100), textAlign: 'center' }}>{profile.archetype.name}</Text>
        </View>
        <View style={{ width: u(180), height: u(180), backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: u(44), alignItems: 'center', justifyContent: 'center' }}>
          <ReadoraIcon name="sparkle" size={u(80)} color={C.amber} />
        </View>
        <Text style={{ color: C.n400, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(38), lineHeight: u(50), textAlign: 'center', maxWidth: u(760) }}>“{profile.archetype.description.split('.')[0]}.”</Text>
        <Footer u={u} />
      </View>
    );
  } else if (card === 'mood') {
    content = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', gap: u(16) }}>
          <Brand u={u} color={C.amber} />
          <Text style={label('')}>Minha Atmosfera Predominante</Text>
          <Text style={{ color: C.n100, fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: u(92), textAlign: 'center' }}>{topMood?.mood || 'Equilibrada'}</Text>
        </View>
        <View style={{ width: u(300), height: u(300), alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', width: u(280), height: u(280), borderRadius: u(280), backgroundColor: C.amberSoft }} />
          <ReadoraIcon name="streak" size={u(150)} color={C.amber} />
        </View>
        <View style={{ width: '100%', gap: u(12) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: u(8) }}>
            <Text style={[label(''), { fontSize: u(20) }]}>Intensidade</Text>
            <Text style={{ color: C.amber, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(22) }}>{moodScore}/10</Text>
          </View>
          <View style={{ height: u(14), backgroundColor: C.card, borderRadius: u(999), overflow: 'hidden' }}>
            <View style={{ height: '100%', width: ((moodScore * 10) + '%') as `${number}%`, backgroundColor: C.amber }} />
          </View>
        </View>
        <Footer u={u} />
      </View>
    );
  } else if (card === 'full_profile') {
    const stats: { label: string; value: string; icon: ReadoraIconName }[] = [
      { label: 'Nota Média', value: (profile.genreMetrics[0]?.averageRating || 0).toFixed(1), icon: 'star' },
      { label: 'Preferência', value: profile.tipoNarrativaFavorita, icon: 'bookDetails' },
      { label: 'Ressonância', value: profile.archetype.emotionalResonance, icon: 'heart' },
      { label: 'Critério', value: profile.archetype.demandingGenre, icon: 'pace' }
    ];
    content = (
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Brand u={u} color={C.amber} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={label('')}>Identidade Literária</Text>
            <Text style={{ color: C.n200, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(24), marginTop: u(4) }}>Resumo de Jornada</Text>
          </View>
        </View>
        <View style={{ gap: u(24) }}>
          <View>
            <Text style={{ color: C.n100, fontFamily: appFonts.display, fontWeight: '900', fontSize: u(64), lineHeight: u(68) }}>{profile.archetype.name}</Text>
            <Text style={[label(''), { marginTop: u(8) }]}>{profile.generoFavorito}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: u(18) }}>
            {stats.map((s, i) => (
              <View key={i} style={{ width: '48%', backgroundColor: C.cardSoft, borderColor: C.border, borderWidth: 1, borderRadius: u(28), padding: u(24), gap: u(8) }}>
                <ReadoraIcon name={s.icon} size={u(28)} color={C.amber} />
                <Text style={[label(''), { fontSize: u(18) }]}>{s.label}</Text>
                <Text numberOfLines={1} style={{ color: C.n200, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(26) }}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ backgroundColor: C.amberSoft, borderColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderRadius: u(28), padding: u(28) }}>
          <Text style={{ color: C.n400, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(30), lineHeight: u(42), textAlign: 'center' }}>“{profile.insights[0]}”</Text>
        </View>
        <Footer u={u} />
      </View>
    );
  } else if (card === 'genres') {
    content = (
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View style={{ gap: u(10) }}>
          <Brand u={u} color={C.emerald} />
          <Text style={[label(''), { marginTop: u(8) }]}>Domínios Literários</Text>
          <Text style={{ color: C.n100, fontFamily: appFonts.display, fontWeight: '900', fontSize: u(60), lineHeight: u(64) }}>Exploração de Gêneros</Text>
        </View>
        <View style={{ gap: u(26) }}>
          {(profile.genreMetrics.length ? profile.genreMetrics.slice(0, 4) : [{ genre: 'Sem dados', averageRating: 0, intensity: 0 }]).map((m, i) => (
            <View key={i} style={{ gap: u(10) }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: C.n200, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(28) }}>{m.genre}</Text>
                <Text style={{ color: C.n500, fontFamily: appFonts.mono, fontStyle: 'italic', fontSize: u(26) }}>{m.averageRating.toFixed(1)} ★</Text>
              </View>
              <View style={{ height: u(16), backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: u(999), overflow: 'hidden' }}>
                <View style={{ height: '100%', width: (Math.max(6, Math.min(100, m.intensity)) + '%') as `${number}%`, backgroundColor: C.emerald }} />
              </View>
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: C.cardSoft, borderColor: C.border, borderWidth: 1, borderRadius: u(36), padding: u(30), alignItems: 'center', gap: u(6) }}>
          <Text style={label('')}>Gênero Alvo</Text>
          <Text style={{ color: C.emerald, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(40) }}>{profile.generoFavorito}</Text>
        </View>
        <Footer u={u} />
      </View>
    );
  } else if (card === 'stats') {
    content = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', gap: u(12) }}>
          <Brand u={u} color={C.rose} />
          <Text style={label('')}>Resumo do Ano</Text>
          <Text style={{ color: C.n100, fontFamily: appFonts.display, fontWeight: '900', fontSize: u(96) }}>{year}</Text>
        </View>
        <View style={{ flexDirection: 'row', width: '100%' }}>
          <View style={{ flex: 1, alignItems: 'center', gap: u(6) }}>
            <Text style={{ color: C.rose, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(72) }}>{yearBooks}</Text>
            <Text style={label('')}>Livros</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', gap: u(6) }}>
            <Text style={{ color: C.n100, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(72) }}>{yearPages.toLocaleString('pt-BR')}</Text>
            <Text style={label('')}>Páginas</Text>
          </View>
        </View>
        <View style={{ width: '100%', height: u(10), backgroundColor: C.card, borderRadius: u(999), overflow: 'hidden' }}>
          <View style={{ height: '100%', width: '66%', backgroundColor: C.rose }} />
        </View>
        <View style={{ alignItems: 'center', gap: u(6) }}>
          <Text style={label('')}>Ritmo Dominante</Text>
          <Text style={{ color: C.n200, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(40) }}>{profile.generoFavorito}</Text>
        </View>
        <Footer u={u} />
      </View>
    );
  } else {
    content = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', gap: u(12) }}>
          <Brand u={u} color={C.amber} />
          <Text style={label('')}>A Escolha do Ano</Text>
          <Text style={{ color: C.n100, fontFamily: appFonts.display, fontWeight: '900', fontSize: u(60) }}>Destaque Máximo</Text>
        </View>
        {bestBook ? (
          <View style={{ alignItems: 'center', gap: u(28) }}>
            <View style={{ width: u(300), height: u(420), borderRadius: u(24), backgroundColor: C.card, borderColor: C.border, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              {bestBook.coverUrl
                ? <Image source={{ uri: bestBook.coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                : <ReadoraIcon name="library" size={u(80)} color={C.n800} />}
              <View style={{ position: 'absolute', top: u(16), right: u(16), backgroundColor: C.amber, borderRadius: u(8), paddingHorizontal: u(14), paddingVertical: u(6) }}>
                <Text style={{ color: C.bg, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(24) }}>{(bestBook.rating || 0).toFixed(1)} ★</Text>
              </View>
            </View>
            <View style={{ alignItems: 'center', gap: u(6) }}>
              <Text numberOfLines={1} style={{ color: C.n100, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(44), maxWidth: u(820) }}>{bestBook.title}</Text>
              <Text style={{ color: C.n500, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(32) }}>{bestBook.author}</Text>
            </View>
          </View>
        ) : (
          <Text style={{ color: C.n500, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(32) }}>Nenhum livro finalizado este ano.</Text>
        )}
        <Text style={{ color: C.n600, fontFamily: appFonts.body, fontStyle: 'italic', fontWeight: '900', fontSize: u(24), textTransform: 'uppercase', letterSpacing: u(2), textAlign: 'center' }}>“Minha melhor leitura de {year}”</Text>
        <Footer u={u} />
      </View>
    );
  }

  return (
    <View ref={ref} collapsable={false} style={{ width: W, height: H, backgroundColor: C.bg, padding: u(80), overflow: 'hidden' }}>
      {content}
    </View>
  );
});

export function ShareableProfileCards({ books, onClose }: { books: Book[]; onClose: () => void }) {
  const [card, setCard] = useState<CardType>('archetype');
  const [aspect, setAspect] = useState<Aspect>('story');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const shotRef = useRef<View>(null);

  const data: ArtData = useMemo(() => {
    const year = new Date().getFullYear();
    const finished = books.filter((b) => b.status === 'finished');
    const yearOf = (b: Book) => new Date(b.finishedAt || b.updatedAt || b.createdAt).getFullYear();
    const yearList = finished.filter((b) => yearOf(b) === year);
    return {
      profile: analyzeLiteraryProfile(books),
      bestBook: [...finished].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || null,
      yearBooks: yearList.length,
      yearPages: yearList.reduce((acc, b) => acc + (b.totalPages || 0), 0),
      year
    };
  }, [books]);

  const previewW = aspect === 'square' ? 300 : 250;
  const previewScale = previewW / 1080;

  async function capture(): Promise<string | null> {
    if (!shotRef.current) return null;
    // Ensure the cover (used by the "Livro do Ano" card) is cached/painted first.
    if (data.bestBook?.coverUrl) {
      await Image.prefetch(data.bestBook.coverUrl).catch(() => false);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    return captureRef(shotRef, { format: 'png', quality: 1, result: 'tmpfile' });
  }

  async function handleShare() {
    if (Platform.OS === 'web') { setMessage('Compartilhamento de imagem disponível no app.'); return; }
    setBusy(true);
    try {
      const uri = await capture();
      if (uri && (await Sharing.isAvailableAsync())) {
        haptic('success');
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar identidade literária' });
      } else {
        setMessage('Compartilhamento não disponível.');
      }
    } catch {
      haptic('error');
      setMessage('Não foi possível gerar a imagem.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (Platform.OS === 'web') { setMessage('Salvar imagem disponível no app.'); return; }
    setBusy(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) { setMessage('Permita o acesso à galeria.'); setBusy(false); return; }
      const uri = await capture();
      if (uri) { await MediaLibrary.saveToLibraryAsync(uri); haptic('success'); setMessage('Cartão salvo na galeria.'); }
    } catch {
      haptic('error');
      setMessage('Não foi possível salvar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Exportar Identidade</Text>
            <Pressable onPress={onClose} hitSlop={12}><ReadoraIcon name="close" size={26} color={appColors.textMuted} /></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.aspectRow}>
              <Pressable onPress={() => setAspect('square')} style={[styles.aspectBtn, aspect === 'square' && styles.aspectBtnActive]}><Text style={aspect === 'square' ? styles.aspectTextActive : styles.aspectText}>Quadrado</Text></Pressable>
              <Pressable onPress={() => setAspect('story')} style={[styles.aspectBtn, aspect === 'story' && styles.aspectBtnActive]}><Text style={aspect === 'story' ? styles.aspectTextActive : styles.aspectText}>Story</Text></Pressable>
            </View>

            <View style={styles.previewWrap}>
              <ProfileCardArt card={card} aspect={aspect} scale={previewScale} {...data} />
            </View>

            <Text style={styles.pickLabel}>ESCOLHA O TEMA</Text>
            <View style={styles.chips}>
              {CARD_TYPES.map((t) => (
                <Pressable key={t.id} onPress={() => setCard(t.id)} style={[styles.chip, card === t.id && styles.chipActive]}>
                  <Text style={[styles.chipText, card === t.id && styles.chipTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={[styles.primary, busy && styles.disabled]} onPress={handleShare} disabled={busy}>
              <ReadoraIcon name="share" size={17} color={appColors.background} /><Text style={styles.primaryText}>{busy ? 'Gerando...' : 'Compartilhar'}</Text>
            </Pressable>
            {Platform.OS !== 'web' ? (
              <Pressable style={[styles.secondary, busy && styles.disabled]} onPress={handleSave} disabled={busy}>
                <ReadoraIcon name="download" size={17} color={appColors.gold} /><Text style={styles.secondaryText}>Salvar na galeria</Text>
              </Pressable>
            ) : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </ScrollView>
        </View>

        {/* off-screen full-res capture source */}
        {Platform.OS !== 'web' ? (
          <View style={styles.offscreen} pointerEvents="none">
            <ProfileCardArt ref={shotRef} card={card} aspect={aspect} scale={1} {...data} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: appColors.sidebar, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '94%', borderColor: appColors.border, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22, borderBottomColor: appColors.border, borderBottomWidth: 1 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 24, fontWeight: '900' },
  scroll: { padding: 22, gap: 18, alignItems: 'center' },
  aspectRow: { flexDirection: 'row', gap: 8, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, padding: 4 },
  aspectBtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 22 },
  aspectBtnActive: { backgroundColor: appColors.gold },
  aspectText: { color: appColors.textMuted, fontWeight: '900', fontSize: 13 },
  aspectTextActive: { color: appColors.background, fontWeight: '900', fontSize: 13 },
  previewWrap: { borderColor: appColors.borderSoft, borderWidth: 1, borderRadius: 18, padding: 10, backgroundColor: appColors.surface },
  pickLabel: { alignSelf: 'flex-start', color: appColors.textDim, fontSize: 11, letterSpacing: 3, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'stretch' },
  chip: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: appColors.surface },
  chipActive: { backgroundColor: appColors.goldDeep, borderColor: appColors.gold },
  chipText: { color: appColors.textMuted, fontWeight: '900', fontSize: 13 },
  chipTextActive: { color: appColors.gold, fontWeight: '900', fontSize: 13 },
  primary: { alignSelf: 'stretch', flexDirection: 'row', gap: 9, backgroundColor: appColors.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: appColors.background, fontWeight: '900', fontSize: 15 },
  secondary: { alignSelf: 'stretch', flexDirection: 'row', gap: 9, borderColor: appColors.goldDeep, borderWidth: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: appColors.gold, fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.6 },
  message: { color: appColors.gold, fontWeight: '900', textAlign: 'center' },
  offscreen: { position: 'absolute', left: -20000, top: 0 }
});
