# Cartographie du projet Seconde Vie Next

Derniere verification: 2026-07-15
Statut: `CARTE_CANONIQUE_ACTIVE`

## 1. Role et maintenance

Cette carte repond a trois questions:

1. quelle route ou quel parcours l'utilisateur utilise;
2. quels fichiers executent ce parcours;
3. quelles donnees, Functions et services sont traverses.

Elle doit etre mise a jour dans le meme changement que toute creation, suppression, renommage ou deplacement structurel. `AGENTS.md` contient les regles; `_DOCS/README.md` indexe les chapitres metier.

Legende:

- `[S]`: rendu ou logique serveur;
- `[C]`: composant/client navigateur;
- `[API]`: route Next;
- `[F]`: Cloud Function;
- `[DB]`: Firestore;
- `[ST]`: Firebase Storage;
- `[EXT]`: service externe;
- `ISR`: Incremental Static Regeneration;
- `DYN`: route dynamique non cachee publiquement.

## 2. Carte visible du site

```text
Seconde Vie
|-- / ................................ Home galerie canonique
|   |-- hero / categories / selection / contenus editoriaux
|   |-- recherche, wishlist, panier, menu, devis
|   `-- liens vers categories et produits
|-- /galerie ......................... Alias compatible, canonical /
|-- /categorie/[categoryId] .......... Liste serveur filtree
|-- /produit/[slugOrId] .............. Fiche produit, medias et actions
|-- /recherche ....................... Resultats non indexables
|-- /a-propos ........................ Atelier, histoire, FAQ, avant/apres
|-- /devis ........................... Demande de restauration/devis
|-- /wishlist ........................ Liste personnelle dynamique
|-- /checkout ........................ Tunnel panier/paiement dynamique
|-- /mes-commandes ................... Espace client dynamique
|-- /admin ........................... Back-office dynamique
|-- /api/search ...................... Recherche catalogue serveur
|-- /api/revalidate-catalog .......... Invalidation ISR admin
|-- /sitemap.xml ..................... Sitemap Next dynamique/cache
`-- /robots.txt ...................... Politique robots Next
```

## 3. Contrat de rendu des routes

| Route | Type | Cache | SEO | Entree | Vue metier |
| --- | --- | --- | --- | --- | --- |
| `/` | `[S]` statique | ISR 300 | index, canonical `/` | `app/page.jsx` | `GalleryRoutePage` |
| `/galerie` | `[S]` statique | ISR 300 | canonical `/` | `app/galerie/page.jsx` | `GalleryRoutePage` |
| `/categorie/[categoryId]` | `[S]` SSG/fallback | ISR 300 | index conditionnel | route dynamique | `CategoryServerView` |
| `/produit/[slugOrId]` | `[S]` SSG/fallback | ISR 300 | index conditionnel | route dynamique | `ProductDetailServerView` |
| `/a-propos` | `[S]` | ISR 300 | index | `app/a-propos/page.jsx` | `AboutServerView` |
| `/devis` | `[S]+[C]` | ISR 300 | index | `app/devis/page.jsx` | `QuoteRequestServerView` |
| `/recherche` | `[S]+[C]` | ISR 300 | noindex/follow | `app/recherche/page.jsx` | `SearchResultsIsland` |
| `/wishlist` | `[C]` tunnel | DYN | noindex/nofollow | `app/wishlist/page.jsx` | `WishlistPageIsland` |
| `/checkout` | `[C]` tunnel | DYN | noindex/nofollow | `app/checkout/page.jsx` | `CheckoutPageIsland` |
| `/mes-commandes` | `[C]` tunnel | DYN | noindex/nofollow | `app/mes-commandes/page.jsx` | `OrdersPageIsland` |
| `/admin` | `[C]` tunnel | DYN | noindex/nofollow | `app/admin/page.jsx` | `AdminAppIsland` |
| `/api/search` | `[API]` | borne | non indexable | `route.js` | recherche serveur |
| `/api/revalidate-catalog` | `[API]` | aucun | non indexable | `route.js` | token admin + revalidation |

## 4. Parcours et dependances

### 4.1 Consultation catalogue

```text
route publique [S]
  -> src/lib/server/products.js
  -> publicCatalog [F] ou Firestore Admin/API de repli
  -> furniture [DB]
  -> normalisation + indexabilite
  -> ServerView
  -> petites iles interactions [C]
```

### 4.2 Publication d'une annonce

```text
/admin [C]
  -> AdminForm / AdminItemList
  -> upload variantes [ST]
  -> furniture/{id} [DB]
  -> publicCatalogInvalidation
  -> public/meta.catalogVersion [DB]
  -> /api/revalidate-catalog [API]
  -> ISR routes + sitemap
```

### 4.3 Authentification

```text
header/menu/route privee
  -> LegacyLoginModalFullIsland [C]
  -> AuthContext + authStore
  |-- Google -> Firebase Auth [EXT]
  |-- OTP -> send/verifyCustomerLoginOtp [F] -> Gmail/Resend [EXT]
  `-- passkey -> 4 callables WebAuthn [F] -> users/{uid}/passkeys [DB]
  -> loginWithCustomToken
  -> etat partage header/menu/espace client
```

### 4.4 Achat

```text
carte produit
  -> guestCart ou users/{uid}/cart
  -> /checkout
  -> OTP/compte verifie
  -> createOrder [F]
  -> transaction stock + orders [DB]
  -> Stripe Payment Element [EXT]
  -> stripeWebhook [F]
  -> order paid + email triggers
  -> /mes-commandes + /admin
```

### 4.5 Remboursement

```text
AdminReturns
  -> refundOrderAdmin [F]
  -> Stripe Refund [EXT]
  -> stripeWebhook/syncRefundStatusAdmin [F]
  -> order refunded [DB]
  -> stock restaure [DB]
  -> email client
```

### 4.6 Analytics

Etat executable V3 code, non deploye:

```text
AnalyticsCollectorIsland [C, layout racine, sauf /admin]
  -> file IndexedDB bornee + lots batchId/tabSessionId/seq
  -> /api/analytics/v3/{session,batch,close,privacy} [API same-origin]
  -> analytics_sessions_v3/{sessionId}/chunks/{batchId} [DB]
  -> finalizeAnalyticsSessionsV3 [F]
  -> analytics_session_facts_v3 + shards journaliers [DB]
  -> compactAnalyticsDaysV3 / compactAnalyticsMonthsV3 [F]

orders + Stripe durable [DB/F]
  -> onOrderStatsWrite
  -> analytics_business_facts_v3 + compact overview [DB]

AdminAppIsland -> AdminDataStudio [C] (lazy direct, sans charger le dashboard V2)
  |-- etat moteur/qualite -> getAnalyticsOverviewV3 [F] -> compacts jours/mois + metadonnees non sensibles
  |-- Vue d'ensemble -> DataOverview + model [C] -> timeline, intentions, commerce et catalogue borne
  |-- Parcours -> DataJourneys + atlas borne [C] -> transitions compactees
  `-- Sessions -> DataSessions [C] -> list/getAnalyticsSession*V3 [F] -> pagination 25 racines + chunks au clic
```

Contrat et gates restants: `_DOCS/data/ARCHITECTURE_ANALYTICS.md`. L'ancienne interface Data V2 a ete retiree; son historique reste disponible dans Git. Aucun deploiement V3 n'a encore ete execute.

## 5. Arborescence racine

```text
.
|-- AGENTS.md ......................... Bible agents, etat, regles et index
|-- map.md ............................ Cette cartographie
|-- _DOCS/ ........................... Chapitres canoniques
|-- app/ ............................. Next App Router
|-- src/ ............................. Modules UI/metier et helpers
|-- functions/ ....................... Cloud Functions privees, codebase main
|-- functions-public/ ................ Endpoint catalogue public isole
|-- scripts/ ......................... Gates, E2E, audits, migrations
|-- tests/ ........................... Contrats Node et smoke Playwright
|-- deploy/ .......................... Dashboard sandbox
|-- public/ .......................... Assets statiques servis tels quels
|-- .agents/skills/ .................. Skills locaux UI/design
|-- .github/workflows/quality.yml .... CI Node 22/pnpm
|-- package.json / pnpm-lock.yaml .... Dependances et commandes racine
|-- next.config.mjs .................. Next, CSP, headers, images, redirects
|-- apphosting.yaml .................. App Hosting sandbox
|-- firebase.json .................... Firebase resources et codebases
|-- .firebaserc ...................... Alias projet sandbox
|-- firestore.rules ................. Autorisations Firestore
|-- firestore.indexes.json .......... Indexes/exemptions
|-- storage.rules .................... Autorisations Storage
|-- playwright.config.mjs ........... Configuration navigateur
|-- eslint.config.mjs ............... Qualite statique
`-- .env.* ........................... Contrats locaux, secrets reels non documentes
```

## 6. Arborescence `app/`

```text
app/
|-- layout.jsx ........................ layout racine, metadata, providers globaux
|-- AnalyticsCollectorIsland.jsx ...... collecteur V3 global, sessions par onglet et reprise offline
|-- page.jsx .......................... `/`, galerie canonique
|-- error.jsx ......................... erreur client racine
|-- not-found.jsx ..................... 404
|-- sitemap.js ........................ sitemap public
|-- robots.js ......................... robots
|-- RouteClientProviders.jsx .......... providers des tunnels client
|-- RouteTransitionIsland.jsx ......... transitions globales
|-- route-transition.config.js ........ contrat des transitions
|-- GalleryMobileShellIsland.jsx ...... shell mobile galerie
|-- HeroVideoSliderIsland.jsx ......... hero video interactif
|-- HomeMotionIslandV4.jsx ............ motion home
|-- MobileNavIsland.jsx ............... navigation mobile
|-- galerie/
|   `-- page.jsx ...................... alias `/galerie`
|-- categorie/[categoryId]/
|   `-- page.jsx ...................... SSG/ISR categorie + metadata
|-- produit/[slugOrId]/
|   `-- page.jsx ...................... SSG/ISR produit + JSON-LD/preloads
|-- a-propos/
|   `-- page.jsx ...................... page vitrine serveur
|-- devis/
|   `-- page.jsx ...................... page devis serveur + formulaire differe
|-- recherche/
|   `-- page.jsx ...................... recherche noindex
|-- wishlist/
|   |-- page.jsx ...................... route dynamique
|   `-- WishlistPageIsland.jsx ........ donnees et actions wishlist
|-- checkout/
|   |-- page.jsx ...................... route dynamique
|   `-- CheckoutPageIsland.jsx ........ auth/panier vers CheckoutView
|-- mes-commandes/
|   |-- page.jsx ...................... route dynamique
|   |-- loading.jsx ................... loading coherent du compte
|   `-- OrdersPageIsland.jsx .......... auth, orders et wishlist
|-- admin/
|   |-- layout.jsx .................... layout admin
|   |-- page.jsx ...................... route dynamique
|   |-- AdminAppIsland.jsx ............ shell, groupes, lazy tabs, gates admin
|   `-- AdminSidebar.jsx .............. navigation laterale responsive
`-- api/
    |-- analytics/v3/* ................. ingestion et retrait analytics same-origin
    |-- search/route.js ............... recherche catalogue
    `-- revalidate-catalog/route.js ... revalidation admin
```

## 7. Arborescence `src/`

### 7.1 Styles et assets

```text
src/
|-- index.css ......................... styles globaux et contrats responsive
|-- home-v4.css ....................... styles home version courante
`-- assets/
    |-- quote-restoration-hero.webp ... media devis actif
    |-- quote-restoration-hero.png .... source/candidat nettoyage controle
    |-- marseille-vieux-port-blueprint.png
    `-- marseille-notre-dame-blueprint.png
```

### 7.2 Configuration, contexte et Auth

```text
src/kit/
|-- auth/
|   `-- authStore.js .................. source et abonnement session UI
|-- contexts/
|   |-- AuthContext.jsx ............... login Google/OTP/passkey et session
|   `-- AnalyticsContext.jsx .......... contexte analytics
|-- config/
|   |-- constants.js .................. taxonomie, collections, tabs admin
|   |-- firebaseCore.js ............... app Firebase minimale
|   |-- firebaseLazy.js ............... services/Functions charges a la demande
|   |-- firebase.js ................... facade Firebase historique/active
|   |-- firebaseEnv.js ................ resolution env Firebase
|   |-- firebaseStorage.js ............ Storage
|   |-- stripe.js ..................... Stripe client
|   `-- theme.js ...................... theme partage
|-- shared/
|   |-- AnalyticsProvider.jsx ......... pipeline analytics navigateur
|   |-- clientPerf.js ................. mesures client
|   |-- publicCatalogCache.js ......... cache catalogue navigateur
|   |-- pageTaxonomy.js ............... taxonomie analytics/routes
|   |-- SEO.jsx ....................... helper SEO client historique
|   |-- ErrorBoundary.jsx ............. frontiere erreur
|   `-- CustomerTestimonialsCarousel.jsx
`-- ui/
    `-- Toast.jsx ...................... notifications
```

### 7.3 Marketplace public

```text
src/kit/marketplace/
|-- GalleryRoutePage.jsx .............. composition donnees de `/` et `/galerie`
|-- GalleryServerView.jsx ............. rendu final galerie
|-- MarketplaceHeroServer.jsx ......... hero serveur
|-- AnnouncementBannerServer.jsx ...... bandeau commercial
|-- ArchitecturalHeaderServer.jsx ..... header serveur
|-- CategoryRailServer.jsx ............ rail categories
|-- GalleryProductCardServer.jsx ...... carte produit serveur
|-- ProductSectionsServer.jsx ......... sections fixes galerie
|-- FooterServer.jsx .................. footer serveur
|-- GalleryGridActionsIsland.jsx ...... actions des cartes
|-- GalleryFixedSectionsInteractions.jsx
|-- HeroMotionIsland.jsx .............. animation hero
|-- InstagramFloatingTokensReveal.jsx . reveal Instagram
|-- CategoryServerView.jsx ............ page categorie
|-- CategoryControlsIsland.jsx ........ filtres/tri categorie
|-- categoryViewModel.js .............. modele categorie
|-- ProductDetailServerView.jsx ....... fiche produit serveur
|-- ProductDetailShellIsland.jsx ...... galerie/detail interactif
|-- ProductDetailActionsIsland.jsx .... panier/wishlist/devis
|-- ProductDetailLightboxIsland.jsx ... zoom medias
|-- PageBreadcrumb.jsx ................ fil d'Ariane
|-- SearchSuggestIsland.jsx ........... suggestions header
|-- SearchResultsIsland.jsx ........... resultats page
|-- searchModel.js .................... normalisation/recherche
|-- seoCopy.js ........................ textes SEO marketplace
|-- WishlistToggleIsland.jsx .......... action wishlist
|-- WishlistView.jsx .................. vue wishlist
|-- wishlistState.js .................. persistence/abonnement wishlist
|-- CartPanelIsland.jsx ............... panneau panier
|-- LazyCartPanelIsland.jsx ........... chargement differe panier
|-- DarkModeToggleIsland.jsx .......... theme
|-- HeaderAccountIsland.jsx ........... etat compte header
|-- GlobalMenuTriggerIsland.jsx ....... bouton menu
|-- PremiumMegaMenuIsland.jsx ......... panneau principal
|-- PremiumMegaMenuLazyIsland.jsx ..... facade lazy
|-- GlobalMenuPanelAuthIsland.jsx ..... compte/auth differe dans menu
|-- LegacyLoginModalFullIsland.jsx .... modale Auth actuelle (nom historique)
|-- QuoteRequestServerView.jsx ........ page devis serveur
|-- QuoteFormSsrShell.jsx ............. shell formulaire
|-- QuoteFormDeferredIsland.jsx ....... lazy formulaire
|-- QuoteFormIsland.jsx ............... formulaire interactif
|-- FooterBackToTopButtonIsland.jsx ... retour haut
`-- FooterMapFrameIsland.jsx .......... carte footer differee
```

### 7.4 Commerce et espace client

```text
src/kit/commerce/
|-- CartSidebar.jsx ................... UI panier
|-- guestCart.js ...................... panier invite/handoff
|-- purchasability.js ................. regle unique achetable
|-- CheckoutView.jsx .................. orchestration checkout
|-- CheckoutStripeModal.jsx ........... suivi commande/paiement
|-- CheckoutPaymentStep.jsx ........... Stripe Payment Element
|-- OrderSuccessModal.jsx ............. confirmation
|-- MyOrdersView.jsx .................. espace client
`-- LoginView.jsx ..................... login admin/compatibilite
```

### 7.5 Layout et vitrine

```text
src/kit/layout/
|-- GlobalMenu.jsx .................... facade menu
|-- GlobalMenuDesktop.jsx ............. composition desktop
|-- GlobalMenuMobile.jsx .............. composition mobile
`-- Footer.jsx ........................ facade footer historique/partagee

src/kit/vitrine/
|-- AboutServerView.jsx ............... rendu A propos
|-- aboutContent.js ................... contenu structure
|-- AboutCriticalStyles.jsx ........... styles critiques
|-- about-sv4-hero.css ................ styles hero
|-- Sv4HomeHero.jsx / Sv4SiteNav.jsx .. composants vitrine
|-- AboutSv4HeroMotionIsland.jsx ...... motion hero
|-- AboutMotionIsland.jsx ............. motion principale
|-- AboutMotionDeferredIsland.jsx ..... motion differee
|-- AboutStylesIsland.jsx ............. styles client
|-- AboutBeforeAfterIsland.jsx ........ avant/apres
|-- AboutFaqIsland.jsx ................ FAQ
|-- AboutInstagramCounterIsland.jsx ... compteur social
|-- AboutTestimonialsIsland.jsx ....... temoignages
`-- AboutVitrineNavIsland.jsx ......... navigation vitrine
```

### 7.6 Back-office

```text
src/kit/admin/
|-- AdminDashboard.jsx ................ stats, exports et maintenance rapide
|-- AdminDataStudio.jsx ............... orchestrateur Data V3 charge directement par AdminAppIsland
|-- data-studio/
|   |-- model.js ...................... modele de presentation, etats moteur et erreurs classees
|   |-- DataEngineState.jsx ........... connexion, vide honnete, zero mesure et erreur actionnable
|   |-- DataReliability.jsx ........... facts techniques de mesure, jamais score visiteur
|   |-- DataOverview.jsx .............. KPI, timeline, devis, commerce et catalogue borne
|   |-- DataJourneys.jsx .............. atlas de transitions bornees
|   |-- DataSessions.jsx .............. pagination, registre et inspecteur consenti
|   `-- DataStudio.module.css ......... systeme visuel isole, responsive et reduced-motion
|-- AdminForm.jsx ..................... creation/edition annonces
|-- AdminItemList.jsx ................. liste publications
|-- GlobalInventoryView.jsx ........... vue catalogue/ordres
|-- AdminStudio.jsx ................... studio contenu
|-- AdminHomepage.jsx ................. personnalisation publique
|-- AdminOrders.jsx ................... ventes/logistique
|-- AdminReturns.jsx .................. remboursements
|-- AdminLivraison.jsx ................ configuration livraison
|-- AdminUsers.jsx .................... comptes/acces admin
|-- AdminIPManager.jsx ................ configuration IP complementaire
|-- AdminIPTracker.jsx ................ collecte signal IP admin
|-- AdminSEO.jsx ...................... outils SEO
|-- AdminNewsletter.jsx ............... abonnes/informations
|-- AdminPaymentSettings.jsx .......... Stripe Connect/carte
|-- AdminMaintenance.jsx .............. maintenance
|-- AdminSiteMap.jsx .................. carte parcours/analytics
|-- siteMapModel.js ................... modele de carte
|-- PerformanceArchitectureStudy.jsx .. etude performance embarquee
|-- PerformanceArchitectureStudy.css
|-- analyticsReliability.js ........... fiabilite/checkpoints
|-- exportCsv.js ...................... exports
|-- publicCatalogInvalidation.js ...... version + revalidation
|-- hooks/useLiveJourneyMap.js ........ carte live
`-- components/
    |-- AdminImageCard.jsx
    |-- ImageCropperModal.jsx
    `-- TextEditorModal.jsx
```

### 7.7 Bibliotheques serveur et utilitaires

```text
src/lib/server/
|-- env.js ............................ env publique/serveur
|-- firebaseAdmin.js .................. Firebase Admin Next
|-- products.js ....................... acces/normalisation catalogue
|-- galleryPersonalization.js ......... metadata galerie
|-- about.js .......................... donnees A propos
`-- theme.js .......................... theme serveur

src/lib/seo/
|-- categories.js ..................... taxonomie URL/SEO
|-- indexability.js ................... garde-fous indexation
`-- productStructuredData.js .......... JSON-LD produit

src/utils/
|-- imageUtils.js ..................... variantes/metadata/images
|-- generateInvoice.js ................ PDF facture
|-- shippingAddress.js ................ format adresse
|-- slug.js ........................... slugs
`-- time.js ........................... temps/dates
```

## 8. Arborescence Functions

```text
functions/
|-- index.js .......................... exports codebase main
|-- helpers/
|   |-- runtime.js .................... region et logs perf
|   |-- security.js ................... auth/assurance/validation
|   |-- secrets.js .................... definitions Secret Manager
|   `-- config.js ..................... config serveur
`-- src/
    |-- auth/
    |   |-- grantAdmin.js
    |   |-- adminManagement.js
    |   |-- customerLoginOtp.js
    |   |-- guestCheckoutOtp.js
    |   `-- passkeys.js
    |-- commerce/
    |   |-- createOrder.js
    |   |-- stripeWebhook.js
    |   |-- stripeConnect.js
    |   |-- cancelOrder.js
    |   |-- cleanupPendingPayments.js
    |   |-- refundOrder.js
    |   |-- orderStatus.js
    |   |-- orderStats.js
    |   |-- e2eCheckoutProof.js
    |   `-- e2eStripeHardeningProof.js
    |-- email/
    |   |-- transactionalEmail.js
    |   |-- transactionalEmailRuntime.js
    |   `-- orderEmails.js
    |-- analytics/
    |   |-- constants.js
    |   |-- sessions.js
    |   |-- rollups.js
    |   |-- updateUserSessions.js
    |   |-- adminIP.js
    |   |-- v3Core.js / v3Jobs.js ...... reconciliation, HLL et compactions
    |   |-- v3Readers.js ............... lecteurs admin bornes
    |   |-- v3BusinessFacts.js ......... conversions serveur idempotentes
    |   `-- v3Privacy.js ............... retrait et reconstruction des jours
    |-- maintenance/
    |   |-- tools.js
    |   `-- inventoryStats.js
    |-- triggers/
    |   |-- onArtifactDeleted.js
    |   |-- onArtifactUpdated.js
    |   `-- mediaCleanup.js
    `-- seo/
        `-- seoTools.js ............... Firebase Hosting legacy

functions-public/
|-- index.js .......................... export publicCatalog
`-- src/public/catalog.js ............. catalogue public cache/version/CORS
```

## 9. Exports Cloud Functions

| Domaine | Exports |
| --- | --- |
| commerce | `createOrder`, `stripeWebhook`, `stripeConnectWebhook`, `cancelOrderClient`, `cleanupPendingPayments`, `getOrderStatusClient` |
| refunds/Connect | `refundOrderAdmin`, `syncRefundStatusAdmin`, `getStripeConnectStatus`, `startStripeConnectOnboarding`, `syncStripeConnectAccount`, `requestStripeConnectReconnect`, `confirmStripeConnectReconnect` |
| preuves E2E | `e2eCheckoutProof`, `e2eStripeHardeningProof` |
| Auth/admin | `grantAdminOnAuth`, `addAdminUser`, `removeAdminUser`, `logUserConnection`, `getUserStats`, `syncSuperAdminClaim`, `ensureAdminAccessRegistry` |
| OTP/passkeys | `sendGuestCheckoutOtp`, `verifyGuestCheckoutOtp`, `sendCustomerLoginOtp`, `verifyCustomerLoginOtp`, quatre endpoints passkey |
| e-mail | `onOrderCreated`, `onOrderUpdated`, `sendTestEmail`, `sendRefundStatusEmailAdmin` |
| analytics | V2 preserve; V3 `finalizeAnalyticsSessionsV3`, compactions jours/mois, trois lecteurs admin, retrait privacy; facade d'ingestion dans Next |
| maintenance | resets/purges, `runGarbageCollector`, `getUploadUrl`, `onInventorySourceWrite` |
| SEO legacy | `sitemap`, `shareMeta`, `homeMeta`, `aboutMeta`, `productMeta`, `categoryMeta` |
| triggers catalogue | `onArtifactDeleted`, `onArtifactUpdated` |
| public | `publicCatalog` dans le codebase `public` |

## 10. Donnees

```text
Firestore
|-- artifacts/{appId}/public/data/furniture/{productId}
|-- artifacts/{appId}/public/meta
|-- users/{uid}
|   |-- cart/{itemId}
|   |-- wishlist/{itemId}
|   |-- passkeys/{credentialId}
|   `-- passkey_challenges/{type}
|-- orders/{orderId}
|-- newsletter_subscribers/{id}
|-- sys_metadata/{docId}
|-- sys_ratelimit/{id} ................ backend-only
|-- sys_admin_access/{uid} ............ backend-only
|-- sys_idempotency/{id} .............. backend-only
|-- analytics_sessions/{sessionId}
|   |-- journey_steps/{id}
|   `-- custom_events/{id}
|-- analytics_item_daily/{id}
|-- analytics_page_daily/{id}
|-- analytics_transition_daily/{id}
|-- analytics_unique_markers/{id}
|-- analytics_sessions_v3/{sessionId}/chunks/{batchId}
|-- analytics_session_facts_v3/{sessionId}
|-- analytics_business_facts_v3/{factId}
|-- analytics_rollup_days_v3/{dayKey}/{summary_shards|compact}
|-- analytics_rollup_months_v3/{monthKey}/compact/{view}
|-- analytics_admin_audit_v3/{auditId}
|-- analytics_privacy_requests_v3/{requestId}
|-- dashboard_stats/{id}
|-- sales_stats_daily/{id}
`-- inventory_stats/{id}

Storage
|-- furniture/... ..................... sources et medias produit
|-- furniture/thumbnails/... .......... thumb320/thumb384/thumb
|-- furniture/responsive/... .......... card/detailFast/medium/large/full
`-- autres chemins admin .............. contenus hero/about selon configuration
```

## 11. Scripts et tests

### Gates de contrat

```text
check-next-route-classification.cjs
check-mobile-marketplace-contract.cjs
check-seo-indexability.cjs
check-performance-budget.cjs
check-product-ssr.mjs
```

### Audits performance

```text
audit-gallery-direct.mjs
audit-category-direct.mjs
audit-product-page-direct.mjs
audit-about-direct.mjs
audit-quote-direct.mjs
audit-desktop-global-menu.mjs
audit-mobile-global-menu.mjs
audit-gallery-scroll-lag.mjs
audit-product-detail-images*.mjs
benchmark-auth-ui.mjs
```

### E2E cloud

```text
e2e-auth-email-otp.mjs
e2e-hosted-stripe-checkout.mjs
e2e-refund-latest-stripe-order.mjs
e2e-revalidate-catalog.mjs
read-latest-auth-otp.mjs .............. outil local sensible
```

### Donnees/images

```text
backfill-product-image-*.cjs
backfill-product-thumbnails.cjs
audit-storage-orphans.cjs
cleanup-product-image-variants.cjs .... destructif, confirmation forte
copy-firestore-project.mjs
replace-firestore-string.mjs
seed-catalogue.mjs
purge-expired-firestore.cjs
```

### Tests Node

```text
tests/auth-*.test.cjs
tests/passkey-*.test.cjs
tests/analytics-v3-contract.test.cjs
tests/analytics-v3-ui-model.test.mjs
tests/smoke.spec.mjs
```

## 12. Matrice d'impact rapide

| Changement | Lire | Zones a inspecter | Gates typiques |
| --- | --- | --- | --- |
| route/rendu/SEO | `NEXTJS_SEO.md` | `app`, `src/lib/seo`, ServerViews | SEO, routes, build, direct route |
| annonce/categorie | `ANNONCES_CATALOGUE.md` | AdminForm, products, constants, publicCatalog | galerie/categorie/produit/revalidation |
| menu/mobile | `INTERFACE_NAVIGATION.md` | layout, marketplace menu/header, CSS | menus + mobile contract |
| image | `IMAGES_MEDIA.md` | imageUtils, AdminForm, Storage/scripts | images dry-run + routes |
| Auth | `AUTHENTIFICATION.md` | authStore, AuthContext, modal, auth Functions | `test:auth` + smoke |
| securite/rules | `SECURITE_GLOBALE.md` | rules, helpers security, Functions | tests negatifs + sandbox cible |
| espace client | `ESPACE_CLIENT.md` | routes compte, MyOrders, wishlist | smoke compte |
| paiement/refund | `COMMERCE_STRIPE.md` | commerce client/Functions/admin | E2E sandbox explicite |
| admin | `BACKOFFICE.md` | AdminAppIsland, tabs, Functions | smoke tabs + action cible |
| infra | `INFRASTRUCTURE.md` | yaml/json/env/runtime | audits read-only + build |
| performance | `PERFORMANCE.md` | route et bundle responsables | gate identique avant/apres |
| donnees | `DONNEES_ANALYTICS.md` + `ARCHITECTURE_ANALYTICS.md` | rules/indexes/scripts/Functions/collecteur Next | dry-run/comptage/rollback + gates analytics |

## 13. Dossiers generes ou non canoniques

Ne pas inclure dans une cartographie fonctionnelle ni modifier comme source:

```text
.next/
node_modules/
.pnpm-store/
logs/
test-results/
playwright-report/
.firebase/
dist/
```

Les dossiers de travail image/video (`imagediag`, `imageexport`, `imagehero`, `imageproduit`, `videohero`) sont des sources/outils locaux potentiels. Toute suppression demande inventaire des imports, comparaison avec `public`/`src/assets` et validation visuelle.
