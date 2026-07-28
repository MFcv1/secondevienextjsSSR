# Espace client

Derniere mise a jour: 2026-07-28
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
| Commandes | reader v2 UID actif; adaptateur v1 historique explicitement read-only | pagination serveur v2 et historique v1 read-only |
| Documents | snapshots de commande | aucun PDF fiscal legacy propose avant Gate 7A |
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

L'affordance d'annulation client est masquee en Gate 0B et la callable legacy
est bloquee avant effet. Les commandes existantes convergent uniquement par les
signaux Stripe autoritaires et les lecteurs de suivi.

La callable v2 `requestOrderCancellation` est deployee dans
`functions/src/commerce/v2Cancellation.js`. Elle exige App Check et une session
Firebase, derive le proprietaire exclusivement du contexte Auth puis execute la
coordination provider-first. Elle est exportee mais le controle mutations
serveur absent la refuse avant effet et son branchement `MyOrdersView` reste
derriere un flag compile a `false`: l'affordance reste masquee.

Gate 5 active `listMyOrdersV2` en sandbox: la Function filtre exclusivement par
`userId`, borne la page, verifie que le curseur appartient au meme UID et
renvoie les actions autorisees calculees serveur. `MyOrdersView` consomme ce
reader et sa pagination; l'adaptateur historique v1 ne promeut jamais une
commande ambigue.

Recette sandbox du 2026-07-28: un OTP Gmail a ouvert une session Firebase
cliente, puis `/mes-commandes` a charge `listMyOrdersV2` sous Auth/App Check et
Rules restrictives sans erreur. La section Documents a conserve la suspension
explicite des PDF fiscaux legacy. Aucun checkout, cancel ou writer commerce
n'a ete active.

## 4. Factures et avoirs

Le generateur PDF legacy reste en source mais n'est plus appelable depuis
`MyOrdersView`. La section Documents indique explicitement qu'aucune facture ni
aucun avoir definitif n'est emis pendant la stabilisation.

Jusqu'a la gate documentaire/comptable du noyau:

- ne proposer aucun document legacy comme facture ou avoir;
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

Le panier invite est persiste localement par `src/kit/commerce/guestCart.js`.
Chaque ligne porte un `cartLineId` et une `cartRevision`; la variante
Firestore preserve ces champs et incremente la revision dans une transaction.
Le checkout v2 cree explicitement une identite Firebase anonyme avant une
commande invitee, enregistre un descripteur de reprise sans secret lie a l'UID
et reprend 3DS/reload avant les gardes panier vide. Le succes n'est affiche
qu'apres `payment.status=succeeded`, avant un nettoyage qui ne retire que les
lignes achetees dont ID et revision sont inchanges. Une ligne retiree puis
reajoutee ou modifiee dans un autre onglet est donc preservee.

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
src/kit/commerce/commerceV2Client.js
src/kit/commerce/checkoutRecovery.js
src/kit/commerce/checkoutContract.js
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
