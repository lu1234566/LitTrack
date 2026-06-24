import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Book } from '@/types/book';
import { calculateProgress, statusLabel } from '@/services/bookStorage';
import { appColors } from '@/theme/tokens';

export function BookCard({ book }: { book: Book }) {
  const progress = calculateProgress(book);
  const rating = book.rating && book.rating > 0 ? 'Nota ' + book.rating + '/5' : 'Sem nota';

  return (
    <Link href={{ pathname: '/book/[id]', params: { id: book.id } }} asChild>
      <Pressable style={styles.card}>
        <View style={styles.cover}>
          <Text style={styles.coverText}>{book.title.slice(0, 1).toUpperCase()}</Text>
          <Text style={styles.coverGenre}>{book.genre.slice(0, 10)}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.topLine}>
            <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
            <Text style={styles.rating}>{rating}</Text>
          </View>
          <Text style={styles.author}>{book.author}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.badge}>{statusLabel(book.status)}</Text>
            <Text style={styles.genre}>{book.genre}</Text>
            {book.priority ? <Text style={styles.genre}>Prioridade {book.priority}</Text> : null}
          </View>
          <Text style={styles.reason} numberOfLines={2}>{book.reasonToRead || book.review || 'Toque para ver detalhes da leitura.'}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progress + '%' }]} />
          </View>
          <Text style={styles.progressText}>{progress}% concluido</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 14, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 22, padding: 14 },
  cover: { width: 68, height: 98, borderRadius: 16, backgroundColor: appColors.surfaceSoft, alignItems: 'center', justifyContent: 'center', borderColor: appColors.gold, borderWidth: 1, padding: 6 },
  coverText: { color: appColors.gold, fontSize: 30, fontWeight: '900' },
  coverGenre: { color: appColors.textDim, fontSize: 10, marginTop: 6, textAlign: 'center' },
  info: { flex: 1, gap: 6 },
  topLine: { gap: 4 },
  title: { color: appColors.text, fontSize: 17, fontWeight: '900' },
  rating: { color: appColors.gold, fontSize: 12, fontWeight: '800' },
  author: { color: appColors.textMuted, fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { color: appColors.background, backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: '900' },
  genre: { color: appColors.textDim, fontSize: 12 },
  reason: { color: appColors.textMuted, fontSize: 12, lineHeight: 17 },
  progressTrack: { height: 6, borderRadius: 999, backgroundColor: appColors.border, overflow: 'hidden', marginTop: 2 },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: appColors.emerald },
  progressText: { color: appColors.textDim, fontSize: 11 }
});
