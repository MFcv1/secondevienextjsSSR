# Public SEO Budget Visual Closeout - 2026-07-01

Objectif: fermer les budgets perf publics restants sans redesign ni regression visuelle. Les optimisations portent sur les frontieres client, le moment de chargement du JS/CSS et le maintien du rendu SSR.

## Verdict

Les budgets publics sont fermes. `perf:budget` signale encore `/admin` a `142.66 kB JS gzip > 135 kB`, mais `/admin` est un tunnel client hors scope de cette passe.

## Avant / Apres Perf Overall Public

| Route | JS gzip avant | JS gzip apres | Gain | CSS gzip avant | CSS gzip apres | Statut public |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 132.28 kB | 119.47 kB | -12.81 kB | 54.09 kB | 54.11 kB | OK |
| `/galerie` | 132.27 kB | 119.47 kB | -12.80 kB | 54.09 kB | 54.11 kB | OK |
| `/categorie/[categoryId]` | 137.00 kB | 124.44 kB | -12.56 kB | 54.09 kB | 54.11 kB | OK, sous 130 kB |
| `/produit/[slugOrId]` | 146.38 kB | 133.58 kB | -12.80 kB | 54.09 kB | 54.11 kB | OK |
| `/devis` | 141.92 kB | 122.18 kB | -19.74 kB | 54.09 kB | 54.11 kB | OK, sous 125 kB |
| `/a-propos` | 183.48 kB | 168.50 kB | -14.98 kB | 62.49 kB | 54.11 kB | OK, sous 170/55 kB |

Notes:

- Les chiffres ci-dessus viennent de `logs/public-seo-closeout/before-chunks.json` et `logs/public-seo-closeout/after-chunks.json`.
- First Load JS build apres: `/` 121 kB, `/galerie` 121 kB, `/categorie/[categoryId]` 122 kB, `/produit/[slugOrId]` 118 kB, `/devis` 115 kB, `/a-propos` 157 kB.
- First Load JS build avant connu depuis la sortie build de baseline: `/` environ 134 kB, `/categorie/[categoryId]` environ 135 kB, `/devis` environ 135 kB, `/a-propos` 159 kB.

## Changements Et Preuves

| Changement | Gain perf | Impact visuel attendu | Preuve apres |
| --- | --- | --- | --- |
| Header panier charge via `LazyCartPanelIsland` | Retire le panneau panier complet du JS initial public; gain partage sur `/`, `/galerie`, `/categorie`, `/produit`, `/devis` | Bouton panier identique; panneau complet charge au hover/focus/clic ou evenement panier | Budgets publics en baisse; screenshots apres header OK; gates directs OK |
| `CategoryControlsIsland` devient une ile comportementale attachee au DOM SSR | La page categorie ne passe plus tout son rendu dans une frontiere client | Rendu SSR des filtres, tri, cartes et liens conserve | `/categorie`: 137.00 -> 124.44 kB JS gzip; `perf:category-direct` OK |
| `/devis` passe en shell SSR + enhancement differe | Le formulaire complet client sort du chemin initial | Formulaire visible en SSR; experience interactive complete montee apres idle/interaction; pas de blanc car le shell reste visible jusqu'au montage client | `/devis`: 141.92 -> 122.18 kB JS gzip; `perf:quote-direct` OK; screenshots OK |
| CSS specifique `/a-propos` charge via `AboutStylesIsland` | Retire le CSS about non critique du CSS initial | Rendu final identique apres stabilisation; pas de changement de couleurs/typos/layout cible | `/a-propos` CSS: 62.49 -> 54.11 kB gzip; screenshots apres OK |
| CSS critique inline `/a-propos` pour nav + hero | Evite le flash de pre-rendu brut a froid sans recharger tout `home-v4.css` en initial | Le premier paint affiche deja nav pill, logo taille correcte, hero plein ecran et boutons styles | Test cold avec JS off/early: nav fixed, radius 9999px, hero background image present |
| Autoplay/preload de la premiere video hero | Demande le MP4 hero directement, sans attendre l'hydratation React | Pas d'image poster/fallback; le hero est porte par la video des qu'elle est disponible | Test deploy: `bgImage=none`, `videoPoster=""`, `videoAutoplay=true`, `videoPreload=auto`, video prete a 1.5s |
| Motion lourde `/a-propos` via `AboutMotionDeferredIsland` | Retire l'ile GSAP/SplitType non critique du JS initial | DOM SSR et hero visibles identiques; seules les animations avancees demarrent apres idle | `/a-propos` JS: 183.48 -> 168.50 kB gzip; `perf:about-direct` OK |
| Icônes locales dans `QuoteFormIsland` | Evite un couplage lucide inutile dans le formulaire differe | Pictos visuellement equivalents | Build/lint OK; formulaire interactif conserve |

## Protection Visuelle

Screenshots avant:

- `logs/public-seo-closeout/before-screenshots/root-desktop.png`
- `logs/public-seo-closeout/before-screenshots/root-mobile.png`
- `logs/public-seo-closeout/before-screenshots/gallery-desktop.png`
- `logs/public-seo-closeout/before-screenshots/gallery-mobile.png`
- `logs/public-seo-closeout/before-screenshots/category-desktop.png`
- `logs/public-seo-closeout/before-screenshots/category-mobile.png`
- `logs/public-seo-closeout/before-screenshots/quote-desktop.png`
- `logs/public-seo-closeout/before-screenshots/quote-mobile.png`
- `logs/public-seo-closeout/before-screenshots/about-desktop.png`
- `logs/public-seo-closeout/before-screenshots/about-mobile.png`

Screenshots apres:

- `logs/public-seo-closeout/after-screenshots/root-desktop.png`
- `logs/public-seo-closeout/after-screenshots/root-mobile.png`
- `logs/public-seo-closeout/after-screenshots/gallery-desktop.png`
- `logs/public-seo-closeout/after-screenshots/gallery-mobile.png`
- `logs/public-seo-closeout/after-screenshots/category-desktop.png`
- `logs/public-seo-closeout/after-screenshots/category-mobile.png`
- `logs/public-seo-closeout/after-screenshots/quote-desktop.png`
- `logs/public-seo-closeout/after-screenshots/quote-mobile.png`
- `logs/public-seo-closeout/after-screenshots/about-desktop.png`
- `logs/public-seo-closeout/after-screenshots/about-mobile.png`

Verification visuelle:

- Header, hero, grille galerie, cartes categorie, formulaire devis, sections about et navigation restent presents.
- Les screenshots apres ne remontent pas d'erreur console dans `logs/public-seo-closeout/after-screenshots/summary.json`.
- Le cadrage tres large du hero `/a-propos` mobile etait deja visible dans le screenshot avant; il n'a pas ete introduit par cette passe.
- Correction cold-start ajoutee apres observation deploy: `logs/public-seo-closeout/about-critical-cold-v2/summary.json` confirme que le premier viewport `/a-propos` garde le style critique meme avant hydratation. Le fallback image a ensuite ete retire a la demande produit: la version deployee charge directement `/video/hero/1-wood-buffet.mp4`.

## Gates Lances

| Gate | Resultat |
| --- | --- |
| `npm run lint` | OK |
| `npm run build` | OK |
| `npm run next:routes` | OK |
| `npm run perf:budget` | Routes publiques OK; `/admin` encore rouge hors scope |
| `npm run perf:gallery-direct` | OK |
| `npm run perf:category-direct` | OK |
| `npm run perf:quote-direct` | OK |
| `npm run perf:about-direct` | OK |
| `npm run perf:product-direct` | OK |
| `npm run mobile:contract` | OK |

## Hors Scope Restant

- `/admin`: `142.66 kB JS gzip`, budget `135 kB`. C'est un tunnel client back-office, non public SEO, laisse volontairement hors scope.
- Aucun seuil public SEO ne reste rouge apres cette passe.
