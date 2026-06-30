# Dead Code Audit - Seconde Vie Next SSR

Date: 2026-06-13

Objectif: classifier l'arborescence fonctionnelle avant la phase infra/prod, sans modifier le design actif des pages publiques ni le backoffice.

Ce rapport compile:

- un inventaire statique local;
- six audits read-only par zones: routes publiques, backoffice, commerce/compte, Functions/data, scripts/docs, assets;
- les preuves d'imports statiques, imports dynamiques, routes Next, exports Firebase, scripts npm et references assets.

## Statuts utilises

| Statut | Sens | Action |
| --- | --- | --- |
| `ACTIVE_CONFIRMED` | Fichier charge par route, import statique, export Firebase, script npm ou asset reference. | Garder. |
| `DYNAMIC_ACTIVE` | Charge par `React.lazy`, `next/dynamic`, `import()` ou callable/runtime. | Garder; ne pas juger par `rg` simple. |
| `KEEP_RISKY` | Actif ou probablement actif, avec impact metier/admin/data. | Garder sauf audit metier dedie. |
| `LEGACY_DOCUMENTED` | Historique/documentation utile, pas runtime direct. | Garder ou archiver plus tard. |
| `DELETE_CANDIDATE` | Aucune preuve d'utilisation active trouvee; suppression possible apres validation minimale. | Supprimer seulement en petite passe. |
| `DELETED_2026_06_13` | Candidat supprime pendant la passe de nettoyage du 2026-06-13. | Garder la preuve dans ce rapport; ne pas restaurer sans besoin produit. |
| `ARCHIVE_CANDIDATE` | Asset ou doc non reference directement, mais risque visuel/historique. | Archiver/supprimer seulement apres verification visuelle/runtime. |
| `FUNCTIONAL_RISK` | Pas du code mort; anomalie fonctionnelle a corriger plus tard. | Traiter comme bug/decision produit. |

## Verdict court

- Les routes publiques Next sont natives App Router et ne dependent plus de `ClientApp`, `src/app.jsx` ou `src/Router.jsx`.
- Le backoffice est largement actif via `React.lazy`; presque aucun fichier admin ne doit etre supprime automatiquement.
- Les tunnels commerce/compte sont actifs et sensibles: checkout, wishlist, commandes, facture, auth, Stripe.
- Les Functions principales sont exportees et souvent appelees par le front ou Firebase; pas de suppression sure dans `functions` hors doublons deja retires.
- Les scripts legacy Vite/boilerplate ont deja ete retires dans la passe precedente. Les scripts restants sont soit npm, soit manuels risqués.
- Les assets contiennent environ 39 MB de gros candidats archive, mais aucune image visible ne doit etre supprimee sans verification runtime.

## Routes publiques

Routes auditees: `/`, `/galerie`, `/categorie/[categoryId]`, `/produit/[slugOrId]`, `/a-propos`, `/devis`.

Preuves globales:

```text
src/app.jsx        absent
src/Router.jsx     absent
app/ClientApp.jsx  absent
rg "ClientApp" app src scripts
=> uniquement gates/rapports, aucun import public actif
rg "setView" app src scripts
=> aucun routage SPA public
```

### Classification

| Route | Statut | Fichiers actifs | Iles client actives | Gates |
| --- | --- | --- | --- | --- |
| `/` | `ACTIVE_CONFIRMED` + home canonique | `app/page.jsx`, `GalleryRoutePage.jsx`, `GalleryServerView.jsx`, `ProductSectionsServer.jsx`, `GalleryMobileShellIsland.jsx` | `GalleryGridActionsIsland`, `HeroMotionIsland`, `GalleryFixedSectionsInteractions`, `InstagramFloatingTokensReveal`, header/menu/cart | `perf:gallery-direct`, `mobile:contract`, `next:routes`, `perf:budget` |
| `/galerie` | `ACTIVE_CONFIRMED` + alias compatible | `app/galerie/page.jsx`, `GalleryRoutePage.jsx`, `GalleryServerView.jsx`, `ProductSectionsServer.jsx`, `GalleryMobileShellIsland.jsx` | `GalleryGridActionsIsland`, `HeroMotionIsland`, `GalleryFixedSectionsInteractions`, `InstagramFloatingTokensReveal`, header/menu/cart | `perf:gallery-direct`, `mobile:contract`, `next:routes` |
| `/categorie/[categoryId]` | `ACTIVE_CONFIRMED` | `app/categorie/[categoryId]/page.jsx`, `CategoryServerView.jsx`, `categoryViewModel.js` | `CategoryControlsIsland`, header/menu/cart | `perf:category-direct`, `next:routes` |
| `/produit/[slugOrId]` | `ACTIVE_CONFIRMED` | `app/produit/[slugOrId]/page.jsx`, `ProductDetailServerView.jsx`, `ProductDetailShellIsland.jsx` | actions, shell media, lightbox dynamique, cart panel | `perf:product-direct`, `seo:check`, `mobile:contract` |
| `/a-propos` | `ACTIVE_CONFIRMED` | `app/a-propos/page.jsx`, `src/kit/vitrine/AboutServerView.jsx`, `aboutContent.js` | nav, before/after, FAQ, testimonials | `perf:about-direct` |
| `/devis` | `ACTIVE_CONFIRMED` | `app/devis/page.jsx`, `QuoteRequestServerView.jsx`, `QuoteFormIsland.jsx` | formulaire devis + header shared islands | `perf:quote-direct`; budget connu rouge hors scope nettoyage |

### Decision

Aucun `DELETE_CANDIDATE` dans les routes publiques. Les anciens chemins SPA publics sont absents, pas "a supprimer" dans cette passe. Nettoyage applique le 2026-06-30: ancien `HomeMotionIsland`, `DeferredGalleryIsland` et iles galerie lourdes orphelines retires:

```text
HomeView
CategoryLegacyExperienceIsland
AboutVitrineIsland
ArchitecturalProductDetail
MarketplaceLayout
ProductCard.jsx
GalleryView
CategoryPage
```

## Backoffice

Route: `/admin`.

Preuves:

- `app/admin/page.jsx` charge `AdminAppIsland` et reste `noindex`.
- `app/admin/AdminAppIsland.jsx` charge les grandes vues par `React.lazy`.
- `src/kit/config/constants.js` pilote les onglets admin via `adminTabs`.

### `DYNAMIC_ACTIVE`

Lazy imports confirmes:

```text
AdminDashboard
AdminHomepage
AdminOrders
AdminLivraison
AdminStudio
AdminForm
AdminItemList
AdminUsers
AdminNewsletter
AdminAnalytics
AdminSEO
AdminIPManager
AdminPaymentSettings
AdminIPTracker
GlobalInventoryView
AdminMaintenance
PerformanceArchitectureStudy
```

### `KEEP_RISKY`

| Zone | Pourquoi garder |
| --- | --- |
| `AdminForm.jsx` | CRUD produit, upload Storage, variantes images, bump `publicCatalogVersion`. |
| `AdminDashboard.jsx` | stats, exports, fonctions sensibles, maintenance destructive. |
| `AdminOrders.jsx` | commandes, statuts, stock. |
| `AdminUsers.jsx` | gestion admins via Functions. |
| `AdminAnalytics.jsx` | sessions analytics, suppression/clear analytics. |
| `AdminIPTracker.jsx` / `AdminIPManager.jsx` | tracking IP admin et allowlist. |
| `AdminHomepage.jsx` | configuration home/about, Storage, `sys_metadata`. |
| `GlobalInventoryView.jsx` | ordres `nouveautesOrder` / `petitsPrixOrder`. |
| `publicCatalogInvalidation.js` | purge cache, bump meta, revalidation ISR. |
| `_DOCS/maintenance-next.md`, `_DOCS/revalidation-next.md` | docs operationnelles des onglets actifs. |

### `DELETED_2026_06_13`

| Fichier | Preuves | Risque |
| --- | --- | --- |
| `src/kit/admin/AdminComments.jsx` | Pas de `React.lazy` dans `AdminAppIsland`; pas d'entree `comments` dans `adminTabs`; basename non reference hors lui-meme. Le site actuel n'a plus de gestion commentaires produit. | Supprime. Les routines Functions qui nettoient d'anciennes sous-collections `comments` sont conservees pour ne pas casser la maintenance data. |
| `src/kit/config/constants.js` / `features.comments` | Flag non consomme, unique reference runtime a la feature commentaires. | Cle retiree. |

Preuve apres suppression:

```powershell
rg -n "AdminComments|comments|commentaires|features\\.comments" app src functions _DOCS
```

Resultat attendu: plus de `AdminComments` ni `features.comments`; seules peuvent rester les references `comments` dans les routines Functions de nettoyage d'anciennes sous-collections data.

## Commerce / compte

Routes auditees: `/checkout`, `/wishlist`, `/mes-commandes`.

### `ACTIVE_CONFIRMED`

| Fichier | Preuve / role |
| --- | --- |
| `app/checkout/page.jsx` | route dynamique `noindex`, shell checkout. |
| `app/checkout/CheckoutPageIsland.jsx` | auth, panier utilisateur, bridge vers `CheckoutView`. |
| `src/kit/commerce/CheckoutView.jsx` | coeur checkout, stock listener, Functions `createOrder` / `cancelOrderClient`, Stripe modal. |
| `src/kit/commerce/CheckoutStripeModal.jsx` | lazy import depuis `CheckoutView`. |
| `src/kit/commerce/CheckoutPaymentStep.jsx` | importe par la modale Stripe. |
| `app/wishlist/page.jsx` | route dynamique `noindex`, precharge catalogue. |
| `app/wishlist/WishlistPageIsland.jsx` | listener wishlist, batch cart/wishlist. |
| `app/mes-commandes/page.jsx` | route dynamique `noindex`, precharge catalogue. |
| `app/mes-commandes/OrdersPageIsland.jsx` | auth gate, monte `MyOrdersView`. |
| `src/kit/commerce/MyOrdersView.jsx` | commandes client, annulation, facture PDF au clic. |
| `src/utils/generateInvoice.js` | import dynamique depuis `MyOrdersView`. |
| `src/kit/commerce/CartSidebar.jsx` | charge par `CartPanelIsland`. |
| `src/kit/commerce/LoginView.jsx` | utilise par l'admin login. |
| `src/kit/contexts/AuthContext.jsx` | provider auth des tunnels prives. |

### `FUNCTIONAL_RISK`

| Point | Detail |
| --- | --- |
| Stripe return URL | `CheckoutPaymentStep` renvoie vers `/?order_success=true`; compat legacy probable, a clarifier plus tard. |
| Total paiement | `CheckoutStripeModal` transmet `orderTotal`; verifier coherence livraison/success UI. |
| Wishlist orders | `OrdersPageIsland` passe `wishlistItems={[]}` a `MyOrdersView`; ne pas interpreter comme vraie wishlist. |

### Decision

Aucun `DELETE_CANDIDATE` commerce/compte.

## Functions / data / Firebase

### Codebases

| Codebase | Statut | Preuve |
| --- | --- | --- |
| `functions` / `main` | `ACTIVE_CONFIRMED` | `firebase.json`, exports `functions/index.js`. |
| `functions-public` / `public` | `ACTIVE_CONFIRMED` | `functions-public/index.js` exporte `publicCatalog`. |

`publicCatalog` actif:

- `functions-public/src/public/catalog.js`;
- appele par `src/lib/server/products.js`;
- appele par `app/sitemap.js`;
- invalide via `src/kit/admin/publicCatalogInvalidation.js` + `app/api/revalidate-catalog/route.js`.

### Exports main actifs ou deployables

```text
createOrder
stripeWebhook
cancelOrderClient
grantAdminOnAuth
addAdminUser
removeAdminUser
logUserConnection
getUserStats
initLiveSession
syncSession
syncSessionBeacon
deleteSession
clearAllSessions / clearAllAnalytics
cleanupExpiredAnalytics
trackAdminIP
updateUserSessions
onJourneyStepCreated
onCustomEventCreated
onOrderStatsWrite
resetAllStats
runGarbageCollector
resetAllUsers
purgeAnonymousUsers
resetAllOrders
purgeAllProducts
getUploadUrl
onInventorySourceWrite
sitemap / shareMeta / homeMeta / aboutMeta / productMeta / categoryMeta
onArtifactDeleted / onArtifactUpdated
```

### Faux positifs a ne pas supprimer

| Fichier | Pourquoi |
| --- | --- |
| `functions/src/triggers/mediaCleanup.js` | Helper utilise par `onArtifactDeleted`, `onArtifactUpdated`, `maintenance/tools` et `audit-storage-orphans`. |
| `functions/src/seo/seoTools.js` | Legacy Firebase Hosting SEO encore exporte et reference par `firebase.json` hosting. |
| fonctions maintenance | Certaines sont appelees par admin; toutes sont exportees/deployables. |

### `FUNCTIONAL_RISK`

| Point | Preuve | Action future |
| --- | --- | --- |
| `sendTestEmail` appele mais non exporte | `AdminDashboard.jsx` appelle `httpsCallable(functions, 'sendTestEmail')`, aucun export trouve dans `functions/index.js`. | Corriger ou retirer le bouton diagnostic mail dans une passe bug, pas une passe dead code. |

### Decision

Aucun `DELETE_CANDIDATE` Functions/data confirme apres la suppression du doublon non exporte `functions/src/public/catalog.js`.

## Scripts / tooling / docs

### `ACTIVE_CONFIRMED` via `package.json`

```text
with-env.mjs
deploy/dashboard.mjs + deploy/*.mjs
maintenance-audit.mjs
check-product-ssr.mjs
backfill-product-image-metadata.cjs
backfill-product-image-variants.cjs
audit-storage-orphans.cjs
check-performance-budget.cjs
compare-spa-next.mjs
compare-runtime.mjs
benchmark-architecture.mjs
audit-gallery-scroll-lag.mjs
audit-product-page-direct.mjs
audit-category-direct.mjs
audit-about-direct.mjs
audit-quote-direct.mjs
audit-gallery-direct.mjs
audit-product-detail-images.mjs
check-next-route-classification.cjs
check-mobile-marketplace-contract.cjs
```

### `KEEP_RISKY` manuels

Ces scripts ne doivent pas etre supprimes automatiquement, meme s'ils ne sont pas tous appeles par `npm`:

```text
copy-firestore-project.mjs
replace-firestore-string.mjs
purge-expired-firestore.cjs
seed-catalogue.mjs
fix-images.mjs
backfill-product-thumbnails.cjs
cleanup-product-image-variants.cjs
```

### Legacy deja retire

```text
measure-preview-network.py
perf-network-baseline.json
measure-scroll-smoothness.py
dev-ports-dashboard.mjs
make_boilerplate.ps1
README_BOILERPLATE_GENERATOR.md
```

### `DELETED_2026_06_13`

| Fichier | Preuve | Risque |
| --- | --- | --- |
| `scripts/cleanup_docs.cjs` | Non appele par `package.json`, non reference par docs vivantes; logique destructive ancienne. | Supprime. |
| `scripts/summarize_md.cjs` | Non appele, non reference. | Supprime. |
| `scripts/summarize_md.js` | Non appele, non reference; doublon probable. | Supprime. |

## Assets

### `ACTIVE_CONFIRMED`

| Groupe | Fichiers |
| --- | --- |
| Hero home/galerie | `public/images/imagehero/1.webp` a `4.webp`, `*-mobile.webp`. |
| Categories visibles | `public/images/categories/*-config-rail.webp`, `fallback.webp`. |
| Avant/apres | `public/images/before-after/*.webp`, `*-gallery.webp`. |
| About | `public/images/about/about-1.webp`, `about-2.webp`, `about-3.webp`. |
| Footer/logo/livraison | `logoanais-320.webp`, `footer-delivery-*.webp`, `menu-delivery-marseille-wide.jpg`. |
| Devis/login | `src/assets/quote-restoration-hero.webp`, `newsletter/discount-sideboard.webp`, `public/video/login-bg.mp4`. |
| Menus | `public/images/gallery-hero-1.webp` a `4.webp`. |

### SEO critiques a garder

| Asset | Pourquoi |
| --- | --- |
| `public/images/logoanais.png` | Utilise par `functions/src/seo/seoTools.js` comme image SEO legacy. |
| `public/manifest.json`, `favicon_final.png`, `apple-touch-icon.png` | PWA/favicon; usage externe a clarifier avant changement. |

### `FUNCTIONAL_RISK`

| Point | Detail |
| --- | --- |
| `public/og-image.jpg` absent | `app/layout.jsx` reference `/og-image.jpg` comme fallback OG, mais le fichier n'existe pas. A traiter en phase SEO, pas dead code. |

### `ARCHIVE_CANDIDATE`

Environ 39 MB de gros candidats, a verifier visuellement/runtime avant suppression:

```text
public/images/gallery-hero-*.png
public/images/newsletter/discount-sideboard*.png
public/images/menu-delivery-marseille.png
public/images/about/*.png
public/images/hero/*.png
public/images/before-after/*.png
src/assets/quote-restoration-hero.png
src/assets/marseille-vieux-port-blueprint.png
src/assets/marseille-notre-dame-blueprint.png
public/images/categories/source-config/*
public/images/categories/*.webp hors *-config-rail.webp et fallback.webp
```

Decision: ne pas supprimer dans une passe dead-code tant que les captures reseau/visuelles n'ont pas confirme l'absence d'utilisation.

## Candidats d'action par priorite

### Supprime pendant la petite passe du 2026-06-13

1. `scripts/cleanup_docs.cjs`
2. `scripts/summarize_md.cjs`
3. `scripts/summarize_md.js`
4. `src/kit/admin/AdminComments.jsx`
5. `src/kit/config/constants.js` / `features.comments`

Validation minimale effectuee:

```powershell
rg -n "cleanup_docs|summarize_md" package.json AGENTS.md mapV2.md _DOCS app src functions functions-public scripts
rg -n "AdminComments|comments|commentaires|features\\.comments" app src functions _DOCS
```

Pas de build/lint long lance pour cette passe documentaire/nettoyage, conformement a la consigne projet de limiter les validations longues sauf demande explicite.

### Archive assets, plus tard

Creer une passe dediee `ASSETS_ARCHIVE_AUDIT.md` avec:

- preuve `rg`;
- capture reseau locale ou App Hosting;
- screenshot des pages publiques;
- taille gagnee;
- liste `KEEP` / `ARCHIVE` / `DELETE`.

## Points non dead-code mais importants

| Sujet | Statut |
| --- | --- |
| `/devis` budget JS | Rouge connu: header complet pousse la route au-dessus du seuil. Ne pas traiter en nettoyage code mort car le rendu est actif/finalise. |
| `sendTestEmail` | Appel UI orphelin cote Functions. Bug fonctionnel a corriger. |
| Stripe return URL | Compat legacy `/?order_success=true`; a clarifier avant prod. |
| `public/og-image.jpg` | Manquant alors que reference par metadata. Phase SEO. |
| `functions/src/seo/seoTools.js` + Firebase Hosting rewrites | Legacy hosting encore exporte; decision infra/SEO avant suppression. |

## Gates recommandes avant toute suppression future

Base:

```powershell
npm run lint
npm run build
npm run next:routes
```

Si route publique touchee:

```powershell
npm run perf:gallery-direct
npm run perf:category-direct
npm run perf:product-direct
npm run perf:about-direct
npm run perf:quote-direct
```

Si galerie/mobile/produit/scroll touche:

```powershell
npm run mobile:contract
```

Si commerce/compte touche:

```text
Smoke manuel auth + panier + checkout + commandes + facture.
```

Si Functions touchees:

```text
Verifier exports functions/index.js, functions-public/index.js, firebase.json codebases,
callables front, triggers, rules/indexes, puis deploy sandbox cible.
```
