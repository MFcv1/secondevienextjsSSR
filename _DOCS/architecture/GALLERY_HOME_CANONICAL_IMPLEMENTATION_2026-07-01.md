# Galerie Home Canonique - implementation

Date: 2026-07-01

## Decision

La galerie est maintenant la home canonique du site.

- `/` affiche directement la galerie.
- `/` reste `force-static` avec ISR `revalidate = 300`.
- `/galerie` reste disponible comme alias compatible pour les anciens liens et les audits, mais son canonical pointe vers `/`.
- Les liens internes principaux doivent pointer vers `/` ou vers les ancres `/#gallery-pieces` et `/#gallery-small-prices`.
- Ne pas remettre une redirection permanente de `/` vers `/galerie`.

## Pourquoi

Si la galerie est la page d'accueil produit, l'URL la plus propre pour l'utilisateur et le SEO est le domaine racine: `secondevie.fr`.

Le choix evite:

- une entree utilisateur qui tape le domaine puis voit l'URL changer;
- une home artificielle qui ne sert qu'a rediriger;
- une duplication SEO non controlee entre `/` et `/galerie`.

La compatibilite `/galerie` est conservee pour ne pas casser les favoris, liens externes, scripts et historiques.

## Implementation faite

### Routing

- `app/page.jsx` rend la galerie directement.
- `app/galerie/page.jsx` rend le meme composant que `/`.
- `src/kit/marketplace/GalleryRoutePage.jsx` factorise le rendu serveur galerie, les metadata, le JSON-LD et le script de retour produit.
- `middleware.js` ne redirige plus `/` vers `/galerie`.
- `middleware.js` nettoie seulement l'ancien `/?page=gallery` vers `/`.

### SEO

- Le canonical galerie est `/`.
- Le sitemap expose `/` comme entree galerie principale.
- `/galerie` conserve le rendu mais canonicalise vers `/`.
- Le JSON-LD `CollectionPage`, `BreadcrumbList` et `ItemList` utilise l'URL canonique `/`.

### Liens internes

Les retours et navigations publiques principales ont ete alignees vers `/`:

- menu mobile;
- mega menu;
- header public;
- footer;
- page categorie;
- detail produit;
- wishlist;
- checkout;
- commandes;
- admin "retour au site";
- page a-propos;
- page devis via les audits.

Les ancres galerie utilisent maintenant:

- `/#gallery-pieces`;
- `/#gallery-small-prices`.

### Cache et revalidation

`app/api/revalidate-catalog/route.js` revalide les deux chemins:

- `/`;
- `/galerie`.

Cela garde la home canonique et l'alias synchronises apres mise a jour catalogue.

### Gates et scripts

Les gates ont ete adaptes au nouveau contrat:

- `scripts/check-next-route-classification.cjs` attend maintenant un artifact statique `.next/server/app/index.html`.
- `scripts/audit-gallery-direct.mjs` verifie que `/` repond 200 directement et que `/galerie` canonicalise vers `/`.
- `scripts/audit-about-direct.mjs` et `scripts/audit-quote-direct.mjs` reconnaissent les liens galerie vers `/`.
- `scripts/check-performance-budget.cjs` renomme le budget racine en `root gallery home route`.
- Les E2E qui ouvrent la galerie privilegient `/`.
- `scripts/audit-product-page-direct.mjs` a ete stabilise pour attendre la fermeture effective de la lightbox et accepter les etats produit non achetables visibles.

## Validations lancees

Resultats de la passe:

```bash
npm run lint
npm run build
npm run next:routes
npm run mobile:contract
npm run perf:gallery-direct
npm run perf:about-direct
npm run perf:quote-direct
npm run perf:category-direct
npm run perf:product-direct
npm run perf:budget
```

Passes:

- `lint`: OK
- `build`: OK
- `next:routes`: OK
- `mobile:contract`: OK
- `perf:gallery-direct`: OK
- `perf:about-direct`: OK
- `perf:quote-direct`: OK
- `perf:category-direct`: OK
- `perf:product-direct`: OK

`perf:budget` reste rouge hors galerie:

- `/` galerie: OK JS/CSS;
- `/galerie`: OK JS/CSS;
- echecs restants: categorie JS, a-propos JS/CSS, devis JS, admin JS.

Ces echecs ne doivent pas etre corriges pendant une passe routing/home galerie sauf demande explicite.

## Invariants a conserver

- Ne pas recreer une home SPA.
- Ne pas reintroduire `ClientApp`, `src/app.jsx`, `src/Router.jsx`, `setView` ou un routing hash.
- Ne pas utiliser `cookies()`, `headers()`, `draftMode()` ou `searchParams` serveur sur `/` ou `/galerie`.
- Ne pas remplacer les sections fixes galerie SSR par une grosse ile client.
- Ne pas supprimer `/galerie` sans decision SEO explicite et plan de redirection.
- Toute modification mobile galerie doit relire `alertemobile.md`.

## Fichiers clefs

- `app/page.jsx`
- `app/galerie/page.jsx`
- `src/kit/marketplace/GalleryRoutePage.jsx`
- `src/kit/marketplace/GalleryServerView.jsx`
- `app/GalleryMobileShellIsland.jsx`
- `middleware.js`
- `app/sitemap.js`
- `scripts/check-next-route-classification.cjs`
- `scripts/audit-gallery-direct.mjs`
- `NEXT_NATIVE_ARCHITECTURE_BASELINE.md`
- `context.md`
- `mapV2.md`
