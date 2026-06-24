import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { appColors } from '@/theme/tokens';

export default function QuickSessionScreen() {
  const { books, updateProgress } = useBooks();
  const { addSession } = useReadingSessions();
  const readingBooks = books.filter((book) => book.status === 'reading');
  const fallbackBooks = readingBooks.length ? readingBooks : books.slice(0, 5);
  const [bookId, setBookId] = useState(fallbackBooks[0]?.id || '');
  const [pages, setPages] = useState('10');
  const [minutes, setMinutes] = useState('20');
  const [mood, setMood] = useState('focado');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const selected = books.find((book) => book.id === bookId) || fallbackBooks[0];

  async function saveSession() {
    if (!selected) {
      setMessage('Cadastre um livro antes de registrar sessoes.');
      return;
    }
    const pagesRead = Number(pages) || 0;
    const minutesRead = Number(minutes) || 0;
    if (pagesRead <= 0 && minutesRead <= 0) {
      setMessage('Informe paginas ou minutos.');
      return;
    }
    await addSession({ bookId: selected.id, bookTitle: selected.title, pagesRead, minutesRead, mood, note });
    if (pagesRead > 0) await updateProgress(selected.id, (selected.currentPage || 0) + pagesRead);
    setMessage('Sessao registrada para ' + selected.title + '.');
    setNote('');
  }

  return (
    <Screen>
      <Text style={styles.title}>Sessao rapida</Text>
      <Text style={styles.subtitle}>Registre leitura em poucos toques e atualize o progresso do livro automaticamente.</Text>

      <Card>
        <Text style={styles.kicker}>Escolha o livro</Text>
        <View style={styles.bookList}>
          {fallbackBooks.map((book) => (
            <Pressable key={book.id} style={[styles.chip, bookId === book.id && styles.chipActive]} onPress={() => setBookId(book.id)}>
              <Text style={[styles.chipText, bookId === book.id && styles.chipTextActive]} numberOfLines={1}>{book.title}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.kicker}>Dados da sessao</Text>
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.half]} placeholder="Paginas" placeholderTextColor={appColors.textDim} value={pages} onChangeText={setPages} keyboardType="numeric" />
          <TextInput style={[styles.input, styles.half]} placeholder="Minutos" placeholderTextColor={appColors.textDim} value={minutes} onChangeText={setMinutes} keyboardType="numeric" />
        </View>
        <TextInput style={styles.input} placeholder="Humor" placeholderTextColor={appColors.textDim} value={mood} onChangeText={setMood} />
        <TextInput style={styles.textArea} placeholder="Nota rapida" placeholderTextColor={appColors.textDim} value={note} onChangeText={setNote} multiline />
        <Pressable style={styles.button} onPress={saveSession}><Text style={styles.buttonText}>Salvar sessao</Text></Pressable>
      </Card>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  bookList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, maxWidth: '48%' },
  chipActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  chipText: { color: appColors.textMuted, fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: appColors.background },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  half: { flex: 1 },
  input: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16, marginTop: 10 },
  textArea: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginTop: 10 },
  button: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: appColors.background, fontWeight: '900' },
  message: { color: appColors.gold, fontWeight: '800', lineHeight: 22 }
});
