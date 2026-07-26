# Espace client

Derniere mise a jour: 2026-07-26
Statut: `PREPROD_READY`

Restriction active:

> Le statut ne qualifie pas encore le suivi transactionnel, la reprise guest/3DS ni les factures. Ces surfaces suivent [NOYAU_COMMERCE_STABILISATION.md](../commerce/NOYAU_COMMERCE_STABILISATION.md).

## 1. Routes et acces

Les deux routes personnelles sont dynamiques et non indexables:

- `/mes-commandes`: tableau de bord client;
- `/wishlist`: liste de souhaits complete.

`OrdersPageIsland` et `WishlistPageIsland` attendent la resolution Auth avant d'afficher les donnees personnelles. Un utilisateur non connecte est dirige vers le workflow de connexion commun.

## 2. Sections de Mon espace

`src/kit/commerce/MyOrdersView.jsx` regroupe:

| Section | Source | Capacite actuelle |
| --- | --- | --- |
| Commandes | `orders` actuellement filtre par e-mail verifie | historique borne, statuts, detail, annulation admissible |
| Factures et avoirs | snapshots de commande | PDF client actuel a reclasser comme recu provisoire |
| Liste de souhaits | `users/{uid}/wishlist` | apercu et lien vers `/wishlist` |
| Adresse | derniere commande | affichage livraison/facturation |
| Profil | Firebase Auth + derniere commande | affichage nom, email, telephone |
| Support | configuration metier | contact et aide |

Adresse et profil sont aujourd'hui principalement des vues de synthese derivees des commandes; ce ne sont pas encore un carnet d'adresses complet editable.

## 3. Commandes

Le client ne lit que les commandes admises par les Rules et sa requete. Le code actuel interroge `userEmail`; les Rules autorisent le proprietaire UID ou le meme e-mail verifie. La cible est un repository UID autoritaire avec un rattachement invite borne, afin qu'un changement d'e-mail ne fasse pas disparaitre l'historique.

Les statuts importants sont actuellement reconstruits depuis le champ composite `status`, notamment:

- `pending_payment`;
- `paid`;
- `payment_failed`;
- `canceled`;
- `refund_pending`;
- `refunded`;
- `refund_failed`;
- statuts logistiques comme expedition ou completion.

Une commande carte payee ne peut pas etre annulee librement. Elle passe par le flux de remboursement admin/Stripe. L'annulation non payee actuelle ne neutralise toutefois pas d'abord le PaymentIntent et son chemin multi-SKU doit etre corrige avant recette.

## 4. Factures et avoirs

Le PDF actuel est genere cote client via un import dynamique de `src/utils/generateInvoice.js`, a partir du snapshot de commande. Il peut etre produit pour un ordre non paye, derive son numero de l'ID et ne constitue pas encore une facture autoritaire archivee.

Jusqu'a la gate documentaire/comptable du noyau:

- parler de recu provisoire;
- ne proposer aucun document comme facture avant paiement confirme;
- produire cote serveur un recu sandbox immutable apres paiement;
- reserver les termes facture/avoir a des documents juridiquement et
  comptablement valides avant live;
- produire un document de remboursement distinct sans effacer le fulfillment;
- ne pas promettre une date de credit exacte que Stripe ou la banque ne garantissent pas.

## 5. Wishlist

La wishlist utilise:

- `src/kit/marketplace/wishlistState.js` pour le modele et les abonnements;
- `users/{uid}/wishlist/{item}` pour l'utilisateur connecte;
- un etat local borne pour la continuite visiteur;
- le catalogue courant pour rafraichir disponibilite et visuel.

Un passage wishlist -> panier doit revalider `isPurchasable`. Les informations de prix/stock conservees dans la wishlist ne sont jamais autoritaires.

## 6. Panier et handoff

Le panier invite est persiste localement par `src/kit/commerce/guestCart.js`. Apres connexion, l'identite produit deterministe evite les doublons. Le checkout utilise une handoff explicite pour ne pas perdre le panier pendant l'authentification ou une navigation.

## 7. Coherence Auth/UI

Le header, le mega menu et l'espace client consomment le meme `authStore`/`AuthContext`. Apres une connexion Google, OTP ou passkey:

- le header affiche l'etat connecte;
- le mega menu affiche `Mon espace`;
- la route personnelle reconnait la session sans faux detour galerie;
- la deconnexion nettoie l'etat Firebase et l'etat local lie a la connexion rapide.

Le detail de ce contrat est dans `../security/AUTHENTIFICATION.md`.

## 8. Donnees et confidentialite

- ne jamais exposer toutes les commandes au client pour filtrer ensuite localement;
- ne jamais utiliser l'e-mail seul comme preuve de propriete d'une commande;
- limiter les snapshots et desabonner les listeners au demontage;
- ne pas stocker de donnees de carte;
- traiter adresses, telephone et historique comme donnees personnelles;
- la suppression de compte devra definir retention comptable et anonymisation avant production.

## 9. Fichiers structurants

```text
app/mes-commandes/page.jsx
app/mes-commandes/loading.jsx
app/mes-commandes/OrdersPageIsland.jsx
app/wishlist/page.jsx
app/wishlist/WishlistPageIsland.jsx
src/kit/commerce/MyOrdersView.jsx
src/kit/marketplace/WishlistView.jsx
src/kit/marketplace/wishlistState.js
src/kit/commerce/guestCart.js
src/utils/generateInvoice.js
src/utils/shippingAddress.js
```

## 10. Dettes controlees

| Sujet | Statut | Reprise |
| --- | --- | --- |
| edition profil et carnet d'adresses | `CONCEPTION` | decision produit apres demonstration |
| page de gestion des passkeys | `PRODUCTION_DEFERRED` | domaine final et besoin client confirme |
| suppression/export complet des donnees | `PRODUCTION_DEFERRED` | politique legale et retention comptable validees |

## 11. Validation

Smoke recommande pour une passe compte non transactionnelle:

1. connexion reelle;
2. `Quitter` dans le header et `Mon espace` dans le menu;
3. ouverture directe et via menu de `/mes-commandes` sans flash galerie;
4. commandes limitees au compte;
5. avant Gate 7A: PDF legacy non presente comme facture/avoir ou section
   masquee; apres Gate 7A: seul recu sandbox serveur admissible;
6. wishlist puis ajout panier d'un produit disponible;
7. deconnexion et protection des routes.

Ce smoke reste une verification UI. Il ne qualifie pas la coherence Stripe/commande/stock et ne remplace pas les gates commerce.

La recette transactionnelle client/guest ne commence qu'en Gate 8, apres
fermeture de Gate 7A et deux runs Gate 7B sur le release final.
