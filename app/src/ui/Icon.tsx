import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Dices,
  Download,
  HeartPulse,
  Minus,
  Plus,
  Settings,
  Swords,
  Table2,
  Trash2,
  Trophy,
  Undo2,
  Upload,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';

// Icônes Lucide : un seul dessin cohérent, importées une à une pour garder le paquet léger.
const ICONS = {
  back: ChevronLeft,
  forward: ChevronRight,
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  undo: Undo2,
  settings: Settings,
  book: BookOpen,
  billy: UserRound,
  sword: Swords,
  die: Dices,
  table: Table2,
  trash: Trash2,
  download: Download,
  upload: Upload,
  trophy: Trophy,
  heal: HeartPulse,
  cloud: Cloud,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 24, label }: { name: IconName; size?: number; label?: string }) {
  const Glyph = ICONS[name];
  return (
    <Glyph
      size={size}
      strokeWidth={2}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable={false}
    />
  );
}
