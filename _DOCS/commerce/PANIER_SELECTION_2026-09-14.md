# Sélection et montants du panier — 14 septembre 2026

Complément au [chantier panier](PANIER_2026-09-14.md).

- Correction de séparation : le compteur panier additionne exclusivement les
  quantités des lignes du panier, comme la page panier. Le cœur du header compte
  les identifiants uniques de la wishlist via son abonnement partagé, y compris
  lorsque le panneau est fermé. La lecture des fiches
  catalogue reste limitée aux douze favoris affichés et au panneau ouvert.
- Le prix connu reste visible sur un favori vendu, sans permettre son achat.
  En l'absence de lignes panier, le montant central reste à zéro et affiche
  « Votre panier est vide ». Les favoris restent une section séparée avec ajout
  explicite au panier. Quand le panier
  contient des lignes, son total conserve les quantités et la logique existante.
- Le grand texte promotionnel de l'état avec favoris est retiré. Le focus
  initial va au dialogue ; le retour conserve un soulignement clavier sans cadre.
- Les débordements html, body et du conteneur galerie sont bloqués tant que
  le dialogue est ouvert, puis restaurés par les sélecteurs CSS.

Sept tests données réussis, dont compteur fermé sans requêtes catalogue ; ESLint,
diff-check et build Node 22 réussis. Aucun test navigateur exécuté : scroll et
rendu Safari restent à confirmer par l'utilisateur.

Publication issue de la source combinée 009, avec seulement les six fichiers
de ce correctif remplacés. Hosting 010 publié à 100 %, identifiant
`sv-mu13ihs7-fab933387c22`, `/` et `/checkout` HTTP 200. Source combinée locale :
`/tmp/sv-cart-favorites-kDx88A`. Retour arrière : Hosting 009.
Les modifications panier locales précédentes, encore non committées, ont été
préservées ; aucun commit global de ces changements ni déploiement Functions.

## Séparation des compteurs livrée

Le 14 septembre à 10:47 UTC, Hosting `build-2026-09-14-011` est publié à
100 % (`sv-mu146hr0-40fb6debf080`). Les routes `/`, `/wishlist` et `/checkout`
répondent HTTP 200 avec cet identifiant. Source de `010` conservée, avec les
quatre composants corrigés : CartPanelIsland, LazyCartPanelIsland,
WishlistToggleIsland et CartPageView. Le panier se synchronise en arrière-plan
sans attendre son ouverture ; son badge provisoire n'anticipe plus les ajouts.

Validation : 15 tests Node ciblés, lint des quatre composants, build Node 22 et
diff-check réussis. Aucun navigateur ni paiement exécuté ; recette visuelle
confiée à l'utilisateur. Aucun déplacement, suppression ou déploiement Functions.
Preuve : `logs/cart-20260914/counters-delivery.json`. Retour arrière : Hosting
`build-2026-09-14-010`.

## Clôture et contrôle de main

L'utilisateur confirme le bon fonctionnement du panier et des compteurs après
son essai sandbox. Contrôle de clôture : `011` sert toujours 100 % du trafic,
les trois routes répondent HTTP 200, et tous les fichiers applicatifs du lot
panier correspondent octet pour octet à l'archive publiée. 18 tests Node
ciblés et lint réussis. L'attente du test UI de panier vide a été alignée sur
le titre final « Votre panier », sans exécuter de navigateur ni de nouveau build.

La comparaison de 770 fichiers applicatifs/configuration/scripts révèle cinq
écarts exclusivement sur les images, déjà committés sur `main` dans `61efd41` :
`CategoryServerView.jsx`, `GalleryGridActionsIsland.jsx`,
`GalleryProductCardServer.jsx`, `imageUtils.js` et `productImageLoader.js`.
Hosting `011` conserve une version antérieure de ces fichiers. Aucun retour
en arrière local ni nouveau déploiement effectué lors de cette clôture.
Les journaux précédents restent des observations historiques, pas une preuve
que leurs lots sont tous encore présents dans le cloud.
