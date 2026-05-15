# Audit Next.js SSR / SEO / Firebase App Hosting

Date: 2026-05-15

## Etat actuel

- Le projet reste sur Next.js App Router, sans retour a Vite SPA.
- Les routes publiques `/`, `/a-propos`, `/produit/[slugOrId]` et `/categorie/[categoryId]` ont un HTML serveur visible avec H1, contenu indexable, canonical, Open Graph/Twitter et JSON-LD.
- `/produit/[slugOrId]` et `/categorie/[categoryId]` sont pre-rendues via `generateStaticParams` et ISR `revalidate = 300`.
- `/a-propos` ne monte plus le shell client global `ClientApp`.
- Home, produit et categorie gardent encore `ClientApp` pour conserver l experience marketplace interactive pendant cette passe.
- Les grilles SSR produits utilisent `next/link` avec `prefetch={false}` pour eviter du prefetch massif.
- Les images SSR publiques utilisent `next/image`; les remotePatterns sont limites aux buckets Firebase Storage du projet sandbox/production connus.
- Les tailles Next Image sont limitees aux breakpoints utiles du site pour reduire les variantes d optimisation generees.
- `sitemap.js` expose les pages statiques, produits et categories avec `lastModified` quand disponible.
- `apphosting.yaml` est compatible cout sandbox: `minInstances: 0`, `maxInstances: 10`, `concurrency: 80`, `cpu: 1`, `memoryMiB: 512`.
- L invalidation ISR admin existe via `src/kit/admin/publicCatalogInvalidation.js` et `app/api/revalidate-catalog/route.js`.

## Risques identifies

- `ClientApp` reste un shell client large sur `/`, `/produit/*` et `/categorie/*`; la reduction en ilots client doit continuer progressivement.
- `loading.jsx` produit/categorie existe avec des skeletons serveur minimaux. Les checks HTML verifient que ces loaders ne remplacent pas le vrai contenu SSR produit/categorie dans le HTML initial.
- Les categories declarent `dynamicParams = false`: une categorie inconnue sort par le 404 global. Les produits gardent `dynamicParams = true` pour permettre les nouveaux produits publies entre deux builds; un produit inconnu repond bien en 404/noindex, mais Next 15 ne rend pas de body no-JavaScript sur ce fallback dynamique.
- Les anciennes Functions SEO dans `functions/src/seo/seoTools.js` dupliquent encore une partie de la responsabilite maintenant portee par Next. Elles ne doivent etre supprimees qu apres validation de trafic/deploiement.
- `npm audit --omit=dev` signale encore 8 vulnerabilites low de production.
- `npm audit --omit=dev` signale encore 9 vulnerabilites low dans `functions/` et `functions-public/` via la meme chaine Firebase Admin / Google Cloud.
- La chaine `next -> postcss` a ete corrigee par override npm: Next 15.5.18 dedupe maintenant sur `postcss@8.5.14`.
- La chaine `firebase-admin -> @google-cloud/* -> @tootallnate/once` remonte encore des alertes low. `firebase-admin` est monte en 13.10.0, sans supprimer cette chaine.
- `npm run build` charge bien `.env.sandbox` via `scripts/with-env.mjs`. Next affiche encore `Environments: .env.production` car il detecte ce fichier en mode production, mais `with-env.mjs` neutralise maintenant les cles presentes seulement dans l autre fichier suffixe.

## Quick wins appliques

- SSR visible produit: titre, prix, description, image, faits clefs, liens categorie, JSON-LD Product/Breadcrumb.
- SSR visible categorie: grille indexable, liens produits, JSON-LD CollectionPage/ItemList.
- SSR visible home et a-propos.
- `/a-propos` convertie en route serveur statique sans shell SPA global.
- `loading.jsx` produit/categorie, `not-found.jsx` global et `error.jsx` global ajoutes. Les not-found produit/categorie segmentes ont ete retires apres test no-JavaScript.
- Sitemap enrichi avec categories.
- `next.config.mjs` durci pour les images Firebase Storage.
- Admin Maintenance ajoute avec rapport local `public/maintenance/audit.json`.
- `scripts/with-env.mjs` durci pour eviter qu une variable presente uniquement dans `.env.production` soit injectee pendant un build sandbox, et inversement.
- Procedure de revalidation ISR documentee dans `_DOCS/revalidation-next.md`.
- `/api/revalidate-catalog` ne fait plus confiance a `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`; le fallback super-admin utilise la variable serveur `SUPER_ADMIN_EMAIL` ajoutee aux deux `.env.*` et a `apphosting.yaml`.
- `firebase-admin` mis a jour en 13.10.0 dans la racine, `functions/` et `functions-public/`.
- Override npm `postcss: "$postcss"` ajoute pour forcer Next a utiliser la version corrigee deja presente en dependance directe.
- Google Fonts est remplace par `next/font/google` dans `app/layout.jsx`; les classes Tailwind utilisent maintenant les variables de police auto-hebergees.
- `next.config.mjs` fixe `deviceSizes`, `imageSizes`, `minimumCacheTTL` et `dangerouslyAllowSVG: false` pour maitriser cout et surface d attaque de l Image Optimization API.

## Plan priorise restant

1. Continuer la sortie progressive de `ClientApp`: creer des ilots client dedies pour produit, categorie et home au lieu de monter tout `src/app.jsx`.
2. Documenter puis desactiver ou archiver les anciennes Functions SEO si les routes Next couvrent tout le trafic public.
3. Surveiller la chaine Firebase Admin / Google Cloud / `@tootallnate/once`; ne pas appliquer `npm audit fix --force`, qui propose un downgrade cassant vers `firebase-admin@10.3.0`.
4. Revoir les images produit pour assurer dimensions/blurDataURL coherentes sur toutes les variantes catalogue.
5. Ajouter un vrai suivi bundle analyzer si le poids client reste trop eleve apres les premiers ilots.

## Validations executees

- `npm run maintenance:audit`: genere `public/maintenance/audit.json`, statut `vulnerability_detected`, 8 low.
- Verification env sandbox: `NEXT_PUBLIC_FIREBASE_PROJECT_ID` mappe la valeur `VITE_FIREBASE_PROJECT_ID` de `.env.sandbox` et differe de `.env.production`.
- `npm run lint`: OK.
- `npm run mobile:contract`: OK, invariant mobile conserve.
- `npm run build`: OK, 55 pages generees, avec `loading.jsx` segmentes produit/categorie.
- `npm run seo:check` sur serveur local: OK pour `/`, `/a-propos`, `/produit/bu-3uidDZpwH2ydH8v9jiw3` et `/categorie/buffets`.
- `npm run test:e2e` sur serveur local `http://127.0.0.1:4300`: OK, 20 tests Playwright desktop/mobile passes.
- Verification HTML serveur locale:
  - `/`: H1, canonical, JSON-LD.
  - `/a-propos`: H1, canonical, JSON-LD.
  - `/produit/bu-3uidDZpwH2ydH8v9jiw3`: H1, canonical, JSON-LD.
  - `/categorie/buffets`: H1, canonical, JSON-LD.
- Verification polices: les routes publiques ne contiennent plus `fonts.googleapis.com`; les classes `next/font` sont presentes et le H1 `/a-propos` utilise bien Cormorant Garamond auto-hebergee.
- Verification images: les `srcset` publics ne generent plus de variante `w=3840`; les variantes montent jusqu a `w=1920` avec les nouveaux `deviceSizes`.
- Verification navigateur sans JavaScript: H1 visible sur `/a-propos`, `/produit/bu-3uidDZpwH2ydH8v9jiw3` et `/categorie/buffets`.
- Verification 404: `/introuvable-test` et `/categorie/id-inexistant-test` repondent en 404/noindex avec H1 visible sans JavaScript. `/produit/id-inexistant-test` repond en 404/noindex; body no-JavaScript vide lie au fallback dynamique Next 15 conserve pour nouveaux produits entre deux builds.
- Verification securite revalidation: `POST /api/revalidate-catalog` sans Bearer token repond `401 {"error":"missing_token"}`.
- `npm audit --omit=dev`: echec attendu, 8 vulnerabilites low de production.
- `functions/ npm audit --omit=dev`: echec attendu, 9 vulnerabilites low.
- `functions-public/ npm audit --omit=dev`: echec attendu, 9 vulnerabilites low.

## Sources officielles consultees

- Next.js Image Component: https://nextjs.org/docs/app/api-reference/components/image
- Next.js Caching and Revalidating: https://nextjs.org/docs/app/getting-started/caching-and-revalidating
- Next.js generateStaticParams: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
- Next.js Metadata and OG images: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
- Next.js Link / Prefetching: https://nextjs.org/docs/app/api-reference/components/link et https://nextjs.org/docs/app/guides/prefetching
- Next.js Sitemap file convention: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- Next.js Font module: https://nextjs.org/docs/app/api-reference/components/font
- Firebase App Hosting framework support/configuration: https://firebase.google.com/docs/app-hosting/frameworks-tooling et https://firebase.google.com/docs/app-hosting/configure

## Audit de completion objectif

| Exigence | Evidence concrete | Statut |
| --- | --- | --- |
| Ne pas revenir a Vite SPA | Routes App Router conservees dans `app/`; scripts Next `dev/build/start`; aucune restauration Vite. | Couvert |
| Lire AGENTS / roadmap / alerte mobile avant modification | Consignes appliquees; invariant mobile conserve dans `src/Router.jsx`; `npm run mobile:contract` OK. | Couvert |
| Home SSR/SEO public | `app/page.jsx`: HTML serveur visible `data-ssr-home`, H1, images, liens produits, JSON-LD; `seo:check` couvre `/`. | Couvert |
| A propos SSR/SEO public | `app/a-propos/page.jsx`: route serveur statique, H1, image, JSON-LD, metadata; ne monte plus `ClientApp`. | Couvert |
| Produit SSR/SEO public | `app/produit/[slugOrId]/page.jsx`: contenu visible, `generateMetadata`, Product/Breadcrumb JSON-LD, `notFound()`, `revalidate=300`, image LCP `priority`. | Couvert |
| Categorie SSR/SEO public | `app/categorie/[categoryId]/page.jsx`: grille serveur visible, liens `next/link`, `prefetch={false}`, CollectionPage/ItemList JSON-LD, `dynamicParams=false`. | Couvert |
| Routes dynamiques / ISR | `generateStaticParams` produit/categorie, ISR 5 min, fallback produit dynamique pour nouveaux produits, categorie inconnue en 404. | Couvert |
| Loading / not-found / error | `app/produit/[slugOrId]/loading.jsx`, `app/categorie/[categoryId]/loading.jsx`, `app/not-found.jsx`, `app/error.jsx`; `seo:check` confirme que les loaders ne remplacent pas le contenu SSR initial. | Couvert |
| Images Next durcies | `next.config.mjs`: remotePatterns Firebase stricts, AVIF/WebP, tailles bornees, TTL, SVG interdit; pages SSR utilisent `next/image` avec dimensions/sizes/blur quand disponible. | Couvert |
| Navigation / prefetch | Grilles SSR home/categorie en `next/link`, prefetch des longues listes desactive. | Couvert |
| Cache / cout Firebase | `src/lib/server/products.js`: fetch HTTP cacheable/tague et fallback admin; routes publiques en ISR; endpoint revalidation documente. | Couvert |
| SEO metadata / sitemap / robots | `generateMetadata` produit/categorie, metadata home/a-propos/layout, JSON-LD, `app/sitemap.js`, `app/robots.js`; `seo:check` couvre les tags critiques. | Couvert |
| Bundle / client pragmatique | Admin et vues lourdes restent en `React.lazy`; Stripe est charge dans `CheckoutStripeModal`; Recharts n est pas utilise en admin analytics; `/a-propos` sort du shell global; home/produit/categorie gardent `ClientApp` provisoirement pour l experience marketplace. | Couvert pour cette passe |
| App Hosting cout | `apphosting.yaml`: sandbox, `minInstances: 0`, `maxInstances: 10`, `concurrency: 80`, ressources bornees. | Couvert |
| Invalidation catalogue | `src/kit/admin/publicCatalogInvalidation.js`, `app/api/revalidate-catalog/route.js`, `_DOCS/revalidation-next.md`; appel sans token verifie en 401. | Couvert |
| Admin Maintenance | `src/kit/admin/AdminMaintenance.jsx`, onglet `maintenance`, `scripts/maintenance-audit.mjs`, `public/maintenance/audit.json`, `_DOCS/maintenance-next.md`. | Couvert |
| Env suffixes | `SUPER_ADMIN_EMAIL` ajoute aux deux exemples `.env.*` et a `apphosting.yaml`; `scripts/with-env.mjs` neutralise l autre environnement. | Couvert |
| Gates demandes | `lint`, `build`, `seo:check`, `mobile:contract`, `test:e2e`, `npm audit --omit=dev`, audits Functions executes. | Couvert avec audit vulnerabilites low restantes |

Conclusion: les livrables demandes sont presents et verifies. La sortie complete de `ClientApp` sur home/produit/categorie reste documentee comme prochaine etape technique, car la demande autorise de garder la galerie et les parcours interactifs en client components quand c est plus pragmatique.
