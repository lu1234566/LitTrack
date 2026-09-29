import { Platform } from 'react-native';

/**
 * Site aberto como app instalado ("Adicionar à Tela de Início" no iPhone, ou
 * "Instalar app" no Chrome). Nesse modo não há barra do navegador: nem botão
 * de voltar, nem janelas pop-up confiáveis no iOS.
 */
export function isInstalledWebApp(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true; // Safari do iOS
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  } catch {
    return false;
  }
}

/**
 * Domínios do site que repassam /__/auth/* para o Firebase (ver vercel.json).
 * Neles o login usa o próprio domínio como authDomain — sem isso, o Safari
 * bloqueia o login por redirecionamento (cookies de outro domínio).
 */
const HOSTS_COM_PROXY_DE_LOGIN = ['lit-track.vercel.app'];

export function webAuthDomain(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return HOSTS_COM_PROXY_DE_LOGIN.includes(window.location.hostname) ? window.location.host : null;
}
