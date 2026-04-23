import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { loginWithGoogle, user, loading, isConfigured } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-20 h-20 bg-white p-1 rounded-3xl shadow-2xl shadow-amber-500/20 animate-pulse">
          <img 
            src="/logo.png" 
            alt="Loading..." 
            className="w-full h-full object-contain rounded-2xl"
            onError={(e) => {
              e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=LT&backgroundColor=f59e0b';
            }}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Login error details:", err);
      const currentDomain = window.location.hostname;
      
      if (err.code === 'auth/unauthorized-domain') {
        setError(`Este domínio (${currentDomain}) não está autorizado no Firebase. Adicione "${currentDomain}" aos Domínios Autorizados no Console do Firebase (Autenticação > Configurações).`);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('O login foi cancelado. A janela foi fechada antes de concluir.');
      } else if (err.code === 'auth/internal-error' || err.code === 'auth/network-request-failed') {
        setError('Erro de rede ou domínio não autorizado. IMPORTANTE: Abra o aplicativo em uma nova aba (ícone ↗️ no topo) e verifique se o domínio foi adicionado ao Console do Firebase.');
      } else {
        setError(`Erro: ${err.message || err.code}. Tente abrir em uma nova aba.`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 p-10 rounded-3xl shadow-2xl max-w-md w-full text-center relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-white p-1 rounded-3xl shadow-xl shadow-amber-500/20 overflow-hidden w-24 h-24">
            <img 
              src="/logo.png" 
              alt="LitTrack Logo" 
              className="w-full h-full object-contain rounded-2xl"
              onError={(e) => {
                e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=LT&backgroundColor=f59e0b';
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <h1 className="text-4xl font-serif font-bold tracking-tight text-neutral-100 mb-2">LitTrack</h1>
        <p className="text-neutral-400 mb-8">Seu diário literário pessoal na nuvem.</p>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-left flex items-start gap-3 text-rose-500">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {!isConfigured ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-left space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertCircle size={24} />
              <h3 className="font-bold">Configuração Necessária</h3>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">
              O Firebase ainda não foi configurado. Para habilitar o login e a sincronização na nuvem, você precisa adicionar as chaves do Firebase nas configurações do projeto.
            </p>
            <div className="text-xs text-neutral-500 space-y-1">
              <p>1. Vá em <strong>Configurações</strong> (ícone de engrenagem)</p>
              <p>2. Adicione as variáveis <code>VITE_FIREBASE_*</code></p>
              <p>3. Reinicie o servidor</p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full bg-white hover:bg-neutral-100 text-neutral-900 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </button>
        )}

        <p className="mt-6 text-xs text-neutral-500">
          Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
        </p>
      </motion.div>
    </div>
  );
};
