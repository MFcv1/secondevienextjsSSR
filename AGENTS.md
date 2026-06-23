# ðŸ§  Instructions pour Codex (IA) - Switch Env

Ce document est spÃ©cifiquement destinÃ© aux assistants IA pour ne pas casser la structure des environnements.

---

## PRIORITE - Limite de validation des correctifs

Quand l'utilisateur demande un correctif, appliquer le changement demande puis s'arreter des que le correctif est en place, sauf demande explicite de validation.

- Ne pas lancer de verifications longues, build, serveur local, Playwright, navigateur, screenshot ou test manuel si l'utilisateur ne le demande pas clairement.
- Les validations automatiques doivent rester limitees au strict minimum necessaire pour eviter une erreur evidente de syntaxe ou de lint locale, et seulement si elles ne rallongent pas inutilement le cycle.
- Si l'utilisateur dit qu'il peut verifier lui-meme, respecter cette priorite et ne pas continuer en validation visuelle ou runtime.
- Dans le compte rendu, indiquer simplement ce qui a ete modifie et, si aucune validation n'a ete lancee, le dire clairement.

---

## Code map
L'agent doit garder cette carte a jour lors de chaque creation, suppression, renommage ou deplacement de fichier. Si une modification change clairement le role d'un fichier, ajuster aussi son libelle. Garder la carte compacte : grouper les assets, logs, builds et dossiers temporaires au lieu de tout lister.

```text
.
|-- AGENTS.md : consignes agents et rapports; CLAUDE.md / GEMINI.md : consignes agents
|-- context.md : synthese reutilisable du contexte Next SSR, restauration UI legacy et consignes anti-SPA
|-- alertemobile.md : invariant mobile marketplace critique
|-- nextjsssr.md : agent/playbook audit legacy SPA et migration Next SSR publique
|-- mapV2.md : cartographie routes Next SSR/SSG/ISR, infra prod, risques backoffice et nettoyage code mort
|-- DEAD_CODE_AUDIT.md : audit multi-agent code vivant/mort, candidats suppression et assets a archiver
|-- TODO.md : checklist Phase 2 infra prod puis Phase 3 hydratation/perf
|-- E2E_BACKOFFICE_TEST_ROADMAP_2026-06-18.md : recap preuve paiement sandbox, compte admin test `loa.gto15@gmail.com`, bugs E2E et roadmap tests client/back-office
|-- E2E_REFUND_EXECUTION_ROADMAP_2026-06-19.md : plan d'execution multi-agents pour debloquer App Check, prouver achat invite neuf puis refund admin sandbox
|-- INFRA_PROD_PHASE2_REPORT_2026-06-14.md : rapport infra prod Phase 2, decisions env/secrets/revalidation/Stripe et risques restants
|-- MENU_NAVIGATION_CATEGORY_LOADING_REPORT_2026-06-16.md : rapport navigation menu, prefetch cible, suppression loading categorie et deploy App Hosting sandbox
|-- AI_QUOTE_ASSISTANT_MVP.md : cadrage MVP assistant IA devis, base metier, garde-fous OpenAI et integration admin
|-- docs/CGV_RETOURS_DRAFT_2026-06-19.md : brouillon CGV/retours/retractation Seconde Vie a faire valider par un juriste
|-- NEXT_PUBLIC_ROUTES_STATIC_ARCHITECTURE_ROADMAP_2026-06-16.md : roadmap routes publiques cacheables, theme sans cookie serveur, categories canonique/facettes client et gates prerender
|-- .agents/skills/nextjsssr : skill Codex local pour appliquer nextjsssr.md
|-- package*.json, next.config.mjs, eslint.config.mjs, jsconfig.json, tailwind.config.js, postcss.config.js
|-- middleware.js : redirections Next ciblees, dont compatibilite `/?page=gallery` vers `/galerie`
|-- apphosting.yaml, .firebaserc : configuration Firebase App Hosting sandbox
|-- app : routes Next App Router, home landing SEO SSR + galerie Next, SSR produit/categorie, tunnels noindex en iles client dediees, loading/not-found/error, sitemap et robots
|-- tests, playwright.config.mjs : tests E2E et validations Playwright
|-- _DOCS : documentation maintenance Next/dependances
|-- docs : roadmaps techniques dont `ROADMAP_STRIPE_FIREBASE_HARDENING.md` pour durcissement Stripe/Firebase
|-- firebase.json, .firebaseignore, firestore.rules, firestore.indexes.json, storage.rules
|-- functions-public : codebase Functions public isole pour `publicCatalog`, sans secrets Stripe/Gmail
|-- .env.sandbox.example / .env.production.example : modeles publics; vrais .env locaux ignores par Git
|-- deploy : dashboard npm de deploiement Firebase/App Hosting sandbox
|-- src
|   |-- index.css
|   |-- kit/admin : back-office, analytics, commandes, retours/remboursements Stripe, SEO, users, exports CSV, docs/etudes techniques admin
|   |-- kit/commerce : panier, checkout, login, commandes client, regle isPurchasable
|   |-- kit/marketplace : galerie serveur, SEO visible, pages categorie/produit, ilots produit/lightbox, footer mobile, panier/cartes, devis ServerView/FormIsland, wishlist
|   |-- kit/vitrine : vue serveur et iles fines de la page /a-propos native Next
|   |-- kit/layout, kit/shared, kit/ui, kit/hooks, kit/contexts, kit/config (dont firebaseEnv/firebaseCore/firebaseLazy)
|   |-- lib : helpers serveur produits/env/theme/about et SEO structure
|   `-- assets, utils : images source et helpers
|-- functions
|   |-- index.js, helpers : Firebase Functions entrypoint/config/security
|   `-- src : analytics, auth, commerce dont refund admin Stripe et helpers E2E proteges, email, maintenance, public, seo, triggers
|-- public : favicons, manifest, image OG, images, video, rapport maintenance statique
|-- scripts : env bridge, audits infra env/secrets/deploy/App Check paths, E2E auth email OTP, E2E revalidation catalogue, E2E hosted Stripe checkout sandbox succes/echec, seed/reset produit test Stripe sandbox, SSR/mobile checks, maintenance audit, budget perf Next, gate classification routes Next, perf/architecture compare, audit scroll galerie, backfills/audits Storage/images et tooling safe
|-- MIGRATION_REPORT.md, COMPARISON.md, RUNBOOK.md, DATABASE_MIGRATION_PLAN.md, COMPLETION_AUDIT.md, ARCHITECTURE_BENCHMARK_DECISION.md, NEXTJS_OPTIMIZATION_ROADMAP.md, NEXTJS_FULL_NATIVE_CLEANUP_ROADMAP_2026-06-10.md, NEXTJS_FULL_NATIVE_AUDIT_ROADMAP_2026-06-10.md, NEXTJSSSR_FULL_NEXT_FINAL_PROMPT_2026-06-09.md et autres rapports/roadmaps Next SSR, SEO, images, galerie et produit
|-- imagehero, pageUI : references visuelles et notes UI
`-- .next, dist, node_modules, logs, .firebase : generes, hors carte
```

## Rapport agent - 2026-06-15

### Goal 13 - E2E Stripe sandbox heberge

- `scripts/e2e-hosted-stripe-checkout.mjs` a ete stabilise pour le run App Hosting sandbox avec App Check debug token: login reutilisable via `E2E_PASSWORD`, nettoyage panier Firestore REST, selection d'un produit a prix positif avec stock visible, et evitement des articles deja epuises/reserves pendant les tests (`Buffet`, `dd`, `Chaise`).
- Le script evite maintenant de doubler l'ajout panier si le panneau n'apparait pas immediatement: il ouvre le panier au lieu de recliquer sur le produit.
- Le test complet heberge a ete execute avec le compte verifie `loa.gto15+fulltest...@gmail.com`, produit `Paire de chevets`, carte Stripe sandbox `4242 4242 4242 4242`.
- Resultat runtime: login OK, panier OK, checkout OK, paiement Stripe sandbox OK, ecran final `Paiement valide` / `Votre commande est confirmee` visible. Le run fonctionnel a seulement echoue sur une assertion Playwright trop stricte car deux textes de succes etaient visibles; l'assertion a ete corrigee pour les prochains runs.
- Restant a verifier separement: logs Functions/webhook Stripe signe, email de confirmation et scenario annulation/restauration stock.

### Goal 24 - Repetabilite E2E Stripe/refund sandbox

- `scripts/seed-e2e-stripe-product.mjs` cree ou remet a stock connu le produit dedie `sv-e2e-stripe-refund-product`, libelle `[TEST STRIPE SANDBOX] Produit refund repetable`, puis bump `public/meta.catalogVersion`.
- `package.json` expose `npm run e2e:seed-stripe-product`.
- `scripts/e2e-hosted-stripe-checkout.mjs` cible ce produit via `E2E_STRIPE_PRODUCT_ID` et ne depend plus des exclusions fragiles `Buffet`, `dd`, `Chaise`.
- Les logs JSON E2E sont redactes avant ecriture: `password`, token App Check, `idToken`, `refreshToken`, `accessToken`, `Authorization` et `clientSecret` sont masques.
- `functions/src/commerce/e2eStripeHardeningProof.js` prefere le produit dedie fourni par `productId` avant tout fallback catalogue.

## Rapport agent - 2026-06-16

### Goal 23 - Routes publiques statiques, theme et facettes categories

- `NEXT_PUBLIC_ROUTES_STATIC_ARCHITECTURE_ROADMAP_2026-06-16.md` a ete cree et relie dans la code map ainsi que dans les consignes operationnelles `AGENTS.md`.
- Objectif long terme acte: routes publiques SEO stables et ISR-friendly, preferences UI hors rendu serveur public, categories canoniques cacheables, facettes query params gerees cote client sauf vraies routes SEO dediees.
- Trois side agents ont travaille en parallele sur des perimetres disjoints: produit/theme, categories/facettes, gates/prerender.
- `app/produit/[slugOrId]/page.jsx` ne lit plus `getServerDarkMode()` et ne declenche plus `cookies()` cote serveur pour le theme public; le rendu serveur produit utilise maintenant un theme stable comme la categorie.
- `app/categorie/[categoryId]/page.jsx` ne declare plus `searchParams` et ne passe plus les query params au rendu serveur.
- `src/kit/marketplace/CategoryControlsIsland.jsx` lit et synchronise les query params cote client, applique filtres/tri/vues via DOM progressif, utilise `history.pushState` et gere `popstate`.
- `src/kit/marketplace/CategoryServerView.jsx` rend la categorie canonique par defaut et expose les metadonnees necessaires a l'ile client sans reintroduire un gros rendu produit React.
- `src/kit/marketplace/categoryViewModel.js` accepte maintenant `URLSearchParams` et les timestamps numeriques pour partager la logique serveur/client.
- `scripts/check-next-route-classification.cjs` bloque les imports/accès request-time (`next/headers`, `cookies()`, `headers()`, `draftMode()`) depuis les graphes de routes publiques SEO, interdit `searchParams` dans les pages publiques, et verifie que les tunnels prives/API restent `force-dynamic`.
- Validation courte executee: `npm run next:routes` OK. Pas de build, serveur local, Playwright ou validation visuelle lance dans cette passe.

### Goal 22 - Navigation menu et chargement categories

- `MENU_NAVIGATION_CATEGORY_LOADING_REPORT_2026-06-16.md` documente le diagnostic et les decisions de la passe.
- Cause principale traitee: le grand squelette visible avant les pages categorie venait de `app/categorie/[categoryId]/loading.jsx`, affiche automatiquement par Next pendant la navigation client. Ce fichier a ete supprime pour eviter l'ecran intermediaire.
- `app/categorie/[categoryId]/page.jsx` memoise les donnees categorie via `cache()` et ne lit plus `getServerDarkMode()`, afin de garder les routes categorie publiques plus favorables au prerendu/cache. Le build confirme `/categorie/[categoryId]` en SSG avec les categories attendues.
- `src/kit/marketplace/PremiumMegaMenuIsland.jsx` utilise maintenant `next/link` pour les liens internes et precharge au survol/focus les routes visibles du mega menu, dont les sous-categories et `/devis` pour les ressources.
- `src/kit/marketplace/GlobalMenuPanelAuthIsland.jsx` precharge a l'ouverture du menu global les routes critiques: galerie/ancres, categories principales, sous-categories, `/a-propos`, `/devis`, `/mes-commandes`, `/wishlist`.
- `src/kit/layout/GlobalMenu.jsx` ne force plus `window.location.assign` pour `/a-propos` et `/devis`; `Nouveautes` pointe vers `/galerie#gallery-pieces`, `Prix bas` vers `/galerie#gallery-small-prices`, et la tuile livraison/atelier vers `/devis`.
- Les routes compte visibles dans le menu ont recu des fallbacks visibles et des navigations `router.push`: `app/RouteClientProviders.jsx`, `app/mes-commandes/OrdersPageIsland.jsx`, `app/wishlist/WishlistPageIsland.jsx`.
- `src/kit/marketplace/QuoteRequestServerView.jsx` passe maintenant `initialDarkMode` a `QuoteFormIsland`.
- Validation executee: `git diff --check` OK, `npm run build` OK apres relance hors sandbox a cause d'un `spawn EPERM` initial. Deploiement App Hosting sandbox effectue sur `secondevie-next-sandbox` / projet `secondevienextjsssr`, URL `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`.
- Decision a conserver: ne pas restaurer un grand `loading.jsx` specifique aux categories sans mesurer l'impact UX; garder un prefetch menu cible plutot qu'un prefetch massif du catalogue.

## NEXTJS OPTIMIZATION ROADMAP

## NEXT PUBLIC ROUTES STATIC ARCHITECTURE ROADMAP

Avant toute passe qui vise le theme public, le retrait de `cookies()` sur les routes SEO, les categories sans `searchParams` serveur, les facettes client, ou les gates de classification prerender/cache, lire `NEXT_PUBLIC_ROUTES_STATIC_ARCHITECTURE_ROADMAP_2026-06-16.md`.

Cette roadmap fixe la cible long terme: routes publiques SEO stables et ISR-friendly, preferences UI hors rendu serveur public, categories canoniques cacheables, facettes query params gerees cote client sauf vraies routes SEO dediees.

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

Avant toute modification qui touche la galerie, `src/kit/marketplace/GalleryServerView.jsx`, `app/GalleryMobileShellIsland.jsx`, une page produit, le detail produit, le scroll mobile, `--marketplace-viewport-height`, `marketplace-gallery-shell`, `marketplace-gallery-scroll`, le scroll natif ou les handlers touch mobile, lire d'abord `alertemobile.md`.

Invariant critique historique remplace par le contrat Next galerie :

`src/kit/marketplace/GalleryServerView.jsx` doit rendre `marketplace-gallery-shell`, `marketplace-gallery-scroll` et `#marketplaceGalleryScroll`; `app/GalleryMobileShellIsland.jsx` doit garder `data-native-scroll-region` en mobile, le scroll lock `marketplace-mobile-scroll-lock` et les handlers touch/pull-refresh tant que la galerie mobile utilise ce shell.

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
- Un endpoint HTTP `publicCatalog` avait ete ajoute dans `functions/src/public/catalog.js`; l'endpoint actif vit maintenant dans le codebase isole `functions-public/src/public/catalog.js`, sans secrets Stripe/Gmail.
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
- `NEXTJS_SEO_ROADMAP.md` documente l'avancement S2 : budget perf Next fait et strategie image actuelle rattachee a `NEXTJS_IMAGE_PIPELINE_AUDIT.md`.
- Les anciens scripts reseau Vite ont ete retires du flux actif; utiliser les gates Next `npm run perf:budget`, `npm run perf:architecture` et les audits directs.
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

## Rapport agent - 2026-05-25

### Goal 13 - Correctif scroll desktop froid galerie / footer newsletter

- Probleme initial : sur desktop froid, l'entree galerie posait `gallery-entry-scroll-lock` sur `html` et `body`, donc `overflow:hidden` bloquait le scroll natif pendant l'hydratation. Les coups de molette etaient accumules puis le document partait quand le lock disparaissait, au moment ou des chunks/images/sections differes continuaient a charger. Cela creait des freezes et des sauts au premier scroll.
- Correction principale dans `src/app.jsx` : le scroll lock d'entree galerie est maintenant conditionne a la viewport mobile via `MOBILE_MARKETPLACE_QUERY = '(max-width: 1023px)'`. Sur desktop, `gallery-entry-scroll-lock` n'est plus pose pendant l'entree, `window.scrollTo(0, 0)` n'est plus force a la fin de l'entree, et le rideau visuel garde `lg:pointer-events-none` pour ne pas capturer la molette.
- Invariant mobile conserve : `src/Router.jsx` garde exactement `const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;`. Les classes/contrats `marketplace-gallery-shell`, `marketplace-gallery-scroll`, `data-native-scroll-region` et les handlers touch mobile ne doivent pas etre changes pour ce correctif desktop.
- Correction du timing des chunks dans `src/kit/marketplace/MarketplaceLayout.jsx` : les anciens `desktopIdleDelay` courts des sections basses ont ete retires. `BeforeAfter`, `Petits Prix`, `Instagram`, `Testimonials` et `Newsletter` montent par `IntersectionObserver` avec hauteur reservee, au lieu de timers 900/1300/1700/2200/2600 ms pendant le premier scroll.
- Le preload automatique du detail produit apres 9 s sur galerie/categorie/wishlist a ete retire de `src/Router.jsx`. Les prefetch intentionnels restent actifs via hover/focus/click produit (`openProductDetail` et `prefetchProductDetail`), pour ne pas charger `ProductDetail` pendant un scroll froid sans intention d'ouverture produit.
- Probleme secondaire apres le premier correctif : en scroll normal, l'utilisateur pouvait arriver a la section newsletter "Abonne-toi..." avant que le footer differe soit rendu. Le sentinel footer etait trop fragile car l'effet dependait d'un `ref.current` parfois encore `null`, puis le fallback long laissait un trou sous la newsletter. Avec `Suspense fallback={null}`, la hauteur de page n'etait pas reservee pendant le chargement du chunk footer.
- Correction du blocage newsletter/footer dans `src/app.jsx` : le footer differe utilise maintenant un callback ref (`setDeferredFooterSentinel`) et un check scroll/resize cadence par `requestAnimationFrame`. Le declenchement galerie se fait avant le bas de page, et un `FooterLoadingPlaceholder` reserve environ 1320 px pendant le chargement du chunk footer. La page peut donc continuer a descendre sans attendre que le footer JS soit decode et monte.
- Ajustement complementaire dans `MarketplaceLayout.jsx` : la section `Newsletter` garde le montage par `IntersectionObserver`, mais avec un `desktopRootMargin` plus large (`1600px 0px 2200px`) pour eviter que l'utilisateur atteigne son bas avant que le footer ne soit prepare.
- Mesures locales Playwright/CDP apres correctif, sur `http://127.0.0.1:4300/`, cache desactive et CPU throttle x4 : `gallery-entry-scroll-lock` absent sur desktop, `html/body overflow` non hidden, `scrollY` augmente avant 1 s apres molette immediate, plus de cas `bottom-without-footer-or-placeholder` pendant le scroll normal jusqu'a la newsletter. Le footer placeholder apparait avant la newsletter visible, puis le footer reel remplace le placeholder.
- Requetes/chunks pendant le scroll mesure : `ProductDetail` ne se charge plus automatiquement pendant le premier scroll. Les sections basses ne partent plus sur timers courts; elles suivent la proximite viewport. Le footer peut maintenant etre demande avant le bas de page, mais avec hauteur reservee pour eviter un blocage visuel.
- Validations executees : `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`. Le budget public reste OK autour de 106.47 kB JS gzip home et 46.53 kB CSS gzip home.

### Roadmap fluidite premier scroll

1. Stabiliser les seuils d'IntersectionObserver desktop avec mesures reelles : conserver les hauteurs reservees, mais profiler `BeforeAfter`, `Petits Prix`, `Instagram`, `Testimonials`, `Newsletter` et `Footer` pour trouver le meilleur compromis entre anticipation et absence de travail pendant les 2-3 premieres secondes de scroll.
2. Ajouter au script `scripts/audit-gallery-scroll-lag.mjs` un scenario "scroll normal jusqu'a newsletter" en plus du mode "scroll immediat" : mesurer `scrollY`, hauteur document, presence du placeholder footer, chunks demandes, long tasks, frame gaps et temps d'apparition du footer.
3. Remplacer le placeholder footer brut par un squelette footer ultra leger si l'attente reste visible : meme hauteur, fond coherent dark/light, pas d'image, pas de JS lourd, aucun import differe.
4. Revoir `NewsletterSection`, `TestimonialsSection` et `InstagramSection` pour separer le markup statique leger du comportement interactif. Objectif : afficher rapidement une structure stable, puis charger les comportements non critiques apres idle ou interaction.
5. Auditer les images chargees entre `Nouveautes` et `Newsletter` : confirmer que seules les images proches viewport passent du transparent placeholder a l'image reelle, sans fallback qui revele des cartes trop basses.
6. Isoler encore les chunks bas de page : verifier que `Footer`, `Testimonials`, `Newsletter` et eventuels widgets tiers ne partagent pas un gros chunk commun qui force trop de code au meme moment.
7. Ajouter une regression gate locale : le test Playwright doit echouer si `gallery-entry-scroll-lock` existe sur desktop, si `overflow:hidden` global revient, si `scrollY` reste a 0 apres molette immediate, ou si le bas de newsletter est atteint sans footer ni placeholder.
8. Faire une passe UI/UX finale sur la perception : scroll manuel desktop froid, CPU x4, reseau cold, puis ajuster seulement les seuils et placeholders. Pas de retour aux timers courts; la priorite reste le scroll natif fluide et une hauteur de page stable.

### Goal 14 - Roadmap scroll appliquee / gates et charges hero-footer

- La roadmap fluidite premier scroll a ete mise en place sans refactor du shell et sans toucher aux handlers mobile marketplace.
- `scripts/audit-gallery-scroll-lag.mjs` accepte maintenant `--mode=newsletter` pour reproduire le scroll normal froid jusqu'a la zone newsletter/footer. Ce mode mesure `scrollY`, hauteur document, lock desktop, overflow global, footer, placeholder, long tasks, frame gaps et requetes par segment.
- `package.json` expose deux gates locales : `npm run perf:scroll` pour la molette immediate et `npm run perf:scroll:newsletter` pour le cas "Abonne-toi..." / footer. Les deux utilisent `--assert` et echouent si le lock desktop revient, si `overflow:hidden` global revient, si le scroll ne demarre pas apres document scrollable, ou si le bas est atteint sans footer ni placeholder.
- `src/app.jsx` remplace le placeholder footer brut par un squelette footer leger reserve en hauteur, sans image ni import lourd. Le but est de garder une page stable si le chunk footer arrive pendant un scroll rapide.
- `src/kit/marketplace/MarketplaceLayout.jsx` pause le carousel hero au demarrage froid. Tant que l'utilisateur scrolle vite hors du hero, seule l'image hero active est demandee; les slides suivantes ne sont prechargees qu'apres idle si l'utilisateur reste proche du hero, ou apres clic volontaire sur un dot.
- `src/kit/marketplace/components/MarketplaceHero.jsx` met aussi en pause l'animation de progression du hero tant que le carousel n'est pas prime, pour eviter une jauge qui avancerait sans changement de slide.
- `src/kit/layout/Footer.jsx` charge l'image "livraison" via `IntersectionObserver` avec dimensions reservees et pixel transparent tant que l'image reelle n'est pas proche/visible. Un garde `offsetParent` evite de charger l'image du layout cache mobile/desktop.
- `src/kit/marketplace/components/InstagramSection.jsx` garde les cartes montees et anime uniquement `transform`/`opacity`, sans `AnimatePresence` ni montage/demontage de cartes a chaque slide. Les transitions Instagram sont donc moins brutales et generent moins de churn React pendant le scroll bas de page.
- Mesure reseau notable : sur le scenario `perf:scroll:newsletter`, le segment de scroll froid est passe d'environ 1.43 MB a environ 0.97 MB apres pause du hero et lazy footer; les images `imagehero/2.webp`, `imagehero/3.webp` et `imagehero/4.webp` ne partent plus pendant ce premier scroll. Les gates scroll restent vertes.
- Passe complementaire : l'etat media-query initial de l'image livraison footer est maintenant calcule au premier rendu, ce qui evite d'observer/charger aussi la variante cachee. L'image reelle fade-in via CSS sous `prefers-reduced-motion: no-preference`. Sur le scenario newsletter final, le segment de scroll descend a environ 0.88 MB et l'image livraison ne part plus qu'une fois.
- Validations executees apres cette passe : `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`, `npm run perf:scroll`, `npm run perf:scroll:newsletter`.
- Limite restante : les plus gros frame gaps viennent encore de l'hydratation du shell galerie et des gros chunks initiaux. La prochaine passe utile est l'isolation du shell public galerie / menu / sections interactives, pas le retour a des timers courts.

### Goal 15 - Roadmap hydratation scroll appliquee

- Probleme traite apres Goal 14 : les locks desktop, le footer/newsletter et les timers courts etaient corriges, mais les audits CPU x4 montraient encore des frame gaps >100 ms pendant le premier scroll. La cause restante etait surtout l'hydratation du shell galerie et les gros chunks initiaux, avec encore trop d'imports Firebase/Firestore decoratifs dans le chemin public.
- Roadmap implementee : rendre Firebase plus paresseux, dedoublonner le fetch catalogue public, retarder les lectures decoratives non critiques, et sortir le menu global du chunk immediat.
- `src/kit/config/firebaseEnv.js`, `firebaseCore.js` et `firebaseLazy.js` separent maintenant les constantes publiques legeres, l'initialisation app Firebase, puis les runtimes Firestore/Functions/Auth/AppCheck charges a la demande.
- `src/app.jsx`, `src/Router.jsx`, `src/kit/contexts/AuthContext.jsx`, `src/kit/layout/Footer.jsx`, `src/kit/config/theme.js`, `src/kit/marketplace/MarketplaceLayout.jsx` et `AnnouncementBanner.jsx` evitent les imports statiques Firestore/Functions/Auth sur le parcours public initial quand ils ne sont pas necessaires.
- `src/app.jsx` force le chemin `publicCatalog` meme en localhost et dedoublonne les fetches en vol. Dans l'audit scroll immediat final, il reste une seule requete cloud-function catalogue et aucune requete Firestore reseau pendant le segment mesure.
- Les lectures decoratives `theme_settings`, `contact_info`, `gallery_app` et `announcement_config` sont repoussees a `45 s` + idle. Les valeurs par defaut/cache restent visibles, donc le premier scroll ne depend plus de ces petits documents.
- `GlobalMenu` est maintenant charge via `React.lazy`; son preload reste possible sur intention, sans imposer son chunk au premier scroll froid.
- Mobile conserve : l'invariant `const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;` est intact, et les contrats `marketplace-gallery-shell`, `marketplace-gallery-scroll`, `data-native-scroll-region` restent valides.
- Mesure finale scroll immediat (`seconde-vie-immediate-hydration-env-split-final-2`) : `gallery-entry-scroll-lock` absent, `overflow:hidden` absent, premier scroll effectif en `177 ms` apres document scrollable, 46 requetes, 1 cloud-function, 0 Firestore reseau, long tasks `11 / 1805 ms / max 329 ms`, frame gaps `max 383 ms`, `6` gaps >100 ms.
- Mesure finale newsletter (`seconde-vie-newsletter-hydration-env-split-final-2`) : assertions OK, 0 lock, 0 overflow hidden, 0 `bottomWithoutFooterOrPlaceholder`, footer placeholder prepare a `1460 ms`, footer reel monte a `3105 ms`, newsletter montee a `3882 ms`, 51 requetes, 1 cloud-function, 0 Firestore reseau, frame gaps `max 567 ms`, `7` gaps >100 ms.
- Limite restante documentee : les gaps >100 ms ne viennent plus du lock desktop ni de Firestore decoratif pendant le scroll. Ils viennent du cout de parsing/execution du shell galerie, des chunks initiaux (`Router`, sections marketplace, Framer Motion/UI), des images encore demandees plusieurs fois sous cache desactive, et du paint/raster sous CPU x4. La suite utile est une isolation plus profonde du shell public galerie en ilots SSR/client, pas un nouveau timer court.
- Validations executees apres cette passe : `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`, `npm run perf:scroll`, `npm run perf:scroll:newsletter`.

### Goal 16 - Ilots client galerie / retrait Framer du shell public

- Probleme traite apres Goal 15 : les gaps >100 ms restants venaient encore du cout parse/execute du shell galerie public sous CPU x4. Les chunks inutiles au premier scroll etaient deja repousses, mais le shell immediate gardait encore Framer Motion et des composants interactifs/decoratifs qui n'etaient pas necessaires pour descendre dans la page.
- `src/app.jsx`, `src/Router.jsx`, `src/kit/ui/Toast.jsx`, `src/kit/marketplace/components/AnnouncementBanner.jsx`, `src/kit/marketplace/components/ArchitecturalHeader.jsx` et `src/kit/marketplace/MarketplaceLayout.jsx` ne dependent plus de `framer-motion` sur le parcours galerie public initial. Les animations du rideau, toasts, stock alert, menu admin, bandeau, header, icone menu et titres de section sont maintenant des transitions/keyframes CSS dans `src/index.css`.
- `src/kit/marketplace/MarketplaceLayout.jsx` charge `PremiumMegaMenu` comme ilot differe : placeholder desktop de hauteur stable, import seulement apres idle long ou intention utilisateur (`pointerenter` / focus). Cela retire les chunks du mega menu et leur Framer Motion du premier scroll froid.
- `src/app.jsx` repousse `AnalyticsProvider` a `15 s` + idle long au lieu de l'idle court. Les chunks Firebase/analytics ne tombent donc plus pendant la premiere molette immediate.
- `src/kit/marketplace/components/MarketplaceHero.jsx` ne rend plus les particules decoratives du CTA devis au premier paint. Elles apparaissent apres idle si l'utilisateur reste proche du hero ou sur intention hover/focus.
- `src/kit/marketplace/components/CategoryRail.jsx` rend uniquement le rail mobile ou desktop selon media-query, pour eviter le double markup d'images sous cache desactive. Les logos decoratifs internes des cartes desktop sont repousses apres idle long.
- `src/app.jsx` corrige aussi le scroll lock modal global : le retour `window.scrollTo(0, scrollYRef.current)` n'est execute que si une modale a vraiment ete ouverte. Cela evite un retour inutile a `0` au montage/hydratation.
- Teste puis abandonne : un shell SSR galerie visible temporaire rendait le document scrollable avant hydratation, mais degradait les gaps navigation et provoquait un swap de layout. Il a ete retire; la passe conserve donc le shell client actuel, allege et mieux decoupe, sans changement visuel majeur.
- Mobile conserve : `src/Router.jsx` garde exactement `const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;`. Les contrats `marketplace-gallery-shell`, `marketplace-gallery-scroll`, `data-native-scroll-region` et les handlers touch mobile restent valides.
- Mesure finale scroll immediat propre (`seconde-vie-immediate-final-client-islands-clean-2`, cache desactive, CPU x4, `http://127.0.0.1:4300/`) : assertions OK, 0 lock desktop, 0 overflow hidden, premier scroll effectif `155 ms` apres document scrollable, 32 requetes, long tasks `4 / 766 ms / max 232 ms`, frame gaps `max 250 ms`, `4` gaps >100 ms. `Petits Prix`, `Testimonials`, `Newsletter`, `Footer` et `ProductDetail` ne montent pas pendant le scroll immediat.
- Mesure finale newsletter propre (`seconde-vie-newsletter-final-client-islands-clean`) : assertions OK, 0 lock desktop, 0 overflow hidden, 0 `bottomWithoutFooterOrPlaceholder`, footer placeholder prepare a `1043 ms`, footer reel et newsletter montes a `2466 ms`. Le scroll normal descend jusqu'a `7431 px` sans blocage de bas de page.
- Validations executees : `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`, `npm run perf:scroll`, `npm run perf:scroll:newsletter`. Attention mesure : fermer les serveurs `next dev` externes avant tout `next build`/`next start`, car ils reecrivent `.next` et rendent les audits production incoherents.

### Goal 17 - Audit UX images detail produit froid

- `NEXTJS_OPTIMIZATION_ROADMAP.md` et `alertemobile.md` ont ete relus avant correction. L'invariant mobile `const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;` est reste intact.
- `PRODUCT_DETAIL_IMAGE_UX_AUDIT.md` documente le diagnostic, les mesures, les changements et les risques restants pour le parcours galerie -> detail produit.
- Probleme mesure : a l'ouverture d'un produit froid, le detail pouvait demander en parallele la branche image cachee mobile/desktop, les vignettes avec `srcSet` complet, et plusieurs variantes `large` secondaires. Sur mobile, le staging normal pouvait aussi upgrader l'image visible en `large` via DPR.
- Correction dans `src/kit/marketplace/ArchitecturalProductDetail.jsx` : le detail rend seulement la branche active mobile ou desktop, le staging mobile conserve `decode/currentSrc` mais force la variante `medium` sans `srcSet`, et les vignettes utilisent l'URL `thumb` explicite.
- Les warmups secondaires sont bornes autour de l'image active puis differes a idle. Sur desktop, la variante prechargee est choisie selon largeur viewport + DPR (`medium` a 1440x900 DPR 1, `large` seulement quand necessaire).
- Passe complementaire : le warmup mobile post-paint ne relance plus l'image active `medium` deja chargee. La gate verifie maintenant qu'il n'y a pas de redemande du slot actif `0_medium` apres tap.
- Les placeholders existants `blurDataUrl` / `dominantColor` stabilisent maintenant le cadre mobile et les vignettes pendant le cache froid. Le flou desktop derriere l'image reste conserve via le backdrop thumbnail.
- Mesure locale production Playwright, cache desactive, CPU x4, produit `/produit/buffet-KrTETXPknYNwgak66T8p` : desktop sans requetes secondaires `large` dans la waterfall finale; mobile sans variantes detail `large`, avec baisse du total images produit mesure d'environ `1157 kB` a `878 kB`.
- `scripts/audit-product-detail-images.mjs` et `npm run perf:product-images` ajoutent une gate reproductible : parcours galerie -> detail en desktop/mobile, assertions sans variante `large` inutile, branche active seulement, image visible chargee et backdrop desktop conserve.
- Validations executees : `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`, `npm run perf:scroll`, `npm run perf:product-images`, `NEXT_BASE_URL=http://127.0.0.1:4300 npm run perf:architecture`, plus QA Playwright desktop `1440x900` et mobile `390x844`.
- Tentative vrai mobile : une interface `SAMSUNG Android ADB Interface` est visible et les platform-tools officiels ont ete lances depuis un dossier temporaire, mais `adb devices -l` retourne `R52Y3030D6D offline`. Le test Chrome Android reel reste donc a faire apres deverrouillage/autorisation USB de l'appareil.

### Goal 18 - Page produit Next autonome hors SPA legacy

- `NEXTJS_OPTIMIZATION_ROADMAP.md` et `alertemobile.md` ont ete relus avant la migration. L'invariant mobile `const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;` est reste intact dans `src/Router.jsx`.
- Baseline directe produit locale production, cache desactive, CPU x4, `/produit/buffet-KrTETXPknYNwgak66T8p` : desktop 45 requetes / 2084 kB / 1233 kB JS avec `data-sv-client-hydrated=true`, `.marketplace-gallery-shell` et 10 assets galerie/home; mobile 51 requetes / 2154 kB / 1238 kB JS avec shell galerie et variante `large` demandee.
- `app/produit/[slugOrId]/page.jsx` ne monte plus `<ClientApp defer />` pour l'experience produit publique. La page garde SSR, metadata, canonical, JSON-LD Product/Breadcrumb et ISR, puis hydrate seulement une ile produit dediee.
- `src/kit/marketplace/ProductPageExperience.jsx` a ete ajoute : experience produit autonome avec image centrale, flou desktop `thumb`, miniatures, fiche produit, favori local, reservation vers `/devis`, lightbox sur intention, swipe image mobile et panneau bas Details.
- Le pipeline direct produit utilise `medium` pour l'image visible initiale, `thumb` pour le flou et les miniatures, precharge les voisines en `medium` apres premier paint/idle, et garde `large/full` pour la lightbox ou les grands ecrans qui le justifient.
- Le parcours galerie -> detail legacy reste volontairement dans `src/Router.jsx` / `ArchitecturalProductDetail.jsx`; il n'a pas ete remplace dans cette passe pour ne pas casser le scroll mobile galerie valide.
- `scripts/audit-product-page-direct.mjs` et `npm run perf:product-direct` ont ete ajoutes pour prouver que la route directe ne charge plus la SPA legacy, le shell galerie, les assets hero/categories, ni `large/full` avant zoom.
- Resultat apres migration `perf:product-direct` : desktop 30 requetes / 1387 kB total / 400 kB JS, mobile 31 requetes / 1457 kB total / 400 kB JS apres swipe image, 0 asset galerie/home, 0 marqueur SPA legacy, image visible chargee en `medium`, details mobile OK. Derniere mesure directe : image ready desktop 838 ms, mobile 725 ms sous CPU x4.
- `perf:architecture` local mesure la route produit Next a 29 requetes / 1323 kB total / 400 kB JS / LCP 620 ms, contre 94 requetes / 7339 kB total / 874 kB JS pour la SPA sandbox.
- Rapport detaille ajoute dans `PRODUCT_PAGE_NEXT_MIGRATION_REPORT.md`.
- Validations executees : `npm run lint`, `npm run build`, `npm run mobile:contract`, `npm run perf:budget`, `npm run perf:product-direct`, `npm run perf:product-images`, `NEXT_BASE_URL=http://127.0.0.1:4300 COLD_PRODUCT_PATH=/produit/buffet-KrTETXPknYNwgak66T8p npm run perf:architecture`.
- `npm run seo:check` a ete tente avec `NEXT_SSR_CHECK_BASE_URL=http://127.0.0.1:4300`, mais il echoue encore sur la home avec `Missing SSR evidence for home ... image`, hors surface produit modifiee.
- Test vrai mobile non execute : `adb devices -l` echoue car `adb` n'est pas disponible dans le `PATH` courant.

### Goal 19 - Stabilisation display/zoom images produit

- `NEXTJS_OPTIMIZATION_ROADMAP.md`, `NEXTJS_IMAGE_PIPELINE_AUDIT.md` et `alertemobile.md` ont ete relus avant correction. L'invariant mobile `const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;` est reste intact dans `src/Router.jsx`, qui n'a pas ete modifie.
- Les variantes Storage restent conservees : `thumb` pour blur/fonds/miniatures, `card` pour cartes galerie, `medium` pour display mobile, `large` pour display desktop, `full` seulement pour l'upgrade HD apres ouverture zoom.
- `src/utils/imageUtils.js` centralise maintenant les roles via `getProductDisplayImageSrc`, `getProductZoomInitialImageSrc` et `getProductZoomFullImageSrc`. Les preloads produit intentionnels ciblent la variante display et ne passent plus par `srcSet`/`full` par defaut.
- `src/kit/marketplace/ArchitecturalProductDetail.jsx` garde le staging mobile `currentSrc/decode`, mais force l'image visible sur `medium` mobile et `large` desktop. La lightbox demarre sur l'URL display deja visible, puis precharge/decode `full` apres ouverture avant remplacement progressif.
- `src/kit/marketplace/ProductPageExperience.jsx` applique la meme regle sur la page produit Next autonome : preload SSR mobile/desktop display, image visible stable, zoom initial egal a l'image courante, `full` charge seulement apres clic zoom.
- `scripts/audit-product-page-direct.mjs` et `scripts/audit-product-detail-images.mjs` verifient maintenant qu'aucun `full` n'est demande avant zoom, que la lightbox initiale reprend l'image visible, et que le detail utilise `medium` mobile / `large` desktop quand disponible.
- Le warmup detail galerie est borne a la fenetre proche autour de l'image active; le prechargement idle du reste des images produit desktop a ete retire pour respecter le budget reseau.
- Validations executees : `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`, `npm run perf:product-direct`, `npm run perf:product-images`, `NEXT_BASE_URL=http://127.0.0.1:4300 npm run perf:architecture`.
- Resultats mesures : page produit directe desktop visible en `large` et mobile en `medium`; lightbox initiale egale a l'image visible; `full` absent avant zoom puis demande apres ouverture. Parcours galerie -> detail : mobile detail pret en 740 ms avec `medium`, desktop en 481 ms avec `large`, aucun `full` avant zoom.
- Test vrai mobile non execute pendant cette passe; la validation mobile est Playwright 390x844 et le contrat mobile automatise.

### Goal 20 - Session UX image produit medium unifiee

- Rapport detaille ajoute : `PRODUCT_DETAIL_IMAGE_UX_SESSION_REPORT.md`. Il documente la sequence complete de problemes regles pendant la session : double interface produit directe/galerie, passage thumb -> medium au centre, comparaison avec Tous a Table, fond flou en retard, flash navigateur, formats horizontaux, zoom full et validations sandbox.
- Cette passe supersede les decisions image produit precedentes quand elles parlent de `large` desktop ou de backdrop `thumb` pour le detail normal. La decision courante est : `medium` pour l'image centrale produit, `medium` pour le fond flou desktop, `thumb` seulement pour les miniatures, `full` seulement apres ouverture zoom/lightbox.
- `app/produit/[slugOrId]/page.jsx` garde le SSR SEO/indexable et monte `ClientApp` pour afficher l'experience legacy `ArchitecturalProductDetail`; la preview SSR visible utilise maintenant la meme URL `medium` pour le backdrop et l'image centrale.
- `src/kit/marketplace/ArchitecturalProductDetail.jsx` utilise `activeImageSrc` comme source du backdrop detail desktop. Le fallback avant peinture reste une couleur dominante opaque; le `blurDataUrl` et la thumb ne sont plus utilises comme fond desktop principal.
- `src/index.css` stabilise la preview SSR avec une couche centrale explicite au-dessus du backdrop.
- Invariant mobile conserve : `src/Router.jsx` n'a pas ete modifie et garde `const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;`.
- Validations executees : `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`, `npm run seo:check` en local et sandbox, `npm run perf:product-images` en local et sandbox avec `--throttle=3`.
- Deploiement effectue sur App Hosting sandbox : `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`. Controle SSR sandbox : `product-ssr-visual-preview__backdrop` et `product-ssr-visual-preview__image--main` pointent tous les deux vers la meme URL `..._medium_...webp`.

### Goal 21 - Route produit Next native avec ilots client limites

- Diagnostic corrige : l'etape precedente avait bien sorti la route produit du shell SPA, mais elle restait une grosse ile client (`ProductDetailRouteExperience` puis `ArchitecturalProductDetail`). Cela preservait le design visible, mais ce n'etait pas encore le decoupage Next ideal demande.
- `app/produit/[slugOrId]/page.jsx` garde le SSR SEO, les metadata, le preload image et les JSON-LD, puis rend maintenant `ProductDetailServerView`, un composant serveur qui construit directement la structure produit visible.
- `src/kit/marketplace/ProductDetailServerView.jsx` rend cote serveur le panneau produit desktop : titre, prix, description, informations et structure lisible/indexable. Le rendu direct produit ne passe plus par `ClientApp`, `Router.jsx`, la galerie, `LegacyAppShell`, `ProductPageExperience` ni `ProductDetailRouteExperience`.
- `src/kit/marketplace/ProductDetailShellIsland.jsx` est la petite ile client dediee au media produit : image principale, miniatures, swipe mobile, molette desktop, lightbox/zoom et panneau mobile. Le frame desktop reutilise le calcul historique de `ArchitecturalProductDetail` (`74vh`, ratio `0.75`, max `920px`) au lieu d'une largeur fixe, pour eviter le zoom/dezoom au refresh.
- La molette souris desktop est geree dans l'ile media native seulement : accumulation de delta avec seuil court, changement borne de l'image active, aucun `preventDefault` passif, aucun retour vers l'ancien overlay produit.
- Correctif mobile natif : le rail vertical `data-desktop-thumb-rail` doit rester `hidden lg:flex`, sinon il apparait comme une colonne de miniatures a gauche sur largeur mobile. Le rail mobile horizontal garde les dimensions legacy (`32px`, ou `30px` au-dela de 12 images) et les gaps legacy (`6px`, ou `5px` au-dela de 12 images).
- Correctif image mobile natif : l'image centrale de `ProductDetailShellIsland` remplit maintenant son cadre en `object-fit: cover`. Le but est d'eviter les bandes/marges internes transparentes observees sur mobile apres la migration Next native, tout en gardant le frame stable et le clipping arrondi.
- Correctif sortie galerie : `ProductCard` memorise la cible de retour (`secondevie:product-return:v1`) aussi sur tap mobile. `ProductDetailShellIsland` ignore les anciennes cibles `/produit/...`, utilise une navigation ferme vers la galerie apres l'animation de sortie, et garde un timer fallback pour eviter qu'une transition interrompue bloque la fiche produit.
- `HomeGalleryLauncher` ouvre automatiquement l'overlay galerie quand l'URL arrive avec `?page=gallery`, `#gallery` ou le flag session `secondevie:open-gallery-on-arrival`. La home reste statique SEO : `app/page.jsx` ne lit pas `searchParams`; un bootstrap inline pose seulement `data-sv-force-gallery-entry="true"` avant peinture pour masquer la landing SSR pendant que la galerie se monte.
- Le bouton de sortie desktop de `ProductDetailShellIsland` doit rester dans la scene image, avant la colonne infos et le rail miniatures : `right: calc(clamp(450px, 26vw, 500px) + 110px + 2rem)` et `top: clamp(5.5rem, 12vh, 8rem)`. Cela evite que le bouton tombe sur le titre produit.
- `src/kit/marketplace/ProductDetailActionsIsland.jsx` isole les actions interactives panier/favori. Le favori reste local pour la visite publique directe, et le panier passe par le panneau `CartSidebar` avant `/checkout`, sans remonter toute la SPA produit.
- Les cartes produit publiques ne doivent plus intercepter le clic pour monter l'ancien overlay detail. `ProductCard`, les lignes mobile categorie et les cartes wishlist suivent maintenant directement leur lien `/produit/...`; le clic depuis galerie et le refresh dur arrivent donc sur la meme route Next native.
- `src/kit/marketplace/ProductPageExperience.jsx` et `src/kit/marketplace/ProductDetailRouteExperience.jsx` ont ete supprimes. `ArchitecturalProductDetail.jsx` reste volontairement dans le code pour le detail ouvert depuis la galerie legacy, tant que la galerie n'a pas encore ete migree en route Next native.
- `scripts/audit-product-page-direct.mjs` verifie la route produit native directe : presence du detail visible, absence du marqueur SPA legacy, absence de shell galerie, absence d'assets home/galerie, absence de preview SSR alternative, image display chargee et image `full` seulement apres intention de zoom.
- Validations executees : `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`, `NEXT_BASE_URL=http://127.0.0.1:3001 npm run perf:product-direct`. Le build mesure `/produit/[slugOrId]` a environ `9.86 kB` de route et `113 kB First Load JS`; le budget produit est a environ `111.36 kB` JS gzip initial. L'audit produit direct confirme `svClientHydrated: false`, aucune `.marketplace-gallery-shell`, aucune galerie, aucune preview `data-product-ssr-preview`. Controle Playwright desktop `1916x1030` : galerie `?page=gallery` -> clic premiere carte `/produit/...` -> refresh, `native: true`, `legacy: false`, frame image identique `435 x 580` avant/apres refresh. Controle molette desktop sur `http://127.0.0.1:3001/produit/buffet-KrTETXPknYNwgak66T8p` : wheel down passe de l'image `0` a l'image `1`, wheel up revient a l'image `0`, frame stable `435 x 580`, console sans erreur. Controle mobile `390x844` et fenetre etroite `500x820` : rail mobile horizontal visible, premiere miniature `32 x 32`, rail desktop `display:none`, console sans erreur. Controle desktop large : rail mobile cache, rail desktop visible. Controle final local production `http://127.0.0.1:3002` : mobile `412x915`, image centrale `objectFit: cover`, frame et image `387 x 567`, `legacy:false`; swipe de sortie -> galerie visible (`overlay:true`, `.marketplace-gallery-shell:true`, cartes produit presentes). Desktop `1440x900` : bouton fermer visible dans le viewport, clic -> galerie visible. Controle final `http://127.0.0.1:3000` apres build propre : `/` reste statique dans le build (`○ /`), bouton sortie desktop `44 x 44` a `x=1232 y=124` en viewport `1916x1030`, image visible `435 x 580`, `legacy:false`; 500 ms apres clic sortie, `homeVisible:false`, `overlay:true`, `.marketplace-gallery-shell:true`; apres montee galerie, 10 cartes produit et console sans erreur.
- Pendant les validations visuelles, plusieurs ports Next locaux peuvent encore creer de la confusion dans les onglets. Toujours relancer une seule instance de test et verifier l'URL exacte avant de conclure sur un refresh produit.

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
