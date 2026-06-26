import { forwardRef, useMemo, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { downloadCapsulePng } from '@/services/webPlatformTools';
import { copyText, haptic } from '@/services/feedback';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';

type CapsuleArtBook = { id: string; coverUrl?: string; title: string };
type CapsuleArtProps = {
  monthName: string;
  readerName: string;
  year: number;
  finished: number;
  pages: number;
  minutesLabel: string;
  average: string;
  books: CapsuleArtBook[];
  vibe: string;
  genre: string;
};

// The shareable card, isolated as a forwardRef view so react-native-view-shot
// can snapshot exactly this node as a PNG. The same component renders the
// visible preview inside the phone frame, so what you share matches the screen.
const CapsuleArt = forwardRef<View, CapsuleArtProps>(function CapsuleArt(
  { monthName, readerName, year, finished, pages, minutesLabel, average, books, vibe, genre },
  ref
) {
  return (
    <View ref={ref} collapsable={false} style={styles.capsuleCard}>
      <Text style={styles.cardKicker}>READORA • MEMÓRIAS LITERÁRIAS</Text>
      <Text style={styles.cardTitle}>Cápsula de {capitalize(monthName)}</Text>
      <Text style={styles.cardSubtitle}>Jornada de {readerName} • {year}</Text>
      <Text style={styles.poem}>“{capitalize(monthName)} foi um período de pausa e reflexão silenciosa entre as páginas.”</Text>
      <View style={styles.miniGrid}>
        <MiniStat label="LIVROS LIDOS" value={String(finished)} />
        <MiniStat label="PÁGINAS" value={String(pages)} />
        <MiniStat label="TEMPO DE FOCO" value={minutesLabel} />
        <MiniStat label="MÉDIA DO MÊS" value={average} />
      </View>
      <Text style={styles.acervo}>ACERVO DO MÊS ({books.length})</Text>
      {books.length > 0 ? (
        <View style={styles.bookRow}>
          {books.slice(0, 8).map((book) => (
            book.coverUrl
              ? <Image key={book.id} source={{ uri: book.coverUrl }} style={styles.bookCover} />
              : <View key={book.id} style={[styles.bookCover, styles.bookCoverFallback]}><Text style={styles.bookCoverInitial}>{book.title.slice(0, 1).toUpperCase()}</Text></View>
          ))}
        </View>
      ) : (
        <View style={styles.ghostBox}><Text style={styles.ghostText}>Nenhum livro registrado em {capitalize(monthName)} ainda.</Text></View>
      )}
      <View style={styles.cardFooter}><Text style={styles.footerText}>ATMOSFERA{`\n`}{vibe}</Text><Text style={styles.footerText}>UNIVERSO DE FOCO{`\n`}{genre}</Text></View>
    </View>
  );
});

export default function MonthlyCapsuleScreen() {
  const { books, stats } = useBooks();
  const { preferences } = usePreferences();
  const { sessions } = useReadingSessions();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'app' | 'instagram'>('app');
  const [monthOffset, setMonthOffset] = useState(0);
  const shotRef = useRef<View>(null);

  const selected = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);
  const selMonth = selected.getMonth();
  const selYear = selected.getFullYear();

  const monthBooks = useMemo(() => books.filter((book) => {
    const d = new Date(book.updatedAt || book.createdAt);
    return d.getMonth() === selMonth && d.getFullYear() === selYear;
  }), [books, selMonth, selYear]);
  const monthSessions = useMemo(() => sessions.filter((session) => {
    const d = new Date(session.createdAt);
    return d.getMonth() === selMonth && d.getFullYear() === selYear;
  }), [sessions, selMonth, selYear]);

  const monthFinished = monthBooks.filter((book) => book.status === 'finished').length;
  const monthMinutes = monthSessions.reduce((sum, session) => sum + session.minutesRead, 0);
  const monthPages = monthSessions.reduce((sum, session) => sum + session.pagesRead, 0)
    || monthBooks.reduce((sum, book) => sum + (book.totalPages || 0), 0);
  const ratedBooks = monthBooks.filter((book) => (book.rating || 0) > 0);
  const monthAverage = ratedBooks.length ? ratedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / ratedBooks.length : 0;
  const month = selected.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const monthName = selected.toLocaleDateString('pt-BR', { month: 'long' });
  const vibe = monthSessions[0]?.mood || monthBooks.find((book) => book.mood)?.mood || 'Sereno';
  const minutesLabel = Math.floor(monthMinutes / 60) + 'h ' + (monthMinutes % 60) + 'm';

  const caption = useMemo(() => 'Minha cápsula literária de ' + monthName + ' no Readora 📚✨\n\n📖 Livros concluídos: ' + monthFinished + '\n📄 Páginas lidas: ' + monthPages + '\n⭐ Média do mês: ' + monthAverage.toFixed(1) + '\n🎭 Vibe: ' + vibe + '\n\nGerado automaticamente pelo @readora.app 📱\n#Readora #CapsulaLiteraria #Leitura #Books #MonthlyWrapUp', [monthName, monthPages, monthAverage, monthFinished, vibe]);

  const art: CapsuleArtProps = {
    monthName,
    readerName: preferences.readerName || 'Lucas Barcelar',
    year: selYear,
    finished: monthFinished,
    pages: monthPages,
    minutesLabel,
    average: monthAverage.toFixed(1),
    books: monthBooks,
    vibe,
    genre: stats.favoriteGenre || 'Diverso'
  };

  async function copyCaption() {
    const ok = await copyText(caption);
    haptic(ok ? 'success' : 'warning');
    setMessage(ok
      ? 'Legenda copiada para a área de transferência.'
      : 'Não foi possível copiar automaticamente. Selecione a legenda abaixo e copie manualmente.');
  }

  function downloadOnWeb() {
    const ok = downloadCapsulePng({
      readerName: preferences.readerName || 'Lucas Barcelar',
      monthName,
      year: String(selYear),
      finishedBooks: monthFinished,
      pages: monthPages,
      minutesLabel,
      averageRating: monthAverage.toFixed(1),
      vibe,
      genre: stats.favoriteGenre || 'Diverso',
      bookCount: monthBooks.length
    });
    setMessage(ok ? 'Cápsula PNG baixada pelo navegador.' : 'Download PNG disponível apenas no navegador com suporte a Canvas.');
  }

  // Native: snapshot the card and open the OS share sheet (Instagram, WhatsApp,
  // salvar na galeria…). Web: keep the canvas-based PNG download.
  async function handleShareImage() {
    if (Platform.OS === 'web') {
      downloadOnWeb();
      return;
    }
    try {
      if (!shotRef.current) {
        setMessage('A imagem da cápsula ainda está sendo preparada. Tente novamente em instantes.');
        return;
      }
      const uri = await captureRef(shotRef, { format: 'png', quality: 1, result: 'tmpfile' });
      haptic('success');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar Cápsula Literária' });
        setMessage('Cápsula pronta para compartilhar.');
      } else {
        setMessage('Compartilhamento não está disponível neste dispositivo.');
      }
    } catch {
      haptic('error');
      setMessage('Não foi possível gerar a imagem da cápsula. Tente novamente.');
    }
  }

  return (
    <Screen>
      <View style={[styles.headerRow, mobile && styles.stack]}>
        <View style={styles.headerText}>
          <View style={styles.kickerRow}><ReadoraIcon name="monthlyCapsule" size={14} color={appColors.gold} /><Text style={styles.kicker}>RESUMO MENSAL V1.2</Text></View>
          <Text style={styles.title}>Cápsula Literária</Text>
          <Text style={styles.subtitle}>Um resumo visual e poético da sua jornada literária mês a mês. Perfeito para compartilhar suas conquistas.</Text>
        </View>
        <Card>
          <Text style={styles.periodLabel}>PERÍODO</Text>
          <View style={styles.periodRow}>
            <Pressable onPress={() => setMonthOffset((o) => o - 1)} hitSlop={10}><ReadoraIcon name="back" size={18} color={appColors.gold} /></Pressable>
            <Text style={styles.period}>{capitalize(month)}</Text>
            <Pressable onPress={() => setMonthOffset((o) => Math.min(0, o + 1))} hitSlop={10}><ReadoraIcon name="forward" size={18} color={monthOffset < 0 ? appColors.gold : appColors.textDim} /></Pressable>
          </View>
        </Card>
      </View>

      <View style={styles.segmented}>
        <Pressable onPress={() => setTab('app')} style={[tab === 'app' ? styles.segmentActive : styles.segment, styles.btnRow]}>
          <ReadoraIcon name="sparkle" size={16} color={tab === 'app' ? appColors.background : appColors.textMuted} />
          <Text style={tab === 'app' ? styles.segmentTextActive : styles.segmentText}>App Capsule</Text>
        </Pressable>
        <Pressable onPress={() => setTab('instagram')} style={[tab === 'instagram' ? styles.segmentActive : styles.segment, styles.btnRow]}>
          <ReadoraIcon name="share" size={16} color={tab === 'instagram' ? appColors.background : appColors.textMuted} />
          <Text style={tab === 'instagram' ? styles.segmentTextActive : styles.segmentText}>Instagram</Text>
        </Pressable>
      </View>

      {tab === 'app' ? (
        <View style={[styles.mainGrid, mobile && styles.stack]}>
          <View style={styles.phoneFrame}>
            <CapsuleArt {...art} />
          </View>

          <View style={styles.essence}>
            <Text style={styles.essenceTitle}>Sua Essência de {month}</Text>
            <EssenceLine value={String(monthPages)} label="PÁGINAS PERCORRIDAS" text="A distância mística que seus olhos atravessaram este mês." />
            <EssenceLine value={String(monthFinished)} label="HISTÓRIAS CONCLUÍDAS" text="O número de universos que agora fazem parte da sua história." />
            <EssenceLine value={vibe} label="ATMOSFERA DOMINANTE" text="O sentimento que guiou suas escolhas e momentos de leitura." />
            <Pressable style={[styles.downloadButton, styles.btnRow]} onPress={handleShareImage}><ReadoraIcon name="share" size={17} color={appColors.background} /><Text style={styles.downloadText}>{Platform.OS === 'web' ? 'Baixar Cápsula PNG' : 'Compartilhar Cápsula'}</Text></Pressable>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.shareTitle}>Legenda Sugerida</Text>
          <Card>
            <View style={[styles.captionHeader, mobile && styles.stack]}>
              <Text style={styles.captionTitle}>Pronta para copiar e colar no seu post.</Text>
              <Pressable style={[styles.copyButton, styles.btnRow]} onPress={copyCaption}><ReadoraIcon name="copy" size={17} color={appColors.background} /><Text style={styles.copyText}>Copiar Legenda</Text></Pressable>
            </View>
            <Text selectable style={styles.caption}>{caption}</Text>
          </Card>
          <Pressable style={[styles.downloadButton, styles.btnRow]} onPress={handleShareImage}><ReadoraIcon name="share" size={17} color={appColors.background} /><Text style={styles.downloadText}>{Platform.OS === 'web' ? 'Baixar imagem para o Instagram' : 'Compartilhar imagem da cápsula'}</Text></Pressable>
        </>
      )}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {/* Off-screen capture source so the share sheet works from either tab. */}
      {Platform.OS !== 'web' ? (
        <View style={styles.offscreen} pointerEvents="none">
          <CapsuleArt ref={shotRef} {...art} />
        </View>
      ) : null}
    </Screen>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <View style={styles.miniStat}><Text style={styles.miniLabel}>{label}</Text><Text style={styles.miniValue}>{value}</Text></View>;
}

function EssenceLine({ value, label, text }: { value: string; label: string; text: string }) {
  return <View style={styles.essenceLine}><Text style={styles.essenceValue}>{value}</Text><View style={styles.essenceTextBox}><Text style={styles.essenceLabel}>{label}</Text><Text style={styles.essenceText}>{text}</Text></View></View>;
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'column' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 28 },
  headerText: { flex: 1 },
  kicker: { color: appColors.gold, fontSize: 12, letterSpacing: 4, fontWeight: '900' },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 56, lineHeight: 64, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 18, lineHeight: 27, maxWidth: 560 },
  periodLabel: { color: appColors.textDim, letterSpacing: 4, fontSize: 11, textAlign: 'center' },
  period: { color: appColors.text, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  segmented: { alignSelf: 'center', flexDirection: 'row', backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 18, padding: 5 },
  segmentActive: { backgroundColor: appColors.gold, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  segment: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  segmentTextActive: { color: appColors.background, fontWeight: '900' },
  segmentText: { color: appColors.textMuted, fontWeight: '900' },
  mainGrid: { flexDirection: 'row', gap: 36, alignItems: 'center' },
  phoneFrame: { flex: 1, backgroundColor: appColors.surface, borderColor: appColors.borderSoft, borderWidth: 1, borderRadius: 42, padding: 48, alignItems: 'center' },
  offscreen: { position: 'absolute', left: -10000, top: 0, width: 330 },
  capsuleCard: { width: '100%', maxWidth: 330, minHeight: 560, backgroundColor: 'rgb(25,23,20)', borderColor: appColors.borderSoft, borderWidth: 1, padding: 26, gap: 14 },
  cardKicker: { color: appColors.gold, letterSpacing: 5, fontSize: 10, fontWeight: '900' },
  cardTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 36, lineHeight: 40, fontWeight: '900' },
  cardSubtitle: { color: appColors.textMuted, fontSize: 13 },
  poem: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', textAlign: 'center', marginVertical: 24, lineHeight: 22 },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  miniStat: { width: '47%', backgroundColor: appColors.surface, borderColor: appColors.borderSoft, borderWidth: 1, borderRadius: 10, padding: 12 },
  miniLabel: { color: appColors.textDim, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  miniValue: { color: appColors.text, fontSize: 18, fontWeight: '900', marginTop: 4 },
  acervo: { backgroundColor: appColors.background, color: appColors.textMuted, letterSpacing: 3, fontSize: 10, fontWeight: '900', padding: 8, marginTop: 12 },
  ghostBox: { minHeight: 70, borderColor: appColors.border, borderStyle: 'dashed', borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', padding: 12 },
  ghostText: { color: appColors.textDim, fontFamily: appFonts.display, fontStyle: 'italic', textAlign: 'center', fontSize: 12 },
  bookRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bookCover: { width: 44, height: 64, borderRadius: 6, backgroundColor: appColors.background, borderColor: appColors.borderSoft, borderWidth: 1 },
  bookCoverFallback: { alignItems: 'center', justifyContent: 'center' },
  bookCoverInitial: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 20, fontWeight: '900' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' },
  footerText: { color: appColors.textMuted, fontSize: 10, fontWeight: '900' },
  essence: { flex: 1, gap: 24 },
  essenceTitle: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 30, fontWeight: '900' },
  essenceLine: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  essenceValue: { color: appColors.text, fontFamily: appFonts.display, fontSize: 30, fontWeight: '900', minWidth: 50 },
  essenceTextBox: { flex: 1 },
  essenceLabel: { color: appColors.textMuted, fontSize: 13, letterSpacing: 3, fontWeight: '900' },
  essenceText: { color: appColors.textDim, fontFamily: appFonts.display, fontStyle: 'italic', lineHeight: 20, marginTop: 4 },
  downloadButton: { backgroundColor: appColors.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  downloadText: { color: appColors.background, fontWeight: '900' },
  shareTitle: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 26, fontWeight: '900' },
  captionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18 },
  captionTitle: { color: appColors.text, fontSize: 24, fontWeight: '900', flex: 1 },
  copyButton: { backgroundColor: appColors.gold, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24 },
  copyText: { color: appColors.background, fontWeight: '900', fontSize: 17 },
  message: { color: appColors.gold, fontWeight: '900', marginTop: 12 },
  caption: { color: appColors.textMuted, fontFamily: appFonts.mono, fontSize: 18, lineHeight: 30, backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 22, padding: 28, marginTop: 18 }
});
