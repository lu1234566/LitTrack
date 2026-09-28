import { forwardRef } from 'react';
import { Alert, Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps } from 'react-native';
import { appLanguage, t, translateChildren } from '@/services/i18n';

/**
 * `Text` e `TextInput` que exibem no idioma do aparelho.
 *
 * As telas importam daqui em vez de `react-native` — é a única mudança nelas.
 * Traduzir na saída, em vez de trocar cada uma das ~mil frases do app por uma
 * chave, deixa o código das telas como está e faz o que não tiver tradução
 * aparecer em português, em vez de quebrar.
 *
 * Só textos literais são traduzidos: o que vem do usuário (título, citação,
 * resenha) não está no dicionário e passa intacto.
 */
export const Text = forwardRef<RNText, TextProps>(function Text(props, ref) {
  if (appLanguage === 'pt') return <RNText ref={ref} {...props} />;
  return <RNText ref={ref} {...props}>{translateChildren(props.children)}</RNText>;
});

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(props, ref) {
  if (appLanguage === 'pt' || typeof props.placeholder !== 'string') return <RNTextInput ref={ref} {...props} />;
  return <RNTextInput ref={ref} {...props} placeholder={t(props.placeholder)} />;
});

/**
 * Os alertas do sistema (`Alert.alert`) não passam por um <Text> nosso. Um
 * ajuste único na função cobre as quatro telas que os usam.
 */
let alertasTraduzidos = false;
export function installAlertTranslation() {
  if (alertasTraduzidos || appLanguage === 'pt') return;
  alertasTraduzidos = true;
  const original = Alert.alert.bind(Alert);
  Alert.alert = (title, message, buttons, options) =>
    original(
      typeof title === 'string' ? t(title) : title,
      typeof message === 'string' ? t(message) : message,
      buttons?.map((b) => (typeof b.text === 'string' ? { ...b, text: t(b.text) } : b)),
      options
    );
}
