import React from 'react';
import { useSettings, LayoutMode } from '../context/SettingsContext';
import { Settings as SettingsIcon, Monitor, Smartphone, MonitorSmartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export const Settings: React.FC = () => {
  const { layoutMode, setLayoutMode } = useSettings();

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight flex items-center gap-3">
          <SettingsIcon size={36} className="text-amber-500" />
          Configurações
        </h1>
        <p className="text-neutral-400 mt-2 text-lg">Personalize sua experiência no LitTrack.</p>
      </header>

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-serif font-semibold mb-6 text-amber-500">Layout da Interface</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleLayoutChange('auto')}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
              layoutMode === 'auto'
                ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            <MonitorSmartphone size={32} />
            <span className="font-medium">Automático</span>
            <span className="text-xs text-center opacity-70">Adapta-se ao tamanho da tela</span>
          </button>

          <button
            onClick={() => handleLayoutChange('desktop')}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
              layoutMode === 'desktop'
                ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            <Monitor size={32} />
            <span className="font-medium">Desktop</span>
            <span className="text-xs text-center opacity-70">Força o layout de computador</span>
          </button>

          <button
            onClick={() => handleLayoutChange('mobile')}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
              layoutMode === 'mobile'
                ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            <Smartphone size={32} />
            <span className="font-medium">Mobile</span>
            <span className="text-xs text-center opacity-70">Força o layout de celular</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
