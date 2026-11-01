import type { Achievement, BookConfig } from '../books';

export interface AchievementProgress {
  /** Succès à cocher soi-même (sans le succès final). */
  all: Achievement[];
  count: number;
  /** Date du succès final s'il est obtenu : la date du dernier succès coché. */
  finalDate?: string;
}

/** Le succès final n'est jamais coché à la main : il s'obtient avec tous les autres. */
export function achievementProgress(book: BookConfig, unlocked: Record<string, string>): AchievementProgress {
  const all = book.achievements.flatMap(g => g.items);
  const dates = all.map(a => unlocked[a.id]).filter((d): d is string => !!d);
  const complete = all.length > 0 && dates.length === all.length;
  return {
    all,
    count: dates.length,
    finalDate: book.finalAchievement && complete ? dates.sort().at(-1) : undefined,
  };
}

/** Date du jour au format AAAA-MM-JJ, dans le fuseau de l'appareil. */
export function today(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
