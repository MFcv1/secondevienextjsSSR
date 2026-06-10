# Prompt /goal - architecture finale full Next SSR/SSG sans legacy SPA

```text
/goal Utilise le skill local nextjsssr et le playbook racine nextjsssr.md pour finaliser Seconde Vie en architecture 100% Next.js App Router.

Intention exacte:
- "Legacy" veut dire reference visuelle et comportementale uniquement: reprendre le design, les textes, les sections, les interactions attendues et le feeling existant.
- "Legacy" ne veut jamais dire garder le runtime SPA public, le routeur `src/Router.jsx`, le state machine `src/app.jsx`, `ClientApp`, hash routing, `setView`, ou un overlay SPA.
- Le standard cible est celui des fiches produit natives: page serveur App Router, data serveur, metadata/canonical/JSON-LD, HTML utile au refresh direct, et iles client courtes limitees a l'interaction.

Etat de depart probable:
- `/produit/[slugOrId]`, `/categorie/[categoryId]`, `/a-propos`, `/devis` et `/` ont deja une base Next native.
- `ClientApp` ne doit rester que provisoirement sur `/admin`, `/checkout`, `/wishlist`, `/mes-commandes`.
- La galerie n'importe plus `ClientApp`, mais elle est encore trop large: `app/GalleryShellIsland.jsx` reutilise `GalleryView/MarketplaceLayout` comme grande ile client.
- `src/app.jsx` et `src/Router.jsx` existent encore comme noyau SPA pour les tunnels prives et doivent disparaitre de l'architecture finale.

Objectif final non negociable:
1. Aucune route `app/**/page.jsx` n'importe `ClientApp`.
2. `app/ClientApp.jsx` est supprime.
3. `src/app.jsx` est supprime.
4. `src/Router.jsx` est supprime.
5. Aucun chemin actif ne contient `setView(...)`, `window.location.hash` comme routing, `NEXT_VIEW_PATHS`, `view === 'gallery'`, `view === 'checkout'`, `view === 'wishlist'`, `view === 'admin'`, ou reconstruction de page publique par SPA.
6. Les composants legacy reutilises deviennent des composants de presentation ou des iles route-specifiques, pas un shell global.
7. Les compatibilites data utiles, par exemple anciens IDs categorie ou anciens champs image, sont conservees tant qu'un backfill n'est pas fait.

Avant de coder:
- Lire `AGENTS.md`.
- Lire `nextjsssr.md`.
- Lire `NEXTJSSSR_LEGACY_AUDIT_2026-06-09.md`.
- Lire `NEXTJSSSR_FIX_PROMPT_2026-06-09.md`.
- Lire ce fichier.
- Lire `alertemobile.md` avant toute modification galerie/mobile/shell scroll.
- Lire `NEXTJS_OPTIMIZATION_ROADMAP.md` avant toute modification hydratation, cache, images, prefetch ou performance.

Architecture cible:

1. Routes publiques SEO
   - `/`: Server Component. Lit les produits publics cote serveur. Rend le HTML indexable de la home et les liens stables.
   - Galerie publique: Server Component ou sous-arbre serveur depuis `/`, pas une grande ile client. Creer un `GalleryServerView` qui rend les sections, categories, grilles et cartes produit en HTML serveur.
   - `/produit/[slugOrId]`: garder le modele actuel `ProductDetailServerView` + iles actions/media.
   - `/categorie/[categoryId]`: garder la route native, harmoniser les cartes avec les composants serveur de galerie si possible.
   - `/devis`: transformer `QuoteRequestView` en `QuoteRequestServerView` + `QuoteFormIsland` si le composant actuel reste trop client. Le formulaire peut etre client; le header, le contenu, les preuves metier et le JSON-LD restent serveur.
   - `/a-propos`: rester SSR natif, sans ClientApp.

2. Galerie finale
   - Remplacer `app/GalleryShellIsland.jsx` par un decoupage:
     - `src/kit/marketplace/GalleryServerView.jsx`: Server Component, aucun `use client`, aucun `window`, aucun `localStorage`, aucune lecture Firebase client.
     - `src/kit/marketplace/GalleryProductCardServer.jsx`: carte produit serveur avec `<a href={getProductUrl(item)}>` et images deja resolues.
     - `src/kit/marketplace/GalleryControlsIsland.jsx`: filtres, recherche, tri, accordions ou etat UI local.
     - `src/kit/marketplace/GalleryMobileShellIsland.jsx`: uniquement scroll lock mobile, hauteur viewport, gestures strictement necessaires, et classes `marketplace-gallery-shell` / `marketplace-gallery-scroll` si elles restent necessaires.
     - `src/kit/marketplace/GalleryMenuIsland.jsx`: menu, dark mode, ouverture panier/wishlist si besoin.
     - `src/kit/marketplace/CartIsland.jsx` et `WishlistIsland.jsx`: interactions locales, pas de routing global.
   - Les sections basses peuvent etre server-rendered puis animees par de petites iles si necessaire.
   - Les produits, categories et devis naviguent par `Link` ou `<a href>`, jamais par `setView`.
   - Le premier rendu galerie doit etre utile sans JavaScript: titres, categories, cartes produit et liens visibles dans le HTML.
   - Les iles client recoivent des props serialisables, jamais un catalogue a refetcher en client pour le rendu initial.

3. Tunnels non SEO, mais sans ClientApp
   - `/checkout`: creer `app/checkout/page.jsx` + `CheckoutPageIsland` qui reutilise `CheckoutView` ou ses sous-composants, sans passer par `src/app.jsx`.
   - `/wishlist`: creer `WishlistPageIsland`, reutiliser `WishlistView`, liens produits natifs.
   - `/mes-commandes`: creer `OrdersPageIsland`, reutiliser `MyOrdersView`.
   - `/admin`: creer `AdminAppIsland` route-specifique. Il peut rester client et force-dynamic, mais ne doit pas monter `ClientApp`, `src/app.jsx` ou `Router.jsx`.
   - Ces routes restent `robots: { index:false, follow:false }`.

4. Suppression legacy
   - Supprimer `app/ClientApp.jsx`.
   - Supprimer `src/app.jsx`.
   - Supprimer `src/Router.jsx`.
   - Supprimer les composants devenus uniquement routeur SPA.
   - Supprimer `HomeGalleryLauncher` si la galerie devient directement native ou le reduire a une ile d'ouverture sans shell legacy.
   - Nettoyer `GlobalMenu`: plus de prop `setView`; remplacer par liens/actions route-specifiques.
   - Nettoyer `Footer`: remplacer `#gallery`, `#login`, `#` publics par URLs reelles ou boutons non liens.
   - Nettoyer `ProductCard`, `ProductGridSection`, `ProductSections`: retirer `onSelectItem` / `onPrefetchItem` si les cartes sont des liens natifs.

Ordre de travail conseille:

Phase 1 - Inventaire strict
- Lancer `rg` sur:
  - `ClientApp|src/app.jsx|src/Router.jsx|setView\\(|window.location.hash|location.hash|NEXT_VIEW_PATHS`
  - `view ===|view !==|goToView\\(|onNavigateCategory|onSelectItem|onPrefetchItem`
  - `import ClientApp|<ClientApp|data-sv-client-hydrated`
- Classer chaque hit: a supprimer, a transformer en ile, ou compat data a conserver.

Phase 2 - Galerie serveur
- Construire `GalleryServerView` en copiant le markup/classes de `GalleryView/MarketplaceLayout`.
- Lire le catalogue cote serveur dans `app/page.jsx` ou une lib serveur dediee.
- Rendre les cartes et liens produit/categorie en HTML serveur.
- Extraire uniquement les comportements interactifs en iles.
- Supprimer `GalleryShellIsland` quand le rendu serveur + iles couvre le meme design.

Phase 3 - Devis split serveur/ile
- Si `QuoteRequestView` reste un gros client component, extraire le contenu statique dans `QuoteRequestServerView`.
- Garder le formulaire, validation, upload, mailto ou submit dans `QuoteFormIsland`.

Phase 4 - Tunnels sans ClientApp
- Remplacer chaque route noindex par une ile dediee.
- Ne pas chercher a rendre admin/checkout SEO; le but est seulement d'eliminer le shell SPA global.

Phase 5 - Suppression finale
- Supprimer `ClientApp`, `src/app.jsx`, `src/Router.jsx`.
- Corriger tous les imports cassés.
- Supprimer les props et helpers de navigation SPA devenus orphelins.
- Mettre a jour `AGENTS.md` code map si fichiers crees/supprimes.

Contraintes de code:
- Ne pas redesigner.
- Ne pas ajouter un deuxieme header pour masquer un probleme.
- Ne pas empiler SSR + SPA.
- Ne pas garder deux versions actives de la meme surface.
- Ne pas reintroduire `ProductDetail.jsx`, `ArchitecturalProductDetail.jsx`, `setView('detail')`, `CategoryPage` SPA ou `HomeView`.
- Ne pas supprimer les compatibilites data sans backfill.
- Pas de deploiement sans demande explicite.

Gates minimum, volontairement courts:
- `npm run lint`
- `npm run build`
- `npm run perf:budget`
- `npm run perf:product-direct -- --assert`
- `npm run perf:category-direct -- --assert`
- `npm run perf:about-direct -- --assert`
- `npm run perf:gallery-direct -- --assert`
- `npm run mobile:contract` seulement si galerie/mobile/shell/Router historique touche encore a l'invariant mobile avant suppression complete.

Preuves finales obligatoires:
- `rg -n "import ClientApp|<ClientApp|app/ClientApp|src/app.jsx|src/Router.jsx" app src scripts` ne montre aucun chemin actif attendu.
- `rg -n "setView\\(|window.location.hash|location.hash|NEXT_VIEW_PATHS|view ===|view !==" app src scripts` ne montre aucun routing SPA actif.
- `rg -n "ProductDetail.jsx|ArchitecturalProductDetail|setView\\('detail'\\)|CategoryPage|HomeView" app src scripts` ne montre aucun residu actif.
- Pour `/`, `/?page=gallery`, `/produit/...`, `/categorie/...`, `/devis`, `/a-propos`: refresh direct coherent, HTML utile present, pas de `data-sv-client-hydrated`.
- Pour `/admin`, `/checkout`, `/wishlist`, `/mes-commandes`: pas de `ClientApp`, toujours noindex.

Definition de "parfait" pour cette passe:
- Le design visible reste celui de Seconde Vie.
- Le site ne depend plus du runtime SPA global.
- Les routes publiques sont SSR/SSG natives.
- Les routes privees sont des iles client dediees, pas un routeur SPA.
- Les vieux fichiers de shell SPA sont supprimes.
```

