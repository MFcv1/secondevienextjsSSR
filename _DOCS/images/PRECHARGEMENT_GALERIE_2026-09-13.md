# Préchargement des fiches depuis la galerie — 2026-09-13

Propriétaire : équipe Seconde Vie. Statut : correctif livré sur le sandbox, recette
utilisateur desktop et vrai mobile à faire.

## Symptôme

Depuis une page catégorie, l'ouverture d'un meuble affiche immédiatement l'image
centrale, le fond flouté et les miniatures. Depuis la galerie, les mêmes éléments
apparaissent avec un délai d'environ une seconde.

## Cause

Galerie et catégories utilisent le même composant,
`src/kit/marketplace/GalleryGridActionsIsland.jsx` (`observeVisibleWarmup`) : un
`IntersectionObserver` précharge l'image de fiche (`detailFast`, sinon `medium`)
des cartes proches de l'écran, avec les protections partagées (deux images à la
fois, rien en Save-Data/2G, file vidée à la pression sur une carte).

La seule différence était la racine d'observation :

- catégories : viewport (`root: null`) ;
- galerie : toujours `#marketplaceGalleryScroll`.

Or ce conteneur ne défile que sous 1024px. Au-delà, `src/index.css` le passe en
`display: contents` : il n'a pas de boîte. Mesure sur le sandbox à 1440px :
racine 0×0, **0 carte détectée sur 20** (5/20 avec le viewport). Le préchargement
de la galerie ne se déclenchait donc jamais sur laptop/desktop ; tout était
téléchargé au clic.

## Correctif

`getVisibleWarmupRoot()` n'utilise `#marketplaceGalleryScroll` comme racine que
s'il est réellement un conteneur de scroll (ni `display: contents`, overflow
`auto`/`scroll`) ; sinon le viewport, comme les catégories. L'observer est
reconstruit si la fenêtre franchit 1024px. Aucun autre réglage modifié.
Contrat : `tests/catalog/security.test.cjs`.

## Étape 2 — fond flouté et miniatures

Mesure après l'étape 1 (catégorie Buffets, même meuble de 10 photos) : image
centrale déjà préchargée, mais fond flouté et 10 miniatures téléchargés au clic
en 0,5 à 0,7 s ; 2 à 3 ms à la deuxième ouverture (cache navigateur). Galerie et
catégories avaient ce même délai, masqué pour les pièces déjà ouvertes.

- `getProductDetailThumbSrc` (`src/utils/imageUtils.js`) est la source unique
  des URLs du fond flouté et du rail de miniatures, partagée avec la fiche.
- `queryMaterializedCatalog` joint aux cartes `detailThumbs`, calculé depuis le
  catalogue complet de la même release (mémoïsé par snapshot). Aucune
  republication catalogue ; l'API `scope=cards` en bénéficie aussi.
- Cartes : attribut `data-product-thumbs-warmup`. Carte proche de l'écran :
  image centrale + fond flouté. Scroll arrêté 450 ms sur des cartes visibles à
  60 % (4 au plus sous 1024px, 8 au-delà, du centre vers les bords), survol,
  focus ou pression : toutes les miniatures.
- File dédiée aux miniatures : 4 en parallèle, priorité basse, sans décodage,
  vidée à la pression sur une carte ; Save-Data/2G inchangés.
- Fiche : miniatures du rail en `eager` (priorité basse hors image active).

## À vérifier en recette

- laptop/desktop : ouvrir un meuble après avoir laissé la grille visible ;
- vrai téléphone : même parcours (le mobile utilisait déjà la bonne racine ; un
  simulateur de navigateur ne vaut pas preuve).

Si un délai persiste sur mobile, piste suivante observée : la file (deux images à
la fois, ordre de la page) est ralentie par trois meubles récents dont les
variantes publiées sont des PNG de 0,4 à 2,9 Mo malgré l'extension `.webp`.
Hors périmètre de ce correctif.
