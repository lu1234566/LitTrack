import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { appColors } from '@/theme/tokens';

export default function GoalsScreen() {
  const { stats } = useBooks();
  const { preferences, updatePreferences } = usePreferences();
  const [yearlyGoal, setYearlyGoal] = useState(String(preferences.yearlyGoal));
  const [dailyGoal, setDailyGoal] = useState(String(preferences.dailyPageGoal));
  const progress = preferences.yearlyGoal > 0 ? Math.min(100, Math.round((stats.finishedBooks / preferences.yearlyGoal) * 100)) : 0;

  async function saveGoals() {
    await updatePreferences({ yearlyGoal: Number(yearlyGoal) || 0, dailyPageGoal: Number(dailyGoal) || 0 });
  }

  return (
    <Screen>
      <Text style={styles.title}>Metas</Text>
      <Text style={styles.subtitle}>Acompanhe sua meta anual e seu ritmo diario de leitura.</Text>
      <Card>
        <Text style={styles.kicker}>Meta anual</Text>
        <Text style={styles.big}>{stats.finishedBooks}/{preferences.yearlyGoal}</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: percent(progress) }]} /></View>
        <Text style={styles.body}>{progress}% concluido. Faltam {Math.max(0, preferences.yearlyGoal - stats.finishedBooks)} livro(s).</Text>
      </Card>
      <Card>
        <Text style={styles.kicker}>Paginas</Text>
        <Text style={styles.big}>{stats.pagesRead}</Text>
        <Text style={styles.body}>Meta diaria atual: {preferences.dailyPageGoal} paginas.</Text>
      </Card>
      <TextInput style={styles.input} placeholder="Meta anual de livros" placeholderTextColor={appColors.textDim} value={yearlyGoal} onChangeText={setYearlyGoal} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Meta diaria de paginas" placeholderTextColor={appColors.textDim} value={dailyGoal} onChangeText={setDailyGoal} keyboardType="numeric" />
      <Pressable style={styles.button} onPress={saveGoals}><Text style={styles.buttonText}>Salvar metas</Text></Pressable>
    </Screen>
  );
}

function percent(value: number) {
  return (value + '%') as `${number}%`;
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  big: { color: appColors.text, fontSize: 36, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: appColors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: appColors.gold },
  input: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16 },
  button: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: appColors.background, fontWeight: '900' }
});
