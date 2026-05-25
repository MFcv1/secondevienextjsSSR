# Audit scroll desktop galerie - 2026-05-24

## Perimetre

Audit demande pour comprendre les lags/sauts au premier chargement froid desktop de la home/galerie Seconde Vie, surtout pendant un scroll rapide vers `Nouveautes`, `Petits Prix`, puis les sections basses.

Contraintes respectees:

- `AGENTS.md`, `NEXTJS_OPTIMIZATION_ROADMAP.md` et `alertemobile.md` relus avant audit.
- `git status --short` execute en premier: worktree propre au debut.
- Aucun refactor comportemental applicatif.
- Invariant mobile conserve: `const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;`.
- Mesures Playwright/CDP faites en cache froid, viewport desktop `1440x950`, CPU throttle x4, cache navigateur desactive, storage/cookies nettoyes.

Artifacts:

- Script: `scripts/audit-gallery-scroll-lag.mjs`
- Seconde Vie local: `logs/scroll-audit/seconde-vie-local/2026-05-24T20-21-46-205Z-summary.json`
- Trace Seconde Vie: `logs/scroll-audit/seconde-vie-local/2026-05-24T20-21-46-205Z-trace.json`
- Debongout: `logs/scroll-audit/debongout/2026-05-24T20-22-09-516Z-summary.json`
- Trace Debongout: `logs/scroll-audit/debongout/2026-05-24T20-22-09-516Z-trace.json`

## Chemin de rendu initial

`/` est servi par `app/page.jsx`. La route rend une couche SSR SEO, mais sur la home `ClientApp` est monte immediatement, sans `defer`. `app/ClientApp.jsx` charge dynamiquement `../src/app.jsx` avec `ssr: false`; le shell galerie legacy prend donc le relais cote client des que le chunk est disponible.

Composants charges au premier affichage:

- `ClientApp` depuis `app/page.jsx`.
- `src/app.jsx`, puis `AuthProvider`, `Router`, `SEO`, `ArchitecturalHeader`, `AnnouncementBanner`, `GlobalMenu`, `ToastProvider`.
- `GalleryView` via `React.lazy` dans `src/Router.jsx`.
- `MarketplaceLayout`, puis `PremiumMegaMenu`, `MarketplaceHero`, `CategoryRail`, `ReassuranceSection`, `ProductSections`.
- `AnalyticsProvider` est lazy, mais il a ete charge avant le premier scroll dans la mesure, via idle/fallback.
- `BeforeAfterSection` et `InstagramSection` etaient deja charges avant le scroll dans la mesure locale, a cause des delais desktop des slots differes.

Imports notables:

- `src/app.jsx` importe statiquement `GlobalMenu`, Firebase config, Firestore helpers, Functions, Framer Motion, `Router`, header et bannieres.
- `src/Router.jsx` lazy-load bien les routes lourdes admin/checkout/wishlist/detail produit, mais importe statiquement `bumpPublicCatalogVersion` depuis le domaine admin.
- `MarketplaceLayout.jsx` importe statiquement hero, rail, mega menu, reassurance et `ProductSections`; les sections basses sont lazy mais peuvent etre montees par timer desktop.

Admin et routes privees:

- Les chunks de routes admin, checkout et wishlist n'ont pas ete charges sur la galerie publique pendant la mesure.
- Le code route est declare via `React.lazy`, pas precharge pendant le scroll observe.
- En revanche, une partie du shell commun non specifique galerie reste dans le bundle initial, notamment `GlobalMenu` et un import admin-adjacent dans `Router`.

Detail produit:

- Aucune page `/produit/...` ni donnee detail produit n'a ete fetch en arriere-plan pendant la mesure.
- Le chunk composant `ProductDetail` a bien ete charge sans intention utilisateur pendant les sections basses, via le preload idle de `src/Router.jsx` apres 9 s sur les vues galerie/categorie/wishlist.

## Nouveautes et Petits Prix

Fichiers lus:

- `src/kit/marketplace/components/ProductSections.jsx`
- `src/kit/marketplace/components/ProductGridSection.jsx`
- `src/kit/marketplace/components/ProductCard.jsx`
- `src/utils/imageUtils.js`
- `src/index.css`

Constats code:

- `NOUVEAUTES_PAGE_SIZE = 10`.
- `PETITS_PRIX_PAGE_SIZE = 10`.
- `ProductGridSection` rend toutes les cartes recues, sans virtualisation.
- Chaque `ProductCard` non prioritaire cree 2 `IntersectionObserver`: un pour demander l'image proche, un pour activer le reveal visible.
- Chaque carte pose aussi un timer de fallback.
- Quand une carte devient proche/visible/chargee, elle peut declencher au minimum 3 updates React: `isImageRequested`, `isImageRevealActive`, `isImageLoaded`, plus le reset au changement d'item.
- Les requetes image sont limitees par une file client a 4 requetes concurrentes et 80 ms de delai.

Constats runtime:

- Pendant `Nouveautes`, le snapshot DOM montre deja 20 cartes montees: 10 `Nouveautes` + 10 `Petits Prix`.
- `Petits Prix` est donc monte avant d'etre visible, via le slot differe desktop.
- A ce moment, 10 images produits etaient demandees, 1 chargee, 10 encore en attente de reveal.
- Pendant `Petits Prix`, 20 images produits etaient demandees et chargees.

Conclusion: le pipeline ne charge pas toutes les images au repos, mais il ne se limite pas strictement aux seules images visibles pendant un scroll rapide. Les `rootMargin`, l'idle mounting de `Petits Prix`, la vitesse de scroll et la file de requetes font partir les images des cartes proches, puis les 10 cartes de `Petits Prix` au passage de section.

## Timeline mesuree

| Moment | Ce qui charge | Cout mesure | Interpretation |
| --- | --- | ---: | --- |
| Navigation froide | 52 requetes, 1.37 MB; 16 JS, 2 CSS, 24 images, 6 Firestore | 10 long tasks, 1505 ms; max 252 ms | Hydratation shell + hero/rail + premiers slots differes. |
| Avant premier scroll | JS galerie, analytics, BeforeAfter, Instagram deja charges | 329.8 KB JS; 883.5 KB images | Le premier ecran n'est pas seul; des sections basses commencent deja a entrer. |
| Scroll vers `Nouveautes` | 10 thumbs produit + placeholder + Footer/Testimonials/Newsletter chunks | 14 requetes, 392.7 KB; 3 long tasks, max 186 ms | Premier burst produit + chunks bas pendant geste scroll. |
| Scroll vers `Petits Prix` | 10 thumbs produit, images before/after, images hero | 15 images, 951.4 KB; 2 long tasks, max 169 ms | Plus gros burst reseau/decode du scenario; deux thumbs font ~107 KB chacun. |
| Sections basses | ProductDetail chunk idle, logo/footer image | 5 requetes, 133.0 KB; 4 long tasks, max 66 ms | Preload detail produit sans intention utilisateur. |
| Trace complete | Scripting 8170 ms, layout/style 2126 ms, paint/raster/composite 8179 ms, image decode 1060 ms, GC 376 ms | frame gap max 366.6 ms; 26 gaps >50 ms, 14 >100 ms | Le lag est mixte: CPU + raster/paint + image decode, pas seulement reseau. |

## Tableau charges responsables

| Charge | Pourquoi | Fichier responsable | Cout mesure |
| --- | --- | --- | ---: |
| Shell client galerie immediat | Home monte `ClientApp` sans defer | `app/page.jsx`, `app/ClientApp.jsx`, `src/app.jsx` | 16 JS avant scroll, 329.8 KB |
| Galerie legacy hydratee | `src/app.jsx` monte app, providers, header, router | `src/app.jsx` | scripting trace 8170 ms |
| Firestore local avant scroll | Sur localhost, endpoint `publicCatalog` non utilise; fallback Firestore | `src/app.jsx` | 6 requetes Firestore, 651 bytes |
| AnalyticsProvider | Lazy mais declenche avant scroll apres idle | `src/app.jsx` | chunk `1698`, 3.7 KB |
| BeforeAfter + Instagram | Slots differes desktop avec idle delay | `MarketplaceLayout.jsx` | chunks `4404` + `5307` avant scroll |
| `Nouveautes` images | 10 cartes proches demandent thumbnails | `ProductSections.jsx`, `ProductCard.jsx`, `imageUtils.js` | 10 thumbs, ~306-43 KB chacun |
| `Petits Prix` images | Section montee avant visible, puis images demandee au passage | `MarketplaceLayout.jsx`, `ProductSections.jsx`, `ProductCard.jsx` | 10 thumbs + autres images; segment 951.4 KB |
| Footer/Testimonials/Newsletter | Lazy chunks charges pendant premier scroll | `src/app.jsx`, `MarketplaceLayout.jsx` | 16.7 KB JS pendant `Nouveautes` |
| ProductDetail chunk | Preload idle apres 9 s en galerie | `src/Router.jsx` | 48.8 KB JS pendant sections basses |
| Raster/paint images et sections | Images revelees, layers, clipping, effets visuels | `ProductCard.jsx`, `index.css`, sections Framer Motion | paint/raster/composite 8179 ms |

## Comparaison Debongout

Mesure identique sur `https://debongout-paris.com/`, viewport `1440x950`, CPU x4, cache froid.

| Metric | Seconde Vie local | Debongout |
| --- | ---: | ---: |
| Requetes totales | 87 | 519 |
| Requetes avant scroll | 52 | 427 |
| JS avant scroll | 16 / 329.8 KB | 296 / 2.63 MB |
| Images avant scroll | 24 / 883.5 KB | 55 / 2.48 MB |
| Long tasks total | 20 / 2443 ms | 69 / 13576 ms |
| Long task max | 252 ms | 1392 ms |
| Frame gap max | 366.6 ms | 1433.2 ms |
| Image decode trace | 1060 ms | 621 ms |
| Paint/raster/composite | 8179 ms | 3673 ms |
| Scripting | 8170 ms | 47217 ms |

Debongout n'est pas plus leger dans cette mesure. Il front-load beaucoup plus de JS et d'images, avec davantage de long tasks. La difference perceptible probable vient plutot du fait que beaucoup d'images produits sont deja chargees/decodees avant le scroll: le scroll lui-meme declenche peu d'images vers `Nouveautes`. Seconde Vie est plus econome au chargement initial, mais paie une partie du cout pendant le geste de scroll: thumbnails produits, decode, raster, chunks lazy et sections idle.

Cette comparaison ne prouve pas que Debongout soit objectivement plus performant; elle montre surtout une strategie differente: Debongout charge massivement avant interaction, Seconde Vie differe mais declenche du travail pendant le premier scroll.

## Addendum - froid vs cache chaud

Apres retour utilisateur, une mesure complementaire a ete faite avec le meme profil Chromium persistant:

1. premier passage avec cache vide mais cache navigateur active;
2. deuxieme passage dans le meme profil, cache chaud.

Artifact: `logs/scroll-audit/cache-compare-2026-05-24T21-29-11-397Z.json`

| Metric | Passage froid | Passage cache chaud | Difference utile |
| --- | ---: | ---: | --- |
| Requetes totales | 68 / 2.21 MB | 70 / 1.75 MB | Le nombre reste proche, mais beaucoup de JS passe en disk cache. |
| JS total | 22 / 395.3 KB | 22 / 572 bytes | Les chunks ne coutent presque plus rien en cache chaud. |
| JS pendant scroll produit | 6 / 65.5 KB | 6 / 0 byte disk cache | Les lazy chunks ne bloquent plus le scroll chaud. |
| Images total | 34 / 1.65 MB | 34 / 1.64 MB, dont 20 disk cache | Les memes images sont referencees, mais une partie est servie depuis cache disque. |
| Long tasks total | 21 / 3032 ms | 16 / 2152 ms | Le cache retire environ 880 ms de long tasks dans cette passe. |
| Long tasks `Nouveautes` | 9 / 1177 ms | 5 / 622 ms | Le segment sensible est presque divise par deux. |
| Frame gaps >100 ms | 18 | 11 | Le freeze percu baisse nettement en cache chaud. |
| Frame gap max | 500 ms | 300 ms | Le pire trou d'image est plus court en cache chaud. |

Ce qui explique le symptome "a froid ca freeze, en cache ca va":

- Au premier passage, les chunks lazy charges pendant ou autour du scroll (`Testimonials`, `Newsletter`, `Footer`, `ProductDetail`) doivent etre recuperes, parses et executes. En deuxieme passage, ils sont en disk cache.
- Au premier passage, les images produit et certaines images basses doivent etre telechargees, decodees puis rasterisees au moment ou la page scrolle. En cache chaud, une partie de ce cout reseau disparait, et le decode/raster est souvent moins brutal grace aux caches navigateur/GPU.
- Le probleme visible vient surtout du fait que ce travail arrive pendant le geste de scroll, pas avant ni apres. C'est exactement le pattern qui donne l'impression "la carte graphique va rendre l'ame".

La zone qui saute aux yeux apres cette comparaison n'est pas une micro-optimisation: `MarketplaceLayout.jsx` monte des sections basses par timers desktop tres courts (`900`, `1300`, `1700`, `2200`, `2600` ms), pendant que `ProductCard.jsx` declenche deux observers + plusieurs `setState` par carte, et que `Router.jsx` precharge `ProductDetail` apres idle. A froid, tout cela se combine avec telechargement/decode/raster des images; en cache chaud, la meme architecture reste presente mais le cout est partiellement masque.

## Addendum - scroll immediat utilisateur

Une mesure supplementaire a simule le geste utilisateur direct: ouverture de `/`, `DOMContentLoaded`, puis molette immediate au centre du viewport, sans attendre la fin du preloader galerie.

Resultat Seconde Vie:

- A `t ~= 956 ms`, `scrollY = 0`, l'app n'est pas encore marquee hydratee.
- De `t ~= 1411 ms` a `t ~= 3829 ms`, `documentElement` porte `gallery-entry-scroll-lock`, `body` et `html` sont en `overflow: hidden`; toutes les roues restent bloquees, `scrollY = 0`.
- A `t ~= 4012 ms`, le lock disparait.
- Les roues suivantes passent enfin: `scrollY = 760` a `t ~= 4226 ms`, `1520` a `t ~= 4476 ms`, `2280` a `t ~= 4655 ms`.

Pendant cette fenetre de scroll immediat, Seconde Vie charge encore environ `1.23 MB` de ressources: fonts, 9 scripts, 26 images, Firestore. Le runtime observe 8 frame gaps >100 ms pendant le segment de scroll immediat, avec un max a 300 ms.

Ce point explique le ressenti "je scrolle mais ca ne descend pas, puis ca saute/freezze": sur desktop froid, le scroll natif est explicitement verrouille pendant l'entree galerie/hydratation. Ce n'est pas comparable a Debongout dans le geste direct: Debongout n'a pas ce lock applicatif; dans la mesure immediate, il finit deja a `scrollY ~= 3826` apres les roues, meme si son reseau et son JS sont lourds.

Conclusion ajustee: la difference principale n'est pas seulement "plus ou moins de choses a charger". Debongout laisse le document scroller pendant que le navigateur charge. Seconde Vie bloque le scroll desktop pendant une phase client, puis declenche/continue du travail images, sections, chunks et raster au moment ou le scroll est enfin libere. C'est une difference d'architecture d'entree et de timing du travail, pas une petite variation de poids.

## Reponses explicites

### Est-ce que le site charge des pages detail produit en arriere-plan ?

Pas de page `/produit/...` ni data detail produit observee. Oui pour le chunk React `ProductDetail`: il est precharge en arriere-plan apres 9 s par `src/Router.jsx`, sans intention utilisateur, et apparait pendant les sections basses.

### Est-ce que l'admin ou des routes privees se chargent sur la galerie publique ?

Non pour les chunks de routes admin/checkout/wishlist. Ils ne sont pas apparus dans le reseau. Le shell initial contient toutefois des imports statiques non strictement galerie: `GlobalMenu` dans `src/app.jsx` et `bumpPublicCatalogVersion` dans `src/Router.jsx`.

### Est-ce que Firebase/Auth/Firestore/Analytics travaillent pendant le premier scroll ?

Auth non: aucun chunk `firebase/auth`, aucune requete `identitytoolkit`. Firestore travaille avant scroll en local, parce que localhost utilise le fallback Firestore au lieu du endpoint `publicCatalog`; aucune rafale Firestore pendant les segments de scroll mesures. Analytics charge son chunk avant le scroll dans cette simulation; pas de burst reseau analytics local pendant le scroll.

### Est-ce que `Nouveautes` et `Petits Prix` chargent uniquement les images visibles ?

Non strictement. Les images ne partent pas toutes au repos, mais le chargement suit les cartes proches/visibles avec `rootMargin`, et `Petits Prix` est deja monte avant d'etre visible. En scroll rapide, 10 images partent vers `Nouveautes`, puis 10 autres vers `Petits Prix`.

### Combien d'images produits partent reellement lors d'un scroll rapide ?

20 images produits dans ce scenario: 10 pendant `scroll_to_nouveautes`, 10 pendant `scroll_to_petits_prix`. A cela s'ajoutent des images before/after et hero dans le segment `Petits Prix`.

### Est-ce que les variants d'image sont adaptes a la taille CSS reelle des cartes desktop ?

Le choix de largeur est coherent: a 1440 px desktop, les cartes font environ `20vw`, soit ~288 px en CSS; `sizes` indique `20vw`, et Chrome demande surtout les variantes `_thumb_` 480w. Le probleme mesure n'est donc pas un mauvais `srcset` de base, mais le poids de certains thumbnails et le moment ou ils sont demandes/decodees.

### Est-ce que les thumbnails sont encore trop lourds ?

Oui pour une partie du catalogue. Les thumbs courants sont ~30-43 KB, mais deux thumbs du segment `Petits Prix` font ~107 KB chacun. Pour une grille de cartes desktop, ces cas sont trop lourds, surtout quand 10 images arrivent dans le meme segment de scroll.

### Est-ce que les animations Framer Motion / carrousels / counters se declenchent trop tot ?

Partiellement oui. Les sections basses lazy peuvent monter par timer desktop avant visibilite. `InstagramSection` contient un intervalle de compteur et un carousel active par intersection; les chunks `Instagram` et `BeforeAfter` etaient deja charges avant scroll. La trace montre aussi beaucoup de `FireAnimationFrame`, `TimerFire`, `Layerize`, raster et paint.

### Est-ce que les sections basses sont montees trop tot ?

Oui. `BeforeAfter`, `PetitsPrix`, `Instagram`, `Testimonials`, `Newsletter` ont des `desktopIdleDelay` courts dans `MarketplaceLayout.jsx`. Cela explique la presence de sections/chunks/images avant ou pendant le premier scroll.

### Est-ce que le lag vient du CPU, du GPU, du reseau, ou d'un mix ?

Mix. Les mesures les plus fortes sont scripting CPU et paint/raster/composite, tous deux autour de 8.17 s dans la trace CPU x4. L'image decode pese 1.06 s, et le reseau declenche des rafales visibles pendant les scrolls. Le reseau seul n'explique pas les saccades; les arrivees d'images provoquent aussi decode/raster/paint pendant que React et les timers travaillent.

## Causes probables classees

1. Burst images pendant scroll rapide, surtout `Petits Prix`.
   - Preuve: `scroll_to_petits_prix` charge 15 images / 951.4 KB, dont 10 thumbs produit et deux thumbs ~107 KB.
   - Impact: fort, car le cout arrive pendant le geste.

2. Sections basses montees trop tot sur desktop.
   - Preuve: 20 product cards montees pendant `Nouveautes`; `BeforeAfter`/`Instagram` deja charges avant scroll; `Testimonials`/`Newsletter`/Footer pendant premier scroll.
   - Impact: fort, car cela deplace du travail hors ecran dans le moment sensible.

3. Shell client public trop large pour une home galerie.
   - Preuve: 16 JS avant scroll, trace scripting 8170 ms, `ClientApp` monte immediatement.
   - Impact: fort sur machines lentes ou CPU throttle.

4. Pression paint/raster/composite.
   - Preuve: paint/raster/composite 8179 ms; top events `Layerize`, `RasterizerTaskImpl`, `RasterTask`, `DisplayItemList::Raster`.
   - Impact: fort sur scroll avec images, clipping, sections animees.

5. Preload idle ProductDetail sans intention utilisateur.
   - Preuve: chunks ProductDetail charges pendant sections basses, 48.8 KB JS.
   - Impact: moyen sur premier scroll long; faible sur scroll court, mais inutile sans intention.

## Fausses pistes eliminees

- "C'est uniquement les images": faux. Scripting et raster/paint sont aussi lourds que le decode image.
- "Admin se charge en public": faux pour les chunks de routes admin.
- "Auth travaille pendant le scroll public": faux sur cache/storage froid.
- "Les pages detail produit sont prefetchees": faux pour les pages/data; vrai seulement pour le chunk composant apres idle.
- "Debongout est fluide parce qu'il est plus leger": non confirme. La mesure montre beaucoup plus de JS, d'images et de long tasks chez Debongout.

## Plan de correction

### Niveau 1 - Quick wins sans risque

| Correction | Fichier | Changement precis | Gain attendu | Risque UX |
| --- | --- | --- | --- | --- |
| Supprimer ou allonger les `desktopIdleDelay` courts | `src/kit/marketplace/MarketplaceLayout.jsx` | Passer `BeforeAfter`, `PetitsPrix`, `Instagram`, `Testimonials`, `Newsletter` en IO-only, ou delais >8-12 s | Moins de chunks/images pendant premier scroll | Sections basses peuvent apparaitre un peu plus tard si scroll tres rapide |
| Retirer le preload idle ProductDetail | `src/Router.jsx` | Garder prefetch uniquement sur hover/focus/click | -48.8 KB JS pendant scroll bas | Premier clic produit legerement moins anticipe sans hover |
| Reporter le footer | `src/app.jsx` | Charger Footer par intersection proche bas plutot que timer 5200 ms | Evite chunk/footer image pendant premier scroll | Footer visible avec leger delai sur scroll tres rapide |
| Pauser le carousel hero avant premier idle stable | `MarketplaceLayout.jsx`, `MarketplaceHero.jsx` | Ne pas charger slide suivante pendant scroll initial | Moins d'images hero pendant `Petits Prix` | Animation hero demarre plus tard |
| Recompresser les thumbs lourds | Pipeline Storage/images | Cibler les thumbs >60 KB, surtout ceux a ~107 KB | Moins de decode/raster/reseau | Attention qualite image carte |

### Niveau 2 - Optimisations moyennes

| Correction | Fichier | Changement precis | Gain attendu | Risque UX |
| --- | --- | --- | --- | --- |
| Reduire les observers par carte | `ProductCard.jsx`, `ProductGridSection.jsx` | 1 observer par carte, ou observer par section avec delegation | Moins d'objets IO/timers et updates React | Logique reveal a retester mobile |
| Monter `Petits Prix` uniquement proche viewport | `MarketplaceLayout.jsx` | Ne plus le monter via idle; conserver hauteur reservee | Evite 10 cartes + observers hors ecran | Apparition a soigner en scroll rapide |
| Lazy `GlobalMenu` | `src/app.jsx` | Charger le menu complet sur intention ouverture/preparation | Shell initial plus leger | Menu peut avoir une premiere ouverture un peu plus lente |
| Dynamic import admin invalidation | `src/Router.jsx` ou code admin | Ne pas importer admin invalidation dans shell public | Bundle public plus propre | Risque faible si action admin bien isolee |

### Niveau 3 - Refactor plus profond

| Correction | Zone | Changement precis | Gain attendu | Risque UX |
| --- | --- | --- | --- | --- |
| Shell galerie public dedie | `app/page.jsx`, `src/app.jsx`, `Router` | Isoler une app publique galerie minimale, separer admin/commerce/auth/detail | Gros gain JS/hydration | Refactor structurel, tests larges requis |
| Sections galerie en islands | Next App Router | SSR/ISR sections publiques, clients islands seulement pour interactions | Moins de JS initial et moins de hydration | Architecture a cadrer dans roadmap |
| RUM scroll/INP production | Observabilite App Hosting | Mesurer frame gaps, INP, long tasks reels par segment | Decisions basees sur vrais visiteurs | Ajout instrumentation a gouverner |

## Validations

Apres ajout du script d'audit:

- `node --check scripts/audit-gallery-scroll-lag.mjs`
- `npm run build`
- `npm run lint`
- `npm run mobile:contract`
- `npm run perf:budget`

Resultats: toutes les commandes sont passees. Budget observe: home publique ~106.46 KB JS gzip initial, CSS publique ~46.52 KB gzip, plus gros chunk JS differe ~102.67 KB gzip. Le controle mobile confirme que l'invariant galerie/detail mobile reste present.

## Addendum - correctif applique 2026-05-24

Correctif cible:

- `src/app.jsx` ne pose plus `gallery-entry-scroll-lock` sur desktop. Le lock d'entree galerie est maintenant conditionne a `(max-width: 1023px)`, et le rideau garde `pointer-events-auto` seulement sous `lg`; sur desktop il devient `lg:pointer-events-none`.
- Le reset `window.scrollTo(0, 0)` de fin d'entree initiale `/` n'est plus execute sur desktop. Il reste conserve sur mobile pour le contrat galerie/detail.
- Le footer n'est plus charge par timer court `5200 ms`; il passe par une sentinelle `IntersectionObserver` proche viewport avec fallback long `22000 ms`.
- `src/Router.jsx` ne precharge plus automatiquement le chunk `ProductDetail` apres 9 s en galerie/categorie/wishlist. Les prefetch intentionnels hover/focus/clic restent inchanges.
- `src/kit/marketplace/MarketplaceLayout.jsx` n'utilise plus les `desktopIdleDelay` courts des sections basses. `BeforeAfter`, `Petits Prix`, `Instagram`, `Testimonials` et `Newsletter` montent par intersection proche viewport, avec hauteur reservee.
- Invariant mobile conserve:
  `const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;`

Artifacts apres correctif:

- Scroll immediat: `logs/scroll-audit/seconde-vie-immediate-after/2026-05-24T21-50-21-245Z-summary.json`
- Scroll segmente: `logs/scroll-audit/seconde-vie-standard-after/2026-05-24T21-48-28-019Z-summary.json`

Resultats scroll immediat desktop, cache desactive, CPU x4, viewport `1440x950`, molette des `DOMContentLoaded`:

| Metric | Avant audit | Apres correctif |
| --- | ---: | ---: |
| Fenetre avec `gallery-entry-scroll-lock` | ~1411 ms a ~3829 ms | 0 echantillon |
| `body/html overflow:hidden` pendant entree | oui | 0 echantillon |
| Premier scroll effectif | ~4226 ms, apres liberation du lock | 1708 ms, soit 295 ms apres que le document devient scrollable |
| `ProductDetail` pendant scroll immediat | possible apres idle long | non |
| Footer pendant scroll immediat | possible pendant premier scroll long | non |
| `Petits Prix` monte pendant scroll immediat calibre | non mesure | non |
| Testimonials / Newsletter pendant scroll immediat calibre | non mesure | non |

Resultats scroll segmente:

- `before_scroll`: 10 cartes montees, uniquement `Nouveautes`; `Petits Prix` n'est pas monte.
- `scroll_to_nouveautes`: 0 chunk JS lazy, 0 long task, 0 frame gap >50 ms; seules 10 images produit `Nouveautes` partent.
- `scroll_to_petits_prix`: `Petits Prix` monte seulement au passage proche viewport; les chunks `BeforeAfter`, `Instagram`, `Testimonials` et `Newsletter` peuvent alors charger par intersection, plus par timer desktop court.
- `ProductDetail` et `Footer` ne chargent pas dans les segments de scroll mesures.

Validations apres correctif:

```powershell
node --check scripts/audit-gallery-scroll-lag.mjs
npm run lint
npm run mobile:contract
npm run build
npm run perf:budget
node scripts/audit-gallery-scroll-lag.mjs --mode=immediate --steps=5 --deltaY=80 --url=http://127.0.0.1:4300/ --label=seconde-vie-immediate-after --trace=false
node scripts/audit-gallery-scroll-lag.mjs --url=http://127.0.0.1:4300/ --label=seconde-vie-standard-after --trace=false
```

Limite restante: les gaps les plus longs du scroll immediat viennent encore de l'hydratation galerie et des images hero/categories chargees pendant la creation du document scrollable. Le saut "je scrolle mais rien ne descend, puis tout part quand le lock tombe" est corrige; le cout initial du shell client reste a traiter dans une passe hydration plus large.

## Addendum - roadmap scroll appliquee 2026-05-25

Changements ajoutes apres retour utilisateur sur le blocage newsletter:

- `scripts/audit-gallery-scroll-lag.mjs` ajoute `--mode=newsletter` pour rejouer un scroll froid normal jusqu'a la zone newsletter/footer. Ce mode controle explicitement le lock desktop, l'overflow global, le footer, le placeholder, les long tasks, les frame gaps et les requetes.
- `package.json` ajoute `npm run perf:scroll` et `npm run perf:scroll:newsletter`. Les deux commandes lancent l'audit avec `--assert`, pour transformer les regressions scroll en echec local.
- `src/app.jsx` remplace le placeholder footer vide par un squelette footer leger avec hauteur reservee. Le footer peut encore charger en differe, mais la page ne se termine plus visuellement sous la newsletter pendant le chargement.
- `src/kit/marketplace/MarketplaceLayout.jsx` ne prime plus le carousel hero au demarrage froid: seule l'image active est chargee au depart; le preload/auto-advance des slides suivantes attend un idle long et reste annule si l'utilisateur a deja scrolle loin du hero.
- `src/kit/marketplace/components/MarketplaceHero.jsx` pause aussi la progression visuelle du hero tant que le carousel n'est pas prime.
- `src/kit/layout/Footer.jsx` differe l'image "livraison" via IntersectionObserver avec dimensions reservees, pixel transparent et garde sur le layout visible.
- `src/kit/layout/Footer.jsx` initialise maintenant la media-query mobile/desktop au premier rendu pour ne pas observer la variante cachee; l'image livraison ne part plus qu'une fois sur desktop froid.
- `src/kit/marketplace/components/InstagramSection.jsx` retire `AnimatePresence` sur le carousel Instagram et garde les cartes montees avec transitions `transform`/`opacity`, pour une apparition plus douce et moins de churn React quand la section arrive.

Resultats locaux principaux, cache desactive, CPU x4, viewport `1440x950`:

| Scenario | Resultat |
| --- | --- |
| `npm run perf:scroll` | OK assertions: 0 lock desktop, 0 overflow hidden, premier scroll effectif 250 ms apres document scrollable |
| `npm run perf:scroll:newsletter` | OK assertions: 0 lock desktop, 0 overflow hidden, 0 `bottomWithoutFooterOrPlaceholder` |
| Requetes images hero pendant scroll newsletter | `imagehero/2.webp`, `imagehero/3.webp`, `imagehero/4.webp` absentes du premier scroll |
| Poids segment scroll newsletter | environ 1.43 MB avant pause hero -> environ 0.88 MB apres passe roadmap et garde media footer |
| Images segment scroll newsletter | 683 KB juste avant le garde media footer -> 551 KB final; `footer-delivery-light.webp` une seule requete |

Validations:

```powershell
node --check scripts/audit-gallery-scroll-lag.mjs
npm run lint
npm run mobile:contract
npm run build
npm run perf:budget
npm run perf:scroll -- --url=http://127.0.0.1:4300/ --label=seconde-vie-immediate-smooth-final-3
npm run perf:scroll:newsletter -- --url=http://127.0.0.1:4300/ --label=seconde-vie-newsletter-smooth-final-3
```

Limite restante: les frame gaps >100 ms existent encore sous CPU x4, mais ils sont maintenant lies au cout d'hydratation du shell galerie et aux chunks initiaux. Les prochains gains demandent d'isoler davantage le shell public galerie et les widgets interactifs, pas de remettre du scroll lock ou des timers courts.

## Addendum - roadmap hydratation appliquee 2026-05-25

Objectif de cette passe: reduire les gaps restants qui ne venaient plus du scroll lock, du footer ou de la newsletter, mais du travail d'hydratation/chunks initiaux pendant le premier scroll froid.

Changements appliques:

- Firebase est separe en trois niveaux: `firebaseEnv.js` pour les constantes legeres, `firebaseCore.js` pour l'app, `firebaseLazy.js` pour Firestore/Functions/Auth/AppCheck a la demande.
- `src/app.jsx` n'importe plus Firestore/Functions statiquement sur le chemin public et dedoublonne les appels `publicCatalog` en vol.
- `src/Router.jsx` charge Firestore et l'invalidation catalogue seulement pour les actions admin/produit qui en ont besoin.
- `AuthContext`, `Footer`, `theme.js`, `MarketplaceLayout` et `AnnouncementBanner` utilisent le runtime Firebase lazy au lieu d'importer directement Firestore/Functions dans le bundle initial.
- Les lectures decoratives `theme_settings`, `contact_info`, `gallery_app` et `announcement_config` sont repoussees a `45 s` + idle; les valeurs par defaut/cache restent affichees.
- `GlobalMenu` passe en `React.lazy`, avec preload seulement sur intention.

Resultats finaux locaux, cache desactive, CPU x4, viewport `1440x950`:

| Scenario | Resultat |
| --- | --- |
| Scroll immediat `seconde-vie-immediate-hydration-env-split-final-2` | assertions OK, 0 lock desktop, 0 overflow hidden, premier scroll effectif `177 ms` apres document scrollable |
| Requetes scroll immediat | 46 total, 1 `cloud-function`, 0 Firestore reseau pendant le segment mesure |
| Long tasks scroll immediat | 11, total `1805 ms`, max `329 ms` |
| Frame gaps scroll immediat | max `383 ms`, 6 gaps >100 ms |
| Scroll newsletter `seconde-vie-newsletter-hydration-env-split-final-2` | assertions OK, 0 lock, 0 overflow hidden, 0 `bottomWithoutFooterOrPlaceholder` |
| Footer/newsletter | placeholder footer a `1460 ms`, footer reel a `3105 ms`, newsletter montee a `3882 ms` |
| Requetes newsletter | 51 total, 1 `cloud-function`, 0 Firestore reseau pendant le scroll |
| Frame gaps newsletter | max `567 ms`, 7 gaps >100 ms |

Validations:

```powershell
npm run lint
npm run mobile:contract
npm run build
npm run perf:budget
npm run perf:scroll -- --url=http://127.0.0.1:4300/ --label=seconde-vie-immediate-hydration-env-split-final-2
npm run perf:scroll:newsletter -- --url=http://127.0.0.1:4300/ --label=seconde-vie-newsletter-hydration-env-split-final-2
```

Conclusion: le scroll desktop froid n'est plus bloque et les lectures Firebase decoratives ne tombent plus pendant le premier scroll. Les gaps >100 ms restants sont maintenant un sujet d'architecture d'hydratation: shell galerie client encore large, chunks UI/Framer Motion, parse/execute React et raster/paint d'images sous CPU x4. La prochaine optimisation structurante doit etre un decoupage en ilots SSR/client de la galerie publique, avec interactions chargees progressivement.
