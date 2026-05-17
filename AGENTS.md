# ðŸ§  Instructions pour Codex (IA) - Switch Env

Ce document est spÃ©cifiquement destinÃ© aux assistants IA pour ne pas casser la structure des environnements.

---

## Code map
L'agent doit garder cette carte a jour lors de chaque creation, suppression, renommage ou deplacement de fichier. Si une modification change clairement le role d'un fichier, ajuster aussi son libelle. Garder la carte compacte : grouper les assets, logs, builds et dossiers temporaires au lieu de tout lister.

```text
.
|-- AGENTS.md : consignes agents et rapports; CLAUDE.md / GEMINI.md : consignes agents
|-- alertemobile.md : invariant mobile marketplace critique
|-- package*.json, next.config.mjs, eslint.config.mjs, jsconfig.json, tailwind.config.js, postcss.config.js
|-- apphosting.yaml, .firebaserc : configuration Firebase App Hosting sandbox
|-- app : routes Next App Router, SSR produit/categorie, loading/not-found/error, sitemap, robots et shell client
|-- tests, playwright.config.mjs : tests E2E et validations Playwright
|-- _DOCS : documentation maintenance Next/dependances
|-- firebase.json, .firebaseignore, firestore.rules, firestore.indexes.json, storage.rules
|-- functions-public : codebase Functions public isole pour `publicCatalog`, sans secrets Stripe/Gmail
|-- .env.sandbox.example / .env.production.example : modeles publics; vrais .env locaux ignores par Git
|-- deploy : dashboard npm de deploiement Firebase/App Hosting sandbox
|-- src
|   |-- Router.jsx, app.jsx, main.jsx, index.css
|   |-- kit/admin : back-office, analytics, commandes, SEO, users, exports CSV, docs/etudes techniques admin
|   |-- kit/commerce : panier, checkout, login, commandes client
|   |-- kit/marketplace : galerie, SEO visible, pages categorie/produit, layout, wishlist, devis
|   |-- kit/layout, kit/shared, kit/ui, kit/hooks, kit/contexts, kit/config
|   |-- vitrine : HomeView et sections de la page A propos (ancienne vitrine)
|   `-- assets, utils : images source et helpers
|-- functions
|   |-- index.js, helpers : Firebase Functions entrypoint/config/security
|   `-- src : analytics, auth, commerce, email, maintenance, public, seo, triggers
|-- public : favicons, manifest, images, video, rapport maintenance statique
|-- scripts : env bridge, SSR/mobile checks, maintenance audit, budget perf Next, perf/architecture compare, backfills/audits Storage/images et tooling safe
|-- MIGRATION_REPORT.md, COMPARISON.md, RUNBOOK.md, DATABASE_MIGRATION_PLAN.md, COMPLETION_AUDIT.md, ARCHITECTURE_BENCHMARK_DECISION.md, NEXTJS_OPTIMIZATION_ROADMAP.md, NEXTJS_SEO_ROADMAP.md, NEXTJS_HOME_LANDING_ROADMAP.md, NEXTJS_SSR_AUDIT_REPORT.md, NEXTJS_IMAGE_PIPELINE_AUDIT.md, GALLERY_COLD_SCROLL_OPTIMIZATION_REPORT.md
|-- imagehero, pageUI : references visuelles et notes UI
`-- .next, dist, node_modules, logs, .firebase : generes, hors carte
```

## NEXTJS OPTIMIZATION ROADMAP

Avant toute passe d optimisation specifique au clone Next.js SSR, lire `NEXTJS_OPTIMIZATION_ROADMAP.md`.

Cette roadmap cadre les leviers Next autorises et l ordre recommande:

- baseline et gates avant optimisation;
- cache serveur catalogue/produit;
- pages produit prerender/ISR;
- images produit premiere visite;
- reduction de l hydratation client;
- prefetch intelligent depuis la galerie;
- observabilite App Hosting.

Ne pas optimiser au hasard: chaque changement doit etre mesure avec les scripts existants, notamment `npm run perf:architecture`, et documente dans les rapports si le resultat change la decision technique.

## ALERTE MOBILE - A LIRE AVANT TOUTE MODIF MARKETPLACE MOBILE

Avant toute modification qui touche `src/Router.jsx`, la galerie, une page produit, le detail produit, le scroll mobile, `--marketplace-viewport-height`, `marketplace-gallery-shell`, `marketplace-gallery-scroll`, le scroll natif ou les handlers touch mobile, lire d'abord `alertemobile.md`.

Invariant critique a conserver dans `src/Router.jsx` :

```jsx
const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;
```

Ne jamais remplacer cette logique par `isGalleryDetailOverlay` seul. La galerie mobile et le detail produit partagent le shell fixe, le scroll lock et la hauteur viewport. Si on casse ce lien, l'image et le bloc bas du detail produit peuvent se decaler sur vrai mobile.

Test obligatoire apres toute modif mobile marketplace : ouvrir la galerie sur un vrai telephone, ouvrir un produit, appuyer autour du hint "Details" / fleche animee, verifier que rien ne descend, puis revenir galerie et retester sur un autre produit.

## Rapport agent - 2026-05-04

### Goal 1 - Env racine et IBAN/BIC

- Le fichier `.env` racine a ete supprime localement pour respecter la discipline projet : seuls `.env.sandbox` et `.env.production` doivent piloter Vite.
- Les variables `VITE_BUSINESS_IBAN` et `VITE_BUSINESS_BIC` ont ete conservees dans les deux fichiers suffixes, car elles servent uniquement a afficher les coordonnees bancaires sur les factures PDF client via `src/utils/generateInvoice.js`.
- Un commentaire a ete ajoute dans `.env.sandbox` et `.env.production` pour clarifier que ces coordonnees bancaires sont des donnees publiques de facturation, pas des secrets applicatifs.
- Decision technique : ne pas deplacer IBAN/BIC cote backend tant qu'ils sont destines a etre visibles sur les factures. Une variable `VITE_*` est lisible dans le navigateur, mais un RIB affiche au client n'est pas equivalent a une cle privee, un token ou un mot de passe.

### Goal 2 - Test mobile marketplace / alertemobile.md

- `alertemobile.md` a ete relu avant test, et l'invariant critique de `src/Router.jsx` a ete verifie :
  `const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;`
- Les invariants DOM/handlers ont ete verifies dans `src/Router.jsx` : `marketplace-gallery-shell`, `marketplace-gallery-scroll`, `data-native-scroll-region`, `onScroll`, `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel`.
- Un test Chrome mobile emule 390x844 a ete lance sur la sandbox Vite en mode `sandbox`, avec ouverture galerie, produit, taps autour de "Details" / fleche, retour galerie, puis deuxieme produit.
- Un test sur appareil Android reel detecte par ADB (`SM-X920`) a ensuite ete effectue. La tablette ne declenchait pas naturellement la branche mobile, donc deux controles ont ete faits :
  - Chrome Android reel via CDP avec viewport mobile 390x844.
  - Chrome Android reel avec affichage OS temporairement force en profil telephone `1080x2340 @420dpi`, sans override navigateur.
- Produits testes : `/produit/buffet-KrTETXPknYNwgak66T8p` et `/produit/buffet-vitrine-neZsnYoiX5NswNyLazMD`.
- Resultat mesure sur les taps autour de "Details" : image `0 px`, bloc bas/resume `0 px`, stage image `0 px`, `window.scrollY` `0 px`, scroll interne galerie `0 px`.
- Apres test, l'affichage Android a ete restaure (`1848x2960`, densite `280`, rotation initiale), les tunnels ADB ont ete retires, le serveur Vite de test a ete arrete et les logs temporaires ont ete supprimes.
- Aucun changement n'a ete fait dans `src/Router.jsx` pendant ce test. `src/kit/marketplace/ArchitecturalProductDetail.jsx` etait deja modifie dans le worktree avant ces validations.
- Warnings observes et non bloquants pour ce test : domaine OAuth `127.0.0.1` non autorise dans Firebase, et warning React sur la prop `fetchPriority` rendue sur un element DOM.

### Goal 3 - Inertie galerie avant ouverture de la modale Details

- `alertemobile.md` et `structuremobile.md` ont ete relus avant correction.
- Cause traitee : apres un scroll leger dans la galerie, le scroller interne pouvait garder une inertie au moment du clic produit. Meme si la galerie restait montee derriere le detail, cette inertie pouvait encore exister au premier geste pour ouvrir la modale "Details".
- Correction dans `src/Router.jsx` : avant `setView('detail')`, le scroller `#marketplaceGalleryScroll` est fige sur mobile quand le produit est ouvert depuis la galerie. Son `scrollTop` est conserve, le scroll global est remis a `0`, et l'inertie native est coupee.
- Correction dans `src/index.css` : quand `data-detail-open="true"`, `.marketplace-gallery-scroll` passe en `overflow-y: hidden`, `overscroll-behavior: none`, `-webkit-overflow-scrolling: auto`, `touch-action: none`.
- Au retour galerie, les styles inline sont nettoyes pour retrouver `overflow-y: auto` et `touch-action: pan-y`.
- L'animation de sortie du detail n'a pas ete supprimee.
- Invariant conserve :
  `const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;`
- Validation Android Chrome reel en viewport mobile `390x844` : galerie -> scroll leger -> clic produit -> swipe vers "Details". Pendant le premier geste, drift image `0 px`, drift resume `0 px`, `window.scrollY` `0`, `#marketplaceGalleryScroll.scrollTop` conserve.
- Validation retour : swipe back detail -> galerie, le scroller retrouve `overflow-y: auto`, `touch-action: pan-y`, et le `scrollTop` initial.

## Rapport agent - 2026-05-11

### Goal 4 - Optimisation facturation Firebase

- Le dernier `AGENTS.md` de `C:\Users\matth\Travail\Tous Ã  Table` a ete relu, notamment le playbook optimisation Firebase: catalogue public cache, suppression des listeners publics non critiques, lectures admin bornees, petits documents publics caches.
- Un endpoint HTTP `publicCatalog` a ete ajoute dans `functions/src/public/catalog.js` et exporte depuis `functions/index.js`. Il sert les meubles publies via cache memoire 5 minutes et cache HTTP, avec fallback front Firestore si l'endpoint est indisponible.
- `src/app.jsx` utilise maintenant `publicCatalog` + cache `sessionStorage` pour les visiteurs publics, ne charge plus le catalogue sur la page A propos tant que l'utilisateur n'entre pas vers la galerie, garde le listener Firestore seulement pour les vues admin utiles, et remplace le listener `contact_info` par `getDoc` + cache local.
- `src/kit/config/theme.js`, `src/kit/layout/Footer.jsx` et `src/kit/commerce/CheckoutView.jsx` remplacent les listeners publics de petits documents (`theme_settings`, `contact_info`, `delivery`, `payment_settings`) par des lectures simples cachees. Le listener stock checkout reste conserve car il protege le panier en temps reel.
- `src/kit/contexts/AuthContext.jsx` ne maintient plus de listener permanent sur `users/{uid}` pour chaque client connecte; les claims admin sont relus au chargement.
- Le log de connexion `logUserConnection` est dedoublonne cote client pendant 10 minutes par utilisateur pour eviter des appels Function/read ratelimit repetes lors des changements d'etat auth.
- `src/kit/commerce/MyOrdersView.jsx` limite l'espace client aux 50 dernieres commandes triees par date; l'index `orders(userEmail, createdAt desc)` a ete ajoute dans `firestore.indexes.json`.
- `functions/src/auth/adminManagement.js` ne lit plus toute la collection `users` pour le simple compteur du dashboard; les donnees completes ne sont chargees que lors de l'export CSV explicite.
- `src/kit/admin/AdminDashboard.jsx` borne les fallbacks legacy si les agregats `dashboard_stats` / `inventory_stats` manquent.

### Goal 5 - Detail produit mobile / flash de coins carres

- `alertemobile.md` a ete relu avant correction et l'invariant critique de `src/Router.jsx` est reste intact :
  `const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;`
- Cause diagnostiquee : sur Chrome mobile, changer directement le `src/srcSet` de l'image principale du detail produit pouvait provoquer un premier composite avec coins carres avant que le clipping arrondi soit stabilise. Le probleme disparaissait apres avoir vu toutes les images car le cache raster/GPU et les ratios etaient deja chauds.
- Correction dans `src/kit/marketplace/ArchitecturalProductDetail.jsx` : ajout d'un pipeline de staging mobile. Une image invisible/offscreen reproduit le choix `srcSet + sizes`, attend le chargement, lit le vrai `currentSrc`, mesure `naturalWidth/naturalHeight`, decode l'image, attend deux frames, puis seulement ensuite met a jour l'image visible.
- Le rendu visible mobile du detail utilise maintenant l'URL resolue finale en `src` simple, sans `srcSet` sur la couche visible, pour eviter que Chrome choisisse une variante au dernier moment pendant le paint.
- Les ratios mesures par staging alimentent `imageAspectRatios` avant affichage, ce qui evite le passage par un cadre provisoire base sur le ratio par defaut.
- Le clipping arrondi du detail mobile est porte par les wrappers stables `.product-detail-mobile-image-frame` et `.product-detail-mobile-image-clip`; l'image enfant ne porte plus le `clip-path` ni le rayon. Les coins du detail mobile ont ete reduits a `12px`.
- La galerie/cartes produit conserve un contrat different : les cartes restent en `object-cover` pour remplir toute la carte, avec clipping stable sur `.product-card-media` et preference de variante `card/medium` avant `thumb` dans `src/utils/imageUtils.js`.
- Validation effectuee : `npm run build` en mode sandbox, controle Chrome/CDP mobile `390x844`, verification que la couche visible detail n'a plus de `srcset`, que le frame est `overflow:hidden` + `clip-path round 12px`, et que les cartes galerie remplissent leur cadre en `object-cover`.

## Rapport agent - 2026-05-13

### Goal 6 - Dashboard de deploiement sandbox Next/App Hosting

- Le script `npm run dashboard` a ete remis en place pour ce clone Next via `deploy/dashboard.mjs`.
- Le dashboard cible uniquement la sandbox `secondevienextjsssr`; aucune option production n'est exposee.
- Les options disponibles sont : App Hosting sandbox, Functions, Firestore rules + indexes, Storage rules, et deploiement complet sandbox.
- `firebase.json` declare le backend App Hosting local-source `apphosting:secondevie-next-sandbox`, et `.firebaserc` fixe l'alias `default` sur `secondevienextjsssr`.
- Les pre-checks verifient Firebase CLI 14.4.0+, `.env.sandbox`, `firebase.json`, le statut git, et le build Next `.next/` avant de deployer l'app.
- Validation sans deploiement : `node --check deploy/*.mjs`, parsing JSON de `package.json` / `firebase.json` / `.firebaserc`, `npm run dashboard -- --status`, et `firebase apphosting:backends:list --project secondevienextjsssr`.

## Rapport agent - 2026-05-16

### Goal 7 - Roadmap SEO SSR / budget performance Next

- `NEXTJS_HOME_LANDING_ROADMAP.md` a ete cree pour cadrer l'hypothese d'une home landing SSR/ISR visible avec entree galerie conservee, a etudier le 2026-05-17.
- `NEXTJS_OPTIMIZATION_ROADMAP.md` et `NEXTJS_SEO_ROADMAP.md` ont ete relus avant de continuer les optimisations.
- `scripts/check-performance-budget.cjs` a ete remplace par un controle adapte au clone Next SSR : lecture de `.next/app-build-manifest.json`, resolution des assets `.next/static`, budgets JS/CSS initiaux par route SSR publique, controle du plus gros chunk JS differe et du plus gros CSS.
- Le script verifie aussi les regressions deja identifiees : pas de retour de l'ancien domaine `secondevie-a0745.web.app`, pas de `public/robots.txt` statique qui pourrait ecraser `app/robots.js`, et pas de `/_next/image` dans les sorties serveur tant que la strategie image retenue reste les variantes Firebase.
- `package.json` expose maintenant `npm run perf:budget`.
- `NEXTJS_SEO_ROADMAP.md` documente l'avancement S2 : budget perf Next fait, strategie image actuelle rattachee a `NEXTJS_IMAGE_PIPELINE_AUDIT.md`, et `measure-preview-network.py` conserve comme script legacy Vite.
- `scripts/measure-preview-network.py` annonce maintenant explicitement son statut legacy Vite et renvoie vers `npm run perf:budget` / `npm run perf:architecture`.
- Validation executee : `npm run perf:budget` OK sur le build `.next` courant. Mesures : routes publiques a environ 106-112 kB JS gzip initial, CSS initial 50.49 kB gzip, plus gros chunk JS differe 114.81 kB gzip, plus gros CSS 44.69 kB gzip.
- Correction UX home : pour eviter le flash de l'ancienne home SSR avant le preloader galerie, `app/page.jsx` affiche maintenant un placeholder SSR sombre "Entree dans la Galerie" et garde le contenu SEO de la home en `sr-only`; `/` continue de monter `ClientApp` immediatement.

## Rapport agent - 2026-05-15

### Goal 7 - Roadmap et corrections SEO Next SSR

- `NEXTJS_SEO_ROADMAP.md` a ete cree pour suivre les priorites SEO SSR, les validations et le journal d'avancement.
- `app/layout.jsx` lit maintenant `publicEnv` pour harmoniser `metadataBase`, titre, description et image OG avec les fallbacks `NEXT_PUBLIC_*` puis `VITE_*`.
- `app/robots.js` lit aussi `publicEnv.siteUrl`; le fichier statique `public/robots.txt` a ete supprime pour eviter que Next serve l'ancien sitemap `secondevie-a0745.web.app`.
- `app/devis/page.jsx` rend maintenant une couche SSR indexable avec H1, contenu metier, canonical, liens internes et JSON-LD `Service`, tout en conservant `ClientApp` pour le formulaire interactif legacy.
- `src/lib/seo/categories.js` centralise les categories, les IDs legacy, les labels nettoyes et les schemas categorie.
- `app/categorie/[categoryId]/page.jsx` reutilise ce helper et injecte maintenant `CollectionPage` + `BreadcrumbList`.
- `src/lib/seo/productStructuredData.js` normalise prix, stock, images et breadcrumbs; les produits en prix sur demande n'emettent plus d'`Offer` incomplete.
- `app/sitemap.js` pagine `publicCatalog`, inclut `/devis`, evite les `lastModified` artificiels et reutilise les correspondances categorie partagees.
- Points restants documentes : reduction du shell legacy `ClientApp`, strategie `next/image` avec `images.unoptimized`, et adaptation des scripts perf legacy Vite.
- Passe S2 hydration initiale : `app/ClientApp.jsx` accepte `defer`; produit, categorie et devis differencient le montage du legacy shell jusqu'a une interaction ou un idle court. La home `/` garde volontairement `ClientApp` immediat pour conserver le preloader puis la galerie comme entree visuelle historique.
- `src/app.jsx` pose maintenant `data-sv-client-hydrated="true"` seulement quand l'app legacy est reellement montee; le HTML SSR public n'est plus masque pendant le chargement du chunk legacy.
- Les routes privees/tunnel sans fallback SSR metier (`/admin`, `/checkout`, `/wishlist`, `/mes-commandes`) gardent le chargement immediat de `ClientApp`.
- Validation S2 : `npm run lint`, `npm run build`, `npm run seo:check`, inspections runtime home/devis/admin, verification Playwright mobile du passage SSR visible -> legacy hydrate, et `npm run perf:architecture`.
- Resultat perf a surveiller : le HTML initial Next reste nettement meilleur que la SPA et les routes categorie/produit reduisent requetes/images, mais le JS runtime reste eleve quand le legacy shell finit par charger; prochaine passe recommandee : isoler panier/wishlist/auth/lightbox au lieu de monter toute la SPA publique.

### Goal 8 - Premier clic image produit depuis galerie

- `NEXTJS_OPTIMIZATION_ROADMAP.md` et `alertemobile.md` ont ete relus avant optimisation; l'invariant mobile critique de `src/Router.jsx` est reste intact.
- Cause confirmee : le rang de la carte n'est pas la vraie cause; le retard vient du premier passage dans le detail client et de la premiere variante detail froide.
- `src/kit/marketplace/components/ProductCard.jsx` prechauffe maintenant l'image detail primaire avant ouverture : `pointerdown`, touch, click, hover/focus et visibilite via `IntersectionObserver`.
- `src/utils/imageUtils.js` expose `preloadPrimaryProductDetailImage` avec choix explicite de variante; sur mobile les warmups forcent `medium` sans `srcSet` pour eviter que le DPR choisisse `large`.
- `src/kit/marketplace/ArchitecturalProductDetail.jsx` garde le premier rendu mobile sur `medium/card/thumb`; le staging `currentSrc/decode` n'upgrade qu'apres le premier paint.
- `src/kit/marketplace/MarketplaceLayout.jsx` et `src/kit/marketplace/CategoryPage.jsx` appliquent la meme logique mobile `medium` aux prechauffes galerie/categorie.
- Validation : `npm run mobile:contract`, `npm run lint`, `npm run build`.
- Mesure Playwright locale production : desktop hover -> image detail principale 424-571 ms; mobile visible tap verifie la variante `medium`, avec temps local encore penalise par le pipeline SPA/Firebase et le scroll Playwright.

### Goal 9 - Scroll froid galerie / reveal images produit

- `NEXTJS_OPTIMIZATION_ROADMAP.md` et `alertemobile.md` ont ete relus avant correction; l'invariant mobile critique de `src/Router.jsx` est reste intact.
- Le rapport dense `GALLERY_COLD_SCROLL_OPTIMIZATION_REPORT.md` documente le cas complet : symptomes a froid, ancienne architecture galerie, nouvelle architecture, code modifie, differences `Nouveautes` / `Petits Prix`, validations, limites et pistes suivantes.
- Audit froid Playwright sur la sandbox App Hosting : le scroll declenchait auparavant des scripts Google Maps depuis le footer et des prechargements galerie trop agressifs. Apres correction, le scroll mesure ne declenche plus que des images, sans script/XHR ni long task observee.
- `src/kit/layout/Footer.jsx` ne charge plus l'iframe Google Maps automatiquement au scroll. La carte est maintenant opt-in : le placeholder local reste leger, et l'iframe Google ne charge qu'au clic sur "Afficher la carte".
- `src/kit/marketplace/MarketplaceLayout.jsx` ne force plus le montage/preload desktop des sections basses pendant l'entree galerie. Les slots `DeferredSectionSlot` gardent leurs hauteurs reservees et montent par IntersectionObserver.
- Les warmups produits caches ont ete retires pour les grilles publiques : plus de `prewarmProductListImages` sur l'entree galerie, plus de traitement partiel 4/5 premieres cartes, et `ProductSections.jsx` passe `getPriority={() => false}` pour `Nouveautes` et `Petits Prix`.
- `src/kit/marketplace/components/ProductCard.jsx` pilote maintenant explicitement le chargement/reveal des images de carte : `src` transparent tant que la carte n'approche pas, demande de l'image reelle via IntersectionObserver, puis fade-in seulement quand la carte devient visible. Le root d'observation utilise `#marketplaceGalleryScroll` seulement s'il est reellement scrollable, sinon le viewport navigateur.
- Correction importante : le fallback de securite des cartes ne revele plus les images hors ecran. Il verifie la position reelle de la carte avant de demander/reveler l'image, pour conserver le comportement progressif sur `Nouveautes` comme sur `Petits Prix` tout en evitant les cartes blanches si l'observer rate un cas.
- `src/index.css` masque les images de carte tant qu'elles sont en `data-image-reveal="pending"` ou `data-image-loaded="false"`, puis applique le fade `product-card-image-fade-in` quand la vraie image est chargee et visible.
- Les handlers scroll globaux de `ArchitecturalHeader.jsx` et `PremiumMegaMenu.jsx` ont ete cadences par `requestAnimationFrame` pour eviter des updates React redondantes pendant le scroll.
- Validations executees : `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`, puis deploiement App Hosting sandbox `secondevie-next-sandbox`.

### Goal 10 - PageSpeed post-reveal / auth et images locales

- Le rapport PageSpeed desktop du 2026-05-17 16:13 indiquait encore : performance 75, LCP 1.3 s, TBT 280 ms, images a optimiser 240 Kio, JS inutilise 70 Kio, et travail main thread 5.9 s. Le rapport mobile indiquait : performance 70, FCP 1.1 s, LCP 6.1 s, TBT 40 ms.
- Firebase Auth n'est plus importe ni initialise au premier affichage public. `src/kit/config/firebase.js` expose maintenant `getFirebaseAuth`, `getGoogleProvider` et `loadAuthModule`, charges dynamiquement seulement si une session persiste, si un redirect Google est en cours, si une route auth est ouverte, ou lors d'une action de login.
- `src/kit/contexts/AuthContext.jsx` ne bloque plus la galerie publique sur `onAuthStateChanged` quand aucun utilisateur n'est persiste. Les visiteurs publics gardent `user=null`, `isAdmin=false`, `loading=false`; les routes `/admin`, `/checkout`, `/wishlist` et `/mes-commandes` initialisent toujours Auth.
- `src/kit/admin/publicCatalogInvalidation.js` recupere Auth a la demande pour conserver la revalidation catalogue admin sans remettre `firebase/auth` dans le chargement public initial.
- Des variantes WebP plus legeres ont ete ajoutees pour les visuels PageSpeed visibles : `public/images/categories/*-rail.webp` et `public/images/before-after/*-gallery.webp`. `MarketplaceLayout.jsx` utilise ces variantes pour le rail categories, le bloc avant/apres et les visuels discovery initiaux.
- Les CSS globaux non utiles au chargement public ont ete sortis du layout racine : `TextType.css` et `CurvedLoop.css` ne sont plus importes globalement, et `PerformanceArchitectureStudy.css` est charge via `app/admin/layout.jsx` au lieu de bloquer toutes les routes publiques.
- Validation locale : `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`, controle navigateur local sans erreur console, sans `auth/iframe`/`identitytoolkit` initial, et avec categories servies depuis les variantes `*-rail.webp`. Budget CSS public passe d'environ 50.53 kB gzip a 46.40 kB gzip.

### Goal 10 - Passe PageSpeed desktop post-reveal

- Rapport PageSpeed lu depuis l'URL partagee (`form_factor=desktop`, rapport du 2026-05-17 14:25:47) : score desktop 59, FCP 0,4 s, LCP 1,2 s, TBT 870 ms, CLS 0.078, Speed Index 6,2 s.
- Les optimisations ci-dessous ne modifient pas le pipeline `ProductCard` ni les limites `Nouveautes` / `Petits Prix`; le reveal par IntersectionObserver, le `src` transparent et `getPriority={() => false}` restent en place.
- `src/kit/contexts/AuthContext.jsx` ne lance plus `signInAnonymously` automatiquement sur la page publique. Cela supprime l'erreur PageSpeed `auth/admin-restricted-operation`, le POST `identitytoolkit accounts:signUp` en 400 et une partie du bruit Firebase client initial.
- `src/kit/marketplace/MarketplaceLayout.jsx` force le rail categories sur les assets locaux optimises `/images/categories/*.webp` au lieu des images configurables Firebase plus lourdes; les images admin configurees restent disponibles ailleurs, mais le rail d'entree reste stable et leger.
- `src/app.jsx` remplace la texture reseau `transparenttextures.com/stucco.png` du rideau d'entree par une texture CSS locale, supprimant une requete tierce inutile.
- `src/kit/marketplace/components/MarketplaceHero.jsx` garde les animations d'images hero, mais remplace l'animation de largeur des dots par une largeur fixe + `transform: scaleX`, pour eviter l'audit "non-composited animation" sur `width`.
- `src/kit/marketplace/components/ArchitecturalHeader.jsx` ajoute dimensions explicites au logo et un `aria-label` au bouton de recherche desktop; `CategoryRail.jsx` ajoute aussi dimensions/decoding au logo decoratif.
- Les props `fetchpriority` restantes dans les surfaces marketplace actives ont ete corrigees en `fetchPriority` pour eviter les warnings React et conserver le hint navigateur.
- Validation locale : `npm run lint`, `npm run build`, `npm run mobile:contract`, `npm run perf:budget`. Controle runtime production local : categories chargees depuis `/images/categories/*.webp`, dots hero sans `style.width`, `transparenttextures.com` absent du markup actif, zero erreur console observee au chargement.

### Goal 11 - Passe PageSpeed mobile/desktop apres score 70/75

- Rapport PageSpeed partage le 2026-05-17 16:13 : desktop 75 puis jusqu'a 88 selon run, mobile 70-73, avec restes principaux sur images, render-blocking CSS, JS inutilise et main thread. Les scores PageSpeed varient d'un run a l'autre; les decisions ont ete prises sur les audits repetes et les budgets locaux.
- `src/app.jsx` ne charge plus `src/kit/shared/AnalyticsProvider.jsx` dans le bundle galerie immediat. Un `DeferredAnalyticsProvider` affiche les enfants directement, puis importe le provider analytics apres `requestIdleCallback`/fallback timeout. Le tracking public reprend apres idle, sans bloquer le premier rendu ni le scroll initial.
- Le hero galerie conserve son animation et son slider. `src/kit/marketplace/components/MarketplaceHero.jsx` rend maintenant les images via `<picture>` et utilise une source mobile dediee quand disponible, tout en gardant les sources desktop existantes pour les grands ecrans.
- `src/kit/config/constants.js` rattache les presets hero aux nouveaux fichiers mobiles `public/images/imagehero/*-mobile.webp`. Ces variantes 1200x675 pesees environ 51-57 kB remplacent les fichiers 1672x941 de 113-131 kB sur viewport mobile.
- Le pipeline reveal des cartes produit n'a pas ete modifie : `Nouveautes` et `Petits Prix` gardent le chargement progressif par `ProductCard`, `IntersectionObserver`, `src` transparent et fade-in apres image chargee.
- Validations executees : `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`, controle sandbox navigateur puis deploiement App Hosting sandbox. Le provider analytics apparait maintenant comme chunk separe `src/app.jsx -> ./kit/shared/AnalyticsProvider`; les budgets publics restent OK avec 106.48 kB JS gzip home et 46.40 kB CSS gzip. La relance PageSpeed API a ete bloquee par `429 Too Many Requests`, donc la verification score finale doit etre refaite quand le quota PageSpeed se libere.

### Goal 12 - Images metier des modules categories hero

- Les quatre cartes categories du hero galerie avaient ete branchees sur des images locales trop generiques (`*-rail.webp`) pendant l'optimisation PageSpeed. Le resultat etait leger mais moins coherent visuellement avec `Buffets`, `Armoires`, `Miroirs` et `Commodes`.
- Les anciennes images configurees dans `sys_metadata/gallery_app` (`cat_buffets`, `cat_armoires`, `cat_miroirs`, `cat_commodes`) ont ete recuperees depuis Firebase Storage, puis recompressees en variantes locales `public/images/categories/*-config-rail.webp` en 260x325.
- `src/kit/marketplace/MarketplaceLayout.jsx` pointe maintenant les cartes categories vers ces variantes locales. On garde donc le contenu visuel d'origine tout en evitant les URLs Firebase plus lourdes au premier affichage.
- `.firebaseignore` a ete ajoute pour exclure les builds, logs et le dossier temporaire local `public/images/categories/source-config/` des deploiements App Hosting.
- Validations executees : `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`. Les nouvelles variantes pesent environ 7.6 a 14.1 kB chacune.

## ðŸ› ï¸ Structure des Fichiers .env
Nous n'utilisons PLUS de fichier `.env` unique. Tout est pilote par des fichiers suffixes locaux :
- `.env.sandbox` -> charge par les scripts sandbox (`npm run dev`, `npm run build`, `npm run start`)
- `.env.production` -> charge par les scripts production (`npm run dev:prod`, `npm run build:prod`, `npm run start:prod`)

Les vrais `.env.*` sont ignores par Git pour le depot public. Les fichiers commits sont uniquement les modeles `.env.sandbox.example` et `.env.production.example`.

## ðŸš€ Commandes de lancement
- Pour travailler en local (TESTS) : `npm run dev` (Lancement en mode sandbox).
- Pour travailler en local (PROD) : `npm run dev:prod` (Lancement en mode production).

## âš ï¸ Point Attention IA
Si l'utilisateur demande "Ajoute cette variable d'environnement", vous DEVEZ l'ajouter dans **LES DEUX** fichiers (`.env.sandbox` ET `.env.production`) pour Ã©viter tout dÃ©synchronisation.

## ðŸ“¦ Build & Deploy
- Ne jamais builder la prod sans `--mode production`.
- Utiliser `npm run build:prod` pour s'assurer que les clÃ©s de prod sont injectÃ©es dans le build final.
- Pour le clone Next.js SSR, utiliser `npm run dashboard` pour les deploiements Firebase/App Hosting.
- Le dashboard est sandbox-only : projet Firebase `secondevienextjsssr`, backend App Hosting `secondevie-next-sandbox`, URL `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`.
- Ne pas ajouter d'option production dans `deploy/dashboard.mjs`, `deploy/config.mjs` ou `deploy/runner.mjs` tant que le clone n'a pas d'environnement prod valide.
- Options autorisees dans le dashboard : App Hosting sandbox, Functions uniquement, Firestore rules + indexes, Storage rules, Tout deployer en sandbox.
- Commande de controle sans deploy : `npm run dashboard -- --status`.
- Les deploys doivent toujours passer `--project secondevienextjsssr`; ne pas dependre d'un projet Firebase actif implicite.

## âš ï¸ Framer Motion - PiÃ¨ges d'animation UI complexes (Mega Menu)
**NE JAMAIS UTILISER** la propriÃ©tÃ© de style native `style={{ left: offset }}` sur un conteneur principal `motion.div` lorsqu'il possÃ¨de des enfants qui s'animent avec la prop `layout`.
**ProblÃ¨me :** Framer Motion dÃ©tecte un changement instantanÃ© de position du parent pendant une animation et gÃ¨le le composant en forÃ§ant un `pointer-events: none` interne qui ne se dÃ©sactivera plus jamais (rendant l'UI complÃ¨tement figÃ©e).
**Solution :**
1. Utilisez toujours l'accÃ©lÃ©ration matÃ©rielle GSAP/FramerMotion : `animate={{ x: offsetLeft }}`
2. Dans des menus interactifs complexes (ex Mega Menu), forcez `pointerEvents: "auto"` manuellement sur les `animate` pour ne jamais subir ce blocage de sÃ©curitÃ©.
3. Le pont entre le MenuItem et le MegaMenu doit se faire avec un `padding` natif (ex: `pt-2`) sur un conteneur en `pointer-events-auto`, **jamais** avec une div "pont" globale invisible superposÃ©e qui risque d'intercepter les `onMouseLeave`.
