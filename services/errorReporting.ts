/**
 * Versão web do relatório de erros: não envia nada.
 *
 * O Sentry entra só no app instalado (`errorReporting.native.ts`, que o Metro
 * escolhe sozinho no Android/iOS). No site, os erros aparecem no console do
 * navegador e a Vercel já guarda os logs.
 */
export const errorReportingEnabled = false;

export function initErrorReporting() {}

export function reportError(_error: unknown, _context?: Record<string, unknown>) {}

export const wrapRoot = (component: () => React.JSX.Element) => component;
