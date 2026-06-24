import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { BookCard } from '@/components/BookCard';
import { useBooks } from '@/contexts/BookContext';
import { useShelves } from '@/contexts/ShelfContext';
import { appColors } from '@/theme/tokens';

export default function ShelfDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { books } = useBooks();
  const { shelves, updateShelf, toggleBookInShelf } = useShelves();
  const shelf = shelves.find((item) => item.id === String(id));
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

  const shelfBooks = books.filter((book) => shelf.bookIds.includes(book.id));
  const otherBooks = books.filter((book) => !shelf.bookIds.includes(book.id));

  function startEditing() {
    setName(shelf.name);
    setDescription(shelf.description || '');
    setEditing(true);
  }

  async function saveEditing() {
    await updateShelf(shelf.id, { name: name.trim() || shelf.name, description: description.trim() });
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
          <Text style={styles.title}>{shelf.name}</Text>
          <Text style={styles.subtitle}>{shelf.description || 'Colecao manual do Readora.'}</Text>
          <Pressable style={styles.outlineButton} onPress={startEditing}><Text style={styles.outlineText}>Editar nome e descricao</Text></Pressable>
        </>
      )}

      <View style={styles.grid}>
        <Card><Text style={styles.big}>{shelfBooks.length}</Text><Text style={styles.label}>livros</Text></Card>
        <Card><Text style={styles.big}>{shelfBooks.reduce((sum, book) => sum + (book.totalPages || 0), 0)}</Text><Text style={styles.label}>paginas</Text></Card>
      </View>

      <Text style={styles.section}>Livros da estante</Text>
      {shelfBooks.length === 0 ? <Text style={styles.muted}>Ainda nao ha livros nesta estante.</Text> : null}
      {shelfBooks.map((book) => <BookCard key={book.id} book={book} />)}

      <Text style={styles.section}>Adicionar ou remover</Text>
      <Card>
        <Text style={styles.kicker}>Disponiveis</Text>
        <View style={styles.bookList}>
          {[...shelfBooks, ...otherBooks].map((book) => {
            const active = shelf.bookIds.includes(book.id);
            return (
              <Pressable key={book.id} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleBookInShelf(shelf.id, book.id)}>
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
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  big: { color: appColors.text, fontSize: 28, fontWeight: '900' },
  label: { color: appColors.textMuted, fontSize: 12, marginTop: 4 },
  section: { color: appColors.text, fontSize: 20, fontWeight: '900', marginTop: 6 },
  muted: { color: appColors.textMuted },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  input: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16, marginTop: 10 },
  button: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: appColors.background, fontWeight: '900' },
  outlineButton: { borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  outlineText: { color: appColors.gold, fontWeight: '900' },
  bookList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, maxWidth: '48%' },
  chipActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  chipText: { color: appColors.textMuted, fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: appColors.background }
});
