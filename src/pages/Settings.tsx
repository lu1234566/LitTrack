import React, { useState, useEffect } from 'react';
import { useSettings, LayoutMode } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings as SettingsIcon, Monitor, Smartphone, MonitorSmartphone, Users, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Settings: React.FC = () => {
  const { layoutMode, setLayoutMode } = useSettings();
  const { user } = useAuth();
  
  const [bio, setBio] = useState('');
  const [communityPublic, setCommunityPublic] = useState(true);
  const [showBooksPublicly, setShowBooksPublicly] = useState(true);
  const [showStatsPublicly, setShowStatsPublicly] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBio(data.bio || '');
          setCommunityPublic(data.communityPublic ?? true);
          setShowBooksPublicly(data.showBooksPublicly ?? true);
          setShowStatsPublicly(data.showStatsPublicly ?? true);
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
        communityPublic,
        showBooksPublicly,
        showStatsPublicly,
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8 pb-12">
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

      {user && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-serif font-semibold mb-6 text-amber-500 flex items-center gap-2">
            <Users size={24} />
            Perfil e Comunidade
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

              <div className="space-y-4 pt-4 border-t border-neutral-800/50">
                <h3 className="text-lg font-medium text-neutral-200">Privacidade</h3>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={communityPublic}
                      onChange={(e) => setCommunityPublic(e.target.checked)}
                      className="sr-only" 
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${communityPublic ? 'bg-amber-500' : 'bg-neutral-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${communityPublic ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <div>
                    <span className="text-neutral-200 font-medium group-hover:text-amber-500 transition-colors">Perfil Público na Comunidade</span>
                    <p className="text-xs text-neutral-500">Permite que outros usuários vejam seu perfil e você apareça nos rankings.</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 cursor-pointer group ${!communityPublic ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={showBooksPublicly}
                      onChange={(e) => setShowBooksPublicly(e.target.checked)}
                      disabled={!communityPublic}
                      className="sr-only" 
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${showBooksPublicly ? 'bg-amber-500' : 'bg-neutral-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showBooksPublicly ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <div>
                    <span className="text-neutral-200 font-medium group-hover:text-amber-500 transition-colors">Mostrar Livros Lidos</span>
                    <p className="text-xs text-neutral-500">Exibe a lista dos seus livros recentes no seu perfil público.</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 cursor-pointer group ${!communityPublic ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={showStatsPublicly}
                      onChange={(e) => setShowStatsPublicly(e.target.checked)}
                      disabled={!communityPublic}
                      className="sr-only" 
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${showStatsPublicly ? 'bg-amber-500' : 'bg-neutral-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showStatsPublicly ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <div>
                    <span className="text-neutral-200 font-medium group-hover:text-amber-500 transition-colors">Mostrar Estatísticas</span>
                    <p className="text-xs text-neutral-500">Exibe suas páginas lidas, média de notas e outros dados no seu perfil.</p>
                  </div>
                </label>
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
