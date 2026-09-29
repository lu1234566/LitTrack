import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/TranslatedText';
import { BOOK_FORMATS } from '@/services/bookFormat';
import { appColors } from '@/theme/tokens';
import type { BookFormat } from '@/types/book';

/** Físico / E-book / Audiolivro — define a unidade do progresso. */
export function FormatPicker({ value, onChange }: { value: BookFormat; onChange: (format: BookFormat) => void }) {
  return (
    <View style={styles.row}>
      {BOOK_FORMATS.map((item) => (
        <Pressable key={item.value} style={[styles.chip, value === item.value && styles.chipActive]} onPress={() => onChange(item.value)}>
          <Text style={[styles.text, value === item.value && styles.textActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginTop: 6 },
  chip: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingVertical: 11, alignItems: 'center' },
  chipActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  text: { color: appColors.textMuted, fontWeight: '800', fontSize: 12 },
  textActive: { color: appColors.background }
});
