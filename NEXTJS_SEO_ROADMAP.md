# Next.js SEO roadmap - Seconde Vie SSR

Date: 2026-05-15

## Objectif

Amener le clone Next.js SSR au meilleur niveau SEO raisonnable pour un catalogue e-commerce public: HTML serveur fiable, canonicals stables, sitemap exact, donnees structurees coherentes, pages indexables utiles, et cout d'hydratation public sous controle.

Cette roadmap complete `NEXTJS_OPTIMIZATION_ROADMAP.md`. Elle ne remplace pas les gates existants: chaque passe doit rester mesurable avec `npm run build`, `npm run seo:check`, et si le changement touche le parcours public ou la performance, `npm run perf:architecture`.

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
   - Decision courante: conserver les variantes Firebase comme source de verite; voir `NEXTJS_IMAGE_PIPELINE_AUDIT.md`.

3. Nettoyer les scripts legacy Vite non applicables au clone Next.
   - `scripts/check-performance-budget.cjs` est adapte au build Next `.next`.
   - `scripts/measure-preview-network.py` reste legacy Vite et l'annonce dans son aide; utiliser `npm run perf:architecture` pour le comparatif SSR/SPA.

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
- `scripts/measure-preview-network.py` annonce explicitement son statut legacy Vite et renvoie vers les gates Next.
- Le nouveau script verifie les budgets JS/CSS initiaux des routes SSR publiques home, produit, categorie et devis, plus le tunnel admin.
- Il garde aussi des garde-fous SEO/runtime: absence de l'ancien domaine `secondevie-a0745.web.app`, absence de `public/robots.txt`, et absence de `/_next/image` dans les sorties serveur tant que les variantes Firebase sont la strategie image retenue.
- `package.json` expose maintenant `npm run perf:budget`.
- Validation: `npm run perf:budget` OK sur le build `.next` courant. Mesures principales: routes publiques a 106-112 kB JS gzip initial, CSS initial 50.49 kB gzip, plus gros chunk JS differe 114.81 kB gzip, plus gros CSS 44.69 kB gzip.

Reste a traiter dans une passe ulterieure:

- isoler plus finement panier/wishlist/auth/lightbox pour eviter de charger toute la SPA sur les routes SEO;
- decision image Next long terme seulement si les mesures montrent que le pipeline Firebase variants devient insuffisant;
- ajouter une mesure terrain/RUM ou Lighthouse ciblee LCP/INP/CLS apres deploiement App Hosting.
