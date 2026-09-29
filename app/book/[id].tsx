import { Link, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/TranslatedText';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { calculateProgress, useBooks } from '@/contexts/BookContext';
import { statusLabel } from '@/services/bookStorage';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { BookShareCard } from '@/components/BookShareCard';
import { BookChat } from '@/components/BookChat';
import { isAiConfigured } from '@/services/aiClient';
import { appColors, appFonts } from '@/theme/tokens';
import { appLocale } from '@/services/i18n';
import { seriesOfBook } from '@/services/series';
import { BOOK_FORMATS, formatOf, parseDuration, progressInputText, progressLabel } from '@/services/bookFormat';

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { books, getBook, updateProgress, updateStatus, deleteBook } = useBooks();
  const book = useMemo(() => getBook(String(id)), [getBook, id]);
  const [page, setPage] = useState(book ? progressInputText(book) : '');
  const [showCard, setShowCard] = useState(false);
  const [showChat, setShowChat] = useState(false);

  if (!book) {
    return (
      <Screen>
        <Text style={styles.title}>Livro não encontrado</Text>
        <Text style={styles.muted}>Volte para a biblioteca e tente novamente.</Text>
      </Screen>
    );
  }

  const currentBook = book;
  const progress = calculateProgress(currentBook);

  const formato = formatOf(currentBook);

  async function handleProgress() {
    // O valor vai na unidade do formato; updateProgress limita ao total.
    const valor = formato === 'audiobook' ? parseDuration(page) : Number(page.replace(',', '.').replace('%', ''));
    if (Number.isNaN(valor)) {
      Alert.alert(
        formato === 'audiobook' ? 'Tempo inválido' : formato === 'ebook' ? 'Porcentagem inválida' : 'Página inválida',
        formato === 'audiobook' ? 'Use o formato 3h20, 3:20 ou 45min.' : 'Digite um número válido.'
      );
      return;
    }
    await updateProgress(currentBook.id, valor);
  }

  async function handleDelete() {
    await deleteBook(currentBook.id);
    router.replace('/library');
  }

  // Posição do livro na série (deduzida do título), com os vizinhos.
  const serie = seriesOfBook(currentBook, books);
  const aqui = serie?.volumes.findIndex((v) => v.book.id === currentBook.id) ?? -1;
  const anterior = serie && aqui > 0 ? serie.volumes[aqui - 1] : null;
  const seguinte = serie && aqui >= 0 && aqui < serie.volumes.length - 1 ? serie.volumes[aqui + 1] : null;

  const semGenero = !currentBook.genre || ['a definir', 'diverso', 'indefinido'].includes(currentBook.genre.trim().toLowerCase());
  const detalhes = [
    currentBook.rating ? { label: 'nota', value: currentBook.rating + '/5 ★' } : null,
    formato !== 'physical' ? { label: 'formato', value: BOOK_FORMATS.find((f) => f.value === formato)!.label } : null,
    !semGenero ? { label: 'gênero', value: currentBook.genre } : null,
    currentBook.publisher ? { label: 'editora', value: currentBook.publisher } : null,
    currentBook.publishedDate ? { label: 'ano', value: currentBook.publishedDate.slice(0, 4) } : null,
    currentBook.finishedAt ? { label: 'mês de leitura', value: capitalize(new Date(currentBook.finishedAt).toLocaleDateString(appLocale, { month: 'short', year: 'numeric' })) } : null,
    currentBook.isbn ? { label: 'ISBN', value: currentBook.isbn } : null
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <Screen>
      <View style={styles.heroRow}>
        <View style={styles.coverBox}>
          {currentBook.coverUrl ? <Image source={{ uri: currentBook.coverUrl }} style={styles.coverImage} /> : <Text style={styles.coverText}>{currentBook.title.slice(0, 1)}</Text>}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>{statusLabel(currentBook.status)} • {currentBook.genre}</Text>
          <Text style={styles.title}>{currentBook.title}</Text>
          <Text style={styles.author}>{currentBook.author}</Text>
        </View>
      </View>

      <View style={styles.actionsTop}>
        <Pressable style={[styles.editButton, styles.btnRow]} onPress={() => router.push({ pathname: '/edit/[id]', params: { id: currentBook.id } } as never)}><ReadoraIcon name="editBook" size={16} color={appColors.gold} /><Text style={styles.editText}>Editar livro</Text></Pressable>
        <Pressable style={[styles.editButton, styles.btnRow]} onPress={() => setShowCard(true)}><ReadoraIcon name="share" size={16} color={appColors.gold} /><Text style={styles.editText}>Compartilhar card</Text></Pressable>
      </View>
      {showCard ? <BookShareCard book={currentBook} onClose={() => setShowCard(false)} /> : null}
      {showChat ? <BookChat book={currentBook} onClose={() => setShowChat(false)} /> : null}
      {isAiConfigured ? <Pressable style={[styles.startButton, styles.btnRow]} onPress={() => setShowChat(true)}><ReadoraIcon name="quotes" size={17} color={appColors.background} /><Text style={styles.startText}>Converse com o livro</Text></Pressable> : null}
      {currentBook.status === 'wishlist' ? <Pressable style={[styles.startButton, styles.btnRow]} onPress={() => updateStatus(currentBook.id, 'reading')}><ReadoraIcon name="bookDetails" size={17} color={appColors.background} /><Text style={styles.startText}>Começar leitura</Text></Pressable> : null}

      <Card>
        <Text style={styles.cardTitle}>Progresso</Text>
        <Text style={styles.progressText}>{progress}% concluído</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: percent(progress) }]} /></View>
        {/* No e-book o rótulo repetiria a porcentagem de cima. */}
        {formato !== 'ebook' ? <Text style={styles.muted}>{progressLabel(currentBook)}</Text> : null}
        {formato === 'audiobook' && !currentBook.totalMinutes ? <Text style={styles.muted}>Informe a duração total em Editar para ver a porcentagem.</Text> : null}
      </Card>

      {/* Só o que foi preenchido. Antes todo campo aparecia, e um livro recém
          cadastrado virava uma grade de "0/5", "-" e "-". */}
      {serie && aqui >= 0 ? (
        <Card>
          <Text style={styles.cardTitle}>Série</Text>
          <Link href="/series" asChild>
            <Pressable><Text style={styles.seriesName}>{serie.name}</Text></Pressable>
          </Link>
          <Text style={styles.muted}>
            Volume {serie.volumes[aqui].volume} de {serie.lastVolume} · {serie.finished} lido(s)
          </Text>
          <View style={styles.seriesNav}>
            {anterior ? (
              <Link href={('/book/' + anterior.book.id) as never} asChild>
                <Pressable style={styles.seriesButton}><ReadoraIcon name="back" size={15} color={appColors.gold} /><Text style={styles.secondaryText}>Vol. {anterior.volume}</Text></Pressable>
              </Link>
            ) : null}
            {seguinte ? (
              <Link href={('/book/' + seguinte.book.id) as never} asChild>
                <Pressable style={styles.seriesButton}><Text style={styles.secondaryText}>Vol. {seguinte.volume}</Text><ReadoraIcon name="forward" size={15} color={appColors.gold} /></Pressable>
              </Link>
            ) : null}
          </View>
        </Card>
      ) : null}

      {detalhes.length ? (
        <View style={styles.grid}>
          {detalhes.map((item) => (
            <Card key={item.label}>
              <Text style={styles.smallValue}>{item.value}</Text>
              <Text style={styles.smallLabel}>{item.label}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder={formato === 'audiobook' ? 'Tempo ouvido (ex.: 3h20)' : formato === 'ebook' ? '% lido (ex.: 42)' : 'Página atual'}
        placeholderTextColor={appColors.textDim}
        value={page}
        onChangeText={setPage}
        keyboardType={formato === 'audiobook' ? 'default' : 'numeric'}
      />
      <Pressable style={[styles.primaryButton, styles.btnRow]} onPress={handleProgress}><ReadoraIcon name="trendingUp" size={17} color={appColors.background} /><Text style={styles.primaryText}>Atualizar progresso</Text></Pressable>

      <View style={styles.statusRow}>
        <Pressable style={styles.secondaryButton} onPress={() => updateStatus(currentBook.id, 'reading')}><Text style={styles.secondaryText}>Lendo</Text></Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => updateStatus(currentBook.id, 'finished')}><Text style={styles.secondaryText}>Lido</Text></Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => updateStatus(currentBook.id, 'wishlist')}><Text style={styles.secondaryText}>Quero ler</Text></Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => updateStatus(currentBook.id, 'dnf')}><Text style={styles.secondaryText}>Abandonei</Text></Pressable>
      </View>

      {currentBook.contentWarnings ? <Card><Text style={[styles.cardTitle, { color: appColors.red }]}>Alertas de conteúdo</Text><Text style={styles.body}>{currentBook.contentWarnings}</Text></Card> : null}
      {currentBook.reasonToRead ? <Card><Text style={styles.cardTitle}>Motivo de leitura</Text><Text style={styles.body}>{currentBook.reasonToRead}</Text></Card> : null}
      {currentBook.favoriteQuote ? <Card><Text style={styles.cardTitle}>Citação favorita</Text><Text style={styles.quote}>{currentBook.favoriteQuote}</Text></Card> : null}
      {currentBook.review ? <Card><Text style={styles.cardTitle}>Resenha</Text><Text style={styles.body}>{currentBook.review}</Text></Card> : null}
      {currentBook.notes ? <Card><Text style={styles.cardTitle}>Notas</Text><Text style={styles.body}>{currentBook.notes}</Text></Card> : null}

      <Pressable style={[styles.deleteButton, styles.btnRow]} onPress={handleDelete}><ReadoraIcon name="trash" size={16} color={appColors.red} /><Text style={styles.deleteText}>Remover da biblioteca local</Text></Pressable>
    </Screen>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function percent(value: number) {
  return (value + '%') as `${number}%`;
}

const styles = StyleSheet.create({
  seriesName: { color: appColors.text, fontFamily: appFonts.display, fontSize: 22, fontWeight: '900' },
  seriesNav: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  seriesButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  heroRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  coverBox: { width: 92, height: 138, borderRadius: 18, backgroundColor: appColors.surface, borderColor: appColors.gold, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  coverImage: { width: '100%', height: '100%' },
  coverText: { color: appColors.gold, fontSize: 42, fontWeight: '900' },
  headerText: { flex: 1, gap: 8 },
  kicker: { color: appColors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  author: { color: appColors.textMuted, fontSize: 16 },
  actionsTop: { flexDirection: 'row', gap: 10 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  editButton: { flex: 1, borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  editText: { color: appColors.gold, fontWeight: '900' },
  startButton: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  startText: { color: appColors.background, fontWeight: '900' },
  cardTitle: { color: appColors.gold, fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  progressText: { color: appColors.text, fontSize: 26, fontWeight: '900' },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: appColors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: appColors.gold },
  muted: { color: appColors.textMuted, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  smallValue: { color: appColors.text, fontSize: 18, fontWeight: '900' },
  smallLabel: { color: appColors.textDim, fontSize: 12 },
  body: { color: appColors.textMuted, lineHeight: 22 },
  input: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, color: appColors.text, fontSize: 16 },
  textArea: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, color: appColors.text, fontSize: 16, minHeight: 90, textAlignVertical: 'top' },
  half: { flex: 1 },
  primaryButton: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: appColors.background, fontWeight: '900' },
  statusRow: { flexDirection: 'row', gap: 8 },
  secondaryButton: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: appColors.textMuted, fontWeight: '900', fontSize: 12 },
  quote: { color: appColors.text, fontSize: 18, fontStyle: 'italic', lineHeight: 26 },
  deleteButton: { borderColor: appColors.red, borderWidth: 1, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  deleteText: { color: appColors.red, fontWeight: '900' }
});

