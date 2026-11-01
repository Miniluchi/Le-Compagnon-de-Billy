# Compagnon de Billy

Application web (React + TypeScript + Vite, PWA hors ligne) pour jouer aux livres-jeux
*Les aventures du Pyro-Barbare et de Billy*. Seul le tome 1, *La Forteresse du Chaudron Noir*, est pris en charge :
le support des tomes suivants n'est pas encore vérifié.

Règles et besoins : voir [`../docs`](../docs).

## Synchronisation Firebase

La configuration Firebase (clés publiques par conception) est dans `src/store/cloud.ts`. Sans elle, l'application reste purement locale.
Le projet Firebase utilise Firestore en région `eur3` et la connexion Google. Les règles de sécurité sont dans
[`../firestore.rules`](../firestore.rules) et se collent dans la console Firestore. Le domaine `miniluchi.github.io`
doit figurer dans les domaines autorisés d'Authentication.

## Commandes

```bash
npm install
npm run dev      # serveur de développement
npm test         # tests du moteur de règles (Vitest)
npm run build    # build statique dans dist/, déployable sur n'importe quel hébergeur
```

## Organisation

- `src/books/` : configuration de chaque tome (objets, caractères, table des situations, coûts de fuite, compteurs).
  Ajouter un tome = ajouter un fichier ici et l'enregistrer dans `books/index.ts`.
- `src/engine/` : moteur de règles pur et testé (stats, jets, combat).
- `src/store/` : état persistant (localStorage) avec annulation, et synchronisation facultative via Firebase
  (`cloud.ts` : connexion Google et Firestore, `sync.ts` : fusion des sauvegardes entre appareils).
- `src/features/` : écrans (accueil, création, aventure, fiche, combat, jets, table, réglages).
- `src/ui/` : composants génériques (dés, pavé numérique, feuilles modales, toasts).
