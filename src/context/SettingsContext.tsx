import React, { createContext, useContext, useState, useEffect } from 'react';
import { ReminderSettings } from '../types';

export type LayoutMode = 'auto' | 'desktop' | 'mobile';

const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: true,
  frequency: 'daily',
  time: '20:00',
  types: {
    reading: true,
    logging: true,
    updateProgress: true,
  },
};

interface SettingsContextType {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  isMobileLayout: boolean;
  reminderSettings: ReminderSettings;
  updateReminderSettings: (settings: Partial<ReminderSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem('readora_layoutMode');
    return (saved as LayoutMode) || 'auto';
  });

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    const saved = localStorage.getItem('readora_reminderSettings');
    return saved ? JSON.parse(saved) : DEFAULT_REMINDERS;
  });

  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  useEffect(() => {
    localStorage.setItem('readora_layoutMode', layoutMode);
  }, [layoutMode]);

  useEffect(() => {
    localStorage.setItem('readora_reminderSettings', JSON.stringify(reminderSettings));
  }, [reminderSettings]);

  const updateReminderSettings = (newSettings: Partial<ReminderSettings>) => {
    setReminderSettings(prev => ({
      ...prev,
      ...newSettings,
      types: newSettings.types ? { ...prev.types, ...newSettings.types } : prev.types
    }));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileLayout = React.useMemo(() => 
    layoutMode === 'mobile' || (layoutMode === 'auto' && isMobileScreen),
    [layoutMode, isMobileScreen]
  );

  const value = React.useMemo(() => ({ 
    layoutMode, 
    setLayoutMode, 
    isMobileLayout,
    reminderSettings,
    updateReminderSettings
  }), [layoutMode, isMobileLayout, reminderSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
