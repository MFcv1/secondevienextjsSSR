# Contexte projet Seconde Vie Next

Derniere mise a jour: 2026-06-30

## Etat courant

Le site public Seconde Vie est une application Next.js App Router native. La migration depuis l'ancienne SPA globale est terminee pour les routes publiques SEO principales. Les futurs travaux doivent partir de cette base, pas d'un chantier de migration encore ouvert.

Reference principale: `NEXT_NATIVE_ARCHITECTURE_BASELINE.md`.

## Architecture publique

- `/` redirige vers `/galerie`.
- `/galerie` est une route publique cacheable: `force-static` + `revalidate = 300`.
- `/categorie/[categoryId]` et `/produit/[slugOrId]` sont en SSG/ISR avec `generateStaticParams`.
- `/a-propos` et `/devis` sont rendues cote serveur avec ISR.
- `/admin`, `/checkout`, `/wishlist` et `/mes-commandes` restent des tunnels dynamiques.

## Regles fortes

- Ne pas recreer `ClientApp`, `src/app.jsx`, `src/Router.jsx`, `setView`, ou un routing par hash.
- Ne pas transformer une route publique SEO en route dynamique pour une preference UI.
- Ne pas utiliser `cookies()`, `headers()`, `draftMode()` ou `searchParams` dans les pages publiques serveur.
- Garder les interactions dans des iles client fines.
- Garder les liens publics en URLs Next stables.

## Galerie

La galerie est la surface la plus sensible.

Contrat actuel:

- `GalleryServerView` rend le shell et le contenu public.
- `GalleryMobileShellIsland` gere le contrat mobile.
- Les sections Avant/Apres, Instagram, Avis et Newsletter sont rendues directement en SSR.
- `GalleryFixedSectionsInteractions` ajoute uniquement les interactions sur le markup deja rendu.

Avant toute modification mobile galerie, lire `alertemobile.md`.

## Images et performance

La strategie image active repose sur les variantes WebP Firebase Storage, pas sur l'optimisation a la demande de Next.

Docs utiles:

- `_DOCS/images/NEXTJS_IMAGE_PIPELINE_AUDIT.md`
- `_DOCS/images/OPTIMISATION_AFFICHAGE_IMAGES_PRODUIT_2026-06-28.md`
- `_DOCS/images/DETAIL_FAST_IMAGE_VARIANT_ROADMAP.md`

Le budget CSS/JS initial reste un chantier separe. Ne pas le melanger avec le nettoyage documentation/arborescence.

## Gates utiles

Selon la passe:

```bash
npm run build
npm run next:routes
npm run mobile:contract
npm run perf:gallery-direct
npm run perf:product-direct
npm run perf:category-direct
npm run perf:about-direct
npm run perf:quote-direct
```

`npm run perf:budget` peut rester rouge tant que le chantier CSS/JS n'est pas traite.

## Archives

Les anciens rapports de migration SPA vers Next sont archives dans `_DOCS/archive/migration-spa-to-next/`. Ils servent d'historique, pas de consignes actives.
