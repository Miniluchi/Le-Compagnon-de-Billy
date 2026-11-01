import type { Achievement, AchievementGroup } from './types';

const a = (id: string, title: string, description: string): Achievement => ({ id, title, description });

export const FCDN_ACHIEVEMENTS: AchievementGroup[] = [
  {
    title: 'Fins de Billy',
    items: [
      a('buliaaa', 'Buliaaa !!!', 'Terminez le jeu avec un Billy GUERRIER'),
      a('travail-termine', 'Travail terminé !', 'Terminez le jeu avec un Billy PAYSAN'),
      a('rien-de-personnel', 'Pff… Rien de personnel !', 'Terminez le jeu avec un Billy DÉBROUILLARD'),
      a('toujours-vivant', 'Toujours vivant ! Ha !', 'Terminez le jeu avec un Billy PRUDENT'),
      a('pour-l-honneur', "Pour l'honneur", 'Terminez le jeu avec la fin alternative GUERRIER'),
      a('un-sabot-pour-deux', 'Un sabot pour deux', 'Terminez le jeu avec la fin alternative PAYSAN'),
      a('arsene-billy', 'Arsène Billy', 'Terminez le jeu avec la fin alternative DÉBROUILLARD'),
      a('dites-le-avec-des-fleurs', 'Dites-le avec des fleurs', 'Terminez le jeu avec la fin alternative PRUDENT'),
    ],
  },
  {
    title: 'Autres fins',
    items: [
      a('roi-liche', "Le monde a besoin d'un Roi-liche", 'Terminez le jeu avec la fin BILLYLUS'),
      a('tu-quoque-billy', 'Tu quoque Billy ?', 'Terminez le jeu avec la fin secrète PRUDENT'),
      a('escalated-quickly', 'Well. That escalated quickly', 'Rencontrez une fin hasardeuse en tombant de votre monture'),
      a('metaaal', 'METAAAL !!!', 'Rencontrez une fin stylée par les flammes du phénix'),
      a('l-innocent', "L'innocent", 'Laissez le rituel se conclure ou ratez son interruption'),
      a('memoire-honoree', 'Mémoire honorée', 'Vous avez atteint la fin RICHESSE MAX'),
      a('soyez-temoins', 'Soyez témoins !!', 'Vous avez atteint la fin GLOIRE MAX'),
    ],
  },
  {
    title: "Pendant l'aventure",
    items: [
      a('enfant-de-dragon', 'Billy Enfant-de-Dragon', 'Soumettez le dragon à la loyale'),
      a('octogone', 'Octogone', "Battez l'adversaire final de l'arène et récupérez la CEINTURE DE CHAMPION"),
      a('ultra-instinct', 'Billy Ultra Instinct', 'Vous avez reçu une aide inespérée'),
      a('calamity-billy', 'Calamity Billy', 'Affrontez les agents de la maréchaussée dans leur QG en combat singulier'),
      a('reportage-exclusif', 'Reportage exclusif', "Trouvez 4 INFOS ou plus durant l'Acte 1"),
      a('filtre-a-journaliste', 'Filtre à journaliste', "Vous avez vaincu le général MASSACRE et TERMINÉ l'Acte 1"),
      a('au-fil-de-l-epee', "Au fil de l'épée", "Vous avez vaincu MORTELLE avec l'aide de vos amis"),
      a('safeword', "C'était quoi le safeword ?", "Vous avez vaincu FUNESTE avec l'aide de vos amis"),
      a('pudding-a-l-arsenic', "Le pudding à l'arsenic", 'Vous avez vaincu FUNESTE politiquement'),
      a('le-sol-amortira', 'Le sol amortira sa chute', "Vous avez aidé une alliée à s'échapper"),
      a('t-as-la-cle', "Sors ! Sors ! T'as la clé !", "Vous avez aidé une alliée à s'échapper"),
      a('appele-le-premier', "J'ai eu de la chance d'être appelé le premier", 'Vous vous êtes débarrassé des occupants de la taverne'),
      a('emeu-porcelaine', 'Un émeu dans un magasin de porcelaine', "Lâchez Mimine dans le laboratoire de l'Acte IV"),
      a(
        'nourris-moi-seymour',
        'Nourris-moi, Seymour !',
        "Vous avez fini dans le ventre d'une plante carnivore, ce sont des choses qui arrivent…",
      ),
      a('cercle-vicieux', 'Cercle vicieux', "Vous avez péri en tentant de sauver le barbare d'une situation impossible"),
      a('billy-stardust', 'Billy Stardust', 'Vous avez choisi le Plaisancier'),
      a('polir-la-lance', 'Polir la lance ?', 'Vous avez choisi la Femme-Lézard'),
      a('cheval-de-trois', 'Le cheval de trois', 'Vous avez vaincu les courtisanes'),
      a('parce-qu-elles-le-valent-bien', "Parce qu'elles le valent bien", 'Vous avez administré des soins complets'),
      a('culture-pub', 'Culture Pub', 'Vous avez trouvé un produit célèbre'),
      a('tout-ca-pour-ca', 'Tout ça pour ça', 'Vous avez ouvert le trésor du sorcier'),
      a('laissez-la-bouteille', 'Laissez la bouteille', "Vous avez frappé quelqu'un dans la bouche"),
      a('cul-sec', 'Cul sec', "Vous avez vaincu quelqu'un qui avait plus de bouteille que vous"),
      a('biere-qui-roule', 'Bière qui roule…', 'Vous avez déclenché une bagarre générale'),
      a('la-vie-est-belle', 'La vie est belle', 'Vous avez protégé les enfants des horreurs de la guerre'),
      a('fbi-open-up', 'FBI ! OPEN UP !', 'Vous avez fait une entrée fracassante'),
      a('big-brain-energy', 'Big Brain Energy', "Vous avez résolu l'énigme du Facteur"),
      a('chut', 'Chut !', 'Vous avez fait ami-ami avec le Bibliothécaire'),
      a('slip-tout-neuf', 'Un slip tout neuf', 'Vous avez fait récurer le vêtement du barbare'),
      a('par-toutatis', 'Par Toutatis', 'Vous avez laissé le barbare improviser'),
      a('pile-de-secrets', 'Une misérable petite pile de secrets', "Vous avez poliment décliné l'offre d'une créature"),
      a('omelette', "Pas d'omelette sans casser du fion", 'Vous avez provoqué votre adversaire'),
      a('assurance-vie', 'Assurance vie', 'Apprenez-en plus sur la cathédrale'),
      a('secret-d-histoire', "Secret d'histoire", 'Apprenez-en plus sur le quartier historique'),
      a('restos-du-coeur', 'Restos du cœur', 'Vous avez aidé les nécessiteux'),
      a('joli-coup', 'Joli COUP', 'Vous avez trouvé la carte du mercenaire, possiblement sans tricher'),
    ],
  },
];

export const FCDN_FINAL_ACHIEVEMENT = a(
  'la-max',
  'LA MAX !!',
  'Vous avez débloqué tous les autres succès ! Vous êtes le véritable Pyro-Billy !',
);
