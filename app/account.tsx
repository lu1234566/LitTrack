import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useSession } from '@/contexts/SessionContext';
import { useBooks } from '@/contexts/BookContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useShelves } from '@/contexts/ShelfContext';
import { deleteAllRemoteUserData } from '@/services/firebaseNative';
import { wipeLocalReadoraData } from '@/services/localWipe';
import { appColors, appFonts } from '@/theme/tokens';

/** O usuário digita isto para confirmar. Erro de toque não apaga a conta. */
const PALAVRA_CONFIRMACAO = 'EXCLUIR';

export default function AccountScreen() {
  const { user, isGoogleLoginPrepared, authNotice, signInWithGoogle, signOut } = useSession();
  const { replaceBooks } = useBooks();
  const { setQuoteList } = useQuotes();
  const { setShelfList } = useShelves();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirming'>('idle');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleConnect() {
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      setMessage(result);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!user || confirmText.trim().toUpperCase() !== PALAVRA_CONFIRMACAO) return;
    setDeleting(true);
    setMessage('');
    try {
      // A ordem importa. A nuvem primeiro, porque as regras do Firestore exigem
      // a sessão ativa — deslogar antes faria a exclusão falhar em silêncio.
      const result = await deleteAllRemoteUserData(user.uid);
      if (!result.ok) {
        setMessage('Não foi possível apagar os dados na nuvem. Verifique sua conexão e tente de novo.');
        return;
      }
      // Depois o estado em memória, senão a sincronização automática reenviaria
      // tudo o que acabou de ser apagado.
      await replaceBooks([]);
      await setQuoteList([]);
      await setShelfList([]);
      await wipeLocalReadoraData();
      await signOut();
      setDeleteStep('idle');
      setConfirmText('');
      setMessage('Conta e dados excluídos. Nada mais seu permanece no Readora.');
    } catch (error) {
      setMessage(error instanceof Error ? 'Falha ao excluir: ' + error.message : 'Falha ao excluir os dados.');
    } finally {
      setDeleting(false);
    }
  }

  const podeExcluir = confirmText.trim().toUpperCase() === PALAVRA_CONFIRMACAO;

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
          <Text style={styles.body}>Com a conta ativa, o Readora sincroniza automaticamente livros, citações, estantes e preferências.</Text>
          <Pressable style={styles.secondaryButton} onPress={signOut}><Text style={styles.secondaryText}>Desconectar</Text></Pressable>
        </Card>
      ) : (
        <Card>
          <Text style={styles.cardTitle}>Entrar com Google</Text>
          <Text style={styles.body}>Use o fluxo de login do Google para criar uma sessão Firebase real. Confira se as variáveis de ambiente foram preenchidas antes de testar.</Text>
          <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={handleConnect} disabled={busy}><Text style={styles.buttonText}>{busy ? 'Conectando...' : 'Conectar conta Google'}</Text></Pressable>
        </Card>
      )}

      {authNotice || message ? <Text style={styles.message}>{authNotice || message}</Text> : null}

      {/* Exigência do Google Play: quem cria conta precisa conseguir excluí-la
          junto com os dados. Fica por último, separado e em vermelho — é a
          única ação irreversível do app. */}
      {user ? (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Excluir conta e dados</Text>
          <Text style={styles.dangerBody}>
            Apaga definitivamente seus livros, citações, estantes e preferências — no aparelho e na nuvem.
            Esta ação não pode ser desfeita, e não há como recuperar depois.
          </Text>

          {deleteStep === 'idle' ? (
            <Pressable style={styles.dangerButton} onPress={() => setDeleteStep('confirming')}>
              <Text style={styles.dangerButtonText}>Excluir minha conta e meus dados</Text>
            </Pressable>
          ) : (
            <View style={styles.confirmBox}>
              <Text style={styles.dangerBody}>
                Para confirmar, digite <Text style={styles.dangerWord}>{PALAVRA_CONFIRMACAO}</Text> no campo abaixo.
              </Text>
              <TextInput
                style={styles.confirmInput}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder={PALAVRA_CONFIRMACAO}
                placeholderTextColor={appColors.textDim}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!deleting}
              />
              <View style={styles.confirmActions}>
                <Pressable
                  style={[styles.dangerButton, (!podeExcluir || deleting) && styles.dangerButtonDisabled]}
                  onPress={handleDelete}
                  disabled={!podeExcluir || deleting}
                >
                  <Text style={styles.dangerButtonText}>{deleting ? 'Excluindo...' : 'Excluir definitivamente'}</Text>
                </Pressable>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => { setDeleteStep('idle'); setConfirmText(''); }}
                  disabled={deleting}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      ) : null}
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
  message: { color: appColors.gold, fontWeight: '800', lineHeight: 22 },

  dangerZone: { borderColor: appColors.red, borderWidth: 1, borderRadius: 24, padding: 22, gap: 6, marginTop: 8, backgroundColor: 'rgba(255,45,103,0.04)' },
  dangerTitle: { color: appColors.red, fontFamily: appFonts.display, fontSize: 22, fontWeight: '900' },
  dangerBody: { color: appColors.textMuted, lineHeight: 22, marginTop: 6 },
  dangerWord: { color: appColors.red, fontWeight: '900' },
  dangerButton: { backgroundColor: appColors.red, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center', marginTop: 16 },
  dangerButtonDisabled: { opacity: 0.4 },
  dangerButtonText: { color: appColors.text, fontWeight: '900' },
  confirmBox: { gap: 4 },
  confirmInput: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.red, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16, fontWeight: '900', letterSpacing: 2, marginTop: 12 },
  confirmActions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  cancelButton: { paddingVertical: 14, paddingHorizontal: 16, marginTop: 16 },
  cancelText: { color: appColors.textMuted, fontWeight: '900' }
});
