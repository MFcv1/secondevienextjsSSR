# Images produit et medias

Derniere mise a jour: 2026-09-14
Statut: `REFERENCE_ACTIVE`

## 1. Architecture

Les images produit sont preparees au moment de l'upload admin, stockees dans Firebase Storage et referencees dans le document produit Firestore. Les cartes publiques affichent directement les variantes WebP avec un `<picture>/<img>` natif; aucune configuration `next/image` inactive ne subsiste.

Les assets de marque, hero, categories, avant/apres et vitrine vivent dans `public/images`, `public/video` ou `src/assets` selon leur mode d'import.

Les illustrations de parcours analytics vivent dans `public/images/analytics`. Elles sont des WebP 320x400 dedies aux miniatures du panneau Data: les categories parentes `meubles`, `assises`, `eclairage`, `decorations` et les visuels editoriaux differencies de Galerie, A propos et Devis. Elles ne remplacent ni les images produit, ni les images des categories publiques.

Le 2026-08-23, l'audit statique complete par la lecture des documents sandbox
`sys_metadata/homepage_images` et `sys_metadata/gallery_app` a permis de
retirer 49 anciennes variantes locales sans appelant: anciens PNG des blocs A
propos, heroes et footer, anciens rails categorie, essais analytics/newsletter,
anciens visuels Marseille et variantes hero remplacees. Les WebP/presets
actifs, les images configurees dans Storage et tous les medias produit ont ete
conserves. Cette preuve ne vaut jamais autorisation de nettoyer Storage.

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
- prioriser la premiere image probable, puis les miniatures et les voisines de la fiche ouverte.

Politique courante:

- galerie en haut: hero prioritaire, cartes produit lazy;
- categorie directe: premiere rangee bornee en `eager/high`, suivantes lazy;
- `Petits Prix`: `src/srcSet` toujours presents dans le HTML, lazy natif, aucun injecteur sequentiel;
- warmup partage via `productImageLoader.js`: 2 transferts speculatifs sur mobile, 3 sur ordinateur, une place supplementaire pour une action explicite; promotion en vol et decodage sequentiel;
- cartes visibles: la racine d'observation suit le vrai conteneur de scroll (viewport pour les categories et la galerie ordinateur, `#marketplaceGalleryScroll` pour la galerie mobile) — [correctif du 2026-09-13](PRECHARGEMENT_GALERIE_2026-09-13.md);
- fond flou et miniatures: `getProductDetailThumbSrc` choisit `thumb320`, `thumb384`, puis les replis historiques; URLs jointes aux cartes (`detailThumbs`), prefixe commun compact dans le DOM;
- cartes visibles, meme partiellement: observation installee au montage, prechargement de chaque route Next sans attendre une pause. Registre borne de demandes (pas une preuve de disponibilite); invalidation Next relancee seulement pour les routes encore visibles, sans polling;
- images d'ouverture: toutes les premieres photos visibles puis leurs fonds/miniatures precedents aux images de la rangee voisine dans le sens du scroll (marge 250 px, 2 voisines mobile/5 ordinateur). Plan mis a jour en place: seules les demandes devenues inutiles sont retirees; priorites et ordre des demandes conservees sont ajustes;
- pause de 240 ms: decodage sequentiel des premieres photos visibles, puis miniatures et photos de detail par tours entre tous les meubles visibles. Un nouveau scroll annule la suite et les demandes de decodage encore non engagees; un decodage deja engage finit normalement. Save-Data/2G desactivent l'anticipation. Les URLs `detailImages` proviennent du meme snapshot complet, prefixe compact dans le DOM;
- une pression vers un produit annule les warmups speculatifs encore en file pour que les cartes survolees precedemment ne concurrencent pas la navigation choisie;
- Save-Data et reseaux 2G: aucune anticipation speculative;
- nouvelle version catalogue: files et registre des routes vides, observateurs reconstruits; cartes ajoutees et URLs modifiees suivies sans polling;
- cache d'images chargees borne a 32 entrees mobile/64 ordinateur, dont au plus la moitie protegee temporairement pour les images d'ouverture visibles; protection liberee a la sortie, au changement de catalogue et au demontage. Attente a 48 telechargements et 16 decodages; delais maximum 20 s de chargement et 5 s de decodage, puis nouvelle tentative possible;
- fiche: charger les deux voisines en premier, avec decodage, puis les autres une par une sans decodage; arreter la preparation au demontage et en arriere-plan. Selection immediate avec miniature provisoire si la photo de detail n'est pas chargee; remplacement apres decodage et uniquement pour la selection courante. Derniere photo peinte conservee dessous. Mobile: fondu entrant 160 ms, ancienne photo opaque, aucun drag/retour arriere superpose; mouvement reduit respecte. Erreur visible et bouton Reessayer;
- medias historiques sans variante recente: ordre de fallback conserve, sans suppression implicite.

Livraison et limites du prechargement au scroll :
[ouverture des fiches du 14 septembre](OUVERTURE_GALERIE_2026-09-14.md).

## 4. Upload admin

Dernier ajustement de la recette du 13 septembre: le fondu mobile est remplace
par `useProductSwipeMotion`, bande temporaire de trois photos qui suit le doigt
(transform CSS, aucune mise a jour React par mouvement). Calage de 190 ms au
relachement, retour a la photo courante si geste insuffisant, nettoyage a
l'annulation/demontage/nouveau geste. La bande reste jusqu'a la disponibilite
de la photo normale dessous. Variantes deja chargees ou miniatures; photo
courante en fond de secours, cadre stabilise pendant le mouvement. Mouvement
reduit: calage sans transition. Desktop conserve.
Les liens galerie/categories conservent la navigation Next native sans voile,
spinner ni libelle « Ouverture… ». Le prechargement anticipe l'ouverture mais
ne garantit pas une navigation instantanee si le toucher precede sa fin.

Affinage tactile du 13 septembre apres recette: transition mobile 100 ms avec
translation entrante de 8 px, couche precedente opaque. Seuil de swipe borne a
48 px (12 % de la largeur). Un nouvel appui leve immediatement la suppression
du clic suivant un swipe; appui immobile (12 px de tolerance) ouvre le zoom au
relachement. Clavier conserve. Cartes: appui court <= 450 ms active le Link
existant une fois; clic natif suivant consomme, mouvement/scroll/multitouch
annulent cette activation anticipee. Rafraichissement galerie: seuil de 10 px
avant interception. Recette utilisateur requise, aucune mesure FPS de l'agent.

Pour une creation neuve, `AdminForm` prepare les variantes WebP bornees puis
les envoie sur les chemins catalogue historiques. Le document meuble n'est
cree qu'une fois tous les uploads termines; une erreur Storage laisse donc le
catalogue intact au lieu de produire un brouillon sans photo. L'ordre des
medias reste celui du formulaire et les metadata ratio/couleur/blur sont
conservees avec les URLs finales.

La conversion verifie le type reel du Blob. Si WebP n'est pas disponible,
elle utilise JPEG avec extension et type coherents; un echec des deux formats
interrompt l'upload. Le recadrage conserve aussi le type reel. La reparation
bornee des trois imports PNG de septembre est decrite dans
[la livraison du 13 septembre](CHARGEMENT_IMAGES_IMPLEMENTATION_2026-09-13.md).

Les huit largeurs ne sont pas huit telechargements publics: le `srcset` laisse
le navigateur choisir une seule ressource selon largeur et densite. Elles
couvrent les quatre niveaux carte/vignette, le detail initial, l'intermediaire,
le grand detail et le zoom. Leur faible cout Storage est conserve car chaque
cle reste selectionnable par les surfaces publiques. Cote admin, la source est
decodee une seule fois par photo et les huit envois sont executes avec une
concurrence bornee a quatre; cela reduit le temps sans retirer de palier utile
ni saturer le navigateur.

Le rail serveur `functions/src/publication/productPublication.js` et ses
chemins `publication-sessions` ne sont plus appeles par le formulaire depuis le
2026-08-07. Ils restent temporairement deployes pour diagnostiquer et collecter
les sessions deja creees avant leur retrait gouverne.

L'edition d'un meuble existant conserve pour l'instant le flux historique de
variantes navigateur. Toute convergence future doit preserver recadrage,
suppression/reordre et les medias deja references.

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

Pour les assets Git sous `public`, `npm run audit:usage` fournit une liste de
candidats. Une suppression exige encore une recherche exacte, la verification
des documents de personnalisation sandbox et des alternatives actives, puis
les gates visuelles/build du perimetre.

Le catalogue materialise ajoute une contrainte: une URL reste protegee tant qu'elle apparait dans `current`, `previous`, `last-known-good` ou une release retenue. `onArtifactUpdated` et `onArtifactDeleted` placent les candidats en quarantaine. `catalogMediaGarbageCollector` ne peut supprimer un media apres 90 jours que s'il n'est plus reference par Firestore ni par une release retenue et si sa generation Storage n'a pas change. Le contre-audit G2-B4 a constate que la variable `CATALOG_MEDIA_GC_COMMIT` n'etait pas presente sur le runtime sandbox malgre l'ancienne mention d'activation; cette mention est donc remplacee. Le meme kill-switch couvre desormais les medias et les anciennes releases et reste fail-closed (`false`) sur le sandbox. Toute activation destructive exige backup READY, restore drill, dry-run scelle, candidats et generations manifestes, rollback et approbation explicite.

Depuis le lot local G2-A6, l'enqueue de quarantaine converge par chemin et
generation: un replay du meme evenement ne repousse pas la grace et ne remet
pas les tentatives a zero, tandis qu'une nouvelle generation du meme chemin
cree bien un nouveau cycle. L'ancien modele social associe aux produits n'a
aucun appelant, aucune rule et aucune donnee sandbox; ses references ont ete
retirees du code executable. `onArtifactDeleted` ne gere que la quarantaine
media.

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
functions/src/publication/productPublication.js
```

## 9. Gates

```bash
npm run images:audit
npm run perf:product-images
npm run perf:product-images:cold
npm run perf:product-direct
```

Les audits froids et navigateur sont des validations longues: les lancer seulement pour une passe images/performance ou sur demande explicite.
