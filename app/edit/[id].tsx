import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useBooks } from '@/contexts/BookContext';
import { BookStatus } from '@/types/book';
import { lookupExternalBooks } from '@/services/externalBookSearch';
import { pickImageAsDataUrl } from '@/services/webPlatformTools';
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
  const [currentPage, setCurrentPage] = useState(book?.currentPage ? String(book.currentPage) : '');
  const [rating, setRating] = useState(book?.rating ? String(book.rating) : '');
  const [reason, setReason] = useState(book?.reasonToRead || '');
  const [quote, setQuote] = useState(book?.favoriteQuote || '');
  const [review, setReview] = useState(book?.review || '');
  const [contentWarnings, setContentWarnings] = useState(book?.contentWarnings || '');
  const [status, setStatus] = useState<BookStatus>(book?.status || 'reading');
  const [coverMessage, setCoverMessage] = useState('');
  const [searchingCover, setSearchingCover] = useState(false);

  async function chooseLocalCover() {
    const image = await pickImageAsDataUrl();
    if (!image) {
      setCoverMessage('Nenhuma imagem foi escolhida ou a permissão de galeria foi negada.');
      return;
    }
    setCoverUrl(image);
    setCoverMessage('Imagem local carregada como capa. Salve as alterações para aplicar.');
  }

  async function searchCover() {
    const query = isbn.trim() ? 'isbn:' + isbn.trim() : (title + ' ' + author).trim();
    if (!query) { setCoverMessage('Preencha título/autor ou ISBN para buscar a capa.'); return; }
    setSearchingCover(true);
    setCoverMessage('Buscando capa...');
    try {
      const results = await lookupExternalBooks(query);
      const withCover = results.find((item) => item.coverUrl);
      if (!withCover?.coverUrl) {
        setCoverMessage('Nenhuma capa encontrada. Tente pelo ISBN ou use uma imagem da galeria.');
        return;
      }
      setCoverUrl(withCover.coverUrl);
      setCoverMessage('Capa encontrada: ' + withCover.title + '. Salve as alterações para aplicar.');
    } catch {
      setCoverMessage('Não foi possível buscar agora. Tente novamente ou use uma imagem da galeria.');
    } finally {
      setSearchingCover(false);
    }
  }

  if (!book) {
    return (
      <Screen>
        <Text style={styles.title}>Livro nao encontrado</Text>
      </Screen>
    );
  }

  const currentBook = book;

  async function handleSave() {
    await updateBook(currentBook.id, {
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
      currentPage: Number(currentPage) || 0,
      rating: Number(rating) || 0,
      reasonToRead: reason.trim(),
      favoriteQuote: quote.trim(),
      review: review.trim(),
      contentWarnings: contentWarnings.trim()
    });
    router.replace({ pathname: '/book/[id]', params: { id: currentBook.id } } as never);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}><ReadoraIcon name="editBook" size={26} color={appColors.gold} /><Text style={styles.title}>Editar livro</Text></View>
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

      <Text style={styles.label}>Capa do livro</Text>
      <View style={styles.coverPlaceholder}>{coverUrl ? <Image source={{ uri: coverUrl }} style={styles.coverImage} /> : <><ReadoraIcon name="camera" size={42} color={appColors.textDim} /><Text style={styles.coverText}>Sem capa</Text></>}</View>
      <TextInput style={styles.input} placeholder="URL da capa" placeholderTextColor={appColors.textDim} value={coverUrl} onChangeText={setCoverUrl} />
      <View style={styles.row}>
        <Pressable style={[styles.outlineButton, styles.half, styles.btnRow]} disabled={searchingCover} onPress={searchCover}><ReadoraIcon name="search" size={16} color={appColors.gold} /><Text style={styles.outlineText}>{searchingCover ? 'Buscando...' : 'Buscar capa'}</Text></Pressable>
        <Pressable style={[styles.outlineButton, styles.half, styles.btnRow]} onPress={chooseLocalCover}><ReadoraIcon name="gallery" size={16} color={appColors.gold} /><Text style={styles.outlineText}>Da galeria</Text></Pressable>
      </View>
      {coverMessage ? <Text style={styles.coverMessage}>{coverMessage}</Text> : null}

      <TextInput style={styles.input} placeholder="Origem/fonte" placeholderTextColor={appColors.textDim} value={source} onChangeText={setSource} />
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} placeholder="Paginas" placeholderTextColor={appColors.textDim} value={totalPages} onChangeText={setTotalPages} keyboardType="numeric" />
        <TextInput style={[styles.input, styles.half]} placeholder="Pagina atual" placeholderTextColor={appColors.textDim} value={currentPage} onChangeText={setCurrentPage} keyboardType="numeric" />
      </View>
      <TextInput style={styles.input} placeholder="Nota (use .5 para meia-estrela, ex: 4.5)" placeholderTextColor={appColors.textDim} value={rating} onChangeText={setRating} keyboardType="numeric" />
      <View style={styles.statusRow}>
        {(['reading', 'finished', 'wishlist', 'dnf'] as BookStatus[]).map((item) => (
          <Pressable key={item} style={[styles.statusButton, status === item && styles.statusButtonActive]} onPress={() => setStatus(item)}>
            <Text style={[styles.statusText, status === item && styles.statusTextActive]}>{label(item)}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput style={styles.textArea} placeholder="Motivo de leitura" placeholderTextColor={appColors.textDim} value={reason} onChangeText={setReason} multiline />
      <TextInput style={styles.textArea} placeholder="Citacao favorita" placeholderTextColor={appColors.textDim} value={quote} onChangeText={setQuote} multiline />
      <TextInput style={styles.textArea} placeholder="Resenha" placeholderTextColor={appColors.textDim} value={review} onChangeText={setReview} multiline />
      <TextInput style={styles.input} placeholder="Alertas de conteúdo (separe por vírgula)" placeholderTextColor={appColors.textDim} value={contentWarnings} onChangeText={setContentWarnings} />
      <Pressable style={[styles.saveButton, styles.btnRow]} onPress={handleSave}><ReadoraIcon name="check" size={17} color={appColors.background} /><Text style={styles.saveText}>Salvar alteracoes</Text></Pressable>
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
  half: { flex: 1 },
  label: { color: appColors.textMuted, fontSize: 16, fontWeight: '800', marginTop: 4 },
  coverPlaceholder: { width: 132, height: 190, alignSelf: 'center', borderColor: appColors.border, borderStyle: 'dashed', borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.surface, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  coverText: { color: appColors.textDim, textAlign: 'center', marginTop: 6 },
  outlineButton: { borderColor: appColors.goldDeep, backgroundColor: 'rgba(255,153,0,0.12)', borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  outlineText: { color: appColors.gold, fontWeight: '900', fontSize: 13 },
  coverMessage: { color: appColors.textMuted, fontSize: 13 },
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
