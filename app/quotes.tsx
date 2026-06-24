import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { Quote } from '@/types/quote';
import { appColors } from '@/theme/tokens';

export default function QuotesScreen() {
  const { books } = useBooks();
  const { quotes, addQuote, updateQuote, deleteQuote, toggleFavoriteQuote } = useQuotes();
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [tags, setTags] = useState('');
  const [bookId, setBookId] = useState(books[0]?.id || '');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
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

  return (
    <Screen>
      <Text style={styles.title}>Citacoes</Text>
      <Text style={styles.subtitle}>Citacoes independentes com busca, tags, favoritos, edicao e associacao aos livros.</Text>

      <Card>
        <Text style={styles.kicker}>Nova citacao</Text>
        <TextInput style={styles.textArea} placeholder="Trecho marcante" placeholderTextColor={appColors.textDim} value={text} onChangeText={setText} multiline />
        <View style={styles.bookPicker}>
          {books.slice(0, 4).map((book) => (
            <Pressable key={book.id} style={[styles.chip, bookId === book.id && styles.chipActive]} onPress={() => setBookId(book.id)}>
              <Text style={[styles.chipText, bookId === book.id && styles.chipTextActive]} numberOfLines={1}>{book.title}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.half]} placeholder="Pagina" placeholderTextColor={appColors.textDim} value={page} onChangeText={setPage} keyboardType="numeric" />
          <TextInput style={[styles.input, styles.half]} placeholder="Tags" placeholderTextColor={appColors.textDim} value={tags} onChangeText={setTags} />
        </View>
        <Pressable style={styles.button} onPress={handleAdd}><Text style={styles.buttonText}>Salvar citacao</Text></Pressable>
      </Card>

      <TextInput style={styles.input} placeholder="Buscar citacao, livro ou tag" placeholderTextColor={appColors.textDim} value={search} onChangeText={setSearch} />
      <View style={styles.bookPicker}>
        <Pressable style={[styles.chip, favoritesOnly && styles.chipActive]} onPress={() => setFavoritesOnly(!favoritesOnly)}>
          <Text style={[styles.chipText, favoritesOnly && styles.chipTextActive]}>Favoritas</Text>
        </Pressable>
        {allTags.map((tag) => (
          <Pressable key={tag} style={[styles.chip, tagFilter === tag && styles.chipActive]} onPress={() => setTagFilter(tag)}>
            <Text style={[styles.chipText, tagFilter === tag && styles.chipTextActive]}>{tag === 'all' ? 'Todas' : tag}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.resultCount}>{visibleQuotes.length} citacao(oes)</Text>
      {quotes.length === 0 ? <Text style={styles.muted}>Nenhuma citacao cadastrada ainda.</Text> : null}
      {visibleQuotes.map((quote) => {
        const editing = editingId === quote.id;
        return (
          <Card key={quote.id}>
            {editing ? (
              <>
                <TextInput style={styles.textArea} placeholder="Editar trecho" placeholderTextColor={appColors.textDim} value={editText} onChangeText={setEditText} multiline />
                <View style={styles.row}>
                  <TextInput style={[styles.input, styles.half]} placeholder="Pagina" placeholderTextColor={appColors.textDim} value={editPage} onChangeText={setEditPage} keyboardType="numeric" />
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
            <View style={styles.actions}>
              {editing ? <Pressable style={styles.secondary} onPress={() => saveEditing(quote)}><Text style={styles.secondaryText}>Salvar</Text></Pressable> : <Pressable style={styles.secondary} onPress={() => startEditing(quote)}><Text style={styles.secondaryText}>Editar</Text></Pressable>}
              <Pressable style={styles.secondary} onPress={() => toggleFavoriteQuote(quote.id)}><Text style={styles.secondaryText}>{quote.favorite ? 'Favorita' : 'Favoritar'}</Text></Pressable>
              <Pressable style={styles.danger} onPress={() => deleteQuote(quote.id)}><Text style={styles.dangerText}>Remover</Text></Pressable>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  textArea: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16, minHeight: 96, textAlignVertical: 'top', marginTop: 10 },
  input: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  half: { flex: 1 },
  bookPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, maxWidth: '48%' },
  chipActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  chipText: { color: appColors.textMuted, fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: appColors.background },
  button: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: appColors.background, fontWeight: '900' },
  quote: { color: appColors.text, fontSize: 17, lineHeight: 25, fontStyle: 'italic' },
  book: { color: appColors.gold, fontWeight: '900', marginTop: 8 },
  author: { color: appColors.textMuted, marginTop: 2 },
  tags: { color: appColors.textDim, marginTop: 8, fontSize: 12 },
  resultCount: { color: appColors.textMuted, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  secondary: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, alignItems: 'center', paddingVertical: 10 },
  secondaryText: { color: appColors.text, fontWeight: '900', fontSize: 12 },
  danger: { flex: 1, borderColor: appColors.red, borderWidth: 1, borderRadius: 999, alignItems: 'center', paddingVertical: 10 },
  dangerText: { color: appColors.red, fontWeight: '900', fontSize: 12 },
  muted: { color: appColors.textMuted }
});
