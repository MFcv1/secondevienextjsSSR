# Annonces, catalogue et recherche

Derniere mise a jour: 2026-08-08
Statut: `REFERENCE_ACTIVE`

## 1. Perimetre

Ce chapitre couvre la creation d'une annonce meuble, son stockage, sa publication, son indexabilite, son affichage dans la galerie, sa recherche et son passage dans le panier.

La collection catalogue unifiee est `furniture`. L'identifiant technique ne doit pas etre renomme sans migration de donnees, rules, Functions, scripts et routes.

Chemin Firestore:

```text
artifacts/{appId}/public/data/furniture/{productId}
```

`appId` vaut le nom logique public configure par `NEXT_PUBLIC_APP_LOGICAL_NAME`, actuellement `secondevie`.

## 2. Taxonomie

La taxonomie executable vit dans `src/kit/config/constants.js` et `src/lib/seo/categories.js`.

| Groupe | Sous-categories |
| --- | --- |
| `meubles` | `armoires`, `buffets`, `commodes`, `tables` |
| `assises` | `chaises`, `fauteuils`, `bancs` |
| `eclairage` | `eclairage` |
| `decorations` | `miroirs`, `deco` |

`/categorie/deco` redirige vers `/categorie/decorations`. Toute evolution de taxonomie doit verifier les slugs existants, les redirects, les metadata, le sitemap, le mega menu et les produits deja enregistres.

## 3. Modele d'annonce

`src/kit/admin/AdminForm.jsx` est le formulaire principal. Les champs structurants incluent:

- identite: `name`, identifiant Firestore, dates, collection;
- contenu: `description`, materiau, couleur, style; `description` accepte le
  sous-ensemble Markdown borne de `StoryEditor`, rendu par `RichTextStory` et
  reduit en texte brut pour metadata et donnees structurees;
- dimensions: largeur, profondeur, hauteur et texte libre de dimensions;
- vente: prix, prix de depart, stock, vendu/reserve, prix sur demande;
- classement: categorie, nouveaute, petit prix et ordres editoriaux;
- SEO automatique: `seoTitle` et `seoDescription` restent vides pour activer
  les replis nom/histoire; `seoIndexable` est calcule a chaque sauvegarde;
- medias: `images`, `imageUrl`, `thumbnails`, `thumbnailUrl`, `imageVariants`, `imageMetadata`.

Une publication accepte au maximum 23 images. `AdminForm` borne la selection,
affiche le compteur et conserve l'ordre des 23 vignettes; la case d'ajout reste
alors visible dans un etat desactive `MAX`. Une commande de vidage placee pres
du compteur retire en une fois toutes les images du formulaire. La commande
produit refuse egalement tout tableau media qui depasse cette limite.
Une creation publique exige aussi un titre lisible (au moins quatre caracteres
et trois lettres ou chiffres) et un materiau non vide. Le formulaire bloque ces
ecarts avant upload et `productCommands` reverifie le meme invariant dans la
transaction serveur. Une chaine techniquement non vide telle que `"fr` ne peut
donc plus devenir une publication catalogue.

Le panneau d'apercu Instagram de l'administration derive son contenu de ce
modele sans le modifier: `name` devient l'accroche, `description` est reduite en
texte brut et les 10 premiers elements de `images` forment le carrousel simule.
Les hashtags sont pour l'instant un etat local d'interface. Ni ces hashtags ni
un identifiant de publication Meta ne font partie du modele d'annonce courant;
leur persistance et l'orchestration multicanale exigent une etape serveur
dediee avant toute activation reelle.

Les anciennes formes de donnees restent normalisees par `src/lib/server/products.js` et `src/utils/imageUtils.js`, mais les nouvelles ecritures doivent produire le modele courant complet.

La stabilisation commerce ajoute localement un rail serveur dans
`functions/src/commerce/domain/productCommands.js` et
`productCommandRepository.js`. Il conserve les commandes distinctes necessaires
a l'edition, mais expose `create_published_product` pour la creation neuve. Cette
commande assemble contenu, medias, offre, stock et statut public dans une seule
transaction et un seul audit. Chaque commande
exige un admin AAL2 actif, App Check, une raison, une cle idempotente, une
version attendue et un audit append-only. L'archivage conserve le document
source en `status: archived`, son historique de stock et son audit; il le retire
des lecteurs publics et actifs sans suppression physique optimiste. Les
commandes conservees gardent leur snapshot produit et les medias retires
suivent la quarantaine Storage. Les commandes catalogue ne dependent
plus de `adminMutationMode`, reserve au rail commerce transactionnel: un
administrateur autorise doit pouvoir gerer les annonces lorsque checkout,
commandes et remboursements restent en lecture seule. Avant toute compression
ou ecriture Storage, `preflightProductMutationAdmin` verifie ces droits. Une
session non AAL2 est ainsi reprise avant l'envoi des images.

Pour une creation neuve, le parcours actif privilegie une publication atomique
visible:

1. preparer les variantes images dans le navigateur;
2. envoyer toutes les variantes sur les chemins Storage catalogue historiques;
3. ne creer le document `furniture/{id}` qu'apres succes de tous les uploads;
4. creer directement le produit complet et public avec une seule commande
   idempotente `createPublishedProductAdmin`;
5. interroger la route admin non cachee
   `/api/admin/catalog-publication-status`, qui lit le pointeur Storage frais
   et confirme atomiquement le produit et l'identite de sa release;
6. basculer automatiquement l'interface vers Publications, sans remise a zero
   prealable, et mettre la nouvelle ligne en evidence. Un handoff court en
   `sessionStorage` conserve cette destination si l'ile admin est remontee
   pendant la transition.

Ainsi, un echec d'image ne cree aucun meuble et n'ajoute aucun brouillon a la
liste. Le rail `product_publication_sessions` qui creait le brouillon avant le
premier upload est retire de `AdminForm` apres deux refus reproductibles
`STORAGE_UNAUTHORIZED`. Les Functions et sessions existantes restent bornees
au diagnostic, a la reprise des donnees historiques et a la collecte; elles ne
sont plus le chemin de creation de l'interface.

Une creation neuve validee porte directement `status: published`, le stock saisi,
`sold: false`, `soldAt: null`, `publishedAt` et `nouveautesOrder: -1`. La
commande refuse un stock initial inferieur a un. Les commandes de brouillon
restent disponibles pour les donnees historiques et les actions explicites,
mais ne sont plus une etape technique de la publication neuve.

Le document de session, ses erreurs internes et les chemins source restent
backend-only. L'etat callable expose seulement la progression utile. Les
variantes serveur sont publiquement lisibles comme les autres medias catalogue,
mais leur ecriture directe par le navigateur est interdite.

Etat code au 2026-08-08: la publication neuve atomique attend la projection et
la version publiques exactes avant de confirmer le succes et de transmettre
automatiquement l'interface a la vue Publications. Cette preuve passe par une
route POST admin non cachee: elle ne depend ni du cache pointeur API de quinze
secondes, ni de la revalidation HTML. Le debounce du builder est borne a 750 ms
pour les changements publics et 500 ms pour prix/stock; les payloads immuables
sont ecrits et verifies en parallele avant checksums, manifeste et CAS. La
modale exprime des etapes terminees, pas un faux pourcentage de temps; l'attente
de construction du catalogue reste bornee a cinq minutes.

## 4. Cycle de vie

```text
variantes images preparees dans AdminForm
  -> upload de toutes les variantes catalogue
  -> createPublishedProductAdmin: contenu + offre + stock + statut public
     dans une transaction unique
  -> onCatalogSourceWrite (deduplication + desiredRevision)
  -> Cloud Tasks dispatchCatalogBuild
  -> snapshot Storage immuable + manifeste + impact-plan.json
  -> CAS du pointeur current, puis rotation previous/LKG
  -> preuve admin fraiche produit + release exacte (non cachee)
  -> dispatchCatalogRevalidation signe HMAC
  -> revalidation Next ciblee + preuve API exacte /api/catalog/version
  -> signal public borne sys_catalog_live/current
  -> hydratation directe des grilles galerie depuis cette release exacte
  -> preuve HTML versionnee asynchrone, controle d'exploitation non bloquant
  -> produit visible dans galerie/categorie/recherche/sitemap selon ses flags
  -> panier/checkout si isPurchasable=true
  -> vendu ou remis en vente selon cycle de commande/refund
```

Une creation recoit `nouveautesOrder=-1`: lors de sa publication elle precede
la selection editoriale deja numerotee. La Vue Globale peut ensuite la replacer
et renumerote l'ensemble a partir de zero. Une republication conserve en
revanche le rang existant. Lorsque plusieurs creations partagent encore le
rang `-1`, la galerie les departage par `createdAt` decroissant, qu'il soit un
Timestamp Firestore ou une date ISO issue du snapshot.

La suppression ou modification d'un produit met ses medias retires en quarantaine. Dans le sandbox, le GC media est actif mais ne peut supprimer qu'apres 90 jours, apres verification de la source Firestore, des generations Storage et des releases retenues. Le GC des releases protege toujours `current`, `previous`, LKG, les 10 releases les plus recentes et toute release de moins de 48 heures. Il s'execute apres une publication et chaque jour. Ne pas contourner ces garde-fous avec une migration non auditee.

Le lot local G2-A2 explicite les limites source de
`onCatalogSourceWrite`, `catalogReconciler` et
`catalogMediaGarbageCollector`: CPU 1, concurrence 1, min 0, max 1, memoire et
timeout bornes. Le trigger Firestore conserve retry actif; les schedulers ont
`retryCount: 0`. Ces valeurs ne deviennent autoritaires dans le cloud qu'apres
un deploiement G2-B cible par cible et son observation; aucun deploiement n'a
ete produit par le lot local.

Le lot G2-A3 rend aussi effectif le retry du worker image de publication: une
panne de traitement marque la session en echec puis est relancee par Eventarc;
une generation deja finalisee reste un no-op. Le worker est borne a
concurrence/max 4 et les deux schedulers de reprise/nettoyage a concurrence/max
1 avec retry scheduler nul. Les trois utiliseront le SA dedie
`product-publication-worker` seulement apres creation IAM et deploiement G2-B
cible; leur code local ne modifie pas le sandbox.

Le lot G2-A5 aligne les deux Cloud Tasks catalogue a un timeout et une deadline
de 300 secondes. La mesure read-only sur trente jours trouve pour le build 22
latences HTTP, p99 16,181 s et max 16,181 s; pour la revalidation 446 latences,
p99 5,667 s et max 9,359 s. Les queues restent a une execution concurrente,
dix tentatives et backoff 5-300 s. CPU, memoire, concurrence et min-max sont
explicites dans la source; aucun changement de queue ou de Function cloud n'a
ete applique.

Le lot G2-A6 rend la quarantaine media idempotente par chemin et generation.
`onArtifactUpdated` et `onArtifactDeleted` ciblent le SA
`catalog-media-enqueuer`, avec CPU/concurrence 1, min 0, max 1, 256 MiB,
timeout 300 s et retry actif. Le modele social historique des produits n'existe
plus dans le code executable: aucun appelant, aucune rule et zero document sur
le sandbox. Le trigger de suppression ne gere que la quarantaine media.

### 4.1 Catalogue public materialise

Le sandbox sert le catalogue depuis le bucket prive `secondevienextjsssr-catalog-europe-west4`. Le snapshot est l'unique source publique; aucun selecteur de source, canary ou fallback Firestore n'existe.

```text
furniture [DB, autoritaire]
  -> trigger leger onCatalogSourceWrite
  -> ledger/outbox + file Cloud Tasks
  -> builder: un scan borne de l'etat final
  -> releases/{revision}/... + manifest.json [ST]
  -> current.json / previous.json / last-known-good.json
  -> app/api/catalog/route.js [same-origin]
  -> SSR, recherche, wishlist, sitemap et admin lazy
```

Le lecteur valide schema, manifestes et checksums. Il tente `current`, puis `previous`, puis `last-known-good`; il ne scanne jamais Firestore en cas de panne Storage. Chaque lecture de pointeur epingle une generation Storage unique pour que metadata et corps ne puissent pas provenir de deux ecritures differentes. Les seuls modes durables sont `active` et `paused`. Maintenance admin valide les releases et effectue le CAS de rollback, puis la reconstruction republie l'etat Firestore courant.

La recette de cloture du 2026-07-18 a exerce un rollback reel, sa pause, puis la reconstruction. Une recette complementaire du 2026-07-19 a modifie puis restaure le prix et le stock d'un meuble sandbox existant, verifie le snapshot public et ouvert le checkout sans paiement ni creation de commande. Deux reconstructions finales ont elimine l'etat transitoire des trois pointeurs: `current=45`, `previous=44`, `last-known-good=43`, tous fondes sur l'etat Firestore restaure. Data Access n'a releve aucune lecture publique de `furniture` ni aucun acces a `public/meta`, puis `DATA_READ` et `DATA_WRITE` ont ete retires et `auditConfigs: null` reverifie. Le contrat de synchronisation decrit ci-dessous a ensuite ete deploye sur `secondevie-next-sandbox` et valide par les suites locales Node 22/Java 21, la CI et les probes HTTP. Aucun paiement ni environnement de production n'a ete touche.

La passe de synchronisation locale du 2026-07-19 a ferme les ecarts suivants dans le code:

- le CAS de `current` precede maintenant toute rotation de `previous`/LKG: un CAS refuse ne modifie aucun pointeur de secours;
- un retry de publication repare une rotation interrompue de `previous`/LKG et exclut explicitement une release rejetee des candidats LKG;
- un rollback conserve le high-water mark `desiredRevision`, attend la fin du worker fence, remet a zero l'identite revalidee et suit la revalidation par le couple revision/hash;
- le reconciler reprend un rollback interrompu sans declarer l'etat sain tant que `previous` ne correspond pas a la source rejetee;
- la liberation d'un lease est liee a son token: un ancien worker ne peut pas effacer le lease d'un build plus recent;
- le reconciler peut reprogrammer la revalidation meme en mode `paused`, notamment apres un rollback;
- le GC media protege explicitement les releases `current`, `previous` et LKG, quel que soit leur age, et s'arrete si un pointeur ou un index retenu est illisible;
- Maintenance verifie l'integrite de chaque release avant d'afficher son etat ou d'autoriser sa selection;
- le lecteur journalise un basculement sur un fallback sans reintroduire de lecture Firestore;
- chaque mutation publie un `impact-plan.json` immutable, calcule par diff entre releases, qui contient ancienne/nouvelle URL produit, categories feuille/parentes et drapeaux galerie/recherche/sitemap; les depassements de bornes et rollbacks passent par un mode `full` explicitement motive;
- la resolution d'une fiche compare l'ID direct puis le suffixe canonique contre les IDs reels du snapshot; un ID Firestore contenant des tirets n'est jamais tronque au dernier tiret;
- `stateVersion`, le token/TTL du lease et l'operation de rollback proprietaire ferment les ecritures tardives; un CAS `current` reussi mais une finalisation Firestore interrompue reste dans un etat reparable par le reconciler;
- la revalidation HMAC couvre le corps exact, le projet, l'audience et les quatre identites revision/manifeste/agregat/plan; elle invalide les chemins du plan et le seul tag mutable `catalog:api-pointer`, jamais le cache des releases immuables;
- `integrityState`, `sourceLagState`, `invalidationState` et `servedState` remplacent tout booleen sain ambigu; une version n'est marquee servie qu'apres lecture concordante de `/api/catalog/version` et d'un echantillon HTML;
- les pages ISR lisent le pointeur Storage frais a chaque regeneration; les API utilisent un cache pointeur de 15 secondes explicitement invalide et des releases immuables; ISR 300 reste l'unique filet temporel de page;
- apres acceptation de l'invalidation et preuve exacte de `/api/catalog/version`, le backend remplace le document minimal `sys_catalog_live/current`, avant le controle HTML; il ne contient ni prix, ni stock, ni image et n'est jamais autoritaire pour le commerce;
- la galerie visible confirme ce signal par l'endpoint version avec des reprises bornees, charge les 48 cartes de la release exacte depuis `/api/catalog` et remplace ses grilles Nouveautes/Petits Prix sans attendre ISR; `router.refresh()` reste lance pour faire converger le document et les autres surfaces;
- la preuve HTML versionnee reste obligatoire pour `servedState=observed`, les reprises Cloud Tasks et l'exploitation, mais son retard ne bloque plus le signal ni les cartes visibles;
- cette preuve distingue les chemins encore publies des anciennes fiches retirees: une URL courante doit repondre 200 avec le hash de release, tandis que l'ancien chemin d'un archivage ou d'un changement de slug doit repondre 404;
- le checkout exige encore le statut `published`, preserve la semantique d'un prix courant egal a zero et relit prix/stock dans Firestore;
- les backfills image s'appuient uniquement sur `onCatalogSourceWrite` et ne peuvent plus recreer `public/meta`.

Le code de ce chantier est local uniquement jusqu'a la phase de deploiement explicitement autorisee.

## 5. Publication et indexabilite

Une annonce visible n'est pas automatiquement indexable. `AdminForm` active
automatiquement l'intention `seoIndexable` lorsque le nom contient au moins
quatre caracteres, l'histoire au moins 48 caracteres et une image est presente.
`src/lib/seo/indexability.js` revalide ensuite titre, description, categorie,
image, statut public et cette intention. Aucun champ SEO manuel n'est demande.

Regles:

- un brouillon ou un produit incomplet ne doit pas entrer dans le sitemap;
- un produit sans image exploitable ne doit pas etre force indexable;
- le slug public accepte l'identifiant ou une forme lisible, mais l'identifiant Firestore reste l'ancre stable;
- les metadata doivent utiliser l'URL canonique construite depuis `NEXT_PUBLIC_SITE_URL`;
- les cartes, categories et pages detail doivent consommer le meme produit normalise.

## 6. Disponibilite commerciale

La regle unique est `isPurchasable` dans `src/kit/commerce/purchasability.js`:

```text
non vendu
ET stock > 0
ET prix > 0
ET priceOnRequest != true
```

Toutes les surfaces doivent respecter cette regle:

- carte galerie;
- fiche produit;
- panier;
- wishlist vers panier;
- checkout;
- verification serveur de `createOrder`.

Le serveur reste autoritaire. Un bouton visible ne garantit jamais que le stock est encore disponible.

## 7. Recherche

La recherche combine:

- suggestions dans le header via `SearchSuggestIsland`;
- page `/recherche` via `SearchResultsIsland`;
- modele client `src/kit/marketplace/searchModel.js`;
- endpoint serveur `/api/search`.

Le moteur doit normaliser accents, casse et termes de categorie sans exposer les brouillons. `/recherche` reste `noindex,follow` pour eviter les pages de resultats infinies dans l'index.

L'appel normal du catalogue de recherche demande 120 cartes. Le helper snapshot applique les memes bornes et la meme normalisation que le contrat historique, sans fallback Firestore visiteur. Les parametres `limit` et `cursor` invalides sont rejetes avant toute lecture de snapshot.

## 8. Personnalisation editoriale

Les ordres et contenus de galerie sont stockes dans `sys_metadata`, notamment la configuration galerie et les listes editoriales. `AdminHomepage` et `GlobalInventoryView` pilotent ces donnees.

Ne pas melanger:

- l'ordre editorial, qui change la presentation;
- la categorie, qui change la taxonomie;
- la publication, qui change la visibilite;
- le stock, qui change la possibilite d'achat.

## 9. Fichiers structurants

```text
src/kit/admin/AdminForm.jsx
src/kit/admin/AdminItemList.jsx
src/kit/admin/GlobalInventoryView.jsx
src/kit/admin/adminPublicCatalog.js
src/kit/admin/productPublicationClient.js
src/kit/config/constants.js
src/lib/server/products.js
src/lib/server/productRoute.js
src/lib/seo/categories.js
src/lib/seo/indexability.js
src/kit/marketplace/GalleryServerView.jsx
src/kit/marketplace/CategoryServerView.jsx
src/kit/marketplace/ProductDetailServerView.jsx
src/kit/marketplace/SearchResultsIsland.jsx
src/kit/marketplace/searchModel.js
app/api/catalog/route.js
src/lib/server/materializedCatalog.js
src/lib/server/materializedCatalogValidation.cjs
functions/src/catalog/
functions/src/commerce/domain/productCommands.js
functions/src/commerce/domain/productCommandRepository.js
functions/src/commerce/v2ProductCommands.js
functions/src/publication/productPublication.js
src/kit/commerce/adminProductCommandClient.js
functions/src/catalog/catalogMaintenance.js
functions/src/triggers/onArtifactDeleted.js
functions/src/triggers/onArtifactUpdated.js
```

## 10. Dettes et precautions

| Sujet | Statut | Regle |
| --- | --- | --- |
| donnees historiques partiellement normalisees | `DEBT` | utiliser les scripts de backfill en dry-run avant toute ecriture |
| assets source candidats au nettoyage | `DEBT` | aucune suppression sans preuve `rg`, reseau et visuelle |
| migrations de collection | `PRODUCTION_DEFERRED` | preparer mapping, sauvegarde, dry-run, comptages et rollback |

## 11. Gates

```bash
npm run next:routes
npm run seo:surface
npm run perf:category-direct
npm run perf:product-direct
npm run test:catalog:core
npm run test:catalog:resilience
npm run test:catalog:security
```

Les scripts E2E ou les backfills qui touchent Firebase ne sont lances que sur l'environnement explicitement choisi et avec leurs confirmations protegees.
