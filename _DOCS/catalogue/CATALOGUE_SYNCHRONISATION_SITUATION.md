# Synchronisation catalogue, caches, navigation et images - situation

- Derniere verification: 2026-07-19
- Statut: `TEMPORARY_HANDOFF_ACTIVE`
- Proprietaire: chantier catalogue public Seconde Vie
- Document d'execution lie: [CATALOGUE_SYNCHRONISATION_ROADMAP.md](CATALOGUE_SYNCHRONISATION_ROADMAP.md)
- Cloture prevue: 2026-07-26, ou plus tot des que toutes les gates de la roadmap sont fermees

## 1. Gouvernance de ce document

Ce document temporaire existe a la demande explicite de l'utilisateur afin qu'une nouvelle tache Codex puisse reprendre le chantier sans dependre de l'historique du chat.

Il ne remplace pas les references canoniques suivantes:

- [AGENTS.md](../../AGENTS.md), pour les invariants et autorisations;
- [map.md](../../map.md), pour la cartographie executable;
- [ANNONCES_CATALOGUE.md](ANNONCES_CATALOGUE.md), pour le catalogue;
- [IMAGES_MEDIA.md](../images/IMAGES_MEDIA.md), pour les images;
- [PERFORMANCE.md](../perf/PERFORMANCE.md), pour les caches et budgets;
- [INTERFACE_NAVIGATION.md](../ux/INTERFACE_NAVIGATION.md), pour la navigation;
- [QUALITE_TESTS.md](../quality/QUALITE_TESTS.md), pour les gates.

Ordre de lecture impose a la prochaine tache:

1. `AGENTS.md`;
2. `map.md`;
3. le present document;
4. la [roadmap d'implementation](CATALOGUE_SYNCHRONISATION_ROADMAP.md);
5. les chapitres canoniques cites ci-dessus;
6. le code executable, qui reste la preuve finale.

A la cloture, les conclusions verifiees doivent etre fusionnees dans les chapitres canoniques, les deux documents temporaires doivent etre supprimes et leurs liens retires. Git restera l'archive.

Ce document n'est pas une autorisation de deploiement, d'ecriture cloud, de lecture de secret ou de modification de production. Une nouvelle tache doit obtenir les autorisations necessaires pour ces actions.

## 2. Verdict executif

La suppression de `public/meta`, de `publicCatalog`, des modes legacy/shadow/canary et le passage a un snapshot Storage unique sont reussis. Cette architecture doit etre conservee.

Le chantier elargi n'est toutefois pas termine. Les elements suivants ne sont pas encore coherents entre eux:

- la mutation Firestore et son plan d'impact;
- le builder, les retries et le reconciler;
- les pointeurs Storage et leur etat Firestore;
- la revalidation Next;
- le cache de donnees, l'ISR et le Router Cache;
- la fraicheur d'un onglet deja ouvert;
- la navigation interne;
- le chargement des cartes image;
- les politiques distinctes de la galerie et des categories;
- la documentation qui presente encore certaines intentions comme des garanties.

Le bon correctif n'est pas de passer l'ISR a 30 ou 60 secondes, de supprimer le cache ou de reconnecter le public a toute la collection Firestore. Il faut consolider une seule chaine evenementielle autour du snapshot.

## 3. Architecture validee a conserver

### 3.1 Sources de verite

| Couche | Role durable |
| --- | --- |
| Firestore `furniture` | verite administrative et transactionnelle |
| checkout Firestore | prix, stock, publication et achat autoritaires |
| release Storage | projection publique immuable et validee |
| `current` | release publique normale |
| `previous` | release precedente valide |
| `last-known-good` | dernier secours explicitement sain |
| pages Next ISR | HTML public rapide, indexable et partage |
| cache HTTP des images | reutilisation des fichiers dont l'URL ne change pas |

### 3.2 Flux deja en place

```text
Admin ecrit furniture
        |
        v
onCatalogSourceWrite
        |
        v
desiredRevision + Cloud Task
        |
        v
builder lit l'etat final borne
        |
        v
release Storage immuable + manifest
        |
        v
CAS du pointeur current
        |
        v
revalidation HMAC vers App Hosting
```

Le public ne doit jamais retomber sur `furniture` ou `public/meta` si Storage rencontre un probleme. Le lecteur doit rester borne a `current -> previous -> last-known-good`.

### 3.3 Elements deja valides

- le bucket catalogue prive et les releases immuables;
- les checksums et manifestes;
- le CAS de `current`;
- les trois pointeurs lecteurs;
- le rollback depuis Maintenance admin;
- le GC protegeant les pointeurs et releases recentes;
- la quarantaine media;
- le checkout relisant Firestore;
- la conservation des URL image lors d'un changement de prix ou de stock;
- l'absence de lecture publique de `furniture` et `public/meta` mesuree lors de la recette precedente.

Ces acquis ne doivent pas etre reimplementes sous une autre forme.

## 4. Vocabulaire commun

### 4.1 Revision

`revision` est le numero operationnel d'un build. Deux revisions differentes peuvent exceptionnellement produire exactement le meme contenu public.

### 4.2 Version de contenu

`aggregateSha256` doit representer le contenu public observable. Il sert a savoir si un navigateur doit reellement se rafraichir.

```text
revision change, aggregateSha256 identique
=> operation technique nouvelle, contenu public identique
=> aucun refresh navigateur necessaire
```

### 4.3 Invalidation

Invalider signifie marquer une copie cachee comme perimee pour que Next la reconstruise. Cela ne modifie pas magiquement le HTML deja affiche dans un onglet.

### 4.4 ISR 300 secondes

L'ISR produit des pages statiques regenerables. Les 300 secondes sont un filet temporel en cas d'echec de l'evenement, pas le delai normal de publication.

### 4.5 Signal de version

Un signal de version ne transporte aucun catalogue. Il annonce seulement qu'une nouvelle version publique est prete afin qu'un onglet visible demande la route a jour.

## 5. Etat reel de la publication et de la revalidation

### 5.1 Le contexte de mutation est perdu

La mutation sait deja identifier des changements de produit et de categorie dans:

- `functions/src/catalog/catalogMutationRecorder.js`;
- `functions/src/catalog/mutationClassifier.js`.

Mais `functions/src/catalog/buildCatalogSnapshot.js` envoie actuellement a la revalidation uniquement:

```text
revision
manifestSha256
```

Les identifiants produit, anciennes categories, nouvelles categories, anciens chemins et nouveaux chemins ne traversent donc pas toute la chaine.

Le reconciler reproduit le meme probleme lors d'un retry: il redemande une revalidation avec l'identite de release, sans plan d'impact persistant.

### 5.2 La revalidation normale est globale

`app/api/revalidate-catalog/route.js` invalide actuellement les tags globaux et des patterns couvrant toutes les pages produit et categorie.

Une modification de prix sur un meuble peut donc invalider:

- toute la galerie;
- toutes les categories;
- toutes les fiches produit;
- les API;
- le sitemap.

Ce comportement est robuste comme secours, mais il n'est pas cible et augmente les regenerations inutiles.

### 5.3 Le chemin produit exact est faux

La revalidation exacte construit actuellement une forme proche de:

```text
/produit/{id}
```

La route canonique reelle est construite par `src/utils/slug.js`:

```text
/produit/{slug}-{id}
```

Un changement de nom peut changer le slug. Le plan doit alors invalider l'ancienne URL et la nouvelle URL.

### 5.4 Les categories parentes ne sont pas garanties

Un produit deplace de `buffets` vers `commodes` peut affecter:

- `/categorie/buffets`;
- `/categorie/commodes`;
- la page parente `/categorie/meubles`;
- `/` et `/galerie` si leurs selections editoriales changent;
- la recherche;
- le sitemap selon l'indexabilite.

Le code actuel ne materialise pas ce graphe de dependances dans un plan immutable.

### 5.5 L'ETag catalogue est sans contrat coherent

`app/api/catalog/route.js` calcule une identite ETag mais repond avec un cache partage a zero. Plusieurs consommateurs utilisent en plus `cache: 'no-store'`.

Dans cet etat:

- l'ETag apporte peu ou pas de requetes `304` utiles;
- `map.md` parle encore de `CDN/ETag` comme si ce comportement etait exploite;
- le contrat doit etre choisi explicitement plutot que laisse dans un entre-deux.

Decision cible: `/api/catalog` reste une lecture courante sans cache persistant ambigu; un endpoint minuscule `/api/catalog/version` porte la verification conditionnelle de version.

## 6. Etat reel des caches

### 6.1 Les cinq mecanismes souvent confondus

| Mecanisme | Duree actuelle | Role reel |
| --- | ---: | --- |
| ISR des pages catalogue | 300 s | secours temporel des pages |
| cache Next du pointeur | 300 s | evite des lectures Storage, mais se superpose a l'ISR |
| reconciler planifie | 5 min | repare les publications bloquees |
| fenetre HMAC | 5 min | refuse les requetes signees trop anciennes |
| Router Cache Next | fenetre propre au client | reutilise des routes/prefetches dans le navigateur |

Ces mecanismes ne doivent pas etre decrits comme un unique cache de cinq minutes.

### 6.2 Double fenetre serveur

`src/lib/server/materializedCatalog.js` met `current`, `previous` et LKG dans `unstable_cache` pour 300 secondes. Les pages publiques ont elles-memes un ISR de 300 secondes.

Scenario d'echec possible:

```text
t0      nouvelle release publiee, invalidation evenementielle en panne
t+300   une page devient regenerable
        elle lit encore un pointeur Next ancien
        elle est regeneree avec l'ancienne release
t+600   une nouvelle fenetre peut etre necessaire
```

Les 300 secondes ne constituent donc pas aujourd'hui une limite de fraicheur stricte.

### 6.3 Regle cible

- une page en regeneration lit le pointeur courant fraichement;
- une release reste fortement cachee par son chemin et son hash immuables;
- l'ISR 300 reste le seul minuteur des pages;
- une API peut avoir son propre cache pointeur court, explicitement separe;
- une release ne doit pas etre purgee lors d'une mutation normale.

## 7. Risques de concurrence prouves par le code

Ces risques sont prioritaires car ils peuvent produire un etat incoherent meme si l'interface semble fonctionner.

### 7.1 Reconciler contre etat plus recent

`catalogReconciler.js` lit l'etat de controle puis effectue plusieurs reparations non transactionnelles. Entre la lecture et l'ecriture:

- un builder peut acquerir un nouveau lease;
- une mutation peut augmenter `desiredRevision`;
- une publication peut avancer;
- le reconciler peut ensuite effacer le lease, rabaisser la revision ou remettre artificiellement l'etat en file.

### 7.2 Reconciler contre rollback

Le rollback passe par un etat `preparing` avant le CAS Storage. Pendant cette fenetre, le reconciler peut interpreter l'operation comme abandonnee et tenter une reparation concurrente.

Il manque une identite d'operation durable avec proprietaire, debut, expiration et heartbeat.

### 7.3 Lease expirant avant le CAS

Le builder verifie son lease, realise encore des operations puis change `current`. Le lease peut expirer entre la derniere assertion et le CAS.

Il faut renouveler et verifier le lease au plus pres du CAS, puis representer explicitement le cas ou le pointeur est deja publie mais l'etat Firestore n'est pas finalise.

### 7.4 Corps et generation de pointeur discordants

La lecture Storage separe existence, metadata et telechargement. Une rotation concurrente peut faire correspondre le corps d'une generation avec les metadata d'une autre.

La lecture doit etre epinglee a une generation et recommencee si celle-ci change.

### 7.5 `healthy` trop vague

Une revalidation HTTP 2xx peut actuellement ecrire `buildState: healthy` si la revision correspond encore. Cela ne prouve pas:

- que la home sert cette version;
- que la fiche modifiee sert cette version;
- que les categories concernees servent cette version;
- qu'une mutation N+1 n'est pas deja en attente.

Les etats `integrityValid`, `sourceLag`, `invalidationAccepted` et `servedVersion` doivent etre separes. Une tache asynchrone ne doit plus pouvoir ecrire seule un vague `healthy`.

## 8. Fraicheur des navigateurs deja ouverts

### 8.1 Limite actuelle

Une invalidation serveur agit sur les caches Next. Elle ne peut pas modifier un DOM deja affiche dans le navigateur.

Une page immobile peut donc continuer a montrer un ancien prix ou un ancien badge jusqu'a:

- une navigation;
- un refresh;
- un retour au premier plan accompagne d'un controle;
- un signal push suivi d'un `router.refresh()`.

Le checkout reste securise car il relit Firestore, mais l'affichage peut etre trompeur.

### 8.2 Decision retenue

La passation retient un mecanisme hybride borne:

- un document de signal unique, sans donnees catalogue;
- abonnement uniquement pendant que l'onglet catalogue est visible;
- desabonnement quand l'onglet est cache;
- controle de `/api/catalog/version` sur `visibilitychange`, `pageshow` et retour au premier plan;
- `router.refresh()` uniquement lorsque `aggregateSha256` differe;
- deduplication pour qu'une meme version ne declenche qu'un refresh;
- aucune boucle de polling toutes les 30 ou 60 secondes;
- aucun listener sur `furniture` ou sur une liste de produits.

Cette decision modifie volontairement la formulation de la mesure Data Access:

```text
Attendu apres implementation:
- zero lecture publique furniture;
- zero lecture public/meta;
- lectures publiques bornees du seul document de signal;
- ecriture du signal uniquement par le backend de publication.
```

Si l'exigence devient plus tard `zero lecture Firestore publique, signal compris`, il faudra retirer ce listener et accepter une mise a jour uniquement au focus, ou concevoir un canal SSE dedie. Ce n'est pas la cible de cette roadmap.

## 9. Etat reel des images

### 9.1 Ce qui est bon

Les nouvelles images produit utilisent:

- un chemin Storage horodate et unique;
- des variantes WebP;
- `Cache-Control: public, max-age=31536000, immutable`;
- la meme URL lors d'une modification de prix, stock, titre ou categorie;
- une nouvelle URL uniquement lorsque l'image elle-meme est remplacee.

Ainsi, une mutation de catalogue ne doit pas invalider les fichiers image.

Le navigateur peut toutefois choisir une autre variante de `srcSet` selon la taille affichee. Telecharger une variante 768 px apres avoir vu une vignette 320 px est normal: ce sont deux URL distinctes.

### 9.2 Faux etat `loaded`

`GalleryProductCardServer.jsx` et `CategoryServerView.jsx` mettent actuellement `data-image-loaded="true"` lorsque `cardImage.src` existe.

Cela signifie en realite `une URL est disponible`, pas `les pixels sont charges et decodes`.

### 9.3 Faux flash blanc

`src/index.css` applique a toute carte marquee visible/chargee une animation de 360 ms partant de `opacity: 0`.

Une image deja en cache peut donc etre masquee volontairement puis reapparaitre. Le fond fixe `#fbfaf8` cree la zone blanche observee.

Les metadata `dominantColor` et `blurDataUrl` sont deja presentes dans le snapshot et retournees par `getProductCardImage()`, mais les cartes ne les utilisent pas.

### 9.4 Section `Petits Prix`

`ProductSmallPricesSectionServer` active `deferImagesUntilCalm`.

Le serveur retire alors `src` et `srcSet`. Lorsque la section entre dans le viewport, `GalleryGridActionsIsland`:

1. attend 240 ms sans intention de scroll;
2. injecte la premiere image;
3. attend 92 ms;
4. injecte la suivante;
5. recommence jusqu'a la fin de la file.

Le navigateur ne peut pas reutiliser une image cachee avant de connaitre son URL. Ce mecanisme superpose `IntersectionObserver`, lazy loading natif, `content-visibility` et une file artificielle. Il doit etre supprime.

### 9.5 Difference galerie/categorie

La categorie active `observeVisibleWarmup` et surveille les cartes jusqu'a environ 650 px du viewport. Elle chauffe `detailFast` avant le clic. La route produit n'est prefetchee que sur intention.

La galerie installe le meme controleur sans `observeVisibleWarmup`. Son selecteur de proximite vise en plus explicitement `[data-category-native-view]`.

Cela explique pourquoi une fiche semble souvent instantanee apres un scroll de categorie, mais moins previsible depuis la galerie.

La correction ne consiste pas a rendre toutes les images `eager`. Une home editoriale et une page categorie n'ont pas exactement le meme premier viewport. Il faut un moteur partage avec des budgets differents par surface.

### 9.6 Quatre representations par produit en categorie

`CategoryServerView.jsx` rend simultanement:

- grille mobile;
- liste mobile;
- grille desktop;
- liste desktop.

Les vues masquees augmentent le DOM et peuvent provoquer des decodages ou telechargements de variantes inutiles. Les premieres cartes mobile et desktop peuvent aussi etre prioritaires en meme temps.

Chaque produit doit finir avec une seule representation active.

### 9.7 Deux moteurs de prechargement

`src/utils/imageUtils.js` possede deja un cache de promesses et des helpers de prechargement/decodage.

`GalleryGridActionsIsland.jsx` recree:

- un second `new Image()`;
- un second cache d'URL;
- une seconde file;
- une seconde politique de concurrence.

Plusieurs exports de `imageUtils.js` n'ont aucun appelant. Il faut garder un seul moteur et supprimer les helpers morts apres migration.

### 9.8 Configuration `next/image` inactive

Le projet n'importe actuellement aucun `next/image` dans les surfaces publiques. Les options `minimumCacheTTL`, formats et tailles de `next.config.mjs` ne pilotent donc pas les `<img>/<picture>` natifs.

Le cache reel vient de Firebase Storage. La configuration inactive doit etre retiree ou reduite apres verification finale.

## 10. Etat reel de la navigation

Plusieurs destinations internes utilisent encore `<a>`:

- fil d'Ariane;
- boutons Galerie et A propos d'une categorie;
- categories associees;
- resultats et suggestions de recherche;
- liens internes du footer;
- liens de sections de la home.

Une ancre interne classique peut provoquer un nouveau document au lieu d'une navigation App Router. Cela:

- detruit le DOM courant;
- remonte toutes les cartes;
- rejoue le faux fade;
- vide les caches JavaScript de prechauffage;
- donne l'impression que les images sont retelchargees.

Regle cible:

- `Link` ou routeur Next pour une destination interne;
- `<a>` pour une ancre dans la meme page, une URL externe, `mailto:` ou `tel:`;
- les filtres et tris doivent rester partageables dans l'URL sans imposer un rechargement complet.

## 11. Drift documentaire observe

Les documents canoniques sont globalement bons mais trop affirmatifs sur trois points:

1. `PERFORMANCE.md` presente la revalidation ciblee comme acquise alors qu'elle reste globale;
2. `IMAGES_MEDIA.md` presente metadata/ratio anti-CLS comme contrat d'affichage, alors que les cartes ignorent encore couleur dominante et blur;
3. `map.md` decrit `/api/catalog` comme `CDN/ETag`, alors que les clients et headers n'exploitent pas ce contrat de facon coherente.

Ces documents devront etre corriges dans la meme livraison que le code, puis les deux fichiers temporaires seront supprimes.

## 12. Architecture cible retenue

| Couche | Regle cible |
| --- | --- |
| Firestore | source administrative et transactionnelle |
| Mutation | enregistre une revision desiree monotone |
| Builder | fabrique une release immutable et un plan d'impact |
| Plan d'impact | lie a revision, manifest, contenu et chemins avant/apres |
| Pointeur | CAS avec generation epinglee et reprise explicite |
| Releases | cache long, aucune invalidation normale |
| Pages | ISR 300 comme unique filet temporel |
| Revalidation | routes exactes, globale seulement en secours |
| Sante | integrite, retard source, acceptation et version servie separes |
| Onglet visible | signal de version minimal puis `router.refresh()` |
| Onglet cache | aucun listener; controle unique au retour |
| API version | petite reponse conditionnelle par `aggregateSha256` |
| Navigation | App Router natif pour toutes les routes internes |
| Cartes image | un composant media partage |
| Images carte | URL disponible dans le HTML, lazy natif hors priorite |
| Placeholder | couleur dominante/blur reel, jamais blanc impose |
| Detail | `detailFast` chauffe environ un viewport avant la carte |
| Route produit | prefetch uniquement sur intention |

### 12.1 Flux cible complet

```text
Modification Firestore
        |
        v
desiredRevision monotone
        |
        v
builder sous lease
        |
        +--> nouvelle release immutable
        |
        +--> diff ancienne/nouvelle release
        |        |
        |        v
        |     plan d'impact immutable + planHash
        |
        v
renouvellement lease + assertion finale
        |
        v
CAS current
        |
        v
etat pointer_committed_control_pending
        |
        v
revalidation des chemins exacts
        |
        v
verification bornee de la version servie
        |
        v
signal aggregateSha256 aux onglets visibles
        |
        v
router.refresh() seulement si necessaire
```

## 13. Comportements attendus par scenario

| Scenario | Resultat public cible | Image | Checkout |
| --- | --- | --- | --- |
| prix modifie | listes et fiche concernees rafraichies | URL inchangee, aucun nouveau fichier | prix Firestore courant |
| stock passe a zero | badge/achat deviennent indisponibles | URL inchangee | achat refuse |
| meuble vendu | meuble marque vendu ou retire selon regle editoriale | URL inchangee | achat refuse |
| meuble republie | retour dans routes concernees | image cachee reutilisee | achat selon Firestore |
| meuble cree | galerie/categorie/fiche et sitemap selon indexabilite | nouvelles variantes | achat selon Firestore |
| meuble supprime | anciennes routes invalidees | media en quarantaine | achat refuse |
| nom/slug change | ancienne et nouvelle URL traitees | URL image inchangee | aucune incidence |
| categorie change | ancienne, nouvelle et parentes traitees | URL image inchangee | aucune incidence |
| photo remplacee | donnees et page mises a jour | seule nouvelle URL telechargee | aucune incidence |
| retour categorie -> galerie | navigation Next, pas de nouveau document | image chaude visible sans faux fade | aucune incidence |
| onglet visible pendant une vente | reception du signal puis refresh | image conservee | achat refuse immediatement |
| chaine evenementielle en panne | ISR/reconciler finissent par reparer | image conservee | Firestore reste autoritaire |

## 14. Decisions fermees pour cette implementation

- conserver l'ISR a 300 secondes;
- ne pas ajouter un polling a 30 ou 60 secondes;
- ne pas rendre toutes les pages dynamiques;
- ne pas reconnecter le public a la collection `furniture`;
- ne pas recreer `public/meta`, `publicCatalog`, legacy, shadow ou canary;
- ne pas stocker les images ou le catalogue dans `localStorage`;
- ne pas precharger tout le catalogue;
- ne pas invalider les URL image pour un changement de texte, prix ou stock;
- ne pas multiplier les scripts de tests;
- conserver les trois suites catalogue et les enrichir;
- reserver l'invalidation globale au rollback, migration, diff illisible ou secours;
- utiliser un signal unique sans donnees catalogue pour les onglets visibles;
- ne supprimer aucun fallback media historique avant inventaire des meubles reels.

## 15. Options explicitement ecartees

### ISR 30 ou 60 secondes

Augmente les regenerations sans actualiser un DOM deja affiche et sans corriger les courses.

### ISR 30 minutes maintenant

Economiserait peu au trafic envisage et allongerait fortement le mode degrade. Le choix pourra etre reouvert uniquement sur mesures App Hosting reelles.

### Aucun cache

Fait travailler le serveur a chaque visite et ne produit toujours pas du temps reel dans un onglet immobile.

### Listener public sur tous les meubles

Reintroduit les lectures catalogue publiques et annule l'objectif du snapshot.

### Tout precharger

Vole de la bande passante au hero, penalise le mobile et augmente la memoire sans garantie d'intention.

### Remplacer le pipeline par `next/image` pendant ce chantier

Elargit inutilement le scope. Les variantes Storage actuelles sont bonnes; le probleme se situe dans leur rendu et leur orchestration.

## 16. Perimetre du changement suivant

### Inclus

- robustesse builder/reconciler/rollback/pointeurs;
- plan d'impact et chemins canoniques;
- revalidation exacte et etat de sante;
- separation des caches pointeur/release/page;
- endpoint de version et signal borne;
- navigation interne catalogue;
- unification cartes, placeholders et prechauffage;
- suppression du report `Petits Prix`;
- reduction du DOM categorie;
- tests des contrats;
- mise a jour documentaire et nettoyage du code mort.

### Exclus

- redesign visuel de la galerie;
- changement de taxonomie metier;
- migration Next 16;
- production, domaine final ou Stripe live;
- suppression de medias reels;
- backfill media sans dry-run et autorisation;
- optimisation generale CSS/JS sans rapport avec ce flux;
- nouveau moteur de recherche;
- nouvelle logique de prix ou de stock.

## 17. Fichiers et modules a inspecter en priorite

### Publication et stockage

```text
functions/src/catalog/catalogMutationRecorder.js
functions/src/catalog/mutationClassifier.js
functions/src/catalog/buildCatalogSnapshot.js
functions/src/catalog/catalogRevalidation.js
functions/src/catalog/catalogReconciler.js
functions/src/catalog/catalogMaintenance.js
functions/src/catalog/publicationState.js
functions/src/catalog/snapshotStorage.js
functions/src/catalog/publicProjection.js
```

### Next et cache

```text
src/lib/server/materializedCatalog.js
src/lib/server/materializedCatalogValidation.cjs
app/api/revalidate-catalog/route.js
app/api/catalog/route.js
app/api/search/route.js
app/page.jsx
app/galerie/page.jsx
app/categorie/[categoryId]/page.jsx
app/produit/[slugOrId]/page.jsx
app/sitemap.js
```

### Navigation et images

```text
src/utils/slug.js
src/utils/imageUtils.js
src/kit/marketplace/GalleryServerView.jsx
src/kit/marketplace/GalleryProductCardServer.jsx
src/kit/marketplace/ProductSectionsServer.jsx
src/kit/marketplace/GalleryGridActionsIsland.jsx
src/kit/marketplace/CategoryServerView.jsx
src/kit/marketplace/CategoryControlsIsland.jsx
src/kit/marketplace/PageBreadcrumb.jsx
src/kit/marketplace/SearchResultsIsland.jsx
src/kit/marketplace/FooterServer.jsx
src/index.css
next.config.mjs
```

### Tests et documentation

```text
tests/catalog/core.test.cjs
tests/catalog/resilience.test.cjs
tests/catalog/security.test.cjs
tests/catalog/fixtures/build-snapshot.cjs
scripts/check-next-route-classification.cjs
scripts/check-mobile-marketplace-contract.cjs
_DOCS/catalogue/ANNONCES_CATALOGUE.md
_DOCS/images/IMAGES_MEDIA.md
_DOCS/perf/PERFORMANCE.md
_DOCS/ux/INTERFACE_NAVIGATION.md
_DOCS/quality/QUALITE_TESTS.md
map.md
```

## 18. Etat de depart de la passation

Au moment de cette verification:

- branche: `codex/analytics-live-robust`;
- commit: `1bcecd5`;
- worktree observe propre;
- audit realise sur le code uniquement;
- aucun test navigateur relance pour etablir ce document;
- aucun code catalogue/image modifie pendant l'audit;
- aucun deploiement effectue pendant cette passe documentaire.

La prochaine tache doit verifier a nouveau `git status --short` et le commit courant avant toute modification, car cet etat peut avoir evolue.

## 19. Passage a l'implementation

La traduction executable de tous ces constats se trouve dans [CATALOGUE_SYNCHRONISATION_ROADMAP.md](CATALOGUE_SYNCHRONISATION_ROADMAP.md).

La prochaine tache ne doit pas corriger les symptomes un par un. Elle doit respecter l'ordre suivant:

```text
concurrence
  -> plan d'impact
  -> revalidation et sante
  -> caches et signal
  -> navigation et images
  -> nettoyage
  -> validation sandbox
  -> fusion documentaire
  -> suppression des documents temporaires
```
