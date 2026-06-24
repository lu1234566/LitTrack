import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { BookCard } from '@/components/BookCard';
import { useBooks } from '@/contexts/BookContext';
import { appColors } from '@/theme/tokens';

export default function LibraryScreen() {
  const { books, loading } = useBooks();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <Text style={styles.subtitle}>Primeira versão nativa da sua estante literária.</Text>
      </View>

      {loading ? <Text style={styles.muted}>Carregando livros...</Text> : null}
      {!loading && books.length === 0 ? <Text style={styles.muted}>Nenhum livro cadastrado ainda.</Text> : null}
      {books.map((book) => <BookCard key={book.id} book={book} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8
  },
  title: {
    color: appColors.text,
    fontSize: 30,
    fontWeight: '900'
  },
  subtitle: {
    color: appColors.textMuted,
    fontSize: 15
  },
  muted: {
    color: appColors.textMuted
  }
});
