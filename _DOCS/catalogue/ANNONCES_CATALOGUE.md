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

La recette de cloture du 2026-07-18 a exerce un rollback reel, sa pause, puis la reconstruction. Une recette complementaire du 2026-07-19 a modifie puis restaure le prix et le stock d'un meuble sandbox existant, verifie le snapshot public et ouvert le checkout sans paiement ni creation de commande. Deux reconstructions finales ont elimine l'etat transitoire des trois pointeurs: l'etat sandbox est `current=45`, `previous=44`, `last-known-good=43`, tous sains et fondes sur le meuble restaure. Data Access n'a releve aucune lecture publique de `furniture` ni aucun acces a `public/meta`; seules les lectures attendues du builder et les deux ecritures admin de modification/restauration ont ete observees. La preuve Data Access finale est conservee dans `_DOCS/data/AUDIT_COUTS_FIRESTORE.md`; la roadmap temporaire a ete supprimee apres fermeture de toutes ses gates.

La passe de robustesse locale finale du 2026-07-18 a ferme les derniers ecarts trouves dans le code:

- le CAS de `current` precede maintenant toute rotation de `previous`/LKG: un CAS refuse ne modifie aucun pointeur de secours;
- un retry de publication repare une rotation interrompue de `previous`/LKG et exclut explicitement une release rejetee des candidats LKG;
- un rollback conserve le high-water mark `desiredRevision`, attend la fin du worker fence, remet a zero l'identite revalidee et suit la revalidation par le couple revision/hash;
- le reconciler reprend un rollback interrompu sans declarer l'etat sain tant que `previous` ne correspond pas a la source rejetee;
- la liberation d'un lease est liee a son token: un ancien worker ne peut pas effacer le lease d'un build plus recent;
- le reconciler peut reprogrammer la revalidation meme en mode `paused`, notamment apres un rollback;
- le GC media protege explicitement les releases `current`, `previous` et LKG, quel que soit leur age, et s'arrete si un pointeur ou un index retenu est illisible;
- Maintenance verifie l'integrite de chaque release avant d'afficher son etat ou d'autoriser sa selection;
- le lecteur journalise un basculement sur un fallback sans reintroduire de lecture Firestore;
- la revalidation HMAC inclut `/api/catalog` et `/api/search`; ces API ne conservent plus de reponse catalogue persistante hors de l'identite ETag, tandis que le TTL pointeur de 300 secondes preserve le contrat ISR public en cas d'echec de l'invalidation;
- le checkout exige encore le statut `published`, preserve la semantique d'un prix courant egal a zero et relit prix/stock dans Firestore;
- les backfills image s'appuient uniquement sur `onCatalogSourceWrite` et ne peuvent plus recreer `public/meta`.

Ces corrections sont deployees dans le sandbox. La recette cloud complementaire du 2026-07-19 etend la preuve jusqu'a la revision saine `45`, avec `previous=44` et LKG `43` egalement saines.

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
