import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Globe, Lock, Info } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { CommunityVisibility } from '../types';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({ isOpen, onClose }) => {
  const { createCommunity } = useCommunity();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<CommunityVisibility>('public');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    setError('');
    try {
      await createCommunity(name, description, visibility, imageUrl);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar comunidade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-neutral-100">Criar Comunidade</h2>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400 ml-1">Nome da Comunidade</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Clube do Mistério"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400 ml-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre o que é esta comunidade?"
              className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400 ml-1">Visibilidade</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  visibility === 'public' 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                    : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                <Globe size={24} />
                <div className="text-center">
                  <p className="text-sm font-bold">Pública</p>
                  <p className="text-[10px] opacity-70">Qualquer um pode ver e entrar</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  visibility === 'private' 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                    : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                <Lock size={24} />
                <div className="text-center">
                  <p className="text-sm font-bold">Privada</p>
                  <p className="text-[10px] opacity-70">Apenas com código de convite</p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400 ml-1">URL da Imagem (Opcional)</label>
            <div className="flex gap-4">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50"
              />
              <div className="w-14 h-14 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-600 overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={24} />
                )}
              </div>
            </div>
          </div>

          {visibility === 'private' && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-3">
              <Info size={20} className="text-amber-500 shrink-0" />
              <p className="text-xs text-neutral-400">
                Um código de convite exclusivo de 6 caracteres será gerado automaticamente para esta comunidade.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              {isSubmitting ? 'Criando...' : 'Criar Comunidade'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
