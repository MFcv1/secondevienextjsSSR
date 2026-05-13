# Migration Report - Secondevie Next.js SSR

## Scope

Clone cible : `C:\Users\matth\Travail\SecondevieNextjsSSR`.

Projet source lu uniquement : `C:\Users\matth\Travail\SecondevieAnais`.

Etat source verifie le 2026-05-13 : `git status --short` retourne vide dans `SecondevieAnais`.

## Architecture

- Next.js 15 App Router.
- Firebase reste la source de verite.
- Firebase App Hosting est la cible de deploiement recommandee pour ce clone full-stack.
- Les Cloud Functions existantes sont conservees pour commerce, Stripe, admin, analytics et maintenance.
- Les pages publiques Next montent le shell React existant en client-side pour conserver les interactions.
- Les pages produit ajoutent une couche serveur SEO/HTML initial avant le shell interactif.

## Docs officielles lues

- Firebase Hosting + Next.js : https://firebase.google.com/docs/hosting/frameworks/nextjs
- Firebase App Hosting : https://firebase.google.com/docs/app-hosting
- Firebase SSR apps : https://firebase.google.com/docs/web/ssr-apps
- Firebase App Hosting costs : https://firebase.google.com/docs/app-hosting/costs
- Next Server/Client Components : https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next Image Optimization : https://nextjs.org/docs/app/getting-started/images
- Next `generateMetadata` : https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Next ISR : https://nextjs.org/docs/app/guides/incremental-static-regeneration

Points retenus :

- Firebase indique que les apps Next.js full-stack sont mieux ciblees par App Hosting.
- Firebase Hosting framework-aware peut deployer du SSR via Cloud Functions, mais ce mode est preview et moins adapte qu'App Hosting.
- App Hosting s'appuie sur Cloud Build, Artifact Registry et Cloud Run, et necessite le plan Firebase Blaze.
- Firebase documente `FirebaseServerApp` pour les apps SSR Firebase.
- `firebase-admin` et les lectures privilegiees Firestore doivent rester server-only.
- Next App Router rend les pages/layouts en Server Components par defaut; les comportements avec navigateur restent en Client Components.
- `next/image` requiert dimensions ou `fill` pour reserver le ratio et limiter le CLS.
- `generateMetadata` est le bon point d'integration pour title, description, canonical, OpenGraph et Twitter.

## Migration realisee

- Nouveau projet Next dans le dossier sibling, sans deplacer le projet Vite.
- Copie des sources utiles : `src`, `public`, `functions`, `scripts`, assets et configs Firebase.
- Ajout des routes App Router :
  - `/`
  - `/a-propos`
  - `/produit/[slugOrId]`
  - `/categorie/[categoryId]`
  - `/admin`
  - `/checkout`
  - `/wishlist`
  - `/devis`
  - `/mes-commandes`
  - `/robots.txt`
  - `/sitemap.xml`
- Ajout du bridge env `scripts/with-env.mjs` pour charger `.env.sandbox` ou `.env.production` et mapper `VITE_*` vers `NEXT_PUBLIC_*`.
- Le fallback legacy `VITE_SUPER_ADMIN_EMAIL` reste mappe comme dans la SPA, car il est deja utilise par le client, les regles Firestore et les Functions existantes.
- Ajout de `apphosting.yaml`, `RUNBOOK.md`, `COMPARISON.md`, Playwright et scripts de controle.

## SSR Produit

Fichiers principaux :

- `app/produit/[slugOrId]/page.jsx`
- `src/lib/server/products.js`
- `src/lib/server/firebaseAdmin.js`
- `src/lib/seo/productStructuredData.js`

Le rendu serveur produit fournit :

- HTML initial avec titre, prix, description et image.
- `generateMetadata` pour title, description, canonical, OpenGraph et Twitter.
- JSON-LD `Product`.
- JSON-LD `BreadcrumbList`.
- Filtre serveur `status === 'published'`.
- Fallback lecture safe via `publicCatalog` puis Firestore REST direct read.

## Client conserve

Le shell interactif existant est charge par `app/ClientApp.jsx`.

Comportements conserves :

- galerie;
- admin;
- panier;
- wishlist;
- checkout;
- auth Firebase;
- detail produit desktop/mobile;
- lightbox;
- staging mobile `currentSrc`/`decode`;
- invariant mobile `shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay`;
- freeze du scroller galerie quand le detail produit est ouvert.

## Strategie base de donnees

Par defaut, le clone utilise `.env.sandbox`.

Options safe documentees :

- utiliser le projet sandbox existant;
- lire la base production en read-only uniquement pour comparaison, sans tests d'ecriture;
- exporter/importer Firestore vers emulateur ou sandbox avant tests destructifs.

Aucune suppression ou modification de donnees production n'a ete lancee.

## Validation

Commandes executees :

- `npm install` : OK.
- `npm run dev` : OK sur `127.0.0.1:3001`, reponse HTTP 200, serveur arrete ensuite.
- `npm run build` : OK, Next.js 15.5.18.
- `npm run lint` : OK.
- `npm run seo:check` : OK, SSR product evidence sur `/produit/buffet-KrTETXPknYNwgak66T8p`.
- `npm run mobile:contract` : OK.
- `npm run test:e2e` : OK, 20 tests Playwright desktop/mobile.
- Routes HTTP verifiees en 200 : `/`, `/a-propos`, `/categorie/buffets`, `/produit/buffet-KrTETXPknYNwgak66T8p`, `/admin`, `/devis`, `/checkout`, `/wishlist`, `/mes-commandes`, `/robots.txt`, `/sitemap.xml`.
- Scan `.next/static` : aucun marqueur `firebase-admin`, `private_key`, `client_email`, `STRIPE_SECRET`, `GMAIL_PASSWORD`.
- Comparaison HTML brute SPA vs Next : voir `COMPARISON.md`.
- Comparaison runtime Playwright SPA vs Next : voir `COMPARISON.md`.

## Limites connues

- Le clone n'est pas une reecriture complete Server Components de toute la galerie : les interactions lourdes restent client-side pour rester fideles au projet source.
- L'admin reste client-side afin de ne pas exposer de donnees admin dans le HTML initial. Les modules admin/publication sont presents et routables, mais aucun login admin sandbox reel ni ecriture sandbox n'a ete execute sans validation explicite.
- Les gains SSR sont etablis sur le HTML initial/SEO produit et sur une mesure runtime locale. Les lags galerie/mobile doivent encore etre confirmes par traces plus longues sur vrais appareils si une decision de migration est prise.
- Le build Next affiche `Environments: .env.production` parce que Next detecte le fichier present, mais les scripts `dev/build/start` chargent explicitement `.env.sandbox` par defaut via `scripts/with-env.mjs`.
