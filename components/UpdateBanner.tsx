import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';

/**
 * Avisa o leitor quando uma nova versão do app (atualização OTA) chega.
 *
 * O expo-updates baixa a atualização sozinho na abertura do app, mas ela só
 * passa a valer no próximo reinício — sem este aviso, a pessoa continuaria na
 * versão antiga sem saber. Quando há atualização baixada (`isUpdatePending`),
 * mostramos uma faixa discreta com o botão para aplicar na hora.
 */
export function UpdateBanner() {
  const { isUpdatePending, isDownloading } = Updates.useUpdates();
  const [restarting, setRestarting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Pequeno atraso para o aviso não competir com a abertura do app.
  useEffect(() => {
    if (!isUpdatePending) return;
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [isUpdatePending]);

  if (Platform.OS === 'web' || !Updates.isEnabled) return null;
  if (!isUpdatePending || dismissed || !visible) return null;

  async function applyUpdate() {
    setRestarting(true);
    try {
      await Updates.reloadAsync();
    } catch {
      // Se o reinício falhar, a atualização entra sozinha na próxima abertura.
      setRestarting(false);
      setDismissed(true);
    }
  }

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.banner}>
        <View style={styles.iconBox}><ReadoraIcon name="sparkle" size={17} color={appColors.gold} /></View>
        <View style={styles.textBox}>
          <Text style={styles.title}>Nova versão disponível</Text>
          <Text style={styles.subtitle}>Reinicie para usar as novidades do Readora.</Text>
        </View>
        <Pressable style={styles.action} onPress={applyUpdate} disabled={restarting || isDownloading} hitSlop={6}>
          {restarting
            ? <ActivityIndicator size="small" color={appColors.background} />
            : <Text style={styles.actionText}>Reiniciar</Text>}
        </Pressable>
        <Pressable onPress={() => setDismissed(true)} hitSlop={10} style={styles.close}>
          <ReadoraIcon name="close" size={17} color={appColors.textDim} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 12, right: 12, bottom: 96, zIndex: 200, alignItems: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 520,
    backgroundColor: appColors.surface,
    borderColor: appColors.gold,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  iconBox: { width: 32, height: 32, borderRadius: 999, backgroundColor: appColors.background, alignItems: 'center', justifyContent: 'center' },
  textBox: { flex: 1 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 15, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 12, marginTop: 1 },
  action: { backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, minWidth: 84, alignItems: 'center' },
  actionText: { color: appColors.background, fontWeight: '900', fontSize: 13 },
  close: { padding: 2 }
});
