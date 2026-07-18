# Architecture Next.js et SEO

Derniere mise a jour: 2026-07-14
Statut: `REFERENCE_ACTIVE`

## 1. Decision d'architecture

Le site public est une application Next.js App Router native. La migration depuis l'ancienne SPA globale est terminee. Les pages publiques doivent livrer leur contenu final depuis le serveur; les composants client sont reserves aux interactions qui en ont besoin.

Interdictions structurelles:

- ne pas recreer `ClientApp`, `src/app.jsx`, `src/Router.jsx`, `setView` ou un routeur par hash;
- ne pas transformer une page publique en grosse ile client qui remplace un faux rendu provisoire;
- ne pas appeler `cookies()`, `headers()`, `draftMode()` ou des `searchParams` serveur sur les pages publiques statiques;
- ne pas dupliquer la logique de canonical, d'indexabilite ou de taxonomie dans plusieurs composants;
- ne pas faire dependre le HTML indexable de Firebase Auth, App Check ou du navigateur.

## 2. Contrat des routes

| Route | Rendu | Cache | Indexation | Implementation principale |
| --- | --- | --- | --- | --- |
| `/` | statique | ISR 300 s | canonical `/` | `app/page.jsx`, `GalleryRoutePage` |
| `/galerie` | statique | ISR 300 s | canonical `/` | `app/galerie/page.jsx` |
| `/categorie/[categoryId]` | SSG + fallback | ISR 300 s | conditionnelle | `CategoryServerView`, `generateStaticParams` |
| `/produit/[slugOrId]` | SSG + fallback | ISR 300 s | conditionnelle | `ProductDetailServerView`, `generateStaticParams` |
| `/a-propos` | serveur statique | ISR 300 s | canonical propre | `AboutServerView` |
| `/devis` | serveur statique | ISR 300 s | canonical propre | `QuoteRequestServerView` |
| `/recherche` | serveur + ile client | ISR 300 s | `noindex,follow` | `SearchResultsIsland` |
| `/wishlist` | dynamique | sans cache public | `noindex,nofollow` | `WishlistPageIsland` |
| `/checkout` | dynamique | sans cache public | `noindex,nofollow` | `CheckoutPageIsland` |
| `/mes-commandes` | dynamique | sans cache public | `noindex,nofollow` | `OrdersPageIsland` |
| `/admin` | dynamique | sans cache public | `noindex,nofollow` | `AdminAppIsland` |
| `/api/search` | dynamique | cache HTTP borne | non indexable | recherche catalogue serveur |
| `/api/revalidate-catalog` | dynamique | aucun | non indexable | revalidation admin authentifiee |

La source executable de cette classification est verifiee par `npm run next:routes`.

## 3. Galerie canonique

`/` est la home et la galerie canonique. `/galerie` reste un alias compatible pour les anciens liens et doit annoncer `/` comme canonical.

La galerie doit:

- rendre le hero, les categories, les cartes initiales et les sections fixes dans le HTML serveur;
- conserver un layout stable avant hydratation;
- n'utiliser les iles que pour filtres, wishlist, panier, menu, motion et contenus interactifs;
- partager les memes donnees et metadata entre `/` et `/galerie`;
- eviter toute divergence visuelle entre rendu serveur et client.

## 4. Catalogue serveur et cache

Le catalogue public est lu par `src/lib/server/products.js` depuis le snapshot Storage valide par `materializedCatalog.js`. Aucun lecteur public Firestore ou Function catalogue parallele ne subsiste.

Le cache repose sur:

- ISR Next a 300 secondes pour les routes publiques;
- les pointeurs Storage `current`, `previous` et `last-known-good`;
- `/api/revalidate-catalog` pour revalider tags et chemins apres mutation admin;
- le trigger `onCatalogSourceWrite` et la task de revalidation signee.

Flux attendu:

```text
mutation admin
  -> ecriture Firestore
  -> build et publication du snapshot
  -> appel signe HMAC /api/revalidate-catalog
  -> revalidateTag/revalidatePath
  -> nouvelles pages ISR + nouveau sitemap
```

Ne pas introduire une purge globale anonyme ou un secret de revalidation dans une variable `NEXT_PUBLIC_*`.

## 5. SEO

Les metadata globales vivent dans `app/layout.jsx`; les metadata produit/categorie sont calculees au niveau de la route. Les helpers SEO sont dans `src/lib/seo` et `src/kit/marketplace/seoCopy.js`.

Contrat SEO:

- un seul canonical par contenu;
- produits et categories indexables uniquement si les donnees minimales sont publiees et coherentes;
- `/recherche` et les tunnels personnels restent hors index;
- `app/sitemap.js` ne publie que les routes indexables;
- `app/robots.js` doit rester coherent avec les metadata des routes;
- les pages produit utilisent Product/Offer/Breadcrumb JSON-LD;
- les categories utilisent CollectionPage/ItemList/Breadcrumb;
- `/a-propos` utilise LocalBusiness/AboutPage/FAQ;
- `/devis` utilise Service;
- les champs admin `seoTitle`, `seoDescription` et `seoIndexable` pilotent l'intention, mais les garde-fous de `src/lib/seo/indexability.js` gardent le dernier mot.

## 6. Transitions de route

`app/RouteTransitionIsland.jsx` gere l'habillage global des navigations. Une transition ne doit jamais afficher la galerie comme etape intermediaire d'une route privee ou d'une page publique.

Pour les liens critiques:

- utiliser la navigation Next native;
- precharger au survol/focus quand cela apporte un gain mesure;
- fermer le menu sans attendre Firebase ou un import lourd;
- ne pas masquer une navigation lente avec un faux changement d'URL.

## 7. Fichiers structurants

```text
app/layout.jsx
app/page.jsx
app/galerie/page.jsx
app/categorie/[categoryId]/page.jsx
app/produit/[slugOrId]/page.jsx
app/a-propos/page.jsx
app/devis/page.jsx
app/recherche/page.jsx
app/sitemap.js
app/robots.js
app/api/search/route.js
app/api/revalidate-catalog/route.js
src/lib/server/products.js
src/lib/server/about.js
src/lib/server/galleryPersonalization.js
src/lib/seo/*
src/kit/marketplace/*Server*.jsx
```

## 8. Dettes controlees

| Dette | Statut | Condition de reprise |
| --- | --- | --- |
| image OG finale | `SURVEILLANCE` | `public/og-image.jpg` existe; verifier son rendu et la remplacer par l'asset de marque final au cutover |
| migration Next 16/Turbopack | `PRODUCTION_DEFERRED` | branche dediee apres stabilisation fonctionnelle, jamais pendant un patch metier |
| budget JS/CSS public | `DEBT` | traiter dans une passe performance avec mesures avant/apres |

## 9. Gates

Validation minimale apres changement structurel:

```bash
npm run seo:surface
npm run next:routes
npm run build
```

Ajouter selon les routes touchees:

```bash
npm run perf:gallery-direct
npm run perf:category-direct
npm run perf:product-direct
npm run perf:about-direct
npm run perf:quote-direct
```
