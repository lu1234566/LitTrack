import { StyleSheet, Text, View, Pressable } from 'react-native';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors } from '@/theme/tokens';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Dia 15 evita que fuso horário empurre a data para o mês vizinho. */
export function monthTimestamp(year: number, month: number) {
  return new Date(year, month, 15, 12, 0, 0).getTime();
}

/**
 * Escolhe o MÊS em que a leitura aconteceu (não o dia). É esse valor que a
 * Cápsula Mensal, a Linha do Tempo e a Retrospectiva usam para agrupar — sem
 * ele, o livro cai no mês em que foi cadastrado.
 */
export function MonthYearField({
  label = 'Mês de leitura',
  hint,
  value,
  onChange
}: {
  label?: string;
  hint?: string;
  value?: number;
  onChange: (next: number | undefined) => void;
}) {
  const now = new Date();
  const selected = value ? new Date(value) : null;
  const year = selected ? selected.getFullYear() : now.getFullYear();
  const month = selected ? selected.getMonth() : -1;

  function setYear(next: number) {
    onChange(monthTimestamp(next, month >= 0 ? month : now.getMonth()));
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {value ? (
          <Pressable onPress={() => onChange(undefined)} hitSlop={8}>
            <Text style={styles.clear}>Limpar</Text>
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <View style={styles.yearRow}>
        <Pressable style={styles.yearBtn} onPress={() => setYear(year - 1)} hitSlop={8}>
          <ReadoraIcon name="back" size={18} color={appColors.gold} />
        </Pressable>
        <Text style={styles.yearText}>{year}</Text>
        <Pressable style={styles.yearBtn} onPress={() => setYear(year + 1)} hitSlop={8}>
          <ReadoraIcon name="forward" size={18} color={appColors.gold} />
        </Pressable>
      </View>

      <View style={styles.monthGrid}>
        {MONTHS.map((name, index) => {
          const active = month === index;
          return (
            <Pressable
              key={name}
              style={[styles.monthChip, active && styles.monthChipActive]}
              onPress={() => onChange(monthTimestamp(year, index))}
            >
              <Text style={[styles.monthText, active && styles.monthTextActive]}>{name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.status}>
        {value
          ? 'Registrado em ' + new Date(value).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          : 'Sem mês definido — o livro usará a data de cadastro.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8, marginTop: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: appColors.textMuted, fontSize: 15, fontWeight: '800' },
  clear: { color: appColors.gold, fontSize: 13, fontWeight: '800' },
  hint: { color: appColors.textDim, fontSize: 13, lineHeight: 18 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 2 },
  yearBtn: { width: 38, height: 38, borderRadius: 999, borderColor: appColors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  yearText: { color: appColors.text, fontSize: 20, fontWeight: '900', minWidth: 68, textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthChip: {
    minWidth: 62,
    flexGrow: 1,
    borderColor: appColors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: appColors.background
  },
  monthChipActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  monthText: { color: appColors.textMuted, fontSize: 13, fontWeight: '800' },
  monthTextActive: { color: appColors.background },
  status: { color: appColors.textDim, fontSize: 12, marginTop: 2 }
});
