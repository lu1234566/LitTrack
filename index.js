// Ponto de entrada do app. Antes era o `expo-router/entry` direto; o widget
// da tela inicial precisa registrar o seu gerenciador aqui, no nível do
// arquivo de entrada, porque o Android o executa mesmo com o app fechado.
import 'expo-router/entry';
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./widget/taskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
