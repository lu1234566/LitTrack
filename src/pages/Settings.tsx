import React, { useState, useEffect } from 'react';
import { useSettings, LayoutMode } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings as SettingsIcon, Monitor, Smartphone, MonitorSmartphone, UserCircle, Save, Loader2, Target, BookOpen, FileText, Bell, Clock as ClockIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export const Settings: React.FC = () => {
  const { layoutMode, setLayoutMode, reminderSettings, updateReminderSettings } = useSettings();
  const { user } = useAuth();
  const { userGoal, saveUserGoal } = useBooks();
  
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [booksGoal, setBooksGoal] = useState(0);
  const [pagesGoal, setPagesGoal] = useState(0);

  useEffect(() => {
    if (userGoal) {
      setBooksGoal(userGoal.booksGoal);
      setPagesGoal(userGoal.pagesGoal);
    }
  }, [userGoal]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBio(data.bio || '');
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'users', user.userId);
      await setDoc(docRef, {
        bio,
        updatedAt: Date.now()
      }, { merge: true });
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Erro ao atualizar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGoal = async () => {
    setIsSavingGoal(true);
    try {
      await saveUserGoal({
        year: new Date().getFullYear(),
        booksGoal,
        pagesGoal
      });
      alert('Metas atualizadas com sucesso!');
    } catch (error) {
      console.error("Error saving goal:", error);
      alert('Erro ao salvar metas.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight flex items-center gap-3">
          <SettingsIcon size={36} className="text-amber-500" />
          Configurações
        </h1>
        <p className="text-neutral-400 mt-2 text-lg">Personalize sua experiência no Readora.</p>
      </header>

      {/* Goals Section */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-serif font-semibold mb-6 text-amber-500 flex items-center gap-2">
          <Target size={24} />
          Metas de Leitura {new Date().getFullYear()}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <BookOpen size={16} />
              Meta de Livros
            </label>
            <input
              type="number"
              value={booksGoal || ''}
              onChange={(e) => setBooksGoal(Number(e.target.value))}
              placeholder="Ex: 30"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            />
            <p className="text-xs text-neutral-500">Quantos livros você deseja ler este ano?</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <FileText size={16} />
              Meta de Páginas
            </label>
            <input
              type="number"
              value={pagesGoal || ''}
              onChange={(e) => setPagesGoal(Number(e.target.value))}
              placeholder="Ex: 10000"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            />
            <p className="text-xs text-neutral-500">Qual o total de páginas que você planeja ler?</p>
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <button
            onClick={handleSaveGoal}
            disabled={isSavingGoal}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-neutral-950 px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {isSavingGoal ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            Salvar Metas
          </button>
        </div>
      </div>

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

      {/* Reminders Section */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif font-semibold text-amber-500 flex items-center gap-2">
            <Bell size={24} />
            Lembretes Literários
          </h2>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                checked={reminderSettings.enabled}
                onChange={(e) => updateReminderSettings({ enabled: e.target.checked })}
                className="sr-only" 
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${reminderSettings.enabled ? 'bg-amber-500' : 'bg-neutral-700'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${reminderSettings.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
            <span className="text-sm font-medium text-neutral-400">Ativado</span>
          </label>
        </div>

        <div className={`space-y-8 transition-opacity ${reminderSettings.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Frequência e Horário</h3>
              
              <div className="flex gap-2">
                {(['daily', 'weekdays', 'weekly'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => updateReminderSettings({ frequency: freq })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      reminderSettings.frequency === freq
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                    }`}
                  >
                    {freq === 'daily' ? 'Diário' : freq === 'weekdays' ? 'Dias úteis' : 'Semanal'}
                  </button>
                ))}
              </div>

              <div className="relative group">
                <ClockIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="time"
                  value={reminderSettings.time}
                  onChange={(e) => updateReminderSettings({ time: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Tipos de Lembrete</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-neutral-950/50 border border-neutral-800 rounded-2xl cursor-pointer hover:bg-neutral-950 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={reminderSettings.types.reading}
                    onChange={(e) => updateReminderSettings({ types: { ...reminderSettings.types, reading: e.target.checked } })}
                    className="w-4 h-4 rounded border-neutral-800 text-amber-500 focus:ring-amber-500/50 bg-neutral-900"
                  />
                  <div>
                    <span className="text-sm font-medium text-neutral-200">Hora de Ler</span>
                    <p className="text-[10px] text-neutral-500">Um convite suave para seu próximo capítulo.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-neutral-950/50 border border-neutral-800 rounded-2xl cursor-pointer hover:bg-neutral-950 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={reminderSettings.types.logging}
                    onChange={(e) => updateReminderSettings({ types: { ...reminderSettings.types, logging: e.target.checked } })}
                    className="w-4 h-4 rounded border-neutral-800 text-amber-500 focus:ring-amber-500/50 bg-neutral-900"
                  />
                  <div>
                    <span className="text-sm font-medium text-neutral-200">Registrar Sessão</span>
                    <p className="text-[10px] text-neutral-500">Lembrete para documentar seu progresso diário.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-neutral-950/50 border border-neutral-800 rounded-2xl cursor-pointer hover:bg-neutral-950 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={reminderSettings.types.updateProgress}
                    onChange={(e) => updateReminderSettings({ types: { ...reminderSettings.types, updateProgress: e.target.checked } })}
                    className="w-4 h-4 rounded border-neutral-800 text-amber-500 focus:ring-amber-500/50 bg-neutral-900"
                  />
                  <div>
                    <span className="text-sm font-medium text-neutral-200">Atualizar Status</span>
                    <p className="text-[10px] text-neutral-500">Para livros que você não atualiza há algum tempo.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-800/50 flex justify-between items-center">
            <p className="text-[10px] text-neutral-500 italic max-w-sm">Os lembretes do Readora são projetados para serem gentis e respeitarem seu tempo de descanso.</p>
            <button 
              onClick={() => alert('Readora: Seu próximo capítulo espera por você. ✨')}
              className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors"
            >
              Testar Lembrete
            </button>
          </div>
        </div>
      </div>

      {user && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-serif font-semibold mb-6 text-amber-500 flex items-center gap-2">
            <UserCircle size={24} />
            Perfil Literário
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Biografia de Leitor</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre seus gostos literários..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all min-h-[100px] resize-y"
                  maxLength={500}
                />
                <p className="text-xs text-neutral-500 text-right">{bio.length}/500</p>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-neutral-950 px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  Salvar Perfil
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </motion.div>
  );
};
