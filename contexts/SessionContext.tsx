import React, { createContext, useContext, useMemo, useState } from 'react';
import { SessionUser } from '@/types/sessionUser';
import { isNativeFirebaseConfigured } from '@/services/firebaseNative';

type SessionContextValue = {
  user: SessionUser | null;
  isGoogleLoginPrepared: boolean;
  signInWithGoogle: () => Promise<string>;
  signOut: () => Promise<void>;
};

const hasGoogleClientId = Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);

const SessionContext = createContext<SessionContextValue>({
  user: null,
  isGoogleLoginPrepared: false,
  signInWithGoogle: async () => 'Login Google ainda nao configurado.',
  signOut: async () => {}
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const isGoogleLoginPrepared = Boolean(isNativeFirebaseConfigured && hasGoogleClientId);

  async function signInWithGoogle() {
    if (!isGoogleLoginPrepared) return 'Configure Firebase e os Google Client IDs no ambiente Expo.';
    const demoUser = { uid: 'google-ready-user', displayName: 'Leitor Readora', email: 'google-ready@readora.app', photoURL: null };
    setUser(demoUser);
    return 'Estrutura Google pronta. O proximo passo e ligar AuthSession ao token real.';
  }

  async function signOut() {
    setUser(null);
  }

  const value = useMemo(() => ({ user, isGoogleLoginPrepared, signInWithGoogle, signOut }), [user, isGoogleLoginPrepared]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
