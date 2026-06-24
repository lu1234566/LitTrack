import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Screen } from '@/components/Screen';
import { appColors, appFonts } from '@/theme/tokens';

export default function ScanIsbnScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned) return;
    const value = result.data?.replace(/[^0-9Xx]/g, '');
    if (!value) return;
    setScanned(true);
    router.replace({ pathname: '/add', params: { isbn: value } } as never);
  }

  if (!permission) {
    return <Screen><View style={styles.center}><Text style={styles.title}>Preparando câmera...</Text></View></Screen>;
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.icon}>▣</Text>
          <Text style={styles.title}>Permissão de câmera</Text>
          <Text style={styles.subtitle}>O Readora precisa da câmera para escanear o código de barras ISBN do livro.</Text>
          <Pressable style={styles.button} onPress={requestPermission}><Text style={styles.buttonText}>Permitir câmera</Text></Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}><Text style={styles.secondaryText}>Voltar</Text></Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'code128'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      <View style={styles.overlay}>
        <Text style={styles.scanTitle}>Escanear ISBN</Text>
        <Text style={styles.scanText}>Aponte a câmera para o código de barras do livro.</Text>
        <View style={styles.frame} />
        <Pressable style={styles.cancel} onPress={() => router.back()}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: appColors.background },
  camera: { flex: 1 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.28)' },
  scanTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 42, fontWeight: '900' },
  scanText: { color: appColors.textMuted, textAlign: 'center', fontSize: 17, marginTop: 8 },
  frame: { width: '82%', maxWidth: 420, height: 210, borderColor: appColors.gold, borderWidth: 3, borderRadius: 26, marginTop: 32, backgroundColor: 'rgba(255,153,0,0.08)' },
  cancel: { position: 'absolute', bottom: 50, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  cancelText: { color: appColors.text, fontWeight: '900' },
  center: { minHeight: 520, justifyContent: 'center', alignItems: 'center', gap: 14 },
  icon: { color: appColors.gold, fontSize: 54 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 36, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: appColors.textMuted, textAlign: 'center', lineHeight: 24, maxWidth: 460 },
  button: { backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 26, paddingVertical: 14 },
  buttonText: { color: appColors.background, fontWeight: '900' },
  secondaryButton: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 26, paddingVertical: 14 },
  secondaryText: { color: appColors.textMuted, fontWeight: '900' }
});
