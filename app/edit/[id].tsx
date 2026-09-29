import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/TranslatedText';
import { Screen } from '@/components/Screen';
import { useBooks } from '@/contexts/BookContext';
import { BookFormat, BookStatus } from '@/types/book';
import { FormatPicker } from '@/components/FormatPicker';
import { applyProgress, formatDuration, formatOf, parseDuration, progressInputText } from '@/services/bookFormat';
import { lookupExternalBooks } from '@/services/externalBookSearch';
import { CoverPicker } from '@/components/CoverPicker';
import { MonthYearField } from '@/components/MonthYearField';
import { ReadoraIcon } from '@/components/ReadoraIcon';
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
  const [format, setFormat] = useState<BookFormat>(book ? formatOf(book) : 'physical');
  // Progresso na unidade do formato: página, % ou tempo ouvido.
  const [progress, setProgress] = useState(book ? progressInputText(book) : '');
  const [duration, setDuration] = useState(book?.totalMinutes ? formatDuration(book.totalMinutes).replace(' ', '') : '');
  const [rating, setRating] = useState(book?.rating ? String(book.rating) : '');
  const [reason, setReason] = useState(book?.reasonToRead || '');
  const [quote, setQuote] = useState(book?.favoriteQuote || '');
  const [review, setReview] = useState(book?.review || '');
  const [contentWarnings, setContentWarnings] = useState(book?.contentWarnings || '');
  const [status, setStatus] = useState<BookStatus>(book?.status || 'reading');
  const [readAt, setReadAt] = useState<number | undefined>(book?.finishedAt);

  if (!book) {
    return (
      <Screen>
        <Text style={styles.title}>Livro não encontrado</Text>
      </Screen>
    );
  }

  const currentBook = book;

  async function handleSave() {
    const totalMinutes = duration.trim() ? parseDuration(duration) : undefined;
    const valor = format === 'audiobook' ? (progress.trim() ? parseDuration(progress) : 0) : Number(progress.replace(',', '.').replace('%', '')) || 0;
    if (format === 'audiobook' && (Number.isNaN(totalMinutes) || Number.isNaN(valor))) {
      Alert.alert('Tempo inválido', 'Use o formato 3h20, 3:20 ou 45min.');
      return;
    }
    // Calcula os campos de progresso do formato escolhido (e a página
    // proporcional); o status continua sendo o que foi marcado no formulário.
    const comProgresso = applyProgress({ ...currentBook, format, totalPages: Number(totalPages) || 0, totalMinutes, status }, valor);
    await updateBook(currentBook.id, {
      format,
      totalMinutes,
      progressPercent: comProgresso.progressPercent,
      listenedMinutes: comProgresso.listenedMinutes,
      title: title.trim() || currentBook.title,
      author: author.trim() || currentBook.author,
      genre: genre.trim() || 'A definir',
      publisher: publisher.trim(),
      publishedDate: year.trim(),
      isbn: isbn.trim(),
      coverUrl: coverUrl.trim(),
      notes: source.trim(),
      status,
      totalPages: Number(totalPages) || 0,
      currentPage: comProgresso.currentPage || 0,
      rating: Number(rating) || 0,
      reasonToRead: reason.trim(),
      favoriteQuote: quote.trim(),
      review: review.trim(),
      contentWarnings: contentWarnings.trim(),
      // Mês de leitura escolhido pelo usuário: é o campo que agrupa o livro na
      // Cápsula Mensal, na Linha do Tempo e na Retrospectiva. Quando limpo
      // (undefined), o livro volta a usar a data de cadastro.
      finishedAt: readAt
    });
    router.replace({ pathname: '/book/[id]', params: { id: currentBook.id } } as never);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}><ReadoraIcon name="editBook" size={26} color={appColors.gold} /><Text style={styles.title}>Editar livro</Text></View>
        <Text style={styles.subtitle}>Ajuste dados, capa, origem e progresso sem recriar o registro.</Text>
      </View>
      <TextInput style={styles.input} placeholder="Título" placeholderTextColor={appColors.textDim} value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Autor" placeholderTextColor={appColors.textDim} value={author} onChangeText={setAuthor} />
      <TextInput style={styles.input} placeholder="Gênero" placeholderTextColor={appColors.textDim} value={genre} onChangeText={setGenre} />
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} placeholder="Editora" placeholderTextColor={appColors.textDim} value={publisher} onChangeText={setPublisher} />
        <TextInput style={[styles.input, styles.half]} placeholder="Ano" placeholderTextColor={appColors.textDim} value={year} onChangeText={setYear} keyboardType="numeric" />
      </View>
      <TextInput style={styles.input} placeholder="ISBN" placeholderTextColor={appColors.textDim} value={isbn} onChangeText={setIsbn} />

      <Text style={styles.label}>Capa do livro</Text>
      <CoverPicker title={title} author={author} isbn={isbn} value={coverUrl} onChange={setCoverUrl} />

      <TextInput style={styles.input} placeholder="Origem/fonte" placeholderTextColor={appColors.textDim} value={source} onChangeText={setSource} />
      <Text style={styles.label}>Formato</Text>
      <FormatPicker value={format} onChange={(next) => { setFormat(next); setProgress(progressInputText(currentBook, next)); }} />
      {/* Rótulo acima de cada campo: preenchido, "21h" sozinho não diz nada. */}
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.fieldLabel}>{format === 'audiobook' ? 'Duração total' : 'Páginas'}</Text>
          {format === 'audiobook'
            ? <TextInput style={styles.input} placeholder="Ex: 11h30" placeholderTextColor={appColors.textDim} value={duration} onChangeText={setDuration} />
            : <TextInput style={styles.input} placeholder={format === 'ebook' ? 'Opcional' : 'Ex: 320'} placeholderTextColor={appColors.textDim} value={totalPages} onChangeText={setTotalPages} keyboardType="numeric" />}
        </View>
        <View style={styles.half}>
          <Text style={styles.fieldLabel}>{format === 'audiobook' ? 'Tempo ouvido' : format === 'ebook' ? '% lido' : 'Página atual'}</Text>
          <TextInput
            style={styles.input}
            placeholder={format === 'audiobook' ? 'Ex: 3h20' : format === 'ebook' ? 'Ex: 42' : 'Ex: 120'}
            placeholderTextColor={appColors.textDim}
            value={progress}
            onChangeText={setProgress}
            keyboardType={format === 'audiobook' ? 'default' : 'numeric'}
          />
        </View>
      </View>
      <TextInput style={styles.input} placeholder="Nota (use .5 para meia-estrela, ex: 4.5)" placeholderTextColor={appColors.textDim} value={rating} onChangeText={setRating} keyboardType="numeric" />
      <View style={styles.statusRow}>
        {(['reading', 'finished', 'wishlist', 'dnf'] as BookStatus[]).map((item) => (
          <Pressable key={item} style={[styles.statusButton, status === item && styles.statusButtonActive]} onPress={() => setStatus(item)}>
            <Text style={[styles.statusText, status === item && styles.statusTextActive]}>{label(item)}</Text>
          </Pressable>
        ))}
      </View>

      <MonthYearField
        value={readAt}
        onChange={setReadAt}
        hint="Define em qual mês este livro aparece na Cápsula Mensal e na Retrospectiva."
      />

      <TextInput style={styles.textArea} placeholder="Motivo de leitura" placeholderTextColor={appColors.textDim} value={reason} onChangeText={setReason} multiline />
      <TextInput style={styles.textArea} placeholder="Citação favorita" placeholderTextColor={appColors.textDim} value={quote} onChangeText={setQuote} multiline />
      <TextInput style={styles.textArea} placeholder="Resenha" placeholderTextColor={appColors.textDim} value={review} onChangeText={setReview} multiline />
      <TextInput style={styles.input} placeholder="Alertas de conteúdo (separe por vírgula)" placeholderTextColor={appColors.textDim} value={contentWarnings} onChangeText={setContentWarnings} />
      <Pressable style={[styles.saveButton, styles.btnRow]} onPress={handleSave}><ReadoraIcon name="check" size={17} color={appColors.background} /><Text style={styles.saveText}>Salvar alterações</Text></Pressable>
    </Screen>
  );
}

function label(status: BookStatus) {
  if (status === 'finished') return 'Lido';
  if (status === 'wishlist') return 'Quero ler';
  if (status === 'dnf') return 'Abandonei';
  return 'Lendo';
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { color: appColors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, minWidth: 0 },
  fieldLabel: { color: appColors.textDim, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  label: { color: appColors.textMuted, fontSize: 16, fontWeight: '800', marginTop: 4 },
  outlineButton: { borderColor: appColors.goldDeep, backgroundColor: 'rgba(255,153,0,0.12)', borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  outlineText: { color: appColors.gold, fontWeight: '900', fontSize: 13 },
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

