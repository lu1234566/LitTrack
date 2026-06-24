import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useBooks } from '@/contexts/BookContext';
import { BookStatus } from '@/types/book';
import { appColors } from '@/theme/tokens';

export default function AddBookScreen() {
  const { addBook } = useBooks();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [currentPage, setCurrentPage] = useState('');
  const [rating, setRating] = useState('');
  const [reason, setReason] = useState('');
  const [quote, setQuote] = useState('');
  const [review, setReview] = useState('');
  const [status, setStatus] = useState<BookStatus>('reading');

  async function handleSave() {
    if (!title.trim() || !author.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe pelo menos titulo e autor.');
      return;
    }

    await addBook({
      title: title.trim(),
      author: author.trim(),
      genre: genre.trim() || 'A definir',
      publisher: publisher.trim(),
      publishedDate: year.trim(),
      status,
      rating: Number(rating) || 0,
      totalPages: Number(totalPages) || 0,
      currentPage: Number(currentPage) || 0,
      priority: status === 'wishlist' ? 'media' : 'alta',
      reasonToRead: reason.trim(),
      favoriteQuote: quote.trim(),
      review: review.trim(),
      mood: genre.trim() || 'literario',
      notes: ''
    });

    router.replace('/library');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Adicionar livro</Text>
        <Text style={styles.subtitle}>Cadastro nativo expandido com dados para perfil, dashboard, citacoes e estantes.</Text>
      </View>

      <TextInput style={styles.input} placeholder="Titulo" placeholderTextColor={appColors.textDim} value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Autor" placeholderTextColor={appColors.textDim} value={author} onChangeText={setAuthor} />
      <TextInput style={styles.input} placeholder="Genero" placeholderTextColor={appColors.textDim} value={genre} onChangeText={setGenre} />
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} placeholder="Editora" placeholderTextColor={appColors.textDim} value={publisher} onChangeText={setPublisher} />
        <TextInput style={[styles.input, styles.half]} placeholder="Ano" placeholderTextColor={appColors.textDim} value={year} onChangeText={setYear} keyboardType="numeric" />
      </View>
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} placeholder="Paginas" placeholderTextColor={appColors.textDim} value={totalPages} onChangeText={setTotalPages} keyboardType="numeric" />
        <TextInput style={[styles.input, styles.half]} placeholder="Pagina atual" placeholderTextColor={appColors.textDim} value={currentPage} onChangeText={setCurrentPage} keyboardType="numeric" />
      </View>
      <TextInput style={styles.input} placeholder="Nota de 0 a 5" placeholderTextColor={appColors.textDim} value={rating} onChangeText={setRating} keyboardType="numeric" />
      <TextInput style={styles.textArea} placeholder="Por que ler?" placeholderTextColor={appColors.textDim} value={reason} onChangeText={setReason} multiline />
      <TextInput style={styles.textArea} placeholder="Citacao favorita" placeholderTextColor={appColors.textDim} value={quote} onChangeText={setQuote} multiline />
      <TextInput style={styles.textArea} placeholder="Resenha ou notas" placeholderTextColor={appColors.textDim} value={review} onChangeText={setReview} multiline />

      <View style={styles.statusRow}>
        {(['reading', 'finished', 'wishlist'] as BookStatus[]).map((item) => (
          <Pressable key={item} style={[styles.statusButton, status === item && styles.statusButtonActive]} onPress={() => setStatus(item)}>
            <Text style={[styles.statusText, status === item && styles.statusTextActive]}>{statusLabel(item)}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Salvar livro</Text>
      </Pressable>
    </Screen>
  );
}

function statusLabel(status: BookStatus) {
  if (status === 'finished') return 'Lido';
  if (status === 'wishlist') return 'Quero ler';
  return 'Lendo';
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  title: { color: appColors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  input: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16 },
  textArea: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16, minHeight: 92, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusButton: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  statusButtonActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  statusText: { color: appColors.textMuted, fontWeight: '800', fontSize: 12 },
  statusTextActive: { color: appColors.background },
  saveButton: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveText: { color: appColors.background, fontWeight: '900', fontSize: 16 }
});
