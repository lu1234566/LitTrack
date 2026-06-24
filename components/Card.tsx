import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { appColors } from '@/theme/tokens';

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 10
  }
});
