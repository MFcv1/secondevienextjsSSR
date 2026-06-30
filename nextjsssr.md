# Playbook Next natif - Seconde Vie

Date de mise a jour: 2026-06-30

Ce document remplace l'ancien playbook de migration SPA. La migration publique est terminee; ce fichier sert maintenant a proteger l'architecture Next App Router native.

Lire aussi `NEXT_NATIVE_ARCHITECTURE_BASELINE.md`.

## Objectif

Conserver des routes publiques SEO cacheables, indexables et coherentes au refresh direct, avec des iles client bornees pour les interactions.

## Contrat public

Une route publique est saine si:

- elle est rendue par `app/**/page.jsx`;
- son HTML initial contient le contenu metier utile;
- sa metadata/canonical/JSON-LD sont produits cote serveur quand pertinent;
- elle ne depend pas d'un shell client global;
- elle garde une URL stable;
- ses interactions sont ajoutees par des iles client ciblees.

## Modes attendus

- `/`: redirection permanente vers `/galerie`.
- `/galerie`: `force-static` + `revalidate = 300`.
- `/categorie/[categoryId]`: `generateStaticParams` + ISR.
- `/produit/[slugOrId]`: `generateStaticParams` + ISR.
- `/a-propos`, `/devis`: ISR.
- `/admin`, `/checkout`, `/wishlist`, `/mes-commandes`, `/api/revalidate-catalog`: `force-dynamic`.

## Interdits

Sur les routes publiques SEO:

- pas de `ClientApp`;
- pas de `src/app.jsx`;
- pas de `src/Router.jsx`;
- pas de routing `setView`;
- pas de routing `location.hash`;
- pas de `cookies()`, `headers()`, `draftMode()` ou `searchParams` serveur;
- pas de rendu provisoire visuellement different remplace par une ile client complete.

## Inventaire rapide

Avant une passe structurelle:

```bash
rg -n "ClientApp|src/app.jsx|src/Router.jsx|setView\\(|location\\.hash|window\\.location\\.hash" app src scripts
rg -n "cookies\\(|headers\\(|draftMode\\(|searchParams" app src/lib src/kit/marketplace
rg -n "generateMetadata|generateStaticParams|revalidate|canonical|application/ld\\+json" app src
```

Les scripts de gate contiennent encore des recherches anti-legacy par securite. Elles doivent rester des garde-fous, pas des invitations a restaurer l'ancien chemin.

## Galerie

La galerie doit rester une route publique SSR/ISR stable.

Verifier:

- `data-ssr-gallery` present;
- `.marketplace-gallery-shell` present;
- `.marketplace-gallery-scroll` et `#marketplaceGalleryScroll` presents;
- sections fixes rendues directement;
- absence de `data-deferred-gallery-island` pour Avant/Apres, Instagram et Avis;
- absence de `data-sv-client-hydrated`.

Gates:

```bash
npm run perf:gallery-direct
npm run mobile:contract
npm run next:routes
```

## Mobile marketplace

Avant toute modification touchant la galerie mobile, le detail produit, le shell, le scroller ou les handlers touch, lire `alertemobile.md`.

Le contrat mobile est gere par:

- `src/kit/marketplace/GalleryServerView.jsx`;
- `app/GalleryMobileShellIsland.jsx`;
- CSS autour de `.marketplace-gallery-shell` et `.marketplace-gallery-scroll`.

## Images

Ne pas changer le pipeline image sans lire:

- `NEXTJS_IMAGE_PIPELINE_AUDIT.md`;
- `OPTIMISATION_AFFICHAGE_IMAGES_PRODUIT_2026-06-28.md`;
- `DETAIL_FAST_IMAGE_VARIANT_ROADMAP.md`.

Decision active: variantes WebP Firebase Storage + `next/image` unoptimized.

## Gates recommandes

Minimum apres une passe architecture:

```bash
npm run build
npm run next:routes
```

Selon le risque:

```bash
npm run mobile:contract
npm run perf:gallery-direct
npm run perf:product-direct
npm run perf:category-direct
npm run perf:about-direct
npm run perf:quote-direct
```

`npm run perf:budget` est le gate du chantier CSS/JS. Il peut rester rouge tant que cette passe n'est pas lancee.

## Documentation historique

Les rapports de migration sont archives dans `_DOCS/archive/migration-spa-to-next/`. Ne pas les utiliser comme source d'instructions actives.
