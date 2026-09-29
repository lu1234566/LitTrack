import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { appLanguage } from '@/services/i18n';

/**
 * Destino das sugestões. Fica numa variável de ambiente do EAS (como as
 * outras EXPO_PUBLIC_*), não no código: trocar o e-mail não exige commit.
 */
export const FEEDBACK_EMAIL = process.env.EXPO_PUBLIC_FEEDBACK_EMAIL || '';

/** Dados técnicos que ajudam a reproduzir um problema — nada da biblioteca. */
export function feedbackDeviceInfo(): string {
  const c = (Platform.constants || {}) as { Manufacturer?: string; Model?: string; Release?: string };
  const aparelho = [c.Manufacturer, c.Model].filter(Boolean).join(' ') || Platform.OS;
  const sistema = Platform.OS === 'android' ? 'Android ' + (c.Release || Platform.Version) : Platform.OS + ' ' + Platform.Version;
  const versao = Constants.expoConfig?.version || '—';
  const build = Constants.expoConfig?.android?.versionCode;
  const update = Updates.updateId ? Updates.updateId.slice(0, 8) : 'loja';
  return [
    'Readora ' + versao + (build ? ' (build ' + build + ')' : ''),
    'Atualização: ' + update,
    'Aparelho: ' + aparelho,
    'Sistema: ' + sistema,
    'Idioma: ' + appLanguage
  ].join('\n');
}

export function feedbackMailUrl(): string {
  const assunto = appLanguage === 'en' ? 'Readora — feedback' : 'Readora — sugestão';
  const intro = appLanguage === 'en' ? 'Write your suggestion or problem here:' : 'Escreva aqui sua sugestão ou problema:';
  const corpo = intro + '\n\n\n\n---\n' + feedbackDeviceInfo();
  return 'mailto:' + FEEDBACK_EMAIL + '?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo);
}
