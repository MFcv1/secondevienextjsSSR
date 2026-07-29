# Cartographie du projet Seconde Vie Next

Derniere verification: 2026-07-29
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
|-- /api/catalog ..................... Snapshot public same-origin non persistant
|-- /api/catalog/version ............. Identite publique minimale ETag/304
|-- /api/revalidate-catalog .......... Invalidation ISR signee du catalogue
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
| `/api/search` | `[API]` | reponse non persistante | non indexable | `route.js` | recherche serveur |
| `/api/catalog` | `[API]` | reponse non persistante | non indexable | `route.js` | catalogue materialise |
| `/api/catalog/version` | `[API]` | ETag/304 revalide | non indexable | `route.js` | revision + aggregateSha256 |
| `/api/revalidate-catalog` | `[API]` | aucun | non indexable | `route.js` | HMAC builder + revalidation catalogue |

## 4. Parcours et dependances

### 4.1 Consultation catalogue

```text
route publique [S]
  -> src/lib/server/products.js
  -> src/lib/server/materializedCatalog.js
  -> current/previous/last-known-good [ST]
  -> snapshot catalogue immuable [ST]
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
  -> onCatalogSourceWrite [F]
  -> Cloud Tasks build [EXT]
  -> snapshot/manifeste/impact-plan [ST]
  -> CAS current puis previous/LKG [ST]
  -> dispatchCatalogRevalidation [F]
  -> /api/revalidate-catalog HMAC [API]
  -> tag pointeur API + chemins impactes
  -> preuve /api/catalog/version + HTML versionne
  -> sys_catalog_live/current [DB] -> onglets visibles -> router.refresh
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
  -> session admin persistante pour les lectures
  -> mutation sensible expiree -> evenement step-up -> meme modale, sans signOut
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
  -> fermeture/reload: descriptor UID -> resumeCheckoutV2 -> meme PaymentIntent
  -> stripeWebhook [F]
  -> order paid + email triggers
  -> /mes-commandes + /admin

confinement Gate 0B SANDBOX_ACTIVE
  |-- createOrder/manual/deferred -> refus fail-closed avant effet
  |-- fermeture/client/admin/cleanup/refund -> aucun release legacy
  |-- webhook PI existant -> drainage signe + lease fencee
  |-- Admin commerce -> consultation read-only
  `-- Rules -> orders/policy/champs commerce/delete media fermes
```

L'audit et la roadmap temporaire 0A a 8 sont clos. Leur verite durable est
fusionnee dans `_DOCS/commerce/COMMERCE_STRIPE.md` et les chapitres canoniques
admin, client, qualite, infrastructure et exploitation.

La reprise post-Gate 8 est bornee par
`_DOCS/commerce/COMMERCE_REPRISE.md` et le handoff `TODO.md`. R2 a execute une
fenetre `v2_all` catalogue reel autorisee puis refermee le 2026-07-29. La suite
revient a R1 UX et n'autorise aucune activation `v2_all` permanente, live ou
production.

Noyau v2 deploye en sandbox, writer verrouille par controle absent:

```text
politique/control backend fail-closed
  -> schema v2 + validateurs/reducer pur
  -> commandId/payloadHash/expectedVersion idempotents
  -> policy/livraison/Connect epingles [Gate 2]
  -> inventoryKey + holds quantitatifs [Gate 2]
  -> projection legacy + readers v1/v2
  -> lecteurs UID/admin frontend actifs
  -> timeline admin bornee: creation/paiement + journal annulation/refund
  -> flags checkout/reprise et commandes frontend off
  -X createCheckout/mutations v2 refuses par controle serveur explicite off

Flux cible restant:

politique/control backend fail-closed
  -> createCheckout + clientOrderId/requestHash
  -> reservation quantitative par commande/cle inventaire
  -> saga PaymentIntent idempotente
  -> inbox webhook a lease + reducer/reconciler commun
  -> axes payment/fulfillment/custody + refunds/returns separes
  -> projections legacy, outbox, stats et documents reconstruisibles
  -> UI client/admin via commandes serveur
```

Gates 0A a 8 sont fermees en sandbox depuis le 2026-07-28. Apres la fenetre
catalogue reel du 2026-07-29, checkout et workers v2 sont de nouveau bornes a
`fixture_gate6_20260728`; lecteurs UID/admin et exploitation restent actifs.
Les flags UI transactionnels sont refermes, les mutations admin sont
`read_only` et le paiement offline reste `off`.

Gate 6 ajoute un rail de migration sans writer:

```text
scripts/classify-legacy-commerce.mjs
  -> pagination orders + checkpoint local ignore
  -> relecture Stripe sandbox des etats financiers ambigus
  -> legacy_terminal_read_only | safe_to_adopt | needs_review
  -> manifeste hash/updateTime sans PII

scripts/prepare-commerce-fixtures.mjs
  -> preflight + sauvegarde des cibles
  -> UID technique Firebase Auth
  -> produits furniture e2eOnly stocks 1/2/10
  -> policy + compte Connect v2 + commerce_fixture_scopes backend-only
  -> sys_commerce_control/current explicitement newCheckoutMode=off

scripts/build-commerce-release-manifest.mjs
  -> manifeste Gate 7A immutable, hash source et cibles regionales

scripts/activate-commerce-fixture.mjs
  -> activation atomique fail-closed du seul scope et manifeste epingles

scripts/commerce-v2-all-window.mjs
  -> preflight, ouverture et fermeture auditee `v2_all` sur cinq produits exacts
  -> policy UI sandbox epinglee puis policy precedente restauree

scripts/confirm-commerce-order-v2.mjs
scripts/refund-commerce-order-v2.mjs
scripts/cleanup-paid-order-cart-v2.mjs
  -> commandes sandbox exactes, cible/etat/montant/confirmation fail-closed

scripts/inspect-commerce-orders-v2.mjs
scripts/audit-commerce-orders-v2.mjs
  -> lecture bornee des commandes, Stripe, stocks, mouvements, outbox et faits
```

Le scope `fixture_gate6_20260728` ne reference que les produits
`fixture_*`; le snapshot public exclut `e2eOnly`. Aucune adoption legacy ni
activation checkout n'est effectuee en Gate 6.

### 4.5 Remboursement

```text
AdminReturns
  -> refundOrderAdmin legacy refuse avant effet [F]
  -> stripeWebhook/syncRefundStatusAdmin drainent un refund deja ouvert [F]
  -> order refunded [DB]
  -> physicalDispositionRequired=true
  `-> aucune remise en stock automatique
```

La cible separe refund financier, retour physique, inspection et remise en stock.

### 4.6 Analytics

```text
AnalyticsCollectorIsland + AuthProvider anonyme [C]
  -> AnalyticsProvider [C]
  -> heartbeat adaptatif + raisons init/route/visible/beacon [C]
  -> initLiveSession/syncSession/beacon + cache borne du hash de jeton [F]
  -> analytics_sessions/{sessionId} avec journey et compteurs de raisons embarques [DB]
  -> AdminDashboard: intentions/tendances 30 jours + miniatures du snapshot public court [C]
  -> AdminAnalytics: historique borne, cache IndexedDB, listener live et frise illustree [C]
  -> UID/IP, courbe, bandeau live cumulatif, visiteurs et parcours [C]
```

Mesure des lectures et couts: `_DOCS/data/AUDIT_COUTS_FIRESTORE.md` (Usage Insights, Query Insights, Monitoring, Data Access et attribution au code).

## 5. Arborescence racine

```text
.
|-- AGENTS.md ......................... Bible agents, etat, regles et index
|-- map.md ............................ Cette cartographie
|-- _DOCS/ ........................... Chapitres canoniques
|-- app/ ............................. Next App Router
|-- src/ ............................. Modules UI/metier et helpers
|-- functions/ ....................... Cloud Functions privees, codebase main
|-- scripts/ ......................... Gates, E2E, audits, migrations
|-- tests/ ........................... Contrats Node et smoke Playwright
|-- deploy/ .......................... Dashboard sandbox
|-- public/ .......................... Assets statiques servis tels quels
|-- .agents/skills/ .................. Skills locaux UI/design
|-- .github/workflows/quality.yml .... CI Node 22/pnpm
|-- package.json / pnpm-lock.yaml .... Dependances et commandes racine
|-- next.config.mjs .................. Next, deploymentId, expiration ISR, CSP, headers et redirects
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
|-- page.jsx .......................... `/`, galerie canonique
|-- error.jsx ......................... erreur client racine
|-- not-found.jsx ..................... 404
|-- sitemap.js ........................ sitemap public
|-- robots.js ......................... robots
|-- RouteClientProviders.jsx .......... providers des tunnels client
|-- RouteTransitionIsland.jsx ......... transitions globales
|-- route-transition.config.js ........ contrat des transitions
|-- ViewportHeightSyncIsland.jsx ...... hauteur visualViewport globale et persistante
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
|   |-- AdminAppIsland.jsx ............ shell, groupes, lazy tabs, gate facturation, catalogue snapshot a la demande
|   `-- AdminSidebar.jsx .............. navigation laterale responsive
`-- api/
    |-- catalog/route.js .............. catalogue snapshot same-origin
    |   `-- version/route.js .......... version minimale ETag/304
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
|   `-- AuthContext.jsx ............... login Google/OTP/passkey et session
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
|   |-- analyticsEvents.js ............ bus borne des actions metier vers la session
|   |-- clientPerf.js ................. mesures client
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
|-- ProductCardMediaServer.jsx ........ media carte canonique galerie/categorie
|-- CatalogVersionSyncIsland.jsx ...... signal visible + garde version/prefetch
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
|-- ProductReturnRestoreIsland.jsx .... retour produit vers position galerie/categorie
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
|-- checkoutController.js ............. controller v2 et stateVersion
|-- orderAdapter.js ................... lecture UI v1/v2 sans ambiguite
|-- checkoutRecovery.js ............... reprise 3DS/reload namespacee, sans secret
|-- checkoutContract.js ............... entree checkout allowlistee, sans prix client
|-- commerceV2Client.js ............... lecteurs v2 on; checkout/reprise Gate 5 off
|-- commerceCommandClient.js .......... commandes admin/client, flags Gate 4 off
|-- adminProductCommandClient.js ...... callables produit, flag Gate 4 off
|-- OrderSuccessModal.jsx ............. confirmation
|-- MyOrdersView.jsx .................. espace client
`-- LoginView.jsx ..................... login admin/compatibilite
```

### 7.5 Layout et vitrine

```text
src/kit/layout/
|-- GlobalMenu.jsx .................... facade menu
|-- GlobalMenuDesktop.jsx ............. composition desktop
`-- GlobalMenuMobile.jsx .............. composition mobile

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
`-- AboutTestimonialsIsland.jsx ....... temoignages
```

### 7.6 Back-office

```text
src/kit/admin/
|-- AdminDashboard.jsx ................ pilotage commerce, devis/tendances analytics bornes, miniatures du snapshot public, exports et maintenance rapide
|-- AdminAnalytics.jsx ................ moteur Data canonique: UID/IP, live, parcours illustres, courbes
|-- AdminForm.jsx ..................... creation/edition annonces
|-- AdminItemList.jsx ................. liste publications
|-- GlobalInventoryView.jsx ........... vue catalogue/ordres
|-- AdminStudio.jsx ................... studio contenu
|-- AdminHomepage.jsx ................. personnalisation publique
|-- AdminOrders.jsx ................... ventes/logistique
|-- AdminReturns.jsx .................. remboursements + retours physiques detailles
|-- AdminLivraison.jsx ................ configuration livraison
|-- AdminUsers.jsx .................... comptes/acces admin
|-- AdminIPManager.jsx ................ configuration IP complementaire
|-- AdminIPTracker.jsx ................ collecte signal IP admin
|-- AdminSEO.jsx ...................... outils SEO
|-- AdminNewsletter.jsx ............... abonnes/informations
|-- AdminPaymentSettings.jsx .......... Stripe Connect/carte
|-- AdminMaintenance.jsx .............. maintenance
|-- AdminAccount.jsx .................. profil admin et conteneur onboarding dedie
|-- BillingOnboardingGuide.jsx ........ guide Google Billing manuel, progression et placeholders captures
|-- BillingOnboardingOperator.jsx ..... validation/reinitialisation admin forte
|-- analyticsReliability.js ........... fiabilite/checkpoints
|-- exportCsv.js ...................... exports
|-- adminDataCache.js ................. cache memoire borne Stats/Ventes/Retours
|-- adminPublicCatalog.js ............. lecture snapshot admin sans cache persistant
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
|-- productRoute.js ................... resolution pure ID ou slug canonique, y compris IDs avec tirets
|-- materializedCatalog.js ............ lecteur Storage current/previous/LKG
|-- materializedCatalogValidation.cjs . schema, hashes et contrat snapshot
|-- catalogRevalidationContract.js .... validation plan/projet/audience
|-- catalogVersionContract.js ......... payload version et contrat 200/304
|-- galleryPersonalization.js ......... metadata galerie
|-- about.js .......................... donnees A propos
`-- theme.js .......................... theme serveur

src/lib/seo/
|-- categories.js ..................... taxonomie URL/SEO
|-- indexability.js ................... garde-fous indexation
`-- productStructuredData.js .......... JSON-LD produit

src/utils/
|-- imageUtils.js ..................... variantes/metadata/images
|-- generateCommerceDocument.js ....... PDF sandbox non fiscal depuis document immutable
|-- generateInvoice.js ................ generateur PDF legacy non fiscal et masque
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
    |   |-- legacyContainment.js ........ hard-stop backend fail-closed Gate 0B
    |   |-- domain/ ...................... noyau v2 Gates 1 a 4, mutations off
    |   |   |-- orderState.js ............ schema, factory, reducer, reader
    |   |   |-- money.js
    |   |   |-- inventoryInvariants.js
    |   |   |-- legacyProjection.js
    |   |   |-- policy.js
    |   |   |-- idempotency.js
    |   |   |-- dependencies.js
    |   |   |-- failpoints.js
    |   |   |-- checkoutInput.js ......... entree allowlistee et lignes versionnees
    |   |   |-- inventoryKey.js .......... identite canonique de SKU
    |   |   |-- connectPolicy.js ......... readiness et compte epingle
    |   |   |-- reservationRepository.js . mouvements hold/commit/release
    |   |   |-- checkoutRepository.js .... order, hold, tentative et identite atomiques
    |   |   |-- checkoutCoordinator.js ... create/resume sur etat durable
    |   |   |-- checkoutSaga.js .......... tentative PI et matrice de reprise
    |   |   |-- checkoutSagaService.js ... orchestration Stripe injectee, non exportee
    |   |   |-- checkoutSagaRepository.js  persistance saga et settlement atomique
    |   |   |-- webhookInbox.js .......... lease, backoff et fencing
    |   |   |-- webhookInboxRepository.js  commit inbox + effet atomique
    |   |   |-- stripeWebhookIngress.js ... signature et scope plateforme/Connect
    |   |   |-- webhookWorker.js .......... retrieve PI puis apply sous fence
    |   |   |-- reconcilePayment.js ...... mapping complet des statuts PI
    |   |   |-- paymentEffectApplier.js ... order/inventaire/fait/outbox atomiques
    |   |   |-- commerceEffects.js ....... faits financiers/outbox deterministes
    |   |   |-- outboxRepository.js / outboxWorker.js ... lease, dead-letter et delivery_unknown
    |   |   |-- financialProjection.js .. projection financiere absolue
    |   |   |-- commerceDocuments.js ..... recus sandbox non fiscaux
    |   |   |-- operationsHealth.js ...... incidents, seuils et sante Gate 7A
    |   |   |-- fixtureScope.js / fixtureCleanup.js ... autorisation et cleanup run-scoped
    |   |   |-- checkoutAccessToken*.js ... token backend opaque rotatif
    |   |   |-- guestCheckoutCoordinator.js
    |   |   |-- boundedWorkerSweeper.js / firestoreWorkerQueries.js
    |   |   |-- reservationExpiryWorker.js
    |   |   |-- allowedActions.js ......... actions client/admin derivees serveur
    |   |   |-- returnCase.js ............. retours/dispositions quantitatifs Gate 4
    |   |   |-- orderCommandRepository.js . fulfillment idempotent + audit
    |   |   |-- cancellationCoordinator.js / cancellationAuditRepository.js
    |   |   |-- refundSaga*.js ............ refund Stripe reprenable et epingle
    |   |   |-- refundRepository.js ....... cumul/fait/outbox atomiques, sans stock
    |   |   |-- returnRepository.js ....... allocations, dispositions et audit
    |   |   |-- productCommands.js ......... transitions produit fermees Gate 4
    |   |   |-- productCommandRepository.js  produit idempotent + audit append-only
    |   |   `-- v2Runtime.js .............. cablage callables et workers Gate 7A
    |   |-- v2ProductCommands.js ........... callables produit exportees, controle mutations off
    |   |-- v2OrderCommands.js ............. callables fulfillment/archive exportees, controle off
    |   |-- v2Cancellation.js .............. callable annulation exportee, controle mutations off
    |   |-- v2ControlGuard.js ............... verrou serveur mutations selon controle
    |   |-- v2Checkout.js .................. create/resume limites au scope fixture
    |   |-- v2Operations.js ................ schedulers et commandes exploitation Gate 7A
    |   |-- v2OrderQueries.js .............. lecteurs UID/admin exportes et actifs
    |   |-- v2RefundCommands.js ............ callable refund exportee, controle mutations off
    |   |-- v2ReturnCommands.js ............ callables retours exportees, controle mutations off
    |   |-- stripeWebhook.js
    |   |-- stripeConnect.js
    |   |-- cancelOrder.js
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
    |   |-- sessionAuthorizationCache.js ... cache borne/TTL du hash de jeton
    |   |-- sessions.js
    |   |-- updateUserSessions.js
    |   `-- adminIP.js
    |-- maintenance/
    |   `-- tools.js
    |-- onboarding/
    |   |-- billingGuide.js ........... callables, modes, etat backend-only
    |   `-- billingGuideContract.js ... modes, etapes, UID cible et format Billing
    |-- triggers/
    |   |-- onArtifactDeleted.js
    |   |-- onArtifactUpdated.js
    |   `-- mediaCleanup.js
    `-- catalog/
        |-- onCatalogSourceWrite.js ... trigger leger, dedup et enqueue
        |-- buildCatalogSnapshot.js ... lease, projection, manifestes et CAS
        |-- snapshotStorage.js ......... objets immuables et pointeurs
        |-- impactPlan.js .............. diff immutable cible/full
        |-- catalogRoutes.js ........... chemins produit/categorie purs
        |-- releaseGarbageCollection.js  retention bornee des releases Storage
        |-- catalogRevalidation.js ..... task HMAC vers App Hosting
        |-- catalogReconciler.js ....... reprise des publications bloquees
        |-- catalogMaintenance.js ...... statut, rollback valide et reconstruction admin
        |-- mediaGarbageCollection.js .. quarantaine media 90 jours + GC quotidien
        `-- publicProjection.js ........ projection publique canonique
```

## 9. Exports Cloud Functions

| Domaine | Exports |
| --- | --- |
| commerce | `createOrder`, `stripeWebhook`, `stripeConnectWebhook`, `cancelOrderClient`, `getOrderStatusClient` |
| commerce v2 checkout/lecture | `createCheckoutV2`, `resumeCheckoutV2`, `listMyOrdersV2`, `listOrdersAdminV2`, `getOrderTimelineAdminV2`, `listReturnsAdminV2` |
| commerce v2 operations | `commerceOutboxDispatcher`, `commerceOperationsReconciler`, `getCommerceOperationsStatusAdmin`, `rebuildCommerceOperationsAdmin`, `cleanupFixtureRunAdmin` |
| refunds/Connect | `refundOrderAdmin`, `syncRefundStatusAdmin`, `getStripeConnectStatus`, `startStripeConnectOnboarding`, `syncStripeConnectAccount`, `requestStripeConnectReconnect`, `confirmStripeConnectReconnect` |
| preuves E2E | `e2eCheckoutProof`, `e2eStripeHardeningProof` |
| Auth/admin | `grantAdminOnAuth`, `onRegisteredUserCreated`, `onRegisteredUserDeleted`, `addAdminUser`, `removeAdminUser`, `logUserConnection`, `getUserStats`, `syncSuperAdminClaim`, `ensureAdminAccessRegistry` |
| OTP/passkeys | `sendGuestCheckoutOtp`, `verifyGuestCheckoutOtp`, `sendCustomerLoginOtp`, `verifyCustomerLoginOtp`, quatre endpoints passkey |
| onboarding facturation | `getBillingGuideStatus`, `saveBillingGuideProgress`, `getBillingGuideOperatorStatus`, `completeBillingGuideAdmin`, `resetBillingGuideTest` |
| e-mail | `onOrderCreated`, `onOrderUpdated`, `sendTestEmail`, `sendRefundStatusEmailAdmin` |
| analytics | `initLiveSession`, `syncSession`, `syncSessionBeacon`, `deleteSession`, `clearAllSessions`, `trackAdminIP`, `updateUserSessions` |
| maintenance | resets/purges, `runGarbageCollector`, `getUploadUrl` |
| triggers catalogue | `onArtifactDeleted`, `onArtifactUpdated` |
| catalogue materialise | `onCatalogSourceWrite`, `dispatchCatalogBuild`, `dispatchCatalogRevalidation`, `catalogReconciler`, `catalogMediaGarbageCollector`, `getCatalogPublicationStatus`, `rollbackCatalogSnapshot`, `rebuildCatalogSnapshot` |

## 10. Donnees

```text
Firestore
|-- artifacts/{appId}/public/data/furniture/{productId}
|-- users/{uid}
|   |-- cart/{itemId}
|   |-- wishlist/{itemId}
|   |-- passkeys/{credentialId}
|   `-- passkey_challenges/{type}
|-- orders/{orderId}
|   |-- documents/{documentId} ........ recus sandbox non fiscaux immutables
|   `-- returns/{returnId} ............ retours physiques, index group updatedAt
|-- commerce_financial_facts/{factId} . faits financiers append-only
|-- commerce_financial_projections/current
|-- commerce_outbox/{eventId}
|-- commerce_webhook_inbox/{eventId}
|-- commerce_incidents/{incidentId}
|-- commerce_fixture_scopes/{scopeId}
|-- commerce_release_manifests/{releaseId}
|-- sys_commerce_control/current
|-- sys_commerce_operations/current
|-- newsletter_subscribers/{id}
|-- sys_metadata/{docId}
|-- sys_ratelimit/{id} ................ backend-only
|-- sys_admin_access/{uid} ............ backend-only
|-- sys_user_stats/current ............ compteur comptes, triggers Auth backend-only
|-- sys_idempotency/{id} .............. backend-only
|-- sys_billing_onboarding/{uid} ...... progression guide, backend-only
|-- sys_catalog_publication/secondevie  mode, lease et revisions
|-- sys_catalog_publication_events/{eventHash}
|   `-- deduplication/outbox catalogue
|-- sys_catalog_publication_builds/{buildId}
|   `-- journal borne des builds catalogue
|-- sys_catalog_media_gc/{id} ......... quarantaine media
|-- analytics_sessions/{sessionId} .... session + tableau `journey`
|-- sales_stats_daily/{id}
`-- inventory_stats/{id}

Storage
|-- furniture/... ..................... sources et medias produit
|-- furniture/thumbnails/... .......... thumb320/thumb384/thumb
|-- furniture/responsive/... .......... card/detailFast/medium/large/full
|-- catalog-projection/v1/releases/{rev}/  objets immuables, manifeste et plan d'impact
|-- catalog-projection/v1/pointers/ .... current/previous/last-known-good
`-- autres chemins admin .............. contenus hero/about selon configuration
```

## 11. Scripts et tests

### Outils de developpement local

```text
with-env.mjs ......................... charge l'environnement et lance Next; genere NEXT_DEPLOYMENT_ID avant chaque build
deployment-id.mjs .................... identifiant URL-safe unique et validation du version skew
```

### Gates de contrat

```text
check-next-route-classification.cjs
check-mobile-marketplace-contract.cjs
check-seo-indexability.cjs
check-performance-budget.cjs
check-product-ssr.mjs
verify-analytics-reliability.mjs
tests/deployment-cache-contract.test.mjs
```

### Audits techniques hors galerie

```text
audit-category-direct.mjs
audit-product-page-direct.mjs
audit-about-direct.mjs
audit-quote-direct.mjs
audit-desktop-global-menu.mjs
audit-mobile-global-menu.mjs
audit-product-detail-images*.mjs
benchmark-auth-ui.mjs
```

### E2E cloud

```text
e2e-auth-email-otp.mjs
e2e-hosted-stripe-checkout.mjs ........ en quarantaine commerce
e2e-refund-latest-stripe-order.mjs .... en quarantaine commerce
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
purge-expired-firestore.cjs
```

### Tests Node

```text
tests/auth-*.test.cjs
tests/passkey-*.test.cjs
tests/billing-onboarding-contract.test.cjs
tests/smoke.spec.mjs
tests/catalog/*.test.cjs
tests/catalog/emulator/*.test.cjs
tests/commerce/runner/*.cjs
tests/commerce/suites/*.cjs
tests/commerce/domain/*.test.cjs .......... unitaire + contrats UI/migration Gates 5/6
tests/commerce/browser/*.spec.mjs ......... reprise/revisions multi-onglet locale
tests/commerce/faults/*.test.cjs
tests/commerce/rules/*.cjs
tests/commerce/fixtures/*.json
tests/commerce/runner-self-test.cjs
tests/commerce/run-rules-containment.cjs
```

Gate 0A fournit le runner anti-faux-vert, `test:commerce:containment`,
`test:commerce:rules:containment`, l'agregat et `lint:functions`. Gate 0B ajoute
les preuves hard-stop et Rules Firestore/Storage. Gate 1 fournit les suites
domaine, property, Firestore, Rules et failpoints. Gate 2 etend ces suites avec
policy, Connect, concurrence stock et mouvements quantitatifs. Gates 1 a 5
sont deployees en sandbox en mode read-only. Gate 6 ajoute le classificateur,
les manifests locaux ignores et le scope fixture backend-only. Gate 7A active
ce seul scope, les workers bornes, projections, documents sandbox,
exploitation et cleanup audite sur un manifeste immutable. Gate 7B execute le
runner `scripts/e2e-commerce-core-gate7b.mjs` deux fois sur le meme SHA/release
avec Stripe Connect, 3DS, OTP Gmail et drain final. Les trois lecteurs Gate 5
restent actifs; l'UI publique et les mutations admin restent fermees.

## 12. Matrice d'impact rapide

| Changement | Lire | Zones a inspecter | Gates typiques |
| --- | --- | --- | --- |
| route/rendu/SEO | `NEXTJS_SEO.md` | `app`, `src/lib/seo`, ServerViews | SEO, routes, build, direct route |
| annonce/categorie | `ANNONCES_CATALOGUE.md` | AdminForm, products, snapshot Storage, catalogue Functions | galerie/categorie/produit/revalidation |
| menu/mobile | `INTERFACE_NAVIGATION.md` | layout, marketplace menu/header, CSS | menus + mobile contract |
| image | `IMAGES_MEDIA.md` | imageUtils, AdminForm, Storage/scripts | images dry-run + routes |
| Auth | `AUTHENTIFICATION.md` | authStore, AuthContext, modal, auth Functions | `test:auth` + smoke |
| securite/rules | `SECURITE_GLOBALE.md` | rules, helpers security, Functions | tests negatifs + sandbox cible |
| espace client | `ESPACE_CLIENT.md` | routes compte, MyOrders, wishlist | smoke compte |
| paiement/refund | `COMMERCE_SYNTHESE.md`, puis `COMMERCE_STRIPE.md` | commerce client/Functions/admin | Gates 0A a 8 fermees; `PREPROD_TRANSACTIONAL_READY` sandbox, recette catalogue reel R2 refermee; checkout/workers revenus au scope fixture, UI transactionnelle refermee, mutations admin `read_only`, offline et live fermes |
| admin | `BACKOFFICE.md` | AdminAppIsland, tabs, Functions | smoke tabs + action cible |
| infra | `INFRASTRUCTURE.md` | yaml/json/env/runtime | audits read-only + build |
| donnees | `DONNEES_ANALYTICS.md` + `AUDIT_COUTS_FIRESTORE.md` | rules/indexes/scripts/Functions | dry-run/comptage/rollback + mesure avant/apres |

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
