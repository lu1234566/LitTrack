import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { BookStatus } from '@/types/book';
import { appColors, appFonts } from '@/theme/tokens';

export default function AddBookScreen() {
  const { addBook } = useBooks();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Ficção');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [currentPage, setCurrentPage] = useState('');
  const [rating, setRating] = useState('');
  const [reason, setReason] = useState('');
  const [quote, setQuote] = useState('');
  const [review, setReview] = useState('');
  const [status, setStatus] = useState<BookStatus>('finished');

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
        <Text style={styles.title}>Adicionar Leitura</Text>
        <Text style={styles.subtitle}>Registre os detalhes da sua jornada literária.</Text>
      </View>

      <Card>
        <View style={styles.sectionHeader}><Text style={styles.sectionIcon}>▥</Text><Text style={styles.sectionTitle}>Importar dados do livro</Text><Text style={styles.chevron}>⌃</Text></View>
        <View style={[styles.importRow, mobile && styles.stack]}>
          <Pressable style={[styles.scanButton, mobile && styles.full]}><Text style={styles.scanText}>▣  Escanear ISBN</Text></Pressable>
          <TextInput style={[styles.input, styles.flex, mobile && styles.full]} placeholder="Digite o ISBN do livro" placeholderTextColor={appColors.textDim} />
          <Pressable style={[styles.darkButton, mobile && styles.full]}><Text style={styles.darkButtonText}>⌕  Buscar por ISBN</Text></Pressable>
        </View>
      </Card>

      <Card>
        <View style={styles.sectionHeader}><Text style={styles.sectionIcon}>▯</Text><Text style={styles.sectionTitle}>Informações Básicas</Text><Text style={styles.chevron}>⌃</Text></View>
        <Text style={styles.label}>Título</Text>
        <View style={[styles.titleSearchRow, mobile && styles.stack]}>
          <TextInput style={[styles.input, styles.flex]} placeholder="Ex: O Nome do Vento" placeholderTextColor={appColors.textDim} value={title} onChangeText={setTitle} />
          <Pressable style={styles.searchButton}><Text style={styles.darkButtonText}>{mobile ? '⌕' : '⌕  Buscar Online'}</Text></Pressable>
        </View>
        <Text style={styles.label}>Capa do Livro</Text>
        <View style={styles.coverPlaceholder}><Text style={styles.coverIcon}>▯</Text><Text style={styles.coverText}>Nenhuma capa{`\n`}encontrada</Text></View>
        <Pressable style={styles.darkButtonWide}><Text style={styles.darkButtonText}>⌕  Tentar buscar novamente</Text></Pressable>
        <TextInput style={styles.input} placeholder="Colar URL da capa" placeholderTextColor={appColors.textDim} />
        <Pressable style={styles.outlineButton}><Text style={styles.outlineText}>▧  Usar imagem local neste dispositivo</Text></Pressable>
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
        <View style={styles.sectionHeader}><Text style={styles.sectionIcon}>☆</Text><Text style={styles.sectionTitle}>Controle de Qualidade</Text><Text style={styles.chevron}>⌄</Text></View>
        <View style={styles.ratingPill}><Text style={styles.ratingText}>Média: {rating || '0.0'} ★</Text></View>
        <TextInput style={styles.input} placeholder="Nota de 0 a 5" placeholderTextColor={appColors.textDim} value={rating} onChangeText={setRating} keyboardType="numeric" />
      </Card>

      <Card>
        <View style={styles.sectionHeader}><Text style={[styles.sectionIcon, { color: appColors.purple }]}>↻</Text><Text style={[styles.sectionTitle, { color: appColors.purple }]}>Humor e Atmosfera</Text><Text style={styles.chevron}>⌄</Text></View>
        <Text style={styles.subtitle}>Selecione as atmosferas que melhor descrevem esta leitura:</Text>
        <View style={styles.chips}>{['Sombrio', 'Tenso', 'Reflexivo', 'Aconchegante', 'Emocional', 'Misterioso', 'Caótico', 'Inspirador', 'Cerebral', 'Mágico'].map((item) => <Text key={item} style={styles.chip}>{item}</Text>)}</View>
      </Card>

      <Card>
        <View style={styles.sectionHeader}><Text style={styles.sectionIcon}>▯</Text><Text style={styles.sectionTitle}>Diário de Leitura</Text><Text style={styles.chevron}>⌃</Text></View>
        <Text style={styles.label}>Resenha Completa</Text>
        <TextInput style={styles.textAreaLarge} placeholder="O que você achou da leitura? Quais foram as emoções?" placeholderTextColor={appColors.textDim} value={review} onChangeText={setReview} multiline />
        <View style={[styles.row, mobile && styles.stack]}>
          <View style={styles.fieldBox}><Text style={[styles.label, { color: appColors.emerald }]}>Pontos Fortes</Text><TextInput style={styles.textArea} placeholder="O que o livro fez de melhor?" placeholderTextColor={appColors.textDim} multiline /></View>
          <View style={styles.fieldBox}><Text style={[styles.label, { color: appColors.rose }]}>Pontos Fracos</Text><TextInput style={styles.textArea} placeholder="O que poderia ser melhor?" placeholderTextColor={appColors.textDim} multiline /></View>
        </View>
        <Text style={styles.label}>Citação Favorita</Text>
        <TextInput style={styles.textArea} placeholder="Uma frase ou trecho marcante do livro..." placeholderTextColor={appColors.textDim} value={quote} onChangeText={setQuote} multiline />
      </Card>

      <View style={styles.bottomActions}>
        <Pressable style={styles.cancelButton} onPress={() => router.back()}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        <Pressable style={styles.saveButton} onPress={handleSave}><Text style={styles.saveText}>▣  Salvar Livro</Text></Pressable>
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
  chevron: { color: appColors.textMuted, marginLeft: 'auto', fontSize: 24 },
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
  coverPlaceholder: { width: 132, height: 190, alignSelf: 'center', borderColor: appColors.border, borderStyle: 'dashed', borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.surface, marginVertical: 12 },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  chip: { color: appColors.textMuted, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, fontWeight: '800' },
  bottomActions: { flexDirection: 'row', gap: 16, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 22, padding: 14, marginBottom: 8 },
  cancelButton: { flex: 1, backgroundColor: appColors.surfaceMuted, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  cancelText: { color: appColors.textMuted, fontWeight: '900', fontSize: 16 },
  saveButton: { flex: 2, backgroundColor: appColors.gold, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveText: { color: appColors.background, fontWeight: '900', fontSize: 17 }
});
