import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { Quote } from '@/types/quote';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { copyText, haptic } from '@/services/feedback';
import { appColors, appFonts } from '@/theme/tokens';

export default function QuotesScreen() {
  const { books } = useBooks();
  const { quotes, addQuote, updateQuote, deleteQuote, toggleFavoriteQuote } = useQuotes();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [tags, setTags] = useState('');
  const [bookId, setBookId] = useState(books[0]?.id || '');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editText, setEditText] = useState('');
  const [editPage, setEditPage] = useState('');
  const [editTags, setEditTags] = useState('');
  const selectedBook = books.find((book) => book.id === bookId) || books[0];

  const allTags = useMemo(() => ['all', ...Array.from(new Set(quotes.flatMap((quote) => quote.tags)))], [quotes]);

  const visibleQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const haystack = (quote.text + ' ' + quote.bookTitle + ' ' + quote.author + ' ' + quote.tags.join(' ')).toLowerCase();
      const okText = haystack.includes(search.toLowerCase());
      const okTag = tagFilter === 'all' || quote.tags.includes(tagFilter);
      const okFavorite = !favoritesOnly || quote.favorite;
      return okText && okTag && okFavorite;
    });
  }, [favoritesOnly, quotes, search, tagFilter]);

  async function handleAdd() {
    if (!text.trim()) return;
    await addQuote({
      bookId: selectedBook?.id,
      bookTitle: selectedBook?.title || 'Sem livro',
      author: selectedBook?.author || '',
      text: text.trim(),
      page: Number(page) || undefined,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      favorite: false
    });
    setText('');
    setPage('');
    setTags('');
    setShowComposer(false);
    haptic('success');
  }

  async function copyQuote(quote: Quote) {
    const attribution = [quote.author, quote.bookTitle].filter(Boolean).join(', ');
    const ok = await copyText('“' + quote.text + '”' + (attribution ? '\n— ' + attribution : ''));
    haptic(ok ? 'success' : 'warning');
  }

  function startEditing(quote: Quote) {
    setEditingId(quote.id);
    setEditText(quote.text);
    setEditPage(quote.page ? String(quote.page) : '');
    setEditTags(quote.tags.join(', '));
  }

  async function saveEditing(quote: Quote) {
    if (!editText.trim()) return;
    await updateQuote(quote.id, {
      text: editText.trim(),
      page: Number(editPage) || undefined,
      tags: editTags.split(',').map((tag) => tag.trim()).filter(Boolean)
    });
    setEditingId('');
    setEditText('');
    setEditPage('');
    setEditTags('');
  }

  const header = (
    <>
      <View style={[styles.headerRow, mobile && styles.stack]}>
        <View style={styles.titleBox}>
          <Text style={styles.title}><Text style={styles.titleIcon}>” </Text>Diário de Citações</Text>
          <Text style={styles.subtitle}>Sua biblioteca de memórias e passagens marcantes.</Text>
        </View>
        <Pressable style={[styles.newButton, styles.btnRow]} onPress={() => setShowComposer(!showComposer)}><ReadoraIcon name="add" size={17} color={appColors.background} /><Text style={styles.newButtonText}>Nova Citação</Text></Pressable>
      </View>

      {showComposer ? (
        <Card>
          <Text style={styles.kicker}>NOVA MEMÓRIA</Text>
          <TextInput style={styles.textArea} placeholder="Trecho marcante" placeholderTextColor={appColors.textDim} value={text} onChangeText={setText} multiline />
          <View style={styles.bookPicker}>
            {books.slice(0, 4).map((book) => (
              <Pressable key={book.id} style={[styles.chip, bookId === book.id && styles.chipActive]} onPress={() => setBookId(book.id)}>
                <Text style={[styles.chipText, bookId === book.id && styles.chipTextActive]} numberOfLines={1}>{book.title}</Text>
              </Pressable>
            ))}
          </View>
          <View style={[styles.row, mobile && styles.stack]}>
            <TextInput style={[styles.input, styles.half]} placeholder="Página" placeholderTextColor={appColors.textDim} value={page} onChangeText={setPage} keyboardType="numeric" />
            <TextInput style={[styles.input, styles.half]} placeholder="Tags ou sentimentos" placeholderTextColor={appColors.textDim} value={tags} onChangeText={setTags} />
          </View>
          <Pressable style={styles.button} onPress={handleAdd}><Text style={styles.buttonText}>Salvar citação</Text></Pressable>
        </Card>
      ) : null}

      <View style={[styles.filtersRow, mobile && styles.stack]}>
        <TextInput style={styles.searchInput} placeholder="Pesquisar em textos, livros ou notas..." placeholderTextColor={appColors.textDim} value={search} onChangeText={setSearch} />
        <Pressable style={[styles.selectField, styles.btnRow, favoritesOnly && styles.selectActive]} onPress={() => setFavoritesOnly(!favoritesOnly)}><ReadoraIcon name="heart" size={15} color={appColors.textMuted} /><Text style={styles.selectText}>{favoritesOnly ? 'Favoritas' : 'Todos os Livros'}</Text></Pressable>
        <Pressable style={[styles.selectField, styles.btnRow]} onPress={() => setTagFilter('all')}><ReadoraIcon name="filter" size={15} color={appColors.textMuted} /><Text style={styles.selectText}>{tagFilter === 'all' ? 'Todos os Sentimentos' : tagFilter}</Text></Pressable>
      </View>

      <View style={styles.bookPicker}>
        {allTags.slice(0, 8).map((tag) => (
          <Pressable key={tag} style={[styles.chip, tagFilter === tag && styles.chipActive]} onPress={() => setTagFilter(tag)}>
            <Text style={[styles.chipText, tagFilter === tag && styles.chipTextActive]}>{tag === 'all' ? 'Todas' : tag}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );

  const empty = (
    <View style={styles.emptyState}>
      <View style={styles.emptyCircle}><Text style={styles.emptyIcon}>”</Text></View>
      <Text style={styles.emptyTitle}>Nenhuma citação encontrada</Text>
      <Text style={styles.emptyText}>Comece a salvar trechos que tocam sua alma.</Text>
    </View>
  );

  return (
    <Screen
      data={visibleQuotes}
      keyExtractor={(quote) => quote.id}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      renderItem={(quote) => {
        const editing = editingId === quote.id;
        return (
          <Card>
            {editing ? (
              <>
                <TextInput style={styles.textArea} placeholder="Editar trecho" placeholderTextColor={appColors.textDim} value={editText} onChangeText={setEditText} multiline />
                <View style={[styles.row, mobile && styles.stack]}>
                  <TextInput style={[styles.input, styles.half]} placeholder="Página" placeholderTextColor={appColors.textDim} value={editPage} onChangeText={setEditPage} keyboardType="numeric" />
                  <TextInput style={[styles.input, styles.half]} placeholder="Tags" placeholderTextColor={appColors.textDim} value={editTags} onChangeText={setEditTags} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.quote}>{quote.text}</Text>
                <Text style={styles.book}>{quote.bookTitle}{quote.page ? ' • p. ' + quote.page : ''}</Text>
                <Text style={styles.author}>{quote.author}</Text>
                <Text style={styles.tags}>{quote.tags.join(' • ') || 'sem tags'}</Text>
              </>
            )}
            <View style={[styles.actions, mobile && styles.stack]}>
              {editing ? <Pressable style={styles.secondary} onPress={() => saveEditing(quote)}><Text style={styles.secondaryText}>Salvar</Text></Pressable> : <Pressable style={styles.secondary} onPress={() => startEditing(quote)}><Text style={styles.secondaryText}>Editar</Text></Pressable>}
              {editing ? null : <Pressable style={styles.secondary} onPress={() => copyQuote(quote)}><Text style={styles.secondaryText}>Copiar</Text></Pressable>}
              <Pressable style={styles.secondary} onPress={() => { haptic('light'); toggleFavoriteQuote(quote.id); }}><Text style={styles.secondaryText}>{quote.favorite ? 'Favorita' : 'Favoritar'}</Text></Pressable>
              <Pressable style={styles.danger} onPress={() => deleteQuote(quote.id)}><Text style={styles.dangerText}>Remover</Text></Pressable>
            </View>
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 },
  titleBox: { flex: 1 },
  stack: { flexDirection: 'column' },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 48, lineHeight: 58, fontWeight: '900' },
  titleIcon: { color: appColors.gold },
  subtitle: { color: appColors.textMuted, fontSize: 20, lineHeight: 30 },
  newButton: { backgroundColor: appColors.gold, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 28, alignItems: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  newButtonText: { color: appColors.background, fontSize: 18, fontWeight: '900' },
  kicker: { color: appColors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 4 },
  filtersRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  searchInput: { flex: 1, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 18, paddingHorizontal: 22, paddingVertical: 18, color: appColors.text, fontSize: 18 },
  selectField: { flex: 1, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 18, paddingHorizontal: 22, paddingVertical: 18 },
  selectActive: { borderColor: appColors.gold },
  selectText: { color: appColors.text, fontSize: 16, fontWeight: '900' },
  textArea: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 16, color: appColors.text, fontSize: 18, minHeight: 120, textAlignVertical: 'top', marginTop: 10 },
  input: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, color: appColors.text, fontSize: 17 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  half: { flex: 1 },
  bookPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, maxWidth: '48%' },
  chipActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  chipText: { color: appColors.textMuted, fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: appColors.background },
  button: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  buttonText: { color: appColors.background, fontWeight: '900' },
  emptyState: { minHeight: 420, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyCircle: { width: 86, height: 86, borderRadius: 999, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { color: appColors.textDim, fontSize: 48 },
  emptyTitle: { color: appColors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: appColors.textDim, fontSize: 18, textAlign: 'center' },
  quote: { color: appColors.text, fontFamily: appFonts.display, fontSize: 24, lineHeight: 32, fontStyle: 'italic' },
  book: { color: appColors.gold, fontWeight: '900', marginTop: 8 },
  author: { color: appColors.textMuted, marginTop: 2 },
  tags: { color: appColors.textDim, marginTop: 8, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  secondary: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, alignItems: 'center', paddingVertical: 11 },
  secondaryText: { color: appColors.text, fontWeight: '900', fontSize: 12 },
  danger: { flex: 1, borderColor: appColors.red, borderWidth: 1, borderRadius: 999, alignItems: 'center', paddingVertical: 11 },
  dangerText: { color: appColors.red, fontWeight: '900', fontSize: 12 }
});
