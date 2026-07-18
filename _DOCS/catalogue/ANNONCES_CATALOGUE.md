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

La suppression ou modification d'un produit met ses medias retires en quarantaine. Le GC catalogue est en dry-run par defaut et n'est autorise a supprimer qu'apres 90 jours, en verifiant les releases retenues. Ne pas contourner ces triggers avec une migration non auditee.

### 4.1 Catalogue public materialise

Le sandbox sert le catalogue depuis le bucket prive `secondevienextjsssr-catalog-europe-west4`. `PUBLIC_CATALOG_SOURCE=snapshot`, le canary est desactive et le fallback Firestore automatique est interdit.

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

Le lecteur valide schema, manifestes et checksums. Il tente `current`, puis `previous`, puis `last-known-good`; il ne scanne jamais Firestore en cas de panne Storage. L'ancien `publicCatalog` reste deploye uniquement comme rail de rollback operateur pendant la periode d'observation.

Les transitions de publication passent par `npm run catalog:mode -- --from=<mode> --to=<mode> --commit`. Les modes acceptes sont `shadow`, `snapshot_canary`, `snapshot`, `rollback` et `paused`; un retour `legacy` exige un redeploiement explicite d'App Hosting.

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
src/kit/admin/publicCatalogInvalidation.js
src/kit/config/constants.js
src/lib/server/products.js
src/lib/seo/categories.js
src/lib/seo/indexability.js
src/kit/marketplace/GalleryServerView.jsx
src/kit/marketplace/CategoryServerView.jsx
src/kit/marketplace/ProductDetailServerView.jsx
src/kit/marketplace/SearchResultsIsland.jsx
src/kit/marketplace/searchModel.js
functions-public/src/public/catalog.js
app/api/catalog/route.js
src/lib/server/materializedCatalog.js
src/lib/server/materializedCatalogValidation.cjs
functions/src/catalog/
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
npm run e2e:revalidate-catalog
npm run test:catalog:unit
npm run test:catalog:publisher
npm run test:catalog:chaos
npm run test:catalog:security
npm run test:catalog:emulator
npm run e2e:catalog:shadow
npm run e2e:catalog:publication -- --commit
npm run e2e:catalog:cdn
npm run e2e:catalog:rollback
npm run measure:catalog:cost
```

Les scripts E2E ou les backfills qui touchent Firebase ne sont lances que sur l'environnement explicitement choisi et avec leurs confirmations protegees.
