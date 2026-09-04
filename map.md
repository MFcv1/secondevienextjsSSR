# Carte technique de Seconde Vie

Revue : 2026-09-04. Propriétaire : équipe Seconde Vie.
Carte des points d'entrée du code local, **pas inventaire du cloud déployé**.
Règles : [AGENTS.md](AGENTS.md). Statuts : [État du projet](_DOCS/ETAT_PROJET.md).

## Routes

| Route | Entrée et traitement | Contrat |
| --- | --- | --- |
| `/`, `/galerie` | `app/page.jsx`, `app/galerie/page.jsx` → `src/kit/marketplace/GalleryRoutePage.jsx` | Serveur/ISR 300, canonical `/` |
| `/categorie/[categoryId]` | `app/categorie/[categoryId]/page.jsx` → `CategoryServerView` | SSG/ISR, indexation conditionnelle |
| `/produit/[slugOrId]` | `app/produit/[slugOrId]/page.jsx` → `ProductDetailServerView` | SSG/ISR, produit/JSON-LD |
| `/a-propos` | `app/a-propos/page.jsx` → `src/kit/vitrine/AboutServerView.jsx` | Serveur/ISR |
| `/devis` | `app/devis/page.jsx` → `QuoteRequestServerView` / `QuoteFormIsland` | Serveur/ISR + formulaire |
| `/recherche` | `app/recherche/page.jsx` → `SearchResultsIsland` | Noindex, contenu serveur |
| `/wishlist` | `app/wishlist/WishlistPageIsland.jsx` | Dynamique, noindex |
| `/checkout` | `app/checkout/CheckoutPageIsland.jsx` → `CheckoutView` | Dynamique, noindex |
| `/payer/[orderId]/[token]` | `app/payer/[orderId]/[token]/PaymentLinkPageIsland.jsx` | Lien privé signé, noindex/no-referrer |
| `/mes-commandes` | `app/mes-commandes/OrdersPageIsland.jsx` → `MyOrdersView` | Dynamique, propriétaire UID |
| `/admin` | `app/admin/AdminAppIsland.jsx`, `AdminSidebar.jsx` | Dynamique, admin fort, vues lazy |
| `/api/catalog`, `/api/catalog/version`, `/api/search` | `app/api/` → `src/lib/server/` | Snapshot public, pointeur frais ; ETag version |
| `/api/revalidate-catalog` | `app/api/revalidate-catalog/route.js` | HMAC machine ou admin fort, plan borné |
| `/api/admin/catalog-publication-status` | `app/api/admin/catalog-publication-status/route.js` | Preuve de release, App Check + admin AAL2 |
| `/api/admin/function-metrics` | `app/api/admin/function-metrics/route.js` | Monitoring/inventaire, App Check + admin AAL2, no-store |
| `/sitemap.xml`, `/robots.txt` | `app/sitemap.js`, `app/robots.js` | Politique d'indexation |

Détails : [architecture/SEO](_DOCS/architecture/NEXTJS_SEO.md).
Les noms de vues sans chemin sont dans `src/kit/marketplace/`, sauf les vues
commerce dans `src/kit/commerce/`.

## Flux métier et sources autoritaires

| Flux | Chemin utile | Référence |
| --- | --- | --- |
| Consultation | `products.js` → `materializedCatalog.js` → pointeurs/releases Storage → ServerViews ; `CatalogVersionSyncIsland` et `GalleryLiveProductGridIsland` synchronisent les surfaces visibles | [Catalogue](_DOCS/catalogue/ANNONCES_CATALOGUE.md) |
| Publication | `AdminForm` / `productPublicationClient` → `v2ProductCommands.js` → `furniture` → `functions/src/catalog/` → snapshot/CAS → revalidation HMAC | [Catalogue](_DOCS/catalogue/ANNONCES_CATALOGUE.md) |
| Images | `src/utils/imageUtils.js`, `AdminForm` → variantes/metadata Storage ; GC en quarantaine | [Images](_DOCS/images/IMAGES_MEDIA.md) |
| Navigation | `app/layout.jsx`, `ViewportHeightSyncIsland`, `RouteTransitionIsland`, menu/header ; `ProductReturnRestoreIsland` restaure galerie/catégorie | [Interface](_DOCS/ux/INTERFACE_NAVIGATION.md) |
| Connexion | `LegacyLoginModalFullIsland` → `AuthContext` / `authStore` → `functions/src/auth/` ; `HeaderAccountIsland` révèle le lien admin sans redirection imposée | [Auth](_DOCS/security/AUTHENTIFICATION.md) |
| Panier/achat | `guestCart.js` / panier UID → `CheckoutView` → `checkoutController.js` / `checkoutRecovery.js` → `v2Checkout.js` → domaine commerce → Stripe → inbox/webhook → état durable | [Commerce](_DOCS/commerce/COMMERCE_STRIPE.md) |
| Client | `MyOrdersView.jsx` → `v2OrderQueries.js` + signal de commandes borné ; `v2DocumentDelivery.js` / `v2CustomerReturnRequests.js` | [Espace client](_DOCS/client/ESPACE_CLIENT.md) |
| Vente/retour | `AdminOrders`, `components/orders/`, `AdminReturns` → commandes/refund/return v2 → Stripe et mouvements idempotents séparés | [Admin](_DOCS/admin/BACKOFFICE.md) |
| Lien de paiement | `AdminPaymentLinks` → `v2AdminPaymentLinks.js` → commande/hold/PI v2 → route privée `/payer/…` | [Commerce](_DOCS/commerce/COMMERCE_STRIPE.md) |
| Facture manuelle | `AdminInvoices` → `functions/src/invoicing/` → brouillon/version → numéro/émission verrouillée → PDF privé/e-mail | [Admin](_DOCS/admin/BACKOFFICE.md) |
| Devis | Formulaire en 7 étapes → `functions/src/quotes/` → demande/photos privées → `AdminQuotes` + accusé client ; pas d'IA active | [Devis](_DOCS/ai/ASSISTANT_DEVIS.md) |
| Newsletter/promo | Jeu → `functions/src/newsletter/` → code/abonné → `promotionMaterialization.js` / `v2PromotionCodes.js` → réservation/consommation au checkout | [Commerce](_DOCS/commerce/COMMERCE_STRIPE.md) |
| Social | `MetaConnectionBadge` / `useMetaConnection` / `metaPublicationClient` → `functions/src/integrations/meta.js` → OAuth chiffré et saga par destination | [Meta](_DOCS/admin/INSTAGRAM_OAUTH_RUNBOOK.md) |
| E-mail | `functions/src/email/`, templates devis/factures/newsletter → outbox/transport Gmail ou futur Resend | [E-mails](_DOCS/email/EMAILS_TRANSACTIONNELS.md) |

Les composants admin sont dans `src/kit/admin/`, les modules `v2*.js` dans
`functions/src/commerce/`. `shared/orderReference.cjs` et son miroir de
packaging `functions/src/shared/orderReference.cjs` portent `C<orderNumber>` ;
l'ID opaque reste technique.

## Data, dashboard et incidents

- **Collecte** : `AnalyticsCollectorIsland` / `AnalyticsProvider` →
  `functions/src/analytics/sessions.js` → `analytics_sessions`.
  Claims admin exclus ; IP brute non collectée ; parcours borné.
- **Historique/KPI** : `rollups.js` / `realtime.js` → faits/ledgers/buckets →
  `admin_analytics_realtime/recent|history` →
  `adminAnalyticsRealtime.js` / `adminAnalyticsRealtimeStore.js` → `AdminAnalytics`.
  Flag explicite, écoute partagée, pas de fallback callable silencieux.
- **Sessions** : `liveSessions.js` → `admin_analytics_sessions` et
  `admin_analytics_session_details` → `liveSessionsChannel.js` /
  `liveSessionPresence.js` → dix cartes, une page ancienne, un détail ouvert.
- **Stats** : `functions/src/admin/dashboardProjection.js`,
  `financialHistoryProjection.js`, projecteurs commerce/newsletter →
  `admin_dashboard/*` → `AdminDashboard`.
- **Actions** : `actionSummaryProjection.js` →
  `admin_action_summary/current` → badge Retours du shell.
- **Incidents métier** : `functions/src/observability/` →
  `admin_incident_summary/current`, timeline expurgée → `AdminIncidentConsole`.
- **Incidents système** : Log Router → Pub/Sub →
  `systemIncidentProjection.js` → résumé borné →
  `SystemIncidentConsole` ; détail externe au clic.
- **Performance Functions** : `AdminFunctionPerformance.jsx` →
  API Next admin → `functionMetrics.js`, `functionMetricsCache.mjs`,
  `functionMetricsCore.mjs` sous `src/lib/server/` →
  `sys_function_metrics_cache/{24h|7d|30d}`, Monitoring et inventaire Google.
  Aucun export Function supplémentaire.
- **Mesures Data** : `adminAnalyticsPerformance.js`,
  `scripts/audit-interactive-runtime.mjs` ; ne prouvent pas un coût Billing.

Schémas, minimisation, rétention : [Données](_DOCS/data/DONNEES_ANALYTICS.md).
États de livraison : [État du projet](_DOCS/ETAT_PROJET.md).

## Backend, sécurité et exploitation

| Responsabilité | Source |
| --- | --- |
| Exports locaux Functions | `functions/index.js` |
| Noms réellement appelés par le client | `src/kit/config/functionTargets.js` |
| Région/runtime/sécurité/secrets | `functions/helpers/runtime.js`, `security.js`, `secrets.js` |
| Autorisation API Next | `src/lib/server/adminAuthorization.js`, `requestBody.js` |
| Contrôle des données | `firestore.rules`, `firestore.indexes.json`, `storage.rules` |
| Dépendances et commandes | `package.json`, `functions/package.json`, lockfiles |
| Build/cache/headers | `next.config.mjs`, `scripts/with-env.mjs`, `scripts/deployment-id.mjs` |
| Cibles sandbox | `.firebaserc`, `firebase.json`, `apphosting.yaml`, `deploy/` |
| Validation | `tests/`, `scripts/`, `.github/workflows/quality.yml` |

Ne pas déduire la génération d'une Function de son suffixe ni le déploiement
d'un export local. Trois exceptions Auth Gen1 sont conservées ; exports
Instagram legacy et webhooks cloud-only ont un traitement spécifique dans
[l'ADR runtime](_DOCS/architecture/FUNCTIONS_RUNTIME_ADR.md).
Inventaires/probes et manifestes : `scripts/functions-gen2-inventory.mjs`,
`apphostingaudit/manifests/`. Aucun appel cloud nécessaire pour lire cette carte.

## Repères documentaires et fichiers exclus

- [README.md](README.md) : produit et manière de travailler.
- [AGENTS.md](AGENTS.md) : règles transverses.
- [_DOCS/README.md](_DOCS/README.md) : contrats et suivis à ouvrir à la demande.
- [doc/README.md](doc/README.md) : audit documentaire et archives hors lecture courante.
- `.agents/skills/` : outils spécialisés, pas description de l'état du produit.
- `node_modules/`, `.next/`, `.firebase/`, `logs/`, `test-results/`,
  `playwright-report/`, `dist/` : dépendances/preuves/générés, pas sources métier.
- Les dossiers de travail image/vidéo ne sont pas jetables sans audit d'usage.
