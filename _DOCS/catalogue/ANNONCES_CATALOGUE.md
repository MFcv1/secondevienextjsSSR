# Annonces, catalogue et recherche

Derniere mise a jour: 2026-07-18
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
- contenu: `description`, materiau, couleur, style;
- dimensions: largeur, profondeur, hauteur et texte libre de dimensions;
- vente: prix, prix de depart, stock, vendu/reserve, prix sur demande;
- classement: categorie, nouveaute, petit prix et ordres editoriaux;
- SEO: `seoTitle`, `seoDescription`, `seoIndexable`;
- medias: `images`, `imageUrl`, `thumbnails`, `thumbnailUrl`, `imageVariants`, `imageMetadata`.

Les anciennes formes de donnees restent normalisees par `src/lib/server/products.js` et `src/utils/imageUtils.js`, mais les nouvelles ecritures doivent produire le modele courant complet.

## 4. Cycle de vie

```text
brouillon admin
  -> validation champs et images
  -> ecriture Firestore
  -> onCatalogSourceWrite (deduplication + desiredRevision)
  -> Cloud Tasks dispatchCatalogBuild
  -> snapshot Storage immuable + manifeste + pointeur current
  -> dispatchCatalogRevalidation signe HMAC
  -> revalidation Next
  -> produit visible dans galerie/categorie/recherche/sitemap selon ses flags
  -> panier/checkout si isPurchasable=true
  -> vendu ou remis en vente selon cycle de commande/refund
```

La suppression ou modification d'un produit met ses medias retires en quarantaine. Dans le sandbox, le GC media est actif mais ne peut supprimer qu'apres 90 jours, apres verification de la source Firestore, des generations Storage et des releases retenues. Le GC des releases protege toujours `current`, `previous`, LKG, les 10 releases les plus recentes et toute release de moins de 48 heures. Il s'execute apres une publication et chaque jour. Ne pas contourner ces garde-fous avec une migration non auditee.

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

Le lecteur valide schema, manifestes et checksums. Il tente `current`, puis `previous`, puis `last-known-good`; il ne scanne jamais Firestore en cas de panne Storage. Les seuls modes durables sont `active` et `paused`. Maintenance admin valide les releases et effectue le CAS de rollback, puis la reconstruction republie l'etat Firestore courant.

## 5. Publication et indexabilite

Une annonce visible n'est pas automatiquement indexable. `src/lib/seo/indexability.js` exige un ensemble coherent de titre, description, categorie, image et intention `seoIndexable`.

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
src/kit/config/constants.js
src/lib/server/products.js
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
npm run perf:gallery-direct
npm run perf:category-direct
npm run perf:product-direct
npm run test:catalog:core
npm run test:catalog:resilience
npm run test:catalog:security
```

Les scripts E2E ou les backfills qui touchent Firebase ne sont lances que sur l'environnement explicitement choisi et avec leurs confirmations protegees.

## 12. Roadmap temporaire de fermeture du catalogue legacy

Statut: `DEPLOYE_RECETTE_NAVIGATEUR_EN_COURS`

- debut documentaire: 2026-07-18;
- cible de cloture documentaire: 2026-07-25;
- environnement de travail: sandbox `secondevienextjsssr` uniquement;
- fin du plan: tous les criteres de la section 12.10 sont passes, puis cette section est fusionnee dans l'etat stable du chapitre et supprimee;
- principe utilisateur: privilegier la verification manuelle dans le navigateur integre pour les parcours, le cache, l'admin et le checkout; ne conserver que les petits tests deterministes qui protegent un invariant non visible.

Cette roadmap ferme le lot `public/meta`, catalogue public materialise et anciens rails Firebase Hosting/SEO. Elle ne donne pas l'autorisation de supprimer sans preuve les adaptateurs historiques d'Auth, de commandes, de categories ou d'images qui peuvent encore proteger des donnees reelles.

### 12.1 Architecture cible non negociable

```text
ecriture admin/commerce
  -> furniture [DB autoritaire prive]
  -> onCatalogSourceWrite [F]
  -> revision monotone + build final
  -> release immuable validee [ST]
  -> current / previous / last-known-good [ST]
  -> revalidation HMAC machine-only
  -> /api/catalog same-origin [API]
  -> pages, recherche, wishlist et admin

checkout
  -> relecture prix + stock Firestore [F autoritaire]
  -> refus explicite si le prix affiche n'est plus courant
  -> confirmation utilisateur sur le nouveau total
  -> creation du paiement seulement apres confirmation
```

Il ne doit rester:

- qu'une seule source publique executable: le snapshot Storage;
- qu'un seul endpoint catalogue public: `/api/catalog`;
- qu'un seul proprietaire de la revision: la publication materialisee;
- qu'un seul mecanisme de revalidation: la signature HMAC serveur;
- qu'un seul mecanisme de rollback: un CAS privilegie vers un pointeur deja valide;
- aucune lecture anonyme de `furniture` ou `public/meta` dans Firestore;
- aucune valeur par defaut ou variable d'environnement capable de reactiver un moteur legacy.

### 12.2 Phase 1 - consolider le moteur actif avant toute suppression cloud

Objectif: rendre le snapshot autonome et recuperable avant de retirer l'ancien filet Firestore.

Changements code:

1. remplacer le pointeur `current.previous` partiel par trois pointeurs complets et independants:
   - `current.json`;
   - `previous.json`;
   - `last-known-good.json`;
2. exiger sur les trois pointeurs le meme contrat: `schemaVersion`, `projectionContractVersion`, revision, chemin manifeste, hash et date;
3. publier dans cet ordre: LKG <- ancien previous, previous <- ancien current, puis CAS de current vers la nouvelle release en dernier; gerer explicitement le premier bootstrap sans inventer de pointeur;
4. faire lire au runtime `current`, puis `previous`, puis LKG sans reconstruire un pointeur incomplet;
5. charger produit et metadata depuis le meme snapshot afin d'interdire une reponse produit revision N etiquetee N+1;
6. distinguer `product_not_found` d'une indisponibilite Storage; une panne technique ne doit plus devenir une fausse galerie vide ou un faux 404;
7. appliquer `no-store` aux `400`, `404` techniques et `503`; reserver le cache public/ETag aux reponses `200` et aux `404` metier explicitement choisis;
8. accepter un catalogue autoritaire vide apres un scan Firestore reussi; supprimer `allowEmptyCatalog`, qui laisse actuellement une ancienne release visible;
9. conserver les releases pointees et supprimer seulement les releases non referencees apres une periode de grace documentee.

Gate avant la phase 2:

- lecture froide reussie de current;
- simulation locale current invalide -> previous;
- simulation locale current + previous invalides -> LKG;
- erreur explicite si les trois releases sont invalides;
- aucune reponse d'erreur avec cache public;
- dernier rollout App Hosting stable identifie pour retour arriere.

### 12.3 Phase 2 - fermer l'exposition publique et supprimer `public/meta`

Ordre obligatoire afin de ne pas creer de coupure:

1. deployer le lecteur corrige de la phase 1;
2. verifier manuellement home, categorie, produit, recherche, wishlist et sitemap sur le sandbox;
3. modifier `firestore.rules`:
   - refuser toute lecture anonyme de `furniture`;
   - refuser toute lecture et ecriture client de `public/meta`;
   - conserver les acces admin forts strictement necessaires aux produits;
4. supprimer les branches `legacy`, `snapshot_canary` et fallback Firestore dans:
   - `src/lib/server/env.js`;
   - `src/lib/server/products.js`;
   - `app/api/catalog/route.js`;
   - `app/sitemap.js`;
5. supprimer les variables:
   - `PUBLIC_CATALOG_SOURCE`;
   - `PUBLIC_CATALOG_REGION`;
   - `PUBLIC_CATALOG_BASE_URL`;
   - `CATALOG_CANARY_ENABLED`;
   - `CATALOG_EMERGENCY_FIRESTORE_FALLBACK`;
6. retirer `x-catalog-canary` du contrat HTTP;
7. supprimer la Function cloud `publicCatalog`, puis le codebase `functions-public` de `firebase.json`, du workspace et des lockfiles;
8. supprimer le document `artifacts/{appId}/public/meta` seulement apres deploiement des Rules et verification qu'aucun lecteur executable ne subsiste;
9. retirer les IAM/invokers devenus sans cible.

Resultat attendu:

```text
rg executable sur publicCatalog|public/meta|PUBLIC_CATALOG_SOURCE|snapshot_canary
  -> zero resultat hors historique documentaire explicitement marque
```

### 12.4 Phase 3 - retirer la double invalidation et fiabiliser admin/checkout

Admin:

1. supprimer `src/kit/admin/publicCatalogInvalidation.js` et tous ses imports;
2. une ecriture produit reussie doit afficher `Enregistre - publication en cours`, sans attendre un second document legacy;
3. exposer au besoin l'etat minimal de publication existant via une Function admin bornee, sans creer une nouvelle collection;
4. corriger la conversion du stock pour conserver explicitement `0` et refuser les valeurs negatives ou non numeriques;
5. supprimer les caches persistants catalogue admin/wishlist qui ignorent revision et TTL;
6. conserver seulement une deduplication en vol limitee a la duree du composant ou de la requete; laisser CDN/ETag gerer le cache partage.

Checkout:

1. le listener doit ajouter et retirer un article de `unavailableItems` selon le nouvel etat;
2. `createOrder` doit comparer les prix envoyes avec les prix Firestore avant toute reservation ou creation de PaymentIntent;
3. en cas d'ecart, retourner une erreur metier structuree avec les articles et totaux autoritaires, sans paiement ni reservation;
4. le navigateur met a jour le panier, affiche clairement le changement et demande une nouvelle confirmation;
5. le second appel revalide encore prix et stock avant de poursuivre;
6. la reponse de succes doit retourner le total autoritaire affiche dans le modal Stripe.

Cette phase est terminee seulement si un prix change dans un second onglet avant checkout et que le client voit le nouveau montant avant toute possibilite de paiement.

### 12.5 Phase 4 - remplacer les modes historiques par un vrai controle operateur

Supprimer de `publicationState` et du reconciler:

- `legacy`;
- `shadow`;
- `snapshot_canary`;
- le faux mode `rollback`;
- toute transition qui reconstruit Firestore sous un nom de rollback.

Le controle durable ne conserve que:

- `active`: les revisions sont construites et publiees;
- `paused`: les mutations sont enregistrees mais aucun pointeur n'avance.

Ajouter dans Maintenance admin une action de rollback reelle:

1. admin fort + registre actif + App Check;
2. confirmation explicite de la revision source et cible;
3. verification manifeste/hashes avant mutation;
4. CAS de `current` vers `previous` ou LKG;
5. rotation coherente des pointeurs;
6. revalidation HMAC;
7. audit minimal sans payload produit;
8. bouton de reconstruction depuis Firestore pour revenir ensuite a une revision saine.

Aucun script local ne doit modifier directement un pointeur apres cette phase.

### 12.6 Phase 5 - supprimer les moteurs et scripts devenus inutiles

Suppressions catalogue cibles apres verification de leurs references:

```text
functions-public/
src/kit/admin/publicCatalogInvalidation.js
functions/src/maintenance/inventoryStats.js
scripts/bootstrap-catalog-shadow.mjs
scripts/catalog-sandbox-lib.mjs
scripts/e2e-catalog-shadow-compare.mjs
scripts/e2e-catalog-publication.mjs
scripts/e2e-catalog-cdn.mjs
scripts/e2e-catalog-rollback.mjs
scripts/measure-catalog-firestore-cost.mjs
scripts/set-catalog-publication-mode.mjs
scripts/e2e-revalidate-catalog.mjs
tests/catalog/public-api-parity.test.cjs
tests/catalog/emulator/functions/
tests/catalog/emulator/publication-flow.test.cjs
firebase.catalog-emulator.json
```

Nettoyage associe:

- supprimer les commandes `package.json` qui pointent vers ces fichiers;
- retirer les attentes `functions-public` des audits infra;
- modifier ou supprimer `check-product-ssr.mjs` et `audit-product-detail-images-cold.mjs`, qui appellent encore la Function legacy;
- supprimer le cache `sessionStorage` catalogue s'il n'a plus de consommateur utile;
- retirer les anciennes preuves generees de `logs/` une fois leur conclusion integree au chapitre canonique;
- ne conserver aucun dump Data Access, ETag brut, produit de test ou payload Firestore dans Git.

Les tests catalogue restants doivent etre consolides en trois petites suites:

1. coeur: projection allowlist, prix/stock/statut, catalogue vide, manifeste et hashes;
2. resilience: publication CAS et lecture current -> previous -> LKG en appelant le vrai code;
3. securite: Rules visiteur/admin, contrat HMAC de revalidation et absence de tout symbole/endpoint legacy.

Les tests `chaos`, `parity`, `shadow` ou `rollback` dont le nom promet plus que leurs assertions sont supprimes, pas renommes. Aucun nouveau Playwright catalogue n'est cree.

### 12.7 Phase 6 - retirer Firebase Hosting et SEO Functions historiques

Apres verification que le trafic public et les URLs canoniques passent uniquement par App Hosting:

1. verifier `/`, `/a-propos`, `/produit/*`, `/categorie/*`, `/sitemap.xml` et `/robots.txt` dans le navigateur;
2. supprimer les exports `sitemap`, `shareMeta`, `homeMeta`, `aboutMeta`, `productMeta`, `categoryMeta` des Functions;
3. supprimer `functions/src/seo/seoTools.js` si aucune autre reference executable ne subsiste;
4. retirer le bloc Hosting historique et ses rewrites de `firebase.json`;
5. desactiver la cible Firebase Hosting sandbox seulement apres verification des domaines/URLs qui la referencent;
6. retirer les dettes et audits infra qui imposaient encore ce moteur.

Les aliases de categories, migrations Auth, anciennes commandes et formes d'images ne sont pas inclus dans cette suppression sans audit de donnees propre a leur domaine.

### 12.8 Validation manuelle prioritaire dans le navigateur integre

Compte de recette: `loa.gto`. Aucun paiement ne doit etre confirme.

Scenario ferme:

1. ouvrir `/api/catalog?scope=full&limit=120` sans parametre cache-bust et noter revision/ETag sans les conserver dans Git;
2. ouvrir home, une categorie, un produit, recherche et wishlist;
3. dans Admin, creer un meuble de recette identifiable avec une image de test;
4. verifier son apparition sur la meme URL catalogue deja chauffee et dans les pages;
5. ajouter le meuble au panier, puis modifier son prix dans un second onglet;
6. ouvrir checkout: le changement de prix doit bloquer la poursuite, rafraichir le total et exiger une nouvelle confirmation;
7. saisir stock `0`: le produit doit devenir non achetable sans etre transforme en stock `1`;
8. remettre stock `1`: l'indisponibilite checkout doit disparaitre;
9. supprimer le meuble: meme URL catalogue, produit, recherche, wishlist et sitemap doivent converger; les medias doivent etre en quarantaine, pas supprimes immediatement;
10. depuis Maintenance, exercer le rollback pointeur vers une revision valide puis reconstruire l'etat Firestore courant;
11. verifier les erreurs reseau/console, les reponses froides/chaudes et les headers `no-store` des erreurs;
12. supprimer uniquement les donnees de recette creees par ce scenario.

La verification finale Data Access est manuelle et separee:

- activation courte `DATA_READ` + `DATA_WRITE` explicitement autorisee;
- calibration ouverture et fermeture dans la meme fenetre analysee;
- navigation publique et mutations admin identifiees;
- zero lecture `public/meta`;
- zero lecture `furniture` attribuee a la navigation visiteur; le scan builder apres mutation admin reste attendu et doit etre attribue a son service account;
- ecritures attendues limitees a la source, au ledger, au build, aux pointeurs et a la revalidation;
- desactivation immediate et verification `auditConfigs: null`.

### 12.9 Retention et stockage utile uniquement

Etat final attendu:

- `public/meta`: supprime;
- documents de test: supprimes apres recette;
- releases Storage: conserver current, previous, LKG et une grace courte pour les builds en cours;
- anciennes releases non pointees: GC automatique borne, jamais suppression au simple `rg`;
- ledger et builds: `expireAt` + politique TTL verifiee;
- quarantaine media: age minimal 90 jours conserve;
- caches navigateur persistants catalogue: supprimes;
- logs locaux et rapports E2E generes: non suivis et nettoyes apres synthese;
- secrets: conserver uniquement `CATALOG_REVALIDATION_HMAC_SECRET`, encore necessaire a la revalidation machine.

### 12.10 Definition de done du lot

Le lot est ferme uniquement si:

- le site public n'a qu'un moteur snapshot;
- la Function `publicCatalog`, son IAM et le codebase `functions-public` n'existent plus;
- `public/meta` n'existe plus dans le code, les Rules ni Firestore;
- aucun visiteur ne peut lire directement un document `furniture`;
- current, previous et LKG sont complets, persistants et testes avec le vrai lecteur;
- le rollback admin CAS a ete exerce puis annule par une reconstruction saine;
- prix, stock zero, remise en vente et suppression sont valides dans le navigateur sans cache-bust;
- checkout affiche toujours le montant Firestore avant paiement;
- les erreurs catalogue ne sont jamais cachees publiquement ni transformees en faux contenu vide;
- le catalogue vide est un etat publiable valide;
- les modes et variables legacy ont disparu;
- Firebase Hosting/SEO historique est retire apres validation des routes App Hosting;
- `package.json`, `firebase.json`, workspace, lockfiles, `map.md`, AGENTS et chapitres canoniques correspondent au code restant;
- `rg` ne trouve aucune reference executable aux fichiers/symboles supprimes;
- `git diff --check`, lint, build et les trois suites catalogue courtes passent;
- la recette navigateur et la fenetre Data Access finale sont terminees et nettoyees;
- aucun secret, payload sensible, log Data Access brut ou donnee de recette n'est conserve;
- cette roadmap temporaire est retiree du chapitre et remplacee par la description de l'architecture finale.
