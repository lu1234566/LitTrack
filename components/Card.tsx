import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePreferences } from '@/contexts/PreferencesContext';
import { appColors } from '@/theme/tokens';
import { accentColor, densityValue } from '@/services/visualPreferences';

export function Card({ children }: { children: ReactNode }) {
  const { preferences } = usePreferences();
  const density = densityValue(preferences.visualDensity);
  const accent = accentColor(preferences.visualAccent);
  return <View style={[styles.card, { padding: density.cardPadding + 4, borderRadius: density.cardRadius + 8, gap: density.cardGap + 4, borderColor: preferences.visualAccent === 'gold' ? appColors.borderSoft : accent }]}>{children}</View>;
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
