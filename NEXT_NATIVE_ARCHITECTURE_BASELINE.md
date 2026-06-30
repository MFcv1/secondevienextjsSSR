# Baseline architecture Next native

Date: 2026-06-30

## Statut

Le projet Seconde Vie est maintenant une application Next.js App Router native pour les routes publiques. La migration depuis l'ancienne SPA globale est terminee pour les surfaces SEO principales. Les futures passes ne doivent plus partir du principe qu'il faut migrer depuis `ClientApp`, `src/app.jsx` ou `src/Router.jsx`.

## Contrat routes

| Route | Mode attendu | Contrat |
| --- | --- | --- |
| `/` | `force-static` + ISR `revalidate = 300` | home canonique, galerie SSR, contenu indexable, shell mobile conserve, sections fixes rendues directement |
| `/galerie` | `force-static` + ISR `revalidate = 300` | alias compatible de la galerie, canonical vers `/` |
| `/categorie/[categoryId]` | SSG + ISR `revalidate = 300` | `generateStaticParams`, rendu canonique serveur, facettes/tri cote client |
| `/produit/[slugOrId]` | SSG + ISR `revalidate = 300` | `generateStaticParams`, metadata produit, JSON-LD, actions panier/favori en iles client |
| `/a-propos` | ISR `revalidate = 300` | page vitrine serveur + iles fines |
| `/devis` | ISR `revalidate = 300` | contenu metier serveur + formulaire client |
| `/admin`, `/checkout`, `/wishlist`, `/mes-commandes` | `force-dynamic` | tunnels prives/transactionnels, pas des pages SEO statiques |
| `/api/revalidate-catalog` | `force-dynamic` | endpoint de revalidation catalogue |

## Regles d'architecture

- Les routes publiques SEO ne doivent pas importer `ClientApp`, `src/app.jsx`, `src/Router.jsx`, ni reconstruire un routing SPA.
- Les pages publiques ne doivent pas lire `cookies()`, `headers()`, `draftMode()` ou `searchParams` cote serveur pour des preferences UI.
- Les donnees publiques catalogue passent par les helpers serveur et les tags/cache/revalidation existants.
- Les interactions doivent etre des iles client bornees: auth, panier, wishlist, menu, lightbox, carousel, slider, formulaires.
- Les boutons publics doivent naviguer avec des URLs stables: `/`, `/#gallery-pieces`, `/categorie/...`, `/produit/...`, `/devis`, `/wishlist`, `/mes-commandes`.
- Les sections fixes de galerie ne doivent plus passer par un rendu provisoire remplace par un composant client complet.

## Galerie

La galerie est la surface publique la plus sensible.

Contrat actuel:

- `app/page.jsx` et `app/galerie/page.jsx` rendent `GalleryRoutePage`; `/` est la canonique, `/galerie` reste compatible.
- `GalleryRoutePage` rend `GalleryServerView`.
- `GalleryServerView` expose `data-ssr-gallery`, `.marketplace-gallery-shell`, `.marketplace-gallery-scroll` et `#marketplaceGalleryScroll`.
- `GalleryMobileShellIsland` attache seulement les comportements mobile necessaires.
- Les sections Avant/Apres, Instagram, Avis et Newsletter ont leur rendu final directement dans le HTML serveur.
- `GalleryFixedSectionsInteractions` ajoute seulement les interactions sur le markup SSR existant.

Gates utiles:

```bash
npm run perf:gallery-direct
npm run mobile:contract
npm run next:routes
```

## Images produit

Decision active:

- Les variantes WebP Firebase Storage restent la source de verite.
- `next/image` est configure avec `images.unoptimized: true`.
- Les variantes sont choisies par contexte: carte, detail, zoom, mobile, desktop.
- Les audits et backfills image vivent dans `_DOCS/images/NEXTJS_IMAGE_PIPELINE_AUDIT.md`, `_DOCS/images/OPTIMISATION_AFFICHAGE_IMAGES_PRODUIT_2026-06-28.md` et `_DOCS/images/DETAIL_FAST_IMAGE_VARIANT_ROADMAP.md`.

Gates utiles:

```bash
npm run images:audit
npm run perf:product-images
npm run perf:product-images:cold
```

## Gates de reference

Avant une passe structurelle:

```bash
npm run build
npm run next:routes
npm run mobile:contract
```

Selon la zone touchee:

```bash
npm run perf:gallery-direct
npm run perf:product-direct
npm run perf:category-direct
npm run perf:about-direct
npm run perf:quote-direct
```

Le gate `npm run perf:budget` est actuellement le chantier perf restant. Il peut echouer sur le budget CSS/JS initial; ne pas melanger sa correction avec le nettoyage documentaire.

## Documentation active

Conserver comme base de travail:

- `AGENTS.md`: consignes agents et code map compacte.
- `context.md`: synthese courte de l'etat projet.
- `alertemobile.md`: invariant mobile galerie.
- `mapV2.md`: cartographie routes/infra.
- `RUNBOOK.md`: commandes et exploitation.
- `_DOCS/perf/NEXTJS_OPTIMIZATION_ROADMAP.md`: perf/hydratation.
- `_DOCS/architecture/NEXT_PUBLIC_ROUTES_STATIC_ARCHITECTURE_ROADMAP_2026-06-16.md`: routes publiques cacheables.
- `_DOCS/images/NEXTJS_IMAGE_PIPELINE_AUDIT.md`, `_DOCS/images/OPTIMISATION_AFFICHAGE_IMAGES_PRODUIT_2026-06-28.md`, `_DOCS/images/DETAIL_FAST_IMAGE_VARIANT_ROADMAP.md`: pipeline images.
- `_DOCS/infra/P0_INFRA_CLOSEOUT_ROADMAP_2026-06-24.md`, `_DOCS/infra/APP_CHECK_ENFORCEMENT_READINESS_2026-06-24.md`, `_DOCS/infra/RAIL_PROD_AUDIT_REPORT_2026-06-24.md`: infra prod.

Les rapports de migration SPA sont archives dans `_DOCS/archive/migration-spa-to-next/` et ne sont plus des consignes operationnelles.

## Prochains chantiers vers 10/10

1. Finir le nettoyage documentaire et reduire les docs actives.
2. Supprimer les composants client/lazy orphelins apres preuve `rg`.
3. Nettoyer l'arborescence des rapports ponctuels.
4. Traiter ensuite seulement le budget CSS/JS initial.
