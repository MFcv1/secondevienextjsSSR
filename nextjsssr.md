# Agent Next.js SSR - Audit et migration anti-legacy SPA

Date de creation: 2026-06-09

Ce document est le playbook specialise pour transformer Seconde Vie en architecture Next.js App Router SSR/SSG, sans changer l'UI existante. Il doit etre lu avant toute passe qui touche une route publique, la galerie, les categories, les pages produit, les pages devis, le SEO, `ClientApp`, `src/app.jsx`, `src/Router.jsx`, ou les anciens chemins SPA.

Objectif: detecter les divergences entre navigation client et refresh direct, supprimer les residus SPA inutiles, et porter les surfaces publiques vers le standard deja atteint par les fiches produit Next natives.

## Sources techniques de reference

Verifier les docs officielles si une regle Next semble avoir change:

- Server/Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Fetching data in App Router: https://nextjs.org/docs/app/getting-started/fetching-data
- Metadata / `generateMetadata`: https://nextjs.org/docs/15/app/api-reference/functions/generate-metadata
- `generateStaticParams`: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
- Caching / revalidation: https://nextjs.org/docs/app/getting-started/caching

Regles Next a retenir:

- Dans App Router, les pages et layouts sont Server Components par defaut. Ajouter `"use client"` seulement pour interaction, etat navigateur, effets, events, `window`, `document`, panier, favoris, lightbox, filtres instantanes ou auth client.
- Les donnees publiques SEO doivent etre lues cote serveur dans `app/.../page.jsx`, `generateMetadata`, `generateStaticParams`, ou une lib `server-only`.
- `generateMetadata` doit produire title, description, canonical, OG/Twitter, et peut partager les fetchs memoises avec la page.
- Les routes catalogue/produit/categorie peuvent utiliser `generateStaticParams` + `revalidate` quand le contenu est public et cacheable.
- La revalidation doit etre explicite apres mutation admin: `revalidatePath`, `revalidateTag`, ou endpoint interne existant selon l'architecture du repo.

## Definition du standard cible

Une route publique est conforme si:

- le refresh direct affiche la meme experience que l'arrivee par navigation interne;
- le HTML initial contient le contenu metier indexable utile: H1, texte, images principales, liens, prix si applicable, JSON-LD si pertinent;
- la route vit dans `app/.../page.jsx` comme page Next native;
- le server component est l'autorite du contenu;
- les iles client ne portent que l'interaction;
- la navigation publique utilise de vrais liens (`Link` ou `a href`) vers des URLs stables;
- aucun `setView(...)`, hash route, overlay SPA ou `ClientApp` n'est necessaire pour afficher le contenu public;
- un audit Playwright prouve l'absence de shell SPA au refresh direct quand la route est censee etre SSR native.

Le modele de reference actuel est la fiche produit:

- `app/produit/[slugOrId]/page.jsx`
- `src/kit/marketplace/ProductDetailServerView.jsx`
- `src/kit/marketplace/ProductDetailShellIsland.jsx`
- `src/kit/marketplace/ProductDetailActionsIsland.jsx`
- gate: `npm run perf:product-direct -- --assert`

## Vocabulaire de diagnostic

- Route Next native: route `app/.../page.jsx` qui rend le contenu public sans passer par `ClientApp`.
- Ile client: petit composant `"use client"` appele par une page serveur pour une interaction bornee.
- Tunnel client prive: route admin/checkout/compte qui peut encore monter `ClientApp` si elle n'est pas une cible SEO publique.
- Residus SPA: code qui existe seulement pour reconstruire une page publique via `src/app.jsx`, `src/Router.jsx`, `setView`, hash, overlay, `useEffect` data fetch, ou lazy import legacy.
- Divergence refresh: l'UI ou le header change entre navigation interne et refresh direct.

## Triage des routes

Classer chaque route avant de modifier:

1. Public SEO prioritaire: `/`, `/produit/...`, `/categorie/...`, `/devis`, futures pages galerie/indexables. Doit tendre vers Next SSR/SSG natif.
2. Public non encore migre: peut temporairement utiliser un bridge, mais doit avoir un ticket de migration et un gate de divergence.
3. Prive / tunnel compte: `/admin`, `/checkout`, `/wishlist`, `/mes-commandes`. Peut rester client si SEO inutile, mais ne doit pas contaminer les routes publiques.
4. Legacy data compatibility: valeurs historiques en base (`legacy category ids`, anciens champs image). A conserver si necessaire aux donnees, mais ne pas confondre avec legacy SPA UI.

## Audit complet anti-SPA

Toujours commencer par un inventaire statique:

```powershell
rg -n "ClientApp|src/app.jsx|src/Router.jsx|setView\\(|window\\.location\\.hash|location\\.hash|React\\.lazy|Suspense|useEffect\\(.*fetch|onSelectItem|onPrefetchItem" app src scripts
rg -n "view ===|view !==|hash ===|NEXT_VIEW_PATHS|extract.*FromPath|selected.*Id|pending.*Link|ensure.*Detail|legacy SPA|SPA marker" src app scripts
rg -n "import ClientApp|<ClientApp|data-sv-client-hydrated|marketplace-gallery-shell|marketplace-gallery-scroll" app src scripts
rg -n "generateMetadata|generateStaticParams|revalidate|jsonLd|application/ld\\+json|canonical|alternates" app src
```

Puis cartographier:

- quelles routes `app/.../page.jsx` importent `ClientApp`;
- quelles vues publiques existent encore dans `src/Router.jsx`;
- quels composants publics fetchent leurs donnees en client;
- quels boutons publics naviguent par `setView`, hash, ou `window.location.assign`;
- quels composants existent uniquement pour un overlay SPA;
- quels scripts de gate couvrent ou ne couvrent pas la route.

## Audit dynamique divergence arrivee vs refresh

Pour chaque URL publique candidate:

1. Ouvrir la route par navigation interne depuis le site.
2. Capturer screenshot, DOM markers, URL, titre, H1, header, scroll root, assets reseau.
3. Recharger directement la meme URL.
4. Comparer les memes signaux.
5. Toute difference visible ou structurelle est une anomalie, meme si "ca marche".

Markers a verifier:

- `document.title`
- `h1`
- canonical
- JSON-LD
- presence de `data-sv-client-hydrated`
- presence de `marketplace-gallery-shell` et `marketplace-gallery-scroll`
- nombre de cartes produit visibles
- header/nav visible
- requetes images hero/galerie
- chunks client charges avant interaction

Si un gate n'existe pas, en creer un dans `scripts/audit-<route>-direct.mjs` sur le modele de `scripts/audit-product-page-direct.mjs`.

## Decision par cas

### Cas A - Route publique importe `ClientApp`

Symptome: `app/<route>/page.jsx` contient `import ClientApp`.

Action:

- si route SEO publique: remplacer par une page serveur native;
- copier l'UI existante depuis le composant SPA, sans redesign;
- extraire uniquement les interactions en iles client;
- retirer la vue correspondante de `src/Router.jsx` et `src/app.jsx`;
- remplacer la navigation interne par `Link`/`a href`;
- ajouter un gate direct refresh.

Exception temporaire: route privee ou compte. Documenter pourquoi elle reste tunnel client.

### Cas B - Route native existe mais la SPA peut encore la reconstruire

Symptome: `src/app.jsx` ou `src/Router.jsx` contient encore `view === '<page>'`, `setView('<page>')`, deep-link parser, lazy import, ou `onEnsure...` pour la meme page publique.

Action:

- supprimer le chemin SPA;
- garder uniquement les liens vers l'URL Next;
- supprimer les helpers orphelins;
- retirer analytics/taxonomy de la vue SPA si elle n'existe plus;
- mettre a jour les gates pour echouer si le lazy import revient.

Exemple deja applique: produit legacy `ProductDetail.jsx` / `ArchitecturalProductDetail.jsx` retire.

### Cas C - L'UI est bonne en navigation interne mais differente au refresh

Symptome: l'arrivee par menu montre header/hero/formulaire correct, mais refresh direct affiche un autre shell, un contenu tronque, ou un overlay.

Action:

- identifier le composant SPA qui donne la bonne UI;
- le transformer en composant partage ou copier son markup dans une page Next native;
- ne pas ajouter un second header autour de l'ancien shell;
- ne pas empiler deux pages;
- supprimer la branche SPA apres migration;
- prouver que direct refresh et navigation interne convergent.

### Cas D - Donnees publiques lues uniquement en client

Symptome: page publique vide au HTML, puis remplie par `useEffect`, Firebase client, listener, ou state global.

Action:

- creer/adapter une fonction serveur dans `src/lib/...` ou `app/...`;
- fetcher les donnees dans le Server Component;
- passer un payload court aux iles client;
- garder les listeners uniquement pour admin, panier, compte, ou besoin temps reel justifie;
- ajouter `notFound()` si la ressource publique n'existe pas.

### Cas E - Interaction legitime mais trop grosse

Symptome: tout le shell SPA est charge pour une interaction locale.

Action:

- isoler en ile client minimale;
- props serialisables uniquement;
- pas de provider global lourd sur une route publique;
- importer dynamiquement les modales lourdes sur interaction;
- verifier le budget JS par route.

### Cas F - Legacy data utile

Symptome: noms comme `LEGACY_CATEGORY_IDS`, anciens champs `thumbnailUrl`, anciens IDs base.

Action:

- conserver si necessaire a la compatibilite des documents existants;
- ne pas le traiter comme residu SPA;
- documenter que c'est une compatibilite data;
- ne pas casser les categories historiques sans backfill.

## Transposition UI sans redesign

Regle centrale: on ne cree pas une nouvelle page. On transpose l'UI existante en Next SSR.

Methode:

1. Capturer l'etat SPA de reference: desktop, mobile, dark/light si applicable.
2. Identifier le composant source et ses classes CSS.
3. Reprendre structure, textes, images, espacements, classes, responsive.
4. Remplacer l'etat global SPA par des props serveur.
5. Remplacer les handlers de navigation par liens stables.
6. Garder les composants client seulement pour:
   - formulaire interactif;
   - upload;
   - filtres instantanes;
   - tri client;
   - lightbox/swipe;
   - panier/favori/auth.
7. Comparer screenshots avant/apres.

Interdits:

- ajouter un nouveau header pour masquer un probleme de shell;
- conserver deux versions de la meme page;
- garder une page SSR + un overlay SPA concurrent;
- changer l'identite visuelle pendant la migration;
- mettre le contenu SEO en `sr-only` si la page publique doit etre visible et indexable.

## Architecture cible par route publique

Structure preferee:

```text
app/<route>/page.jsx                  # Server Component, HTML public
app/<route>/loading.jsx               # loading stable si necessaire
app/<route>/not-found.jsx             # etat absent
src/lib/<domain>/server*.js           # data serveur, pas de window
src/kit/<domain>/<Route>ServerView.jsx
src/kit/<domain>/<Feature>Island.jsx  # "use client" borne
scripts/audit-<route>-direct.mjs      # gate direct refresh
```

Pour une route dynamique:

```jsx
export const revalidate = 300;

export async function generateStaticParams() {
  return publishedItems.map((item) => ({ slugOrId: item.slugOrId }));
}

export async function generateMetadata({ params }) {
  const item = await getItem(params.slugOrId);
  return {
    title: item.title,
    description: item.description,
    alternates: { canonical: getItemUrl(item) },
  };
}

export default async function Page({ params }) {
  const item = await getItem(params.slugOrId);
  if (!item) notFound();
  return <ItemServerView item={item} />;
}
```

Adapter au style JS du repo, sans forcer TypeScript.

## Galerie: audit specialise

La galerie est la zone la plus risquee car elle concentre:

- hero visuel;
- rail categories;
- grilles produit;
- sections basses lazy;
- scroll mobile custom;
- recherche/filtres;
- wishlist/panier;
- entree depuis home;
- liens produit/categorie/devis.

Audit galerie obligatoire:

```powershell
rg -n "GalleryView|MarketplaceLayout|ProductSections|ProductCard|CategoryRail|MarketplaceHero|marketplace-gallery-shell|marketplace-gallery-scroll" src app
rg -n "onSelectItem|onPrefetchItem|setView\\(|window\\.location|href=|getProductUrl|getCategoryUrl|/devis" src/kit/marketplace src/Router.jsx src/app.jsx
rg -n "ClientApp|HomeGalleryLauncher|data-sv-client-hydrated" app src
```

Regles galerie:

- les cartes produit doivent etre de vrais liens vers `/produit/...`;
- les categories doivent etre de vrais liens vers `/categorie/...` ou une route native equivalente;
- le CTA devis doit aller vers `/devis`;
- le refresh d'une URL publique ne doit pas dependre de l'etat galerie SPA;
- le shell mobile `marketplace-gallery-shell` / `marketplace-gallery-scroll` reste protege par `alertemobile.md` tant que la galerie n'est pas totalement migree;
- ne jamais casser l'invariant mobile sans reecrire le gate:

```jsx
const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;
```

Si `isGalleryDetailOverlay` est volontairement `false` apres retrait d'un overlay, garder la forme de l'invariant jusqu'a refactor complet du shell mobile.

## Suppression definitive du legacy

Apres migration d'une surface publique, supprimer dans le meme changement:

- lazy import du composant legacy;
- branche `view === '<route>'`;
- `setView('<route>')` public;
- parser deep-link SPA;
- state global uniquement utile a cette page;
- helpers orphelins;
- entrees analytics/taxonomy de la vue SPA;
- composants wrapper devenus vides;
- scripts ou gates qui valident l'ancien comportement;
- doc vivante qui demande de restaurer l'ancien chemin.

Ne supprimer que ce qui est prouve orphelin par `rg`. Les rapports historiques peuvent rester, mais les docs operationnelles doivent etre mises a jour.

## Gates obligatoires

Minimum apres correction:

```powershell
npm run lint
npm run build
npm run perf:budget
```

Si marketplace mobile touchee:

```powershell
npm run mobile:contract
```

Si produit touche:

```powershell
npm run perf:product-direct -- --assert
```

Si une nouvelle route publique est migree:

- creer ou adapter `scripts/audit-<route>-direct.mjs`;
- verifier desktop + mobile;
- verifier absence de `data-sv-client-hydrated` si la route doit etre native;
- verifier absence de surfaces concurrentes SPA;
- verifier que les assets galerie/home non pertinents ne partent pas au refresh direct;
- verifier metadata/canonical/JSON-LD si SEO attendu.

Pour deploy sandbox:

```powershell
firebase deploy --only apphosting:secondevie-next-sandbox --project secondevienextjsssr
```

Puis relancer le gate direct sur l'URL App Hosting.

## Rapport attendu apres chaque passe

Le compte rendu doit lister:

- routes auditees;
- residus SPA trouves;
- classification: public SEO, prive, data compatibility, dead code;
- fichiers supprimes;
- fichiers transposes en SSR;
- preuves `rg` montrant l'absence du chemin legacy;
- gates lances et resultats;
- limites restantes.

Forme de preuve utile:

```text
rg "ProductDetail.jsx|ArchitecturalProductDetail|setView\\('detail'\\)" src app scripts
=> aucun resultat actif

perf:product-direct:
svClientHydrated=false
hasMarketplaceGalleryShell=false
hasGalleryScroll=false
galleryAssets=[]
hasExactProductRouteExperience=true
```

## Ordre recommande pour les prochaines migrations

1. Stabiliser les gates par type de route.
2. Auditer toutes les routes `app/**/page.jsx` qui importent `ClientApp`.
3. Traiter les routes publiques SEO avant les routes privees.
4. Migrer une surface a la fois.
5. Copier l'UI SPA existante avant toute optimisation.
6. Supprimer le chemin SPA equivalent dans le meme changement.
7. Ajouter une preuve direct-refresh.
8. Deploy sandbox uniquement apres gates verts.

## Ce que l'agent ne doit pas faire

- Ne pas "ameliorer" le design pendant une migration SSR.
- Ne pas garder un fallback SPA "au cas ou" pour une route publique deja native.
- Ne pas valider seulement par navigation interne.
- Ne pas utiliser le refresh manuel comme unique methode de test.
- Ne pas confondre legacy data et legacy SPA.
- Ne pas deployer sans gate local vert, sauf demande explicite et risque annonce.
