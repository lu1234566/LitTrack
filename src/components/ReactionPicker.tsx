import React from 'react';
import { motion } from 'framer-motion';

export const REACTION_TYPES = [
  { type: 'biblio', emoji: '📚', label: 'Lido' },
  { type: 'star', emoji: '⭐', label: 'Favorito' },
  { type: 'fire', emoji: '🔥', label: 'Impactante' },
  { type: 'mindblown', emoji: '🤯', label: 'Uau' },
  { type: 'heartbreak', emoji: '💔', label: 'Triste' },
  { type: 'eyes', emoji: '👀', label: 'Curioso' },
];

interface ReactionPickerProps {
  onSelect: (type: string) => void;
  onClose: () => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-full left-0 mb-2 p-1 bg-neutral-900 border border-neutral-800 rounded-full shadow-2xl z-50 flex items-center gap-1"
    >
      {REACTION_TYPES.map((reaction) => (
        <button
          key={reaction.type}
          onClick={() => {
            onSelect(reaction.type);
            onClose();
          }}
          className="group relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-800 transition-all active:scale-90"
          title={reaction.label}
        >
          <span className="text-xl">{reaction.emoji}</span>
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-950 text-neutral-100 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-neutral-800">
            {reaction.label}
          </span>
        </button>
      ))}
    </motion.div>
  );
};
