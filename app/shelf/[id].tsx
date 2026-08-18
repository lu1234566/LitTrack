import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { BookCover } from '@/components/BookCover';
import { useBooks } from '@/contexts/BookContext';
import { useShelves } from '@/contexts/ShelfContext';
import { appColors } from '@/theme/tokens';

export default function ShelfDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const shelfId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { books } = useBooks();
  const { shelves, updateShelf, toggleBookInShelf } = useShelves();
  // Antes do early return abaixo: hook não pode ficar atrás de um return.
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  // 3 miniaturas por linha no celular, 6 no desktop — a sobra das porcentagens
  // é o respiro do gap.
  const thumbWidth = mobile ? '31%' : '15.4%';
  const thumbHeight = mobile ? 150 : 190;
  const shelf = shelves.find((item) => item.id === shelfId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!shelf) {
    return (
      <Screen>
        <Text style={styles.title}>Estante nao encontrada</Text>
      </Screen>
    );
  }

  const currentShelf = shelf;
  const shelfBooks = books.filter((book) => currentShelf.bookIds.includes(book.id));
  const otherBooks = books.filter((book) => !currentShelf.bookIds.includes(book.id));

  function startEditing() {
    setName(currentShelf.name);
    setDescription(currentShelf.description || '');
    setEditing(true);
  }

  async function saveEditing() {
    await updateShelf(currentShelf.id, { name: name.trim() || currentShelf.name, description: description.trim() });
    setEditing(false);
  }

  return (
    <Screen>
      {editing ? (
        <Card>
          <Text style={styles.kicker}>Editar estante</Text>
          <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={appColors.textDim} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Descricao" placeholderTextColor={appColors.textDim} value={description} onChangeText={setDescription} />
          <Pressable style={styles.button} onPress={saveEditing}><Text style={styles.buttonText}>Salvar estante</Text></Pressable>
        </Card>
      ) : (
        <>
          <Text style={styles.title}>{currentShelf.name}</Text>
          <Text style={styles.subtitle}>{currentShelf.description || 'Colecao manual do Readora.'}</Text>
          <Pressable style={styles.outlineButton} onPress={startEditing}><Text style={styles.outlineText}>Editar nome e descricao</Text></Pressable>
        </>
      )}

      <View style={styles.grid}>
        <Card><Text style={styles.big}>{shelfBooks.length}</Text><Text style={styles.label}>livros</Text></Card>
        <Card><Text style={styles.big}>{shelfBooks.reduce((sum, book) => sum + (book.totalPages || 0), 0)}</Text><Text style={styles.label}>paginas</Text></Card>
      </View>

      <Text style={styles.section}>Livros da estante</Text>
      {shelfBooks.length === 0 ? <Text style={styles.muted}>Ainda nao ha livros nesta estante.</Text> : null}
      {/* Miniaturas, como arquivos numa pasta: a estante é uma coleção visual,
          e a capa identifica o livro mais rápido do que uma linha de texto.
          As outras telas seguem com a lista detalhada do BookCard. */}
      <View style={styles.thumbGrid}>
        {shelfBooks.map((book) => (
          <Link key={book.id} href={{ pathname: '/book/[id]', params: { id: book.id } }} asChild>
            <Pressable style={StyleSheet.flatten([styles.thumb, { width: thumbWidth }])}>
              <BookCover book={book} height={thumbHeight} />
              <Text style={styles.thumbTitle} numberOfLines={2}>{book.title}</Text>
              <Text style={styles.thumbAuthor} numberOfLines={1}>{book.author}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <Text style={styles.section}>Adicionar ou remover</Text>
      <Card>
        <Text style={styles.kicker}>Disponiveis</Text>
        <View style={styles.bookList}>
          {[...shelfBooks, ...otherBooks].map((book) => {
            const active = currentShelf.bookIds.includes(book.id);
            return (
              <Pressable key={book.id} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleBookInShelf(currentShelf.id, book.id)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{book.title}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 34, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  input: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: appColors.text },
  button: { backgroundColor: appColors.gold, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: appColors.background, fontWeight: '900' },
  outlineButton: { borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10 },
  outlineText: { color: appColors.gold, fontWeight: '900' },
  grid: { flexDirection: 'row', gap: 12 },
  big: { color: appColors.text, fontSize: 30, fontWeight: '900' },
  label: { color: appColors.textMuted, fontSize: 12 },
  section: { color: appColors.text, fontSize: 19, fontWeight: '900' },
  muted: { color: appColors.textMuted },
  thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  thumb: { gap: 6 },
  thumbTitle: { color: appColors.text, fontSize: 13, fontWeight: '900', lineHeight: 17 },
  thumbAuthor: { color: appColors.textMuted, fontSize: 11, fontWeight: '700' },
  bookList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, maxWidth: 180 },
  chipActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  chipText: { color: appColors.textMuted, fontWeight: '800' },
  chipTextActive: { color: appColors.background }
});
