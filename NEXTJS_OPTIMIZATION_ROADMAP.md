# Next.js optimization roadmap - Seconde Vie SSR

Date: 2026-05-13

## Pourquoi ce document existe

Le clone Next.js SSR fonctionne et le benchmark deploye montre deja des gains sur le poids public et le HTML produit. Mais le projet n'est pas encore une architecture Next.js pleinement optimisee. Il reste une partie importante de logique heritee SPA: galerie client, hydration large, chargements image Firebase, panier/wishlist/auth et surfaces admin.

Ce document cadre les prochaines optimisations sans casser le comportement valide.

## Etat actuel

Ce qui est deja en place:

- Next App Router pour les routes publiques.
- SSR produit avec HTML initial, metadata et JSON-LD.
- `firebase-admin` reserve au code serveur.
- App Hosting sandbox sur `secondevienextjssr`.
- Base Firestore/Storage importee depuis la sandbox source.
- Benchmark deploye reproductible via `npm run perf:architecture`.

Ce qui n'est pas encore pleinement optimise Next:

- Les pages produit ne sont pas encore materialisees comme pages cachees/ISR avec revalidation ciblee.
- La galerie reste une experience fortement client-side.
- Les images Firebase restent le principal poste reseau sur premier affichage.
- Les composants panier, wishlist, admin, checkout et detail gardent beaucoup d'hydratation.
- Les caches serveur Next doivent etre formalises route par route.

## Avancement implementation - 2026-05-13

Statut apres optimisation guidee par cette roadmap:

- N0 baseline: fait. `npm run perf:architecture` accepte maintenant `COLD_PRODUCT_PATH` / `PRODUCT_PATH` et affiche le chemin mesure.
- N1 cache serveur: fait cote Next et Firebase. Les lectures publiques produit/catalogue utilisent `server-only`, `cache()`, `revalidate: 300` et des tags Next (`catalog`, `products`, `product:*`, `category:*`). La Function publique `publicCatalog` est deployee dans le codebase `public`, sans charger Stripe/Gmail.
- N2 ISR produit: fait pour les produits publies. `generateStaticParams` prerender les meubles publies disponibles au build; `dynamicParams` reste actif pour les nouveaux produits.
- N3 images premiere visite: ameliore. Le SSR produit privilegie `large/medium` au lieu de `full`; les hosts Storage sandbox sont autorises par `next/image`.
- N4 hydratation: partiel. Les gros modules admin/checkout restent deja charges dynamiquement via l'architecture clonee, mais la galerie publique reste encore fortement client-side.
- N5 prefetch intelligent: fait en premiere passe. Les cartes produit prefetchent detail donnees + images sur intention hover/focus, avec garde-fou reseau lent / `saveData`.
- N6 observabilite: partiel. Le benchmark local/deploye est reproductible; les routes App Hosting doivent encore etre enregistrees dans la console pour suivre p95/5xx/cache hit.

Validation executee apres changements:

```powershell
npm run lint
npm run build
npm run seo:check
npm run mobile:contract
npm run test:e2e
$env:SPA_BASE_URL='https://secondeviesandbox.web.app'
$env:NEXT_BASE_URL='http://127.0.0.1:4300'
$env:COLD_PRODUCT_PATH='/produit/buffet-KrTETXPknYNwgak66T8p'
npm run perf:architecture
```

Resultat cle du build: 40 pages generees, dont `/produit/[slugOrId]` en SSG avec `generateStaticParams` et 35 chemins produit publies.

Deploiement Functions: `publicCatalog` est isole dans `functions-public` et deployee avec:

```powershell
firebase deploy --project secondevienextjsssr --only functions:public:publicCatalog --non-interactive
firebase functions:artifacts:setpolicy --project secondevienextjsssr --location us-central1 --days 7 --force
```

Validation endpoint: `https://us-central1-secondevienextjsssr.cloudfunctions.net/publicCatalog?scope=cards&limit=2` repond `200`; CORS OK pour le domaine App Hosting sandbox.

## Probleme cible: premier affichage d'un meuble jamais consulte

Quand un meuble n'a jamais ete consulte, le premier affichage peut etre plus lent car plusieurs caches sont froids:

- cache navigateur vide;
- cache CDN/Storage froid pour l'image;
- lecture Firestore produit;
- eventuel cold start App Hosting;
- decode image dans Chrome;
- hydration React des zones interactives.

Next.js peut ameliorer ce cas, mais seulement si on utilise ses leviers serveur et cache. Le simple portage SPA vers Next ne suffit pas.

## Roadmap

### N0 - Baseline et gates avant toute optimisation

Objectif: savoir si chaque changement ameliore vraiment la route.

Actions:

- Garder `npm run perf:architecture` comme benchmark de reference Hosting vs App Hosting.
- Ajouter si besoin un mode "cold product" qui ouvre un produit peu consulte avec cache navigateur neuf.
- Continuer `npm run seo:check`, `npm run mobile:contract`, `npm run test:e2e`.
- Capturer LCP, CLS, long tasks, request count, JS KB, image KB et scroll frame gaps.

Validation:

```powershell
npm run lint
npm run build
npm run seo:check
npm run mobile:contract
npm run test:e2e
npm run perf:architecture
```

Risque:

- Ne pas conclure sur une seule valeur LCP. Comparer les tendances route par route.

### N1 - Cache serveur catalogue/produit

Objectif: eviter que chaque visite publique relise Firestore inutilement.

Actions:

- Centraliser les lectures serveur produit/categorie dans un module server-only.
- Utiliser une strategie de cache Next par produit et par catalogue.
- Dedupliquer les lectures dans une meme requete avec `cache()` si utile.
- Ajouter une cle de version type `catalogVersion` pour invalider proprement apres action admin.
- Ne jamais mettre de secret dans `NEXT_PUBLIC_*`.

Validation:

- Une page produit doit fonctionner sans exposer `firebase-admin` au navigateur.
- Apres modification admin test, la page SSR doit afficher les nouvelles donnees apres revalidation.

Risque:

- Cache stale si l'invalidation admin est oubliee.

### N2 - Pages produit prerender/ISR

Objectif: reduire le cout du premier visiteur sur les pages produit publiques.

Actions:

- Evaluer `generateStaticParams` pour les produits publies.
- Utiliser une revalidation raisonnable ou une revalidation ciblee apres publication/modification.
- Garder les donnees client privees hors du HTML serveur.
- Ne pas prerender les brouillons.

Validation:

- Le HTML initial contient bien le produit, son image principale, ses metadata et son JSON-LD.
- Un produit publie apparait apres action admin test.
- Un brouillon ne sort pas dans sitemap/SSR public.

Risque:

- Prerender trop large si le catalogue grossit fortement. Pour 35 a quelques centaines de meubles, c'est raisonnable.

### N3 - Images produit premiere visite

Objectif: ameliorer le cas "image froide" qui reste visible meme avec SSR.

Actions:

- Servir la meilleure variante pour chaque contexte: card, medium, large, full.
- Preload uniquement l'image principale produit au-dessus de la ligne de flottaison.
- Ajouter placeholder stable: ratio, dominant color, blurDataUrl.
- Verifier les headers cache Storage et les URLs de variantes.
- Evaluer un loader/proxy image Next seulement si le gain justifie la complexite.

Validation:

- Le premier produit direct ne charge pas full-size si une variante suffit.
- Pas de CLS image.
- Pas de flash mobile sur le detail produit.

Risque:

- Trop preloader peut empirer la galerie. Preload doit rester cible.

### N4 - Moins d'hydratation client

Objectif: garder le HTML serveur utile sans forcer tout React a s'hydrater trop tot.

Actions:

- Garder le contenu SEO produit en Server Component quand possible.
- Isoler panier, wishlist, auth, lightbox et admin en Client Components.
- Charger checkout, Stripe, cropper, charts et admin uniquement sur route/interaction.
- Eviter de passer de gros objets du serveur vers des composants client si seules quelques props sont utiles.

Validation:

- JS KB public baisse ou reste stable.
- La page produit reste interactive apres hydration.
- Les routes admin/checkout ne polluent pas le parcours public initial.

Risque:

- Mauvais decoupage server/client peut creer de la duplication ou des props serialisees trop lourdes.

Avancement scroll froid 2026-05-25:

- Fait: le scroll lock desktop d'entree galerie est neutralise, les sections basses montent par proximite viewport, le footer a un placeholder de hauteur, et les gates `perf:scroll` / `perf:scroll:newsletter` protegent ces invariants.
- Fait: Firebase est sorti autant que possible du chemin public initial via `firebaseEnv.js`, `firebaseCore.js` et `firebaseLazy.js`; Firestore/Functions/Auth/AppCheck sont charges a la demande.
- Fait: les lectures decoratives `theme_settings`, `contact_info`, `gallery_app` et `announcement_config` sont repoussees a `45 s` + idle, et `publicCatalog` est dedoublonne en vol.
- Fait: `GlobalMenu` est lazy afin de ne pas imposer son chunk au premier scroll froid.
- Mesure finale: scroll immediat OK sans lock ni overflow hidden, premier scroll effectif `177 ms` apres document scrollable, 1 cloud-function catalogue, 0 Firestore reseau; les gaps >100 ms restent presents sous CPU x4.
- Fait: premiere passe d'ilots client sans refactor structurel. Framer Motion est retire du shell public galerie, `PremiumMegaMenu` est differe derriere un placeholder stable, `AnalyticsProvider` est repousse a `15 s` + idle, les particules hero et logos decoratifs categories attendent idle/intention, et `CategoryRail` ne rend plus simultanement mobile + desktop.
- Mesure apres ilots client: scroll immediat `seconde-vie-immediate-final-client-islands-clean-2` OK, premier scroll effectif `155 ms` apres document scrollable, long tasks `4 / 766 ms / max 232 ms`, frame gaps `max 250 ms`, `4` gaps >100 ms. `Petits Prix`, `Testimonials`, `Newsletter`, `Footer` et `ProductDetail` ne montent pas pendant le scroll immediat.
- Fait 2026-05-25: `/produit/[slugOrId]` ne monte plus `ClientApp defer` pour l'experience publique directe. La route SSR produit hydrate maintenant `ProductPageExperience`, une ile client autonome limitee au produit, aux miniatures, au panneau Details mobile, au favori local et a la lightbox. `src/app.jsx`, le shell galerie, le hero, les categories galerie et le footer differe ne sont plus charges sur une visite directe produit.
- Mesure produit direct apres migration: `npm run perf:product-direct` OK sur desktop/mobile CPU x4, 30 requetes, 400 kB JS, 0 asset galerie/home, 0 marqueur SPA legacy, variantes `thumb` + `medium` avant zoom. `perf:architecture` local mesure la route produit Next a 29 requetes / 1323 kB total / 400 kB JS / LCP 620 ms, contre 94 requetes / 7339 kB total / 874 kB JS pour la SPA sandbox.
- Prochaine etape N4: decoupage plus profond en vrais ilots SSR/client. Le markup stable des sections visibles doit pouvoir exister sans monter tout `src/app.jsx`/`Router.jsx`; wishlist, panier, admin, recherche, carousels et animations complexes doivent se brancher progressivement apres interaction, idle ou proximite viewport.
- Gate de decision: toute passe N4 doit comparer `perf:scroll`, `perf:scroll:newsletter`, `perf:budget` et un controle mobile `mobile:contract`. Le gain attendu est une baisse des long tasks/frame gaps; le scroll lock desktop ne doit jamais revenir.

### N5 - Prefetch intelligent depuis la galerie

Objectif: rendre le clic produit plus rapide sans tout charger au depart.

Actions:

- Prefetch route produit sur hover/focus desktop.
- Sur mobile, prefetch avec prudence: seulement cartes visibles/probables, jamais toute la galerie.
- Precharger l'image detail principale sur intention claire.
- Annuler ou limiter les preloads pendant scroll rapide.

Validation:

- Le clic produit depuis galerie ameliore le temps percu.
- Le premier scroll galerie ne se charge pas de requetes inutiles.

Risque:

- Un prefetch trop agressif augmente les couts Storage et peut degrader les petits reseaux.

### N6 - Observabilite App Hosting

Objectif: savoir si App Hosting scale correctement en conditions reelles.

Actions:

- Surveiller cold starts, latence p95, erreurs 5xx, cache hit routes.
- Comparer Home, categorie, produit direct et produit depuis galerie.
- Documenter couts App Hosting vs Hosting.
- Ajouter RUM plus tard pour vrais LCP/INP/CLS utilisateur.

Validation:

- Dashboard App Hosting avec routes cles.
- Rapport avant/apres apres chaque optimisation majeure.

Risque:

- Les benchmarks locaux ne remplacent pas la mesure terrain.

## Ordre recommande

1. N0 baseline et gates.
2. N1 cache serveur produit/catalogue.
3. N3 images premiere visite.
4. N2 ISR/prerender une fois l'invalidation admin claire.
5. N4 hydration/bundle.
6. N5 prefetch intelligent.
7. N6 observabilite continue.

## Garde-fous

- Ne jamais modifier la production Firebase sans validation explicite.
- Ne jamais exposer `firebase-admin` ou une cle serveur au navigateur.
- Ne jamais mettre une variable privee en `NEXT_PUBLIC_*`.
- Ne pas refactorer la galerie/detail mobile sans relire `alertemobile.md`.
- Conserver l'invariant:

```jsx
const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;
```

- Ne pas promettre que SSR regle tous les lags. Mesurer.

## Documentation liee

- `ARCHITECTURE_BENCHMARK_DECISION.md`
- `COMPARISON.md`
- `MIGRATION_REPORT.md`
- `DATABASE_MIGRATION_PLAN.md`
- `COMPLETION_AUDIT.md`
- `alertemobile.md`
