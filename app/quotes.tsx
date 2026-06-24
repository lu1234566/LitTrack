import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { appColors } from '@/theme/tokens';

export default function QuotesScreen() {
  const { books } = useBooks();
  const quotes = books.filter((book) => book.favoriteQuote && book.favoriteQuote.trim().length > 0);

  return (
    <Screen>
      <Text style={styles.title}>Citacoes</Text>
      <Text style={styles.subtitle}>Trechos favoritos conectados aos livros da biblioteca local.</Text>
      {quotes.length === 0 ? <Text style={styles.muted}>Nenhuma citacao cadastrada ainda.</Text> : null}
      {quotes.map((book) => (
        <Card key={book.id}>
          <Text style={styles.quote}>{book.favoriteQuote}</Text>
          <Text style={styles.book}>{book.title}</Text>
          <Text style={styles.author}>{book.author}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  quote: { color: appColors.text, fontSize: 17, lineHeight: 25, fontStyle: 'italic' },
  book: { color: appColors.gold, fontWeight: '900', marginTop: 8 },
  author: { color: appColors.textMuted, marginTop: 2 },
  muted: { color: appColors.textMuted }
});
