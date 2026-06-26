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
  // PKCE and the correct id_token audience per platform.
  const [request, , promptAsync] = Google.useAuthRequest({
    webClientId,
    androidClientId,
    iosClientId,
    scopes: ['openid', 'profile', 'email']
  });

  useEffect(() => listenToFirebaseUser(setUser), []);

  async function signInWithGoogle() {
    if (!isNativeFirebaseConfigured) return 'Configure as variáveis EXPO_PUBLIC_FIREBASE_* para ativar o Firebase.';
    if (!hasGoogleClientId) return 'Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (e o Android/iOS client id).';
    if (!request) return 'Login Google ainda está preparando a sessão. Tente novamente em instantes.';
    try {
      const result = await promptAsync();
      if (result.type !== 'success') return 'Login cancelado ou não concluído.';
      const idToken = result.params?.id_token ?? result.authentication?.idToken;
      if (!idToken) return 'O Google não retornou um id_token. Verifique os Client IDs e a SHA-1.';
      const loggedUser = await signInFirebaseWithGoogleIdToken(idToken);
      setUser(loggedUser);
      return loggedUser?.email ? 'Login concluído: ' + loggedUser.email : 'Login concluído.';
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
