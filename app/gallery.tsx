import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useBooks } from '@/contexts/BookContext';
import { statusLabel } from '@/services/bookStorage';
import { BookStatus } from '@/types/book';
import { appColors } from '@/theme/tokens';

const filters: Array<'all' | BookStatus> = ['all', 'reading', 'finished', 'wishlist'];

export default function GalleryScreen() {
  const { books } = useBooks();
  const [filter, setFilter] = useState<'all' | BookStatus>('all');
  const visibleBooks = filter === 'all' ? books : books.filter((book) => book.status === filter);

  return (
    <Screen>
      <Text style={styles.title}>Galeria</Text>
      <Text style={styles.subtitle}>Parede visual das suas leituras com filtro por status.</Text>
      <View style={styles.filterRow}>
        {filters.map((item) => (
          <Pressable key={item} style={[styles.filterButton, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{labelFor(item)}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.count}>{visibleBooks.length} livro(s)</Text>
      <View style={styles.grid}>
        {visibleBooks.map((book) => (
          <Link key={book.id} href={{ pathname: '/book/[id]', params: { id: book.id } }} asChild>
            <Pressable style={styles.tile}>
              <View style={styles.cover}>
                <Text style={styles.initial}>{book.title.slice(0, 1).toUpperCase()}</Text>
                <Text style={styles.genre} numberOfLines={1}>{book.genre}</Text>
              </View>
              <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
              <Text style={styles.status}>{statusLabel(book.status)}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
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
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterButton: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  filterActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  filterText: { color: appColors.textMuted, fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: appColors.background },
  count: { color: appColors.textMuted, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tile: { width: '47%', gap: 8 },
  cover: { height: 190, borderRadius: 22, backgroundColor: appColors.surface, borderColor: appColors.gold, borderWidth: 1, justifyContent: 'center', alignItems: 'center', padding: 14 },
  initial: { color: appColors.gold, fontSize: 48, fontWeight: '900' },
  genre: { color: appColors.textDim, marginTop: 10, fontWeight: '800' },
  bookTitle: { color: appColors.text, fontWeight: '900', lineHeight: 18 },
  status: { color: appColors.textMuted, fontSize: 12 }
});
