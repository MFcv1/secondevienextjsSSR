# PageSpeed - variantes cartes et images statiques galerie

Date: 2026-07-06  
Statut: implemente, backfill sandbox execute, sans mutation Storage production

## Objectif

Ameliorer les scores PageSpeed mobile/desktop sans redesign, sans baisser la qualite des images originales et sans casser les optimisations Next natives deja en place.

Cette passe couvre:

- variantes produit carte plus fines: `thumb320` et `thumb384`;
- `srcSet` carte plus strict, sans `medium 1024w`;
- exposition des nouvelles variantes dans le catalogue public;
- script de backfill dedie, reversible et dry-run par defaut;
- images statiques Avant/Apres servies en AVIF quand le navigateur le supporte.

## Contraintes conservees

- `next/image` reste `unoptimized: true`.
- Firebase Storage reste la source de verite des variantes produit.
- `detailFast` reste reserve a l'image centrale produit et au warmup detail.
- Les variantes existantes `thumb`, `card`, `detailFast`, `medium`, `large`, `full` ne sont ni remplacees ni supprimees.
- Aucun changement de layout, shell mobile, scroll galerie, lightbox ou fiche produit.
- Aucun commit Storage production dans cette passe.

## Implementation

### Variantes produit carte

Fichier principal: `src/utils/imageUtils.js`

`PRODUCT_IMAGE_VARIANT_SPECS` genere maintenant:

- `thumb320`: WebP largeur 320, qualite 0.73;
- `thumb384`: WebP largeur 384, qualite 0.74;
- puis les variantes historiques `thumb`, `card`, `detailFast`, `medium`, `large`, `full`.

`getProductCardImage()` utilise maintenant:

- `src`: `thumb384 || thumb || card || medium || large || src || thumbnailUrl...`;
- `srcSet`: `thumb320 320w`, `thumb384 384w`, `thumb 480w`, `card 768w`;
- plus de `medium 1024w` dans le `srcSet` carte public.

Point important: pour les anciens produits sans `thumb320/thumb384`, les champs restent vides dans le `srcSet`. On ne reutilise pas une ancienne image 480 en la declarant faussement comme `320w` ou `384w`.

### Catalogue public

Fichier: `functions-public/src/public/catalog.js`

`scope=cards` expose maintenant `thumb320` et `thumb384` quand elles existent. Les anciens produits restent compatibles via `thumb`, `card`, `medium`.

### Backfill dedie

Fichier: `scripts/backfill-product-image-card-thumbs.cjs`

Scripts npm:

```bash
npm run images:card-thumbs:dry
npm run images:card-thumbs:commit
```

Garde-fous:

- dry-run par defaut;
- commit uniquement avec `--commit --confirm=CARD_THUMBS`;
- sandbox par defaut;
- production seulement avec `--env=production --allow-production`;
- creation uniquement de `imageVariants[index].thumb320` et `imageVariants[index].thumb384`;
- aucun nettoyage Storage;
- log JSON complet dans `logs/card-thumbs/`;
- bump `catalogVersion` seulement quand des documents sont modifies en commit.

### Images statiques Avant/Apres

Fichiers concernes:

- `public/images/before-after/avant-gallery.avif`
- `public/images/before-after/avantu-gallery.avif`
- `public/images/before-after/avantx-gallery.avif`
- `public/images/before-after/apres-gallery.avif`
- `public/images/before-after/apresu-gallery.avif`
- `public/images/before-after/apresx-gallery.avif`

Le rendu utilise maintenant `<picture>` avec source AVIF et fallback WebP. Les dimensions et le ratio des images sont conserves.

Gain local mesure sur les 6 visuels:

```text
apres-gallery.webp  -> apres-gallery.avif   : -4 607 octets
apresu-gallery.webp -> apresu-gallery.avif  : -3 629 octets
apresx-gallery.webp -> apresx-gallery.avif  : -2 836 octets
avant-gallery.webp  -> avant-gallery.avif   : -10 437 octets
avantu-gallery.webp -> avantu-gallery.avif  : -10 134 octets
avantx-gallery.webp -> avantx-gallery.avif  : -9 307 octets
Total                                      : -40 950 octets
```

## Preuves locales

Commandes passees:

```bash
npm run build
npm run next:routes
npm run mobile:contract
npm run perf:gallery-direct
npm run perf:category-direct
npm run perf:product-images
node --check scripts/backfill-product-image-card-thumbs.cjs
```

Resultat:

- build OK;
- routes Next natives OK;
- contrat mobile OK;
- audit galerie direct OK;
- audit categorie direct OK;
- audit images produit OK;
- syntaxe du script backfill OK.

Points bloques non lies a cette optimisation:

- `npm run lint` echoue sur le probleme existant `@rushstack/eslint-patch` avec ESLint 9;
- avant reprise, `npm run images:card-thumbs:dry -- --limit=1` echouait sans credentials Google locaux.

## Backfill sandbox execute

Reprise 2026-07-06:

- le script `scripts/backfill-product-image-card-thumbs.cjs` accepte maintenant les credentials `FIREBASE_SERVICE_ACCOUNT_JSON` ou `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`, sans ecrire de secret local;
- dry-run sandbox OK: `logs/card-thumbs/2026-07-06T13-54-45-097Z-dry-run.json`;
- commit sandbox OK: `logs/card-thumbs/2026-07-06T14-04-20-161Z-commit.json`;
- revalidation catalogue OK: `logs/revalidate-after-card-thumbs-2026-07-06T14-05-11-112Z.json`;
- App Hosting sandbox redeploye apres commit.

Resultat commit:

```text
Docs scanned: 38
Docs with images: 38
Docs needing update: 38
Image slots: 309
Created variants: 618
Docs updated: 38
Catalog version bumped: yes
Errors: 0
```

Verification publique:

- `publicCatalog?scope=cards`: 38/38 produits avec `thumb320` et `thumb384` sur la premiere image;
- `/` et `/galerie` sandbox: HTML 200 avec URLs `_thumb320_` et `_thumb384_`;
- gates sandbox OK: `mobile:contract`, `perf:product-images`, `perf:gallery-direct`, `perf:category-direct`.

## Rollback

Rollback code simple:

- retirer `thumb320/thumb384` de `PRODUCT_IMAGE_VARIANT_SPECS`;
- retirer ces cles du `srcSet` carte;
- retirer leur projection dans `functions-public/src/public/catalog.js`;
- supprimer les sources AVIF dans la section Avant/Apres si un artefact visuel est constate.

Les fichiers Storage crees par un futur backfill peuvent rester en place sans impact si le code ne les reference plus.
