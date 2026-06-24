import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ReaderPreferences } from '@/types/preferences';
import { defaultPreferences, loadPreferences, savePreferences } from '@/services/preferencesStorage';

type PreferencesContextValue = {
  preferences: ReaderPreferences;
  loadingPreferences: boolean;
  updatePreferences: (patch: Partial<ReaderPreferences>) => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: defaultPreferences,
  loadingPreferences: true,
  updatePreferences: async () => {}
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<ReaderPreferences>(defaultPreferences);
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  useEffect(() => {
    loadPreferences().then(setPreferences).finally(() => setLoadingPreferences(false));
  }, []);

  async function updatePreferences(patch: Partial<ReaderPreferences>) {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    await savePreferences(next);
  }

  const value = useMemo(() => ({ preferences, loadingPreferences, updatePreferences }), [preferences, loadingPreferences]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
