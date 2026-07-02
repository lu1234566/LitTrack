import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { SessionUser } from '@/types/sessionUser';
import { isNativeFirebaseConfigured, listenToFirebaseUser, signInFirebaseWithGoogleIdToken, signOutFirebaseUser } from '@/services/firebaseNative';

WebBrowser.maybeCompleteAuthSession();

type SessionContextValue = {
  user: SessionUser | null;
  isGoogleLoginPrepared: boolean;
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
  signInWithGoogle: async () => 'Login Google ainda não configurado.',
  signOut: async () => {}
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
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
    scopes: ['openid', 'profile', 'email']
  });

  useEffect(() => listenToFirebaseUser(setUser), []);

  // No Android/iOS o Google devolve um `code`, e o expo-auth-session troca por
  // tokens em segundo plano — o id_token só aparece aqui, na resposta do hook,
  // nunca no retorno imediato do promptAsync. Este efeito é o caminho único de
  // conclusão do login nas duas plataformas (na web a resposta já vem pronta).
  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params?.id_token ?? response.authentication?.idToken;
    if (!idToken) return;
    signInFirebaseWithGoogleIdToken(idToken)
      .then((loggedUser) => setUser(loggedUser))
      .catch(() => {});
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
    () => ({ user, isGoogleLoginPrepared, signInWithGoogle, signOut }),
    [user, isGoogleLoginPrepared, request]
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
