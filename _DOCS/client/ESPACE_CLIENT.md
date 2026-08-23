# Espace client

Derniere mise a jour: 2026-08-23
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
Le shell de connexion de `/mes-commandes` reste dans le chunk initial leger;
le workspace `MyOrdersView` est charge separement seulement apres identification
d'un utilisateur connecte. La route deconnectee ne doit donc jamais attendre
le bundle complet des commandes pour proposer la connexion.
Le segment n'a volontairement plus de `loading.jsx`: la page serveur ne charge
aucune donnee et l'etat Auth appartient a `OrdersPageIsland`. Cela evite qu'un
fallback de streaming reste affiche si Safari ne remplace pas la frontiere.
Les actions `connectez-vous` et `inscrivez-vous` de `/wishlist` ouvrent la
modale Auth publique commune via `sv:open-login`; elles ne redirigent jamais
vers `/admin`.

La route privee `/payer/[orderId]/[token]` est un tunnel distinct, dynamique
et non indexable pour les liens emis par l'administration. Elle collecte les
coordonnees et affiche Stripe sans creer de compte ni ouvrir de session Auth.
La commande est confirmee et recapitulée par e-mail mais n'apparait pas
automatiquement dans `/mes-commandes`, dont la lecture reste liee a un UID
authentifie. Ce rail est deploye sur le sandbox depuis le 2026-08-01 et actif
depuis le 2026-08-02 avec les controls `v2_all/v2` et Stripe test.

## 2. Sections de Mon espace

`src/kit/commerce/MyOrdersView.jsx` regroupe:

| Section | Source | Capacite actuelle |
| --- | --- | --- |
| Commandes | reader v2 UID actif; adaptateur v1 historique explicitement read-only | pagination serveur v2 et historique v1 read-only |
| Mes avantages | `listMyNewsletterRewards` après vérification Auth/e-mail | dernier code immédiatement visible, copie et historique borné |
| Suivi de livraison | `shipmentTracking` derive par le reader v2 | transporteur, numero copiable, lien officiel allowliste ou repli sans suivi |
| Documents | snapshots de commande + PDF serveur prive | ouvrir, enregistrer, partager et recevoir par e-mail les seuls documents sandbox admissibles |
| Liste de souhaits | `users/{uid}/wishlist` + `/api/catalog` | apercu enrichi par le catalogue public et lien vers `/wishlist` |
| Adresse | derniere commande | affichage livraison/facturation |
| Profil | Firebase Auth + derniere commande | affichage nom, email, telephone |
| Support | configuration metier | contact et aide |

Adresse et profil sont aujourd'hui principalement des vues de synthese derivees des commandes; ce ne sont pas encore un carnet d'adresses complet editable.

Les avantages newsletter ne sont jamais lus directement depuis Firestore. La
callable `listMyNewsletterRewards` dérive l'adresse du jeton Firebase vérifié,
interroge son hash et renvoie au plus vingt projections minimales. Le dernier
code est placé avant l'historique des commandes pour être retrouvé sans
recherche; les anciens codes restent dans le même panneau.

Ces codes sont applicables dans le checkout depuis le 2026-08-13. Le client
peut demander un apercu de la remise, mais le prix, l'eligibilite, l'echeance et
l'unicite sont recalcules par Function lors de la creation de commande. Un gain
newsletter est lie a l'e-mail verifie du compte, reserve avec la commande puis
marque `used` uniquement apres paiement Stripe confirme.

Refonte de présentation du 2026-08-10, sans changement de contrat de données:

- `MyOrdersView` porte une feuille de style locale `.acc-*` injectée dans le
  composant. Elle definit les jetons de materiau (fond, hairlines, elevations,
  grain) et pilote le theme clair/sombre par `data-acc-theme`, sans toucher au
  Tailwind global;
- `OrdersPageIsland` ecoute `sv:theme-change`, donc la bascule clair/sombre du
  header repeint l'espace client sans rechargement;
- le slogan `Vos commandes, simplement.` est supprime de la vue, du repli
  d'ile et de `loading.jsx`. L'en-tete est reduit a une identite compacte
  (monogramme, salutation, e-mail) et a la carte `Dernier dossier`;
- la page n'ajoute aucune barre collante sous le header et son mega menu. Le
  retour galerie est un fil d'Ariane discret place au-dessus de la salutation;
  `Quitter` reste expose par le header, par le rail lateral et par le dernier
  segment du controle mobile, sans troisieme niveau de menu;
- la navigation devient un rail lateral avec surlignage par
  `IntersectionObserver` au-dessus de 1024 px, et un controle segmente
  horizontal en dessous. Les cibles de defilement restent les memes sections;
- les quatre compteurs sont Commandes, Documents, Pieces suivies et
  Remboursements. Le compteur `Adresse` du 2026-07-30 est remplace par une
  pastille d'etat `Enregistree` / `A completer` dans le panneau Adresses, plus
  lisible qu'un `0`; les compteurs restent neutres pendant le chargement;
- les commandes ne sont plus un tableau a cinq colonnes mais un dossier par
  ligne: vignette, reference, date et nombre de pieces, resume des articles,
  total et statut a droite, encarts remboursement / retour / suivi, puis
  actions en pastilles. Aucune affordance n'est ajoutee ni retiree;
- les feuilles modales sont fermables au clavier par `Echap` et par un bouton
  de fond explicitement nomme, au lieu d'un `onClick` sur le voile;
- l'echec d'annulation n'utilise plus `alert()` mais la meme zone de
  notification que les demandes de retour.

## 3. Commandes

Le client ne recoit que les commandes admises par le reader serveur et les
Rules. L'UID materialise au checkout est l'unique preuve de propriete; une
adresse e-mail identique, meme verifiee, ne donne jamais acces a la commande
d'un autre UID. L'ancien listener Firestore filtre par `userEmail` a ete retire;
`listMyOrdersV2` est l'unique reader de l'interface. La reprise invite produit
elle aussi un UID autoritaire borne.

Les statuts importants sont actuellement reconstruits depuis le champ composite `status`, notamment:

- `pending_payment`;
- `paid`;
- `payment_failed`;
- `canceled`;
- `refund_pending`;
- `refunded`;
- `refund_failed`;
- statuts logistiques comme expedition ou completion.

Le reader expose aussi l'etat plat `needs_review` lorsqu'un remboursement
initialement confirme est ensuite inverse par Stripe. L'adaptateur client ne le
rabaisse jamais vers le repli logistique `Preparee`: la commande affiche
`A verifier` et explique qu'aucun remboursement n'a ete confirme. Lorsque le
montant rembourse autoritaire revient a zero, le reader masque la confirmation
de remboursement devenue obsolete et conserve le recu de paiement; le document
historique n'est pas supprime du journal serveur.

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

Le reader joint aussi, pour chaque commande, les documents et la derniere
demande client. La requete de sous-collection
`customer_return_requests.updatedAt desc` exige l'index de portee `COLLECTION`;
l'index `COLLECTION_GROUP` utilise par l'administration ne le remplace pas. Une
erreur de lecture initiale n'est jamais presentee comme un historique vide:
Commandes, Documents et les compteurs affichent une indisponibilite explicite
avec reprise manuelle. Une erreur de pagination conserve la page deja chargee
et propose de rejouer seulement la lecture suivante.

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

Le document metier est disponible des la convergence financiere durable: le
recu de paiement est persiste atomiquement avec la capture, et la confirmation
de remboursement avec le fait financier de refund. Le rebuild d'exploitation
horaire reste un filet idempotent pour l'historique, jamais une dependance de
fraicheur de `/mes-commandes`.

Depuis le 2026-07-31, l'action document ouvre une bottom sheet mobile ou une
modale desktop. `prepareCommerceDocumentDelivery` exige Auth et App Check,
reverifie l'UID proprietaire, materialise un PDF serveur immutable sous hash,
renvoie ses octets au navigateur et programme une copie e-mail. L'interface
propose ensuite `Ouvrir le PDF`, `Enregistrer`, le partage natif lorsque
`navigator.canShare({ files })` l'autorise, et une aide de localisation adaptee
a iPhone, Android ou ordinateur. Elle annonce `Telechargement lance`, jamais
une fin de telechargement que le navigateur ne permet pas d'observer.

La callable Gen2 ne depend pas d'un bucket par defaut implicite: elle resout le
bucket prive depuis une configuration explicite, puis `FIREBASE_CONFIG`, les
variables projet Google Cloud, les options du SDK Admin et enfin le project ID
asynchrone du credential Application Default. L'absence de toute identite
projet echoue avant la materialisation. Ce contrat couvre aussi une revision
Gen2 qui n'expose ni `storageBucket` ni variable projet tout en conservant un
credential ADC valide.
Le dispatcher de copie e-mail reutilise exactement ce resolver pour relire
l'artefact et construire la piece jointe; la confirmation `Copie e-mail
programmee` ne constitue qu'une mise en file, la livraison effective restant
prouvee par l'outbox `sent` et la reception provider.

Dettes UX restantes observees sur ces donnees reelles:

- les snapshots d'item n'alimentent pas l'image attendue par `getItemImage`,
  donc plusieurs dossiers affichent la meme image de repli;
- ces projections ne doivent jamais masquer le statut durable ni le
  remboursement.

## 4. Factures et avoirs

Les generateurs PDF client legacy ont ete retires. Le lecteur client joint au
plus 20 documents immuables par commande et n'expose que leurs metadonnees
utiles. Le renderer Node `commerceDocumentArtifact.js` produit le PDF prive
correspondant avec une mention visible `sandbox - non fiscal`; le meme artefact
exact sert a l'ouverture, l'enregistrement, au partage et a la piece jointe
e-mail.

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
- `src/kit/marketplace/publicCatalogWishlist.js` pour resoudre les produits absents du rendu initial via l'API publique same-origin;
- `users/{uid}/wishlist/{item}` pour l'utilisateur connecte;
- un etat local borne pour la continuite visiteur;
- le catalogue courant pour rafraichir disponibilite et visuel.

Un passage wishlist -> panier doit revalider `isPurchasable`. Les informations de prix/stock conservees dans la wishlist ne sont jamais autoritaires.
Les Rules exigent un `originalId` identique a l'ID du document, une liste
fermee de champs d'affichage et des tailles/prix bornes; la suppression reste
reservee au proprietaire.
Le premier rendu de `WishlistPageIsland` reste identique entre serveur et
navigateur. La liste locale est chargee uniquement par
`subscribeWishlistItems` apres montage afin d'eviter toute divergence
d'hydratation avec `localStorage`.
La page complete et l'apercu de l'espace client partagent le meme resoluteur:
un favori conserve son snapshot d'affichage, puis le catalogue public rafraichit
son nom, son prix, son visuel et sa disponibilite sans rendre Firestore
autoritaire pour l'achat.
Le rapprochement accepte aussi les anciens documents wishlist qui ne portent
pas encore `originalId`: leur ID Firestore reste l'identifiant produit de
reference, afin que le snapshot ancien ne masque jamais le stock public actuel.
Les chargements unitaires sont appeles avec un callback unaire explicite: le
second argument de `fetchPublicCatalogProduct` est reserve a l'injection d'un
`fetch` de test et ne doit jamais recevoir l'index implicite de `Array.map`.

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

Si la confirmation durable arrive pendant une fermeture ou une coupure du
navigateur, la reprise suivante recoit un terminal `paid`: elle invalide le
descripteur, nettoie les seules revisions achetees et laisse les nouvelles
lignes intactes. Le PaymentIntent confirme n'est jamais rouvert sur un panier
ulterieur.

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
src/utils/shippingAddress.js
functions/src/commerce/v2DocumentDelivery.js
functions/src/commerce/domain/commerceDocumentArtifact.js
functions/src/commerce/domain/commerceDocumentStorage.js
src/kit/marketplace/newsletterRewardClient.js
functions/src/newsletter/newsletterRewards.js
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
8. la copie recue contient le PDF et son bouton revient vers le
   `SITE_URL` sandbox puis `/mes-commandes`, jamais vers localhost;
9. wishlist puis ajout panier d'un produit disponible;
10. deconnexion et protection des routes.
11. un code gagné avec la même adresse apparaît dans `Mes avantages` et peut être copié.

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
