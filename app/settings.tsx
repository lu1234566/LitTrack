import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, TextInput } from '@/components/TranslatedText';
import * as Updates from 'expo-updates';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { EnrichLibraryCard } from '@/components/EnrichLibraryCard';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useShelves } from '@/contexts/ShelfContext';
import { useSession } from '@/contexts/SessionContext';
import { Link } from 'expo-router';
import { isNativeFirebaseConfigured, pullReadoraBundle, pushReadoraBundle } from '@/services/firebaseNative';
import { cancelReadingReminders, scheduleReadingReminder } from '@/services/notificationScheduler';
import { ReadoraIcon, ReadoraIconName } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';
import type { LayoutMode, ReminderFrequency } from '@/types/preferences';
import { appLocale } from '@/services/i18n';

const layoutOptions: Array<{ value: LayoutMode; title: string; text: string; icon: ReadoraIconName }> = [
  { value: 'auto', title: 'Automático', text: 'Adapta-se ao tamanho da tela', icon: 'layoutAuto' },
  { value: 'desktop', title: 'Desktop', text: 'Força o layout de computador', icon: 'desktop' },
  { value: 'mobile', title: 'Mobile', text: 'Força o layout de celular', icon: 'mobile' }
];

const frequencies: Array<{ value: ReminderFrequency; label: string }> = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekdays', label: 'Dias úteis' },
  { value: 'weekly', label: 'Semanal' }
];

export default function SettingsScreen() {
  const { books, replaceBooks } = useBooks();
  const { quotes, setQuoteList } = useQuotes();
  const { shelves, setShelfList } = useShelves();
  const { preferences, updatePreferences } = usePreferences();
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const [readerName, setReaderName] = useState(preferences.readerName);
  const [favoriteFormat, setFavoriteFormat] = useState(preferences.favoriteFormat);
  const [reminderText, setReminderText] = useState(preferences.reminderText);
  const [reminderEnabled, setReminderEnabled] = useState(preferences.reminderEnabled);
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>(preferences.reminderFrequency);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(preferences.layoutMode);
  const [syncUserId, setSyncUserId] = useState(preferences.syncUserId);
  const [yearlyGoal, setYearlyGoal] = useState(String(preferences.yearlyGoal));
  const [dailyPageGoal, setDailyPageGoal] = useState(String(preferences.dailyPageGoal));
  const [syncMessage, setSyncMessage] = useState('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  async function save(custom?: Partial<typeof preferences>) {
    await updatePreferences({
      readerName,
      favoriteFormat,
      reminderText,
      reminderEnabled,
      reminderFrequency,
      layoutMode,
      syncUserId,
      yearlyGoal: Number(yearlyGoal) || 0,
      dailyPageGoal: Number(dailyPageGoal) || 0,
      ...custom
    });
    setSyncMessage('Preferências salvas localmente.');
  }

  async function chooseLayout(value: LayoutMode) {
    setLayoutMode(value);
    await save({ layoutMode: value });
  }

  async function chooseFrequency(value: ReminderFrequency) {
    setReminderFrequency(value);
    await save({ reminderFrequency: value });
  }

  async function toggleReminder() {
    const next = !reminderEnabled;
    setReminderEnabled(next);
    await save({ reminderEnabled: next });
    if (!next) {
      await cancelReadingReminders();
      setSyncMessage('Lembretes cancelados.');
    }
  }

  async function saveReminders() {
    await save();
    if (!reminderEnabled) {
      await cancelReadingReminders();
      setSyncMessage('Lembretes desativados e cancelados.');
      return;
    }
    const result = await scheduleReadingReminder(reminderText, reminderFrequency);
    setSyncMessage(result.message);
  }

  // Enviar/receber manual usa a conta logada. Antes pedia um "ID local de
  // sincronização" digitado à mão — ferramenta de depuração que ficou na tela
  // e, sem login, nem funcionava (as regras do Firestore exigem autenticação).
  async function pushAll() {
    if (!user) return;
    const nextPreferences = { ...preferences, readerName, favoriteFormat, reminderText, reminderEnabled, reminderFrequency, layoutMode, yearlyGoal: Number(yearlyGoal) || 0, dailyPageGoal: Number(dailyPageGoal) || 0 };
    await updatePreferences(nextPreferences);
    const result = await pushReadoraBundle(user.uid, { books, quotes, shelves, preferences: nextPreferences });
    setSyncMessage(result.ok ? result.count + ' item(ns) enviados para a nuvem.' : 'Não foi possível sincronizar agora.');
  }

  async function pullAll() {
    if (!user || !isNativeFirebaseConfigured) {
      setSyncMessage('Não foi possível sincronizar agora.');
      return;
    }
    const bundle = await pullReadoraBundle(user.uid);
    if (bundle.books?.length) await replaceBooks(bundle.books);
    if (bundle.quotes?.length) await setQuoteList(bundle.quotes);
    if (bundle.shelves?.length) await setShelfList(bundle.shelves);
    if (bundle.preferences) {
      await updatePreferences({ ...preferences, ...bundle.preferences });
      setReaderName(bundle.preferences.readerName || readerName);
      setFavoriteFormat(bundle.preferences.favoriteFormat || favoriteFormat);
      setReminderText(bundle.preferences.reminderText || reminderText);
      setLayoutMode(bundle.preferences.layoutMode || layoutMode);
      setReminderFrequency(bundle.preferences.reminderFrequency || reminderFrequency);
      setReminderEnabled(bundle.preferences.reminderEnabled ?? reminderEnabled);
    }
    const total = (bundle.books?.length || 0) + (bundle.quotes?.length || 0) + (bundle.shelves?.length || 0);
    setSyncMessage(total > 0 ? total + ' item(ns) recebidos da nuvem.' : 'Nenhum dado remoto encontrado.');
  }

  async function checkForUpdate() {
    setCheckingUpdate(true);
    setUpdateMessage('');
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setUpdateMessage('Você já está na versão mais recente publicada neste canal.');
        return;
      }
      setUpdateMessage('Baixando atualização...');
      await Updates.fetchUpdateAsync();
      setUpdateMessage('Atualização baixada. Reinicie o app para aplicar.');
      Alert.alert('Atualização pronta', 'Reinicie o app agora para aplicar a nova versão?', [
        { text: 'Depois', style: 'cancel' },
        { text: 'Reiniciar agora', onPress: () => Updates.reloadAsync() }
      ]);
    } catch (error) {
      setUpdateMessage(error instanceof Error ? 'Erro ao verificar: ' + error.message : 'Erro ao verificar atualização.');
    } finally {
      setCheckingUpdate(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}><ReadoraIcon name="settings" size={32} color={appColors.gold} /><Text style={styles.title}>Configurações</Text></View>
        <Text style={styles.subtitle}>Personalize sua experiência no Readora.</Text>
      </View>

      <EnrichLibraryCard />

      <Card>
        <View style={styles.titleRow}><ReadoraIcon name="goals" size={20} color={appColors.gold} /><Text style={styles.cardTitle}>Metas de Leitura {new Date().getFullYear()}</Text></View>
        <View style={[styles.row, mobile && styles.stack]}>
          <Field label="Meta de Livros" value={yearlyGoal} onChangeText={setYearlyGoal} placeholder="50" />
          <Field label="Meta de Páginas" value={dailyPageGoal} onChangeText={setDailyPageGoal} placeholder="20000" />
        </View>
        <Pressable style={[styles.saveButton, styles.btnRow]} onPress={() => save()}><ReadoraIcon name="check" size={16} color={appColors.background} /><Text style={styles.saveText}>Salvar Metas</Text></Pressable>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Layout da Interface</Text>
        <View style={[styles.layoutGrid, mobile && styles.stack]}>
          {layoutOptions.map((option) => <LayoutOption key={option.value} title={option.title} text={option.text} icon={option.icon} active={layoutMode === option.value} onPress={() => chooseLayout(option.value)} />)}
        </View>
      </Card>

      <Card>
        <View style={styles.inlineHeader}><View style={styles.titleRow}><ReadoraIcon name="bell" size={20} color={appColors.gold} /><Text style={styles.cardTitle}>Lembretes Literários</Text></View><Pressable style={[styles.toggle, !reminderEnabled && styles.toggleOff]} onPress={toggleReminder}><Text style={styles.toggleText}>{reminderEnabled ? 'Ativado' : 'Desativado'}</Text></Pressable></View>
        <Text style={styles.kicker}>FREQUÊNCIA E HORÁRIO</Text>
        <View style={styles.chips}>{frequencies.map((item) => <Pressable key={item.value} onPress={() => chooseFrequency(item.value)}><Text style={reminderFrequency === item.value ? styles.chipActive : styles.chip}>{item.label}</Text></Pressable>)}</View>
        <TextInput style={styles.input} placeholder="20:00" placeholderTextColor={appColors.textDim} value={reminderText} onChangeText={setReminderText} />
        <Text style={styles.body}>No Android/iOS, este botão agenda notificações reais. No web, o app apenas salva a preferência.</Text>
        <Text style={styles.kicker}>TIPOS DE LEMBRETE</Text>
        <View style={[styles.row, mobile && styles.stack]}>
          <Reminder label="Hora de Ler" text="Um convite suave para seu próximo capítulo." />
          <Reminder label="Atualizar Progresso" text="Lembrete para registrar sua leitura do dia." />
          <Reminder label="Atualizar Status" text="Para livros que você não atualiza há algum tempo." />
        </View>
        <Pressable style={[styles.saveButton, styles.btnRow]} onPress={saveReminders}><ReadoraIcon name="check" size={16} color={appColors.background} /><Text style={styles.saveText}>Salvar e Agendar</Text></Pressable>
      </Card>

      <Card>
        <View style={styles.titleRow}><ReadoraIcon name="literaryProfile" size={20} color={appColors.gold} /><Text style={styles.cardTitle}>Perfil Literário</Text></View>
        <Text style={styles.label}>Biografia de Leitor</Text>
        <TextInput style={styles.textArea} placeholder="Conte um pouco sobre seus gostos literários..." placeholderTextColor={appColors.textDim} value={favoriteFormat} onChangeText={setFavoriteFormat} multiline />
        <TextInput style={styles.input} placeholder="Nome do leitor" placeholderTextColor={appColors.textDim} value={readerName} onChangeText={setReaderName} />
        <Pressable style={[styles.saveButton, styles.btnRow]} onPress={() => save()}><ReadoraIcon name="check" size={16} color={appColors.background} /><Text style={styles.saveText}>Salvar Perfil</Text></Pressable>
      </Card>

      <Card>
        <View style={styles.titleRow}><ReadoraIcon name="cloudSync" size={20} color={appColors.gold} /><Text style={styles.cardTitle}>Sincronização</Text></View>
        <Text style={styles.value}>{user ? 'Ativa' : 'Desligada'}</Text>
        <Text style={styles.body}>
          {user
            ? 'Seus livros, citações e estantes sincronizam sozinhos com a nuvem. Use os botões só se quiser forçar agora.'
            : 'Entre com sua conta Google para guardar seus livros na nuvem e vê-los também no site.'}
        </Text>
        {user ? (
        <View style={[styles.actionRow, mobile && styles.stack]}>
          <Pressable style={[styles.secondaryButton, styles.btnRow]} onPress={pushAll}><ReadoraIcon name="export" size={15} color={appColors.gold} /><Text style={styles.secondaryText}>Enviar tudo</Text></Pressable>
          <Pressable style={[styles.secondaryButton, styles.btnRow]} onPress={pullAll}><ReadoraIcon name="import" size={15} color={appColors.gold} /><Text style={styles.secondaryText}>Receber tudo</Text></Pressable>
        </View>
        ) : (
          <Link href="/account" asChild>
            <Pressable style={StyleSheet.flatten([styles.secondaryButton, styles.btnRow])}><ReadoraIcon name="account" size={15} color={appColors.gold} /><Text style={styles.secondaryText}>Entrar com Google</Text></Pressable>
          </Link>
        )}
        {syncMessage ? <Text style={styles.message}>{syncMessage}</Text> : null}
      </Card>

      <Card>
        <View style={styles.titleRow}><ReadoraIcon name="refresh" size={20} color={appColors.gold} /><Text style={styles.cardTitle}>Versão do app</Text></View>
        {Platform.OS === 'web' || !Updates.isEnabled ? (
          <Text style={styles.body}>No site você sempre vê a versão mais recente.</Text>
        ) : (
          <>
            <Text style={styles.value}>{Updates.isEmbeddedLaunch ? 'Versão instalada pela loja' : 'Atualizado'}</Text>
            <Text style={styles.body}>
              {Updates.isEmbeddedLaunch ? 'O app se atualiza sozinho: basta abrir com internet.' : 'Atualizado em: ' + (Updates.createdAt ? Updates.createdAt.toLocaleString(appLocale) : '—')}
              {'\n'}
              {/* O código ajuda no suporte: identifica exatamente qual versão está no aparelho. */}
              Código: {Updates.updateId ? Updates.updateId.slice(0, 8) : '—'}
            </Text>
            <Pressable style={[styles.secondaryButton, styles.btnRow]} onPress={checkForUpdate} disabled={checkingUpdate}>
              <ReadoraIcon name="refresh" size={15} color={appColors.gold} />
              <Text style={styles.secondaryText}>{checkingUpdate ? 'Verificando...' : 'Verificar atualização'}</Text>
            </Pressable>
            {updateMessage ? <Text style={styles.message}>{updateMessage}</Text> : null}
          </>
        )}
      </Card>
    </Screen>
  );
}

function Field({ label, ...props }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return <View style={styles.fieldBox}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} placeholderTextColor={appColors.textDim} keyboardType="numeric" {...props} /></View>;
}

function LayoutOption({ title, text, active = false, onPress, icon }: { title: string; text: string; active?: boolean; onPress: () => void; icon: ReadoraIconName }) {
  return <Pressable style={[styles.layoutOption, active && styles.layoutOptionActive]} onPress={onPress}><ReadoraIcon name={icon} size={28} color={appColors.gold} /><Text style={styles.layoutTitle}>{title}</Text><Text style={styles.layoutText}>{text}</Text></Pressable>;
}

function Reminder({ label, text }: { label: string; text: string }) {
  return <View style={styles.reminder}><ReadoraIcon name="checkCircle" size={16} color="#3b82f6" /><View style={styles.reminderTextBox}><Text style={styles.reminderTitle}>{label}</Text><Text style={styles.reminderText}>{text}</Text></View></View>;
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 38, lineHeight: 46, fontWeight: '900' },
  titleIcon: { color: appColors.gold },
  subtitle: { color: appColors.textMuted, fontSize: 18, lineHeight: 26 },
  cardTitle: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 22, fontWeight: '900' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  row: { flexDirection: 'row', gap: 18 },
  stack: { flexDirection: 'column', alignItems: 'stretch' },
  fieldBox: { flex: 1, gap: 8 },
  label: { color: appColors.textMuted, fontSize: 13, fontWeight: '800', marginTop: 12 },
  input: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16, marginTop: 8 },
  textArea: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginTop: 8 },
  saveButton: { alignSelf: 'flex-end', backgroundColor: appColors.gold, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 26, marginTop: 18 },
  saveText: { color: appColors.background, fontWeight: '900' },
  layoutGrid: { flexDirection: 'row', gap: 14 },
  layoutOption: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, minHeight: 120, alignItems: 'center', justifyContent: 'center', padding: 16 },
  layoutOptionActive: { borderColor: appColors.gold, backgroundColor: 'rgba(255,153,0,0.12)' },
  layoutIcon: { color: appColors.gold, fontSize: 30 },
  layoutTitle: { color: appColors.text, fontWeight: '900', marginTop: 8 },
  layoutText: { color: appColors.textDim, fontSize: 12, textAlign: 'center', marginTop: 8 },
  inlineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggle: { backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  toggleOff: { backgroundColor: appColors.surfaceMuted },
  toggleText: { color: appColors.background, fontSize: 12, fontWeight: '900' },
  kicker: { color: appColors.textDim, fontSize: 12, letterSpacing: 4, fontWeight: '900', marginTop: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { color: appColors.textMuted, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, overflow: 'hidden', fontWeight: '800' },
  chipActive: { color: appColors.gold, borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, overflow: 'hidden', fontWeight: '900' },
  reminder: { flex: 1, flexDirection: 'row', gap: 10, backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 10 },
  check: { color: '#3b82f6', fontWeight: '900' },
  reminderTextBox: { flex: 1 },
  reminderTitle: { color: appColors.text, fontWeight: '900' },
  reminderText: { color: appColors.textDim, fontSize: 12, marginTop: 3 },
  value: { color: appColors.text, fontSize: 24, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  secondaryButton: { flex: 1, borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, alignItems: 'center', paddingVertical: 12 },
  secondaryText: { color: appColors.gold, fontWeight: '900', fontSize: 12 },
  message: { color: appColors.gold, lineHeight: 22, marginTop: 12 }
});
