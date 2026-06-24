import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { useShelves } from '@/contexts/ShelfContext';
import { createReadoraBackup, parseReadoraBackup, stringifyBackup } from '@/services/readoraBackup';
import { appColors } from '@/theme/tokens';

export default function BackupScreen() {
  const { books, stats, replaceBooks } = useBooks();
  const { preferences, updatePreferences } = usePreferences();
  const { quotes, setQuoteList } = useQuotes();
  const { shelves, setShelfList } = useShelves();
  const { sessions, setSessionList } = useReadingSessions();
  const [backupText, setBackupText] = useState('');
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');

  function generateBackup() {
    const backup = createReadoraBackup({ books, quotes, shelves, sessions, preferences });
    setBackupText(stringifyBackup(backup));
    setMessage('Backup gerado. Copie o JSON para guardar ou migrar.');
  }

  async function importBackup() {
    try {
      const backup = parseReadoraBackup(importText);
      await replaceBooks(backup.books);
      await setQuoteList(backup.quotes);
      await setShelfList(backup.shelves);
      await setSessionList(backup.sessions);
      if (backup.preferences) await updatePreferences({ ...preferences, ...backup.preferences });
      setMessage('Backup importado com sucesso: ' + backup.books.length + ' livros, ' + backup.quotes.length + ' citacoes, ' + backup.shelves.length + ' estantes e ' + backup.sessions.length + ' sessoes.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel importar o backup.');
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Backup</Text>
      <Text style={styles.subtitle}>Exporte e importe todos os dados locais do Readora por JSON.</Text>

      <Card>
        <Text style={styles.kicker}>Resumo local</Text>
        <Text style={styles.body}>{books.length} livros, {quotes.length} citacoes, {shelves.length} estantes e {sessions.length} sessoes.</Text>
        <Text style={styles.body}>{stats.pagesRead} paginas registradas. Leitor: {preferences.readerName}.</Text>
        <Pressable style={styles.button} onPress={generateBackup}><Text style={styles.buttonText}>Gerar backup JSON</Text></Pressable>
      </Card>

      {backupText ? (
        <Card>
          <Text style={styles.kicker}>Backup gerado</Text>
          <TextInput style={styles.textArea} value={backupText} onChangeText={setBackupText} multiline />
        </Card>
      ) : null}

      <Card>
        <Text style={styles.kicker}>Importar backup</Text>
        <TextInput style={styles.textArea} placeholder="Cole aqui o JSON exportado" placeholderTextColor={appColors.textDim} value={importText} onChangeText={setImportText} multiline />
        <Pressable style={styles.outlineButton} onPress={importBackup}><Text style={styles.outlineText}>Importar JSON</Text></Pressable>
      </Card>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  body: { color: appColors.textMuted, lineHeight: 22 },
  button: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: appColors.background, fontWeight: '900' },
  outlineButton: { borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  outlineText: { color: appColors.gold, fontWeight: '900' },
  textArea: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 12, minHeight: 180, textAlignVertical: 'top', marginTop: 10 },
  message: { color: appColors.gold, fontWeight: '800', lineHeight: 22 }
});
