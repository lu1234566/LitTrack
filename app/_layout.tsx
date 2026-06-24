import { Stack } from 'expo-router';
import { BookProvider } from '@/contexts/BookContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { appColors } from '@/theme/tokens';

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <BookProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: appColors.background },
            headerTintColor: appColors.gold,
            headerTitleStyle: { fontWeight: '800' },
            contentStyle: { backgroundColor: appColors.background }
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Readora' }} />
          <Stack.Screen name="library" options={{ title: 'Biblioteca' }} />
          <Stack.Screen name="add" options={{ title: 'Adicionar livro' }} />
          <Stack.Screen name="book/[id]" options={{ title: 'Detalhes' }} />
          <Stack.Screen name="goals" options={{ title: 'Metas' }} />
          <Stack.Screen name="export" options={{ title: 'Exportar' }} />
        </Stack>
      </BookProvider>
    </PreferencesProvider>
  );
}
