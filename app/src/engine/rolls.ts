export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;

export type Rng = () => DieFace;

export const rollDie: Rng = () => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return ((buf[0] % 6) + 1) as DieFace;
};

/** Jet d'ADRESSE : réussite si le dé est inférieur ou égal à l'ADRESSE. */
export function adresseSucceeds(die: DieFace, adr: number): boolean {
  return die <= adr;
}

/**
 * Jet de CHANCE : réussite si le dé est inférieur ou égal à la CHANCE actuelle,
 * avant déduction. Le coût est retiré ensuite, que le jet réussisse ou non.
 */
export function chanceSucceeds(die: DieFace, chance: number): boolean {
  return die <= chance;
}

export function canSpendChance(chance: number, cost = 1): boolean {
  return chance >= cost && chance > 0;
}
