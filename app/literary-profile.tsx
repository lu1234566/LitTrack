import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { appColors } from '@/theme/tokens';

export default function LiteraryProfileScreen() {
  const { books, stats } = useBooks();
  const topGenres = Object.entries(books.reduce<Record<string, number>>((acc, book) => {
    acc[book.genre] = (acc[book.genre] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const archetype = stats.favoriteGenre.toLowerCase().includes('fantasia') ? 'Leitor de mundos' : stats.averageRating >= 4 ? 'Curador exigente' : 'Explorador literario';

  return (
    <Screen>
      <Text style={styles.title}>Perfil literario</Text>
      <Text style={styles.subtitle}>Uma leitura inicial do seu comportamento com base na biblioteca local.</Text>
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
      </Card>
    </Screen>
  );
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
