import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
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

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>RETROSPECTIVA</Text>
        <Text style={styles.title}>Sua jornada em números</Text>
        <Text style={styles.subtitle}>Um painel editorial com os marcos mais fortes da sua vida literária local.</Text>
      </View>

      <View style={[styles.grid, mobile && styles.stack]}>
        <Metric label="LIVROS CONCLUÍDOS" value={String(stats.finishedBooks)} />
        <Metric label="PÁGINAS EM SESSÕES" value={String(sessionPages)} />
        <Metric label="MINUTOS REGISTRADOS" value={String(sessionMinutes)} />
      </View>

      <View style={[styles.featureGrid, mobile && styles.stack]}>
        <Highlight title="Melhor avaliado" value={best ? best.title : 'Ainda sem notas'} detail={best ? best.rating + '/5 estrelas' : 'Avalie seus livros para destacar favoritos.'} color={appColors.gold} />
        <Highlight title="Maior livro" value={longest ? longest.title : 'Ainda sem livros'} detail={longest ? (longest.totalPages || 0) + ' páginas' : 'Cadastre leituras para criar marcos.'} color={appColors.purple} />
        <Highlight title="Sessão mais intensa" value={longestSession ? longestSession.bookTitle : 'Ainda sem sessões'} detail={longestSession ? longestSession.pagesRead + ' páginas em uma sessão' : 'Registre sessões para mapear seu ritmo.'} color={appColors.emerald} />
      </View>

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
  grid: { flexDirection: 'row', gap: 16 },
  featureGrid: { flexDirection: 'row', gap: 16 },
  metricLabel: { color: appColors.textDim, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  big: { color: appColors.text, fontSize: 34, fontWeight: '900' },
  colorDot: { width: 28, height: 6, borderRadius: 999 },
  highlightTitle: { color: appColors.textMuted, fontSize: 13, letterSpacing: 3, fontWeight: '900' },
  highlightValue: { color: appColors.text, fontFamily: appFonts.display, fontSize: 28, fontWeight: '900' },
  cardTitle: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 24, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22 },
  quote: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 22, lineHeight: 30, marginTop: 12 }
});
