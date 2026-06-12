# Audit full Next natif - Seconde Vie

Date: 2026-06-10

Objectif: consolider l'etat reel apres retrait des gros wrappers SPA publics, identifier ce qui reste a patcher pour une architecture Next.js App Router plus native, et fixer des gates mesurables avant la prochaine passe SEO/perf.

## Verdict court

Les routes publiques SEO ne dependent plus du shell SPA historique pour afficher leur contenu principal. `ClientApp`, `src/app.jsx`, `src/Router.jsx`, `HomeView` et `CategoryLegacyExperienceIsland` ne pilotent plus les routes publiques migrees.

Le projet n'est pas encore "pur" au sens strict: il reste des fichiers legacy orphelins, de grosses iles client publiques, des tunnels prives client-side acceptables, un `/devis` dynamique, et un budget CSS/JS public a optimiser.

## Classification build

Source: `npm run build` du 2026-06-10.

| Route | Statut build | Etat architectural |
| --- | --- | --- |
| `/` | `STATIC`, revalidate 5m | Home Next native, ile motion limitee |
| `/galerie` | `STATIC`, revalidate 5m | Galerie ISR native, shell mobile client conserve |
| `/a-propos` | `STATIC`, revalidate 5m | Page vitrine serveur + iles fines |
| `/categorie/[categoryId]` | `SSG` avec `generateStaticParams` | Vue serveur native + ile controles |
| `/produit/[slugOrId]` | `SSG` avec `generateStaticParams` | Vue produit serveur + grosses iles produit |
| `/devis` | `DYNAMIC` | SSR dynamique a cause du theme serveur cookie |
| `/sitemap.xml` | `STATIC`, revalidate 5m | OK |
| `/robots.txt` | `DYNAMIC` | Dynamique explicite probablement inutile |
| `/admin`, `/checkout`, `/wishlist`, `/mes-commandes` | `DYNAMIC` | Tunnels prives/noindex acceptables |

Note: `.next/prerender-manifest.json` ne liste pas les chemins dynamiques App Router comme preuve exploitable de produit/categorie SSG. Pour ce repo, la preuve fiable est le tableau `next build`, plus les exports `generateStaticParams` et les audits directs.

## Preuves anti-SPA

- Aucun import public actif de `ClientApp` dans les pages publiques.
- `HomeView` et `src/vitrine/components/*` ont ete supprimes lors de la passe de nettoyage du 2026-06-13.
- `CategoryLegacyExperienceIsland` a ete supprime lors de la passe de nettoyage du 2026-06-13.
- L'ancien `/?page=gallery` est une compat URL middleware vers `/galerie`, pas un router SPA.
- Les audits directs existants couvrent `/galerie`, `/a-propos`, `/categorie`, `/produit` et `/devis`.

## Mesures budget courantes

Source: `npm run perf:budget`.

| Route | JS gzip initial | CSS gzip initial | Lecture |
| --- | ---: | ---: | --- |
| `/` | 106.67 kB | 54.46 kB | OK |
| `/produit/[slugOrId]` | 120.15 kB | 54.46 kB | OK, shell produit a reduire |
| `/galerie` | 176.44 kB | 54.46 kB | Plus lourde route publique |
| `/categorie/[categoryId]` | 125.27 kB | 54.46 kB | Proche plafond actuel |
| `/a-propos` | 153.82 kB | 54.46 kB | Beaucoup mieux qu'avant, encore motion/iles |
| `/devis` | 115.20 kB | 54.46 kB | Dynamic mais leger |
| admin tunnel | 128.76 kB | 58.46 kB | Tunnel prive |

## Legacy public retire

Decision utilisateur du 2026-06-13: les fichiers legacy morts peuvent etre retires quand `rg`, build et gates prouvent qu'ils ne servent plus a afficher le site ou le backoffice.

Fichiers retires:

- `src/vitrine/HomeView.jsx`
- `src/vitrine/components/*`
- `src/kit/marketplace/CategoryLegacyExperienceIsland.jsx`
- `src/kit/marketplace/GalleryCardActionsIsland.jsx`
- `src/kit/marketplace/categoryCatalogLoader.js`

Regle: ces chemins ne doivent pas redevenir des imports de routes publiques. Le gate `npm run next:routes` doit continuer a echouer si une route publique les rebranche.

## Patch roadmap precise

### P0 - Gates de verite build

But: eviter les faux positifs entre intention code, manifest interne et classification Next.

Actions:
- ajouter un script `scripts/check-next-route-classification.cjs` ou etendre `perf:budget`;
- parser la sortie `next build` ou une source `.next` fiable pour verifier:
  - `/galerie` et `/a-propos` en `STATIC`;
  - `/categorie/[categoryId]` et `/produit/[slugOrId]` en `SSG`;
  - `/devis` documente comme `DYNAMIC` tant qu'il lit le cookie theme;
- echouer si `ClientApp`, `HomeView` ou `CategoryLegacyExperienceIsland` redeviennent importes par une route publique.

Gates:
- `npm run build`
- `npm run perf:budget`
- nouveau gate route-classification

### P1 - Retrait legacy mort

But: retirer les faux residus de l'architecture active sans casser l'UI publique ou le backoffice.

Actions:
- verifier par `rg` qu'aucune route publique ni surface admin active ne les importe;
- supprimer les fichiers orphelins confirmes;
- interdire leur reimport par les routes publiques via le gate `next:routes`;
- garder les rapports historiques, mais mettre a jour les docs operationnelles si elles mentionnent ces fichiers comme actifs.

Gates:
- `rg -n "HomeView|CategoryLegacyExperienceIsland" app src scripts`
- `npm run next:routes`
- `npm run lint`
- `npm run build`

### P2 - `/devis` en ISR statique

But: transformer la derniere route publique SEO dynamique en rendu statique/ISR si le design accepte un SSR light par defaut.

Cause actuelle:
- `app/devis/page.jsx` appelle `getServerDarkMode()`;
- `getServerDarkMode()` lit `cookies()`.

Actions:
- retirer la lecture cookie serveur de `/devis`;
- rendre `QuoteRequestServerView` en theme serveur par defaut stable;
- laisser le script theme global corriger la classe client si l'utilisateur a choisi dark mode;
- option: ajouter une petite ile theme si un controle visuel est necessaire.

Gates:
- `npm run build` doit afficher `/devis` en `STATIC` avec revalidate si ajoute;
- `npm run perf:quote-direct`
- controle visuel dark/light rapide.

### P3 - Reduction hydration galerie

But: garder la galerie ISR et le design actuel, mais baisser le JS initial et les long tasks.

Cibles:
- `GalleryMobileShellIsland` reste necessaire tant que le contrat mobile existe;
- `GalleryGridActionsIsland` centralise maintenant les actions de grille par delegation;
- sections basses et carousels ajoutent des iles client.

Actions:
- remplacer les actions repetitives de carte par une ile parent de grille avec delegation d'evenements;
- charger wishlist/panier par intention ou idle, pas par carte;
- garder le prefetch produit avec garde-fous `saveData`, reseau lent et concurrence bornee;
- differer les sections basses interactives a proximite viewport.

Gates:
- `npm run perf:gallery-direct`
- `npm run perf:scroll`
- `npm run perf:scroll:newsletter`
- `npm run mobile:contract`
- budget cible `/galerie` sous 165 kB JS gzip.

### P4 - Decoupage shell produit

But: garder la fiche produit SSG mais reduire le gros client shell.

Cible:
- `ProductDetailShellIsland` porte encore beaucoup d'interactions dans un seul client component.

Actions:
- extraire `ProductImageGalleryIsland`;
- charger `ProductLightboxIsland` uniquement au clic/zoom;
- garder `ProductDetailActionsIsland` separe pour panier/favori;
- verifier que le HTML serveur conserve titre, prix, images, sections et JSON-LD.

Gates:
- `npm run perf:product-direct`
- `npm run perf:product-images`
- `npm run mobile:contract`
- budget cible produit sous 112 kB JS gzip.

### P5 - Donnees produit ciblees

But: eviter qu'une fiche produit froide paie un catalogue complet.

Actions:
- ajouter un endpoint public cible ou mode `publicCatalog?id=...`;
- adapter `getProductViaPublicCatalog` pour lire un seul produit;
- conserver fallback Admin borne et fallback REST;
- tagger cache `product:*` et revalidation admin.

Gates:
- `npm run perf:product-direct`
- mesure froide avec proxy local invalide et sans proxy;
- verifier qu'un produit publie modifie se met a jour apres revalidation.

### P6 - CSS/fonts/preconnect

But: sortir de la marge fragile CSS publique.

Actions:
- auditer les six familles `next/font` chargees au layout;
- conserver seulement les polices utiles globalement, deplacer les autres vers routes/sections;
- reviser le preconnect Firestore global si aucune route publique statique ne fait de Firestore initial client;
- fixer un budget CSS public plus strict apres reduction.

Gates:
- `npm run perf:budget`
- cible CSS publique sous 50-52 kB gzip.

## Priorite recommandee

1. P0 pour verrouiller la preuve.
2. P1 pour archiver les residus morts sans les rebrancher.
3. P2 pour rendre `/devis` statique/ISR.
4. P3 galerie, car c'est la route publique la plus lourde.
5. P4 produit pour reduire l'hydratation.
6. P5 data produit froide.
7. P6 CSS/fonts.

## Avancement application - 2026-06-10

Fait:

- P0: gate `npm run next:routes` ajoute via `scripts/check-next-route-classification.cjs`.
- P1: fichiers legacy publics orphelins retires le 2026-06-13 (`HomeView.jsx`, `src/vitrine/components/*`, `CategoryLegacyExperienceIsland.jsx`, `GalleryCardActionsIsland.jsx`, `categoryCatalogLoader.js`) et imports publics interdits par le gate.
- P2: `/devis` ne lit plus `getServerDarkMode()` cote serveur; la route est maintenant `STATIC`, revalidate 5m au build.
- P3 premiere passe: les actions galerie ne montent plus une ile React par carte; `GalleryGridActionsIsland` centralise wishlist, panier, prefetch et warmup par delegation d'evenements.
- P5 premiere passe: `publicCatalog` accepte un `id` produit cible dans le code Functions public, et `getPublicProduct` le demande avant fallback Admin/REST. Tant que la Function n'est pas redeployee, le code reste compatible avec l'ancien retour catalogue complet.
- P6 premiere passe: retrait des polices globales non referencees `Newsreader`, `Manrope`, `Playfair`; retrait du preconnect Firestore global.

Reste:

- P3 suite: mesurer le scroll froid apres delegation galerie et descendre `/galerie` sous 165 kB JS gzip.
- P4: decouper `ProductDetailShellIsland` sans casser zoom/swipe/bottom sheet mobile.
- P5 suite: redeployer `functions-public` pour activer vraiment la lecture produit ciblee.
- P6 suite: reduire le CSS public sous 52 kB gzip; la premiere passe descend seulement a environ 54.00 kB.
- Nettoyage legacy public phase 2 effectue le 2026-06-13; les prochaines suppressions doivent cibler seulement les scripts/docs/tooling prouves hors flux Next SSR.

## Definition de pret SEO/perf

Le clone pourra etre considere pret pour une passe SEO intensive quand:

- toutes les routes publiques SEO affichent le contenu utile sans `ClientApp`;
- `/`, `/galerie`, `/a-propos`, `/categorie`, `/produit`, `/devis`, `/sitemap.xml` sont gates;
- les fichiers legacy morts sont retires ou explicitement documentes comme hors flux actif;
- `/galerie` passe sous 165 kB JS gzip ou la depassement est justifie;
- CSS public descend sous 52 kB gzip;
- le parcours galerie -> produit -> retour reste valide mobile et desktop.
