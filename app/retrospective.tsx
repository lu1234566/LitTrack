import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { WrappedStory } from '@/components/WrappedStory';
import { appColors, appFonts } from '@/theme/tokens';

export default function RetrospectiveScreen() {
  const { books, stats } = useBooks();
  const { sessions } = useReadingSessions();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const best = books.filter((book) => book.rating && book.rating > 0).sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  const longest = [...books].sort((a, b) => (b.totalPages || 0) - (a.totalPages || 0))[0];
  const sessionPages = sessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const sessionMinutes = sessions.reduce((sum, session) => sum + session.minutesRead, 0);
  const longestSession = [...sessions].sort((a, b) => b.pagesRead - a.pagesRead)[0];

  const year = new Date().getFullYear();
  const monthlyFinished = Array.from({ length: 12 }, () => 0);
  books.forEach((book) => {
    if (book.status !== 'finished') return;
    const d = new Date(book.finishedAt || book.updatedAt || book.createdAt);
    if (d.getFullYear() === year) monthlyFinished[d.getMonth()] += 1;
  });
  const maxMonthly = Math.max(1, ...monthlyFinished);
  const monthLetters = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const bestMonthIdx = monthlyFinished.indexOf(Math.max(...monthlyFinished));
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const [showWrapped, setShowWrapped] = useState(false);

  return (
    <Screen>
      {showWrapped ? <WrappedStory books={books} year={year} onClose={() => setShowWrapped(false)} /> : null}
      <View style={styles.hero}>
        <Text style={styles.kicker}>RETROSPECTIVA</Text>
        <Text style={styles.title}>Sua jornada em números</Text>
        <Text style={styles.subtitle}>Um painel editorial com os marcos mais fortes da sua vida literária local.</Text>
        <Pressable style={styles.wrappedBtn} onPress={() => setShowWrapped(true)}>
          <ReadoraIcon name="sparkle" size={18} color={appColors.background} />
          <Text style={styles.wrappedText}>Ver minha Readora Wrapped {year}</Text>
        </Pressable>
      </View>

      <View style={[styles.grid, mobile && styles.stack]}>
        <Metric label="LIVROS CONCLUÍDOS" value={String(stats.finishedBooks)} />
        <Metric label="PÁGINAS EM SESSÕES" value={String(sessionPages)} />
        <Metric label="MINUTOS REGISTRADOS" value={String(sessionMinutes)} />
      </View>

      <View style={[styles.featureGrid, mobile && styles.stack]}>
        <Highlight title="Melhor avaliado" value={best ? best.title : 'Ainda sem notas'} detail={best ? best.rating + '/5 estrelas' : 'Avalie seus livros para destacar favoritos.'} color={appColors.gold} />
        <Highlight title="Maior livro" value={longest ? longest.title : 'Ainda sem livros'} detail={longest ? (longest.totalPages || 0) + ' páginas' : 'Cadastre leituras para criar marcos.'} color={appColors.purple} />
        <Highlight title="Sessão mais intensa" value={longestSession ? longestSession.bookTitle : 'Ainda sem sessões'} detail={longestSession ? longestSession.pagesRead + ' páginas em uma sessão' : 'Atualize o progresso dos seus livros para mapear seu ritmo.'} color={appColors.emerald} />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Ritmo de {year}</Text>
        <Text style={styles.body}>Livros concluídos por mês{monthlyFinished[bestMonthIdx] > 0 ? ' — seu mês mais forte foi ' + monthNames[bestMonthIdx] + '.' : '.'}</Text>
        <View style={styles.chart}>
          {monthlyFinished.map((count, i) => (
            <View key={i} style={styles.chartCol}>
              <Text style={styles.chartCount}>{count > 0 ? count : ''}</Text>
              <View style={styles.chartTrack}>
                <View style={[styles.chartBar, { height: (Math.round((count / maxMonthly) * 100) + '%') as `${number}%`, backgroundColor: i === bestMonthIdx && count > 0 ? appColors.gold : appColors.goldDeep }]} />
              </View>
              <Text style={styles.chartMonth}>{monthLetters[i]}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Síntese do ciclo</Text>
        <Text style={styles.body}>Você reuniu {stats.totalBooks} livro(s), concluiu {stats.finishedBooks}, manteve {stats.readingBooks} em leitura e acumulou uma média crítica de {stats.averageRating.toFixed(1)}.</Text>
        <Text style={styles.quote}>“Cada estatística aqui é apenas o rastro visível de uma experiência invisível entre você e as páginas.”</Text>
      </Card>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><Text style={styles.metricLabel}>{label}</Text><Text style={styles.big}>{value}</Text></Card>;
}

function Highlight({ title, value, detail, color }: { title: string; value: string; detail: string; color: string }) {
  return <Card><View style={[styles.colorDot, { backgroundColor: color }]} /><Text style={styles.highlightTitle}>{title}</Text><Text style={styles.highlightValue}>{value}</Text><Text style={styles.body}>{detail}</Text></Card>;
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'column' },
  hero: { minHeight: 250, borderColor: appColors.borderSoft, borderWidth: 1, borderRadius: 42, backgroundColor: appColors.backgroundSoft, alignItems: 'center', justifyContent: 'center', padding: 34, gap: 10 },
  kicker: { color: appColors.gold, letterSpacing: 6, fontSize: 11, fontWeight: '900' },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 52, lineHeight: 58, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: appColors.textMuted, fontSize: 17, lineHeight: 25, textAlign: 'center', maxWidth: 620 },
  wrappedBtn: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 24, marginTop: 8 },
  wrappedText: { color: appColors.background, fontWeight: '900', fontSize: 15 },
  grid: { flexDirection: 'row', gap: 16 },
  featureGrid: { flexDirection: 'row', gap: 16 },
  metricLabel: { color: appColors.textDim, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  big: { color: appColors.text, fontSize: 34, fontWeight: '900' },
  colorDot: { width: 28, height: 6, borderRadius: 999 },
  highlightTitle: { color: appColors.textMuted, fontSize: 13, letterSpacing: 3, fontWeight: '900' },
  highlightValue: { color: appColors.text, fontFamily: appFonts.display, fontSize: 28, fontWeight: '900' },
  cardTitle: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 24, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22 },
  quote: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 22, lineHeight: 30, marginTop: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 18 },
  chartCol: { flex: 1, alignItems: 'center', gap: 6 },
  chartCount: { color: appColors.textMuted, fontSize: 11, fontWeight: '900', height: 14 },
  chartTrack: { width: '70%', height: 120, justifyContent: 'flex-end', backgroundColor: appColors.background, borderRadius: 8, overflow: 'hidden' },
  chartBar: { width: '100%', borderRadius: 8, minHeight: 3 },
  chartMonth: { color: appColors.textDim, fontSize: 11, fontWeight: '900' }
});
