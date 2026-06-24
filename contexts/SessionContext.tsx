import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { SessionUser } from '@/types/sessionUser';
import { isNativeFirebaseConfigured, listenToFirebaseUser, signInFirebaseWithGoogleIdToken, signOutFirebaseUser } from '@/services/firebaseNative';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke'
};

type SessionContextValue = {
  user: SessionUser | null;
  isGoogleLoginPrepared: boolean;
  signInWithGoogle: () => Promise<string>;
  signOut: () => Promise<void>;
};

const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const hasGoogleClientId = Boolean(googleClientId);

const SessionContext = createContext<SessionContextValue>({
  user: null,
  isGoogleLoginPrepared: false,
  signInWithGoogle: async () => 'Login Google ainda não configurado.',
  signOut: async () => {}
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const nonce = useMemo(() => Math.random().toString(36).slice(2), []);
  const redirectUri = useMemo(() => AuthSession.makeRedirectUri({ scheme: 'readora' }), []);
  const isGoogleLoginPrepared = Boolean(isNativeFirebaseConfigured && hasGoogleClientId);
  const requestConfig = useMemo(() => ({
    clientId: googleClientId || 'readora-placeholder-client-id',
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    extraParams: { nonce }
  }), [nonce, redirectUri]);
  const [request, , promptAsync] = AuthSession.useAuthRequest(requestConfig, discovery);

  useEffect(() => listenToFirebaseUser(setUser), []);

  async function signInWithGoogle() {
    if (!isNativeFirebaseConfigured) return 'Configure as variáveis EXPO_PUBLIC_FIREBASE_* para ativar Firebase.';
    if (!hasGoogleClientId) return 'Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ou client IDs Android/iOS.';
    if (!request) return 'Login Google ainda está preparando a sessão. Tente novamente em instantes.';
    const result = await promptAsync();
    if (result.type !== 'success') return 'Login cancelado ou não concluído.';
    const idToken = result.params?.id_token;
    if (!idToken) return 'O Google não retornou id_token. Verifique o Client ID e redirect URI.';
    const loggedUser = await signInFirebaseWithGoogleIdToken(idToken);
    setUser(loggedUser);
    return loggedUser?.email ? 'Login concluído: ' + loggedUser.email : 'Login concluído.';
  }

  async function signOut() {
    await signOutFirebaseUser();
    setUser(null);
  }

  const value = useMemo(() => ({ user, isGoogleLoginPrepared, signInWithGoogle, signOut }), [user, isGoogleLoginPrepared, request]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
