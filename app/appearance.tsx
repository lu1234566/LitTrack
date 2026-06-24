import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { usePreferences } from '@/contexts/PreferencesContext';
import { TextScale, VisualAccent, VisualDensity } from '@/types/preferences';
import { accentColor } from '@/services/visualPreferences';
import { appColors } from '@/theme/tokens';

const accents: Array<{ label: string; value: VisualAccent }> = [
  { label: 'Dourado', value: 'gold' },
  { label: 'Esmeralda', value: 'emerald' },
  { label: 'Violeta', value: 'violet' },
  { label: 'Rose', value: 'rose' }
];

const densities: Array<{ label: string; value: VisualDensity }> = [
  { label: 'Confortavel', value: 'comfortable' },
  { label: 'Compacto', value: 'compact' }
];

const textScales: Array<{ label: string; value: TextScale }> = [
  { label: 'Normal', value: 'normal' },
  { label: 'Grande', value: 'large' }
];

export default function AppearanceScreen() {
  const { preferences, updatePreferences } = usePreferences();
  const accent = accentColor(preferences.visualAccent);

  return (
    <Screen>
      <Text style={styles.title}>Aparencia</Text>
      <Text style={styles.subtitle}>Ajustes visuais locais para preparar a nova identidade do Readora antes do Firebase.</Text>

      <Card>
        <Text style={styles.kicker}>Cor de destaque</Text>
        <View style={styles.row}>
          {accents.map((item) => (
            <Pressable key={item.value} style={[styles.chip, preferences.visualAccent === item.value && { backgroundColor: accentColor(item.value), borderColor: accentColor(item.value) }]} onPress={() => updatePreferences({ visualAccent: item.value })}>
              <Text style={[styles.chipText, preferences.visualAccent === item.value && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.kicker}>Densidade</Text>
        <View style={styles.row}>
          {densities.map((item) => (
            <Pressable key={item.value} style={[styles.chip, preferences.visualDensity === item.value && { backgroundColor: accent, borderColor: accent }]} onPress={() => updatePreferences({ visualDensity: item.value })}>
              <Text style={[styles.chipText, preferences.visualDensity === item.value && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.kicker}>Tamanho do texto</Text>
        <View style={styles.row}>
          {textScales.map((item) => (
            <Pressable key={item.value} style={[styles.chip, preferences.textScale === item.value && { backgroundColor: accent, borderColor: accent }]} onPress={() => updatePreferences({ textScale: item.value })}>
              <Text style={[styles.chipText, preferences.textScale === item.value && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.kicker}>Preview</Text>
        <Text style={[styles.previewTitle, { color: accent }]}>Readora</Text>
        <Text style={styles.previewText}>Cards, barras inferiores e espaçamento já respondem aos ajustes escolhidos.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  chipText: { color: appColors.textMuted, fontWeight: '900' },
  chipTextActive: { color: appColors.background },
  previewTitle: { fontSize: 32, fontWeight: '900' },
  previewText: { color: appColors.textMuted, lineHeight: 22 }
});
