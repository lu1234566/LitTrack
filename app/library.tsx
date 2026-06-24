import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { BookCard } from '@/components/BookCard';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { BookStatus } from '@/types/book';
import { appColors } from '@/theme/tokens';

const filters: Array<'all' | BookStatus> = ['all', 'reading', 'finished', 'wishlist'];
const sortOptions = ['recentes', 'nota', 'titulo', 'paginas'] as const;

type SortOption = typeof sortOptions[number];

export default function LibraryScreen() {
  const { books, loading, stats } = useBooks();
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<'all' | BookStatus>('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('recentes');

  const genres = useMemo(() => ['all', ...Array.from(new Set(books.map((book) => book.genre).filter(Boolean)))], [books]);

  const visibleBooks = useMemo(() => {
    const filtered = books.filter((book) => {
      const okFilter = filter === 'all' || book.status === filter;
      const okGenre = genreFilter === 'all' || book.genre === genreFilter;
      const haystack = (book.title + ' ' + book.author + ' ' + book.genre + ' ' + (book.publisher || '')).toLowerCase();
      const okText = haystack.includes(text.toLowerCase());
      return okFilter && okGenre && okText;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'nota') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'titulo') return a.title.localeCompare(b.title);
      if (sortBy === 'paginas') return (b.totalPages || 0) - (a.totalPages || 0);
      return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });
  }, [books, filter, genreFilter, sortBy, text]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <Text style={styles.subtitle}>{stats.totalBooks} livros, {stats.pagesRead} paginas registradas e genero principal {stats.favoriteGenre}.</Text>
      </View>

      <Card>
        <Text style={styles.heroTitle}>Importar com capa real</Text>
        <Text style={styles.heroText}>Use a busca externa para trazer capa, paginas, editora, ano e ISBN automaticamente.</Text>
        <Link href="/discover" asChild>
          <Pressable style={styles.heroButton}><Text style={styles.heroButtonText}>Abrir Descobrir</Text></Pressable>
        </Link>
      </Card>

      <TextInput style={styles.input} placeholder="Titulo, autor, genero ou editora" placeholderTextColor={appColors.textDim} value={text} onChangeText={setText} />

      <Text style={styles.label}>Status</Text>
      <View style={styles.filterRow}>
        {filters.map((item) => (
          <Pressable key={item} style={[styles.filterButton, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{labelFor(item)}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Genero</Text>
      <View style={styles.filterRow}>
        {genres.map((genre) => (
          <Pressable key={genre} style={[styles.filterButton, genreFilter === genre && styles.filterActive]} onPress={() => setGenreFilter(genre)}>
            <Text style={[styles.filterText, genreFilter === genre && styles.filterTextActive]}>{genre === 'all' ? 'Todos' : genre}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Ordenar por</Text>
      <View style={styles.filterRow}>
        {sortOptions.map((option) => (
          <Pressable key={option} style={[styles.filterButton, sortBy === option && styles.filterActive]} onPress={() => setSortBy(option)}>
            <Text style={[styles.filterText, sortBy === option && styles.filterTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.resultCount}>{visibleBooks.length} resultado(s)</Text>
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
  heroTitle: { color: appColors.text, fontSize: 20, fontWeight: '900' },
  heroText: { color: appColors.textMuted, lineHeight: 22 },
  heroButton: { backgroundColor: appColors.gold, borderRadius: 999, alignItems: 'center', paddingVertical: 14, marginTop: 10 },
  heroButtonText: { color: appColors.background, fontWeight: '900' },
  input: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16 },
  label: { color: appColors.gold, fontWeight: '900', fontSize: 13, letterSpacing: 1, marginTop: 4 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterButton: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  filterActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  filterText: { color: appColors.textMuted, fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: appColors.background },
  resultCount: { color: appColors.textMuted, fontSize: 13 },
  muted: { color: appColors.textMuted }
});
