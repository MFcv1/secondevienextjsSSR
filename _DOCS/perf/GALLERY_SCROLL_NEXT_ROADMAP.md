# Roadmap scroll desktop galerie - 2026-05-26

Objectif: continuer la meme logique que le correctif scroll froid du 2026-05-24/25, en affinant la fluidite du premier scroll desktop sans revenir au scroll lock, sans timers courts, et sans casser le contrat mobile marketplace.

## Principes

- Desktop: jamais de `gallery-entry-scroll-lock`, jamais de `overflow:hidden` global au demarrage galerie.
- Mobile: conserver l'invariant de `src/Router.jsx`:

```jsx
const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;
```

- Garder les sections avec hauteur reservee pour eviter les sauts.
- Charger les comportements interactifs sur intention, idle long ou proximite viewport.
- Mesurer chaque changement avec les gates scroll, budget et mobile.

## Roadmap priorisee

### 1. Stabiliser les audits

- Ajouter un precheck dans `perf:scroll` et `perf:scroll:newsletter` qui echoue si un `next dev` du meme repo tourne.
- Ajouter un controle de coherence `.next` avant audit: `prerender-manifest.json`, `app-build-manifest.json`, `react-loadable-manifest.json` doivent avoir une taille normale.
- Objectif: eviter les faux audits avec chunks 400/404 ou manifests reecrits par un serveur dev.

### 2. Profiler les chunks restants du premier scroll

- Identifier precisement les 5 chunks encore charges pendant `perf:scroll`.
- Mapper chaque chunk a ses imports: header, galerie, product sections, lucide, wishlist, panier, helpers image.
- Objectif: savoir quel code peut sortir du chemin immediat sans changement visuel.

### 3. Decouper la galerie publique en ilots plus petits

- Separer le shell visible stable des comportements interactifs:
  - hero display;
  - rail categories display;
  - grille `Nouveautes` display;
  - wishlist/cart;
  - recherche/filter;
  - prefetch produit;
  - animations decoratives.
- Charger wishlist/cart/prefetch/recherche apres interaction, idle long ou intersection.
- Objectif: reduire le cout d'hydratation initial sans casser l'UX.

### 4. Rendre `Nouveautes` moins lourde au premier rendu

- Creer une carte produit display-only pour le premier rendu public.
- Brancher ensuite:
  - wishlist;
  - add-to-cart;
  - hover/focus prefetch detail;
  - image warmup detail;
  - badges ou micro-interactions.
- Objectif: garder les cartes visibles rapidement tout en retardant les handlers non critiques.

### 5. Supprimer les doublons d'images visibles

- Auditer les requetes repetees sous cache desactive:
  - `imagehero/1.webp`;
  - `*-config-rail.webp`;
  - `logoanais-320.webp`.
- Verifier si le doublon vient du remount client, du hero, du rail categories ou d'un placeholder.
- Objectif: une seule demande par asset visible pendant le scroll froid.

### 6. Footer et newsletter

- Garder le placeholder footer, mais verifier que le vrai chunk footer n'arrive pas trop tot pendant un scroll rapide.
- Ne charger l'image footer livraison qu'une fois et seulement quand le layout visible approche.
- Garder le footer support avant le bas de page pour eviter le blocage autour de "Abonne-toi".

### 7. Animations et apparition des sections

- Verifier que les apparitions utilisent uniquement `transform` et `opacity`.
- Ajouter ou verifier `prefers-reduced-motion` pour toutes les animations decoratives.
- Eviter les apparitions brutales: les placeholders doivent se transformer en contenu avec fade/translate doux, sans changement de hauteur.

### 8. Objectifs chiffres

Sur `http://127.0.0.1:4300/`, cache desactive, CPU throttle x4:

| Scenario | Cible |
| --- | --- |
| `perf:scroll` long tasks | <= 3 |
| `perf:scroll` total long tasks | < 600 ms |
| `perf:scroll` max long task | < 200 ms |
| `perf:scroll` frame gap max | < 220 ms |
| `perf:scroll` gaps >100 ms | <= 3 |
| Premier scroll apres document scrollable | < 200 ms |
| Chunks interdits pendant premier scroll | `ProductDetail`, `Footer`, `Newsletter`, `Testimonials`, `PremiumMegaMenu`, analytics |

## Ordre conseille demain

1. Ajouter le precheck anti-`next dev` dans les scripts d'audit.
2. Profiler les chunks restants de `perf:scroll`.
3. Extraire une carte `Nouveautes` display-only.
4. Retarder wishlist/cart/prefetch sur les cartes visibles.
5. Corriger les doublons d'images hero/categories.
6. Relancer `lint`, `mobile:contract`, `build`, `perf:budget`, `perf:scroll`, `perf:scroll:newsletter`.

## Garde-fous

- Ne pas refaire un shell complet.
- Ne pas toucher aux handlers touch mobile sauf necessite absolue.
- Ne pas remettre de timers courts pour masquer un probleme de structure.
- Ne pas charger le footer/newsletter/product detail pendant le premier scroll froid.
- Documenter les mesures avant/apres dans `_DOCS/perf/GALLERY_SCROLL_LAG_AUDIT.md`.
