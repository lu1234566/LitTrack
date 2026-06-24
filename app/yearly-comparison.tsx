import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { appColors } from '@/theme/tokens';

export default function YearlyComparisonScreen() {
  const { books } = useBooks();
  const { sessions } = useReadingSessions();
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const rows = years.map((year) => {
    const yearBooks = books.filter((book) => new Date(book.createdAt).getFullYear() === year || (book.finishedAt && new Date(book.finishedAt).getFullYear() === year));
    const yearSessions = sessions.filter((session) => new Date(session.createdAt).getFullYear() === year);
    return {
      year,
      books: yearBooks.length,
      finished: yearBooks.filter((book) => book.status === 'finished').length,
      pages: yearSessions.reduce((sum, session) => sum + session.pagesRead, 0),
      minutes: yearSessions.reduce((sum, session) => sum + session.minutesRead, 0),
      sessions: yearSessions.length
    };
  });

  return (
    <Screen>
      <Text style={styles.title}>Comparativo anual</Text>
      <Text style={styles.subtitle}>Comparacao entre anos usando livros cadastrados e sessoes de leitura.</Text>
      {rows.map((row) => (
        <Card key={row.year}>
          <Text style={styles.year}>{row.year}</Text>
          <View style={styles.grid}>
            <View style={styles.item}><Text style={styles.big}>{row.books}</Text><Text style={styles.label}>livros</Text></View>
            <View style={styles.item}><Text style={styles.big}>{row.finished}</Text><Text style={styles.label}>lidos</Text></View>
            <View style={styles.item}><Text style={styles.big}>{row.pages}</Text><Text style={styles.label}>paginas</Text></View>
            <View style={styles.item}><Text style={styles.big}>{row.minutes}</Text><Text style={styles.label}>min</Text></View>
          </View>
          <Text style={styles.body}>{row.sessions} sessao(oes) registradas neste ano.</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  year: { color: appColors.gold, fontSize: 20, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  item: { width: '47%', backgroundColor: appColors.surfaceSoft, borderRadius: 16, padding: 12 },
  big: { color: appColors.text, fontSize: 24, fontWeight: '900' },
  label: { color: appColors.textMuted, fontSize: 12 },
  body: { color: appColors.textMuted, lineHeight: 22, marginTop: 10 }
});
