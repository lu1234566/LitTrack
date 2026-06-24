import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { useShelves } from '@/contexts/ShelfContext';
import { isNativeFirebaseConfigured, pullReadoraBundle, pushReadoraBundle } from '@/services/firebaseNative';
import { appColors } from '@/theme/tokens';

export default function SettingsScreen() {
  const { books, replaceBooks } = useBooks();
  const { quotes, setQuoteList } = useQuotes();
  const { shelves, setShelfList } = useShelves();
  const { sessions, setSessionList } = useReadingSessions();
  const { preferences, updatePreferences } = usePreferences();
  const [readerName, setReaderName] = useState(preferences.readerName);
  const [favoriteFormat, setFavoriteFormat] = useState(preferences.favoriteFormat);
  const [reminderText, setReminderText] = useState(preferences.reminderText);
  const [syncUserId, setSyncUserId] = useState(preferences.syncUserId);
  const [syncMessage, setSyncMessage] = useState('');

  async function save() {
    await updatePreferences({ readerName, favoriteFormat, reminderText, syncUserId });
    setSyncMessage('Preferencias salvas localmente.');
  }

  async function pushAll() {
    const nextPreferences = { ...preferences, readerName, favoriteFormat, reminderText, syncUserId };
    await updatePreferences(nextPreferences);
    const result = await pushReadoraBundle(syncUserId || 'local-reader', { books, quotes, shelves, sessions, preferences: nextPreferences });
    setSyncMessage(result.ok ? result.count + ' item(ns) enviados ao Firestore.' : 'Firebase ainda nao configurado.');
  }

  async function pullAll() {
    await updatePreferences({ syncUserId });
    const bundle = await pullReadoraBundle(syncUserId || 'local-reader');
    if (!isNativeFirebaseConfigured) {
      setSyncMessage('Firebase ainda nao configurado.');
      return;
    }
    if (bundle.books?.length) await replaceBooks(bundle.books);
    if (bundle.quotes?.length) await setQuoteList(bundle.quotes);
    if (bundle.shelves?.length) await setShelfList(bundle.shelves);
    if (bundle.sessions?.length) await setSessionList(bundle.sessions);
    if (bundle.preferences) {
      await updatePreferences({ ...preferences, ...bundle.preferences, syncUserId });
      setReaderName(bundle.preferences.readerName || readerName);
      setFavoriteFormat(bundle.preferences.favoriteFormat || favoriteFormat);
      setReminderText(bundle.preferences.reminderText || reminderText);
    }
    const total = (bundle.books?.length || 0) + (bundle.quotes?.length || 0) + (bundle.shelves?.length || 0) + (bundle.sessions?.length || 0);
    setSyncMessage(total > 0 ? total + ' item(ns) recebidos do Firestore.' : 'Nenhum dado remoto encontrado.');
  }

  return (
    <Screen>
      <Text style={styles.title}>Ajustes</Text>
      <Text style={styles.subtitle}>Preferencias locais, estado da migracao nativa e sincronizacao manual.</Text>

      <Card>
        <Text style={styles.kicker}>Perfil local</Text>
        <TextInput style={styles.input} placeholder="Nome do leitor" placeholderTextColor={appColors.textDim} value={readerName} onChangeText={setReaderName} />
        <TextInput style={styles.input} placeholder="Formato favorito" placeholderTextColor={appColors.textDim} value={favoriteFormat} onChangeText={setFavoriteFormat} />
        <TextInput style={styles.input} placeholder="Lembrete pessoal" placeholderTextColor={appColors.textDim} value={reminderText} onChangeText={setReminderText} />
        <Pressable style={styles.button} onPress={save}><Text style={styles.buttonText}>Salvar preferencias</Text></Pressable>
      </Card>

      <Card>
        <Text style={styles.kicker}>Firebase</Text>
        <Text style={styles.value}>{isNativeFirebaseConfigured ? 'Configurado' : 'Pendente'}</Text>
        <Text style={styles.body}>Use EXPO_PUBLIC_FIREBASE_* no ambiente Expo para ativar sincronizacao.</Text>
        <TextInput style={styles.input} placeholder="ID local de sincronizacao" placeholderTextColor={appColors.textDim} value={syncUserId} onChangeText={setSyncUserId} />
        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryButton} onPress={pushAll}><Text style={styles.secondaryText}>Enviar tudo</Text></Pressable>
          <Pressable style={styles.secondaryButton} onPress={pullAll}><Text style={styles.secondaryText}>Receber tudo</Text></Pressable>
        </View>
        {syncMessage ? <Text style={styles.body}>{syncMessage}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.kicker}>Pacote local</Text>
        <Text style={styles.body}>{books.length} livros, {quotes.length} citacoes, {shelves.length} estantes e {sessions.length} sessoes.</Text>
      </Card>

      <Card>
        <Text style={styles.kicker}>Build</Text>
        <View style={styles.row}><Text style={styles.body}>Preview APK</Text><Text style={styles.gold}>EAS</Text></View>
        <View style={styles.row}><Text style={styles.body}>App bundle</Text><Text style={styles.gold}>Producao</Text></View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  value: { color: appColors.text, fontSize: 24, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  gold: { color: appColors.gold, fontWeight: '900' },
  input: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16, marginTop: 10 },
  button: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: appColors.background, fontWeight: '900' },
  secondaryButton: { flex: 1, borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, alignItems: 'center', paddingVertical: 12 },
  secondaryText: { color: appColors.gold, fontWeight: '900', fontSize: 12 }
});
