# Next.js SEO roadmap - Seconde Vie SSR

Date: 2026-05-15

## Objectif

Amener le clone Next.js SSR au meilleur niveau SEO raisonnable pour un catalogue e-commerce public: HTML serveur fiable, canonicals stables, sitemap exact, donnees structurees coherentes, pages indexables utiles, et cout d'hydratation public sous controle.

Cette roadmap complete `_DOCS/perf/NEXTJS_OPTIMIZATION_ROADMAP.md`. Elle ne remplace pas les gates existants: chaque passe doit rester mesurable avec `npm run build`, `npm run seo:check`, et si le changement touche le parcours public ou la performance, `npm run perf:architecture`.

## Baseline du 2026-05-15

Audit effectue avec agents specialises et verification runtime locale:

- `npm run lint`: OK.
- `npm run build`: OK hors sandbox apres `spawn EPERM`; 55 pages generees.
- `npm run seo:check`: OK pour home, a-propos, produit et categorie.
- Home, produit et categorie contiennent H1, canonical, metadata, images et JSON-LD dans le HTML initial.
- Les produits publies sont SSG/ISR avec `generateStaticParams` et `revalidate = 300`.
- Probleme runtime confirme: `/robots.txt` servi provenait du fichier statique `public/robots.txt` et pointait vers l'ancien domaine `secondevie-a0745.web.app`.
- Probleme confirme: `/devis` etait indexable mais sans contenu SSR metier significatif.

## Priorites

### S0 - Corrections critiques

1. Aligner `metadataBase`, `robots`, sitemap et canonicals sur la meme source d'environnement.
   - Utiliser les fallbacks `NEXT_PUBLIC_*` puis `VITE_*` deja centralises cote serveur.
   - Eviter tout fallback `localhost` en build deploye configure.
   - Supprimer ou neutraliser le conflit entre `public/robots.txt` et `app/robots.js`.

2. Donner un statut SEO clair a `/devis`.
   - Option retenue par defaut: page SSR indexable minimale, car elle est liee depuis `/a-propos` et correspond a une intention commerciale utile.
   - Alternative si la page devient purement tunnel prive: `robots: { index: false, follow: true }`.

### S1 - Donnees structurees et sitemap

1. Nettoyer `Product` JSON-LD.
   - Ne pas publier une `Offer` incomplete sans prix.
   - Garder `availability` coherent avec `sold` et `stock`.
   - Garder URL, image, SKU et description dans le HTML initial.

2. Completer les breadcrumbs.
   - Produit: `Galerie > Categorie > Produit` quand la categorie est connue.
   - Categorie: ajouter un `BreadcrumbList` simple.

3. Stabiliser le sitemap.
   - Eviter `new Date()` pour home/a-propos si aucun contenu n'a change.
   - Documenter la limite produits actuelle.
   - Prevoir `generateSitemaps` ou pagination si le catalogue depasse 120 produits publies.

### S2 - Hydratation et performance SEO indirecte

1. Reduire le poids du legacy `ClientApp` sur les routes SEO publiques.
   - Court terme: garder le fallback SSR robuste.
   - Moyen terme: isoler panier/wishlist/auth/lightbox et ne monter que l'interactivite necessaire.
   - Mesurer JS, INP et LCP avant/apres.

2. Clarifier la strategie images Next.
   - `images.unoptimized: true` signifie que `formats`, `qualities` et `minimumCacheTTL` ne donnent pas le meme gain qu'un pipeline `/_next/image`.
   - Continuer a servir les variantes Firebase adaptees tant que ce choix est volontaire.
   - Decision courante: conserver les variantes Firebase comme source de verite; voir `_DOCS/images/NEXTJS_IMAGE_PIPELINE_AUDIT.md`.

3. Nettoyer les scripts legacy Vite non applicables au clone Next.
   - `scripts/check-performance-budget.cjs` est adapte au build Next `.next`.
   - Les anciens scripts reseau Vite ont ete retires du flux actif le 2026-06-13; utiliser `npm run perf:budget`, `npm run perf:architecture` et les audits direct-refresh.

## Gates de validation

Apres chaque correction SEO:

```powershell
npm run lint
npm run build
$env:NEXT_SSR_CHECK_BASE_URL='http://127.0.0.1:4300'
npm run seo:check
```

Verification runtime recommandee:

```powershell
Invoke-WebRequest http://127.0.0.1:4300/robots.txt | Select-Object -Expand Content
Invoke-WebRequest http://127.0.0.1:4300/sitemap.xml | Select-Object -Expand Content
```

Pour une passe qui touche le rendu public ou le JS:

```powershell
npm run perf:budget
npm run perf:architecture
```

## Journal d'avancement

### 2026-05-15 - Audit initial

- Agents lances:
  - documentation officielle Next.js SSR/SEO;
  - audit App Router et SEO;
  - audit rendering/assets.
- Conclusion: socle SSR solide sur home, categorie et produit; principaux ecarts sur robots, env/canonical, `/devis`, JSON-LD, sitemap et hydratation legacy.

### 2026-05-15 - Corrections S0/S1

- `app/layout.jsx` utilise maintenant `publicEnv`, donc les metadata racine partagent les fallbacks `NEXT_PUBLIC_*` puis `VITE_*`.
- `app/robots.js` utilise `publicEnv.siteUrl`; le fichier statique conflictuel `public/robots.txt` a ete supprime pour laisser Next servir la metadata route.
- `/devis` a recu une couche SSR indexable: H1, contenu metier, canonical, liens internes et JSON-LD `Service`; le `ClientApp` reste monte pour l'experience interactive.
- `src/lib/seo/categories.js` centralise les entrees categories, les IDs legacy et les schemas categorie.
- Les pages categorie injectent maintenant un `CollectionPage` plus explicite et un `BreadcrumbList`.
- Le JSON-LD produit a ete durci: `@id`, images absolues, prix normalise, pas d'`Offer` incomplete en prix sur demande, stock numerique, condition occasion, vendeur et breadcrumb avec categorie.
- `app/sitemap.js` pagine `publicCatalog`, inclut `/devis`, evite les `lastModified` artificiels et reutilise la logique categorie partagee.

### 2026-05-15 - Correction S2 hydration initiale

- `app/ClientApp.jsx` accepte maintenant `defer`: le legacy shell n'est monte qu'apres une premiere interaction ou un idle court.
- Les routes SEO produit, categorie et devis utilisent `ClientApp defer`; la home `/` garde volontairement `ClientApp` immediat pour conserver l'entree historique preloader puis galerie.
- `src/app.jsx` pose `data-sv-client-hydrated="true"` uniquement quand l'app legacy est reellement chargee; le fallback SSR n'est donc plus masque pendant l'attente du chunk legacy.
- Les routes sans fallback SSR metier, comme `/admin`, `/checkout`, `/wishlist` et `/mes-commandes`, gardent le chargement immediat.
- Validation runtime: les routes SEO profondes gardent leur SSR visible avant idle puis disparaissent quand le legacy shell est charge; la home `/` garde son experience visuelle historique avec preloader galerie; `/admin` garde son fallback legacy immediat.
- `npm run perf:architecture` confirme que le HTML initial Next reste bien plus indexable que la SPA et que les routes categorie/produit gardent moins de requetes et d'images que la SPA. Le JS runtime reste toutefois eleve apres chargement du legacy shell, ce qui confirme le besoin d'une isolation plus fine.

### 2026-05-16 - Budget performance Next

- `scripts/check-performance-budget.cjs` ne lit plus `dist/assets` ni les noms de chunks Vite; il inspecte maintenant `.next/app-build-manifest.json` et `.next/static`.
- Les anciens scripts reseau Vite (`measure-preview-network.py` et baseline associee) ont ete retires; les gates Next restent `perf:budget`, `perf:architecture` et les audits directs.
- Le nouveau script verifie les budgets JS/CSS initiaux des routes SSR publiques home, produit, categorie et devis, plus le tunnel admin.
- Il garde aussi des garde-fous SEO/runtime: absence de l'ancien domaine `secondevie-a0745.web.app`, absence de `public/robots.txt`, et absence de `/_next/image` dans les sorties serveur tant que les variantes Firebase sont la strategie image retenue.
- `package.json` expose maintenant `npm run perf:budget`.
- Validation: `npm run perf:budget` OK sur le build `.next` courant. Mesures principales: routes publiques a 106-112 kB JS gzip initial, CSS initial 50.49 kB gzip, plus gros chunk JS differe 114.81 kB gzip, plus gros CSS 44.69 kB gzip.

### 2026-05-28 - Roadmap audit SEO page complete

Roadmap retenue apres audit runtime de la home:

1. Consolider les signaux head de la home.
   - Ajouter `og:type=website`.
   - Utiliser une description metier accentuee et partagee entre metadata, OpenGraph, Twitter et JSON-LD.
   - Donner un alt utile au logo et aux images categories quand elles portent du contenu.

2. Restaurer une couche SSR utile sur `/a-propos`.
   - Fournir H1, contenu metier, image, canonical et JSON-LD `AboutPage`.
   - Garder `ClientApp defer` pour ne pas supprimer l'experience interactive existante.

3. Nettoyer les produits indexables du sitemap.
   - Exclure les fiches publiees mais non presentables SEO, par exemple titres techniques ou tests comme `dd`, `bu`, `test`, `demo`, `image`, `photo`.
   - Garder les categories et produits publics valides sans changer les fiches catalogue.
   - Appliquer le meme critere aux params statiques produit et poser `noindex, follow` si une URL faible reste accessible.

4. Valider par gates.
   - `npm run lint`.
   - `npm run build`.
   - `npm run seo:check` sur le serveur Next local.
   - `npm run perf:budget`.
   - Controle runtime home, `/a-propos`, `robots.txt` et `sitemap.xml`.

Application immediate:

- Home: `og:type=website`, description partagee, alt logo et alt categories corriges.
- `/a-propos`: fallback SSR indexable ajoute avec contenu atelier, image et JSON-LD.
- Produits: filtre qualite partage ajoute pour le sitemap, les params statiques et les metas `robots` des fiches faibles.
- Environnements locaux: description publique accentuee pour eviter les metas sans accents.

Reste a traiter dans une passe ulterieure:

- isoler plus finement panier/wishlist/auth/lightbox pour eviter de charger toute la SPA sur les routes SEO;
- decision image Next long terme seulement si les mesures montrent que le pipeline Firebase variants devient insuffisant;
- ajouter une mesure terrain/RUM ou Lighthouse ciblee LCP/INP/CLS apres deploiement App Hosting.

### 2026-05-29 - Retour aux vraies routes publiques Next

- Diagnostic corrige: rebrancher le shell legacy complet pour retrouver le design exact supprimait le benefice architectural Next et creait encore des etats visuels aleatoires au refresh dur.
- `/produit/[slugOrId]` rend maintenant `ProductDetailServerView`, un composant serveur qui construit la structure visible produit avec les donnees serveur, les metadata et les JSON-LD, sans monter `src/app.jsx`, `Router.jsx`, la galerie ou `LegacyAppShell`.
- Les interactions produit directes sont limitees a deux ilots client: `ProductDetailShellIsland` pour medias/miniatures/swipe/lightbox/mobile et `ProductDetailActionsIsland` pour panier/favori. Les anciens chemins directs `ProductPageExperience` et `ProductDetailRouteExperience` sont supprimes; `ArchitecturalProductDetail` reste seulement pour l'overlay detail depuis la galerie legacy.
- Les cartes produit publiques naviguent maintenant vers `/produit/...` sans ouvrir l'overlay legacy. Cela evite le double etat visuel "arrivee depuis galerie" vs "refresh dur" : les deux chemins arrivent sur la meme route produit Next native.
- `/devis` rend directement `QuoteRequestView` depuis la route Next avec metadata et JSON-LD `Service`, sans passer par `LegacyAppShell`.
- `/categorie/[categoryId]` garde son rendu SSR categorie et ne monte plus `ClientApp defer` par-dessus. Cela supprime le double rendu SSR puis SPA sur les pages categorie.
- `app/LegacyAppShell.jsx` est supprime. Les budgets et `perf:product-direct` sont remis dans le sens attendu: prouver qu'une visite directe produit charge la route produit Next native, pas le shell galerie legacy.
- `app/produit/[slugOrId]/loading.jsx` est supprime pour eviter le squelette produit visible pendant le refresh direct; le HTML initial garde seulement une preuve SEO invisible `data-ssr-product` et le detail exact streame ensuite sans page alternative visible.
- `QuoteRequestView` est maintenant une ile client explicite et n'importe plus `framer-motion`, ce qui fait retomber `/devis` a environ 113 kB JS gzip initial dans le budget Next.
- Le detail produit direct expose le meme `h1`, la meme composition image/fiche et les memes sections `La Piece` / `Informations` que l'experience produit galerie, mais avec un panneau desktop rendu serveur. `perf:product-direct` verifie maintenant l'absence du marqueur SPA legacy, de la galerie, des assets home/galerie, de la preview SSR alternative et des images `full` avant zoom.
- Le budget produit direct redescend a `111.35 kB` JS gzip initial apres retrait de l'ile historique massive. Le build mesure `/produit/[slugOrId]` a `9.84 kB` de route et `113 kB First Load JS`.
- Validations produit direct finales: `npm run lint`, `npm run mobile:contract`, `npm run build`, `npm run perf:budget`, `NEXT_BASE_URL=http://127.0.0.1:4300 npm run perf:product-direct`. Les controles precedents `/devis` et `/categorie/buffets` restent valides pour l'absence de `data-sv-client-hydrated`, de `.marketplace-gallery-shell` et de fallback public.
- Reste a poursuivre: extraire la galerie publique hors de `HomeGalleryLauncher`/`ClientApp` pour que l'entree galerie soit elle aussi une vraie surface Next, puis garder `ClientApp` uniquement pour admin/checkout/wishlist/compte ou les tunnels prives.
