# Phase 3 Perf/Hydratation - Baseline et passe P0 galerie

Date: 2026-06-24

Scope lance: Phase 3 perf/hydratation publique. Explicitement reportes: rail prod absent, App Check enforcement reel, paiement redirect iDEAL/Wero.

## Synthese

La passe P0 galerie est implementee sans redesign et sans toucher au contrat mobile:

- `/galerie` reste SSR/ISR native, avec canonical, JSON-LD, liens produit/categorie natifs et sans `ClientApp`.
- `GalleryServerView`, `GalleryMobileShellIsland`, `.marketplace-gallery-shell` et `#marketplaceGalleryScroll` restent en place.
- Les iles basses interactives `BeforeAfterSliderIsland`, `InstagramCarouselIsland` et `TestimonialsCarouselIsland` ne sont plus importees directement par `ProductSectionsServer`.
- `DeferredGalleryIsland` charge ces iles au voisinage viewport/idle, avec placeholders serveur a hauteur stable.
- La home V4 expose a nouveau `data-ssr-home`, ce qui remet `npm run perf:gallery-direct` en phase avec la page actuelle.

## Avant / Apres

| Mesure | Avant Phase 3 | Apres P0 galerie |
| --- | ---: | ---: |
| `next build` `/galerie` First Load JS | 180 kB | 130 kB |
| `perf:budget` `/galerie` JS gzip | 734.13 kB FAIL | 170.26 kB OK |
| `app/galerie/page` chunk | ~696.62 kB gzip | 5.93 kB gzip |
| plus gros JS differe/statique | 696.62 kB gzip FAIL | 102.67 kB gzip OK |
| `perf:scroll` long task scroll immediate | 172 ms | 104 ms |
| `perf:scroll` long tasks total | 1334 ms | 1277 ms |
| `perf:scroll:newsletter` long tasks total | 1133 ms | 1205 ms |

Interpretation: le gros gain est le retrait du JS carousel/slider du chargement initial galerie. Le scroll immediate baisse nettement. Le scroll newsletter reste vert mais varie legerement a la hausse sur ce run; il charge maintenant les chunks differes pendant la descente, ce qui est attendu et a surveiller sur les prochaines passes.

## Chunks initiaux `/galerie`

Extrait de `.next/app-build-manifest.json` apres build:

| Asset initial | Raw | Gzip |
| --- | ---: | ---: |
| `static/chunks/webpack-3429c00fa12e0e14.js` | 5.17 kB | 2.80 kB |
| `static/chunks/4bd1b696-100b9d70ed4e49c1.js` | 168.97 kB | 53.09 kB |
| `static/chunks/1255-eae4096fb21f1304.js` | 169.82 kB | 45.02 kB |
| `static/chunks/main-app-0bb18e8ca5488422.js` | 0.56 kB | 0.23 kB |
| `static/chunks/2078-26a329390d1b7122.js` | 32.09 kB | 10.95 kB |
| `static/chunks/2619-04bc32f026a0d946.js` | 8.36 kB | 3.33 kB |
| `static/chunks/2799-a01df79413643707.js` | 20.03 kB | 6.23 kB |
| `static/chunks/app/galerie/page-2e2efa5a388ecf01.js` | 16.94 kB | 5.93 kB |

## Gates executes

| Gate | Resultat | Note |
| --- | --- | --- |
| `npm run build` | PASS | `/galerie` First Load JS 130 kB, `/produit/[slugOrId]` 118 kB |
| `npm run next:routes` | PASS | routes publiques prerender/cache, pas de legacy SPA dans les pages publiques |
| `npm run mobile:contract` | PASS | shell galerie mobile intact |
| `npm run perf:gallery-direct` | PASS | SSR galerie, canonical, JSON-LD, liens natifs, `ClientApp` absent |
| `npm run perf:scroll` | PASS | summary `logs/scroll-audit/127-0-0-1/2026-06-24T22-00-58-802Z-summary.json` |
| `npm run perf:scroll:newsletter` | PASS | summary `logs/scroll-audit/127-0-0-1/2026-06-24T22-01-09-986Z-summary.json` |
| `npm run perf:budget` | FAIL partiel | `/galerie` JS passe; reste rouge sur CSS global, home/categorie/devis/admin JS |
| `npm run perf:product-direct` | FAIL donnees | route produit directe OK, mais le produit par defaut n'affiche pas d'action reservation |

## Dettes restantes Phase 3

P1 header public reste a traiter: le header apporte encore les iles `HeaderAccountIsland`, `CartPanelIsland`, `GlobalMenuTriggerIsland`, `PremiumMegaMenuLazyIsland` et `DarkModeToggleIsland` dans les routes publiques. Prochaine passe recommandee: petite ile d'orchestration header qui garde les liens visibles mais charge auth/panier/menu sur intention ou contexte prive.

P2 produit direct est documente en no-op code pour cette passe: le build produit est stable a 118 kB First Load JS, mais le gate runtime doit etre repointe vers un produit publie et achetable. Le produit par defaut `buffet-KrTETXPknYNwgak66T8p` rend bien la page produit native, l'image et les sections, mais pas l'action reservation.

Le budget CSS global reste hors scope P0 galerie: `perf:budget` signale encore `73.87 kB` gzip sur plusieurs routes avec plafond historique `55 kB`.

## Note operationnelle

Pendant les runs, plusieurs serveurs `next dev` du meme repo reecrivaient `.next` et rendaient `next start` instable. Ils ont ete arretes avant la build prod finale. Pour des mesures reproductibles: arreter les serveurs Next concurrents, supprimer `.next`, relancer `npm run build`, puis demarrer `node node_modules/next/dist/bin/next start -p 4300`.
