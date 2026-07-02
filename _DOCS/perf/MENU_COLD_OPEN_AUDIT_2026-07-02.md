# Audit ouverture a froid menus desktop/mobile

Date: 2026-07-02

## Perimetre

Audit cible sur les menus publics de la galerie:

- mega menu horizontal desktop sous le header;
- menu principal plein ecran declenche par le bouton `Menu`, sur desktop et mobile.

Baseline lue avant audit: `NEXT_NATIVE_ARCHITECTURE_BASELINE.md`.
Contrat mobile lu: `alertemobile.md`.

## Carte du code actif

Header public:

- `src/kit/marketplace/ArchitecturalHeaderServer.jsx` rend le header serveur, la recherche, les actions, `GlobalMenuTriggerIsland` et `PremiumMegaMenuLazyIsland`.

Mega menu horizontal desktop:

- `src/kit/marketplace/PremiumMegaMenuLazyIsland.jsx` charge `PremiumMegaMenuIsland` via `next/dynamic`, `ssr: false`.
- `src/kit/marketplace/PremiumMegaMenuIsland.jsx` contient les items, les panneaux, le hover/focus, le prefetch et les timers d'ouverture/fermeture.
- `src/index.css` contient les transitions `.premium-mega-menu-positioner`, `.mega-menu-panel`, `.mega-menu-col-*`.

Menu principal desktop/mobile:

- `src/kit/marketplace/GlobalMenuTriggerIsland.jsx` contient le bouton `Menu`, le preload, le fallback skeleton, le portal et l'etat open/closing/ready.
- `src/kit/marketplace/GlobalMenuPanelAuthIsland.jsx` ajoute l'etat auth/admin, compte panier/wishlist, prefetch routes et charge `GlobalMenu`.
- `src/kit/layout/GlobalMenu.jsx` est le gros composant visuel desktop/mobile, avec `framer-motion`, scroll lock, images, categories, services, auth/cart/wishlist callbacks.
- `src/index.css` contient les animations desktop `.global-menu-desktop-content` et `.global-menu-reveal-container`.

Fichiers lourds constates:

| Fichier | Lignes | Taille source |
| --- | ---: | ---: |
| `src/kit/layout/GlobalMenu.jsx` | 1179 | 64.2 KB |
| `src/kit/marketplace/PremiumMegaMenuIsland.jsx` | 366 | 18.7 KB |
| `src/kit/marketplace/GlobalMenuTriggerIsland.jsx` | 254 | 10.9 KB |
| `src/kit/marketplace/GlobalMenuPanelAuthIsland.jsx` | 250 | 8.5 KB |

## Mesures

Commande desktop lancee sur le serveur local existant:

```bash
NEXT_BASE_URL=http://127.0.0.1:3000 npm run perf:menu-desktop -- --path=/galerie --settle=650
```

Resultat:

- shell menu visible apres clic: 490 ms;
- premier conteneur desktop visible: 596 ms;
- 5 conteneurs visibles: 1577 ms;
- long tasks pendant ouverture: 4, total 284 ms, max 78 ms;
- echec du gate: requetes App Check/recaptcha pendant l'ouverture.

Fichiers generes:

- `logs/menu-desktop-audit/2026-07-02T12-08-25-670Z-summary.json`
- `logs/menu-desktop-audit/2026-07-02T12-08-25-670Z-open.png`

Mesure mobile Playwright ponctuelle sur `390x844`:

- shell menu visible apres clic: 147 ms;
- panneau mobile stabilise: 1098 ms;
- long tasks pendant ouverture: 3, total 189 ms, max 70 ms;
- requetes App Check/recaptcha egalement observees.

Indication depuis `.next/static/chunks` deja present dans le workspace, sans rebuild frais:

- chunk `GlobalMenu`: environ 2169.8 KB en dev;
- chunk `GlobalMenuPanelAuthIsland`: environ 527.4 KB en dev;
- chunk `PremiumMegaMenuIsland`: environ 164.2 KB en dev;
- chunk `LegacyLoginModalFullIsland`: plus de 3 MB en dev;
- chunks Firebase auth/firestore/appcheck presents et lourds.

Ces tailles dev ne sont pas des budgets production, mais elles confirment la structure: le menu principal tire un gros graphe client a froid.

## Diagnostic

### 1. Le menu principal est couple a auth/Firebase

`GlobalMenuPanelAuthIsland.jsx` importe `preloadLoginModal` depuis `HeaderAccountIsland.jsx`.
Quand le menu s'ouvre, l'effet `panelOpen` appelle `preloadLoginModal()` puis prefetch de nombreuses routes.

`preloadLoginModal()` importe `LegacyLoginModalFullIsland.jsx`.
Or `LegacyLoginModalFullIsland.jsx` importe au top-level:

- `firebase/functions`;
- `../config/firebase`;
- `getFirebaseAuth`, `loadAuthModule`.

`src/kit/config/firebase.js` initialise App Check au top-level via `initializeAppCheckBeforeLegacyServices()`.

Conclusion: ouvrir le menu public peut reveiller recaptcha/App Check et des chunks login/Firebase, meme si l'utilisateur veut seulement voir la navigation.

### 2. Le menu principal desktop a des delais visuels volontaires

Dans `GlobalMenu.jsx`, `MENU_SEQUENCE` et les animations CSS sequencent les blocs:

- sidebar: 0.14 s;
- categories: 0.38 s;
- discovery: 0.62 s;
- atelier: 0.86 s;
- services: 1.12 s.

En CSS, `.global-menu-reveal-container` ajoute une animation de 680 ms avec `animation-delay`.
Donc le dernier bloc peut naturellement apparaitre apres environ 1.8 s. Ce n'est pas seulement du chargement: le tempo est code.

### 3. Le mobile ne beneficie pas du preload idle desktop

`GlobalMenuTriggerIsland.jsx` warm le menu apres 260 ms uniquement si `(min-width: 1024px)`.
Sur mobile, le premier tap repose surtout sur `onPointerDown`, donc le chunk commence a charger quasiment au moment de l'action utilisateur.

Conclusion: le mobile peut avoir un shell rapide mais un contenu qui se stabilise tard.

### 4. `GlobalMenu.jsx` melange trop de responsabilites

Le fichier contient dans un seul composant:

- donnees de navigation;
- donnees visuelles images/services;
- desktop layout;
- mobile layout;
- animations framer-motion;
- scroll lock desktop/mobile;
- callbacks auth/cart/wishlist/navigation;
- warm images.

Cette structure rend les optimisations chirurgicales difficiles: une modification mobile force a comprendre le gros menu desktop, et inversement.

### 5. Le mega menu horizontal est plus leger mais pas direct non plus

`PremiumMegaMenuIsland.jsx` est plus petit, mais:

- charge en client-only via `next/dynamic`;
- ouvre avec deux `requestAnimationFrame`;
- anime les colonnes via CSS avec delais de 110 ms et 180 ms;
- prefetch les liens au hover.

Ce menu n'a pas le meme probleme Firebase que le menu principal, mais son premier hover depend quand meme de l'hydratation et du chunk client.

## Recommandations

### P0 - Decoupler login/auth du simple affichage du menu

Objectif: ouvrir le menu ne doit pas importer `LegacyLoginModalFullIsland` ni initialiser App Check.

Actions proposees:

- retirer `preloadLoginModal()` de l'effet `panelOpen`;
- preloader la modale login uniquement sur action explicite `Connexion`;
- extraire une API `openLogin()` qui charge le login a la demande;
- eviter tout import top-level de `../config/firebase` dans un chemin precharge par la navigation publique.

Critere de sortie:

- `npm run perf:menu-desktop -- --path=/galerie --settle=650` ne doit plus voir de requete `appcheck`, `recaptcha`, `auth` ou `firestore` juste pour ouvrir le menu public.

### P1 - Rendre le premier etat du menu immediat

Objectif: au clic/tap, afficher le contenu utile sans attendre le scenario complet.

Actions proposees:

- reduire fortement `MENU_SEQUENCE` pour desktop, ou reserver le stagger aux elements secondaires;
- rendre sidebar/categories visibles des le premier frame;
- sur mobile, supprimer le long stagger des rows critiques;
- garder les images en lazy mais ne pas bloquer la perception du menu sur elles.

Critere de sortie:

- desktop: premier contenu utile < 250 ms en environnement chaud, < 500 ms a froid local;
- mobile: panneau utilisable < 500 ms apres tap.

### P2 - Reorganiser les fichiers pour modifications chirurgicales

Proposition d'arborescence:

```text
src/kit/marketplace/navigation/
|-- data.js
|-- menuEvents.js
|-- MenuTriggerIsland.jsx
|-- GlobalMenuShell.jsx
|-- GlobalMenuDesktop.jsx
|-- GlobalMenuMobile.jsx
|-- GlobalMenuScrollLock.js
|-- GlobalMenuAuthActions.jsx
|-- PremiumMegaMenuIsland.jsx
|-- PremiumMegaMenuContent.jsx
`-- preload.js
```

Decoupage attendu:

- `data.js`: categories, liens, tiles, services, sans React state;
- `GlobalMenuShell.jsx`: overlay, portal, role dialog, geometry;
- `GlobalMenuDesktop.jsx`: rendu desktop seulement;
- `GlobalMenuMobile.jsx`: rendu mobile seulement;
- `GlobalMenuScrollLock.js`: logique scroll lock testable et isolee;
- `GlobalMenuAuthActions.jsx`: login/logout/cart/wishlist, charge seulement si action ou bloc compte necessaire;
- `preload.js`: preloads explicites, avec separations `preloadMenuView`, `preloadMenuImages`, `preloadLogin`.

### P3 - Ajouter un gate mobile dedie

Le repo a deja `perf:menu-desktop`. Il manque l'equivalent mobile.

Ajouter un script `scripts/audit-mobile-global-menu.mjs` qui mesure:

- tap -> dialog visible;
- tap -> panel mobile stabilise;
- long tasks;
- requetes Firebase/App Check;
- screenshot mobile.

## Ordre d'intervention conseille

1. P0: supprimer le preload login/Firebase pendant ouverture du menu.
2. P1: raccourcir les animations visibles du menu principal.
3. P3: ajouter le gate mobile pour ne plus juger au ressenti seul.
4. P2: faire le decoupage fichiers, apres stabilisation des mesures.

Ne pas commencer par un grand refactor sans P0/P1: le risque serait de deplacer le probleme au lieu de le supprimer.

## Patch applique le 2026-07-02

Objectif du patch: conserver les animations sequencees, mais retirer de la fenetre critique d'ouverture tout ce qui n'est pas necessaire au premier affichage du menu.

Changements:

- `GlobalMenuPanelAuthIsland.jsx`: retrait du `preloadLoginModal()` lance apres `panelOpen`; le login est charge seulement lors de l'action explicite `Connexion`.
- `GlobalMenuPanelAuthIsland.jsx`: `preloadGlobalMenu()` ne precharge plus les images du menu; il charge uniquement le composant.
- `GlobalMenuPanelAuthIsland.jsx`: les `router.prefetch()` sont decales apres 900 ms puis planifies en idle.
- `GlobalMenu.jsx`: le warm global des images est decale apres 1200 ms puis planifie en idle.
- `GlobalMenu.jsx`: l'image atelier restante est marquee `loading="lazy"`, `decoding="async"` et `fetchPriority="low"`.
- `GlobalMenuTriggerIsland.jsx`: suppression du delai artificiel de 40 ms avant reveal; le shell s'ouvre au prochain frame, meme si le gros composant finit de charger apres.

Validation desktop:

```bash
NEXT_BASE_URL=http://127.0.0.1:3000 npm run perf:menu-desktop -- --path=/galerie --settle=650
```

Resultat apres patch:

- gate passe;
- shell menu visible apres clic: 479 ms;
- premier conteneur desktop visible: 588 ms;
- 5 conteneurs visibles: 1593 ms;
- long tasks pendant ouverture: 2, total 125 ms, max 66 ms;
- requetes Firebase/App Check/Auth/Firestore pendant l'ouverture: 0.

Fichiers generes:

- `logs/menu-desktop-audit/2026-07-02T12-42-30-575Z-summary.json`
- `logs/menu-desktop-audit/2026-07-02T12-42-30-575Z-open.png`

Validation mobile ponctuelle Playwright `390x844` apres patch:

- shell menu visible apres tap: 59 ms;
- panneau mobile stabilise: 883 ms;
- long tasks pendant ouverture: 1, total 66 ms;
- requetes Firebase/App Check/Auth/Firestore pendant l'ouverture: 0.

Comparaison directe:

| Mesure | Avant | Apres |
| --- | ---: | ---: |
| Desktop long tasks ouverture | 4 / 284 ms | 2 / 125 ms |
| Desktop Firebase/App Check ouverture | 9 requetes | 0 |
| Mobile shell visible | 147 ms | 59 ms |
| Mobile panneau stabilise | 1098 ms | 883 ms |
| Mobile long tasks ouverture | 3 / 189 ms | 1 / 66 ms |
| Mobile Firebase/App Check ouverture | 9 requetes | 0 |

Reste a traiter separement:

- decouper `GlobalMenu.jsx` en sous-composants desktop/mobile/data/scroll-lock pour rendre les prochaines optimisations plus chirurgicales;
- si un freeze persiste en device reel, profiler le chunk `GlobalMenu` lui-meme et le cout `framer-motion`/icones au montage, sans supprimer le sequencing visuel voulu.

## Patch complementaire fluidite le 2026-07-02

Objectif: reduire encore le travail React et CPU pendant l'ouverture sans supprimer le sequencing visuel voulu.

Changements:

- `GlobalMenu.jsx`: detection `matchMedia('(min-width: 1024px)')` et rendu d'une seule variante a la fois. En mobile, le desktop menu n'est plus monte; en desktop, le mobile menu n'est plus monte.
- `GlobalMenu.jsx`: suppression de la boucle `requestAnimationFrame` continue qui refigeait `window.scrollY`; remplacement par un lock statique `html/body` et conservation des handlers wheel/touch existants.
- `GlobalMenuPanelAuthIsland.jsx`: les abonnements distants Firestore pour les compteurs connectes attendent environ 1000 ms + idle apres ouverture.
- `scripts/audit-mobile-global-menu.mjs`: nouveau gate mobile permanent.
- `package.json`: ajout de `npm run perf:menu-mobile`.

Validation apres patch complementaire:

```bash
NEXT_BASE_URL=http://127.0.0.1:3000 npm run perf:menu-desktop -- --path=/galerie --settle=650
NEXT_BASE_URL=http://127.0.0.1:3000 npm run perf:menu-mobile -- --path=/galerie --settle=650
```

Resultat desktop:

- gate passe;
- shell menu visible apres clic: 506 ms;
- premier conteneur desktop visible: 638 ms;
- 5 conteneurs visibles: 1613 ms;
- long tasks pendant ouverture: 3, total 187 ms, max 72 ms;
- requetes Firebase/App Check/Auth/Firestore pendant l'ouverture: 0.

Resultat mobile:

- gate passe;
- shell menu visible apres tap: 62 ms;
- panneau mobile stabilise: 732 ms;
- desktop menu monte en mobile: 0 conteneur;
- long tasks pendant ouverture: 0;
- requetes Firebase/App Check/Auth/Firestore pendant l'ouverture: 0.

Nouveau gate disponible:

```bash
npm run perf:menu-mobile
```

Reste a traiter separement si besoin:

- extraire physiquement `GlobalMenuDesktop` / `GlobalMenuMobile` / data / scroll-lock dans des fichiers dedies pour alleger la maintenance;
- profiler un build production si le ressenti reel differe du dev local;
- envisager un remplacement progressif de certaines animations `framer-motion` par CSS, uniquement si le profiler montre encore un cout au montage.

## Patch split physique le 2026-07-02

Objectif: eviter que le mobile telecharge/parse tout le rendu desktop du menu, et inversement.

Changements:

- `src/kit/layout/GlobalMenu.jsx` devient un shell leger: viewport, portal content, scroll-lock, geometry, actions de navigation.
- `src/kit/layout/GlobalMenuDesktop.jsx` contient le rendu desktop, les donnees desktop, les images, les icones desktop et `framer-motion` desktop.
- `src/kit/layout/GlobalMenuMobile.jsx` contient le rendu mobile, les donnees mobile, les icones mobile et `framer-motion` mobile.
- `GlobalMenuPanelAuthIsland.jsx` precharge maintenant le chunk correspondant au viewport via `preloadCurrentGlobalMenuView()`.

Validation apres split physique:

```bash
NEXT_BASE_URL=http://127.0.0.1:3000 npm run perf:menu-desktop -- --path=/galerie --settle=650
NEXT_BASE_URL=http://127.0.0.1:3000 npm run perf:menu-mobile -- --path=/galerie --settle=650
```

Resultat desktop:

- gate passe;
- shell menu visible apres clic: 488 ms;
- premier conteneur desktop visible: 590 ms;
- 5 conteneurs visibles: 1560 ms;
- long tasks pendant ouverture: 2, total 108 ms, max 54 ms;
- requetes Firebase/App Check/Auth/Firestore pendant l'ouverture: 0;
- chunk menu charge: `GlobalMenu_jsx.js` + `GlobalMenuDesktop_jsx.js`.

Resultat mobile:

- gate passe;
- shell menu visible apres tap: 80 ms;
- panneau mobile stabilise: 690 ms;
- desktop menu monte en mobile: 0 conteneur;
- long tasks pendant ouverture: 0;
- requetes Firebase/App Check/Auth/Firestore pendant l'ouverture: 0;
- chunk menu charge: `GlobalMenu_jsx.js` + `GlobalMenuMobile_jsx.js`.

Fichiers de preuve:

- `logs/menu-desktop-audit/2026-07-02T13-01-57-317Z-summary.json`
- `logs/menu-mobile-audit/2026-07-02T13-01-57-288Z-summary.json`

Reste a traiter separement si besoin:

- factoriser les donnees communes `primaryLinks`/categories/services sans recreer un chunk commun trop lourd;
- profiler en build production pour verifier les tailles gzip/brotli reelles;
- remplacer progressivement certains `motion.*` simples par CSS seulement si le profiler production montre encore un cout d'execution.
