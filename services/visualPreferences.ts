import { VisualAccent } from '@/types/preferences';
import { appColors } from '@/theme/tokens';

export function accentColor(accent?: VisualAccent) {
  if (accent === 'emerald') return appColors.emerald;
  if (accent === 'violet') return '#a78bfa';
  if (accent === 'rose') return '#fb7185';
  return appColors.gold;
}

export function densityValue(density?: string) {
  return density === 'compact' ? {
    screenPadding: 14,
    screenGap: 10,
    cardPadding: 14,
    cardRadius: 18,
    cardGap: 8,
    bottomPadding: 116
  } : {
    screenPadding: 20,
    screenGap: 16,
    cardPadding: 18,
    cardRadius: 22,
    cardGap: 10,
    bottomPadding: 132
  };
}

export function scaledFont(size: number, textScale?: string) {
  return textScale === 'large' ? Math.round(size * 1.12) : size;
}
