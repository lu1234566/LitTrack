import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { isNativeFirebaseConfigured } from '@/services/firebaseNative';
import { appColors } from '@/theme/tokens';

export default function SettingsScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Ajustes</Text>
      <Text style={styles.subtitle}>Painel de estado da migracao nativa.</Text>
      <Card>
        <Text style={styles.kicker}>Firebase</Text>
        <Text style={styles.value}>{isNativeFirebaseConfigured ? 'Configurado' : 'Pendente'}</Text>
        <Text style={styles.body}>Use EXPO_PUBLIC_FIREBASE_* no ambiente Expo para ativar sincronizacao.</Text>
      </Card>
      <Card>
        <Text style={styles.kicker}>Armazenamento</Text>
        <Text style={styles.value}>Local</Text>
        <Text style={styles.body}>A biblioteca esta salva em AsyncStorage enquanto Firestore e login nativo sao migrados.</Text>
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
  gold: { color: appColors.gold, fontWeight: '900' }
});
