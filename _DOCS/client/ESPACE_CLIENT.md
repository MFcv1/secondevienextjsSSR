# Espace client

Derniere mise a jour: 2026-08-01
Statut: `PREPROD_READY`

Restriction active:

> Le suivi transactionnel, la reprise 3DS/reload, l'annulation et les documents
> sandbox ont ete qualifies en Gate 8 sur fixtures. Aucun document n'est une
> facture fiscale et aucune activation publique ou live n'en decoule.

## 1. Routes et acces

Les deux routes personnelles sont dynamiques et non indexables:

- `/mes-commandes`: tableau de bord client;
- `/wishlist`: liste de souhaits complete.

`OrdersPageIsland` et `WishlistPageIsland` attendent la resolution Auth avant d'afficher les donnees personnelles. Un utilisateur non connecte est dirige vers le workflow de connexion commun.
Les actions `connectez-vous` et `inscrivez-vous` de `/wishlist` ouvrent la
modale Auth publique commune via `sv:open-login`; elles ne redirigent jamais
vers `/admin`.

La route privee `/payer/[orderId]/[token]` est un tunnel distinct, dynamique
et non indexable pour les liens emis par l'administration. Elle collecte les
coordonnees et affiche Stripe sans creer de compte ni ouvrir de session Auth.
La commande est confirmee et recapitulée par e-mail mais n'apparait pas
automatiquement dans `/mes-commandes`, dont la lecture reste liee a un UID
authentifie. Ce rail est code localement et non deploye au 2026-08-01.

## 2. Sections de Mon espace

`src/kit/commerce/MyOrdersView.jsx` regroupe:

| Section | Source | Capacite actuelle |
| --- | --- | --- |
| Commandes | reader v2 UID actif; adaptateur v1 historique explicitement read-only | pagination serveur v2 et historique v1 read-only |
| Suivi de livraison | `shipmentTracking` derive par le reader v2 | transporteur, numero copiable, lien officiel allowliste ou repli sans suivi |
| Documents | snapshots de commande + PDF serveur prive | ouvrir, enregistrer, partager et recevoir par e-mail les seuls documents sandbox admissibles |
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

Pour une commande expediee ou livree, le reader derive `shipmentTracking`
depuis `fulfillmentSummary`: libelle du transporteur, numero et page de suivi
officielle lorsqu'elle est allowlistee. `MyOrdersView` restitue ces valeurs
dans le dossier de commande et n'affiche aucun faux lien pour une expedition
sans suivi ou un transporteur libre.

Recette sandbox du 2026-07-28: un OTP Gmail a ouvert une session Firebase
cliente, puis `/mes-commandes` a charge `listMyOrdersV2` sous Auth/App Check et
Rules restrictives sans erreur. La section Documents a conserve la suspension
explicite des PDF fiscaux legacy. Aucun checkout, cancel ou writer commerce
n'a ete active.

Recette catalogue reel bornee du 2026-07-29: le compte Loa a charge trois
commandes v2 durables, dont une commande de trois meubles et un remboursement
Stripe complet. Les compteurs Commandes et Remboursements, les statuts Payee
et Remboursee et le texte de delai bancaire sont corrects.

Depuis le 2026-08-01, `Demander un retour ou un remboursement` ouvre une
modale integree et appelle `requestCustomerReturn` sous Auth et App Check. Le
serveur reverifie l'UID proprietaire, le paiement, les lignes et quantites,
puis cree un dossier backend-only et une notification e-mail administrateur.
Le client retrouve le dernier etat dans sa commande: a examiner, retour
autorise, remboursement lance, termine, refuse ou a verifier. La demande ne
declenche jamais Stripe elle-meme: l'administratrice choisit le remboursement
direct si la piece est encore a l'atelier, ou le remboursement apres retour et
inspection si elle a deja quitte l'atelier.

La reprise UX du 2026-07-29 normalise les timestamps callable, projette
`shippingSnapshot` vers le bloc Adresse, raccorde les documents immuables et
rend les actions de document adaptatives sans chevauchement sur les largeurs
intermediaires. Les recus de paiement et confirmations de remboursement sont
joints par `listMyOrdersV2`, puis ouvrables en PDF explicitement marque
`sandbox` et `non fiscal`.

Depuis le 2026-07-31, l'action document ouvre une bottom sheet mobile ou une
modale desktop. `prepareCommerceDocumentDelivery` exige Auth et App Check,
reverifie l'UID proprietaire, materialise un PDF serveur immutable sous hash,
renvoie ses octets au navigateur et programme une copie e-mail. L'interface
propose ensuite `Ouvrir le PDF`, `Enregistrer`, le partage natif lorsque
`navigator.canShare({ files })` l'autorise, et une aide de localisation adaptee
a iPhone, Android ou ordinateur. Elle annonce `Telechargement lance`, jamais
une fin de telechargement que le navigateur ne permet pas d'observer.

Dettes UX restantes observees sur ces donnees reelles:

- le contrat d'entree v2 ne conserve pas le telephone saisi au checkout, donc
  le profil affiche encore `A completer`;
- les snapshots d'item n'alimentent pas l'image attendue par `getItemImage`,
  donc plusieurs dossiers affichent la meme image de repli;
- ces projections ne doivent jamais masquer le statut durable ni le
  remboursement.

## 4. Factures et avoirs

Les generateurs PDF client legacy restent en source mais ne sont plus
appelables depuis `MyOrdersView`. Le lecteur client joint au plus 20 documents
immuables par commande et n'expose que leurs metadonnees utiles. Le renderer
Node `commerceDocumentArtifact.js` produit le PDF prive correspondant avec une
mention visible `sandbox - non fiscal`; le meme artefact exact sert a
l'ouverture, l'enregistrement, au partage et a la piece jointe e-mail.

Le stockage utilise `commerce-documents/v2/...` sous un identifiant
proprietaire hashe. Les Rules refusent toute lecture ou ecriture directe de ce
prefixe. La callable renvoie un contenu borne a 2 Mio uniquement apres controle
du proprietaire. L'e-mail est deduplique par fenetre de dix minutes, limite a
24 nouvelles intentions quotidiennes par UID et ne peut cibler qu'une adresse
derivee de la commande. Un echec d'envoi ne bloque jamais le PDF.

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
Le premier rendu de `WishlistPageIsland` reste identique entre serveur et
navigateur. La liste locale est chargee uniquement par
`subscribeWishlistItems` apres montage afin d'eviter toute divergence
d'hydratation avec `localStorage`.

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
src/kit/commerce/CommerceDocumentModal.jsx
src/kit/commerce/commerceV2Client.js
src/kit/commerce/checkoutRecovery.js
src/kit/commerce/checkoutContract.js
src/kit/commerce/shippingCarriers.js
src/kit/marketplace/WishlistView.jsx
src/kit/marketplace/wishlistState.js
src/kit/commerce/guestCart.js
src/utils/generateCommerceDocument.js
src/utils/generateInvoice.js
src/utils/shippingAddress.js
functions/src/commerce/v2DocumentDelivery.js
functions/src/commerce/domain/commerceDocumentArtifact.js
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
5. le PDF fiscal legacy reste masque; Gate 7A autorise seulement un recu
   sandbox serveur explicitement non fiscal apres capture, distinct de la
   confirmation de remboursement;
6. la modale document ouvre le PDF, lance l'enregistrement, propose le partage
   seulement lorsque le navigateur l'autorise et affiche l'e-mail masque;
7. un double clic ne cree pas deux intentions e-mail dans la meme fenetre;
8. wishlist puis ajout panier d'un produit disponible;
9. deconnexion et protection des routes.

Ce smoke reste une verification UI. Il ne qualifie pas la coherence Stripe/commande/stock et ne remplace pas les gates commerce.

La recette Gate 8 est fermee sur fixtures: paiement accepte, refus/retry, 3DS,
reprise, annulation provider-first, concurrence stock, suivi commande et
documents sandbox ont converge vers la verite serveur. La verification OTP
invite a ete observee; les commandes financieres finales restent correlees au
compte fixture allowliste. L'UI fixture publique est refermee.

Correctifs UX du 2026-07-30:

- le telephone saisi au checkout est conserve dans `shippingSnapshot` et
  reutilise dans la synthese du profil client;
- nom, telephone, rue, code postal et ville exposent les attributs
  d'autocompletion navigateur adaptes;
- les compteurs de commandes, adresse et remboursements restent neutres pendant
  le chargement et n'affichent plus de faux zero;
- une commande payee non deja remboursee propose une action directe
  `Demander un retour ou un remboursement`. Cette action prepare une demande
  adressee a l'atelier avec le numero de commande; elle ne declenche ni Stripe
  ni remise en stock.
