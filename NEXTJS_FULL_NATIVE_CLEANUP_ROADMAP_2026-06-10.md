# Roadmap cleanup full Next SSR/SSG native - 2026-06-10

Objectif: retirer les derniers residus architecturaux publics sans regressions visuelles, puis abaisser progressivement les budgets JS une fois les pages transposees en Server Components + iles ciblees.

## Baseline ciblee

- `/a-propos`: residu public principal. `AboutVitrineIsland` monte encore l'ancien `HomeView`, avec environ 339 kB JS gzip route + layout.
- `/categorie/[categoryId]`: data et metadata Next, mais experience visible encore concentree dans `CategoryLegacyExperienceIsland`.
- `/produit/[slugOrId]` et `/categorie/[categoryId]`: `dynamic = 'force-dynamic'` empeche le chemin ISR/SSG strict; le cookie dark mode serveur reste aussi a isoler avant une static generation complete.
- Produit: `getPublicProduct` doit privilegier `publicCatalog` avant Admin SDK pour eviter qu'un Admin SDK lent bloque un premier visiteur public.
- Budgets: `/galerie` et `/a-propos` doivent entrer dans `npm run perf:budget`, avec seuils de transition explicites puis seuils abaisses apres migration.

## Ordre d'execution

1. Couvrir les routes publiques manquantes dans le budget perf pour empecher les regressions invisibles.
2. Mettre le data path produit en `publicCatalog` first, avec Admin SDK seulement en fallback borne.
3. Repasser produit sur le chemin ISR attendu: `generateStaticParams`, retrait de `force-dynamic`, puis audit du cookie dark mode si le build reste dynamique.
4. Transposer `/a-propos` en page serveur visuellement equivalente: conserver la structure et les assets, retirer l'import `HomeView`, ne garder en client que les interactions indispensables.
5. Decouper categorie: grille initiale serveur, filtres/tri/panier/wishlist en iles plus petites, puis suppression de `CategoryLegacyExperienceIsland`.
6. Apres chaque tranche: `lint`, `build`, `perf:budget`, gates direct refresh, et `mobile:contract` si galerie/mobile marketplace touche.

## Decisions de prudence

- Ne pas toucher au design avant d'avoir une comparaison DOM/visuelle locale.
- Ne pas rendre une route statique en sacrifiant silencieusement le dark mode: si `cookies()` force encore le dynamique, documenter et isoler le theme dans une passe dediee.
- Ne pas casser les invariants galerie mobile: `GalleryServerView.jsx`, `GalleryMobileShellIsland.jsx`, `marketplace-gallery-shell`, `#marketplaceGalleryScroll` et `data-native-scroll-region` restent sous contrat.

## Etat de cette passe

- Roadmap creee et referencee dans `AGENTS.md`.
- Budget `/galerie` + `/a-propos` ajoute dans `npm run perf:budget`.
- Script budget corrige pour lire aussi les `*_client-reference-manifest.js`, afin de mesurer les vrais chunks client par route avec Next 15.
- Produit: `getPublicProduct` lit maintenant `publicCatalog` avant Admin SDK; Admin reste un fallback borne a 1,8 s.
- Produit: `dynamic = 'force-dynamic'` retire, `generateStaticParams()` ajoute; le build classe `/produit/[slugOrId]` en SSG.
- Categorie: `dynamic = 'force-dynamic'` retire, `generateStaticParams()` ajoute depuis les categories connues; le build classe `/categorie/[categoryId]` en SSG.
- `/galerie`: lecture cookie serveur retiree, `dynamic = 'force-static'`; le build classe `/galerie` en statique ISR avec revalidate 300.
- `/a-propos`: `AboutVitrineIsland/HomeView` retire de la route, remplacement par `AboutServerView` serveur + iles fines; build statique, budget abaisse a 170 kB JS gzip.
- Categorie: `CategoryLegacyExperienceIsland` retire de la route, remplacement par `CategoryServerView` serveur + `CategoryControlsIsland`; build SSG, budget abaisse a 130 kB JS gzip.
- Restes a surveiller: QA visuelle fine `/a-propos` car le scrollytelling GSAP legacy est simplifie, et eventuel nettoyage des fichiers legacy morts apres une passe `rg`/captures.
