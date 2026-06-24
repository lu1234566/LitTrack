import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { BookCard } from '@/components/BookCard';
import { useBooks } from '@/contexts/BookContext';
import { BookStatus } from '@/types/book';
import { appColors } from '@/theme/tokens';

const filters: Array<'all' | BookStatus> = ['all', 'reading', 'finished', 'wishlist'];

export default function LibraryScreen() {
  const { books, loading, stats } = useBooks();
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<'all' | BookStatus>('all');

  const visibleBooks = useMemo(() => {
    return books.filter((book) => {
      const okFilter = filter === 'all' || book.status === filter;
      const haystack = (book.title + ' ' + book.author + ' ' + book.genre).toLowerCase();
      const okText = haystack.includes(text.toLowerCase());
      return okFilter && okText;
    });
  }, [books, filter, text]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <Text style={styles.subtitle}>{stats.totalBooks} livros, {stats.pagesRead} paginas registradas e genero principal {stats.favoriteGenre}.</Text>
      </View>

      <TextInput style={styles.input} placeholder="Titulo, autor ou genero" placeholderTextColor={appColors.textDim} value={text} onChangeText={setText} />

      <View style={styles.filterRow}>
        {filters.map((item) => (
          <Pressable key={item} style={[styles.filterButton, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{labelFor(item)}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? <Text style={styles.muted}>Carregando livros...</Text> : null}
      {!loading && visibleBooks.length === 0 ? <Text style={styles.muted}>Nenhum livro encontrado.</Text> : null}
      {visibleBooks.map((book) => <BookCard key={book.id} book={book} />)}
    </Screen>
  );
}

function labelFor(status: 'all' | BookStatus) {
  if (status === 'all') return 'Todos';
  if (status === 'reading') return 'Lendo';
  if (status === 'finished') return 'Lidos';
  return 'Quero ler';
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  input: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterButton: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  filterActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  filterText: { color: appColors.textMuted, fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: appColors.background },
  muted: { color: appColors.textMuted }
});
