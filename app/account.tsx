import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useSession } from '@/contexts/SessionContext';
import { appColors } from '@/theme/tokens';

export default function AccountScreen() {
  const { user, isGoogleLoginPrepared, signInWithGoogle, signOut } = useSession();
  const [message, setMessage] = useState('');

  async function handleConnect() {
    const result = await signInWithGoogle();
    setMessage(result);
  }

  return (
    <Screen>
      <Text style={styles.title}>Conta Readora</Text>
      <Text style={styles.subtitle}>Estrutura preparada para conta Google nativa e sincronizacao por usuario.</Text>
      <Card>
        <Text style={styles.kicker}>Status</Text>
        <Text style={styles.value}>{user ? 'Conectado' : 'Modo local'}</Text>
        <Text style={styles.body}>{isGoogleLoginPrepared ? 'Firebase e Google Client IDs detectados.' : 'Configure Firebase e Google Client IDs para ativar a conta real.'}</Text>
      </Card>
      {user ? (
        <Card>
          <Text style={styles.kicker}>Usuario</Text>
          <Text style={styles.value}>{user.displayName || user.email || user.uid}</Text>
          <Pressable style={styles.secondaryButton} onPress={signOut}><Text style={styles.secondaryText}>Desconectar</Text></Pressable>
        </Card>
      ) : (
        <Pressable style={styles.button} onPress={handleConnect}><Text style={styles.buttonText}>Conectar conta Google</Text></Pressable>
      )}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  value: { color: appColors.text, fontSize: 24, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22 },
  button: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: appColors.background, fontWeight: '900' },
  secondaryButton: { borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  secondaryText: { color: appColors.gold, fontWeight: '900' },
  message: { color: appColors.gold, fontWeight: '800', lineHeight: 22 }
});
