import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AutoSyncBridge } from '@/components/AutoSyncBridge';
import { UpdateBanner } from '@/components/UpdateBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BookProvider } from '@/contexts/BookContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { QuoteProvider } from '@/contexts/QuoteContext';
import { ShelfProvider } from '@/contexts/ShelfContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { appColors, appFonts } from '@/theme/tokens';

// Match the web build: ignore the OS font-scale setting so native text sizes
// equal the design (the website ignores it too), and default all body text to
// Inter. Headings override fontFamily to Playfair Display in their own styles.
const textDefaults = { allowFontScaling: false, style: { fontFamily: appFonts.body } };
(RNText as unknown as { defaultProps?: object }).defaultProps = {
  ...((RNText as unknown as { defaultProps?: object }).defaultProps || {}),
  ...textDefaults
};
(RNTextInput as unknown as { defaultProps?: object }).defaultProps = {
  ...((RNTextInput as unknown as { defaultProps?: object }).defaultProps || {}),
  ...textDefaults
};

// Chave do armazenamento local das sessões de leitura, recurso removido do app.
// Nada mais lê esses dados; apagar libera espaço e evita que um backup antigo
// os traga de volta sem dono.
const LEGACY_SESSIONS_KEY = '@readora_native_reading_sessions';

export default function RootLayout() {
  useEffect(() => {
    AsyncStorage.removeItem(LEGACY_SESSIONS_KEY).catch(() => {});
  }, []);

  // Kick off icon-font preload, but never block rendering on it: gating the
  // whole app on font loading risks a permanent black screen if the load
  // stalls. The icon glyphs paint as soon as the font resolves.
  useFonts({
    ...Ionicons.font,
    ...MaterialCommunityIcons.font
  });

  return (
    <SafeAreaProvider>
    <ErrorBoundary>
    <PreferencesProvider>
      <SessionProvider>
        <BookProvider>
          <QuoteProvider>
            <ShelfProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: appColors.background }
                  }}
                >
                  <Stack.Screen name="index" options={{ title: 'Readora' }} />
                  <Stack.Screen name="library" options={{ title: 'Biblioteca' }} />
                  <Stack.Screen name="discover" options={{ title: 'Descobrir' }} />
                  <Stack.Screen name="account" options={{ title: 'Conta' }} />
                  <Stack.Screen name="progress" options={{ title: 'Progresso' }} />
                  <Stack.Screen name="appearance" options={{ title: 'Aparencia' }} />
                  <Stack.Screen name="product-status" options={{ title: 'Status' }} />
                  <Stack.Screen name="insights" options={{ title: 'Insights' }} />
                  <Stack.Screen name="backup" options={{ title: 'Backup' }} />
                  <Stack.Screen name="add" options={{ title: 'Adicionar livro' }} />
                  <Stack.Screen name="edit/[id]" options={{ title: 'Editar livro' }} />
                  <Stack.Screen name="book/[id]" options={{ title: 'Detalhes' }} />
                  <Stack.Screen name="goals" options={{ title: 'Metas' }} />
                  <Stack.Screen name="quotes" options={{ title: 'Citacoes' }} />
                  <Stack.Screen name="shelves" options={{ title: 'Estantes' }} />
                  <Stack.Screen name="shelf/[id]" options={{ title: 'Estante' }} />
                  <Stack.Screen name="timeline" options={{ title: 'Timeline' }} />
                  <Stack.Screen name="export" options={{ title: 'Exportar' }} />
                </Stack>
                <AutoSyncBridge />
                <UpdateBanner />
            </ShelfProvider>
          </QuoteProvider>
        </BookProvider>
      </SessionProvider>
    </PreferencesProvider>
    </ErrorBoundary>
    </SafeAreaProvider>
  );
}
