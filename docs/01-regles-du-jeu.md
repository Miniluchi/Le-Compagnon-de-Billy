# Règles du jeu — « Les aventures du Pyro-Barbare et de Billy »

> Document de référence fonctionnel pour la nouvelle application.
> Il décrit **ce que le livre impose** ; les besoins de l'application sont dans [02-besoins-application.md](02-besoins-application.md).

## 0. Sources et fiabilité

| Source | Contenu | Fiabilité |
| --- | --- | --- |
| Photos `photos livre/Les règles - 1..7.jpeg` | Règles complètes de **La Forteresse du Chaudron Noir** (FCDN), p. 8 à 14 | ✅ Référence |
| Photo `photos livre/Table des situations.jpeg` | Table des situations + **coût de fuite en chance** | ✅ Référence |
| Photo `photos livre/Exemple personnage.jpeg` | Feuille de personnage officielle, remplie à la main (Billy DÉBROUILLARD) | ✅ Référence (mise en page) |
| Décisions du porteur de projet (01/11/2026) | Points ambigus tranchés | ✅ Marqués 🔒 ci-dessous |
| `FCDN/FCDN-main/public/CONSTANTS.json` | Données FCDN **et** CDSI (*La Corne des Sables d'Ivoire*) | ⚠️ Contient des erreurs (voir §9). Données CDSI **non vérifiables** (pas de photos) |
| `FCDN/FCDN-main/battle.md` | Retranscription texte des règles de combat | ⚠️ 2 erreurs dans la table |

Légende utilisée ci-dessous : ✅ = lu dans le livre, ⚠️ = issu de l'appli existante seulement, 🔒 = ambiguïté tranchée par le porteur de projet.

**Périmètre** : la série compte 3 tomes parus, et 7 sont prévus. L'application ne gère **que FCDN (tome 1)** pour l'instant, mais doit pouvoir accueillir les autres tomes.

---

## 1. Principe général

- Livre-jeu (« livre dont vous êtes le héros ») : le lecteur incarne **Billy**, compagnon du Pyro-Barbare, et navigue entre des **chapitres numérotés** selon ses choix.
- Matériel nécessaire : un **dé à 6 faces**, un crayon et un marque-page. Sans dé, on peut ouvrir une page au hasard et lire le dé imprimé en bas de page (gauche ou droite selon le sens du feuilletage).
- Le livre demande régulièrement : de **combattre**, de faire un **jet d'ADRESSE** ou un **jet de CHANCE**, de **gagner/perdre** des PV, de la CHANCE, de la GLOIRE, de la RICHESSE, des objets, ou des points de statistiques.

---

## 2. Les statistiques ✅

### 2.1 Statistiques principales

| Code | Nom | Rôle | Contraintes |
| --- | --- | --- | --- |
| `HAB` | HABILETÉ | Maîtrise du combat. Sert à calculer la **situation** en combat. | — |
| `ADR` | ADRESSE | Agilité, discrétion. Sert aux **jets d'ADRESSE**, à l'**esquive** et à la **contre-attaque critique**. | **Maximum 5**, quoi qu'il arrive. Esquive/critique inactifs si ADR < 2. |
| `END` | ENDURANCE | Résistance physique. **PV MAX = END × 3**. | — |
| `CHA` | CHANCE | Réserve consommable, comme les PV. Sert aux **jets de CHANCE** et à certains pouvoirs. | CHANCE actuelle ≤ **CHANCE MAX** (valeur de départ, augmentable seulement par un événement du livre). |

### 2.2 Statistiques secondaires

| Code | Nom | Rôle |
| --- | --- | --- |
| `PV` | POINTS DE VIE | Actuel / max (= END × 3). À 0 → mort de Billy. |
| `ARM` | ARMURE | Réduit chaque dommage reçu d'autant de points, au moment de la réception. |
| `DEG` | DÉGÂTS | Bonus ajouté aux dommages de chaque attaque **normale** (pas au critique). |
| `CRIT` | CRITIQUE | Bonus ajouté aux dommages de la **contre-attaque critique**. |
| `GLOIRE` | POINTS DE GLOIRE | Récompense d'actions héroïques ; détermine la qualité de la fin. Spécifique FCDN. |
| `RICHESSE` | POINTS DE RICHESSE | Argent et objets de valeur ; détermine aussi la qualité de la fin. |

> ⚠️ CDSI (d'après l'appli existante) remplace GLOIRE par **RESPECT** et **RANCUNE**, qui donnent des bonus de stats (voir §8).

---

## 3. Création du Billy (FCDN) ✅

### 3.1 Statistiques de base

| HAB | END | ADR | CHA | ARM | DEG | CRIT |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | 2 | 1 | 3 | 0 | 0 | 0 |

### 3.2 Choix de 3 objets parmi 12

| Catégorie | Objet | Effets | Règle spéciale |
| --- | --- | --- | --- |
| ARME | L'ÉPÉE | +4 HAB | |
| ARME | LA LANCE | +3 HAB, +1 ADR | |
| ARME | LA MORGENSTERN | +1 HAB, +1 END, +1 DEG | |
| ARME | L'ARC | +3 HAB, +1 ADR, +4 CRIT | Nécessite les **deux mains** et **aucune autre ARME** équipée. 🔒 Si une autre ARME est choisie avec l'ARC, seuls les bonus de **l'ARC** s'appliquent ; ceux des autres armes sont ignorés. |
| ÉQUIPEMENT | LA COTTE DE MAILLES | −1 HAB, −1 ADR, +1 END, +2 ARM | |
| ÉQUIPEMENT | LA MARMITE | +2 END, +1 ARM | |
| ÉQUIPEMENT | LE PAMPHLET TOURISTIQUE | +4 CHA | |
| ÉQUIPEMENT | LE KIT DE SOIN | +1 CHA | **Double les PV récupérés naturellement** au cours de l'aventure (seulement ceux mentionnés dans le texte ; pas ceux des artefacts, objets ou magies). |
| OUTIL | LA FOURCHE | +1 HAB, +3 END | « Compte comme un objet tenu à la main. » |
| OUTIL | LA DAGUE | +1 HAB, +6 CRIT | Si Billy est équipé de **L'ARC** ou de **deux ARMES** : le +6 CRIT s'applique, **pas** le +1 HAB. |
| OUTIL | LE KIT D'ESCALADE | +1 ADR | |
| OUTIL | LE SAC DE GRAINS | +2 END, +2 CHA | |

Règle générale : « Sauf contre-indication, vous ne pouvez manier que **deux armes** en même temps. »

### 3.3 Le caractère (déduit des catégories choisies)

| Condition | Caractère | Modificateurs |
| --- | --- | --- |
| ≥ 2 ARMES | **GUERRIER** | +2 HAB, −1 CHA |
| ≥ 2 ÉQUIPEMENTS | **PRUDENT** | +2 CHA, −1 HAB |
| ≥ 2 OUTILS | **PAYSAN** | +2 END, −1 ADR |
| 1 objet de chaque catégorie | **DÉBROUILLARD** | +2 ADR, −1 END |

Avec 3 objets, une seule condition est vraie à la fois.

Le caractère dépend des objets **choisis**. Une arme choisie avec l'ARC compte donc pour GUERRIER, même si ses bonus sont ignorés (hypothèse de cohérence).

### 3.4 Calcul final

```
STAT = base + somme(objets) + caractère (+ bonus gagnés en cours d'aventure)
ADR  = min(ADR, 5)
PV_MAX = END × 3          PV de départ = PV_MAX
CHANCE_MAX = CHA          CHANCE de départ = CHANCE_MAX
```

**Exemple** — ÉPÉE + LANCE + MARMITE → 2 armes → GUERRIER :
HAB 2+4+3+2 = **11**, ADR 1+1 = **2**, END 2+2 = **4** (→ **12 PV**), CHA 3−1 = **2**, ARM **1**, DEG **1** (pouvoir GUERRIER), CRIT **0**.

### 3.5 La feuille de personnage officielle ✅

La feuille du livre (photo `Exemple personnage.jpeg`) montre ce que le joueur suit à la main. L'application doit en reprendre la structure :

| Zone | Contenu |
| --- | --- |
| CARACTÈRE | Nom du caractère + espace libre (le joueur y a noté « 183 exclu »). |
| HABILETÉ, ENDURANCE, CHANCE | Lignes **Base / Carac. / Matériel**, une case **Total**, et une piste **« +1 »** de **9 cases** à cocher pour les gains d'aventure. |
| ADRESSE | Lignes **Base / Carac. / Matériel**, **Total**, mention « Ne peut dépasser 5 ». **Pas de piste +1**. |
| STAT. SECONDAIRES | DÉGÂTS, ARMURE, CRITIQUE : une valeur simple chacun. **PV MAX** avec une piste « +1 » de **27 cases** (3 × 9). |
| MATÉRIEL | Les 3 objets choisis. |
| GLOIRE, RICHESSE | Pistes de **13 cases** à cocher. |
| SUIVI DES POINTS DE VIE, SUIVI DES POINTS DE CHANCE | Zones libres pour la valeur courante. |
| OBJETS RÉCUPÉRÉS | 10 lignes. |
| NOTES D'AVENTURE | Lignes libres. |

**Ce que la feuille nous apprend :**
- Les gains d'aventure prennent la forme de **+1** sur HAB, END, CHA ou PV MAX. L'ADRESSE, les DÉGÂTS, l'ARMURE et le CRITIQUE n'ont pas de piste, mais le livre peut quand même les modifier : l'application doit le permettre.
- La piste PV MAX est **distincte** de l'ENDURANCE : on peut gagner des PV MAX sans gagner d'END.
- 13 cases pour GLOIRE et RICHESSE : c'est probablement un maximum pratique, pas une règle écrite. On ne bloquera pas au-delà.

**Exemple réel** (ÉPÉE + COTTE DE MAILLES + DAGUE → 1 objet de chaque catégorie → DÉBROUILLARD) :

| Stat | Base | Carac. | Matériel | +1 cochés | Total noté | Total calculé |
| --- | --- | --- | --- | --- | --- | --- |
| HAB | 2 | 0 | 4 (4 −1 +1) | 0 | 6 | 6 ✅ |
| ADR | 1 | 2 | −1 | — | 2 | 2 ✅ |
| END | 2 | −1 | 1 | 1 | 3 | 3 ✅ → PV MAX 9 ✅ |
| CHA | 3 | 0 | 0 | 0 ou 1 (case effacée ?) | **5** | 3 ou 4 ❓ |
| ARM | | | | | 2 | 2 ✅ |
| CRIT | | | | | **12** | 6 ❓ |

Les écarts sur CHA et CRIT viennent sans doute de gains d'aventure non notés dans une piste. Cela confirme qu'il faut pouvoir saisir un **bonus avec son motif** sur n'importe quelle stat, et afficher la provenance de chaque total.

---

## 4. Pouvoirs de classe ✅

| Caractère | Pouvoir |
| --- | --- |
| **GUERRIER** | +1 DÉGÂTS à **toutes** ses attaques. |
| **PRUDENT** | Trois usages de la CHANCE en combat, détaillés au §4.1. |
| **PAYSAN** | Ne peut **jamais** subir plus de **3 dommages par phase d'attaque**. Le plafond s'applique **en dernier**, après DÉGÂTS adverses et ARMURE. Ne s'applique **pas** aux dommages subis entre les tours (poison, feu, acide, magie, situation spéciale…). |
| **DÉBROUILLARD** | Peut **relancer le dé de la phase d'attaque une fois par tour**. Le second résultat est définitif. Ne s'applique pas à l'esquive. |

### 4.1 Détail du Billy PRUDENT

🔒 Ces trois usages sont **réservés au Billy PRUDENT**.

1. **Fuite / esquive totale du combat** : faire un JET DE CHANCE et dépenser le **coût de fuite** indiqué dans la table (§6.2).
   - 🔒 La tentative n'est possible que si **CHANCE actuelle ≥ coût de fuite** (coût 0 en avantage lourd : toujours possible).
   - Réussite → le combat est évité (« remporté par pur hasard »).
   - Échec → combat normal, mais on ne perd que **1 point** de CHANCE.
2. **Survie miraculeuse** : si une attaque adverse doit tuer Billy, il peut faire un JET DE CHANCE. Le coût est de **1 point**, puis augmente de 1 à chaque survie réussie **dans ce combat** (1, 2, 3…).
   - Réussite → les dégâts reçus sont annulés, Billy vit un tour de plus.
   - Échec → mort.
3. **Coup chanceux** : à n'importe quel moment de la phase d'attaque, faire un JET DE CHANCE pour **1 point**.
   - Réussite → les dégâts infligés ce tour sont **doublés**. 🔒 On double le **résultat final** (après DÉGÂTS et ARMURE adverse).
   - Échec → Billy inflige **0 dommage** ce tour.

---

## 5. Jets hors combat ✅

| Jet | Réussite si | Coût |
| --- | --- | --- |
| **JET D'ADRESSE** | dé ≤ ADR | Aucun |
| **JET DE CHANCE** | dé ≤ CHANCE **actuelle (avant déduction)** | **−1 CHANCE** après chaque jet, réussi ou non. Toute utilisation de la CHANCE (jet ou pouvoir) coûte des points. |

Exemple du livre : avec 5 CHANCE, le jet se fait sur 5 ou moins, puis Billy a 4/5. Avec 7 CHANCE, la réussite est automatique (un d6 ne peut pas dépasser 6) et Billy passe à 6/7.

---

## 6. Le combat ✅

### 6.1 La situation

```
diff = HAB_total_Billy − HAB_adversaire
HAB_total_Billy = HAB + HAB des compagnons (icône bouclier « +N ») + modificateurs du chapitre
```

- `diff ≥ +8` → **DOMINATION** : victoire automatique.
- `diff ≤ −8` → **DOMINATION** adverse : défaite automatique.
- Sinon, lire la colonne `diff` (de −7 à +7) dans la table.

### 6.2 Table des situations (FCDN, recopiée de la photo)

Lecture d'une case : `dommages infligés par Billy -- dommages infligés par l'adversaire`.

| Situation | Désav. lourd | | | Désavantage | | Désav. léger | | Égalité | Av. léger | | Avantage | | Av. lourd | | |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Coût de fuite (CHANCE)** | 5 | 5 | 5 | 3 | 3 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 0 |
| **Diff. HAB** | **−7** | **−6** | **−5** | **−4** | **−3** | **−2** | **−1** | **0** | **+1** | **+2** | **+3** | **+4** | **+5** | **+6** | **+7** |
| ⚀ 1 | 0–12 | 1–8 | 1–7 | 1–6 | 2–6 | 2–6 | 3–6 | 3–5 | 3–5 | 3–5 | 3–4 | 3–4 | 4–4 | 4–3 | 4–3 |
| ⚁ 2 | 0–9 | 1–7 | 1–6 | 2–6 | 2–5 | 2–5 | 3–5 | 3–4 | 3–4 | 3–4 | 3–3 | 3–3 | 4–3 | 5–2 | 5–2 |
| ⚂ 3 | 1–8 | 1–6 | 1–5 | 2–5 | 2–4 | 2–4 | 3–4 | 3–3 | 3–3 | 3–3 | 4–3 | 4–2 | 5–2 | 5–2 | 6–2 |
| ⚃ 4 | 2–6 | 2–5 | 2–5 | 2–4 | 3–4 | 3–3 | 3–3 | 3–3 | 4–3 | 4–2 | 4–2 | 5–2 | **5–1** | 6–1 | 8–1 |
| ⚄ 5 | 2–5 | 2–5 | 3–4 | 3–3 | 3–3 | 4–3 | 4–3 | 4–3 | 5–3 | 5–2 | 5–2 | 6–2 | 6–1 | 7–1 | **9–0** |
| ⚅ 6 | 3–4 | 3–4 | 4–4 | 4–3 | 4–3 | 5–3 | 5–3 | 5–3 | 6–3 | 6–2 | 6–2 | 6–1 | 7–1 | **8–1** | 12–0 |

Les cases en gras sont fausses dans l'appli existante (§9).

### 6.3 Déroulé d'un tour

Si ADR < 2, un tour = **1 jet** de dé. Si ADR ≥ 2, un tour = **2 jets** (attaque puis esquive).

1. **Phase d'attaque** : lancer 1 dé et lire `(b, a)` dans la table.
   - DÉBROUILLARD : peut relancer une fois ; le 2ᵉ jet est définitif.
   - PRUDENT : peut tenter le « coup chanceux » (§4.1).
2. **Calcul des dommages**, dans cet ordre : dommages de la table → **+ DÉGÂTS** de l'attaquant → **− ARMURE** du défenseur → modificateurs spéciaux ou de classe (plafond PAYSAN en dernier).
3. **Phase d'esquive** (seulement si ADR ≥ 2) : relancer 1 dé.
   - dé = **1** → **CONTRE-ATTAQUE CRITIQUE** : esquive totale, et les dommages de Billy **remplacent** ceux du tour. Ils valent `b` de la ligne ⚅ 6 de la situation + CRIT, **sans** DÉGÂTS et **sans** tenir compte de l'ARMURE adverse.
   - 2 ≤ dé ≤ ADR → **esquive** : Billy ne subit rien et inflige ses dommages normaux.
   - dé > ADR → Billy subit les dommages normalement.
4. **Application** des dommages aux PV des deux camps.
   - Si l'adversaire meurt, ses dégâts de ce tour sont **quand même comptés**.
   - Si les deux meurent (**mort mutuelle**), les dégâts de l'adversaire sont **annulés** : Billy gagne.
   - Si seul Billy meurt → PRUDENT : survie miraculeuse possible (§4.1). Sinon, mort.
5. Tour suivant, jusqu'à la mort d'un des deux.

Exemples du livre :
- Billy 5 PV contre Orc 2 PV, résultat 6–1 → l'orc meurt, Billy finit à 4 PV. Résultat 3–6 → mort mutuelle, donc Billy finit à 5 PV.
- Situation −4, ADR 4, DEG 1, CRIT 7, dé d'attaque 2 (2–6). L'esquive donne 1 → critique : 4 (ligne ⚅ 6) + 7 = **11** dommages, armure ignorée. Billy ne subit rien.

### 6.4 Pseudo-code de référence

```text
resoudreTour(billy, adv, diff):
  d = jet()                                    # DÉBROUILLARD : relance unique possible
  (b, a) = TABLE[diff][d]
  versAdv   = max(0, b + billy.DEG - adv.ARM)
  versBilly = max(0, a + adv.DEG - billy.ARM)
  si billy.caractere == PAYSAN : versBilly = min(versBilly, 3)
  si coupChanceux réussi : versAdv *= 2          # PRUDENT, sur le résultat final
  si coupChanceux raté   : versAdv = 0
  si billy.ADR >= 2 :
     e = jet()
     si e == 1        : versAdv = TABLE[diff][6].b + billy.CRIT ; versBilly = 0
     sinon si e <= ADR: versBilly = 0
  adv.PV   -= versAdv
  billy.PV -= versBilly
  si adv.PV <= 0 et billy.PV <= 0 : billy.PV += versBilly   # mort mutuelle → Billy gagne
```

### 6.5 Autres éléments de combat

- **Compagnons** : ajoutent leur HABILETÉ à celle de Billy, le temps indiqué par le livre.
- **Surnombre** et autres situations : peuvent baisser l'ADRESSE (ou d'autres stats) pour un combat. Le livre indique la valeur.
- **Dommages entre les tours** (acide, poison, feu…) : s'appliquent en plus, et ne sont **pas** plafonnés par le PAYSAN.
- Les adversaires ont : PV, HAB, et éventuellement ARM et DEG.

---

## 7. Suivi pendant l'aventure

- **Chapitre courant** et historique des chapitres, pour revenir en arrière ou se souvenir du chemin suivi.
- **PV** : pertes et gains dictés par le texte. Les récupérations « naturelles » sont **doublées** avec le KIT DE SOIN. On ne dépasse pas PV MAX.
- **CHANCE** : consommée par les jets ; ne dépasse pas CHANCE MAX. Le livre peut augmenter CHANCE MAX.
- **Bonus permanents** : le livre peut donner ou retirer des points de HAB, ADR, END, CHA, DEG, ARM, CRIT ou PV MAX.
- **GLOIRE** et **RICHESSE** : compteurs libres, utiles pour la fin.
- **Objets récupérés** et **notes d'aventure** (mots-clés, indices, codes…).

---

## 8. Spécificités *La Corne des Sables d'Ivoire* (CDSI) ⚠️ non vérifiées — hors périmètre actuel

Données reprises de `CONSTANTS.json` uniquement, **sans source livre**. Conservées pour illustrer ce qui varie d'un tome à l'autre (compteurs, opinion, PV MAX donnés par des objets), afin que la configuration par livre soit prévue pour.

- Base identique à FCDN. Pas de GLOIRE, mais **RESPECT** et **RANCUNE** (et RICHESSE).
- **Objets** : LE SABRE (+3 HAB, +2 CRIT) · LA LANCE (+3 HAB, +1 ADR) · LA PIOCHE (+2 HAB, +2 PV MAX, +1 DEG) · L'ARC (+3 HAB, +1 ADR, +4 CRIT) · LA COTTE DE MAILLES (−1 HAB, −1 ADR, +1 END, +2 ARM) · LE SCEAU (+1 END, +1 ARM, +2 PV MAX) · LE GUIDE TOURISTIQUE (+3 CHA) · LA BOÎTE DE CRAYONS (+2 CHA, +1 CRIT) · LE FLÉAU À GRAINS (+1 HAB, +2 END, +2 PV MAX) · LE COUTEAU CÉRÉMONIEL (+1 HAB, +5 CRIT, +1 RICHESSE) · LE FILET DE PÊCHE (+1 END, +1 ADR) · LE SAC DE GRAINS (+2 END, +2 CHA).
- **Caractères** : GUERRIER +3 HAB, +1 DEG, −1 CHA · PRUDENT +3 CHA, −1 HAB · PAYSAN +2 END, −1 ADR, +2 PV MAX · DÉBROUILLARD +2 ADR, −1 END, +2 CRIT.
- **Opinion** (écart = RESPECT − RANCUNE) : ≥ 4 → +2 CHA · ≥ 2 → +2 END · ≤ −2 → +2 CRIT · ≤ −4 → +2 HAB.
- Table des situations : l'appli réutilise celle de FCDN, avec les mêmes erreurs.

---

## 9. Écarts constatés dans l'appli existante

| # | Élément | Appli existante | Livre |
| --- | --- | --- | --- |
| 1 | Table, diff +5, dé 4 | 5–2 | **5–1** |
| 2 | Table, diff +6, dé 6 | 8–2 | **8–1** |
| 3 | Table, diff +7, dé 5 | 8–1 | **9–0** |
| 4 | DOMINATION (±8) | Diff bornée à ±7, combat joué normalement | Victoire ou défaite automatique |
| 5 | Coût de fuite en chance | Absent | Présent dans la table |
| 6 | L'ARC + autre arme | Autorisé, toutes les stats cumulées | 🔒 Autorisé, mais seuls les bonus de l'ARC comptent |
| 7 | Pouvoirs PRUDENT | « Pas encore implémenté » | 3 usages (§4.1) |
| 8 | Relance DÉBROUILLARD | Texte seulement ; le tour se résout dès le 1ᵉʳ jet si ADR < 2 | Relance réelle |
| 9 | KIT DE SOIN | Seulement +1 CHA | Double aussi les soins naturels |
| 10 | Jet de CHANCE à 0 | Possible, CHANCE négative | Bloqué (choix par défaut : on ne peut pas dépenser une CHANCE qu'on n'a pas) |
| 11 | PV pendant le combat | Sauvegardés seulement à la fin ; perdus si on quitte | Doivent persister |
