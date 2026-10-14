import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePreferences } from '@/contexts/PreferencesContext';
import { appColors } from '@/theme/tokens';
import { accentColor, densityValue } from '@/services/visualPreferences';

export function Card({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const { preferences } = usePreferences();
  const density = densityValue(preferences.visualDensity);
  const accent = accentColor(preferences.visualAccent);
  return <View style={[styles.card, { padding: compact ? Math.max(12, density.cardPadding - 3) : density.cardPadding + 4, borderRadius: compact ? density.cardRadius : density.cardRadius + 8, gap: compact ? Math.max(7, density.cardGap - 2) : density.cardGap + 4, borderColor: preferences.visualAccent === 'gold' ? appColors.borderSoft : accent }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appColors.surface,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }
  }
});
