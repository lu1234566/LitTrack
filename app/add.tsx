import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { searchGoogleBooks } from '@/services/externalBookSearch';
import { pickImageAsDataUrl, scanBarcodeFromImage } from '@/services/webPlatformTools';
import { Book, BookStatus } from '@/types/book';
import { ExternalBook } from '@/types/externalBook';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { haptic } from '@/services/feedback';
import { bookNeedsEnrichment, enrichBookPatch } from '@/services/bookEnrichment';
import { appColors, appFonts } from '@/theme/tokens';

const moods = ['Sombrio', 'Tenso', 'Reflexivo', 'Aconchegante', 'Emocional', 'Misterioso', 'Caótico', 'Inspirador', 'Cerebral', 'Mágico'];

export default function AddBookScreen() {
  const { addBook } = useBooks();
  const params = useLocalSearchParams<{ isbn?: string }>();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Ficção');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [currentPage, setCurrentPage] = useState('');
  const [rating, setRating] = useState('0');
  const [reason, setReason] = useState('');
  const [quote, setQuote] = useState('');
  const [review, setReview] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [isbn, setIsbn] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [status, setStatus] = useState<BookStatus>('finished');
  const [searchMessage, setSearchMessage] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const scannedIsbn = Array.isArray(params.isbn) ? params.isbn[0] : params.isbn;
    if (scannedIsbn && scannedIsbn !== isbn) {
      setIsbn(scannedIsbn);
      handleSearch(scannedIsbn, 'isbn');
    }
  }, [params.isbn]);

  async function handleSearch(query: string, mode: 'isbn' | 'title') {
    const cleaned = query.trim();
    if (!cleaned) {
      setSearchMessage(mode === 'isbn' ? 'Digite um ISBN para buscar.' : 'Digite um título para buscar.');
      return;
    }
    setSearching(true);
    setSearchMessage('Buscando dados do livro...');
    try {
      const results = await searchGoogleBooks(mode === 'isbn' ? 'isbn:' + cleaned : cleaned);
      const best = results[0];
      if (!best) {
        setSearchMessage('Nenhum resultado encontrado.');
        return;
      }
      applyExternalBook(best);
      setSearchMessage('Dados preenchidos automaticamente: ' + best.title + '.');
    } catch {
      setSearchMessage('Não foi possível buscar agora. Tente novamente ou preencha manualmente.');
    } finally {
      setSearching(false);
    }
  }

  function applyExternalBook(book: ExternalBook) {
    setTitle(book.title || title);
    setAuthor(book.author || author);
    setGenre(book.genre || genre);
    setPublisher(book.publisher || publisher);
    setYear(book.publishedDate || year);
    setTotalPages(book.totalPages ? String(book.totalPages) : totalPages);
    setIsbn(book.isbn || isbn);
    setCoverUrl(book.coverUrl || coverUrl);
    setReason(book.description || reason);
  }

  async function chooseLocalCover() {
    const image = await pickImageAsDataUrl();
    if (!image) {
      setSearchMessage('Nenhuma imagem foi escolhida ou a permissão de galeria foi negada.');
      return;
    }
    setCoverUrl(image);
    setSearchMessage('Imagem local carregada como capa. Ela será salva junto ao livro neste dispositivo.');
  }

  async function scanIsbnFromImage() {
    if (Platform.OS !== 'web') {
      router.push('/scan-isbn' as never);
      return;
    }
    setSearchMessage('Selecione uma foto/print do código de barras do livro.');
    const value = await scanBarcodeFromImage();
    if (!value) {
      setSearchMessage('Não consegui ler o código. Alguns navegadores não suportam BarcodeDetector; digite o ISBN manualmente.');
      return;
    }
    setIsbn(value);
    setSearchMessage('ISBN detectado: ' + value + '. Buscando dados...');
    await handleSearch(value, 'isbn');
  }

  function toggleMood(mood: string) {
    setSelectedMoods((current) => current.includes(mood) ? current.filter((item) => item !== mood) : [...current, mood]);
  }

  async function handleSave() {
    if (!title.trim() || !author.trim()) {
      haptic('warning');
      Alert.alert('Campos obrigatórios', 'Informe pelo menos título e autor.');
      return;
    }

    const journal = [
      review.trim(),
      strengths.trim() ? 'Pontos fortes: ' + strengths.trim() : '',
      weaknesses.trim() ? 'Pontos fracos: ' + weaknesses.trim() : ''
    ].filter(Boolean).join('\n\n');

    const draft = {
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
      review: journal,
      mood: selectedMoods.join(', ') || genre.trim() || 'literário',
      notes: isbn ? 'ISBN: ' + isbn : '',
      isbn: isbn.trim(),
      coverUrl: coverUrl.trim()
    };

    // Fill in missing pages/cover/genre automatically (e.g. manual entries),
    // without overwriting anything the user typed. Stays quiet if offline.
    let enriched = draft;
    if (bookNeedsEnrichment(draft as Book)) {
      try {
        const patch = await enrichBookPatch(draft as Book);
        if (patch) enriched = { ...draft, ...patch };
      } catch {
        /* keep the draft as-is */
      }
    }

    await addBook(enriched);

    haptic('success');
    router.replace('/library');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Adicionar Leitura</Text>
        <Text style={styles.subtitle}>Registre os detalhes da sua jornada literária.</Text>
      </View>

      <Card>
        <View style={styles.sectionHeader}><ReadoraIcon name="import" size={24} color={appColors.gold} /><Text style={styles.sectionTitle}>Importar dados do livro</Text><ReadoraIcon name="chevronUp" size={22} color={appColors.textMuted} style={styles.chevron} /></View>
        <View style={[styles.importRow, mobile && styles.stack]}>
          <Pressable style={[styles.scanButton, styles.btnRow, mobile && styles.full]} onPress={scanIsbnFromImage}><ReadoraIcon name="scanIsbn" size={18} color={appColors.background} /><Text style={styles.scanText}>Escanear ISBN</Text></Pressable>
          <TextInput style={[styles.input, styles.flex, mobile && styles.full]} placeholder="Digite o ISBN do livro" placeholderTextColor={appColors.textDim} value={isbn} onChangeText={setIsbn} />
          <Pressable style={[styles.darkButton, styles.btnRow, mobile && styles.full]} onPress={() => handleSearch(isbn, 'isbn')}><ReadoraIcon name="search" size={16} color={appColors.text} /><Text style={styles.darkButtonText}>{searching ? 'Buscando...' : 'Buscar por ISBN'}</Text></Pressable>
        </View>
        {searchMessage ? <Text style={styles.message}>{searchMessage}</Text> : null}
      </Card>

      <Card>
        <View style={styles.sectionHeader}><ReadoraIcon name="bookDetails" size={24} color={appColors.gold} /><Text style={styles.sectionTitle}>Informações Básicas</Text><ReadoraIcon name="chevronUp" size={22} color={appColors.textMuted} style={styles.chevron} /></View>
        <Text style={styles.label}>Título</Text>
        <View style={[styles.titleSearchRow, mobile && styles.stack]}>
          <TextInput style={[styles.input, styles.flex]} placeholder="Ex: O Nome do Vento" placeholderTextColor={appColors.textDim} value={title} onChangeText={setTitle} />
          <Pressable style={[styles.searchButton, styles.btnRow]} onPress={() => handleSearch(title, 'title')}><ReadoraIcon name="search" size={16} color={appColors.text} />{mobile ? null : <Text style={styles.darkButtonText}>Buscar Online</Text>}</Pressable>
        </View>
        <Text style={styles.label}>Capa do Livro</Text>
        <View style={styles.coverPlaceholder}>{coverUrl ? <Image source={{ uri: coverUrl }} style={styles.coverImage} /> : <><ReadoraIcon name="camera" size={42} color={appColors.textDim} /><Text style={styles.coverText}>Nenhuma capa{`\n`}encontrada</Text></>}</View>
        <Pressable style={[styles.darkButtonWide, styles.btnRow]} onPress={() => handleSearch(isbn || title, isbn ? 'isbn' : 'title')}><ReadoraIcon name="search" size={16} color={appColors.text} /><Text style={styles.darkButtonText}>Tentar buscar novamente</Text></Pressable>
        <TextInput style={styles.input} placeholder="Colar URL da capa" placeholderTextColor={appColors.textDim} value={coverUrl} onChangeText={setCoverUrl} />
        <Pressable style={[styles.outlineButton, styles.btnRow]} onPress={chooseLocalCover}><ReadoraIcon name="gallery" size={17} color={appColors.gold} /><Text style={styles.outlineText}>Usar imagem local neste dispositivo</Text></Pressable>
        <View style={[styles.row, mobile && styles.stack]}>
          <Field label="Autor" value={author} onChangeText={setAuthor} placeholder="Ex: Patrick Rothfuss" />
          <Field label="Número de Páginas" value={totalPages} onChangeText={setTotalPages} placeholder="Ex: 656" keyboardType="numeric" />
        </View>
        <Text style={styles.label}>Sinopse / Descrição</Text>
        <TextInput style={styles.textArea} placeholder="Descrição do livro..." placeholderTextColor={appColors.textDim} value={reason} onChangeText={setReason} multiline />
        <View style={[styles.row, mobile && styles.stack]}>
          <Field label="Gênero" value={genre} onChangeText={setGenre} placeholder="Ficção" />
          <View style={styles.fieldBox}><Text style={styles.label}>Status</Text><TextInput style={styles.input} value={statusLabel(status)} editable={false} /></View>
        </View>
        <View style={[styles.statusRow, mobile && styles.stack]}>
          {(['reading', 'finished', 'wishlist'] as BookStatus[]).map((item) => (
            <Pressable key={item} style={[styles.statusButton, status === item && styles.statusButtonActive]} onPress={() => setStatus(item)}>
              <Text style={[styles.statusText, status === item && styles.statusTextActive]}>{statusLabel(item)}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.sectionHeader}><ReadoraIcon name="starOutline" size={24} color={appColors.gold} /><Text style={styles.sectionTitle}>Controle de Qualidade</Text><ReadoraIcon name="chevronDown" size={22} color={appColors.textMuted} style={styles.chevron} /></View>
        <View style={styles.ratingPill}><Text style={styles.ratingText}>Média: {rating || '0.0'} ★</Text></View>
        <View style={styles.ratingRow}>{[0, 1, 2, 3, 4, 5].map((value) => <Pressable key={value} style={[styles.ratingChip, Number(rating) === value && styles.ratingChipActive]} onPress={() => setRating(String(value))}><Text style={[styles.ratingChipText, Number(rating) === value && styles.ratingChipTextActive]}>{value}★</Text></Pressable>)}</View>
      </Card>

      <Card>
        <View style={styles.sectionHeader}><ReadoraIcon name="sparkle" size={24} color={appColors.purple} /><Text style={[styles.sectionTitle, { color: appColors.purple }]}>Humor e Atmosfera</Text><ReadoraIcon name="chevronDown" size={22} color={appColors.textMuted} style={styles.chevron} /></View>
        <Text style={styles.subtitle}>Selecione as atmosferas que melhor descrevem esta leitura:</Text>
        <View style={styles.chips}>{moods.map((item) => <Pressable key={item} onPress={() => toggleMood(item)}><Text style={[styles.chip, selectedMoods.includes(item) && styles.chipActive]}>{item}</Text></Pressable>)}</View>
      </Card>

      <Card>
        <View style={styles.sectionHeader}><ReadoraIcon name="editBook" size={24} color={appColors.gold} /><Text style={styles.sectionTitle}>Diário de Leitura</Text><ReadoraIcon name="chevronUp" size={22} color={appColors.textMuted} style={styles.chevron} /></View>
        <Text style={styles.label}>Resenha Completa</Text>
        <TextInput style={styles.textAreaLarge} placeholder="O que você achou da leitura? Quais foram as emoções?" placeholderTextColor={appColors.textDim} value={review} onChangeText={setReview} multiline />
        <View style={[styles.row, mobile && styles.stack]}>
          <View style={styles.fieldBox}><Text style={[styles.label, { color: appColors.emerald }]}>Pontos Fortes</Text><TextInput style={styles.textArea} placeholder="O que o livro fez de melhor?" placeholderTextColor={appColors.textDim} value={strengths} onChangeText={setStrengths} multiline /></View>
          <View style={styles.fieldBox}><Text style={[styles.label, { color: appColors.rose }]}>Pontos Fracos</Text><TextInput style={styles.textArea} placeholder="O que poderia ser melhor?" placeholderTextColor={appColors.textDim} value={weaknesses} onChangeText={setWeaknesses} multiline /></View>
        </View>
        <Text style={styles.label}>Citação Favorita</Text>
        <TextInput style={styles.textArea} placeholder="Uma frase ou trecho marcante do livro..." placeholderTextColor={appColors.textDim} value={quote} onChangeText={setQuote} multiline />
      </Card>

      <View style={styles.bottomActions}>
        <Pressable style={styles.cancelButton} onPress={() => router.back()}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        <Pressable style={[styles.saveButton, styles.btnRow]} onPress={handleSave}><ReadoraIcon name="check" size={18} color={appColors.background} /><Text style={styles.saveText}>Salvar Livro</Text></Pressable>
      </View>
    </Screen>
  );
}

function Field({ label, ...props }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'numeric' }) {
  return <View style={styles.fieldBox}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} placeholderTextColor={appColors.textDim} {...props} /></View>;
}

function statusLabel(status: BookStatus) {
  if (status === 'finished') return 'Lido';
  if (status === 'wishlist') return 'Quero ler';
  return 'Lendo';
}

const styles = StyleSheet.create({
  header: { gap: 8, marginBottom: 8 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 46, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 18, lineHeight: 27 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionIcon: { color: appColors.gold, fontSize: 25, fontWeight: '900' },
  sectionTitle: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 28, fontWeight: '900' },
  chevron: { marginLeft: 'auto' },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  row: { flexDirection: 'row', gap: 24 },
  stack: { flexDirection: 'column' },
  full: { width: '100%' },
  flex: { flex: 1 },
  fieldBox: { flex: 1, gap: 8 },
  label: { color: appColors.textMuted, fontSize: 16, fontWeight: '800', marginTop: 10 },
  input: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, color: appColors.text, fontSize: 18 },
  textArea: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, color: appColors.text, fontSize: 18, minHeight: 100, textAlignVertical: 'top' },
  textAreaLarge: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, color: appColors.text, fontSize: 18, minHeight: 150, textAlignVertical: 'top' },
  importRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  titleSearchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  scanButton: { backgroundColor: appColors.gold, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 26, alignItems: 'center' },
  scanText: { color: appColors.background, fontWeight: '900', fontSize: 17 },
  darkButton: { backgroundColor: appColors.surfaceMuted, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 22, alignItems: 'center' },
  darkButtonWide: { backgroundColor: appColors.surfaceMuted, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 14 },
  darkButtonText: { color: appColors.text, fontWeight: '900', fontSize: 16 },
  searchButton: { backgroundColor: appColors.surfaceMuted, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 20, alignItems: 'center' },
  coverPlaceholder: { width: 132, height: 190, alignSelf: 'center', borderColor: appColors.border, borderStyle: 'dashed', borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.surface, marginVertical: 12, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  coverIcon: { color: appColors.textDim, fontSize: 46 },
  coverText: { color: appColors.textDim, textAlign: 'center', marginTop: 6 },
  outlineButton: { borderColor: appColors.goldDeep, backgroundColor: 'rgba(255,153,0,0.12)', borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  outlineText: { color: appColors.gold, fontWeight: '900' },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  statusButton: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  statusButtonActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  statusText: { color: appColors.textMuted, fontWeight: '800', fontSize: 12 },
  statusTextActive: { color: appColors.background },
  ratingPill: { alignSelf: 'flex-start', backgroundColor: appColors.goldDeep, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 10 },
  ratingText: { color: appColors.gold, fontWeight: '900', fontSize: 18 },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ratingChip: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  ratingChipActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  ratingChipText: { color: appColors.textMuted, fontWeight: '900' },
  ratingChipTextActive: { color: appColors.background },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  chip: { color: appColors.textMuted, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, fontWeight: '800', overflow: 'hidden' },
  chipActive: { color: appColors.background, backgroundColor: appColors.purple, borderColor: appColors.purple },
  message: { color: appColors.gold, fontWeight: '800', marginTop: 12 },
  bottomActions: { flexDirection: 'row', gap: 16, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 22, padding: 14, marginBottom: 8 },
  cancelButton: { flex: 1, backgroundColor: appColors.surfaceMuted, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  cancelText: { color: appColors.textMuted, fontWeight: '900', fontSize: 16 },
  saveButton: { flex: 2, backgroundColor: appColors.gold, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveText: { color: appColors.background, fontWeight: '900', fontSize: 17 }
});
