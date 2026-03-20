import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Check, AlertCircle, Users, BookOpen, Globe, Lock } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { Community } from '../types';

interface JoinCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const JoinCommunityModal: React.FC<JoinCommunityModalProps> = ({ isOpen, onClose, initialCode }) => {
  const { joinCommunityByCode, getCommunityByCode } = useCommunity();
  const [code, setCode] = useState(initialCode || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Community | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  React.useEffect(() => {
    if (initialCode && isOpen) {
      setCode(initialCode);
      handleValidate(initialCode);
    }
  }, [initialCode, isOpen]);

  if (!isOpen) return null;

  const handleValidate = async (codeToValidate?: string) => {
    const targetCode = codeToValidate || code;
    if (targetCode.length < 6) return;
    
    setIsValidating(true);
    setError('');
    try {
      const comm = await getCommunityByCode(targetCode);
      if (comm) {
        setPreview(comm);
      } else {
        setError('Comunidade não encontrada');
        setPreview(null);
      }
    } catch (err) {
      setError('Erro ao validar código');
    } finally {
      setIsValidating(false);
    }
  };

  const handleJoin = async () => {
    if (!code || isSubmitting) return;
    
    setIsSubmitting(true);
    setError('');
    try {
      await joinCommunityByCode(code);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar na comunidade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-neutral-100">Entrar com Código</h2>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400 ml-1">Código de Convite</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={20} />
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                  setCode(val);
                  if (val.length === 6) {
                    // Auto-validate
                  } else {
                    setPreview(null);
                  }
                }}
                onBlur={handleValidate}
                placeholder="Ex: A7K9PX"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 pl-12 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 uppercase tracking-widest font-mono text-lg"
                maxLength={6}
              />
              {isValidating && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-amber-500"></div>
                </div>
              )}
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1 ml-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>

          <AnimatePresence>
            {preview && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <img src={preview.imageUrl} alt={preview.name} className="w-14 h-14 rounded-2xl object-cover border border-neutral-800" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-neutral-100 truncate">{preview.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1"><Users size={12} /> {preview.memberCount} membros</span>
                      <span className="flex items-center gap-1">
                        {preview.visibility === 'public' ? <Globe size={12} /> : <Lock size={12} />}
                        {preview.visibility === 'public' ? 'Pública' : 'Privada'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-neutral-400 line-clamp-2 italic">"{preview.description}"</p>
                <button 
                  onClick={handleJoin}
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Entrando...' : (
                    <>
                      <Check size={20} />
                      Confirmar Entrada
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!preview && (
            <button 
              onClick={handleValidate}
              disabled={code.length < 6 || isValidating}
              className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 py-3 rounded-xl font-medium transition-all"
            >
              Validar Código
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
