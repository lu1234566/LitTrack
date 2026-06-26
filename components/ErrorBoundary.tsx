import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('Readora capturou um erro de renderização:', error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.root}>
        <View style={styles.iconWrap}><ReadoraIcon name="brand" size={40} color={appColors.gold} /></View>
        <Text style={styles.title}>Algo saiu do roteiro</Text>
        <Text style={styles.text}>Encontramos um erro inesperado nesta tela. Seus dados estão salvos no dispositivo.</Text>
        <Text style={styles.detail} numberOfLines={3}>{this.state.error.message}</Text>
        <Pressable style={styles.button} onPress={this.reset}>
          <ReadoraIcon name="retrospective" size={17} color={appColors.background} />
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: appColors.background, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  iconWrap: { width: 76, height: 76, borderRadius: 22, borderColor: appColors.goldDeep, borderWidth: 1, backgroundColor: appColors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  text: { color: appColors.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 420 },
  detail: { color: appColors.textDim, fontSize: 12, textAlign: 'center', maxWidth: 420 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
  buttonText: { color: appColors.background, fontWeight: '900', fontSize: 15 }
});
