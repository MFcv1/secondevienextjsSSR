# Images produit et medias

Derniere mise a jour: 2026-07-20
Statut: `REFERENCE_ACTIVE`

## 1. Architecture

Les images produit sont preparees au moment de l'upload admin, stockees dans Firebase Storage et referencees dans le document produit Firestore. Les cartes publiques affichent directement les variantes WebP avec un `<picture>/<img>` natif; aucune configuration `next/image` inactive ne subsiste.

Les assets de marque, hero, categories, avant/apres et vitrine vivent dans `public/images`, `public/video` ou `src/assets` selon leur mode d'import.

Les illustrations de parcours analytics vivent dans `public/images/analytics`. Elles sont des WebP 320x400 dedies aux miniatures du panneau Data: les categories parentes `meubles`, `assises`, `eclairage`, `decorations` et les visuels editoriaux differencies de Galerie, A propos et Devis. Elles ne remplacent ni les images produit, ni les images des categories publiques.

## 2. Modele image produit

Chaque produit peut contenir:

```text
images[]             URL de source exploitable
imageUrl             fallback principal historique
thumbnails[]         compatibilite historique
thumbnailUrl         fallback vignette principal
imageVariants[]      variantes par slot image
imageMetadata[]      metadata par slot image
```

Variantes courantes:

| Cle | Largeur cible | Usage principal |
| --- | ---: | --- |
| `thumb320` | 320 px | petites cartes/mobile |
| `thumb384` | 384 px | cartes responsives |
| `thumb` | 480 px | vignettes et fallback |
| `card` | 768 px | carte large |
| `detailFast` | 900 px | premiere image detail mobile et desktop |
| `medium` | 1024 px | detail/intermediaire |
| `large` | 1440 px | grand detail |
| `full` | 1920 px | zoom/source haute definition |

Metadata:

- largeur et hauteur;
- ratio;
- couleur dominante;
- `blurDataUrl` WebP;
- informations de taille/source utiles au diagnostic.

## 3. Selection des variantes

`src/utils/imageUtils.js` est la source unique de normalisation, selection et warmup. `ProductCardMediaServer.jsx` est le composant canonique commun a la galerie et aux categories pour `picture`, `src/srcSet/sizes`, dimensions, priorite, couleur dominante, blur et source de warmup. Les composants ne doivent pas inventer un ordre de fallback divergent.

Principes:

- galerie: `thumb320`/`thumb384` puis `thumb`/`card`;
- detail initial: `detailFast` avant les variantes lourdes;
- zoom/lightbox: variante plus grande seulement a l'interaction;
- metadata et ratio connus avant chargement pour eviter le CLS;
- toutes les images differees conservent un `src` reel et le lazy loading natif; l'ancien activateur `data-cold-scroll-deferred-*` n'existe plus, y compris dans le footer;
- cartes galerie/categorie: aucun blur ni placeholder visible; la zone reste transparente et laisse voir le fond normal du site, l'image est masquee jusqu'a `img.decode()`, puis apparait nette avec un fade-in de 360 ms;
- precharger uniquement l'image principale reellement probable.

Politique courante:

- galerie en haut: hero prioritaire, cartes produit lazy;
- categorie directe: premiere rangee bornee en `eager/high`, suivantes lazy;
- `Petits Prix`: `src/srcSet` toujours presents dans le HTML, lazy natif, aucun injecteur sequentiel;
- warmup partage: concurrence maximale 2, `detailFast` avant clic, route prefetchee seulement sur hover/focus/press;
- une pression vers un produit annule les warmups speculatifs encore en file pour que les cartes survolees precedemment ne concurrencent pas la navigation choisie;
- Save-Data et reseaux 2G: aucune anticipation speculative;
- nouvelle version catalogue: cache logique de warmup et routes prefetchees vide avant `router.refresh()`;
- medias historiques sans variante recente: ordre de fallback conserve, sans suppression implicite.

## 4. Upload admin

`AdminForm`:

1. compresse le fichier;
2. calcule les metadata;
3. cree les variantes via `src/utils/imageUtils.js` et Firebase Storage;
4. conserve l'ordre de galerie;
5. ecrit URLs, variantes et metadata dans Firestore;
6. declenche l'invalidation du catalogue apres sauvegarde.

Une modification de ce flux doit tester creation neuve, edition sans nouvelle image, recadrage, suppression/reordre et echec partiel d'upload.

## 5. Scripts de maintenance

Tous les scripts d'ecriture doivent etre precedes d'un dry-run et viser explicitement l'environnement.

```bash
npm run images:metadata:dry
npm run images:variants:dry
npm run images:detail-fast:dry
npm run images:card-thumbs:dry
npm run images:orphans:dry
```

Modes commit proteges disponibles:

```bash
npm run images:detail-fast:commit
npm run images:card-thumbs:commit
```

Ne jamais utiliser `cleanup-product-image-variants.cjs` sans comprendre que les pages publiques consomment actuellement `imageVariants`. Sa confirmation destructive est volontairement difficile.

## 6. Nettoyage Storage

Avant toute suppression:

1. inventorier toutes les URLs Firestore, metadata, contenus admin et assets statiques;
2. executer l'audit orphelins en dry-run;
3. distinguer variante obsolete, source historique et fichier encore reference;
4. conserver une preuve de comptage et de taille;
5. verifier les pages galerie, categorie, produit, panier, wishlist, commandes et admin;
6. prevoir restauration ou regeneration.

Une absence de reference textuelle dans le code ne prouve pas qu'un fichier Storage est inutilise: son URL peut etre stockee en base.

Le catalogue materialise ajoute une contrainte: une URL reste protegee tant qu'elle apparait dans `current`, `previous`, `last-known-good` ou une release retenue. `onArtifactUpdated` et `onArtifactDeleted` placent les candidats en quarantaine. Dans le sandbox, `catalogMediaGarbageCollector` peut supprimer apres 90 jours seulement si le media n'est plus reference par Firestore ni par une release retenue et si sa generation Storage n'a pas change. L'activation de `CATALOG_MEDIA_GC_COMMIT=true` du 2026-07-18 a ete precedee d'un dry-run; toute autre cible exige la meme preuve.

## 7. Medias statiques sensibles

Sont consideres a risque et ne doivent pas etre supprimes sans inspection visuelle et reseau:

- images hero desktop/mobile;
- images categories configurees par l'admin;
- medias avant/apres;
- images de la page A propos;
- image de connexion et de devis;
- logos, favicon, manifest et icone Apple;
- assets de livraison/footer;
- fichiers source PNG encore susceptibles d'alimenter une regeneration.

## 8. Fichiers structurants

```text
src/utils/imageUtils.js
src/kit/admin/AdminForm.jsx
src/kit/admin/components/AdminImageCard.jsx
src/kit/admin/components/ImageCropperModal.jsx
src/kit/marketplace/GalleryProductCardServer.jsx
src/kit/marketplace/ProductDetailServerView.jsx
src/kit/marketplace/ProductDetailShellIsland.jsx
src/kit/marketplace/ProductDetailLightboxIsland.jsx
scripts/backfill-product-image-*.cjs
scripts/audit-product-detail-images*.mjs
scripts/audit-storage-orphans.cjs
functions/src/triggers/mediaCleanup.js
functions/src/catalog/mediaGarbageCollection.js
```

## 9. Gates

```bash
npm run images:audit
npm run perf:product-images
npm run perf:product-images:cold
npm run perf:product-direct
```

Les audits froids et navigateur sont des validations longues: les lancer seulement pour une passe images/performance ou sur demande explicite.
