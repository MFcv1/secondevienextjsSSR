# Chantier préchargement des fiches produit — 2026-09-13

Propriétaire : équipe Seconde Vie. Statut : **livré sur le sandbox** (App Hosting
`build-2026-09-13-003`, deployment ID `sv-mu02qx5w-ebb336d956bf`), retour
utilisateur positif sur ordinateur ; recette sur vrai téléphone non faite par
l'agent. Commits locaux sur `main`, **non poussés** sur GitHub.

Ce document retrace tout le travail de la session pour permettre un audit
indépendant : demande, audit, erreurs d'analyse corrigées en cours de route,
correctifs, déploiements et incidents, mesures, tests, limites et retour arrière.

## 1. Demande

Depuis la galerie (`/`, `/galerie`), l'ouverture d'un meuble montrait l'image
centrale, le fond flouté et les miniatures avec un délai d'environ une seconde,
parfois tous en chargement simultané. L'utilisatrice percevait les pages
catégorie comme instantanées et voulait le même comportement sur la galerie,
sur ordinateur, laptop et mobile, sans dégrader la fluidité du scroll.

## 2. Architecture concernée

| Rôle | Fichier |
| --- | --- |
| Préchargement des cartes (galerie **et** catégories) | `src/kit/marketplace/GalleryGridActionsIsland.jsx` (`observeVisibleWarmup`) |
| File de préchargement, sélection des variantes | `src/utils/imageUtils.js` |
| Média de carte, attributs de préchargement | `src/kit/marketplace/ProductCardMediaServer.jsx` |
| Cartes galerie / catégorie | `GalleryProductCardServer.jsx` (via `GalleryLiveProductGridIsland.jsx`), `CategoryServerView.jsx` |
| Fiche : image centrale, fond flouté, rail de miniatures | `src/kit/marketplace/ProductDetailShellIsland.jsx` |
| Lecture du catalogue matérialisé (`cards` / `full`) | `src/lib/server/materializedCatalog.js`, `app/api/catalog/route.js` |
| Scroll interne galerie mobile / `display: contents` desktop | `src/index.css` (`.marketplace-gallery-scroll`) |

Sur la fiche, l'image centrale utilise `detailFast` (repli `medium`), le fond
flouté et chaque miniature du rail la variante `thumb` (480 px, repli `card`,
`medium`…). Les cartes affichent `thumb320`/`thumb384`/`card` : leur image ne
remplit donc jamais le cache du fond flouté.

## 3. Audit et constats (avant correctif)

Environnement de mesure : navigateur intégré de l'agent sur le sandbox, viewport
émulé (1440×900 et 375×812), panneau souvent en arrière-plan
(`visibilityState: hidden`), cache navigateur partagé entre mesures. **Ce n'est
pas un vrai téléphone** ; les chiffres mobiles sont indicatifs.

### 3.1 Galerie ordinateur : aucun préchargement (cause principale)

Galerie et catégories appellent le même îlot. Seule la racine de
l'`IntersectionObserver` différait :

- catégories : `root: null` (viewport) ;
- galerie : toujours `document.getElementById('marketplaceGalleryScroll')`.

À partir de 1024 px, `src/index.css` passe ce conteneur en `display: contents`
(aucune boîte). Mesure sur `build-2026-09-10-007` à 1440 px :
`getBoundingClientRect()` = 0×0, racine d'intersection 0×0, **0 carte détectée
sur 20** ; avec `root: null`, 5/20. Le préchargement de la galerie ne se
déclenchait jamais sur laptop/desktop.

### 3.2 Galerie mobile : racine correcte mais file lente

À 375 px le conteneur est un vrai scroll (`display: block`, `overflow-y: auto`),
racine 375×2244, 2/20 cartes détectées au chargement : l'observer fonctionnait.
Après défilement jusqu'aux Nouveautés (10 cartes visibles) : 2 `detailFast`
préchargées à 5 s ; 4 `detailFast` + 6 `medium` à 11 s. La file (2 images à la
fois, ordre de la page) traitait environ 2 images par 1,2 s.

### 3.3 Fond flouté et miniatures jamais préchargés (galerie et catégories)

Le préchargement ne visait que l'image centrale. Les données `scope=cards`
(`functions/src/catalog/publicProjection.js`, `toPublicCard`) ne contiennent que
la première photo : les URLs des autres miniatures étaient inconnues des cartes.

### 3.4 Observation hors périmètre : trois produits aux variantes PNG

Contrôle des 36 produits du catalogue (en-têtes des fichiers Storage) : trois
produits créés le 2026-09-05 ont toutes leurs variantes au format **PNG** malgré
l'extension `.webp` et le type `image/webp` (`file` : « PNG image data »).

| Produit | `thumb384` | `thumb` | `card` | `detailFast` | `medium` |
| --- | --- | --- | --- | --- | --- |
| buffet art déco | 380 Ko | 561 Ko | 1,4 Mo | 1,8 Mo | 2,3 Mo |
| armoire art déco | 492 Ko | 724 Ko | 1,8 Mo | 2,3 Mo | 2,9 Mo |
| buffet 70's | 375 Ko | 553 Ko | 1,4 Mo | 1,9 Mo | 2,3 Mo |
| 33 autres (WebP) | 10–35 Ko | 16–51 Ko | 23–120 Ko | 38 Ko ou absent | 25–126 Ko |

Cause probable : `canvasToWebpFile` (`src/utils/imageUtils.js`) ne vérifie pas
`blob.type` ; un navigateur qui ne sait pas encoder WebP via canvas renvoie du
PNG. 33 produits n'ont pas de `detailFast` (repli `medium`, poids normal).
Storage sert `cache-control: public, max-age=31536000, immutable` (TTFB à froid
~0,41–0,45 s). **Aucune correction appliquée** : l'utilisatrice a demandé de
rester sur la galerie.

### 3.5 Erreurs d'analyse de l'agent, corrigées ensuite

À auditer comme telles :

1. L'agent a d'abord présenté le problème comme propre au desktop ; la lenteur
   mobile existait aussi (file lente, §3.2), sans être le même défaut.
2. Il a proposé de corriger l'upload et de ré-encoder des produits, hors demande ;
   proposition retirée.
3. Il a admis que « les catégories préchargent déjà tout ». **Faux** : la mesure
   du §5.1 montre que le fond flouté et les miniatures étaient aussi téléchargés
   au clic sur les catégories. L'impression d'instantané venait du cache
   navigateur des pièces déjà ouvertes, d'où le côté « aléatoire » ressenti.

## 4. Étape 1 — racine d'observation (commit `58f44cf`)

- `getVisibleWarmupRoot(surface)` : pour la galerie, `#marketplaceGalleryScroll`
  n'est retenu que s'il est un vrai conteneur de scroll (`display` ≠ `contents`
  et `overflow-y` `auto`/`scroll`), sinon `null` comme les catégories.
- L'observer est reconstruit au franchissement de `(max-width: 1023px)` ; les
  images déjà amorcées restent dédoublonnées par la file existante.
- Aucun autre réglage modifié (concurrence 2, Save-Data/2G, vidage à la pression).

Mesure après déploiement (`build-2026-09-13-002`) : galerie 1440 px, **5 images
de fiche préchargées sans clic** (0 avant) ; racine en `display: contents`.

## 5. Étape 2 — fond flouté et miniatures (commit `83ab615`)

### 5.1 Mesure qui a motivé l'étape

Sur `build-2026-09-13-002`, catégorie Buffets → « Buffet art déco »
(`y4PvJgKDMs2d6NjrplWr`, 10 photos), première ouverture : image centrale
(`medium`) déjà en cache ; **10 `thumb` téléchargées au clic** (départ +85 à
+121 ms, durée 473 à 733 ms), puis 9 `medium` des photos suivantes par pas de
140 ms (préchauffage existant de la fiche). Deuxième ouverture du même meuble :
toutes les requêtes en 1 à 3 ms (cache). Galerie → « dzdzd » : image centrale en
cache, 1 `thumb` en 358 ms.

### 5.2 Changements

- **Source unique des URLs** : `getProductDetailThumbSrc(image)`
  (`thumb || card || medium || src || large || full`) exportée par
  `imageUtils.js` ; `ProductDetailShellIsland.jsx` l'utilise pour `getThumbSrc`
  et `getBackdropSrc` (même formule qu'avant, désormais partagée).
- **Données** : `queryMaterializedCatalog` ajoute à chaque carte `scope=cards`
  un tableau `detailThumbs`, calculé depuis `snapshot.full` de la même release
  (`getProductDetailThumbSrcs`, 16 URLs max) et mémoïsé par objet snapshot
  (`WeakMap`). Aucune republication du catalogue ni déploiement Functions. Les
  pages galerie/catégorie et l'API `/api/catalog?scope=cards` (utilisée par
  `GalleryLiveProductGridIsland` au changement de version) en bénéficient.
- **Cartes** : `ProductCardMediaServer` expose `data-product-thumbs-warmup`
  (URLs séparées par des espaces), alimenté par galerie et catégories.
- **Politique de préchargement** (`GalleryGridActionsIsland.jsx`) :
  - carte proche de l'écran (observer existant, marge 100 %) : image centrale +
    première miniature (= fond flouté) ;
  - scroll arrêté 450 ms : cartes visibles à 60 % au moins, triées du centre
    vers les bords, 4 au plus sous 1024 px et 8 au-delà : toutes les miniatures ;
  - survol (après 160 ms), focus, pression : toutes les miniatures ; la pression
    vide d'abord les files spéculatives puis passe en tête ;
  - écoute `scroll` en capture sur `document` (couvre le scroll interne mobile),
    nettoyée au démontage ; files vidées au changement de version catalogue.
- **File dédiée aux miniatures** (`scheduleProductThumbWarmups`) : 4 en
  parallèle, `fetchPriority` basse (haute à la pression), sans décodage (cache
  HTTP seulement), états `queued/loading/done` pour dédoublonner et promouvoir ;
  elle ne ralentit pas la file des grandes images (toujours 2). Save-Data/2G :
  aucune anticipation, comme avant.
- **Fiche** : miniatures du rail en `loading="eager"` (au lieu de `lazy` hors
  image active), `fetchPriority` basse conservée.

### 5.3 Mesures après déploiement (`build-2026-09-13-003`)

Meubles jamais ouverts dans la session de mesure, 1440×900 :

| Parcours | Avant le clic | Au clic |
| --- | --- | --- |
| Catégorie Commodes → « Paire de chevets » (6 photos) | 18 `thumb` préchargées sur la page | **0 requête**, image centrale et 6/6 miniatures en cache |
| Galerie (Nouveautés) → « buffet 70's » (4 photos, PNG lourd) | image centrale en cache | 2 `thumb` sur 4 téléchargées (451 et 624 ms) |

Le second cas s'explique par la file occupée par les miniatures PNG de 375 à
724 Ko des trois produits du §3.4, en tête des Nouveautés. Le clic de mesure
(`element.click()`) n'émet pas `pointerdown` : la promotion « pression » n'a pas
joué, contrairement à un vrai clic ou toucher.

Poids : build local, `galerie.html` compressé gzip -9 **128,9 Ko avec /
104,6 Ko sans** les URLs (+24,3 Ko) ; 49 cartes équipées (88 Ko d'attributs
bruts) ; `categorie/buffets.html` : 15 cartes, 32,8 Ko d'attributs bruts.
Catalogue : 36 produits, 8,0 photos en moyenne (13 max).

## 6. Travail panier inclus (commit `621f4da`)

Des modifications panier non commitées étaient présentes au début de la session,
non écrites par l'agent : `CartPageView`, `CartSurface`, `CartPage.module.css`,
suppression de `CartSidebar`, adaptations `CartPanelIsland` et
`LazyCartPanelIsland`, docs et tests associés. Sur demande explicite de
l'utilisatrice, elles ont été commitées telles quelles et déployées.

Vérifications de l'agent : tests `cart-persistence-contract` (5/5) et
`public-release-contract` (5/5), lint sans erreur, absence de référence restante
à `CartSidebar`, ouverture du panier sur le sandbox (dialogue plein écran, état
vide). **Non fait** : revue fonctionnelle détaillée, `tests/commerce/browser/cart-ui.spec.mjs`
(Playwright), parcours d'ajout et de checkout.

## 7. Déploiements et incidents

Version servie au départ : `build-2026-09-10-007` (sources applicatives
`ffadb9f` ; `0d285da` n'ajoutait que docs, script et test).

| Heure (UTC) | Construction | Contenu | Résultat |
| --- | --- | --- | --- |
| 16:30 | `build-2026-09-13-001` | HEAD `0d285da` + étape 1, sans le panier | SUCCEEDED (servie brièvement, `sv-mu016f0u…`) |
| 16:35 | `build-2026-09-13-002` | `621f4da` (étape 1 + panier) | SUCCEEDED, `sv-mu01cx73-ea053c914df6` |
| 17:14 | `build-2026-09-13-003` | `83ab615` (+ étape 2) | SUCCEEDED, **servie**, `sv-mu02qx5w-ebb336d956bf` |

Méthode : `scripts/firebase-apphosting-sandbox.cjs deploy --only
apphosting:secondevie-next-sandbox`, lancé depuis une **copie propre**
(`git worktree` détachée au commit visé), pour ne pas embarquer de fichiers non
commités (le déploiement App Hosting envoie le répertoire local). Copies
supprimées après usage.

Incidents :

1. `gcloud` refusait Python 3.9 : le shell non interactif ne chargeait pas
   `CLOUDSDK_PYTHON` de `~/.zshrc`. Relance avec
   `CLOUDSDK_PYTHON=$HOME/.local/bin/python3.11` et Node 22.23.2.
   Le premier échec a renvoyé le code 0 à cause d'un `| tail` sans `pipefail`.
2. L'utilisatrice a demandé d'inclure le panier pendant la construction du
   déploiement « étape 1 seule ». Le processus local a été arrêté, mais le
   rollout cloud `build-2026-09-13-001` était déjà créé et a abouti.
3. Le déploiement suivant a reçu **HTTP 409** (« unable to queue ») tant que 001
   tournait ; une boucle a attendu `SUCCEEDED` via l'API App Hosting (lecture
   seule) puis a relancé.
4. Pendant la bascule vers 002, une page galerie a été reçue sans CSS appliqué.
   Après `SUCCEEDED`, les trois feuilles CSS répondaient 200 et la mise en page
   était normale : état transitoire de rollout, non reproduit.

## 8. Commits et fichiers

| Commit | Objet | Fichiers |
| --- | --- | --- |
| `58f44cf` | racine d'observation galerie | `GalleryGridActionsIsland.jsx`, `tests/catalog/security.test.cjs`, `AGENTS.md`, `_DOCS/images/IMAGES_MEDIA.md`, ce document |
| `621f4da` | panier plein écran (travail préexistant) | 13 fichiers panier, docs, tests (§6) |
| `83ab615` | fond flouté et miniatures | `imageUtils.js`, `materializedCatalog.js`, `GalleryGridActionsIsland.jsx`, `ProductCardMediaServer.jsx`, `GalleryProductCardServer.jsx`, `CategoryServerView.jsx`, `ProductDetailShellIsland.jsx`, `security.test.cjs`, docs |

Le commit de documentation qui suit ajoute ce dossier complet et l'entrée de
`_DOCS/ETAT_PROJET.md`. `main` a 19 commits d'avance sur `origin/main` avant ce
commit ; rien n'a été poussé.

## 9. Tests et validations

Sous Node 22.23.2 :

- `node --test` : `tests/catalog/*.test.cjs` (7 fichiers : 1 + 12 + 1 + 2 + 3 +
  21 + 15), `tests/cart-persistence-contract.test.cjs` (5),
  `tests/public-release-contract.test.mjs` (5) : **65/65 réussis**.
- Contrat ajouté dans `tests/catalog/security.test.cjs` (test « images,
  categorie, warmup et navigation ») : racine via `getVisibleWarmupRoot`, refus
  de `display: contents`, fonctions partagées par la fiche, attribut
  `data-product-thumbs-warmup`, politique visible/intention, concurrence 4,
  jonction `detailThumbs`.
- `eslint` sur les fichiers modifiés : 0 erreur, 9 avertissements préexistants
  dans `ProductDetailShellIsland.jsx` (`no-img-element`, a11y).
- `pnpm build` (`.env.sandbox`) : réussi.
- Non lancés : suites complètes du dépôt, lint global, Playwright.

## 10. Limites et points d'audit suggérés

- **Vrai mobile non validé par l'agent** (émulation, onglet en arrière-plan).
  Vérifier en particulier le scroll interne galerie, l'arrêt de scroll et le
  toucher.
- **Produits PNG** (§3.4) : ils restent lents et saturent la file de miniatures
  sur la galerie ; correction possible par ré-encodage (scripts `sharp`
  existants, `--dry-run`, `--ids=`) et contrôle de `blob.type` à l'upload.
- **Données mobiles** : un arrêt de scroll peut précharger jusqu'à 4 meubles ×
  ~8 miniatures (~35 Ko en WebP, ~1 Mo par arrêt au pire), une seule fois par
  URL. Valeurs à challenger (`DWELL_*`, `MAX_CONCURRENT_THUMB_WARMUPS`).
- **Poids HTML/RSC** : +24 Ko gzip sur la galerie ; `detailThumbs` apparaît
  aussi dans la réponse `/api/catalog?scope=cards`.
- **Mémoïsation** : `WeakMap` indexée par l'objet snapshot retourné par le cache
  de release immuable ; une identité d'objet instable recalculerait sans erreur.
- **Cohérence d'URL** : la fiche et les cartes partagent la même fonction ; une
  divergence future de sélection de variante annulerait le gain sans erreur visible.
- **Rail `eager`** : à l'ouverture d'une fiche non préchargée, toutes les
  miniatures partent immédiatement (priorité basse).
- **Travail panier** : revue fonctionnelle à faire (§6).
- `main` non poussé ; déploiements faits depuis des commits locaux.

## 11. Protocole de vérification

1. Ouvrir le sandbox en **navigation privée** (sans cache).
2. Ordinateur, galerie : descendre aux Nouveautés, marquer une pause d'une
   demi-seconde, ouvrir un meuble hors des trois produits PNG. Attendu : image
   centrale, fond flouté et miniatures affichés ensemble.
3. Même chose depuis une catégorie, puis sur vrai téléphone.
4. Contrôle outillé (console, sur la fiche ouverte depuis une carte) :
   `performance.getEntriesByType('resource')` filtré sur `firebasestorage` et
   `startTime` postérieur au clic → aucune requête `_thumb_` attendue.
5. Dans le HTML : `data-product-thumbs-warmup` présent sur les cartes galerie
   et catégorie.

## 12. Retour arrière

- **Sandbox** : remettre en service `build-2026-09-13-002` (sans l'étape 2) ou
  `build-2026-09-10-007` (avant la session) depuis la console App Hosting, ou
  redéployer une copie propre du commit voulu avec le script sandbox.
- **Code** : `git revert 83ab615` (étape 2), `git revert 58f44cf` (étape 1) ;
  `621f4da` (panier) est indépendant.
