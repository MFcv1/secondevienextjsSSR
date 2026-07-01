# Instructions agents - Seconde Vie Next

Ce fichier est destine aux agents IA qui travaillent dans ce repo. Il doit rester compact et operationnel.

## Priorite - validation des correctifs

Quand l'utilisateur demande un correctif cible, appliquer le changement demande puis s'arreter des que le correctif est en place, sauf demande explicite de validation.

- Ne pas lancer de verifications longues, build, serveur local, Playwright, navigateur, screenshot ou test manuel si l'utilisateur ne le demande pas clairement.
- Les validations automatiques doivent rester limitees au strict minimum necessaire pour eviter une erreur evidente de syntaxe ou de lint locale.
- Si l'utilisateur demande un audit ou des preuves tangibles, lancer les gates adaptes et reporter les resultats.
- Dans le compte rendu, indiquer clairement les validations lancees ou non lancees.

## Baseline architecture

Lire `NEXT_NATIVE_ARCHITECTURE_BASELINE.md` avant toute passe architecture, documentation, routing, cache, SEO ou performance.

Etat courant:

- Routes publiques Next App Router natives.
- `/`: home galerie canonique, `force-static` + ISR `revalidate = 300`.
- `/galerie`: alias compatible de la galerie, `force-static` + ISR `revalidate = 300`, canonical vers `/`.
- `/categorie/[categoryId]` et `/produit/[slugOrId]`: SSG/ISR avec `generateStaticParams`.
- `/a-propos` et `/devis`: rendu serveur + ISR.
- `/admin`, `/checkout`, `/wishlist`, `/mes-commandes`: tunnels dynamiques.
- Les anciens rapports de migration SPA sont archives dans `_DOCS/archive/migration-spa-to-next/` et ne sont plus des consignes actives.

Interdits sur routes publiques:

- ne pas recreer `ClientApp`, `src/app.jsx`, `src/Router.jsx`, `setView` ou un routing hash;
- ne pas utiliser `cookies()`, `headers()`, `draftMode()` ou `searchParams` serveur pour les pages publiques;
- ne pas reintroduire un rendu provisoire visuellement different remplace par une grosse ile client.

## Docs a lire selon la zone

- Architecture Next native: `NEXT_NATIVE_ARCHITECTURE_BASELINE.md`, `context.md`, `mapV2.md`.
- Home galerie canonique: `_DOCS/architecture/GALLERY_HOME_CANONICAL_IMPLEMENTATION_2026-07-01.md`.
- Galerie mobile/shell/scroll/detail: `alertemobile.md`.
- Performance/hydratation/cache: `_DOCS/perf/NEXTJS_OPTIMIZATION_ROADMAP.md`, `_DOCS/perf/PHASE3_PERF_BASELINE_2026-06-24.md`, `_DOCS/perf/PUBLIC_SEO_BUDGET_VISUAL_CLOSEOUT_2026-07-01.md`.
- Images produit/Storage/detailFast: `_DOCS/images/NEXTJS_IMAGE_PIPELINE_AUDIT.md`, `_DOCS/images/OPTIMISATION_AFFICHAGE_IMAGES_PRODUIT_2026-06-28.md`, `_DOCS/images/DETAIL_FAST_IMAGE_VARIANT_ROADMAP.md`.
- Infra prod/App Hosting/App Check: `_DOCS/infra/P0_INFRA_CLOSEOUT_ROADMAP_2026-06-24.md`, `_DOCS/infra/INFRA_PROD_PHASE2_REPORT_2026-06-14.md`, `_DOCS/infra/APP_CHECK_ENFORCEMENT_READINESS_2026-06-24.md`, `_DOCS/infra/RAIL_PROD_AUDIT_REPORT_2026-06-24.md`.
- Checkout/refund/E2E/Stripe Connect: `_DOCS/commerce/STRIPE_CONNECT_INTEGRATION_PLAN_2026-07-01.md`, `_DOCS/commerce/CHECKOUT_REDIRECT_SANDBOX_REPORT_2026-06-24.md`, `_DOCS/commerce/E2E_BACKOFFICE_TEST_ROADMAP_2026-06-18.md`, `_DOCS/commerce/E2E_REFUND_EXECUTION_ROADMAP_2026-06-19.md`, `_DOCS/commerce/REFUND_UI_STRICT_PROOF_2026-06-24.md`.

## Gates utiles

Choisir selon la demande et le risque:

```bash
npm run build
npm run next:routes
npm run mobile:contract
npm run perf:gallery-direct
npm run perf:product-direct
npm run perf:category-direct
npm run perf:about-direct
npm run perf:quote-direct
npm run perf:budget
```

Note: `perf:budget` est le chantier CSS/JS restant. Ne pas le corriger pendant une passe de nettoyage documentaire sauf demande explicite.

## Code map

Garder cette carte a jour lors de creation, suppression, renommage ou deplacement de fichier. Garder les libelles compacts.

```text
.
|-- AGENTS.md : consignes agents et code map compacte
|-- NEXT_NATIVE_ARCHITECTURE_BASELINE.md : baseline actuelle routes Next natives, ISR/SSG/SSR, gates et docs actives
|-- context.md : synthese courte de l'etat projet Next natif
|-- alertemobile.md : contrat mobile galerie/shell/scroller/detail
|-- mapV2.md : cartographie routes, infra prod, backoffice, risques et nettoyage
|-- RUNBOOK.md : commandes et exploitation Next/Firebase
|-- TODO.md : backlog infra/perf/backoffice
|-- TODO_NEXT16_UPGRADE.md : rappel migration Next 16/Turbopack et plan de test
|-- DEAD_CODE_AUDIT.md : audit code vivant/mort, assets, scripts et gates
|-- docs : brouillons legaux/metier non operationnels, dont CGV/retours
|-- _DOCS : documentation active organisee par theme et archives
|   |-- architecture : baseline routes publiques, SEO, cache et decisions Next
|   |   `-- GALLERY_HOME_CANONICAL_IMPLEMENTATION_2026-07-01.md : decision `/` home galerie et `/galerie` alias
|   |-- perf : roadmaps/gates perf, hydratation, galerie et rendu final direct
|   |   `-- PUBLIC_SEO_BUDGET_VISUAL_CLOSEOUT_2026-07-01.md : closeout budgets publics avec preuves visuelles
|   |-- images : pipeline images produit, Storage, detailFast et audits UX image
|   |-- infra : App Hosting, rail prod, App Check et closeout infra
|   |-- commerce : checkout, refund, E2E backoffice et Stripe/Firebase hardening
|   |   `-- STRIPE_CONNECT_INTEGRATION_PLAN_2026-07-01.md : roadmap integration Stripe Connect, securite admin et preuves par phase
|   |-- ux : navigation, mega menu et micro-frictions
|   |-- ai : cadrage assistant IA devis
|   |-- data : migration/base de donnees
|   `-- archive : rapports historiques non operationnels, dont migration SPA vers Next et notes UI
|-- .agents/skills : skills locaux UI/design, dont visual-annotation-tuning
|-- app : routes Next App Router, metadata, loading/not-found/error, sitemap, robots, iles de route et transition `/a-propos`
|-- src
|   |-- index.css
|   |-- kit/admin : back-office, analytics, commandes, retours/remboursements Stripe, SEO, users, exports
|   |-- kit/commerce : panier, checkout, login, commandes client, regle isPurchasable
|   |-- kit/marketplace : galerie SSR, categories/produits, sections fixes SSR, iles interactions, header/menu/cart/wishlist/devis
|   |-- kit/vitrine : page `/a-propos` serveur et iles fines
|   |-- kit/layout, kit/shared, kit/ui, kit/hooks, kit/contexts, kit/config
|   |-- lib : helpers serveur produits/env/theme/about et SEO structure
|   `-- assets, utils : assets source et helpers image/formatting
|-- scripts : env bridge, gates Next, audits perf/direct/mobile, E2E sandbox, backfills images, infra audits
|-- functions-public : Functions publiques isolees pour `publicCatalog`
|-- functions : Functions privees/admin/commerce/auth/email/seo/triggers
|-- public : favicons, manifest, images, videos et assets statiques
|-- deploy : dashboard deploiement sandbox
|-- package*.json, next.config.mjs, eslint.config.mjs, jsconfig.json, tailwind.config.js, postcss.config.js
|-- middleware.js, apphosting.yaml, firebase.json, firestore.rules, firestore.indexes.json, storage.rules
`-- .next, dist, node_modules, logs, .firebase : generes, hors carte
```
