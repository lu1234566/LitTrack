import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { calculateProgress, useBooks } from '@/contexts/BookContext';
import { statusLabel } from '@/services/bookStorage';
import { appColors } from '@/theme/tokens';

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBook, updateProgress, updateStatus, deleteBook } = useBooks();
  const book = useMemo(() => getBook(String(id)), [getBook, id]);
  const [page, setPage] = useState(book?.currentPage ? String(book.currentPage) : '');

  if (!book) {
    return (
      <Screen>
        <Text style={styles.title}>Livro nao encontrado</Text>
        <Text style={styles.muted}>Volte para a biblioteca e tente novamente.</Text>
      </Screen>
    );
  }

  const progress = calculateProgress(book);

  async function handleProgress() {
    const nextPage = Number(page);
    if (Number.isNaN(nextPage)) {
      Alert.alert('Pagina invalida', 'Digite um numero valido.');
      return;
    }
    await updateProgress(book.id, nextPage);
  }

  async function handleDelete() {
    await deleteBook(book.id);
    router.replace('/library');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>{statusLabel(book.status)} • {book.genre}</Text>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{book.author}</Text>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Progresso</Text>
        <Text style={styles.progressText}>{progress}% concluido</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: progress + '%' }]} /></View>
        <Text style={styles.muted}>{book.currentPage || 0} de {book.totalPages || 0} paginas</Text>
      </Card>

      <View style={styles.grid}>
        <Card><Text style={styles.smallValue}>{book.rating || 0}/5</Text><Text style={styles.smallLabel}>nota</Text></Card>
        <Card><Text style={styles.smallValue}>{book.publisher || '-'}</Text><Text style={styles.smallLabel}>editora</Text></Card>
        <Card><Text style={styles.smallValue}>{book.publishedDate || '-'}</Text><Text style={styles.smallLabel}>ano</Text></Card>
        <Card><Text style={styles.smallValue}>{book.priority || '-'}</Text><Text style={styles.smallLabel}>prioridade</Text></Card>
      </View>

      <TextInput style={styles.input} placeholder="Pagina atual" placeholderTextColor={appColors.textDim} value={page} onChangeText={setPage} keyboardType="numeric" />
      <Pressable style={styles.primaryButton} onPress={handleProgress}><Text style={styles.primaryText}>Atualizar progresso</Text></Pressable>

      <View style={styles.statusRow}>
        <Pressable style={styles.secondaryButton} onPress={() => updateStatus(book.id, 'reading')}><Text style={styles.secondaryText}>Lendo</Text></Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => updateStatus(book.id, 'finished')}><Text style={styles.secondaryText}>Lido</Text></Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => updateStatus(book.id, 'wishlist')}><Text style={styles.secondaryText}>Quero ler</Text></Pressable>
      </View>

      {book.reasonToRead ? <Card><Text style={styles.cardTitle}>Motivo de leitura</Text><Text style={styles.body}>{book.reasonToRead}</Text></Card> : null}
      {book.favoriteQuote ? <Card><Text style={styles.cardTitle}>Citacao favorita</Text><Text style={styles.quote}>{book.favoriteQuote}</Text></Card> : null}
      {book.review ? <Card><Text style={styles.cardTitle}>Resenha</Text><Text style={styles.body}>{book.review}</Text></Card> : null}
      {book.notes ? <Card><Text style={styles.cardTitle}>Notas</Text><Text style={styles.body}>{book.notes}</Text></Card> : null}

      <Pressable style={styles.deleteButton} onPress={handleDelete}><Text style={styles.deleteText}>Remover da biblioteca local</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  kicker: { color: appColors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  author: { color: appColors.textMuted, fontSize: 16 },
  cardTitle: { color: appColors.gold, fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  progressText: { color: appColors.text, fontSize: 26, fontWeight: '900' },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: appColors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: appColors.emerald },
  muted: { color: appColors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  smallValue: { color: appColors.text, fontSize: 18, fontWeight: '900' },
  smallLabel: { color: appColors.textMuted, fontSize: 12, marginTop: 4 },
  input: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16 },
  primaryButton: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: appColors.background, fontWeight: '900' },
  statusRow: { flexDirection: 'row', gap: 8 },
  secondaryButton: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: appColors.text, fontSize: 12, fontWeight: '800' },
  body: { color: appColors.textMuted, lineHeight: 22 },
  quote: { color: appColors.text, lineHeight: 24, fontSize: 16, fontStyle: 'italic' },
  deleteButton: { borderColor: appColors.red, borderWidth: 1, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  deleteText: { color: appColors.red, fontWeight: '900' }
});
