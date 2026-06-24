import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useShelves } from '@/contexts/ShelfContext';
import { appColors } from '@/theme/tokens';

export default function ShelvesScreen() {
  const { books } = useBooks();
  const { shelves, addShelf, deleteShelf, toggleBookInShelf } = useShelves();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function handleAdd() {
    if (!name.trim()) return;
    await addShelf({ name: name.trim(), description: description.trim(), color: 'gold', bookIds: [] });
    setName('');
    setDescription('');
  }

  return (
    <Screen>
      <Text style={styles.title}>Estantes</Text>
      <Text style={styles.subtitle}>Crie colecoes manuais e escolha quais livros entram em cada uma.</Text>

      <Card>
        <Text style={styles.kicker}>Nova estante</Text>
        <TextInput style={styles.input} placeholder="Nome da estante" placeholderTextColor={appColors.textDim} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Descricao" placeholderTextColor={appColors.textDim} value={description} onChangeText={setDescription} />
        <Pressable style={styles.button} onPress={handleAdd}><Text style={styles.buttonText}>Criar estante</Text></Pressable>
      </Card>

      {shelves.map((shelf) => {
        const shelfBooks = books.filter((book) => shelf.bookIds.includes(book.id));
        return (
          <Card key={shelf.id}>
            <View style={styles.row}>
              <Text style={styles.shelfName}>{shelf.name}</Text>
              <Text style={styles.count}>{shelfBooks.length}</Text>
            </View>
            <Text style={styles.preview}>{shelf.description || 'Sem descricao.'}</Text>
            <Text style={styles.preview}>{shelfBooks.map((book) => book.title).join(' • ') || 'Sem livros nesta estante.'}</Text>
            <View style={styles.bookList}>
              {books.slice(0, 6).map((book) => {
                const active = shelf.bookIds.includes(book.id);
                return (
                  <Pressable key={book.id} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleBookInShelf(shelf.id, book.id)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{book.title}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.danger} onPress={() => deleteShelf(shelf.id)}><Text style={styles.dangerText}>Remover estante</Text></Pressable>
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
  input: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16, marginTop: 10 },
  button: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: appColors.background, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shelfName: { color: appColors.text, fontSize: 18, fontWeight: '900' },
  count: { color: appColors.background, backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontWeight: '900' },
  preview: { color: appColors.textMuted, lineHeight: 22, marginTop: 8 },
  bookList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, maxWidth: '48%' },
  chipActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  chipText: { color: appColors.textMuted, fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: appColors.background },
  danger: { borderColor: appColors.red, borderWidth: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  dangerText: { color: appColors.red, fontWeight: '900' }
});
