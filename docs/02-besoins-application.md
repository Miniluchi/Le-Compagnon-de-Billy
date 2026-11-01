# Besoins — BillyHelper (nouvelle application)

> Les règles de jeu sur lesquelles s'appuie ce document sont décrites dans [01-regles-du-jeu.md](01-regles-du-jeu.md).

## 1. Objectif

Proposer un **compagnon de lecture** pour les livres-jeux *Les aventures du Pyro-Barbare et de Billy* (Bob Lennon). Il remplace le dé, le crayon et la feuille de personnage, **sans jamais gêner la lecture** du livre papier.

**Utilisateur cible** : un lecteur, livre ouvert sur les genoux, téléphone dans une main, souvent le soir avec peu de lumière. Il fait des allers-retours rapides entre le livre et l'appli : « −3 PV », « jet de chance », « combat contre un orc HAB 6, 8 PV ».

**Critère de réussite** : chaque action courante doit se faire en **≤ 2 taps**, et un tour de combat en **1 tap** (2 si ADR ≥ 2).

**Périmètre livres** : MVP limité à **La Forteresse du Chaudron Noir (tome 1)**. La série compte 3 tomes parus et 7 prévus : chaque nouveau tome doit pouvoir s'ajouter par **configuration**, sans réécrire l'interface (voir §5).

---

## 2. Ce qui ne va pas dans l'existant (FCDN)

### 2.1 UX/UI
- Les boîtes de dialogue natives (`confirm()`, `prompt()`, `alert()`) sont utilisées partout. On doit confirmer **chaque** +1/−1 PV.
- Supprimer un objet ou une note, ou revenir à un ancien chapitre, se fait par **clic droit** (`contextmenu`). Sur mobile, cette action est introuvable.
- La navigation passe par une page « Action » intermédiaire, sans barre de navigation persistante ni bouton retour cohérent.
- Le combat est découpé en 3 onglets (Billy / Adversaire / Combat) et chaque stat a sa boîte « Base / Équipement / Caractère / Bonus / Ajustement / Total ». C'est trop dense, et l'on ne voit pas en même temps les PV des deux camps et le dé.
- Le style est brut (Times New Roman, bordures noires, aucune hiérarchie visuelle) et il n'y a **pas de mode sombre**.
- On ne peut pas annuler une erreur, sauf en refaisant l'opération inverse avec une confirmation.
- La page d'accueil affiche « La Forteresse du Chaudron Noir » quel que soit le livre choisi.

### 2.2 Fonctionnel
Voir le tableau des écarts, §9 de [01-regles-du-jeu.md](01-regles-du-jeu.md) : 3 cases fausses dans la table, pas de domination, pas de fuite, pouvoirs PRUDENT absents, relance DÉBROUILLARD non fonctionnelle, PV de combat non persistés, etc.

En plus :
- Un seul Billy par livre. Impossible de recommencer sans écraser la partie, ni de garder deux parties.
- Aucun combat contre plusieurs adversaires, aucun compagnon (il faut bricoler avec « Ajustement »).
- Aucun export ni sauvegarde des données.

### 2.3 Technique
- Il faut un serveur Express et une librairie locale (`Nolib`, chemin `file:../Nolib`) juste pour servir des fichiers statiques.
- Le calcul des règles est mélangé au rendu HTML, et il n'y a aucun test.
- Les données de livre sont en partie codées en dur (`if current_book === 'FCDN'`).

---

## 3. Principes UX/UI

1. **Mobile-first, une main** : les actions principales sont en bas de l'écran, avec des cibles d'au moins 48 px.
2. **Annuler plutôt que confirmer** : toute modification s'applique tout de suite, avec un toast « Annuler » et un historique d'actions. Une confirmation n'est demandée que pour les actions destructrices (supprimer une partie, abandonner un combat).
3. **Lecture de nuit** : thème sombre par défaut ou suivant le système, avec une ambiance « parchemin / encre » en clair. Contraste AA minimum.
4. **Toujours visible** : un bandeau compact en haut affiche PV x/y, CHANCE x/y et le chapitre courant.
5. **Dé virtuel ou physique** : chaque jet propose « Lancer » (dé animé) **ou** « J'ai fait… » (boutons 1 à 6) pour qui préfère son vrai dé.
6. **Expliquer le calcul** : chaque résultat de combat ou de stat peut se déplier pour montrer le détail (« 3 table + 1 DEG − 2 ARM = 2 »).
7. **Aucune connexion requise** : l'appli est installable (PWA) et fonctionne entièrement hors ligne.
8. Interface **en français** uniquement.
9. **Identité visuelle** inspirée de la feuille de personnage du livre : cadres « parchemin déchiré », titres en petites capitales à empattements, pistes de cases à cocher. L'illustration `open_book.png` de l'ancienne appli est réutilisée (écran d'accueil et choix du livre).

---

## 4. Périmètre fonctionnel

Priorités : **M** = indispensable (MVP), **S** = souhaitable, **C** = confort.

### F1 — Parties et livres
| ID | Besoin | Prio |
| --- | --- | --- |
| F1.1 | Choisir un livre parmi ceux configurés. MVP : FCDN seul ; les tomes suivants s'affichent « bientôt disponible ». | M |
| F1.2 | Gérer **plusieurs parties** (Billys) par livre : créer, reprendre, renommer, supprimer. | M |
| F1.3 | Exporter et importer une partie en JSON (sauvegarde, changement de téléphone). | S |
| F1.4 | Reprendre automatiquement la dernière partie ouverte. | M |

### F2 — Création du Billy (assistant)
| ID | Besoin | Prio |
| --- | --- | --- |
| F2.1 | Afficher les 12 objets en **cartes groupées par catégorie**, avec leurs effets et règles spéciales. | M |
| F2.2 | Sélectionner exactement 3 objets, avec un **aperçu en direct** du caractère obtenu et des stats finales. | M |
| F2.3 | Appliquer les règles d'objets : DAGUE (pas de +1 HAB avec ARC ou 2 armes) ; ARC + autre arme autorisé, mais **seuls les bonus de l'ARC** comptent (l'autre arme est affichée comme « inutilisée ») ; plafond ADR à 5. Expliquer chaque bonus ignoré. | M |
| F2.4 | Afficher le pouvoir de classe du caractère obtenu. | M |
| F2.5 | Valider : PV = PV MAX, CHANCE = CHANCE MAX, et ouvrir la fiche. | M |

### F3 — Fiche de Billy
| ID | Besoin | Prio |
| --- | --- | --- |
| F3.1 | Afficher les stats selon la **structure de la feuille officielle** : HAB, ADR, END, CHA en blocs Base / Carac. / Matériel / Total ; DEG, ARM, CRIT, PV MAX en stats secondaires. La **provenance** de chaque total est dépliable. | M |
| F3.2 | Ajouter ou retirer un **bonus permanent** sur **n'importe quelle** stat (gain du livre), avec un motif optionnel (ex. « chap. 183 »). Les bonus sur HAB, END, CHA et PV MAX s'affichent comme les pistes « +1 » du livre. | M |
| F3.3 | Afficher le matériel et le pouvoir de classe. | M |

### F4 — Tableau de bord d'aventure
| ID | Besoin | Prio |
| --- | --- | --- |
| F4.1 | PV et CHANCE en **jauges** avec boutons −/+ et saisie rapide (−3, +5…), bornés à 0 et au max. | M |
| F4.2 | Soin « naturel » : bouton dédié qui **double** automatiquement le soin si Billy a le KIT DE SOIN. | S |
| F4.3 | Compteurs propres au livre, pilotés par sa configuration. FCDN : GLOIRE et RICHESSE (pistes de 13 cases dans le livre, sans blocage au-delà). | M |
| F4.4 | **Chapitre courant** : saisie via un pavé numérique plein écran, historique cliquable pour revenir en arrière. | M |
| F4.5 | Listes **Objets récupérés** et **Notes d'aventure** : ajout, édition et suppression via des gestes ou boutons visibles (pas de clic droit). | M |
| F4.6 | **Mort de Billy** (PV = 0) : écran dédié, avec choix entre recommencer (nouveau Billy) et revenir au dernier chapitre (annulation). | S |

### F5 — Jets
| ID | Besoin | Prio |
| --- | --- | --- |
| F5.1 | Jet d'ADRESSE : réussite si dé ≤ ADR (en tenant compte d'un modificateur temporaire). | M |
| F5.2 | Jet de CHANCE : réussite si dé ≤ CHANCE actuelle, puis −1 CHANCE. Réussite automatique signalée si CHANCE ≥ 6. Jet bloqué à 0 CHANCE. | M |
| F5.3 | Dé virtuel ou saisie du dé physique (voir §3.5). | M |

### F6 — Assistant de combat (cœur de l'appli)
| ID | Besoin | Prio |
| --- | --- | --- |
| F6.1 | **Préparation** en un écran : PV, HAB, ARM, DEG de l'adversaire (et son nom, optionnel) ; compagnons (+HAB) ; modificateurs temporaires (ADR −1 pour surnombre, etc.). | M |
| F6.2 | Afficher **en permanence** la situation (libellé + diff), la ligne de la table concernée, les PV des deux camps et le coût de fuite. | M |
| F6.3 | **DOMINATION** (±8) : victoire ou défaite immédiate. | M |
| F6.4 | Tour de combat : jet d'attaque, puis jet d'esquive si ADR ≥ 2. Calcul automatique dans l'ordre du livre (table → DEG → ARM → PAYSAN), avec détail dépliable. | M |
| F6.5 | Esquive et **contre-attaque critique** (max de la ligne 6 + CRIT, ARM ignorée, pas de DEG). | M |
| F6.6 | **Mort mutuelle** : Billy gagne, dégâts adverses annulés. | M |
| F6.7 | **DÉBROUILLARD** : bouton « Relancer » après le jet d'attaque, une fois par tour, avant l'esquive. | M |
| F6.8 | **PAYSAN** : plafond de 3 appliqué et signalé. | M |
| F6.9 | **PRUDENT uniquement** : bouton « Fuir » (coût selon la table, désactivé si CHANCE < coût) ; « Coup chanceux » (−1 CHANCE ; dégâts finaux ×2 en cas de réussite, 0 en cas d'échec) ; proposition automatique de **survie miraculeuse** (coût 1, 2, 3…) quand un coup est mortel. | M |
| F6.10 | **Journal de combat** (tour par tour) et **annuler le dernier tour**. | S |
| F6.11 | **PV de Billy et CHANCE persistés à chaque tour** : quitter l'appli ou recharger ne perd rien, et le combat en cours est restauré. | M |
| F6.12 | Combat contre **plusieurs adversaires** à la suite (file d'adversaires), ex. « 3 gobelins ». | S |
| F6.13 | Dommages entre les tours (acide, poison…) : saisie manuelle, non plafonnée par PAYSAN. | C |
| F6.14 | Ajustement manuel des PV des deux camps en cours de combat. | M |

### F7 — Références
| ID | Besoin | Prio |
| --- | --- | --- |
| F7.1 | **Table des situations** consultable, avec la colonne courante surlignée. | M |
| F7.2 | Résumé des règles (stats, jets, combat, pouvoirs) en fiches courtes. | S |

### F8 — Réglages
| ID | Besoin | Prio |
| --- | --- | --- |
| F8.1 | Thème clair, sombre ou système. | M |
| F8.2 | Dé virtuel ou physique par défaut ; vibrations activées ou non ; animation du dé activée ou non. | S |

---

## 5. Exigences non fonctionnelles

| Domaine | Exigence |
| --- | --- |
| Stack | **React 19 + TypeScript + Vite**, SPA 100 % statique (aucun serveur applicatif). |
| Hébergement | N'importe quel hébergeur statique (GitHub Pages, Netlify, Vercel…). |
| Offline / PWA | Service worker (vite-plugin-pwa), manifest, installable, orientation portrait. |
| Persistance | `localStorage` (ou IndexedDB) avec un **schéma versionné** et des migrations. |
| Données livres | **Un fichier de config par livre** (stats de base, objets, caractères, table, compteurs spécifiques, règles d'opinion). Ajouter un livre ne doit demander **aucun code d'UI**. |
| Moteur de règles | Module **pur** (`src/engine/`) : calcul des stats, résolution d'un tour, jets. Aucune dépendance à React, et **testé avec Vitest**, y compris tous les exemples du livre (§6.3 des règles). |
| Hasard | Générateur aléatoire injectable dans le moteur, pour pouvoir tester de façon déterministe. |
| Accessibilité | Contraste AA, focus visible, libellés ARIA sur les dés et compteurs, respect de `prefers-reduced-motion`. |
| Performance | Premier affichage < 1 s en 4G ; bundle initial < 200 ko gzip. |
| Compatibilité | Dernières versions de Chrome/Android et Safari/iOS ; doit rester lisible sur desktop. |

### Architecture proposée

```
src/
  books/            # config JSON/TS par livre (fcdn.ts, cdsi.ts)
  engine/           # logique pure + tests (stats.ts, combat.ts, rolls.ts)
  store/            # état (Zustand ou useReducer + context), persistance, undo
  features/
    games/          # liste des parties
    creation/       # assistant de création
    sheet/          # fiche Billy
    dashboard/      # tableau de bord
    combat/         # assistant de combat
    reference/      # table + règles
  ui/               # composants génériques (Dice, Counter, Gauge, NumPad, Sheet, Toast)
```

### Modèle de données (esquisse)

```ts
type StatKey = 'hab' | 'adr' | 'end' | 'cha' | 'deg' | 'arm' | 'crit' | 'pvMax';

interface BookConfig {
  id: string;                    // 'FCDN', puis les tomes 2 à 7
  available: boolean;            // false = affiché « bientôt »
  title: string;
  baseStats: Record<StatKey, number>;
  items: { id: string; label: string; category: 'ARME' | 'EQUIPEMENT' | 'OUTIL'; effects: Partial<Record<StatKey | 'richesse', number>>; rules?: ItemRule[] }[];
  // ItemRule : règles codées dans le moteur et activées par id (ex. 'arc-exclusif', 'dague-sans-hab', 'soin-double')
  characters: Record<'GUERRIER' | 'PRUDENT' | 'PAYSAN' | 'DEBROUILLARD', { mods: Partial<Record<StatKey, number>>; power: string }>;
  situationTable: Record<number, Record<1|2|3|4|5|6, [billy: number, adv: number]>>; // -7..7
  fleeCost: Record<number, number>;                                                 // -7..7
  counters: { id: string; label: string }[];                                        // gloire, richesse, respect…
  opinion?: { thresholds: { min?: number; max?: number; mods: Partial<Record<StatKey, number>> }[] };
}

interface Game {
  id: string; bookId: string; name: string; createdAt: string; schemaVersion: number;
  items: string[];                         // ids des 3 objets
  bonuses: { stat: StatKey; value: number; reason?: string; at: string }[];  // gains d'aventure tracés
  pv: number; chance: number;
  counters: Record<string, number>;
  collected: string[]; notes: string[];
  chapters: number[];                      // [courant, ...historique]
  activeCombat?: CombatState;
  history: Action[];                       // pour l'annulation
}
```

---

## 6. Hors périmètre (pour l'instant)

- Lecture du texte des chapitres (contenu protégé) : l'appli ne contient **aucun texte narratif** du livre.
- Comptes utilisateurs et synchronisation cloud.
- Reprise des parties de l'ancienne appli : **non retenue** (confirmé).
- Tomes 2 à 7 : prévus dans l'architecture, mais pas configurés (il faudra les photos de leurs règles).
- Multilingue.

---

## 7. Critères d'acceptation clés

1. Les 2 exemples de combat et l'exemple de jet de CHANCE du livre sont reproduits à l'identique par les tests du moteur.
2. Les 90 cases de la table FCDN correspondent à la photo du livre (test de non-régression).
3. Un Billy créé avec ÉPÉE + LANCE + MARMITE affiche GUERRIER, HAB 11, ADR 2, END 4, PV 12, CHA 2, ARM 1, DEG 1.
   Un Billy ÉPÉE + COTTE DE MAILLES + DAGUE (feuille réelle) affiche DÉBROUILLARD, HAB 6, ADR 2, END 2 (3 après un bonus +1 END → PV MAX 9), CHA 3, ARM 2, CRIT 6.
   Un Billy ARC + ÉPÉE + DAGUE affiche GUERRIER, sans les bonus de l'ÉPÉE ni le +1 HAB de la DAGUE.
4. Fermer l'appli au milieu d'un combat puis la rouvrir restaure exactement l'état du combat.
5. Aucune `alert`, `confirm` ni `prompt` natif dans le code.
6. Lighthouse : PWA installable, Accessibilité ≥ 95.
