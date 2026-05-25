# Product page Next migration report

Date: 2026-05-25

## Objectif

Sortir la route publique `/produit/[slugOrId]` du montage SPA legacy afin que l'ouverture directe d'un meuble charge d'abord la fiche produit, ses images et son UI utile, sans hero galerie, categories galerie, footer differe ni shell marketplace invisible.

## Baseline avant migration

Mesure locale production, cache desactive, CPU x4, route `/produit/buffet-KrTETXPknYNwgak66T8p`.

| Mode | Requetes | Total | JS | Images | Evidence legacy |
| --- | ---: | ---: | ---: | ---: | --- |
| Desktop direct | 45 | 2084 kB | 1233 kB | 382 kB | `data-sv-client-hydrated=true`, `.marketplace-gallery-shell`, 10 assets galerie/home |
| Mobile direct | 51 | 2154 kB | 1238 kB | 390 kB | `data-sv-client-hydrated=true`, `.marketplace-gallery-scroll`, 10 assets galerie/home |

Problemes observes:

- `<ClientApp defer />` finissait par importer `src/app.jsx`.
- La page directe chargeait le shell galerie, le hero et les categories alors qu'ils etaient invisibles.
- Mobile direct demandait `large` et `medium` pour le slot actif avant toute intention forte.

## Migration appliquee

- `app/produit/[slugOrId]/page.jsx` ne monte plus `<ClientApp defer />`.
- La route garde les donnees serveur: metadata, canonical, JSON-LD Product/Breadcrumb, HTML SSR et `generateStaticParams`.
- Nouvelle ile client autonome: `src/kit/marketplace/ProductPageExperience.jsx`.
- Le payload client est projete cote serveur: champs produit utiles + variantes image, au lieu de passer le document complet a la SPA.
- Le parcours galerie -> detail legacy reste dans `src/Router.jsx` et `ArchitecturalProductDetail.jsx`; il n'a pas ete remplace dans cette passe.

## UX produit autonome

Desktop:

- grand visuel central;
- flou de fond conserve via `thumb`;
- rail de miniatures;
- fiche produit premium a droite;
- lightbox sur clic image, qui est le premier moment ou `full/large` devient autorise.

Mobile direct:

- shell produit plein ecran autonome;
- image stable dans les wrappers existants `.product-detail-mobile-image-frame` / `.product-detail-mobile-image-clip`;
- miniatures horizontales;
- swipe horizontal image;
- swipe vertical ou bouton Details pour ouvrir le panneau bas;
- panneau bas scrollable avec informations, reservation et favori local.

Le retour galerie direct reste un lien vers `/`. La transition overlay depuis la galerie reste legacy pour eviter de casser le scroll interne valide.

## Pipeline images

- Image visible initiale: `medium`.
- Desktop DPR1 1440px: pas de `large`.
- Upgrade `large` uniquement apres hydration si la largeur effective/DPR le justifie.
- Flou desktop: `thumb` uniquement.
- Miniatures: `thumb`.
- Voisines: preload `medium` apres premier paint/idle, autour de l'image active.
- Lightbox/zoom: `full` puis fallback `large`.

## Resultats apres migration

Mesure `npm run perf:product-direct`, production locale `http://127.0.0.1:4300`, cache desactive, CPU x4.

| Mode | Requetes | Total | JS | Images | Image ready | Variantes | Evidence |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Desktop direct | 30 | 1387 kB | 400 kB | 472 kB | 838 ms | `thumb` + `medium` | 0 asset galerie/home, 0 legacy SPA, backdrop thumb OK |
| Mobile direct | 31 | 1457 kB | 400 kB | 542 kB | 725 ms | `thumb` + `medium` | 0 asset galerie/home, 0 legacy SPA, swipe image + sheet Details OK |

Mesure `perf:architecture` apres migration:

- Produit Next local: 29 requetes, 1323 kB total, 400 kB JS, 408 kB images, LCP 620 ms, CLS 0.
- Produit SPA sandbox: 94 requetes, 7339 kB total, 874 kB JS, 6285 kB images.

Le poids image direct augmente legerement dans `perf:product-direct` par rapport a la baseline locale car la nouvelle page precharge volontairement les miniatures et voisines `medium`, et l'audit mobile exerce maintenant un swipe vers l'image suivante. Le gain principal est la suppression du JS SPA et des assets galerie/home.

## Gates executees

```powershell
npm run lint
npm run build
npm run mobile:contract
npm run perf:budget
npm run perf:product-direct
npm run perf:product-images
$env:NEXT_BASE_URL='http://127.0.0.1:4300'; $env:COLD_PRODUCT_PATH='/produit/buffet-KrTETXPknYNwgak66T8p'; npm run perf:architecture
```

`npm run seo:check` a ete tente avec `NEXT_SSR_CHECK_BASE_URL=http://127.0.0.1:4300`, mais il echoue encore sur la home avec `Missing SSR evidence for home ... image`. Cette verification est hors surface produit et n'a pas ete modifiee par cette migration.

## Risques restants

- Le vrai mobile Android n'a pas ete valide pendant cette passe. Le contrat statique mobile passe et l'audit Playwright mobile direct passe, mais `adb devices -l` echoue localement car `adb` n'est pas disponible dans le `PATH`; le test appareil reel reste a refaire quand ADB/appareil seront accessibles.
- Le panier/auth/wishlist Firebase restent legacy. La page produit autonome expose un favori local leger et une reservation via `/devis`; elle ne tente pas de remonter tout Auth/Firestore.
- Le parcours galerie -> detail reste legacy. Une prochaine passe pourra remplacer le clic galerie par navigation Next en restaurant le scroll galerie via `history.state` / `sessionStorage`, mais ce n'etait pas necessaire pour sortir la page produit directe de la SPA.
