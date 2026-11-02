import type { Game, Unlocked } from './store';

/** Ce qui est partagé entre appareils : ni les réglages ni l'historique d'annulation. */
export interface Save {
  games: Record<string, Game>;
  achievements: Record<string, Unlocked>;
  /** Parties supprimées : identifiant → date ISO de suppression. */
  deleted: Record<string, string>;
  /** Dernier changement de chaque succès (obtenu, redaté ou retiré) : « livre/succès » → date ISO. */
  achievementsAt: Record<string, string>;
}

export const isGame = (g: unknown): g is Game => {
  const x = g as Game | null;
  return !!x && typeof x.id === 'string' && typeof x.bookId === 'string' && Array.isArray(x.items);
};

/** Garde les succès datés au format AAAA-MM-JJ. */
export function validUnlocked(unlocked: unknown): Unlocked {
  if (!unlocked || typeof unlocked !== 'object') return {};
  return Object.fromEntries(Object.entries(unlocked).filter(([, d]) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)));
}

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

// shortcut: la partie modifiée en dernier gagne en entier, une fusion champ par champ si on joue à deux appareils à la fois.
export function mergeSave(local: Save, remote: unknown): Save {
  const r = obj(remote);

  const deleted = { ...local.deleted };
  for (const [id, d] of Object.entries(obj(r.deleted))) {
    if (typeof d === 'string' && !(deleted[id] >= d)) deleted[id] = d;
  }

  const games: Record<string, Game> = {};
  for (const g of [...Object.values(obj(r.games)).filter(isGame), ...Object.values(local.games)]) {
    const prev = games[g.id];
    if (!prev || g.updatedAt >= prev.updatedAt) games[g.id] = g;
  }
  for (const [id, g] of Object.entries(games)) {
    if (deleted[id] && deleted[id] >= g.updatedAt) delete games[id];
  }

  // Par succès, le changement le plus récent gagne, retrait compris. Sans date connue (anciennes données) : on cumule.
  const remoteAt = obj(r.achievementsAt);
  const at = (k: string) => (typeof remoteAt[k] === 'string' ? (remoteAt[k] as string) : '');
  const achievements = { ...local.achievements };
  for (const [bookId, unlocked] of Object.entries(obj(r.achievements))) {
    const mine = local.achievements[bookId] ?? {};
    const theirs = validUnlocked(unlocked);
    const merged = { ...theirs, ...mine };
    for (const id of Object.keys(merged)) {
      const tl = local.achievementsAt[`${bookId}/${id}`] ?? '';
      const tr = at(`${bookId}/${id}`);
      const winner = tr > tl ? theirs : tl > tr ? mine : merged;
      if (id in winner) merged[id] = winner[id];
      else delete merged[id];
    }
    achievements[bookId] = merged;
  }
  const achievementsAt = { ...local.achievementsAt };
  for (const k of Object.keys(remoteAt)) if (at(k) > (achievementsAt[k] ?? '')) achievementsAt[k] = at(k);

  return { games, achievements, deleted, achievementsAt };
}
