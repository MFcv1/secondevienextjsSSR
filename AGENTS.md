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
|-- app : routes Next App Router, SSR produit/categorie, sitemap, robots et shell client
|-- tests, playwright.config.mjs : tests E2E et validations Playwright
|-- firebase.json, firestore.rules, firestore.indexes.json, storage.rules
|-- .env.sandbox.example / .env.production.example : modeles publics; vrais .env locaux ignores par Git
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
|-- public : favicons, manifest, robots, images, video
|-- scripts : env bridge, SSR/mobile checks, perf/architecture compare, backfills/audits Storage/images et tooling safe
|-- MIGRATION_REPORT.md, COMPARISON.md, RUNBOOK.md, DATABASE_MIGRATION_PLAN.md, COMPLETION_AUDIT.md, ARCHITECTURE_BENCHMARK_DECISION.md
|-- imagehero, pageUI : references visuelles et notes UI
`-- .next, dist, node_modules, logs, .firebase : generes, hors carte
```

## ALERTE MOBILE - A LIRE AVANT TOUTE MODIF MARKETPLACE MOBILE

Avant toute modification qui touche `src/Router.jsx`, la galerie, une page produit, le detail produit, le scroll mobile, `--marketplace-viewport-height`, `marketplace-gallery-shell`, `marketplace-gallery-scroll`, Lenis ou les handlers touch mobile, lire d'abord `alertemobile.md`.

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
- Les invariants DOM/handlers ont ete verifies dans `src/Router.jsx` : `marketplace-gallery-shell`, `marketplace-gallery-scroll`, `data-lenis-prevent`, `onScroll`, `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel`.
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

## âš ï¸ Framer Motion - PiÃ¨ges d'animation UI complexes (Mega Menu)
**NE JAMAIS UTILISER** la propriÃ©tÃ© de style native `style={{ left: offset }}` sur un conteneur principal `motion.div` lorsqu'il possÃ¨de des enfants qui s'animent avec la prop `layout`.
**ProblÃ¨me :** Framer Motion dÃ©tecte un changement instantanÃ© de position du parent pendant une animation et gÃ¨le le composant en forÃ§ant un `pointer-events: none` interne qui ne se dÃ©sactivera plus jamais (rendant l'UI complÃ¨tement figÃ©e).
**Solution :**
1. Utilisez toujours l'accÃ©lÃ©ration matÃ©rielle GSAP/FramerMotion : `animate={{ x: offsetLeft }}`
2. Dans des menus interactifs complexes (ex Mega Menu), forcez `pointerEvents: "auto"` manuellement sur les `animate` pour ne jamais subir ce blocage de sÃ©curitÃ©.
3. Le pont entre le MenuItem et le MegaMenu doit se faire avec un `padding` natif (ex: `pt-2`) sur un conteneur en `pointer-events-auto`, **jamais** avec une div "pont" globale invisible superposÃ©e qui risque d'intercepter les `onMouseLeave`.
