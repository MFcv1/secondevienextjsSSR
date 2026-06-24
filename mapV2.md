# mapV2 - Cartographie Next SSR/SSG/ISR, infra prod et nettoyage

Derniere mise a jour: 2026-06-24

## Objectif

Ce document cartographie le site Seconde Vie Next.js SSR avant lancement prod.
Il ne remplace pas les audits SEO/perf detailles: il pose d'abord la base saine.

Priorites de cette passe:

1. Mapper toute l'arborescence applicative.
2. Classer les routes en ISR, SSR dynamique, tunnel client prive, API ou route speciale.
3. Verifier si la strategie de rendu est pertinente.
4. Identifier l'infra prod manquante et ce qui est sandbox-only.
5. Encadrer le nettoyage code mort sans casser backoffice, checkout, data ou Functions.

## Sources de reference

Sources normatives:

- Next.js Route Segment Config: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
- Next.js `generateStaticParams`: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
- Next.js Caching and Revalidating: https://nextjs.org/docs/app/getting-started/caching
- Next.js `generateMetadata`: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Firebase App Hosting configuration: https://firebase.google.com/docs/app-hosting/configure
- Firebase App Hosting cache: https://firebase.google.com/docs/app-hosting/manage-cache

Sources locales non normatives mais utiles:

- `AGENTS.md`: contraintes projet, env, mobile, deploy sandbox.
- `nextjsssr.md`: playbook local anti-SPA. A garder comme garde-fou projet, pas comme source d'autorite Next.js.
- `context.md`: contexte de migration legacy UI vers Next natif.
- `NEXTJS_OPTIMIZATION_ROADMAP.md`: historique perf/cache/images.
- `P0_INFRA_CLOSEOUT_ROADMAP_2026-06-24.md`: plan de fermeture des derniers P0 infra avant Phase 3 perf.
- `APP_CHECK_ENFORCEMENT_READINESS_2026-06-24.md`: etat App Check sandbox, telemetrie Cloud Monitoring et decision enforcement par service.
- `RAIL_PROD_AUDIT_REPORT_2026-06-24.md`: audit du rail prod absent/non cable et bloc `railProd` de `npm run infra:env`.
- `CHECKOUT_REDIRECT_SANDBOX_REPORT_2026-06-24.md`: support E2E iDEAL/Wero, checkout heberge stabilise jusqu'au Payment Element, blocage restant cote configuration Stripe sandbox.
- `REFUND_UI_STRICT_PROOF_2026-06-24.md`: preuve stricte clic UI `Rembourser` sur commande fraiche `paid`, refund Stripe et stock restaure.
- `PHASE3_PERF_BASELINE_2026-06-24.md`: baseline Phase 3 perf/hydratation, P0 galerie, chunks initiaux et dettes P1/P2.
- `E2E_REFUND_EXECUTION_ROADMAP_2026-06-19.md`: plan d'execution multi-agents pour prouver achat invite neuf puis refund admin sandbox.
- Scripts gates: `next:routes`, `perf:*`, `mobile:contract`.

Regles Next.js retenues pour cette carte:

- Une page App Router est Server Component par defaut.
- `generateStaticParams` prerender des chemins dynamiques au build; il ne rerun pas pendant ISR.
- Les lectures runtime comme `cookies()` / `headers()` rendent une route dependante de la requete.
- `revalidate`, `revalidateTag` et `revalidatePath` servent a reutiliser/invalider du contenu cacheable.
- Les variables `NEXT_PUBLIC_*` sont visibles dans le navigateur; les secrets doivent rester sans prefixe public ou dans Secret Manager/App Hosting secrets.

## Resume executif

Le socle public est majoritairement sain:

- Pas de `ClientApp`, `src/app.jsx`, `src/Router.jsx` ou `setView(` actif dans les routes publiques `app/**/page.jsx`.
- `/`, `/galerie`, `/a-propos`, `/devis` et `/sitemap.xml` sont presents dans `.next/prerender-manifest.json` comme routes prerender/cachees.
- `/produit/[slugOrId]` et `/categorie/[categoryId]` sortent en `SSG` dans le tableau `next build` frais (`●` avec chemins generes). Le `prerender-manifest` local ne liste pas ces chemins dynamiques, donc il faut un gate plus robuste que ce manifeste seul.
- Les tunnels prives `/admin`, `/checkout`, `/wishlist`, `/mes-commandes` sont correctement `force-dynamic` et `noindex`.
- L'infra de deploiement est encore sandbox-only. Il n'existe pas de rail App Hosting prod propre dans ce clone.

Conclusion:

- Ne pas attaquer SEO/perf avant d'avoir verrouille la classification et l'infra prod.
- Priorite technique de rendu: ajouter une preuve automatique fiable pour produit/categorie (`next build` output ou artefacts serveur), puis decider si la lecture cookie theme doit rester cote serveur ou passer cote client.
- Priorite infra: creer un rail prod distinct plutot que recycler `apphosting.yaml` sandbox.
- Priorite nettoyage: supprimer par petites passes prouvees par `rg`, build et gates, jamais par intuition.

## Arborescence fonctionnelle

```text
.
|-- app : App Router Next, routes publiques, tunnels prives, API revalidation, robots/sitemap
|-- src/lib/server : lectures serveur public/env/theme/Firebase Admin
|-- src/lib/seo : JSON-LD et modeles SEO produit/categorie
|-- src/kit/marketplace : galerie, header public, produit, categorie, devis, wishlist, footer
|-- src/kit/vitrine : page /a-propos native Next
|-- src/kit/commerce : checkout, panier, commandes client
|-- src/kit/admin : backoffice charge via /admin
|-- src/kit/config : Firebase client lazy/core/env, Stripe, theme
|-- src/kit/contexts : Auth/Analytics context client
|-- src/kit/shared, src/kit/ui, src/kit/hooks : composants et helpers partages
|-- functions-public : codebase Functions public pour publicCatalog
|-- functions : codebase Functions principal, commerce, admin, analytics, maintenance, SEO legacy, triggers
|-- deploy : dashboard sandbox-only
|-- scripts : gates SSR/perf/mobile/images, audits infra env/secrets/deploy, E2E hosted Stripe checkout sandbox, seed/reset produit test Stripe sandbox et outils data
|-- public : assets publics servis par Next/App Hosting
```

## Arborescence graphique avec notation rendu

Legende:

- `[ISR]` : route prerender/cachee avec revalidation.
- `[SSG]` : chemins prerender au build via `generateStaticParams`.
- `[SSG?]` : `next build` indique SSG, mais le gate automatique doit encore mieux le prouver.
- `[SSR-DYN]` : rendu dynamique par requete, souvent volontaire pour auth/cookies/donnees privees.
- `[CLIENT]` : ile client ou tunnel client, charge pour interaction/auth.
- `[API]` : route HTTP serveur.
- `[SPECIAL]` : convention Next speciale (`layout`, `sitemap`, `robots`, `error`, `not-found`).
- `[FUNC]` : Cloud Function Firebase.
- `[DATA]` : source de donnees ou cache.
- `[RISK]` : point a surveiller avant prod.
- `[DEAD?]` : candidat nettoyage, a prouver avant suppression.

```text
SecondeVieNextjsSSR
|
|-- app/                                                [Next App Router]
|   |
|   |-- layout.jsx                                      [SPECIAL]
|   |   |-- src/index.css
|   |   |-- next/font/google
|   |   `-- src/lib/server/env                         [DATA env public]
|   |
|   |-- page.jsx                                       [ISR 300s]
|   |   |-- src/lib/server/products                    [DATA publicCatalog + fallback]
|   |   |-- src/utils/imageUtils
|   |   `-- HomeMotionIsland.jsx                       [CLIENT motion]
|   |
|   |-- galerie/page.jsx                               [ISR force-static 300s]
|   |   |-- src/lib/server/products                    [DATA publicCatalog limit=48]
|   |   |-- src/kit/marketplace/GalleryServerView      [Server UI]
|   |   |   |-- ArchitecturalHeaderServer              [Server header + iles]
|   |   |   |-- MarketplaceHeroServer                   [Server hero + motion island]
|   |   |   |-- ProductSectionsServer                   [Server grids]
|   |   |   |-- GalleryProductCardServer                [Server cards, links natifs]
|   |   |   |-- GalleryGridActionsIsland                [CLIENT cart/wishlist/warmup]
|   |   |   `-- FooterServer                           [Server footer]
|   |   `-- GalleryMobileShellIsland.jsx               [CLIENT mobile shell]
|   |       `-- marketplace-gallery-shell/scroll        [RISK mobile contract]
|   |
|   |-- produit/[slugOrId]/page.jsx                    [SSG? + revalidate source]
|   |   |-- generateStaticParams(120)                   [next build: chemins generes]
|   |   |-- src/lib/server/products                    [DATA product + cache tags]
|   |   |-- src/lib/server/theme                       [RISK cookies(), gate cache a renforcer]
|   |   |-- src/lib/seo/productStructuredData          [JSON-LD]
|   |   `-- src/kit/marketplace/ProductDetailServerView
|   |       |-- ProductDetailShellIsland                [CLIENT media/swipe/lightbox]
|   |       `-- ProductDetailActionsIsland              [CLIENT cart/favori]
|   |
|   |-- categorie/[categoryId]/page.jsx                [SSG? + revalidate source]
|   |   |-- generateStaticParams(categoryEntries)       [next build: chemins generes]
|   |   |-- src/lib/server/products                    [DATA catalog categories]
|   |   |-- src/lib/server/theme                       [RISK cookies(), gate cache a renforcer]
|   |   |-- src/lib/seo/categories                     [JSON-LD/categories legacy data]
|   |   `-- src/kit/marketplace/CategoryServerView
|   |       `-- CategoryControlsIsland                  [CLIENT filtres/tri]
|   |
|   |-- a-propos/page.jsx                              [ISR 300s]
|   |   |-- src/lib/server/about                       [DATA unstable_cache 300]
|   |   `-- src/kit/vitrine/AboutServerView
|   |       |-- AboutVitrineNavIsland                    [CLIENT]
|   |       |-- AboutBeforeAfterIsland                   [CLIENT]
|   |       |-- AboutFaqIsland                           [CLIENT]
|   |       `-- AboutTestimonialsIsland                 [CLIENT]
|   |
|   |-- devis/page.jsx                                 [ISR 300s]
|   |   `-- src/kit/marketplace/QuoteRequestServerView
|   |       `-- QuoteFormIsland                         [CLIENT formulaire]
|   |
|   |-- admin/page.jsx                                 [SSR-DYN noindex]
|   |   |-- RouteClientProviders                        [CLIENT Auth/Toast]
|   |   `-- admin/AdminAppIsland.jsx                    [CLIENT backoffice]
|   |       `-- src/kit/admin/*                         [CLIENT lazy modules]
|   |
|   |-- checkout/page.jsx                              [SSR-DYN noindex]
|   |   |-- ArchitecturalHeaderServer                   [Server + iles]
|   |   |-- RouteClientProviders                        [CLIENT Auth/Toast]
|   |   |-- CheckoutPageIsland.jsx                      [CLIENT]
|   |   `-- src/kit/commerce/CheckoutView              [CLIENT cart/Stripe]
|   |
|   |-- wishlist/page.jsx                              [SSR-DYN noindex]
|   |   |-- RouteClientProviders                        [CLIENT Auth/Toast]
|   |   `-- WishlistPageIsland.jsx                     [CLIENT]
|   |
|   |-- mes-commandes/page.jsx                         [SSR-DYN noindex]
|   |   |-- RouteClientProviders                        [CLIENT Auth/Toast]
|   |   `-- OrdersPageIsland.jsx                       [CLIENT]
|   |
|   |-- api/revalidate-catalog/route.js                [API SSR-DYN]
|   |   |-- Firebase Admin verifyIdToken                [DATA auth]
|   |   |-- revalidateTag(catalog/products/category)    [ISR invalidation]
|   |   `-- revalidatePath(/, /produit, /categorie)    [ISR invalidation]
|   |
|   |-- sitemap.js                                     [SPECIAL ISR/cache 300]
|   |-- robots.js                                      [SPECIAL dynamic]
|   |-- not-found.jsx                                  [SPECIAL static noindex]
|   `-- error.jsx                                      [SPECIAL CLIENT boundary]
|
|-- src/lib/
|   |-- server/products.js                             [DATA server-only]
|   |   |-- functions-public publicCatalog              [DATA primary]
|   |   |-- Firebase Admin fallback                     [DATA fallback]
|   |   `-- Firestore REST fallback                    [DATA fallback]
|   |-- server/firebaseAdmin.js                        [DATA server-only admin]
|   |-- server/theme.js                                [RISK cookies()]
|   |-- server/env.js                                  [DATA public/server env]
|   |-- server/about.js                                [DATA about cache]
|   |-- seo/categories.js                              [DATA SEO + legacy category ids]
|   `-- seo/productStructuredData.js                   [DATA Product/Breadcrumb JSON-LD]
|
|-- src/kit/
|   |-- marketplace/                                  [Public marketplace UI]
|   |   |-- ArchitecturalHeaderServer                   [Server + menu/account/cart iles]
|   |   |-- GlobalMenuTriggerIsland                     [CLIENT lazy hamburger]
|   |   |-- PremiumMegaMenuIsland                       [CLIENT hover desktop]
|   |   |-- HeaderAccountIsland                         [CLIENT auth state]
|   |   |-- CartPanelIsland                             [CLIENT cart]
|   |   |-- GalleryServerView                           [Server galerie]
|   |   |-- ProductDetailServerView                     [Server produit]
|   |   |-- CategoryServerView                          [Server categorie]
|   |   |-- QuoteRequestServerView                      [Server devis]
|   |   `-- WishlistView                                [CLIENT wishlist]
|   |
|   |-- vitrine/                                      [/a-propos native Next]
|   |-- commerce/                                     [CLIENT checkout/panier/commandes]
|   |-- admin/                                        [CLIENT backoffice lazy]
|   |-- config/                                       [Firebase lazy/core/env, Stripe]
|   |-- contexts/                                     [Auth/Analytics providers]
|   |-- ui/                                           [Shared UI actif]
|   `-- hooks/                                        [Hooks projet, wrappers morts supprimes]
|
|-- functions-public/                                [FUNC codebase public]
|   `-- publicCatalog                                [FUNC catalogue public cache/ETag]
|
|-- functions/                                       [FUNC codebase main]
|   |-- commerce/createOrder                          [FUNC checkout stock/prix]
|   |-- commerce/stripeWebhook                        [FUNC Stripe signature]
|   |-- commerce/cancelOrder                          [FUNC annulation/restock]
|   |-- auth/adminManagement, grantAdmin              [FUNC admin claims]
|   |-- analytics/*                                   [FUNC sessions/rollups]
|   |-- email/orderEmails                             [FUNC triggers emails]
|   |-- maintenance/tools                             [FUNC RISK destructif super-admin]
|   |-- seo/seoTools                                  [FUNC legacy hosting SEO]
|   `-- src/public/catalog.js                         [DEAD? duplicat a confirmer]
|
|-- firebase.json                                    [Infra Firebase]
|   |-- apphosting backend sandbox                    [RISK sandbox-only]
|   |-- functions main + public                       [FUNC deploy]
|   |-- firestore/storage rules                       [DATA security]
|   `-- hosting legacy SPA/SEO rewrites               [RISK compat a clarifier]
|
|-- apphosting.yaml                                  [RISK sandbox-only env]
|-- .firebaserc                                      [RISK default=sandbox]
|-- deploy/                                          [RISK dashboard sandbox-only]
|-- scripts/                                         [Gates + data tooling]
|   |-- check-next-route-classification.cjs           [gate next:routes]
|   |-- audit-*-direct.mjs                            [gates refresh direct]
|   |-- audit-infra-env.cjs                           [gate infra env/secrets Phase 2]
|   |-- audit-infra-deploy.cjs                        [gate separation Firebase/App Hosting Phase 2]
|   |-- seed-e2e-stripe-product.mjs                   [tool sandbox produit test Stripe repetable]
|   |-- check-mobile-marketplace-contract.cjs         [gate mobile]
|   |-- check-performance-budget.cjs                  [gate budget]
|   `-- data/storage scripts                          [RISK pas nettoyage aveugle]
`-- public/                                          [Assets publics]
    |-- images/video/favicons/manifest                [assets actifs]
    `-- images/categories/source-config              [DEAD?/archive, ignore deploy]
```

## Lecture rapide par couleur logique

```text
PUBLIC INDEXABLE
  [ISR]    /, /galerie, /a-propos, /devis
  [SSG?]   /produit/[slugOrId], /categorie/[categoryId]
  [SPECIAL] sitemap.xml, robots.txt

PRIVATE / COMPTE / COMMERCE
  [SSR-DYN + CLIENT] /admin, /checkout, /wishlist, /mes-commandes

SERVER / DATA
  [API]    /api/revalidate-catalog
  [DATA]   src/lib/server/products -> functions-public publicCatalog -> Firestore/Admin fallback
  [FUNC]   functions-public publicCatalog
  [FUNC]   functions main commerce/auth/analytics/email/maintenance

CLEANUP
  [DEAD?]  anciens composants marketplace/vitrine/UI non importes
  [RISK]   functions, scripts data, admin lazy modules, legacy Firebase Hosting
```

## Carte des routes App Router

| Route | Fichiers principaux | Strategie actuelle observee | Data/cache | Iles client | Pertinence | Action recommandee |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | `app/page.jsx`, `app/HomeMotionIsland.jsx` | ISR statique, `revalidate=300`, prerender manifest OK | `getPublicCatalog(scope=cards&limit=24)`, fallback Admin/REST, tags `catalog/products` | `HomeMotionIsland` | Pertinent: landing publique cacheable | Garder ISR. Ajouter un audit home direct si besoin. |
| `/galerie` | `app/galerie/page.jsx`, `app/GalleryMobileShellIsland.jsx`, `src/kit/marketplace/GalleryServerView.jsx`, `src/kit/marketplace/DeferredGalleryIsland.jsx` | ISR force, `dynamic='force-static'`, `revalidate=300`, prerender manifest OK | Catalogue `limit=48`, fallback serveur | shell mobile, actions grille, header/menu/cart/dark, carousels bas differees | Pertinent: catalogue public cacheable | Garder ISR. Toute modif mobile doit relire `alertemobile.md`. P1 restant: orchestration header public. |
| `/a-propos` | `app/a-propos/page.jsx`, `src/kit/vitrine/AboutServerView.jsx` | ISR, `revalidate=300`, prerender manifest OK | `getAboutPersonalization()` via cache 300s | iles nav, before/after, FAQ, testimonials | Pertinent | Peut devenir SSG pur si personnalisation admin retiree. Pas prioritaire. |
| `/devis` | `app/devis/page.jsx`, `src/kit/marketplace/QuoteRequestServerView.jsx` | ISR, `revalidate=300`, prerender manifest OK | env public + contenu quasi statique | `QuoteFormIsland`, dark toggle | Fonctionne; pourrait etre static pur | Garder stable pour l'instant. SEO/perf plus tard. |
| `/categorie/[categoryId]` | `app/categorie/[categoryId]/page.jsx`, `CategoryServerView.jsx` | `next build` affiche `SSG` avec chemins generes; revalidate source present | `generateStaticParams(categoryEntries)`, catalogue filtre, `searchParams`, cookie dark mode | `CategoryControlsIsland`, header/menu/cart/dark | Pertinent pour public SEO | Ajouter un gate qui prouve les chemins categories depuis le build. Revoir `getServerDarkMode()` seulement si un futur gate cache montre une regression. |
| `/produit/[slugOrId]` | `app/produit/[slugOrId]/page.jsx`, `ProductDetailServerView.jsx` | `next build` affiche `SSG` avec chemins generes; revalidate source present | `generateStaticParams(120)`, `getPublicProduct`, JSON-LD, cookie dark mode | `ProductDetailShellIsland`, actions, lightbox/cart | Pertinent pour public SEO | Ajouter un gate qui prouve les chemins produits depuis le build. Revoir `getServerDarkMode()` seulement si un futur gate cache montre une regression. |
| `/admin` | `app/admin/page.jsx`, `app/admin/AdminAppIsland.jsx`, `app/admin/layout.jsx` | SSR dynamique prive, `force-dynamic`, noindex | initial catalog `limit=120`, puis Auth/Firestore client | `RouteClientProviders`, modules admin lazy | Pertinent | Sanctuariser. Ne pas convertir SSG/ISR. |
| `/checkout` | `app/checkout/page.jsx`, `CheckoutPageIsland.jsx` | SSR dynamique prive, `force-dynamic`, noindex | cookie dark mode, cart Firestore, callable Functions, Stripe | providers auth/toast, checkout island | Pertinent | Sanctuariser. Tester paiement avant prod. |
| `/wishlist` | `app/wishlist/page.jsx`, `WishlistPageIsland.jsx` | SSR dynamique prive, `force-dynamic`, noindex | initial catalog, wishlist/cart Firestore | providers auth/toast | Pertinent | Sanctuariser. |
| `/mes-commandes` | `app/mes-commandes/page.jsx`, `OrdersPageIsland.jsx` | SSR dynamique prive, `force-dynamic`, noindex | initial catalog, commandes Firestore | providers auth/toast | Pertinent | Sanctuariser. |
| `/api/revalidate-catalog` | `app/api/revalidate-catalog/route.js` | API route dynamique, `force-dynamic` | Firebase Admin token, `revalidateTag`, `revalidatePath` | aucune | Pertinent | Sanctuariser. Gate revalidation admin avant prod. |
| `/sitemap.xml` | `app/sitemap.js` | route speciale prerender/cachee, revalidate fetch 300 | publicCatalog pagine, fallback, categories, produits SEO | aucune | Pertinent | SEO plus tard: categories vides, host prod. |
| `/robots.txt` | `app/robots.js` | route speciale dynamique | `publicEnv.siteUrl` | aucune | Acceptable | Peut rester dynamique; static possible quand prod URL stable. |
| 404 | `app/not-found.jsx` | statique/noindex | aucune | aucune | Pertinent | Garder. |
| error boundary | `app/error.jsx` | client boundary obligatoire | erreur runtime | boundary client | Pertinent | Garder. |
| root layout | `app/layout.jsx` | layout global | `publicEnv`, fonts, script theme inline | aucune directe | Pertinent | Ne pas y ajouter de lecture runtime dynamique. |

## Decision SSR / SSG / ISR par type de page

### Pages publiques catalogue

Routes: `/`, `/galerie`, `/a-propos`, `/devis`.

Decision: ISR ou static cache est pertinent.

Pourquoi:

- Contenu public, stable plusieurs minutes.
- Donnees partagees par tous les visiteurs.
- Revalidation par tags/path deja presente pour catalogue.

### Produits et categories

Routes: `/produit/[slugOrId]`, `/categorie/[categoryId]`.

Decision cible recommandee: garder le prerender indique par `next build` et `dynamicParams=true` pour nouveaux produits/categories.

Condition:

- Ne retirer les lectures serveur liees a la requete (`cookies()` via `getServerDarkMode()`) que si un gate prouve qu'elles font perdre le caching attendu.
- Garder les interactions panier/favori/media en iles client.
- Prouver avec un gate dedie que des chemins produit/categorie sortent bien comme `SSG` dans le build. Le `prerender-manifest` seul n'est pas suffisant dans le build observe.

Si le theme serveur par cookie est juge indispensable:

- Accepter SSR dynamique cacheable pour produit/categorie seulement si le build/gate futur montre que le cookie theme force vraiment le rendu a la demande.
- Documenter que `generateStaticParams` ne donne pas le benefice ISR attendu dans le build courant.

### Tunnels prives

Routes: `/admin`, `/checkout`, `/wishlist`, `/mes-commandes`.

Decision: SSR dynamique + client islands est pertinent.

Pourquoi:

- Donnees utilisateur, auth, panier, commandes, admin.
- SEO inutile et dangereux.
- `noindex` et `force-dynamic` sont coherents.

### API et special routes

Routes: `/api/revalidate-catalog`, `/sitemap.xml`, `/robots.txt`.

Decision:

- API revalidation: dynamique obligatoire.
- Sitemap: cache/revalidate coherent.
- Robots: dynamique acceptable tant que `siteUrl` vient de l'env; static possible quand env prod verrouille.

## Infra prod

### Etat actuel

Sandbox:

- Projet Firebase: `secondevienextjsssr`
- App Hosting backend: `secondevie-next-sandbox`
- URL: `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`
- `.firebaserc`: alias `default` vers sandbox.
- `apphosting.yaml`: variables sandbox.
- `deploy/*`: dashboard sandbox-only.

Prod:

- Pas de rail App Hosting prod propre dans ce clone.
- `.env.production.example` laisse `VITE_SITE_URL` vide.
- La prod historique `secondevie-a0745` existe dans l'historique/anciens env, mais elle est traitee comme ancien domaine interdit dans plusieurs gates sandbox.

### Ce qui est prod-ready sous conditions

- Separation `.env.sandbox` / `.env.production` via `scripts/with-env.mjs`.
- Routes publiques Next natives.
- `functions-public` isole pour `publicCatalog`.
- `/api/revalidate-catalog` pour invalider Next apres mutation admin.
- Firestore rules: produits published lisibles, admin via custom claim.
- Checkout serveur: prix/stock recalcules dans Function, Stripe webhook signe.

### Risques prod a traiter avant lancement

1. Creer un rail prod separe: projet, backend App Hosting, domaine, env, CORS, secrets.
2. Ne pas recycler `apphosting.yaml` sandbox pour prod.
3. Definir `PUBLIC_ALLOWED_ORIGINS` pour le domaine prod.
4. Verifier App Check (`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`) et domaines autorises Auth.
5. Durcir `.firebaseignore` / ignore App Hosting pour exclure explicitement `.env*`, `service-account.json`, `apphosting.local.yaml`, cles `.pem/.key`.
6. `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` retire: les commandes admin critiques s'appuient sur le claim `superAdmin`; `SUPER_ADMIN_EMAIL` reste runtime serveur via Secret Manager.
7. Verifier que `functions-public` reste l'unique endpoint public deploye pour `publicCatalog`.
8. Auditer `sendTestEmail`: appele cote admin mais export Function non trouve.
9. Encadrer les fonctions maintenance destructives par backup + QA.

### Gates prod a creer ou lancer

Avant deploy prod:

```powershell
npm run build:prod
npm run next:routes
npm run perf:budget
npm run seo:check
npm run mobile:contract
```

Gates manquants recommandes:

- `prod:env-check`: echoue si `NEXT_PUBLIC_SITE_URL`/`VITE_SITE_URL` manque ou pointe localhost/sandbox.
- `next:dynamic-prerender`: prouve au moins un chemin produit et categorie dans le build output ou les artefacts serveur.
- `prod:public-catalog-check`: verifie `scope=cards`, `?id=`, pagination/cursor, ETag et CORS prod.
- `prod:admin-smoke`: login super admin, CRUD produit, publication/brouillon, upload image, bump `catalogVersion`, revalidation.
- `prod:checkout-smoke`: paiement differe, Stripe success/failure/cancel, webhook signe, stock, emails.

## Nettoyage code mort

Regle: rien ne part sans preuve `rg`, build et gates. Les suppressions doivent etre petites.

### Phase 1 - nettoyee le 2026-06-13

Ces fichiers etaient sans import actif selon `rg` et ont ete supprimes:

- `src/kit/marketplace/CategoryLegacyExperienceIsland.jsx`
- `src/kit/marketplace/categoryCatalogLoader.js`
- `src/kit/marketplace/GalleryCardActionsIsland.jsx`
- `src/kit/marketplace/LegacyLoginModalIsland.jsx` (`LegacyLoginModalFullIsland.jsx` reste actif)
- `src/kit/marketplace/MarketplaceDiscovery.jsx`
- `src/vitrine/components/MarketplaceDiscovery.jsx`
- `src/kit/ui/AnimatedPrice.jsx`
- `src/kit/ui/ConfettiRain.jsx`
- `src/kit/ui/AnimatedThemeToggler.jsx`
- `src/kit/ui/EditorialMarquee.jsx`
- `src/kit/ui/CurvedLoop.jsx`
- `src/kit/ui/CurvedLoop.css`
- `src/kit/ui/TextType.jsx`
- `src/kit/ui/TextType.css`
- `src/kit/hooks/useAuth.js`
- `src/kit/hooks/useLiveTheme.js`
- `src/kit/hooks/useFirestoreSection.js`

### Phase 2 - nettoyee le 2026-06-13

Apres verification `rg`, l'ancienne home SPA vitrine n'etait plus importee par `/a-propos`, ni par les routes publiques, ni par l'admin actif. Le bloc a ete supprime:

- `src/vitrine/HomeView.jsx`
- `src/vitrine/components/*`

Autres suppressions hors affichage actif:

- `functions/src/public/catalog.js` (doublon non exporte; l'endpoint actif vit dans `functions-public/src/public/catalog.js`)
- `scripts/measure-preview-network.py`
- `scripts/perf-network-baseline.json`
- `scripts/measure-scroll-smoothness.py`
- `scripts/dev-ports-dashboard.mjs`
- `scripts/make_boilerplate.ps1`
- `scripts/README_BOILERPLATE_GENERATOR.md`

### Assets candidats archive

Audit `rg` du 2026-06-13, sans suppression d'assets visibles. Les fichiers ci-dessous ont 0 reference textuelle directe par nom de fichier dans `app`, `src`, `public`, `scripts` et les rapports scannes. A confirmer par capture/inspection avant suppression, car certains noms peuvent etre construits dynamiquement ou servir de reserve visuelle.

- `public/images/categories/source-config/*`
- `src/assets/quote-restoration-hero.png` si le `.webp` est seul utilise
- `src/assets/marseille-vieux-port-blueprint.png`
- `src/assets/marseille-notre-dame-blueprint.png`
- doublons PNG/JPG non references quand WebP actif: `gallery-hero-*.png`, `footer-delivery-*.png`, `newsletter/*.png`, `about/*.png`, `before-after/*.png`, `hero/*.png`
- gros candidats mesures: `public/images/gallery-hero-1.png` (~6.8 MB), `gallery-hero-2.png` (~5.5 MB), `newsletter/discount-sideboard*.png` (~2.5 MB chacun), blueprints Marseille (~2.3-2.5 MB chacun), `quote-restoration-hero.png` (~2.1 MB).

Ne pas supprimer vite:

- `public/manifest.json`
- `public/favicon_final.png`
- `public/apple-touch-icon.png`
- `public/google72f08140b6217ed3.html`
- `public/maintenance/audit.json`
- `public/images/logoanais.png` car encore reference par `functions/src/seo/seoTools.js`

### Zones dangereuses

Ne pas nettoyer automatiquement:

- `src/kit/admin/*`: nombreux modules lazy-loades par `AdminAppIsland`.
- `src/kit/admin/AdminComments.jsx`: supprime le 2026-06-13 apres audit; aucune gestion commentaires produit n'est active dans l'admin/site. Les routines Functions qui nettoient d'anciennes sous-collections `comments` restent conservees.
- `functions/*`: exports appeles par `httpsCallable`, triggers ou deploy Firebase, meme si non importes par React.
- `functions-public/*`: endpoint public actif.
- `functions/src/seo/seoTools.js` et bloc `hosting` de `firebase.json`: compat legacy Firebase Hosting/SPA a clarifier.
- Champs data legacy: `imageVariants`, `thumbnailUrl`, `LEGACY_CATEGORY_IDS`, categories historiques.
- Scripts data/Storage: `copy-firestore-project`, `replace-firestore-string`, `purge-expired-firestore`, `cleanup-product-image-variants`, backfills images.

## P2 Public Next - audit sans modification visuelle

Decision du 2026-06-13: ne pas modifier les composants qui constituent le rendu actuel des pages publiques tant que la demande porte sur le nettoyage du code mort.

- `/devis`: la page est active et visuellement en cours de finalisation. Le budget est au-dessus du seuil courant quand elle utilise le header unifie, mais aucune modification du header ou du design n'est faite dans cette passe. Optimisation a traiter plus tard comme decision UX/perf explicite.
- `/galerie`: route active, sensible mobile, protegee par `alertemobile.md`. Aucun decoupage d'ilot ni suppression de composant rendu n'est fait dans une passe "code mort".
- `/a-propos`: ancienne SPA vitrine supprimee; la page active Next `src/kit/vitrine/*` reste intacte. Les assets candidats restent seulement documentes.
- `publicCatalog`: l'endpoint actif est `functions-public/src/public/catalog.js`. Le doublon non exporte `functions/src/public/catalog.js` a ete supprime.

## Ordre de travail recommande

1. Finaliser cette carte et la maintenir a jour.
2. Ajouter les gates manquants de classification et env prod.
3. Decider produit/categorie: vrai ISR ou SSR dynamique assume.
4. Creer le rail App Hosting prod separe.
5. Nettoyer Phase 1 en petite PR.
6. Valider backoffice/checkout complet en sandbox.
7. Nettoyer Phase 2 seulement apres preuves.
8. Ensuite seulement: SEO beton puis perf/hydratation.

## Checklist de verification apres nettoyage

Minimum:

```powershell
rg -n "ClientApp|src/app.jsx|src/Router.jsx|setView\\(" app src scripts
npm run lint
npm run build
npm run next:routes
npm run perf:budget
```

Routes publiques:

```powershell
npm run perf:gallery-direct
npm run perf:category-direct
npm run perf:product-direct
npm run perf:about-direct
npm run perf:quote-direct
```

Si galerie/mobile/produit/scroll est touche:

```powershell
npm run mobile:contract
```

Si prod env est touche:

```powershell
npm run build:prod
```

## Decisions ouvertes

- Garder ou supprimer le skill local `nextjsssr`? Decision actuelle: le garder comme garde-fou historique anti-SPA/mobile, mais ne pas le traiter comme source normative.
- Produit/categorie doivent-ils absolument sortir en ISR/SSG prouve automatiquement? Recommandation: oui, et le build actuel les annonce deja en SSG; il manque surtout un gate robuste.
- Faut-il conserver le bloc Firebase Hosting legacy dans `firebase.json`? A decider avant nettoyage Functions SEO.
- Faut-il garder les rapports historiques racine? Recommandation: archiver/compacter, pas supprimer brutalement.
