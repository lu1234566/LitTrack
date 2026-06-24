import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Book } from '@/types/book';
import { calculateProgress } from '@/services/bookStorage';
import { appColors } from '@/theme/tokens';

function statusLabel(status: Book['status']) {
  if (status === 'finished') return 'Lido';
  if (status === 'wishlist') return 'Quero ler';
  return 'Lendo';
}

export function BookCard({ book }: { book: Book }) {
  const progress = calculateProgress(book);

  return (
    <Link href={{ pathname: '/book/[id]', params: { id: book.id } }} asChild>
      <Pressable style={styles.card}>
        <View style={styles.cover}>
          <Text style={styles.coverText}>{book.title.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{book.author}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.badge}>{statusLabel(book.status)}</Text>
            <Text style={styles.genre}>{book.genre}</Text>
          </View>
          {book.status === 'reading' && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progress + '%' }]} />
            </View>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: 14
  },
  cover: {
    width: 58,
    height: 82,
    borderRadius: 14,
    backgroundColor: appColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: appColors.gold,
    borderWidth: 1
  },
  coverText: {
    color: appColors.gold,
    fontSize: 28,
    fontWeight: '900'
  },
  info: {
    flex: 1,
    gap: 6
  },
  title: {
    color: appColors.text,
    fontSize: 17,
    fontWeight: '800'
  },
  author: {
    color: appColors.textMuted,
    fontSize: 13
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  badge: {
    color: appColors.background,
    backgroundColor: appColors.gold,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '800'
  },
  genre: {
    color: appColors.textDim,
    fontSize: 12
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: appColors.border,
    overflow: 'hidden',
    marginTop: 4
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: appColors.emerald
  }
});
