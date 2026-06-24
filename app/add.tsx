import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useBooks } from '@/contexts/BookContext';
import { BookStatus } from '@/types/book';
import { appColors } from '@/theme/tokens';

export default function AddBookScreen() {
  const { addBook } = useBooks();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [status, setStatus] = useState<BookStatus>('reading');

  async function handleSave() {
    if (!title.trim() || !author.trim()) {
      Alert.alert('Campos obrigatórios', 'Informe pelo menos título e autor.');
      return;
    }

    await addBook({
      title: title.trim(),
      author: author.trim(),
      genre: genre.trim() || 'A definir',
      status,
      rating: 0,
      totalPages: Number(totalPages) || 0,
      currentPage: 0,
      review: '',
      favoriteQuote: ''
    });

    router.replace('/library');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Adicionar livro</Text>
        <Text style={styles.subtitle}>Cadastro inicial nativo. Depois conectaremos Firestore e capas.</Text>
      </View>

      <TextInput style={styles.input} placeholder="Título" placeholderTextColor={appColors.textDim} value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Autor" placeholderTextColor={appColors.textDim} value={author} onChangeText={setAuthor} />
      <TextInput style={styles.input} placeholder="Gênero" placeholderTextColor={appColors.textDim} value={genre} onChangeText={setGenre} />
      <TextInput style={styles.input} placeholder="Total de páginas" placeholderTextColor={appColors.textDim} value={totalPages} onChangeText={setTotalPages} keyboardType="numeric" />

      <View style={styles.statusRow}>
        {(['reading', 'finished', 'wishlist'] as BookStatus[]).map((item) => (
          <Pressable key={item} style={[styles.statusButton, status === item && styles.statusButtonActive]} onPress={() => setStatus(item)}>
            <Text style={[styles.statusText, status === item && styles.statusTextActive]}>{statusLabel(item)}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Salvar livro</Text>
      </Pressable>
    </Screen>
  );
}

function statusLabel(status: BookStatus) {
  if (status === 'finished') return 'Lido';
  if (status === 'wishlist') return 'Quero ler';
  return 'Lendo';
}

const styles = StyleSheet.create({
  header: {
    gap: 8
  },
  title: {
    color: appColors.text,
    fontSize: 30,
    fontWeight: '900'
  },
  subtitle: {
    color: appColors.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  input: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: appColors.text,
    fontSize: 16
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8
  },
  statusButton: {
    flex: 1,
    borderColor: appColors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center'
  },
  statusButtonActive: {
    backgroundColor: appColors.gold,
    borderColor: appColors.gold
  },
  statusText: {
    color: appColors.textMuted,
    fontWeight: '800',
    fontSize: 12
  },
  statusTextActive: {
    color: appColors.background
  },
  saveButton: {
    backgroundColor: appColors.gold,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8
  },
  saveText: {
    color: appColors.background,
    fontWeight: '900',
    fontSize: 16
  }
});
