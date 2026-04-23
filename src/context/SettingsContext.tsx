import React, { createContext, useContext, useState, useEffect } from 'react';

export type LayoutMode = 'auto' | 'desktop' | 'mobile';

interface SettingsContextType {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  isMobileLayout: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem('readora_layoutMode');
    return (saved as LayoutMode) || 'auto';
  });

  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  useEffect(() => {
    localStorage.setItem('readora_layoutMode', layoutMode);
  }, [layoutMode]);

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
    isMobileLayout 
  }), [layoutMode, isMobileLayout]);

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
