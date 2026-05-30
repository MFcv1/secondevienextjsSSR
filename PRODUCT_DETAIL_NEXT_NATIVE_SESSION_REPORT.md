# Rapport session - Migration detail produit Next native

Date: 2026-05-30

Ce rapport documente le contexte complet de la session autour des pages devis,
galerie et surtout detail produit. Le but est qu'un prochain agent comprenne
pourquoi les changements ont ete faits, ce qui est vraiment resolu, ce qui
reste legacy, et quels invariants ne doivent pas etre casses.

## Resume court

La demande utilisateur partait d'un probleme de "double page" entre l'ancienne
app visible et les routes Next SSR. Apres refresh, certaines URLs affichaient
une page SSR differente de l'interface vue lors de la navigation client. Le
probleme le plus visible et le plus critique concernait les pages produit:

- arrivee depuis la galerie: interface legacy/overlay produit correcte;
- refresh dur sur `/produit/...`: autre rendu Next/SSR, dimensions differentes,
  effets de zoom/dezoom, parfois une landing ou une preview visible;
- sortie produit: retour pas toujours vers la galerie visible;
- mobile: details sheet, miniatures, swipe, image centrale et sortie devaient
  retrouver le comportement legacy.

La direction retenue a ete de ne plus multiplier deux experiences produit.
La route produit est devenue une route Next native visible, avec SSR pour le
contenu indexable et petites iles client pour les interactions.

## Etat architectural actuel

### Page produit

La page produit publique `/produit/[slugOrId]` est maintenant une route Next
native.

Fichiers principaux:

- `app/produit/[slugOrId]/page.jsx`
  - recupere le produit cote serveur;
  - garde metadata, canonical, JSON-LD `Product` et `BreadcrumbList`;
  - garde ISR/revalidate;
  - ne monte plus le shell SPA legacy pour l'experience produit publique.

- `src/kit/marketplace/ProductDetailServerView.jsx`
  - composant serveur;
  - prepare titre, description, prix, informations;
  - rend la structure produit visible/indexable;
  - injecte les iles client limitees.

- `src/kit/marketplace/ProductDetailShellIsland.jsx`
  - ile client media produit;
  - gere image principale, miniatures, swipe mobile, molette desktop,
    lightbox/zoom, bottom sheet mobile, animation de sortie et retour galerie;
  - contient le rendu mobile et desktop qui doit rester visuellement proche du
    legacy.

- `src/kit/marketplace/ProductDetailActionsIsland.jsx`
  - ile client actions;
  - gere les boutons panier/favori/reservation sans remonter toute la SPA.

Fichiers supprimes pendant la migration produit:

- `src/kit/marketplace/ProductPageExperience.jsx`
- `src/kit/marketplace/ProductDetailRouteExperience.jsx`

Ces fichiers representaient l'etape intermediaire "grosse ile client produit".
Ils ont ete retires pour eviter une nouvelle fausse couche entre SSR et rendu
visible.

### Galerie

La galerie complete n'est pas encore une route Next native pure. Elle reste
encore montee via le launcher/overlay et le shell marketplace existant.

Important: cela ne veut pas dire que la page produit depend encore de la SPA.
La page produit directe est native Next. En revanche, la galerie visible est
encore l'experience client existante, et le retour produit doit remonter cette
galerie sans afficher la landing entre les deux.

Fichiers importants:

- `app/page.jsx`
  - home SSR SEO statique;
  - contient un bootstrap inline minimal pour masquer la landing quand l'arrivee
    vient d'une sortie produit ou de `?page=gallery`.

- `app/HomeGalleryLauncher.jsx`
  - monte l'overlay galerie;
  - ouvre automatiquement la galerie si l'URL contient `?page=gallery`,
    `#gallery`, ou si la session contient le flag
    `secondevie:open-gallery-on-arrival`.

- `src/app.jsx`
  - shell legacy/marketplace encore utilise par la galerie;
  - restaure la position de galerie apres retour produit via
    `secondevie:product-return:v1`.

- `src/Router.jsx`
  - garde la logique mobile critique de galerie/detail legacy;
  - ne pas casser l'invariant mobile decrit plus bas.

## Probleme initial: "deux pages" apres refresh

Le symptome utilisateur etait:

- navigation normale dans l'app: design historique visible;
- refresh direct d'une route `/devis` ou `/produit/...`: autre page SSR,
  differente du design attendu;
- impression qu'on avait deux interfaces pour la meme URL.

La cause generale:

- certaines routes Next avaient un rendu SSR indexable;
- puis un composant client/legacy pouvait prendre le relais;
- dans d'autres cas le rendu direct Next et le rendu legacy n'etaient pas le
  meme design;
- sur produit, l'ancienne galerie ouvrait une experience overlay alors que la
  route directe affichait une autre experience.

Decision prise:

- pour `devis`, garder une page SSR SEO compatible, mais il faut documenter que
  l'objectif utilisateur etait le design visible historique;
- pour `produit`, ne pas garder deux experiences: reconstruire la route produit
  Next native en reprenant le design visible attendu;
- pour la galerie, continuer la migration progressivement, sans casser
  l'experience actuelle.

## Avancees majeures effectuees

### 1. Clarification de l'architecture produit

Avant:

- route produit directe en partie SSR;
- experience visible parfois issue du legacy;
- refresh produit pouvait afficher une autre page;
- certains composants servaient de pont temporaire.

Apres:

- route produit directe Next native;
- `ProductDetailServerView` rend le contenu;
- `ProductDetailShellIsland` hydrate seulement les interactions media;
- `ProductDetailActionsIsland` hydrate les actions;
- les anciens ponts produit ont ete retires.

Impact:

- refresh direct produit et arrivee produit utilisent la meme experience cible;
- SEO et contenu produit restent disponibles cote serveur;
- moins de dependance au shell SPA pour la fiche produit;
- meilleure base pour finir la galerie Next native plus tard.

### 2. Alignement visuel desktop du detail produit

Plusieurs problemes visuels ont ete corriges:

- effet zoom/dezoom au refresh;
- image centrale trop grande ou trop petite selon arrivee/refresh;
- bandes grises/transparentes ou fond incoherent;
- bouton de sortie place sur le titre produit au lieu de la scene image;
- miniatures desktop/mobile qui apparaissaient dans le mauvais layout.

Points importants dans `ProductDetailShellIsland.jsx`:

- le frame desktop reprend la logique historique:
  - `74vh`;
  - ratio `0.75`;
  - max `920px`;
  - calcul base sur `100vw - sidebar`.
- la molette desktop change les images dans l'ile native.
- le bouton de sortie desktop est fixe dans la scene image:

```txt
right: calc(clamp(450px, 26vw, 500px) + 110px + 2rem)
top: clamp(5.5rem, 12vh, 8rem)
```

Pourquoi cette formule:

- `450/500px` correspond a la colonne infos;
- `110px` correspond au rail de miniatures desktop;
- `2rem` garde le bouton cote visuel, avant la colonne infos;
- cela evite qu'il tombe sur le titre produit.

### 3. Parite mobile avec le legacy

Problemes mobiles traites:

- le rail de miniatures desktop apparaissait a gauche sur mobile;
- les miniatures mobiles n'avaient pas les bonnes dimensions;
- le bottom sheet "Details" ne se fermait pas comme le legacy;
- un second pull vers le haut/bas depuis la description devait fermer la modale;
- la sortie par scroll/swipe devait lancer une animation puis revenir galerie;
- l'image centrale avait des marges transparentes internes.

Corrections:

- rail desktop force en `hidden lg:flex`;
- rail mobile horizontal en dimensions legacy:
  - `32px`, gap `6px`;
  - `30px`, gap `5px` si plus de 12 images;
- bottom sheet avec handle centre;
- gestes description/bottom sheet rapproches du comportement legacy;
- image centrale mobile en `object-fit: cover` pour supprimer les marges
  transparentes internes;
- animation de sortie mobile garde une transition descendante puis navigue.

Point de vigilance:

`object-fit: cover` peut legerement cropper certaines images, mais c'etait le
choix retenu pour supprimer les bandes internes et coller a la demande
utilisateur "pas de marge comme en legacy".

### 4. Retour galerie fiable apres sortie produit

Probleme:

- la sortie produit naviguait vers `/?page=gallery`;
- pendant un instant, la home SSR "Mobilier ancien restaure..." etait visible;
- ensuite seulement l'overlay galerie se montait;
- sur desktop et mobile, l'utilisateur avait l'impression de revenir a la
  mauvaise page.

Corrections:

- `ProductCard` memorise la cible de retour:

```txt
secondevie:product-return:v1
```

Contenu memorise:

- `href`;
- `scrollY`;
- `galleryScrollTop`;
- `savedAt`.

- sur tap mobile, la cible est aussi memorisee, pas seulement sur click desktop;
- `ProductDetailShellIsland` ignore les anciennes cibles qui pointent vers
  `/produit/...`, pour eviter de revenir sur la fiche elle-meme;
- la sortie produit pose aussi:

```txt
secondevie:open-gallery-on-arrival = true
```

- `app/page.jsx` contient un petit script inline qui pose:

```txt
data-sv-force-gallery-entry="true"
```

avant peinture quand l'arrivee correspond a une entree galerie;

- `src/index.css` masque alors `[data-ssr-home]` et met le fond noir, ce qui
  evite le flash de landing;
- `HomeGalleryLauncher` monte ensuite l'overlay galerie automatiquement.

Resultat attendu:

- sortie produit -> pas de landing visible;
- galerie visible;
- URL peut redevenir `/` parce que le shell galerie a deja ce comportement;
- c'est acceptable tant que l'overlay galerie est monte.

### 5. Conservation de la home SEO statique

Une tentative de correction consistait a lire `searchParams` dans
`app/page.jsx` pour rendre directement la galerie si `?page=gallery`.

Probleme observe:

- le build passait `/` en route dynamique (`ƒ /`);
- ce n'etait pas souhaitable pour la home SEO.

Solution finale:

- ne pas lire `searchParams` cote serveur;
- garder `/` statique (`○ /`);
- utiliser uniquement un bootstrap client inline minimal pour masquer la home
  avant peinture quand necessaire.

Validation:

- apres build propre, `/` reste statique dans le rapport Next.

### 6. Documentation AGENTS mise a jour

`AGENTS.md` a ete mis a jour pour documenter:

- image mobile en `object-fit: cover`;
- mecanisme de retour galerie;
- flag session `secondevie:open-gallery-on-arrival`;
- bootstrap `data-sv-force-gallery-entry`;
- position du bouton sortie desktop;
- validations effectuees.

## Invariants critiques a ne pas casser

### Invariant mobile Router

Avant toute modification marketplace mobile, lire `alertemobile.md`.

Invariant a conserver dans `src/Router.jsx`:

```jsx
const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;
```

Ne pas remplacer par:

```jsx
const shouldUseMobileGalleryScroll = isGalleryDetailOverlay;
```

Pourquoi:

- galerie mobile et detail produit legacy partagent le shell fixe;
- si la galerie mobile sort du shell fixe, l'image et le bloc bas peuvent se
  decaler sur vrai mobile;
- les handlers `marketplace-gallery-scroll`, `data-native-scroll-region`,
  `onTouchStart`, `onTouchMove`, `onTouchEnd` doivent rester coherents.

### Ne pas relancer deux experiences produit

Ne pas recreer:

- `ProductPageExperience`;
- `ProductDetailRouteExperience`;
- une nouvelle grosse ile client produit qui masque un rendu SSR different.

La route produit doit rester:

```txt
page.jsx -> ProductDetailServerView -> ProductDetailShellIsland + ProductDetailActionsIsland
```

### Ne pas rendre `/` dynamique pour `?page=gallery`

Ne pas utiliser `searchParams` dans `app/page.jsx` juste pour detecter
`?page=gallery`, sauf decision explicite.

Raison:

- cela fait passer `/` en route dynamique dans le build;
- la home doit rester statique/SEO autant que possible;
- le bootstrap actuel suffit a eviter le flash de landing.

### Retour galerie

Le retour produit depend de ces elements ensemble:

- `secondevie:product-return:v1`;
- `secondevie:open-gallery-on-arrival`;
- `data-sv-force-gallery-entry`;
- auto-open dans `HomeGalleryLauncher`;
- restauration scroll dans `src/app.jsx`.

Si un agent change un seul morceau sans tester le flux complet, le bug peut
revenir.

## Validations effectuees pendant la session

Commandes passees avec succes apres corrections:

```bash
npm run lint
npm run mobile:contract
npm run build
npm run perf:budget
```

Validation importante:

- quand plusieurs serveurs Next locaux etaient ouverts, `perf:budget` a echoue
  avec un `main.js` enorme et routes a `0 CSS`;
- cause: une instance `next dev` sur `3000` reecrivait `.next`;
- correction: couper les instances Next locales, refaire `npm run build`, puis
  relancer `npm run perf:budget`.

Etat final du budget apres build propre:

- budget OK;
- `/` reste statique (`○ /`);
- route produit reste dans le budget.

Controle Playwright final sur `http://127.0.0.1:3000`:

- URL produit testee:

```txt
/produit/buffet-VdMQLvZvXJL7mKVxCBvb
```

- viewport desktop:

```txt
1916 x 1030
```

Observations:

- `legacy:false`;
- image visible: `435 x 580`;
- bouton sortie: `44 x 44`, position `x=1232 y=124`;
- bouton dans la zone visuelle, pas sur la colonne titre;
- 500 ms apres clic sortie:
  - `homeVisible:false`;
  - `overlay:true`;
  - `.marketplace-gallery-shell:true`;
- apres montee:
  - galerie visible;
  - 10 cartes produit;
  - console sans erreur sur ce controle local.

Controle mobile precedent sur `http://127.0.0.1:3002`:

- viewport:

```txt
412 x 915
```

Observations:

- image centrale `objectFit: cover`;
- frame et image `387 x 567`;
- `legacy:false`;
- swipe sortie -> galerie visible.

## Warnings connus

En local sur certains ports, il peut y avoir:

```txt
Access to fetch at publicCatalog ... blocked by CORS
Catalogue public cache indisponible, fallback Firestore
AppCheck desactive
```

Ces warnings etaient attendus en localhost selon le contexte de test. La
galerie utilisait le fallback Firestore. Ne pas confondre ces warnings avec un
bug de rendu produit.

## Points encore legacy ou a finir plus tard

### Galerie Next native

La galerie n'est pas encore totalement une route Next native SSR avec cartes
produit rendues serveur. L'ideal final reste:

- route galerie Next native;
- produits rendus serveur;
- interactions client par ilots;
- scroll/filtre/favori/panier en client limite;
- suppression progressive du shell legacy public.

Il ne faut pas confondre cette limite avec la page produit: la fiche produit
directe est deja native Next.

### Detail ouvert depuis ancienne galerie

Le fichier `ArchitecturalProductDetail.jsx` reste dans le code pour des flux
legacy encore presents. Il ne faut pas le supprimer sans migrer completement
la galerie et les overlays restants.

### Page devis

La page devis a ete un symptome initial du meme probleme de double experience.
Elle possede une couche SSR SEO et conserve une partie de l'experience client.
La session actuelle s'est concentree ensuite sur le produit, qui etait le plus
critique.

## Recommandations pour le prochain agent

1. Toujours commencer par verifier le port reel utilise par le navigateur.
   Plusieurs `next dev` / `next start` ouverts ont deja cree de fausses
   conclusions.

2. Avant build/perf, couper les serveurs Next qui peuvent reecrire `.next`.

3. Pour tester le retour produit:

```txt
ouvrir /produit/...
cliquer le bouton X desktop ou swipe sortie mobile
verifier a 500 ms que la home SSR est masquee
verifier apres montee que .marketplace-gallery-shell est present
verifier qu'il y a des cartes produit
```

4. Pour tester mobile:

```txt
viewport 390/412 px
ouvrir produit
verifier rail mobile horizontal
ouvrir Details
scroll description bas puis haut
second pull haut/bas ferme la sheet
swipe sortie renvoie galerie
```

5. Ne pas traiter un simple ecart visuel par une nouvelle route ou une nouvelle
   experience parallele. La lecon de cette session est exactement l'inverse:
   moins de doublons, une route produit canonique.

6. Si la galerie est migree plus tard, garder l'objectif:

```txt
SSR produit visible
SSR galerie visible
iles client uniquement pour interactions
aucun flash landing entre produit et galerie
```

## Fichiers touches dans cette session

Principaux fichiers de code:

- `app/page.jsx`
- `app/HomeGalleryLauncher.jsx`
- `app/produit/[slugOrId]/page.jsx`
- `src/app.jsx`
- `src/index.css`
- `src/kit/marketplace/ProductDetailServerView.jsx`
- `src/kit/marketplace/ProductDetailShellIsland.jsx`
- `src/kit/marketplace/ProductDetailActionsIsland.jsx`
- `src/kit/marketplace/components/ProductCard.jsx`
- `src/kit/marketplace/CategoryPage.jsx`
- `src/kit/marketplace/WishlistView.jsx`
- `scripts/audit-product-page-direct.mjs`

Fichiers supprimes:

- `src/kit/marketplace/ProductPageExperience.jsx`
- `src/kit/marketplace/ProductDetailRouteExperience.jsx`

Documentation:

- `AGENTS.md`
- `PRODUCT_DETAIL_NEXT_NATIVE_SESSION_REPORT.md`

## Conclusion

L'avancee majeure de cette conversation est la clarification de la page produit:
elle n'est plus une superposition confuse entre SSR, SPA legacy et pont client.
La route produit a maintenant une structure Next plus saine:

```txt
serveur pour contenu + SEO
petites iles client pour media et actions
retour galerie controle
pas de flash landing
design proche legacy
```

La prochaine grande etape logique n'est pas de refaire la page produit encore
une fois. C'est de migrer progressivement la galerie vers une route Next native
avec la meme discipline: SSR visible, iles client ciblees, et aucun doublon
d'experience.
