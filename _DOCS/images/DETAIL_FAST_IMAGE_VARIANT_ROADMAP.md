# DetailFast image variant roadmap

Date: 2026-06-28

Ce document cadre le chantier potentiel `detailFast` avant implementation. Il ne valide pas encore le lancement du chantier. Son but est d'eviter de mettre le bazar dans Storage, Firestore ou l'UI alors que la passe actuelle est deja nettement meilleure.

## Objectif

Ajouter une variante image dediee a l'apparition rapide de l'image centrale des fiches produit:

```text
detailFast
largeur cible: environ 900-960 px
format: WebP
qualite cible: a calibrer autour de 0.76-0.80
usage: image centrale fiche produit
non usage: fond flou, miniatures, cartes, zoom/lightbox
```

Le but n'est pas de baisser la qualite de l'experience. Le but est d'eviter de servir une image `medium` trop lourde dans un cadre qui n'a pas toujours besoin de 1024 px et d'un poids de 250-360 Ko.

## Probleme mesure

La passe precedente a corrige:

- le blocage React du premier affichage;
- le voile flou central;
- les miniatures concurrentes;
- le preconnect Storage;
- le warmup hover/touch/clic;
- le warmup visible au scroll sur categorie.

Ce qui reste lent vient surtout de certains fichiers `medium` froids et lourds.

Exemples mesures sur les buffets:

```text
bU407... medium ~359 Ko, fetch froid ~884 ms
3uid... medium ~359 Ko, fetch froid ~1230 ms
```

Ces chiffres viennent de:

```powershell
npm run perf:product-images:cold -- --category=buffets --limit=15 --browser --browser-limit=4 --assert
```

## Avant / apres attendu

Avant:

```text
Fiche produit:
image centrale = medium
zoom/lightbox = large/full
```

Apres:

```text
Fiche produit:
image centrale = detailFast || medium || large || src
zoom/lightbox = large/full
```

Le cadre CSS ne change pas:

- meme `aspect-ratio`;
- meme `object-fit`;
- meme `border-radius`;
- meme `overflow: hidden`;
- meme fond flou desktop;
- meme lightbox haute qualite.

`detailFast` change l'URL source de l'image centrale, pas le layout.

## Non-objectifs

Ne pas faire dans ce chantier:

- refonte UI de la fiche produit;
- changement des dimensions des containers;
- suppression du fond flou desktop;
- remplacement de la lightbox par `detailFast`;
- chargement de `full` dans le rendu initial;
- CDN/proxy image;
- compression destructive sans comparaison visuelle;
- mutation Storage/Firestore sans dry-run.

## Fichiers probablement concernes

Pipeline variantes:

- `src/utils/imageUtils.js`
- `src/kit/admin/AdminForm.jsx`

Affichage produit:

- `src/kit/marketplace/ProductDetailShellIsland.jsx`
- eventuellement `app/produit/[slugOrId]/page.jsx` pour les preloads

Backfill / audit:

- nouveau script de dry-run/backfill detailFast dans `scripts/`
- `package.json` pour exposer les commandes

Documentation:

- `_DOCS/images/OPTIMISATION_AFFICHAGE_IMAGES_PRODUIT_2026-06-28.md`
- `AGENTS.md`

## Implementation proposee

### Etape 1 - audit complet sans mutation

Commande cible:

```powershell
npm run perf:product-images:cold -- --limit=80 --browser --browser-limit=8
```

Sortie attendue:

- produits lents;
- URL `medium`;
- poids actuel;
- temps fetch froid;
- dimensions metadata;
- liste priorisee des images candidates.

Decision:

- si seuls quelques fichiers sont lourds, envisager recompression ciblee;
- si beaucoup de fichiers sont lourds, `detailFast` devient plus interessant.

### Etape 2 - ajouter la specification de variante sans mutation destructive

Ajouter une cle de variante:

```js
{ key: 'detailFast', width: 900 ou 960, quality: 0.76-0.80, folder: 'responsive' }
```

Important:

- resize proportionnel uniquement;
- pas de crop;
- pas de changement du ratio;
- conserver `medium`, `large`, `full`.

### Etape 3 - integration upload admin

Au moment de l'import/upload d'une nouvelle image produit, generer:

```text
thumb
card
detailFast
medium
large
full
```

Puis enregistrer:

```js
imageVariants[index].detailFast = "url..."
```

Objectif:

- tout nouveau produit publie a sa variante rapide automatiquement;
- aucun besoin de repasser manuellement les nouveaux produits dans un backfill.

### Etape 4 - affichage avec fallback reversible

L'image centrale doit utiliser:

```js
detailFast || medium || large || src || card || thumb || full
```

Le zoom/lightbox doit continuer a utiliser:

```js
full || large || medium
```

Le fallback garantit que si `detailFast` est absent ou si on revient en arriere, le site continue de fonctionner avec `medium`.

### Etape 5 - backfill dry-run produits existants

Creer un script dedie, par exemple:

```text
scripts/backfill-product-image-detail-fast.cjs
```

Mode dry-run par defaut:

```powershell
npm run images:detail-fast:dry
```

Le dry-run doit afficher:

- nombre de produits publies scannes;
- nombre d'images deja avec `detailFast`;
- nombre d'images candidates;
- URLs source;
- chemin Storage cible prevu;
- estimation poids source;
- aucune ecriture Firestore;
- aucun upload Storage.

### Etape 6 - backfill commit protege

Le mode commit doit etre explicite:

```powershell
npm run images:detail-fast:commit -- --confirm=DETAIL_FAST
```

Le script doit:

- generer seulement les variantes manquantes;
- uploader dans un chemin versionne et identifiable;
- mettre a jour `imageVariants[index].detailFast`;
- produire un fichier log JSON avec chaque produit modifie;
- idealement bump `public/meta.catalogVersion` apres ecriture.

Exemple de chemin Storage souhaitable:

```text
furniture/responsive/detail_fast_<productId>_<index>_<hash>.webp
```

ou rester coherent avec le naming existant du repo, mais avec un marqueur clair `detailFast` / `detail_fast`.

## Strategie de rollback propre

Le rollback doit etre possible sans supprimer immediatement les fichiers Storage.

### Niveau 1 - rollback code uniquement

Le plus simple:

```text
image centrale = medium || large || src...
```

Au lieu de:

```text
image centrale = detailFast || medium || ...
```

Effet:

- `detailFast` peut rester en Firestore/Storage;
- l'UI revient a l'etat actuel;
- aucun risque de fichier manquant;
- rollback rapide par commit code.

### Niveau 2 - rollback donnees Firestore

Si on veut nettoyer les documents:

- utiliser le log JSON du backfill commit;
- pour chaque produit modifie, retirer seulement `imageVariants[index].detailFast`;
- ne pas toucher a `thumb`, `card`, `medium`, `large`, `full`;
- bump `catalogVersion` apres rollback.

Commande potentielle a prevoir:

```powershell
npm run images:detail-fast:rollback -- --from logs/detail-fast/<run>.json --confirm=ROLLBACK_DETAIL_FAST
```

### Niveau 3 - nettoyage Storage

A faire seulement apres validation que le rollback Firestore est stable:

- supprimer uniquement les fichiers crees par le run;
- se baser sur le log JSON, jamais sur un glob approximatif;
- ne jamais supprimer `medium`, `large`, `full`, `card`, `thumb`;
- faire un dry-run avant suppression.

Commande potentielle:

```powershell
npm run images:detail-fast:cleanup:dry -- --from logs/detail-fast/<run>.json
npm run images:detail-fast:cleanup:commit -- --from logs/detail-fast/<run>.json --confirm=DELETE_DETAIL_FAST
```

## Garde-fous obligatoires

Avant commit de donnees:

```powershell
node --check scripts/backfill-product-image-detail-fast.cjs
npm run images:detail-fast:dry
npm run lint
npm run build
npm run mobile:contract
npm run perf:product-images:cold -- --category=buffets --limit=15 --browser --browser-limit=4 --assert
```

Apres commit donnees:

```powershell
npm run perf:product-images:cold -- --category=buffets --limit=15 --browser --browser-limit=4 --assert
```

Puis deploy sandbox seulement si les mesures et l'UI sont satisfaisantes.

## Criteres de succes

La passe vaut le coup si:

- les images a ~300-360 Ko descendent nettement, cible indicative 120-180 Ko;
- les fetchs froids des pires cas baissent clairement;
- l'image centrale reste visuellement premium;
- aucun flash central ne revient;
- mobile et desktop gardent leurs containers;
- lightbox/zoom garde la qualite haute;
- les nouveaux uploads generent automatiquement `detailFast`.

## Criteres d'arret

Ne pas continuer si:

- le gain est faible sur les pires cas;
- la difference de qualite est visible dans le cadre central;
- le backfill demande trop de logique risquee;
- le pipeline admin devient fragile;
- les tests mobile ou build regressent;
- la version actuelle est jugee suffisante par test utilisateur.

## Decision actuelle

Implementation code lancee apres validation utilisateur, sans mutation de donnees automatique.

Etat attendu de cette passe:

- le code sait lire `imageVariants[index].detailFast`;
- les nouveaux uploads admin generent `detailFast` avec les autres variantes;
- l'image centrale fiche produit et les warmups utilisent `detailFast || medium || large || src || card || thumb || full`;
- le zoom/lightbox continue a utiliser `full || large || medium`;
- les produits existants ne changent pas tant que le backfill commit n'est pas lance.

La version actuelle, avec warmup au scroll, reste le socle. `detailFast` est ajoute comme levier reversible pour lisser les derniers meubles lents, mais toute ecriture Storage/Firestore doit passer par dry-run, log JSON et confirmation explicite.

## Implementation 2026-06-28

Fichiers code:

- `src/utils/imageUtils.js` ajoute la spec `{ key: 'detailFast', width: 900, quality: 0.78, folder: 'responsive' }`.
- `src/kit/admin/AdminForm.jsx` utilise deja `PRODUCT_IMAGE_VARIANT_SPECS` pour l'upload admin; ajouter la spec suffit donc a generer `detailFast` sur les nouvelles publications sans changer le formulaire.
- `src/utils/imageUtils.js` choisit `detailFast` comme variante d'affichage produit mobile/desktop, avec fallback vers les variantes existantes.
- `src/kit/marketplace/CategoryServerView.jsx` et `src/kit/marketplace/GalleryProductCardServer.jsx` prechauffent la meme URL que l'image centrale.
- `functions-public/src/public/catalog.js` conserve `detailFast` dans la projection courte `scope=cards`, sinon les pages categorie prechauffent `medium` alors que la fiche produit affiche `detailFast`.
- `scripts/backfill-product-image-detail-fast.cjs` gere les produits existants avec dry-run par defaut, commit protege, log JSON et bump `catalogVersion` en cas d'ecriture.
- `package.json` expose `images:detail-fast:dry` et `images:detail-fast:commit`.

Commandes:

```powershell
npm run images:detail-fast:dry
npm run images:detail-fast:commit -- --confirm=DETAIL_FAST
```

Notes importantes:

- `images:detail-fast:commit` cible la sandbox par defaut.
- Le script commit refuse de demarrer sans `--confirm=DETAIL_FAST`.
- Le commit production demande en plus `--env=production --allow-production`.
- Les logs sont ecrits dans `logs/detail-fast/`.
- Aucun fichier Storage n'est supprime par ce script.

Rollback code rapide:

```text
Revenir dans src/utils/imageUtils.js a PRODUCT_DISPLAY_IMAGE_VARIANTS mobile/desktop = medium.
```

Rollback donnees:

- utiliser le log JSON du run commit;
- retirer uniquement `detailFast` des slots listes;
- ne pas toucher a `thumb`, `card`, `medium`, `large`, `full`;
- bump `public/meta.catalogVersion`.

## Test pilote sandbox 2026-06-29

Deux produits buffets connus comme lents ont ete utilises pour comparer `medium` et `detailFast` sur la premiere image:

```text
bU407t3vFKcMq2UJ1wQL
medium     359 Ko, mediane 917 ms
detailFast 325 Ko, mediane 887 ms

3uidDZpwH2ydH8v9jiw3
medium     359 Ko, mediane 915 ms
detailFast 325 Ko, mediane 901 ms
```

Interpretation:

- le gain est reel mais modere sur ces deux cas;
- les sources font deja 816 px de large, donc `detailFast` cible 900 px ne peut pas reduire la dimension;
- le gain vient surtout de la recompression WebP, pas d'un resize massif;
- sur des sources plus larges, le gain attendu peut etre plus fort;
- l'absence de perte visible notable dans le cadre central a ete jugee acceptable pour une experience premium.

Ecritures pilotes realisees:

- ajout de `imageVariants[0].detailFast` uniquement sur les deux produits ci-dessus;
- ajout de deux fichiers Storage `furniture/responsive/detail_fast_pilot_<productId>_0_<hash>.webp`;
- bump de `public/meta.catalogVersion`;
- log local: `logs/detail-fast-pilot/2026-06-29T14-05-20-255Z/pilot-log.json`.

Verification hebergee:

- deploy App Hosting sandbox relance apres le pilote;
- les deux pages produit hebergees servent bien les URLs `detailFast`;
- `publicCatalog?id=...` expose `detailFast` pour les deux produits;
- `publicCatalog?scope=cards` doit continuer a conserver `detailFast` pour que le warmup categorie charge la meme URL que la fiche produit.

Decision pratique:

- garder `detailFast` comme variante d'affichage produit, car le fallback est reversible et la qualite visuelle reste bonne;
- ne pas attendre un gain spectaculaire sur les images sources deja proches de 900 px;
- utiliser l'audit froid pour identifier les images ou `detailFast` apporte un vrai resize/recompression;
- garder CDN/proxy image comme levier infra ulterieur si les fichiers raisonnables restent lents a froid.
