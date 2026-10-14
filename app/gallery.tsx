import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/TranslatedText';
import { Screen } from '@/components/Screen';
import { BookCover } from '@/components/BookCover';
import { useBooks } from '@/contexts/BookContext';
import { statusLabel } from '@/services/bookStorage';
import type { BookStatus } from '@/types/book';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';

type Filter = 'all' | BookStatus;
type Order = 'recent' | 'title' | 'rating';
const filters: Filter[] = ['all', 'reading', 'finished', 'wishlist', 'dnf'];
const orders: Array<{ key: Order; label: string }> = [
  { key: 'recent', label: 'Recentes' },
  { key: 'title', label: 'A–Z' },
  { key: 'rating', label: 'Nota' }
];

export default function GalleryScreen() {
  const { books } = useBooks();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const columns = mobile ? 2 : width < 1150 ? 3 : 4;
  const tileWidth = (columns === 2 ? '47.8%' : columns === 3 ? '31.5%' : '23.4%') as `${number}%`;
  const [filter, setFilter] = useState<Filter>('all');
  const [order, setOrder] = useState<Order>('recent');

  const visibleBooks = useMemo(() => {
    const selected = books.filter((book) => filter === 'all' || book.status === filter);
    return [...selected].sort((a, b) => {
      if (order === 'title') return a.title.localeCompare(b.title, 'pt-BR');
      if (order === 'rating') return (b.rating || 0) - (a.rating || 0) || a.title.localeCompare(b.title, 'pt-BR');
      return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
    });
  }, [books, filter, order]);
  const coverCount = visibleBooks.filter((book) => Boolean(book.coverUrl)).length;
  const topGenre = useMemo(() => {
    const counts = visibleBooks.reduce<Record<string, number>>((acc, book) => {
      const genre = (book.genre || '').trim();
      if (genre) acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }, [visibleBooks]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>SUA BIBLIOTECA VISUAL</Text>
        <Text style={[styles.title, mobile && styles.titleMobile]}>Capas</Text>
        <Text style={styles.subtitle}>Sua coleção em imagens. Toque numa capa para abrir o livro.</Text>
        {topGenre ? <Text style={styles.genre} numberOfLines={1}>Gênero mais frequente: {topGenre}</Text> : null}
      </View>

      <View style={styles.metricsRow}>
        <Metric label="LIVROS" value={visibleBooks.length} />
        <Metric label="COM CAPA" value={coverCount} />
        <Metric label="SEM CAPA" value={visibleBooks.length - coverCount} />
      </View>

      <View style={styles.controls}>
        <View style={styles.filterRow}>
          {filters.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === item }}
              style={[styles.chip, filter === item && styles.chipActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.chipText, filter === item && styles.chipActiveText]}>{labelFor(item)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.sortRow}>
          <Text style={styles.sortTitle}>ORDENAR</Text>
          {orders.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected: order === item.key }}
              onPress={() => setOrder(item.key)}
              style={[styles.sortChip, order === item.key && styles.sortActive]}
            >
              <Text style={[styles.sortText, order === item.key && styles.sortActiveText]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {visibleBooks.length === 0 ? (
        <View style={styles.emptyState}>
          <ReadoraIcon name="gallery" size={42} color={appColors.gold} />
          <Text style={styles.emptyTitle}>Nenhum livro nesta seleção</Text>
          <Text style={styles.emptyText}>Experimente outro filtro ou adicione um livro.</Text>
          <Link href="/add" asChild>
            <Pressable style={styles.addButton}><Text style={styles.addText}>Adicionar leitura</Text></Pressable>
          </Link>
        </View>
      ) : (
        <View style={styles.grid}>
          {visibleBooks.map((book) => (
            <Link key={book.id} href={{ pathname: '/book/[id]', params: { id: book.id } }} asChild>
              <Pressable style={StyleSheet.flatten([styles.tile, { width: tileWidth }])}>
                <BookCover book={book} height={mobile ? 216 : 270} radius={12} />
                <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                <Text style={styles.meta} numberOfLines={1}>{book.author}</Text>
                <View style={styles.bookFooter}>
                  <Text style={styles.status} numberOfLines={1}>{statusLabel(book.status)}</Text>
                  {book.rating ? <Text style={styles.rating}>{book.rating.toFixed(1)} ★</Text> : null}
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function labelFor(status: Filter) {
  if (status === 'all') return 'Todos';
  if (status === 'reading') return 'Lendo';
  if (status === 'finished') return 'Lidos';
  if (status === 'dnf') return 'Abandonados';
  return 'Quero ler';
}

const styles = StyleSheet.create({
  header: { gap: 5 },
  kicker: { color: appColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 44, lineHeight: 52, fontWeight: '900' },
  titleMobile: { fontSize: 38, lineHeight: 44 },
  subtitle: { color: appColors.textMuted, fontSize: 14, lineHeight: 20, maxWidth: 640 },
  genre: { color: appColors.textDim, fontSize: 12, marginTop: 4 },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: appColors.borderSoft, backgroundColor: appColors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, gap: 4 },
  metricLabel: { color: appColors.textDim, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  metricValue: { color: appColors.text, fontSize: 22, fontWeight: '900' },
  controls: { gap: 11 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  chipText: { color: appColors.textMuted, fontSize: 11, fontWeight: '800' },
  chipActiveText: { color: appColors.background },
  sortRow: { flexDirection: 'row', gap: 9, alignItems: 'center', flexWrap: 'wrap' },
  sortTitle: { color: appColors.textDim, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginRight: 3 },
  sortChip: { borderBottomColor: 'transparent', borderBottomWidth: 2, paddingVertical: 5, paddingHorizontal: 3 },
  sortActive: { borderBottomColor: appColors.gold },
  sortText: { color: appColors.textDim, fontSize: 11, fontWeight: '700' },
  sortActiveText: { color: appColors.gold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { minWidth: 0, gap: 4, paddingBottom: 9 },
  bookTitle: { color: appColors.text, fontWeight: '800', fontSize: 13, lineHeight: 18, marginTop: 5 },
  meta: { color: appColors.textDim, fontSize: 11 },
  bookFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, paddingTop: 2 },
  status: { color: appColors.textMuted, fontSize: 10, fontWeight: '700', flexShrink: 1 },
  rating: { color: appColors.gold, fontSize: 10, fontWeight: '800' },
  emptyState: { minHeight: 210, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: appColors.textMuted, textAlign: 'center', lineHeight: 20 },
  addButton: { backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11, marginTop: 4 },
  addText: { color: appColors.background, fontWeight: '900' }
});
