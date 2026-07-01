import { ComponentProps } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { appColors } from '@/theme/tokens';

/**
 * Sistema central de ícones do Readora.
 *
 * Estilo: dark editorial — linhas finas, lineares e elegantes (variantes
 * `-outline`), pensadas para o tema preto profundo + dourado antigo.
 *
 * Use sempre nomes SEMÂNTICOS (`dashboard`, `addBook`, ...) em vez de espalhar
 * strings/emoji pelas telas. Para trocar o glifo de um conceito, altere apenas
 * o mapa abaixo e todas as telas acompanham.
 */

type Family = 'ion' | 'mci';
type IconDef = readonly [Family, string];

const ICONS = {
  // ----- Navegação principal (sidebar / bottom / drawer) -----
  dashboard: ['ion', 'home-outline'],
  library: ['ion', 'book-outline'],
  shelves: ['mci', 'bookshelf'],
  quotes: ['mci', 'format-quote-close'],
  profile: ['ion', 'person-outline'],
  literaryProfile: ['ion', 'person-circle-outline'],
  search: ['ion', 'search-outline'],
  monthlyCapsule: ['mci', 'star-four-points-outline'],
  timeline: ['mci', 'timeline-outline'],
  retrospective: ['mci', 'history'],
  recommendations: ['ion', 'sparkles-outline'],
  backup: ['ion', 'shield-checkmark-outline'],
  gallery: ['ion', 'images-outline'],
  settings: ['ion', 'settings-outline'],
  logout: ['ion', 'log-out-outline'],

  // ----- Ações sobre livros -----
  addBook: ['mci', 'book-plus-outline'],
  bookDetails: ['ion', 'reader-outline'],
  editBook: ['ion', 'create-outline'],
  scanIsbn: ['mci', 'barcode-scan'],
  goals: ['mci', 'target'],
  progress: ['ion', 'trophy-outline'],
  cloudSync: ['mci', 'cloud-sync-outline'],
  export: ['mci', 'tray-arrow-up'],
  import: ['mci', 'tray-arrow-down'],

  // ----- Backup / arquivos -----
  pdf: ['mci', 'file-pdf-box'],
  json: ['mci', 'code-json'],
  cloud: ['ion', 'cloud-outline'],
  cloudDownload: ['ion', 'cloud-download-outline'],
  download: ['ion', 'download-outline'],
  shield: ['ion', 'shield-outline'],

  // ----- Métricas / dashboard / qualidade -----
  booksRead: ['ion', 'book-outline'],
  readingTime: ['ion', 'time-outline'],
  streak: ['ion', 'flame-outline'],
  star: ['ion', 'star'],
  starOutline: ['ion', 'star-outline'],
  heart: ['ion', 'heart-outline'],
  people: ['ion', 'people-outline'],
  pace: ['ion', 'speedometer-outline'],
  originality: ['ion', 'bulb-outline'],
  flag: ['ion', 'flag-outline'],
  story: ['ion', 'book-outline'],
  chart: ['ion', 'bar-chart-outline'],
  trendingUp: ['ion', 'trending-up-outline'],
  genres: ['mci', 'drama-masks'],
  authors: ['ion', 'people-outline'],
  calendar: ['ion', 'calendar-outline'],
  bookmark: ['ion', 'bookmark-outline'],

  // ----- Preferências / configurações -----
  theme: ['ion', 'moon-outline'],
  language: ['ion', 'globe-outline'],
  font: ['ion', 'text-outline'],
  notifications: ['ion', 'notifications-outline'],
  bell: ['ion', 'notifications-outline'],
  quoteOfDay: ['mci', 'format-quote-close'],
  account: ['ion', 'person-outline'],
  layoutAuto: ['mci', 'monitor-cellphone'],
  desktop: ['mci', 'monitor'],
  mobile: ['mci', 'cellphone'],

  // ----- UI genérica -----
  menu: ['ion', 'menu-outline'],
  close: ['ion', 'close'],
  back: ['ion', 'chevron-back'],
  forward: ['ion', 'chevron-forward'],
  chevronDown: ['ion', 'chevron-down'],
  chevronUp: ['ion', 'chevron-up'],
  filter: ['ion', 'funnel-outline'],
  options: ['ion', 'options-outline'],
  share: ['ion', 'share-outline'],
  add: ['ion', 'add'],
  more: ['ion', 'ellipsis-vertical'],
  moreHorizontal: ['ion', 'ellipsis-horizontal'],
  check: ['ion', 'checkmark'],
  checkCircle: ['ion', 'checkmark-circle'],
  info: ['ion', 'information-circle-outline'],
  sparkle: ['ion', 'sparkles-outline'],
  brand: ['mci', 'book-open-page-variant-outline'],
  camera: ['ion', 'camera-outline'],
  trash: ['ion', 'trash-outline'],
  copy: ['mci', 'content-copy'],
  dot: ['mci', 'circle-small'],
  refresh: ['ion', 'refresh-outline'],
} satisfies Record<string, IconDef>;

export type ReadoraIconName = keyof typeof ICONS;

export type ReadoraIconProps = {
  name: ReadoraIconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function ReadoraIcon({ name, size = 22, color = appColors.textMuted, style }: ReadoraIconProps) {
  const [family, glyph] = ICONS[name];
  if (family === 'mci') {
    return (
      <MaterialCommunityIcons
        name={glyph as ComponentProps<typeof MaterialCommunityIcons>['name']}
        size={size}
        color={color}
        style={style}
      />
    );
  }
  return (
    <Ionicons
      name={glyph as ComponentProps<typeof Ionicons>['name']}
      size={size}
      color={color}
      style={style}
    />
  );
}

export default ReadoraIcon;
