import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { appColors } from '@/theme/tokens';

export default function LiteraryProfileScreen() {
  const { books, stats } = useBooks();
  const { quotes } = useQuotes();
  const { sessions } = useReadingSessions();
  const topGenres = Object.entries(books.reduce<Record<string, number>>((acc, book) => {
    acc[book.genre] = (acc[book.genre] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const totalMinutes = sessions.reduce((sum, session) => sum + session.minutesRead, 0);
  const totalSessionPages = sessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const favoriteQuotes = quotes.filter((quote) => quote.favorite).length;
  const archetype = resolveArchetype(stats.favoriteGenre, stats.averageRating, sessions.length, favoriteQuotes);

  return (
    <Screen>
      <Text style={styles.title}>Perfil literario</Text>
      <Text style={styles.subtitle}>Leitura do seu comportamento com base em livros, sessoes e citacoes.</Text>
      <Card>
        <Text style={styles.cardTitle}>Arquetipo</Text>
        <Text style={styles.archetype}>{archetype}</Text>
        <Text style={styles.body}>Seu genero mais frequente e {stats.favoriteGenre}. A media atual de notas e {stats.averageRating}/5.</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Generos principais</Text>
        {topGenres.map(([genre, count]) => (
          <View key={genre} style={styles.genreRow}>
            <Text style={styles.genre}>{genre}</Text>
            <Text style={styles.count}>{count}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Ritmo</Text>
        <Text style={styles.body}>Voce tem {stats.readingBooks} leitura(s) ativa(s), {stats.finishedBooks} concluida(s) e {stats.wishlistBooks} desejada(s).</Text>
        <Text style={styles.body}>Sessoes: {sessions.length}. Paginas em sessoes: {totalSessionPages}. Minutos: {totalMinutes}.</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Memoria literaria</Text>
        <Text style={styles.body}>{quotes.length} citacao(oes) cadastradas, com {favoriteQuotes} favorita(s).</Text>
        <Text style={styles.body}>Quanto mais citacoes e sessoes forem registradas, mais preciso fica o perfil.</Text>
      </Card>
    </Screen>
  );
}

function resolveArchetype(genre: string, averageRating: number, sessions: number, favoriteQuotes: number) {
  const lowerGenre = genre.toLowerCase();
  if (lowerGenre.includes('fantasia')) return 'Leitor de mundos';
  if (favoriteQuotes >= 3) return 'Guardiao de trechos';
  if (sessions >= 8) return 'Leitor disciplinado';
  if (averageRating >= 4) return 'Curador exigente';
  return 'Explorador literario';
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  cardTitle: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  archetype: { color: appColors.text, fontSize: 26, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22 },
  genreRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: appColors.border, borderBottomWidth: 1, paddingVertical: 10 },
  genre: { color: appColors.text, fontWeight: '800' },
  count: { color: appColors.gold, fontWeight: '900' }
});
