import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useBooks } from '@/contexts/BookContext';
import { statusLabel } from '@/services/bookStorage';
import { appColors } from '@/theme/tokens';

export default function GalleryScreen() {
  const { books } = useBooks();

  return (
    <Screen>
      <Text style={styles.title}>Galeria</Text>
      <Text style={styles.subtitle}>Uma parede visual das suas leituras enquanto as capas reais sao migradas.</Text>
      <View style={styles.grid}>
        {books.map((book) => (
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

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tile: { width: '47%', gap: 8 },
  cover: { height: 190, borderRadius: 22, backgroundColor: appColors.surface, borderColor: appColors.gold, borderWidth: 1, justifyContent: 'center', alignItems: 'center', padding: 14 },
  initial: { color: appColors.gold, fontSize: 48, fontWeight: '900' },
  genre: { color: appColors.textDim, marginTop: 10, fontWeight: '800' },
  bookTitle: { color: appColors.text, fontWeight: '900', lineHeight: 18 },
  status: { color: appColors.textMuted, fontSize: 12 }
});
