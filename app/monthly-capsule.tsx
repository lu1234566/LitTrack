import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { FeedCapsuleArt, FeedCapsuleBook } from '@/components/FeedCapsuleArt';
import { StoryCapsuleArt } from '@/components/StoryCapsuleArt';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { downloadCapsulePng } from '@/services/webPlatformTools';
import { copyText, haptic } from '@/services/feedback';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';

export default function MonthlyCapsuleScreen() {
  const { books, stats } = useBooks();
  const { preferences } = usePreferences();
  const { sessions } = useReadingSessions();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'app' | 'instagram'>('app');
  const [format, setFormat] = useState<'feed' | 'story'>('feed');
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
  const ratingOutOf10 = monthAverage * 2;
  const month = selected.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const monthName = selected.toLocaleDateString('pt-BR', { month: 'long' });
  const vibe = monthSessions[0]?.mood || monthBooks.find((book) => book.mood)?.mood || 'Sereno';
  const minutesLabel = Math.floor(monthMinutes / 60) + 'h ' + (monthMinutes % 60) + 'm';

  // Top 5: maior nota, mais páginas, ordem alfabética — igual à web.
  const top5Books: FeedCapsuleBook[] = useMemo(() => (
    [...monthBooks]
      .sort((a, b) => {
        if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
        if ((b.totalPages || 0) !== (a.totalPages || 0)) return (b.totalPages || 0) - (a.totalPages || 0);
        return a.title.localeCompare(b.title);
      })
      .slice(0, 5)
      .map((book) => ({ id: book.id, title: book.title, author: book.author, pageCount: book.totalPages || 0, rating: book.rating || 0, coverUrl: book.coverUrl }))
  ), [monthBooks]);
  const bestBook = top5Books[0] || null;

  const literaryCopy = useMemo(() => {
    if (monthFinished === 0) return monthName + ' foi um período de pausa e reflexão silenciosa entre as páginas.';
    if (ratingOutOf10 >= 8) return 'Sua jornada em ' + monthName + ' foi marcada por encontros sublimes e histórias que ecoaram profundamente.';
    if (monthPages > 500) return 'Em ' + monthName + ', você mergulhou intensamente em novos mundos, percorrendo caminhos de papel e tinta.';
    return 'Um mês de descobertas e novos começos literários. ' + monthName + ' deixou sua marca em sua estante.';
  }, [monthFinished, ratingOutOf10, monthPages, monthName]);

  const feedData = {
    monthName,
    year: selYear,
    totalBooks: monthFinished || monthBooks.length,
    totalPages: monthPages,
    ratingOutOf10,
    dominantMood: vibe,
    top5Books,
    bestBook,
    literaryCopy
  };

  const previewWidth = mobile ? width - 40 : Math.min(width * 0.46, 540);
  const previewScale = previewWidth / 1080;

  const caption = useMemo(() => 'Minha cápsula literária de ' + monthName + ' no Readora 📚✨\n\n📖 Livros concluídos: ' + monthFinished + '\n📄 Páginas lidas: ' + monthPages + '\n⭐ Média do mês: ' + ratingOutOf10.toFixed(1) + '/10\n🎭 Vibe: ' + vibe + '\n\nGerado automaticamente pelo @readora.app 📱\n#Readora #CapsulaLiteraria #Leitura #Books #MonthlyWrapUp', [monthName, monthPages, ratingOutOf10, monthFinished, vibe]);

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
      averageRating: ratingOutOf10.toFixed(1),
      vibe,
      genre: stats.favoriteGenre || 'Diverso',
      bookCount: monthBooks.length
    });
    setMessage(ok ? 'Cápsula PNG baixada pelo navegador.' : 'Download PNG disponível apenas no navegador com suporte a Canvas.');
  }

  // Native: snapshot do card em alta resolução (1080×1350) e abre a folha de
  // compartilhamento nativa. Web: mantém o download via Canvas.
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
          <View style={styles.previewCol}>
            <View style={styles.formatRow}>
              <Pressable onPress={() => setFormat('feed')} style={[styles.formatBtn, format === 'feed' && styles.formatBtnActive]}><Text style={format === 'feed' ? styles.formatTextActive : styles.formatText}>Feed (4:5)</Text></Pressable>
              <Pressable onPress={() => setFormat('story')} style={[styles.formatBtn, format === 'story' && styles.formatBtnActive]}><Text style={format === 'story' ? styles.formatTextActive : styles.formatText}>Story (9:16)</Text></Pressable>
            </View>
            <View style={[styles.previewFrame, { width: previewWidth + 24 }]}>
              {format === 'feed'
                ? <FeedCapsuleArt scale={previewScale} {...feedData} />
                : <StoryCapsuleArt scale={previewScale} {...feedData} />}
            </View>
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

      {/* Fonte de captura em alta resolução (Feed 1080×1350 / Story 1080×1920), fora da tela. */}
      {Platform.OS !== 'web' ? (
        <View style={styles.offscreen} pointerEvents="none">
          {format === 'feed'
            ? <FeedCapsuleArt ref={shotRef} scale={1} {...feedData} />
            : <StoryCapsuleArt ref={shotRef} scale={1} {...feedData} />}
        </View>
      ) : null}
    </Screen>
  );
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
  previewCol: { alignItems: 'center', justifyContent: 'center', gap: 14 },
  formatRow: { flexDirection: 'row', gap: 8, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, padding: 4 },
  formatBtn: { borderRadius: 10, paddingVertical: 9, paddingHorizontal: 18 },
  formatBtnActive: { backgroundColor: appColors.gold },
  formatText: { color: appColors.textMuted, fontWeight: '900', fontSize: 13 },
  formatTextActive: { color: appColors.background, fontWeight: '900', fontSize: 13 },
  previewFrame: { backgroundColor: appColors.surface, borderColor: appColors.borderSoft, borderWidth: 1, borderRadius: 28, padding: 12, alignItems: 'center' },
  offscreen: { position: 'absolute', left: -20000, top: 0 },
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
