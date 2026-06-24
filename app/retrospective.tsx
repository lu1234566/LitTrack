import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { appColors } from '@/theme/tokens';

export default function RetrospectiveScreen() {
  const { books, stats } = useBooks();
  const { sessions } = useReadingSessions();
  const best = books.filter((book) => book.rating && book.rating > 0).sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  const longest = [...books].sort((a, b) => (b.totalPages || 0) - (a.totalPages || 0))[0];
  const sessionPages = sessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const sessionMinutes = sessions.reduce((sum, session) => sum + session.minutesRead, 0);
  const longestSession = [...sessions].sort((a, b) => b.pagesRead - a.pagesRead)[0];

  return (
    <Screen>
      <Text style={styles.title}>Retrospectiva</Text>
      <Text style={styles.subtitle}>Resumo local com livros, paginas e sessoes de leitura.</Text>
      <Card><Text style={styles.big}>{stats.finishedBooks}</Text><Text style={styles.label}>livros concluidos</Text></Card>
      <Card><Text style={styles.big}>{sessionPages}</Text><Text style={styles.label}>paginas em sessoes</Text></Card>
      <Card><Text style={styles.big}>{sessionMinutes}</Text><Text style={styles.label}>minutos registrados</Text></Card>
      <Card><Text style={styles.cardTitle}>Melhor avaliado</Text><Text style={styles.body}>{best ? best.title + ' - ' + best.rating + '/5' : 'Ainda sem notas.'}</Text></Card>
      <Card><Text style={styles.cardTitle}>Maior livro</Text><Text style={styles.body}>{longest ? longest.title + ' - ' + (longest.totalPages || 0) + ' paginas' : 'Ainda sem livros.'}</Text></Card>
      <Card><Text style={styles.cardTitle}>Sessao mais intensa</Text><Text style={styles.body}>{longestSession ? longestSession.bookTitle + ' - ' + longestSession.pagesRead + ' paginas' : 'Ainda sem sessoes.'}</Text></Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  big: { color: appColors.text, fontSize: 38, fontWeight: '900' },
  label: { color: appColors.textMuted, fontSize: 14 },
  cardTitle: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  body: { color: appColors.textMuted, lineHeight: 22 }
});
