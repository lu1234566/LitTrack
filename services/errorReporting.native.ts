import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';

/**
 * Relatório de erros (Sentry) no app instalado.
 *
 * Sem o DSN (variável EXPO_PUBLIC_SENTRY_DSN), tudo aqui vira no-op: o app
 * funciona igual e só deixa de enviar. Em desenvolvimento também não envia,
 * para o painel mostrar só o que acontece no aparelho dos leitores.
 *
 * Privacidade: nada de e-mail, nome ou IP (`sendDefaultPii: false`), sem
 * gravação de tela e sem rastreamento de desempenho — só o erro, a tela onde
 * ele aconteceu e o modelo do aparelho.
 */
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const errorReportingEnabled = Boolean(DSN) && !__DEV__;

export function initErrorReporting() {
  if (!errorReportingEnabled) return;
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    environment: Updates.channel || 'production'
  });
  // Qual update OTA estava rodando: é o que liga o erro a um commit.
  if (Updates.updateId) Sentry.setTag('update_id', Updates.updateId.slice(0, 8));
  Sentry.setTag('runtime', String(Updates.runtimeVersion || ''));
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!errorReportingEnabled) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

// O layout raiz não recebe props; o tipo fica simples de propósito.
export const wrapRoot = (component: () => React.JSX.Element) =>
  (errorReportingEnabled ? Sentry.wrap(component) : component);
