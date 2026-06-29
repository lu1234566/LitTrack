import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { BookCard } from '@/components/BookCard';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { BookStatus } from '@/types/book';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';

const filters: Array<'all' | BookStatus> = ['all', 'wishlist', 'finished', 'reading', 'dnf'];
const sortOptions = ['recentes', 'nota', 'titulo', 'paginas'] as const;

type SortOption = typeof sortOptions[number];

export default function LibraryScreen() {
  const { books, loading, reload } = useBooks();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<'all' | BookStatus>('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('recentes');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

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

  const header = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Livros</Text>
        <Text style={styles.subtitle}>Sua biblioteca pessoal.</Text>
      </View>

      <View style={[styles.topActions, mobile && styles.stack]}>
        <Link href="/shelves" asChild><Pressable style={styles.createShelf}><ReadoraIcon name="shelves" size={30} color={appColors.textMuted} /><Text style={styles.createShelfText}>Criar{mobile ? '\n' : ' '}Estante</Text></Pressable></Link>
        <Link href="/add" asChild><Pressable style={styles.addReading}><ReadoraIcon name="addBook" size={30} color={appColors.background} /><Text style={styles.addReadingText}>Adicionar{mobile ? '\n' : ' '}Leitura</Text></Pressable></Link>
      </View>

      <Text style={styles.kicker}>MINHAS ESTANTES</Text>
      <View style={styles.chipScroller}>
        {filters.map((item) => (
          <Pressable key={item} style={[styles.shelfChip, filter === item && styles.shelfChipActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.shelfChipText, filter === item && styles.shelfChipTextActive]}>{labelFor(item)} <Text style={styles.countText}>({countFor(item, books)})</Text></Text>
          </Pressable>
        ))}
        {genres.filter((genre) => genre !== 'all').slice(0, 4).map((genre) => (
          <Pressable key={genre} style={[styles.shelfChip, genreFilter === genre && styles.shelfChipActive]} onPress={() => setGenreFilter(genreFilter === genre ? 'all' : genre)}>
            <Text style={[styles.shelfChipText, genreFilter === genre && styles.shelfChipTextActive]}>{genre}</Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <View style={[styles.searchRow, mobile && styles.stack]}>
          <TextInput style={styles.searchInput} placeholder="Buscar por título ou autor..." placeholderTextColor={appColors.textDim} value={text} onChangeText={setText} />
          <View style={styles.selectRow}>
            <FilterSelect label={genreFilter === 'all' ? 'Todas' : genreFilter} />
            <FilterSelect label={filter === 'all' ? 'Todos' : labelFor(filter)} />
            <FilterSelect label={sortBy === 'recentes' ? 'Mais Recentes' : sortBy} onPress={() => setSortBy(nextSort(sortBy))} />
          </View>
        </View>
      </Card>

      {loading ? <Text style={styles.muted}>Carregando livros...</Text> : null}
    </>
  );

  const empty = !loading ? (
    <View style={styles.emptyPanel}>
      <ReadoraIcon name="library" size={56} color={appColors.textDim} />
      <Text style={styles.emptyTitle}>Nenhum livro encontrado</Text>
      <Text style={styles.emptyText}>Tente ajustar seus filtros ou adicione um novo livro.</Text>
      <Link href="/add" asChild><Pressable style={styles.emptyButton}><ReadoraIcon name="addBook" size={18} color={appColors.background} /><Text style={styles.emptyButtonText}>Adicionar Leitura</Text></Pressable></Link>
    </View>
  ) : null;

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={onRefresh}
      data={visibleBooks}
      keyExtractor={(book) => book.id}
      renderItem={(book) => <BookCard book={book} />}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
    />
  );
}

function FilterSelect({ label, onPress }: { label: string; onPress?: () => void }) {
  return <Pressable style={styles.selectButton} onPress={onPress}><Text style={styles.selectText}>{label}</Text></Pressable>;
}

function nextSort(current: SortOption): SortOption {
  const index = sortOptions.indexOf(current);
  return sortOptions[(index + 1) % sortOptions.length];
}

function countFor(status: 'all' | BookStatus, books: Array<{ status: BookStatus }>) {
  if (status === 'all') return books.length;
  return books.filter((book) => book.status === status).length;
}

function labelFor(status: 'all' | BookStatus) {
  if (status === 'all') return 'Todas';
  if (status === 'reading') return 'Lendo';
  if (status === 'finished') return 'Favoritos';
  if (status === 'dnf') return 'Abandonados';
  return 'Quero Ler';
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 54, lineHeight: 62, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 24, lineHeight: 30 },
  topActions: { flexDirection: 'row', gap: 22 },
  stack: { flexDirection: 'column' },
  createShelf: { flex: 1, minHeight: 110, borderColor: appColors.border, borderWidth: 1, borderRadius: 24, backgroundColor: appColors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  addReading: { flex: 1, minHeight: 110, borderRadius: 24, backgroundColor: appColors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  actionIcon: { color: appColors.textMuted, fontSize: 30 },
  actionIconDark: { color: appColors.background, fontSize: 30 },
  createShelfText: { color: appColors.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  addReadingText: { color: appColors.background, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  kicker: { color: appColors.textDim, fontSize: 16, letterSpacing: 7, fontWeight: '900', marginTop: 12 },
  chipScroller: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  shelfChip: { minHeight: 58, borderColor: appColors.border, borderWidth: 1, borderRadius: 18, backgroundColor: appColors.surface, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  shelfChipActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  shelfChipText: { color: appColors.textMuted, fontSize: 17, fontWeight: '800' },
  shelfChipTextActive: { color: appColors.background, fontWeight: '900' },
  countText: { color: appColors.textDim, fontSize: 13 },
  searchRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  searchInput: { flex: 1, backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, color: appColors.text, fontSize: 18 },
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  selectButton: { minHeight: 52, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, backgroundColor: appColors.background, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  selectText: { color: appColors.text, fontSize: 15, fontWeight: '900' },
  emptyPanel: { minHeight: 280, borderColor: appColors.border, borderStyle: 'dashed', borderWidth: 1, borderRadius: 32, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyIcon: { color: appColors.textDim, fontSize: 62 },
  emptyTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: appColors.textMuted, fontSize: 17, textAlign: 'center' },
  emptyButton: { backgroundColor: appColors.gold, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 28, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 9 },
  emptyButtonText: { color: appColors.background, fontWeight: '900', fontSize: 18 },
  muted: { color: appColors.textMuted }
});
