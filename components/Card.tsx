import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePreferences } from '@/contexts/PreferencesContext';
import { appColors } from '@/theme/tokens';
import { accentColor, densityValue } from '@/services/visualPreferences';

export function Card({ children }: { children: ReactNode }) {
  const { preferences } = usePreferences();
  const density = densityValue(preferences.visualDensity);
  const accent = accentColor(preferences.visualAccent);
  return <View style={[styles.card, { padding: density.cardPadding, borderRadius: density.cardRadius, gap: density.cardGap, borderColor: preferences.visualAccent === 'gold' ? appColors.border : accent }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appColors.surface,
    borderWidth: 1
  }
});
