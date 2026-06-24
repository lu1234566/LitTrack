import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useSession } from '@/contexts/SessionContext';
import { appColors, appFonts } from '@/theme/tokens';

export default function AccountScreen() {
  const { user, isGoogleLoginPrepared, signInWithGoogle, signOut } = useSession();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleConnect() {
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      setMessage(result);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>CONTA E NUVEM</Text>
        <Text style={styles.title}>Conta Readora</Text>
        <Text style={styles.subtitle}>Conecte sua conta Google para ativar autenticação Firebase e sincronização automática dos seus dados.</Text>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Status da conta</Text>
        <Text style={styles.value}>{user ? 'Conectado' : 'Modo local'}</Text>
        <Text style={styles.body}>{isGoogleLoginPrepared ? 'Firebase e Google Client IDs detectados. O login real está disponível.' : 'Configure Firebase e Google Client IDs para ativar a conta real.'}</Text>
      </Card>

      {user ? (
        <Card>
          <View style={styles.userRow}>
            {user.photoURL ? <Image source={{ uri: user.photoURL }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{(user.displayName || user.email || 'R').slice(0, 1).toUpperCase()}</Text></View>}
            <View style={styles.userTextBox}>
              <Text style={styles.userName}>{user.displayName || 'Leitor Readora'}</Text>
              <Text style={styles.userEmail}>{user.email || user.uid}</Text>
            </View>
          </View>
          <Text style={styles.body}>Com a conta ativa, o Readora sincroniza automaticamente livros, citações, estantes, sessões e preferências.</Text>
          <Pressable style={styles.secondaryButton} onPress={signOut}><Text style={styles.secondaryText}>Desconectar</Text></Pressable>
        </Card>
      ) : (
        <Card>
          <Text style={styles.cardTitle}>Entrar com Google</Text>
          <Text style={styles.body}>Use o fluxo de login do Google para criar uma sessão Firebase real. Confira se as variáveis de ambiente foram preenchidas antes de testar.</Text>
          <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={handleConnect} disabled={busy}><Text style={styles.buttonText}>{busy ? 'Conectando...' : 'Conectar conta Google'}</Text></Pressable>
        </Card>
      )}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  kicker: { color: appColors.gold, letterSpacing: 5, fontSize: 12, fontWeight: '900' },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 52, lineHeight: 58, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 18, lineHeight: 27, maxWidth: 720 },
  cardTitle: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 22, fontWeight: '900' },
  value: { color: appColors.text, fontSize: 30, fontWeight: '900', marginTop: 8 },
  body: { color: appColors.textMuted, lineHeight: 22, marginTop: 10 },
  button: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 18 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: appColors.background, fontWeight: '900' },
  secondaryButton: { borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginTop: 18 },
  secondaryText: { color: appColors.gold, fontWeight: '900' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 999 },
  avatarFallback: { width: 64, height: 64, borderRadius: 999, backgroundColor: appColors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: appColors.background, fontSize: 26, fontWeight: '900' },
  userTextBox: { flex: 1 },
  userName: { color: appColors.text, fontSize: 22, fontWeight: '900' },
  userEmail: { color: appColors.textDim, marginTop: 4 },
  message: { color: appColors.gold, fontWeight: '800', lineHeight: 22 }
});
