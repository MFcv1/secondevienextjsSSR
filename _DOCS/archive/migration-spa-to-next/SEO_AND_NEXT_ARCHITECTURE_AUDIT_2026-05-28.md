# SEO and Next Architecture Audit - 2026-05-28

## Resume executif

Audit realise sur le clone local `SecondevieNextjsSSR` le 2026-05-28, avec lecture prealable de `AGENTS.md`, `_DOCS/architecture/NEXTJS_SEO_ROADMAP.md` et `_DOCS/perf/NEXTJS_OPTIMIZATION_ROADMAP.md`. Aucune ecriture Firestore/admin n'a ete faite. Les seules modifications de repo prevues par ce livrable sont la creation de ce rapport et la mise a jour de la carte `AGENTS.md`.

Score global estime : **Bon, avec dette architecture importante**.

Le site profite deja de Next.js sur les pages SEO principales : HTML initial indexable, metadata App Router, sitemap dynamique, JSON-LD metier, categories et produits en ISR 300 secondes. Le point faible majeur n'est pas l'absence de SSR, mais le fait que l'ancien shell SPA reste monte sur plusieurs routes publiques apres hydratation. Cela peut dupliquer les H1, modifier le `<head>`, charger trop de JavaScript et brouiller la structure DOM que Google ou les outils de qualite analysent apres rendu JavaScript.

Le risque SEO le plus concret observe localement est `/devis` : le HTML initial a une canonical correcte vers `/devis`, puis le legacy `SEO` client la remplace apres hydratation par `/#devis`. C'est un probleme architecture + SEO, pas seulement un detail de metadata.

## Cadre d'evaluation

### Ce que les docs officielles Google disent

- Le contenu utile, les liens explorables et les titres/descriptions doivent etre descriptifs, coherents et accessibles aux robots. Source : [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
- Google peut executer JavaScript, mais les bonnes pratiques JavaScript SEO demandent des URLs propres, des liens crawlables, du contenu rendu correctement et une gestion prudente des changements de DOM/head par JS. Source : [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
- Les title links sont influences par `<title>`, H1 et textes visibles ; les titres doivent etre distinctifs et eviter le bourrage ou les valeurs generiques. Source : [Title links](https://developers.google.com/search/docs/appearance/title-link).
- Les meta descriptions peuvent etre utilisees pour les snippets ; elles doivent resumer la page et eviter les duplications generiques. Source : [Snippets / meta descriptions](https://developers.google.com/search/docs/appearance/snippet).
- Pour l'e-commerce, les donnees structurees doivent representer fidelement les produits, prix, disponibilites et pages liste/detail. Sources : [Ecommerce structured data](https://developers.google.com/search/docs/specialty/ecommerce/include-structured-data-relevant-to-ecommerce) et [Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product-snippet).
- Les URLs e-commerce doivent etre stables, propres et eviter les duplications de facettes/categories inutiles. Source : [Ecommerce URL structure](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites).
- `robots.txt` controle le crawl, pas l'indexation garantie, et ne doit pas servir de mecanisme de confidentialite. Source : [robots.txt introduction](https://developers.google.com/search/docs/crawling-indexing/robots/intro).
- Les canonicals servent a consolider les doublons ; le sitemap devrait contenir les URLs canoniques et utiles. Sources : [Canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) et [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview).

### Ce que les docs officielles Next.js disent

- L'App Router structure les routes via le dossier `app/`, avec Server Components par defaut. Source : [App Router](https://nextjs.org/docs/app).
- Les Client Components sont declares via `"use client"` et doivent etre limites aux surfaces interactives. Source : [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components).
- Next fournit plusieurs couches de cache et de revalidation, dont `revalidate`, `revalidateTag` et `revalidatePath`. Source : [Caching / revalidating](https://nextjs.org/docs/app/building-your-application/caching).
- `generateStaticParams` permet de prerendre des routes dynamiques au build ; `dynamicParams` controle le comportement des parametres non generes. Sources : [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) et [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config).
- Les guides de migration recommandent de migrer progressivement depuis Pages Router/SPA, mais le benefice App Router vient surtout du rendu serveur et du decoupage client. Sources : [Migrating to App Router](https://nextjs.org/docs/15/pages/guides/migrating/app-router-migration), [Migrating guides](https://nextjs.org/docs/app/guides/migrating), [Single Page Applications in Next.js](https://nextjs.org/docs/app/guides/single-page-applications).
- Les imports de packages peuvent etre optimises, mais les gros modules client restent a isoler structurellement. Source : [Package bundling](https://nextjs.org/docs/pages/building-your-application/optimizing/package-bundling).

### Bonnes pratiques techniques utilisees dans cet audit

- Une page SEO importante doit rester coherente entre HTML initial, DOM hydrate, canonical, H1, JSON-LD et sitemap.
- Les champs admin qui touchent title, slug, canonical, noindex, prix, stock ou sitemap doivent etre controles par validations, preview, revalidation et historique.
- Les pages privees peuvent rester client-first si elles sont `noindex`, mais elles ne doivent pas polluer les pages publiques par un shell global.

### Hypotheses a valider hors audit local

- Les choix exacts d'indexation des produits vendus doivent etre valides dans Search Console et avec la strategie business : conserver les produits vendus peut capter de la longue traine, mais peut aussi frustrer si beaucoup de pages sont indisponibles.
- Les scores PageSpeed reels doivent etre relances sur la sandbox/production apres deploiement, car l'audit local mesure surtout la structure.
- Les erreurs et duplications observees apres hydratation doivent etre confirmees dans l'environnement public servi par App Hosting, meme si elles proviennent de code local actuel.

## Ce qui est deja solide

- Les routes SEO publiques principales existent dans `app/` et renvoient du HTML initial utile : home, a-propos, devis, categories, produits.
- Le build Next prerenderise les categories et un echantillon de produits, avec `revalidate = 300` sur home, categories, produits et sitemap.
- Le sitemap dynamique contient 50 URLs et toutes les URLs testees localement retournent HTTP 200.
- Les routes privees/tunnels renvoient `noindex, nofollow`.
- Les produits faibles sont deja detectes par `isWeakSeoProduct` et peuvent passer en `noindex`.
- Le code evite une `Offer` JSON-LD incomplete quand le produit est explicitement `priceOnRequest`.
- L'invalidation admin appelle l'endpoint Next `api/revalidate-catalog` apres sauvegarde produit.

## Points faibles critiques

1. **Canonical `/devis` cassee apres hydratation**
   - Preuve runtime : HTML initial `/devis` canonical `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/devis`, puis DOM hydrate canonical `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/#devis`.
   - Cause probable : le composant legacy `SEO` est encore rendu par `src/app.jsx` et recoit une vue `quote` transformee en `/#devis`.
   - Preuves code : `src/app.jsx:1444-1446` rend `<SEO ... />`; `app/devis/page.jsx:47-101` rend une vraie couche SSR puis `<ClientApp defer ... />`.
   - Risque : Google peut voir une page de devis SSR utile puis une canonical hydratee qui consolide vers la home.

2. **Legacy SPA montee sur des routes publiques SEO**
   - Preuve runtime produit direct : apres hydratation `/produit/armoire-30zeGFFcGWnBkK44YHZj`, H1 observes : `Armoire`, `Mobilier ancien restaure...`, `Armoire`, avec `galleryShell: true`.
   - Preuve code : `app/produit/[slugOrId]/page.jsx:213` rend `<ClientApp />` sans defer ; `src/Router.jsx` contient encore les routes galerie/detail/category/admin legacy ; `src/app.jsx:1895-1901` enveloppe tout le shell legacy dans `AuthProvider`.
   - Risque : duplication H1/JSON-LD, JS inutile, contenu et scroll geres par l'ancien shell alors que la page a deja un fallback SSR.

3. **Categories vides ou redondantes dans le sitemap**
   - Preuve crawl : `/categorie/eclairage` et `/categorie/deco` retournent 200 et sont dans le sitemap, mais 0 produit dans le contenu SSR observe.
   - Preuve sitemap : 13 categories incluses, dont `/categorie/decorations` et `/categorie/deco`.
   - Risque : pages faibles, duplication semantique, dilution du crawl budget.

4. **Produits tres faibles encore indexables si le titre n'est pas faible**
   - Preuve crawl : `/produit/buffet-bU407t3vFKcMq2UJ1wQL` retourne 200, meta description `Jjj`, texte SSR court, et reste indexable.
   - Preuve code : `src/lib/server/products.js:41-62` detecte surtout les titres faibles (`dd`, `bu`, `test`, etc.), pas la qualite minimale description/prix/image.
   - Risque : pages produit pauvres dans le sitemap, snippets faibles, signaux qualite bas.

## Points faibles importants

- Les routes privees `noindex` heritent d'une canonical vers la home. Ce n'est pas critique si elles restent noindex, mais c'est incoherent.
- Les pages `/a-propos`, `/devis`, categories et produits peuvent dupliquer les H1 apres hydratation.
- Plusieurs images produit SSR visuelles n'ont pas de dimensions explicites dans `app/produit/[slugOrId]/page.jsx:195-210`; l'image sr-only en a, mais pas le preview visible.
- Le build local annonce `Environments: .env.production` meme quand les commandes npm chargent `.env.sandbox`. Les URLs publiques generees pointent bien vers la sandbox, mais cette ligne merite une verification de discipline env.
- `robots.txt` ne disallow que `/admin`; les autres tunnels sont geres par `noindex`. C'est acceptable, mais doit rester volontaire.
- Le sitemap est coherent techniquement, mais il inclut des pages dont l'utilite SEO/business est discutable.

## Opportunites SEO

- Enrichir les descriptions produits faibles et imposer une longueur minimale.
- Ajouter des textes de categorie administrables mais controles pour les categories importantes.
- Unifier `/categorie/deco` et `/categorie/decorations`, ou choisir une canonical/noindex claire.
- Ajouter des redirections stables si un slug produit change.
- Ajouter une preview SEO/admin : title, description, canonical, robots, JSON-LD et presence sitemap.
- Exploiter les produits vendus si la strategie business le justifie : page conservee indexable avec alternatives internes, ou noindex si le catalogue grossit avec beaucoup d'indisponibles.

## Audit page par page

Base testee localement : `http://127.0.0.1:4300`.

| Page | Status | Canonical | Title/H1 | SSR visible | JSON-LD | Risque |
| --- | ---: | --- | --- | --- | --- | --- |
| `/` | 200 | home sandbox | title et H1 coherents | oui, `data-ssr-home` | LocalBusiness, WebSite, CollectionPage, ItemList, FAQPage | faible a moyen : launcher legacy a surveiller |
| `/a-propos` | 200 | `/a-propos` | SSR OK, H1 duplique apres hydration | oui | AboutPage | moyen : legacy modifie title/H1 |
| `/devis` | 200 | SSR `/devis`, hydrate `/#devis` | SSR OK, H1 duplique apres hydration | oui | Service | critique : canonical hydratee incorrecte |
| `/categorie/buffets` | 200 | `/categorie/buffets` | H1 `BUFFETS`, duplique apres hydration | oui | CollectionPage, BreadcrumbList | moyen |
| `/categorie/eclairage` | 200 | `/categorie/eclairage` | H1 coherent | oui, mais 0 produit | CollectionPage, BreadcrumbList | important : page vide dans sitemap |
| `/categorie/deco` | 200 | `/categorie/deco` | H1 coherent | oui, mais 0 produit | CollectionPage, BreadcrumbList | important : redondance avec decorations |
| `/produit/armoire-30zeGFFcGWnBkK44YHZj` | 200 | produit | H1 coherent SSR puis duplique | oui | Product, BreadcrumbList | moyen/important : shell galerie hydrate |
| `/produit/buffet-bU407t3vFKcMq2UJ1wQL` | 200 | produit | title `Buffet`, description `Jjj` | faible | Product, BreadcrumbList | important : produit pauvre indexable |
| `/produit/meuble-de-metier-rD1lxm47FUolloY4ujez` | 200 | produit | H1 faible | oui | Product, BreadcrumbList | faible SEO car `noindex`, mais schema encore emis |
| `/admin` | 200 | home heritee | pas de H1 utile | client-first | non | faible SEO car `noindex`, perf privee acceptable |
| `/checkout` | 200 | home heritee | pas de H1 utile | client-first | non | faible SEO car `noindex` |
| `/wishlist` | 200 | home heritee | pas de H1 utile | client-first | non | faible SEO car `noindex` |
| `/mes-commandes` | 200 | home heritee | pas de H1 utile | client-first | non | faible SEO car `noindex` |
| `/robots.txt` | 200 | n/a | n/a | oui | n/a | faible |
| `/sitemap.xml` | 200 | n/a | n/a | oui | n/a | moyen : qualite des URLs incluses |

### Categories publiques du sitemap

Toutes les categories du sitemap ont ete testees en HTTP local et retournent 200.

| Categorie | Observation |
| --- | --- |
| `/categorie/meubles` | categorie globale utile, surveiller duplication avec toutes les fiches |
| `/categorie/assises` | categorie utile |
| `/categorie/eclairage` | 0 produit observe, page faible dans sitemap |
| `/categorie/decorations` | categorie utile selon taxonomie, a clarifier avec `/deco` |
| `/categorie/armoires` | utile |
| `/categorie/buffets` | utile |
| `/categorie/commodes` | utile |
| `/categorie/tables` | utile |
| `/categorie/chaises` | utile |
| `/categorie/fauteuils` | contient au moins un produit aussi visible cote chaises/bancs selon mapping legacy |
| `/categorie/bancs` | categorie potentiellement trop large si elle reprend des chaises |
| `/categorie/miroirs` | utile |
| `/categorie/deco` | 0 produit observe et doublon semantique probable avec decorations |

### Produits demandes

- Produit normal : `/produit/armoire-30zeGFFcGWnBkK44YHZj`, 200, Product JSON-LD, texte et image presents.
- Produit faible : `/produit/meuble-de-metier-rD1lxm47FUolloY4ujez`, 200, `robots: noindex, follow`, absent du sitemap.
- Produit tres pauvre mais indexable : `/produit/buffet-bU407t3vFKcMq2UJ1wQL`, 200, description `Jjj`.
- Produit prix sur demande : aucun produit explicitement `priceOnRequest` n'a ete trouve dans le `publicCatalog` public le 2026-05-28. Certains produits avec prix `0` affichent toutefois `Prix sur demande`, ce qui doit etre normalise.
- Produit vendu : aucun produit vendu n'a ete trouve dans le `publicCatalog` public le 2026-05-28. Le comportement vendu doit etre valide avec une fixture ou un produit sandbox.

## Audit sitemap / robots / canonical

### Robots

Extrait teste sur `/robots.txt` :

```txt
User-Agent: *
Allow: /
Disallow: /admin

Sitemap: https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/sitemap.xml
```

Preuve code : `app/robots.js:3-14` force le rendu dynamique, autorise `/`, disallow `/admin` et expose le sitemap base sur `publicEnv.siteUrl`.

Evaluation :

- Bon : le sitemap pointe vers le domaine sandbox attendu.
- Acceptable : les tunnels hors `/admin` restent crawlables mais `noindex`, ce qui permet a Google de voir le `noindex`.
- A surveiller : ne pas utiliser `robots.txt` comme protection privee ; les routes privees doivent rester protegees applicativement.

### Sitemap

Preuves crawl :

- `sitemapCount: 50`
- `categoryCount: 13`
- `productCount: 34`
- `non200: []`

Preuve code : `app/sitemap.js:52-57` lit le catalogue avec tag `catalog` et `revalidate: 300`, puis `app/sitemap.js:93-103` produit home, a-propos, devis, categories et produits.

Evaluation :

- Bon : toutes les URLs du sitemap local retournent 200.
- Moyen : le sitemap inclut des categories vides et possiblement redondantes.
- Moyen : l'inclusion produit depend surtout de `isSeoIndexableProduct`, trop faible pour detecter une fiche pauvre avec titre acceptable mais description vide/test.

### Canonicals

Preuve code : `app/layout.jsx:72-95` definit les metadata racine et la canonical `/`; les pages publiques redefinissent ensuite leur canonical dans `metadata.alternates.canonical`.

Problemes observes :

- `/devis` : canonical correcte en SSR puis remplacee par `/#devis` apres hydratation.
- Routes privees : canonical home heritee malgre `noindex`. Risque faible, nettoyage recommande.
- Produits/categories : canonical SSR coherent avec l'URL.

## Audit SSR vs Hydration

### HTML initial retourne par Next

- Home, a-propos, devis, categories et produits contiennent du texte indexable dans le HTML initial.
- Les produits faibles peuvent recevoir `robots: noindex, follow` des le rendu serveur.
- Les routes privees/tunnels n'ont pas de contenu metier SSR, ce qui est acceptable car elles sont `noindex`.

### DOM apres hydratation

- `/` est reste stable dans le test Playwright local : le launcher galerie n'a pas monte `ClientApp` sans action utilisateur.
- `/a-propos` monte le legacy apres defer et duplique le H1.
- `/devis` monte le legacy apres defer et modifie la canonical vers `/#devis`.
- `/categorie/buffets` conserve sa canonical, mais duplique le H1 apres hydratation.
- `/produit/armoire-30zeGFFcGWnBkK44YHZj` monte le shell galerie legacy et ajoute des H1/contenus qui n'appartiennent pas strictement a une page produit directe.

### Reponses aux questions SEO/architecture

- Google voit-il le bon contenu avant JavaScript ? **Oui pour les pages publiques testees**, car le HTML initial contient les contenus principaux.
- Le contenu SSR disparait-il apres hydratation ? **Pas totalement**, mais il est concurrence ou complete par le legacy, avec duplications et mutation du head.
- Le legacy shell peut-il casser H1, canonical, contenu, scroll ou structure DOM ? **Oui**, preuve concrete sur `/devis` pour canonical et sur a-propos/categories/produits pour H1.
- Les pages SEO importantes sont-elles utiles sans JS ? **Globalement oui**, mais les categories doivent etre revalidees en rendu no-JS visuel : un test Playwright a confirme le texte dans le HTML, mais le rendu visuel sans JS a donne un `innerText` nul sur une categorie, a investiguer avant de classer ce point comme bug severe.

## Audit JSON-LD

### LocalBusiness / WebSite / CollectionPage / ItemList / FAQPage

Preuve code : `app/page.jsx:288-353` construit un graph JSON-LD home.

Evaluation :

- Bon : la home combine identite locale, site, collection et FAQ.
- A surveiller : la FAQ doit rester strictement coherente avec le contenu visible. Si elle devient editable, ne pas permettre d'ajouter des FAQ invisibles ou trompeuses.

### AboutPage

Preuve code : `app/a-propos/page.jsx:32-51`.

Evaluation :

- Bon : schema simple et coherent avec la page.
- Risque faible : le legacy hydrate une autre version visuelle de la page et peut modifier les signaux title/H1.

### Service

Preuve code : `app/devis/page.jsx:30-42`.

Evaluation :

- Bon : schema `Service` adapte a une demande de devis.
- Risque critique externe au schema : canonical hydratee incorrecte.

### CollectionPage / BreadcrumbList categories

Preuve code : `src/lib/seo/categories.js:70-98`, utilise par `app/categorie/[categoryId]/page.jsx`.

Evaluation :

- Bon : `CollectionPage` et breadcrumbs sont coherents pour les categories remplies.
- Risque : `ItemList` sur categories vides ou doublonnees apporte peu de valeur.
- Recommandation : ne generer `ItemList` riche que si la categorie contient des produits pertinents ; sinon noindex ou omission sitemap.

### Product / Offer / BreadcrumbList

Preuve code : `src/lib/seo/productStructuredData.js:52-87` genere Product, et `src/lib/seo/productStructuredData.js:56-75` n'ajoute une `Offer` que si le prix est numerique et non `priceOnRequest`.

Evaluation :

- Bon : pas d'Offer incomplete pour les prix sur demande explicites.
- A corriger : un prix `0` sans `priceOnRequest` peut produire un affichage "Prix sur demande" cote SSR, mais il faut garantir que le JSON-LD, le rendu et l'admin partagent le meme etat metier.
- A corriger : les produits `noindex` faibles peuvent encore emettre Product JSON-LD. Ce n'est pas forcement interdit, mais il vaut mieux eviter un schema riche sur une page que l'on juge trop faible pour l'index.

## Audit admin editable fields

### Etat actuel

Preuves code :

- `src/kit/admin/AdminForm.jsx:93-108` expose des champs produit : nom, description, prix, materiau, couleur, dimensions, categorie, style, stock, `priceOnRequest`.
- `src/kit/admin/AdminForm.jsx:318-324` valide surtout nom/categorie.
- `src/kit/admin/AdminForm.jsx:386-417` sauvegarde le produit puis appelle l'invalidation publique avec `productId`, `category` et `path`.
- `src/kit/admin/AdminSEO.jsx:11-52` edite surtout contact/footer/social dans `sys_metadata/contact_info`; ce n'est pas encore un vrai back-office SEO page par page.
- `src/lib/server/products.js:9-39` definit les champs publics lus cote serveur.

### Matrice des champs admin SEO

| Champ | Etat actuel | Decision recommandee | Garde-fous |
| --- | --- | --- | --- |
| Title SEO produit | calcule depuis nom produit | admin editable avec validation, option avancee | 35-65 caracteres, pas vide/test/dd/bu, fallback nom |
| Meta description produit | derivee description produit | admin editable avec validation | 80-160 caracteres, pas `Jjj`, preview snippet |
| H1 produit | calcule depuis nom | computed automatically | pas d'edition libre, derive du nom canonique |
| Slug | calcule depuis nom + id | computed automatically ; override dangereux | unicite, historique, redirection ancienne URL |
| Canonical | code-owned | code-owned | jamais editable librement |
| Noindex produit | calcule automatiquement | admin editable avec validation avancee | warning si sitemap, role admin senior, raison obligatoire |
| Alt image produit | derive du nom | admin editable avec validation | alt court, descriptif, fallback automatique |
| Description produit | editable | admin editable avec validation | longueur minimale, interdiction placeholders |
| Categorie produit | editable | admin editable avec validation | taxonomie controlee, revalidation ancienne + nouvelle categorie |
| Prix | editable | admin editable avec validation | prix > 0 ou `priceOnRequest`, coherence JSON-LD |
| Prix sur demande | editable | admin editable avec validation | mutuellement coherent avec prix, preview schema |
| Stock / vendu | editable | admin editable avec validation | impact availability, sitemap/noindex selon strategie |
| Texte home | code-owned actuellement | admin editable avec validation limitee | pas de HTML libre, blocs typés |
| Texte categorie | code-owned/fallback | admin editable avec validation | longueur minimale, pas duplicat, taxonomie |
| FAQ | code-owned | admin editable avec validation stricte | questions visibles sur page, pas de schema invisible |
| OG image | computed/fallback | computed automatically, override optionnel | image existante, dimensions, poids |
| Inclusion sitemap | automatique | computed automatically | pas de toggle libre sauf noindex controle |
| Redirections slug | absent | code-owned + admin action controlee | historique, rollback, test 301 |

### Risques si l'admin modifie trop librement

- Un title vide ou generique peut produire des title links faibles.
- Une meta description de test peut etre reprise dans les snippets.
- Un slug modifie sans redirection casse les liens, le sitemap et les signaux existants.
- Un `noindex` manuel sans retrait sitemap cree une incoherence.
- Un prix, stock ou `priceOnRequest` mal renseigne peut rendre le JSON-LD trompeur.
- Une categorie changee sans revalidation ancienne + nouvelle categorie laisse des pages ISR stale.
- Du HTML libre dans home/categorie/FAQ peut casser l'accessibilite, le layout, le schema et la moderation SEO.

### Garde-fous recommandes

- Validations admin synchrones et serveur : longueur title/description, unicite slug, champs interdits, prix coherent.
- Preview Google : title, URL, snippet.
- Preview JSON-LD : Product/Offer/Breadcrumb, avec erreurs explicites.
- Warning bloquant si `noindex` + sitemap.
- Revalidation ISR apres sauvegarde, avec anciennes valeurs connues.
- Historique/versioning et rollback.
- Roles separes : edition contenu, edition SEO avancee, publication.

## Audit architecture Next.js

### Tableau routes / strategie de rendu

Donnees croisees : sortie `npm run build`, fichiers `app/`, lecture de code et crawl local.

| Route | Fichier | Build | Revalidate | generateStaticParams | dynamicParams | ClientApp | SSR utile | JSON-LD | Risque SEO | Risque perf | Recommandation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | `app/page.jsx` | `○` | 300 | non | n/a | launcher/action | oui | oui | faible | moyen | garder SSR, isoler galerie client |
| `/a-propos` | `app/a-propos/page.jsx` | `○` | non | non | n/a | defer | oui | oui | moyen | moyen | empecher legacy head/H1 |
| `/devis` | `app/devis/page.jsx` | `○` | non | non | n/a | defer | oui | oui | critique | moyen | corriger canonical legacy |
| `/categorie/[categoryId]` | `app/categorie/[categoryId]/page.jsx` | `●` | 300 | oui | false | defer | oui | oui | moyen | moyen | filtrer categories vides, reduire legacy |
| `/produit/[slugOrId]` | `app/produit/[slugOrId]/page.jsx` | `●` + fallback | 300 | oui, limite 160 | true | immediat | oui | oui | moyen/haut | haut | remplacer shell SPA par island produit |
| `/admin` | `app/admin/page.jsx` | `ƒ` | non | non | n/a | immediat | non | non | faible noindex | acceptable prive | conserver client |
| `/checkout` | `app/checkout/page.jsx` | `ƒ` | non | non | n/a | immediat | non | non | faible noindex | acceptable tunnel | conserver client |
| `/wishlist` | `app/wishlist/page.jsx` | `ƒ` | non | non | n/a | immediat | non | non | faible noindex | acceptable tunnel | conserver client |
| `/mes-commandes` | `app/mes-commandes/page.jsx` | `ƒ` | non | non | n/a | immediat | non | non | faible noindex | acceptable tunnel | conserver client |
| `/robots.txt` | `app/robots.js` | `ƒ` | non | n/a | n/a | non | oui | n/a | faible | faible | OK |
| `/sitemap.xml` | `app/sitemap.js` | `○` | 300 | n/a | n/a | non | oui | n/a | moyen | faible | filtrer qualite URLs |
| `/api/revalidate-catalog` | `app/api/revalidate-catalog/route.js` | `ƒ` | n/a | n/a | n/a | non | n/a | n/a | n/a | faible | renforcer old slug/category |

### Audit SSR / SSG / ISR / dynamic

- Home : `app/page.jsx:9` declare `revalidate = 300`. Le choix ISR est bon pour une home catalogue qui change via admin sans exiger temps reel.
- Categories : `app/categorie/[categoryId]/page.jsx:23-24` declare `revalidate = 300` et `dynamicParams = false`, avec `generateStaticParams` a `app/categorie/[categoryId]/page.jsx:48-50`. Bon choix si la taxonomie est controlee et peu variable.
- Produits : `app/produit/[slugOrId]/page.jsx:20-21` declare `revalidate = 300` et `dynamicParams = true`, avec `generateStaticParams` limite a 160 a `app/produit/[slugOrId]/page.jsx:37-44`. Bon choix pour un catalogue qui grossit, mais l'hydratation legacy annule une partie du benefice performance.
- Tunnels prives : rendu dynamique/client-first justifie si `noindex`, auth et logique panier/admin restent cote client.
- API revalidation : `app/api/revalidate-catalog/route.js:57-68` revalide tags et chemins utiles, mais depend des parametres envoyes par l'admin.

### Dynamic rendering inutile

Aucun usage evident de `cookies()`, `headers()`, `no-store` dans les pages publiques principales n'a ete observe pendant l'audit. Les rendus dynamiques observes au build concernent surtout les routes privees et metadata routes forcees.

## Audit legacy SPA

### Ou le legacy traine encore

- `app/ClientApp.jsx:6-14` importe dynamiquement `src/app.jsx` avec `ssr: false`.
- `src/app.jsx:1-24` importe le shell React legacy, `AuthProvider`, `Router`, `SEO` et providers.
- `src/Router.jsx:6-47` lazy-load encore les gros composants marketplace, admin, checkout, order, wishlist.
- `app/produit/[slugOrId]/page.jsx:213` monte `ClientApp` directement sur la route produit.
- `app/categorie/[categoryId]/page.jsx:174`, `app/a-propos/page.jsx:111`, `app/devis/page.jsx:101` montent `ClientApp defer`.

### Matrice migration

| Zone | Classement | Justification |
| --- | --- | --- |
| Admin | must remain client | auth, CRUD, Firestore, interactions lourdes |
| Checkout | must remain client | panier, paiement, etapes utilisateur |
| Wishlist / commandes | must remain client ou island | utilisateur connecte, donnees privees |
| Home SEO SSR | should become server component dominant | deja SSR, galerie interactive a isoler |
| Galerie marketplace | can be island client | filtres, scroll, animations ; pas tout le shell |
| Categories SEO | should become server component + islands cartes | contenu et liste indexables serveur |
| Produit direct | should become server component + island detail | page SEO critique, shell SPA inutile |
| SEO legacy component | dangerous for SEO/perf | modifie head/canonical apres hydratation |
| AuthProvider global legacy | legacy debt | ne doit pas etre charge pour lecture publique simple |

### Est-ce que `ClientApp defer` suffit ?

Non. `defer` limite le cout initial, mais ne resout pas la dette si le legacy finit par modifier le `<head>`, dupliquer les H1 ou charger des providers globaux non necessaires. C'est un garde-fou transitoire, pas une architecture cible.

### Est-ce que le site profite vraiment de Next.js ?

Oui, partiellement et utilement : les pages publiques ont du SSR/ISR, des metadata serveur et un sitemap. Mais le benefice est incomplet, car le legacy shell reprend la main apres hydratation sur des pages SEO importantes. La migration est donc **partielle mais acceptable**, avec priorite a la reduction du legacy sur `/devis`, produits et categories.

## Audit cache / revalidation

### Donnees serveur

Preuves code :

- `src/lib/server/products.js:133-150` lit l'endpoint `publicCatalog` avec tags Next.
- `src/lib/server/products.js:185-199` et `src/lib/server/products.js:202-260` assurent le fallback Firestore REST.
- `src/lib/server/products.js:263-301` expose `getPublicProduct` et `getPublicCatalog` via `cache()`.
- `src/lib/server/products.js:319-335` produit les params statiques.

Evaluation :

- Bon : les donnees publiques sont cacheables et lisibles sans Admin SDK obligatoire.
- Bon : tags `catalog`, `products`, `product:*`, `category:*` existent.
- Risque : `cache()` memoize dans un cycle serveur ; il faut bien compter sur les tags/revalidation pour invalider le Data Cache entre requetes.

### Revalidation admin

Preuves code :

- `src/kit/admin/publicCatalogInvalidation.js:33-50` bump la version publique et appelle `triggerCatalogRevalidation`.
- `src/kit/admin/AdminForm.jsx:413-417` transmet `productId`, `category` et `path`.
- `app/api/revalidate-catalog/route.js:57-68` revalide tags et chemins.

Risques :

- Changement de slug : pas de preuve d'une redirection ancienne URL -> nouvelle URL.
- Changement de categorie : il faut revalider l'ancienne et la nouvelle categorie ; l'endpoint sait le faire si on les lui transmet, mais l'admin doit conserver les anciennes valeurs.
- Depublication/suppression : le sitemap devrait retirer l'URL et l'ancienne page devrait devenir 404/noindex apres revalidation.
- Champs SEO admin : si ajoutes, ils doivent declencher la meme revalidation que les champs produit.

## Audit bundle / hydratation

### Commandes

`npm run build` :

```txt
Route (app)                                     Size  First Load JS  Revalidate
○ /                                        2.71 kB         110 kB          5m
○ /a-propos                                1.64 kB         108 kB
● /categorie/[categoryId]                  6.68 kB         113 kB          5m
● /produit/[slugOrId]                      1.64 kB         105 kB          5m
ƒ /admin                                   1.64 kB         105 kB
ƒ /api/revalidate-catalog                    145 B         104 kB
```

`npm run perf:budget` :

```txt
home SSR: 107.68 kB JS gzip, 53.32 kB CSS gzip
product SSR: 103.31 kB JS gzip, 53.32 kB CSS gzip
category SSR: 111.56 kB JS gzip, 53.32 kB CSS gzip
largest deferred/static JS: 102.67 kB gzip
largest CSS file: 51.77 kB gzip
OK Next performance budget passed.
```

### Constats

- Les budgets locaux passent, mais le CSS global reste charge sur toutes les routes publiques.
- Le legacy `ClientApp` peut charger Firebase/Auth, marketplace, admin lazy chunks, animations et providers apres hydratation.
- Le produit direct est le point le plus couteux structurellement : il a une page SSR, mais monte aussi l'app SPA.
- Le build optimise `lucide-react` via `next.config.mjs`, mais les gros gains restants viennent du decoupage architectural, pas d'un bundler switch.

### Imports lourds a surveiller

Recherche locale sur `app` et `src` : `firebase`, `stripe`, `framer-motion`, `gsap`, `recharts`, `three`, `AnalyticsProvider`, `AuthProvider`. Ces imports sont legitimes dans certaines zones, mais ne doivent pas remonter dans les routes publiques SEO tant qu'une island suffit.

## Risques SEO lies a l'architecture

- Canonical et title peuvent etre corrects en SSR puis modifies par legacy.
- Les H1 peuvent etre dupliques apres hydratation.
- Le JSON-LD peut etre emis deux fois ou rester present sur des pages `noindex` faibles.
- Le sitemap peut exposer des pages que le rendu metier considere pauvres.
- Le legacy peut masquer ou remplacer des contenus SSR que Google avait deja dans le HTML initial.

## Risques performance lies a l'architecture

- Hydratation inutile sur produits/categories directes.
- Providers globaux legacy trop hauts dans l'arbre client.
- CSS global partage important.
- Chunks marketplace et animations charges pour des pages qui pourraient etre principalement serveur.
- Comparaison route produit directe vs galerie SPA defavorable : la route directe devrait etre plus legere que la galerie, mais monte encore le shell.

## Qualite de migration Next.js

### Deja bien migre Next

- Metadata root et par page.
- Home SSR/ISR.
- Sitemap et robots.
- Categories prerenderisees.
- Produits prerenderises avec fallback dynamique.
- Couche serveur `src/lib/server/products.js`.

### Migration partielle correcte

- `/a-propos` et `/devis` ont un fallback SSR utile, mais montent encore le legacy.
- Categories ont une vraie couche SSR, mais hydratent le legacy.

### Legacy acceptable temporairement

- Admin, checkout, wishlist, commandes.
- Galerie interactive si elle reste une island et ne pollue pas le head.

### Legacy a reduire rapidement

- Produit direct.
- `SEO` legacy sur pages App Router.
- AuthProvider global sur pages publiques hydratables.

### Architecture a risque

- Rendre trop de champs SEO librement editables sans validation.
- Ne pas tracer les anciens slugs.
- Laisser le sitemap pilote seulement par existence produit/categorie sans score de qualite.

## Roadmap priorisee

### P0 critique

1. Corriger la canonical hydratee de `/devis`.
   - Patch recommande : rendre le composant legacy `SEO` no-op sur les routes App Router publiques deja couvertes par metadata serveur, ou lui interdire de modifier canonical/title quand `data-ssr-*` existe.
2. Empecher les duplications H1/head sur `/a-propos`, `/devis`, categories et produits.
3. Retirer ou noindex les categories vides du sitemap (`eclairage`, `deco`) tant qu'elles n'ont pas de contenu utile.

### P1 important

1. Durcir `isSeoIndexableProduct` : description minimale, prix coherent, image presente, exclusion placeholders.
2. Remplacer le montage `ClientApp` produit direct par une island produit ciblee.
3. Ajouter validations admin SEO produit : title, description, slug, prix, stock, `priceOnRequest`.
4. Revalider ancienne + nouvelle categorie et gerer une table de redirections slug.
5. Nettoyer canonical des tunnels noindex.

### P2 amelioration

1. Ajouter textes categories administrables mais typés et valides.
2. Ajouter previews Google et JSON-LD dans l'admin.
3. Ajouter tests automatises SSR vs hydrated head/H1/canonical.
4. Ajouter audit sitemap qui echoue si une URL sitemap est `noindex`, vide ou 404.
5. Isoler CSS critiques publics et reduire CSS global.

### P3 long terme

1. Construire une couche CMS controlee plutot que du HTML libre.
2. Migrer les composants marketplace publics en Server Components + islands.
3. Ajouter RUM et suivi Search Console pour arbitrer produits vendus/indexables.
4. Ajouter bundle analyzer en option CI, sans l'imposer au dev quotidien.

## Patch recommande

Ce rapport ne modifie pas le code fonctionnel. Les patchs recommandes, dans l'ordre :

1. **Patch head/canonical legacy**
   - Dans `src/app.jsx`, ne pas rendre le composant `SEO` legacy pour les routes couvertes par App Router metadata (`/`, `/a-propos`, `/devis`, `/categorie/*`, `/produit/*`).
   - Ajouter un test Playwright qui compare canonical SSR et hydrated pour `/devis`.

2. **Patch sitemap qualite**
   - Filtrer les categories vides dans `app/sitemap.js`.
   - Ajouter une fonction serveur de score qualite produit avant inclusion sitemap.

3. **Patch produit direct**
   - Remplacer `<ClientApp />` dans `app/produit/[slugOrId]/page.jsx` par une island detail produit minimale.
   - Conserver wishlist/lightbox en Client Components, pas le shell galerie complet.

4. **Patch admin SEO**
   - Ajouter validations et preview avant publication.
   - Revalidation avec anciennes valeurs conservees.

## Commandes executees et resultats

```txt
npm run lint
Resultat: OK, eslint sans erreur.
```

```txt
npm run build
Resultat: OK apres arret d'un ancien serveur local et rebuild propre de .next.
Observation: Next.js 15.5.18, 54 pages generees, routes publiques principales en static/SSG/ISR.
```

```txt
npm run seo:check
Premier passage: echec sur 127.0.0.1:3000 a cause d'un ancien serveur local servant un build .next incomplet.
Deuxieme passage avec NEXT_SSR_CHECK_BASE_URL=http://127.0.0.1:4300: OK.
Routes verifiees: /, /a-propos, /produit/meuble-de-metier-rD1lxm47FUolloY4ujez, /categorie/buffets.
```

```txt
npm run perf:budget
Resultat: OK.
home SSR 107.68 kB JS gzip, product SSR 103.31 kB, category SSR 111.56 kB, CSS public 53.32 kB.
```

```txt
Crawl sitemap local
Resultat: 50 URLs, 13 categories, 34 produits, 0 URL non-200.
```

```txt
Crawl publicCatalog sandbox
Resultat: 37 produits publics, aucun produit explicitement priceOnRequest ou vendu trouve le 2026-05-28.
```

## Extraits DOM et preuves runtime

```txt
/devis
SSR canonical: https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/devis
Hydrated canonical: https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/#devis
```

```txt
/produit/armoire-30zeGFFcGWnBkK44YHZj apres hydratation
H1: ["Armoire", "Mobilier ancien restaure...", "Armoire"]
galleryShell: true
jsonLdCount: 3
```

```txt
/robots.txt
User-Agent: *
Allow: /
Disallow: /admin
Sitemap: https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/sitemap.xml
```

## References Google officielles citees

- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Title links](https://developers.google.com/search/docs/appearance/title-link)
- [Snippets / meta descriptions](https://developers.google.com/search/docs/appearance/snippet)
- [Ecommerce structured data](https://developers.google.com/search/docs/specialty/ecommerce/include-structured-data-relevant-to-ecommerce)
- [Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)
- [Ecommerce URL structure](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites)
- [robots.txt introduction](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)

## References Next.js officielles citees

- [App Router](https://nextjs.org/docs/app)
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Caching / revalidating](https://nextjs.org/docs/app/building-your-application/caching)
- [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [Migrating to App Router](https://nextjs.org/docs/15/pages/guides/migrating/app-router-migration)
- [Migrating guides](https://nextjs.org/docs/app/guides/migrating)
- [Single Page Applications in Next.js](https://nextjs.org/docs/app/guides/single-page-applications)
- [Package bundling](https://nextjs.org/docs/pages/building-your-application/optimizing/package-bundling)

## Recommandations finales

Le modele actuel est viable pour continuer la migration, mais pas comme architecture cible definitive. Les pages SEO importantes sont suffisamment presentes dans le HTML initial pour que Next.js apporte un vrai gain par rapport a une SPA pure. En revanche, la dette legacy peut encore casser des signaux SEO apres hydratation, comme le montre `/devis`.

La priorite n'est pas de tout rendre editable dans l'admin. La bonne direction est un systeme robuste : defaults automatiques, champs avances verrouilles, validations strictes, preview SEO/JSON-LD, revalidation ISR fiable, historique et rollback. Cote architecture, il faut transformer les routes publiques en Server Components avec islands client ciblees, et reserver le shell SPA complet aux tunnels prives ou aux workflows vraiment interactifs.
