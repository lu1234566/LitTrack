import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useBooks } from '@/contexts/BookContext';
import { BookStatus } from '@/types/book';
import { appColors } from '@/theme/tokens';

export default function EditBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBook, updateBook } = useBooks();
  const book = useMemo(() => getBook(String(id)), [getBook, id]);
  const [title, setTitle] = useState(book?.title || '');
  const [author, setAuthor] = useState(book?.author || '');
  const [genre, setGenre] = useState(book?.genre || '');
  const [publisher, setPublisher] = useState(book?.publisher || '');
  const [year, setYear] = useState(book?.publishedDate || '');
  const [isbn, setIsbn] = useState(book?.isbn || '');
  const [coverUrl, setCoverUrl] = useState(book?.coverUrl || '');
  const [source, setSource] = useState(book?.notes || '');
  const [totalPages, setTotalPages] = useState(book?.totalPages ? String(book.totalPages) : '');
  const [currentPage, setCurrentPage] = useState(book?.currentPage ? String(book.currentPage) : '');
  const [rating, setRating] = useState(book?.rating ? String(book.rating) : '');
  const [reason, setReason] = useState(book?.reasonToRead || '');
  const [quote, setQuote] = useState(book?.favoriteQuote || '');
  const [review, setReview] = useState(book?.review || '');
  const [status, setStatus] = useState<BookStatus>(book?.status || 'reading');

  if (!book) {
    return (
      <Screen>
        <Text style={styles.title}>Livro nao encontrado</Text>
      </Screen>
    );
  }

  async function handleSave() {
    await updateBook(book.id, {
      title: title.trim() || book.title,
      author: author.trim() || book.author,
      genre: genre.trim() || 'A definir',
      publisher: publisher.trim(),
      publishedDate: year.trim(),
      isbn: isbn.trim(),
      coverUrl: coverUrl.trim(),
      notes: source.trim(),
      status,
      totalPages: Number(totalPages) || 0,
      currentPage: Number(currentPage) || 0,
      rating: Number(rating) || 0,
      reasonToRead: reason.trim(),
      favoriteQuote: quote.trim(),
      review: review.trim()
    });
    router.replace({ pathname: '/book/[id]', params: { id: book.id } });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Editar livro</Text>
        <Text style={styles.subtitle}>Ajuste dados, capa, origem e progresso sem recriar o registro.</Text>
      </View>
      <TextInput style={styles.input} placeholder="Titulo" placeholderTextColor={appColors.textDim} value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Autor" placeholderTextColor={appColors.textDim} value={author} onChangeText={setAuthor} />
      <TextInput style={styles.input} placeholder="Genero" placeholderTextColor={appColors.textDim} value={genre} onChangeText={setGenre} />
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} placeholder="Editora" placeholderTextColor={appColors.textDim} value={publisher} onChangeText={setPublisher} />
        <TextInput style={[styles.input, styles.half]} placeholder="Ano" placeholderTextColor={appColors.textDim} value={year} onChangeText={setYear} keyboardType="numeric" />
      </View>
      <TextInput style={styles.input} placeholder="ISBN" placeholderTextColor={appColors.textDim} value={isbn} onChangeText={setIsbn} />
      <TextInput style={styles.input} placeholder="URL da capa" placeholderTextColor={appColors.textDim} value={coverUrl} onChangeText={setCoverUrl} />
      <TextInput style={styles.input} placeholder="Origem/fonte" placeholderTextColor={appColors.textDim} value={source} onChangeText={setSource} />
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} placeholder="Paginas" placeholderTextColor={appColors.textDim} value={totalPages} onChangeText={setTotalPages} keyboardType="numeric" />
        <TextInput style={[styles.input, styles.half]} placeholder="Pagina atual" placeholderTextColor={appColors.textDim} value={currentPage} onChangeText={setCurrentPage} keyboardType="numeric" />
      </View>
      <TextInput style={styles.input} placeholder="Nota" placeholderTextColor={appColors.textDim} value={rating} onChangeText={setRating} keyboardType="numeric" />
      <View style={styles.statusRow}>
        {(['reading', 'finished', 'wishlist'] as BookStatus[]).map((item) => (
          <Pressable key={item} style={[styles.statusButton, status === item && styles.statusButtonActive]} onPress={() => setStatus(item)}>
            <Text style={[styles.statusText, status === item && styles.statusTextActive]}>{label(item)}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput style={styles.textArea} placeholder="Motivo de leitura" placeholderTextColor={appColors.textDim} value={reason} onChangeText={setReason} multiline />
      <TextInput style={styles.textArea} placeholder="Citacao favorita" placeholderTextColor={appColors.textDim} value={quote} onChangeText={setQuote} multiline />
      <TextInput style={styles.textArea} placeholder="Resenha" placeholderTextColor={appColors.textDim} value={review} onChangeText={setReview} multiline />
      <Pressable style={styles.saveButton} onPress={handleSave}><Text style={styles.saveText}>Salvar alteracoes</Text></Pressable>
    </Screen>
  );
}

function label(status: BookStatus) {
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
  textArea: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16, minHeight: 90, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusButton: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  statusButtonActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  statusText: { color: appColors.textMuted, fontWeight: '800', fontSize: 12 },
  statusTextActive: { color: appColors.background },
  saveButton: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveText: { color: appColors.background, fontWeight: '900', fontSize: 16 }
});
