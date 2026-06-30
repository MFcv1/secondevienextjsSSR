# Audit Next SSR / residus SPA legacy - 2026-06-09

Audit historique realise avec l'ancien playbook local Next SSR, supprime depuis la migration Next native.

## Resume

Le gros du detail produit est bien migre: la route `/produit/[slugOrId]` est Next native, avec SSR/SSG, metadata, JSON-LD et iles client bornees. Le vieux detail produit SPA a ete supprime.

Les residus publics principaux ne sont plus sur produit. Ils sont maintenant concentres sur:

1. la galerie, encore montee via `ClientApp` depuis `HomeGalleryLauncher`;
2. les categories, qui ont une route SSR mais peuvent encore etre affichees par la SPA en navigation interne;
3. `/a-propos`, qui a un fallback SSR mais remonte encore `ClientApp defer`;
4. quelques nettoyages secondaires de navigation/analytics autour des anciennes vues SPA.

Les tunnels prives `/admin`, `/checkout`, `/wishlist`, `/mes-commandes` importent encore `ClientApp`, mais ils sont `robots: noindex` et ne sont pas des priorites SEO publiques.

## Routes App Router

| Route | Statut | Preuve | Decision |
| --- | --- | --- | --- |
| `/produit/[slugOrId]` | Conforme standard produit | `app/produit/[slugOrId]/page.jsx` utilise `ProductDetailServerView`, `generateMetadata`, `generateStaticParams`, `revalidate=300` | Garder comme reference |
| `/devis` | Route native, sans `ClientApp` | `app/devis/page.jsx` rend `QuoteRequestView`, metadata, JSON-LD | Conforme structurellement; eventuel split serveur/ile plus tard |
| `/categorie/[categoryId]` | SSR direct OK, mais double chemin SPA encore actif | `app/categorie/[categoryId]/page.jsx` existe, mais `src/app.jsx` et `src/Router.jsx` gardent `view === 'category'` et `CategoryPage` | A corriger en priorite |
| `/` | Home SSR OK, galerie encore SPA | `app/page.jsx` rend `HomeGalleryLauncher`, qui monte `<ClientApp />` | Migration galerie native a planifier |
| `/a-propos` | Hybride SSR + SPA | `app/a-propos/page.jsx` rend un fallback SSR puis `<ClientApp defer />` | Supprimer `ClientApp` apres transposition UI finale |
| `/wishlist` | Tunnel client noindex | `app/wishlist/page.jsx` retourne `<ClientApp />` | Peut rester temporairement; non SEO |
| `/checkout` | Tunnel client noindex | `app/checkout/page.jsx` retourne `<ClientApp />` | Peut rester temporairement; non SEO |
| `/mes-commandes` | Tunnel client noindex | `app/mes-commandes/page.jsx` retourne `<ClientApp />` | Peut rester temporairement; non SEO |
| `/admin` | Tunnel client noindex | `app/admin/page.jsx` retourne `<ClientApp />` | Peut rester temporairement; prive |

## Findings detailles

### P0 - Galerie publique encore SPA

Preuves:

- `app/page.jsx` importe `HomeGalleryLauncher`.
- `app/HomeGalleryLauncher.jsx` importe `ClientApp`.
- `app/HomeGalleryLauncher.jsx` monte `<ClientApp />` dans `.sv-gallery-launcher-overlay`.
- `app/ClientApp.jsx` fait `dynamic(() => import('../src/app.jsx'), { ssr: false })`.
- `src/Router.jsx` rend encore `GalleryView`.
- `src/app.jsx` gere encore `view='gallery'`, `?page=gallery`, `#gallery`, `marketplace-gallery-shell`, catalogue public client et header/menu/panier globaux.

Impact:

- La galerie n'est pas encore une surface Next SSR native.
- Un utilisateur qui entre par la home SSR puis ouvre la galerie bascule dans le shell SPA.
- Les comportements "arrivee par navigation" vs "refresh direct" restent difficiles a prouver sans gate dedie galerie.

Correction attendue:

- Transposer l'UI de `GalleryView` / `MarketplaceLayout` en route Next native ou en experience native sur `/` selon la strategie URL retenue.
- Garder exactement l'identite visuelle et les sections existantes.
- Lire les produits cote serveur pour le premier rendu.
- Isoler les interactions en iles client: filtres, recherche, wishlist, panier, menu, sections basses animees.
- Remplacer les ouvertures produit/categorie/devis par des liens stables.
- Ajouter un gate `scripts/audit-gallery-direct.mjs`.
- Supprimer ensuite le rendu galerie de `src/Router.jsx` et la logique galerie publique de `src/app.jsx`.

### P1 - Categories: double chemin SSR + SPA

Preuves:

- Route SSR existante: `app/categorie/[categoryId]/page.jsx`.
- Chemin SPA encore actif:
  - `src/app.jsx` initialise `view='category'` depuis `extractCategoryIdFromPath`.
  - `src/app.jsx` synchronise `view === 'category'` vers l'URL categorie.
  - `src/Router.jsx` importe et rend `CategoryPage`.
  - `GlobalMenu` et le header peuvent encore naviguer par `setView('category')`.

Impact:

- Navigation interne categorie peut afficher `src/kit/marketplace/CategoryPage.jsx`.
- Refresh direct `/categorie/...` affiche la route SSR `app/categorie/[categoryId]/page.jsx`.
- C'est une divergence typique du probleme recherche.

Correction attendue:

- Faire de `/categorie/[categoryId]` l'unique affichage categorie.
- Remplacer les callbacks `onNavigateCategory` publics par navigation `Link`/`window.location.assign(getCategoryUrl(id))` selon contexte.
- Retirer `CategoryPage` de `src/Router.jsx`.
- Retirer `view='category'`, `activeCategoryId` URL routing public et `requestCategoryCatalog` de `src/app.jsx` si plus utilise par tunnels prives.
- Nettoyer les props `onSelectItem` / `onPrefetchItem` devenues inertes dans `ProductSections` si elles ne servent plus.
- Ajouter un gate direct categorie: absence de `data-sv-client-hydrated`, presence `data-ssr-category`, absence galerie shell au refresh direct.

### P2 - `/a-propos`: fallback SSR plus ClientApp defer

Preuves:

- `app/a-propos/page.jsx` importe `ClientApp`.
- La page rend un `<main data-ssr-about>` puis `<ClientApp defer />`.
- `src/app.jsx` contient encore `ABOUT_PATH = '/a-propos'` et route `view='home'`.
- `src/Router.jsx` garde `HomeView` pour l'ancienne vitrine.

Impact:

- Le refresh direct a un contenu SSR, mais l'app legacy peut se monter apres idle ou interaction.
- Le contenu peut diverger entre fallback SSR et vitrine legacy.

Correction attendue:

- Decider l'UI source de reference: SSR actuel ou ancienne vitrine `src/vitrine/HomeView`.
- Transposer l'UI finale dans `app/a-propos/page.jsx` sans `ClientApp`.
- Supprimer `ABOUT_PATH` et `view='home'` du shell SPA si la home/vitrine legacy n'est plus necessaire.
- Ajouter un gate direct `/a-propos`.

### P3 - Tunnels client noindex

Routes:

- `/admin`
- `/checkout`
- `/wishlist`
- `/mes-commandes`

Preuves:

- Chaque `app/<route>/page.jsx` retourne `<ClientApp />`.
- Chaque route declare `robots: { index: false, follow: false }`.

Decision:

- Pas prioritaire SEO.
- Garder temporairement si le but immediat est la surface publique.
- A long terme, isoler chaque tunnel en ile/app client dediee au lieu de remonter tout `src/app.jsx`.

### P4 - Nettoyages secondaires

- `src/kit/layout/GlobalMenu.jsx` garde `detail` dans `isGalleryContext`; ce contexte n'existe plus dans la SPA.
- `src/kit/marketplace/GalleryView.jsx`, `ProductSections.jsx`, `ProductGridSection.jsx`, `CategoryPage.jsx` conservent des props `onSelectItem` / `onPrefetchItem`; certaines sont inertes car `ProductCard` navigue deja par `<a href={getProductUrl(item)}>`.
- `src/kit/shared/pageTaxonomy.js` ne contient plus `detail`, mais garde `devis` alors que `/devis` est maintenant route native; a verifier si analytics client doit encore tracker cette page.
- `src/app.jsx` garde des redirections hash `#devis` vers `/devis`; utile en compat, mais a supprimer quand tous les liens legacy sont convertis.

## Ordre de correction recommande

1. Categories: supprimer le double chemin SPA/SSR, impact contenu limite, gain direct sur divergence refresh.
2. `/a-propos`: retirer `ClientApp defer` et l'ancienne route vitrine si plus utile.
3. Galerie: migration la plus large; commencer par un gate audit galerie avant refactor.
4. Nettoyage `src/app.jsx` / `src/Router.jsx`: retirer les vues publiques restantes apres migration.
5. Tunnels prives: isoler plus tard si objectif bundle/proprete globale.

## Gates a creer

- `scripts/audit-category-direct.mjs`
- `scripts/audit-about-direct.mjs`
- `scripts/audit-gallery-direct.mjs`

Chaque gate doit verifier desktop/mobile:

- titre + H1;
- marker SSR attendu;
- absence de `data-sv-client-hydrated` si route native;
- absence de `marketplace-gallery-shell` quand la route n'est pas galerie;
- absence de chunks/assets non pertinents;
- liens produit/categorie/devis valides;
- screenshots optionnels si Playwright disponible.

## Commandes de preuve statique utiles

```powershell
rg -n "import ClientApp|<ClientApp" app
rg -n "view === 'category'|setView\\('category'\\)|CategoryPage" src app scripts
rg -n "HomeGalleryLauncher|sv-gallery-launcher-overlay|data-sv-force-gallery-entry|page\\)=gallery|#gallery" app src
rg -n "ProductDetail.jsx|ArchitecturalProductDetail|setView\\('detail'\\)" src app scripts
```
