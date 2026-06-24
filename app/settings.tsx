import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { usePreferences } from '@/contexts/PreferencesContext';
import { isNativeFirebaseConfigured } from '@/services/firebaseNative';
import { appColors } from '@/theme/tokens';

export default function SettingsScreen() {
  const { preferences, updatePreferences } = usePreferences();
  const [readerName, setReaderName] = useState(preferences.readerName);
  const [favoriteFormat, setFavoriteFormat] = useState(preferences.favoriteFormat);
  const [reminderText, setReminderText] = useState(preferences.reminderText);
  const [syncUserId, setSyncUserId] = useState(preferences.syncUserId);

  async function save() {
    await updatePreferences({ readerName, favoriteFormat, reminderText, syncUserId });
  }

  return (
    <Screen>
      <Text style={styles.title}>Ajustes</Text>
      <Text style={styles.subtitle}>Preferencias locais e estado da migracao nativa.</Text>

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
      </Card>

      <Card>
        <Text style={styles.kicker}>Armazenamento</Text>
        <Text style={styles.value}>Local</Text>
        <Text style={styles.body}>A biblioteca esta salva em AsyncStorage enquanto login nativo e Firestore sao migrados.</Text>
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
  gold: { color: appColors.gold, fontWeight: '900' },
  input: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16, marginTop: 10 },
  button: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: appColors.background, fontWeight: '900' }
});
