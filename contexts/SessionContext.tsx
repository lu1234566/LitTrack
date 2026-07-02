import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { exchangeCodeAsync } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { SessionUser } from '@/types/sessionUser';
import { isNativeFirebaseConfigured, listenToFirebaseUser, signInFirebaseWithGoogleIdToken, signOutFirebaseUser } from '@/services/firebaseNative';

WebBrowser.maybeCompleteAuthSession();

type SessionContextValue = {
  user: SessionUser | null;
  isGoogleLoginPrepared: boolean;
  /** Status ao vivo da etapa final do login (troca de código + Firebase). */
  authNotice: string;
  signInWithGoogle: () => Promise<string>;
  signOut: () => Promise<void>;
};

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const hasGoogleClientId = Boolean(webClientId || androidClientId || iosClientId);

const SessionContext = createContext<SessionContextValue>({
  user: null,
  isGoogleLoginPrepared: false,
  authNotice: '',
  signInWithGoogle: async () => 'Login Google ainda não configurado.',
  signOut: async () => {}
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authNotice, setAuthNotice] = useState('');
  const isGoogleLoginPrepared = Boolean(isNativeFirebaseConfigured && hasGoogleClientId);

  // Official Google provider: handles native redirect URIs (reverse client id),
  // PKCE and the correct id_token audience per platform. A placeholder id per
  // platform keeps the hook from throwing (and crashing the whole screen) when
  // Google login isn't configured yet — expo-auth-session requires its own
  // android/iosClientId on native even if a web id is present, so every field
  // needs the same fallback. The guarded signInWithGoogle below still refuses
  // to prompt until the real client ids are present.
  const placeholderClientId = 'unconfigured.apps.googleusercontent.com';
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: webClientId || placeholderClientId,
    androidClientId: androidClientId || placeholderClientId,
    iosClientId: iosClientId || placeholderClientId,
    scopes: ['openid', 'profile', 'email'],
    // A troca automática do provider engole erros (sem .catch) — fazemos a
    // troca manualmente no efeito abaixo, com erro visível para o usuário.
    shouldAutoExchangeCode: false
  });

  useEffect(() => listenToFirebaseUser(setUser), []);

  // No Android/iOS o Google devolve um `code` que precisa ser trocado por
  // tokens; o id_token nunca vem no retorno imediato do promptAsync. Este
  // efeito conclui o login nas duas plataformas (na web o id_token já chega
  // direto nos params) e reporta cada etapa/falha via authNotice.
  useEffect(() => {
    if (!response) return;
    if (response.type === 'error') {
      const detail = response.error?.message || response.error?.code || 'desconhecido';
      setAuthNotice('O Google retornou um erro: ' + detail);
      return;
    }
    if (response.type !== 'success') return;
    async function finishLogin() {
      try {
        let idToken: string | undefined =
          (response as { params?: Record<string, string> }).params?.id_token ||
          (response as { authentication?: { idToken?: string } }).authentication?.idToken;
        const code = (response as { params?: Record<string, string> }).params?.code;
        if (!idToken && code && request) {
          setAuthNotice('Login aprovado. Trocando código por sessão...');
          const tokens = await exchangeCodeAsync(
            {
              clientId: request.clientId,
              redirectUri: request.redirectUri,
              code,
              extraParams: { code_verifier: request.codeVerifier || '' }
            },
            Google.discovery
          );
          idToken = tokens.idToken || undefined;
        }
        if (!idToken) {
          setAuthNotice('O Google não retornou um id_token. Verifique os Client IDs e a SHA-1.');
          return;
        }
        setAuthNotice('Autenticando no Firebase...');
        const loggedUser = await signInFirebaseWithGoogleIdToken(idToken);
        setUser(loggedUser);
        setAuthNotice(loggedUser?.email ? 'Login concluído: ' + loggedUser.email : 'Login concluído.');
      } catch (error) {
        setAuthNotice(error instanceof Error ? 'Falha ao concluir o login: ' + error.message : 'Falha ao concluir o login.');
      }
    }
    finishLogin();
  }, [response]);

  async function signInWithGoogle() {
    if (!isNativeFirebaseConfigured) return 'Configure as variáveis EXPO_PUBLIC_FIREBASE_* para ativar o Firebase.';
    if (!hasGoogleClientId) return 'Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (e o Android/iOS client id).';
    if (!request) return 'Login Google ainda está preparando a sessão. Tente novamente em instantes.';
    try {
      const result = await promptAsync();
      if (result.type !== 'success') return 'Login cancelado ou não concluído.';
      return 'Login aprovado no Google. Concluindo a sessão...';
    } catch (error) {
      return error instanceof Error ? 'Falha no login Google: ' + error.message : 'Falha no login Google.';
    }
  }

  async function signOut() {
    await signOutFirebaseUser();
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, isGoogleLoginPrepared, authNotice, signInWithGoogle, signOut }),
    [user, isGoogleLoginPrepared, authNotice, request]
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
