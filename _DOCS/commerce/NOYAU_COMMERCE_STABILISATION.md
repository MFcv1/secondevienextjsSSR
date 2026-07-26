# Audit et roadmap de stabilisation du noyau commerce

Derniere verification: 2026-07-26
Statut: `PLAN_TEMPORAIRE_EXECUTION`
Decision de recette: `NO_GO_TRANSACTIONNEL`
Proprietaire: noyau commerce, commandes, inventaire, Stripe et control plane admin
Echeance de gouvernance: 2026-09-30
Specification d'implementation: `STABILISEE_PAR_CONTRE_EXPERTISE`
Prochaine execution autorisee: `GATE_0A_HARNAIS_SENTINELLE`, puis `GATE_0B_CONFINEMENT`

## 1. Gouvernance du document

Ce document existe a la demande explicite de l'utilisateur pour regrouper:

- l'audit independant du noyau commerce actuel;
- les ecarts bloquants avant une recette avec comptes test;
- l'architecture cible;
- une roadmap d'implementation fermee;
- les gates automatiques et manuelles qui permettent de declarer le moteur testable.

Il est temporaire. Il ne devient pas une seconde reference canonique permanente. Jusqu'a sa cloture, il constitue toutefois la specification d'execution unique du chantier commerce: un agent suivant ne doit ni recreer une nouvelle roadmap, ni reordonner les gates sans nouvelle preuve executable.

La contre-expertise du 2026-07-26 a activement cherche a refuter l'audit initial. Elle a confirme le `NO_GO_TRANSACTIONNEL`, reduit plusieurs severites, corrige le modele cible et remplace la strategie de bascule big-bang par une migration additive. Les sections 6, 11 a 17 et 20 incorporent ces corrections.

Condition de cloture:

1. les gates 0A a 7B de la section 15 sont fermees;
2. aucun constat `P0` ou `P1` ne reste ouvert sans decision explicite;
3. la recette manuelle sandbox de la gate 8 et de la section 17 est terminee;
4. les decisions durables sont fusionnees dans `COMMERCE_STRIPE.md`, `../admin/BACKOFFICE.md`, `../client/ESPACE_CLIENT.md`, `../quality/QUALITE_TESTS.md` et `../../map.md`;
5. ce fichier est alors supprime et ses liens retires.

Si le plan n'est pas clos au 2026-09-30, son statut, son perimetre et son echeance doivent etre revus explicitement. Il ne doit pas rester actif silencieusement.

## 2. Verdict executif

### 2.1 Verdict

Le noyau commerce actuel ne doit pas encore etre presente comme aussi fiable que Shopify, ni comme pret pour une recette transactionnelle concluante.

Le parcours nominal suivant peut fonctionner:

```text
panier
  -> prix et stock relus par createOrder
  -> reservation Firestore transactionnelle
  -> PaymentIntent Stripe
  -> paiement accepte du premier coup
  -> webhook signe et valide
  -> commande paid
  -> confirmation UI
```

Les briques importantes existent et plusieurs d'entre elles sont bonnes. Le defaut structurel apparait sur les chemins non nominaux:

- carte refusee puis reessayee;
- fermeture, annulation ou expiration pendant une confirmation;
- panne entre Firestore et Stripe;
- webhook duplique, desordonne ou interrompu;
- plusieurs reservations sur le meme SKU;
- remboursement d'un bien expedie ou livre;
- mutation admin directe;
- paiement differe;
- reconstruction des e-mails, statistiques et factures.

Le probleme principal n'est donc pas Stripe seul. Il est dans l'absence d'une machine d'etat autoritaire commune entre:

```text
Stripe
  <-> commande Firestore
  <-> reservation de stock
  <-> actions client
  <-> actions admin
  <-> remboursement/retour
  <-> e-mails/statistiques/factures
```

### 2.2 Clarification sur le risque de debit

L'audit n'a pas identifie un chemin ou le site debiterait un client sans qu'un paiement Stripe soit confirme.

Le risque reel est different et plus precis:

> Stripe peut confirmer un paiement alors que la projection Firestore refuse ensuite de passer la commande a `paid`, parce que le stock a deja ete libere ou que le statut local a ete rendu terminal.

Le client a bien autorise le paiement, mais le site peut ne plus reconnaitre correctement ce succes. C'est une divergence argent-commande-stock, pas un debit sans paiement.

### 2.3 Decision actuelle

| Surface | Decision |
| --- | --- |
| navigation et consultation sans paiement | utilisable selon ses propres gates |
| demonstration visuelle du checkout sans transaction | possible avec prudence |
| achat sandbox presente comme preuve de fiabilite | bloque |
| paiement differe | a desactiver cote serveur jusqu'a implementation complete |
| annulation/restock admin direct | a retirer avant recette |
| remboursement sandbox | non qualifiant tant que le stock et le retour ne sont pas separes |
| E2E automatise avec comptes techniques test | commence seulement en Gate 7B |
| recette humaine client/admin | commence seulement en Gate 8, apres 7A et 7B |
| Stripe live / production | hors perimetre et toujours differe |

### 2.4 Severites

Les severites de ce document ont un sens de livraison:

| Niveau | Definition |
| --- | --- |
| `P0` | peut produire une divergence paiement/commande/stock accessible au client, deterministe ou sous panne critique; bloque toute recette transactionnelle |
| `P1` | peut corrompre un workflow privilegie, une projection, une reprise ou une preuve operationnelle; a fermer avant presentation commerce |
| `P2` | durcissement production, maintenabilite ou capacite secondaire; ne bloque pas seul la premiere recette sandbox |

## 3. Methode et limites

### 3.1 Methode

L'audit a ete realise a partir du code executable et de la configuration
actuelle. Les documents Markdown ont ete lus pour comprendre les intentions,
mais n'ont pas ete traites comme une preuve.

Ordre d'independance effectivement suivi:

1. lecture de `AGENTS.md`, `map.md` et des chapitres canoniques necessaires pour
   localiser les flux, sans ouvrir le plan de stabilisation existant;
2. audit aveugle du code, des Rules, schemas, configurations, scripts et tests;
3. cartographie propre des producteurs/consommateurs, constats, severites et
   dependances;
4. lecture integrale du plan existant et des chapitres demandes;
5. tentative de falsification constat par constat, puis matrice NC-001 a NC-022;
6. seconde passe contradictoire par sous-domaines avant stabilisation de
   l'architecture et des gates.

Le plan existant n'a donc pas servi de liste de constats pendant la premiere
passe. Les formulations conservees le sont apres confrontation au code, pas par
presomption d'exactitude.

Perimetre inspecte:

- checkout client, retour 3DS et espace commandes;
- `createOrder`, annulation, cleanup et statut commande;
- PaymentIntents, webhooks plateforme et Connect;
- remboursement et remise en stock;
- donnees `orders`, produits et metadonnees commerce;
- Firestore Rules et frontieres admin;
- e-mails, statistiques, factures et outils de maintenance;
- scripts E2E, CI et couverture locale;
- organisation des gros modules du noyau.

Niveaux de certitude:

| Marqueur | Sens |
| --- | --- |
| `CONFIRME_CODE` | effet deterministe directement prouve par le code |
| `CONFIRME_CONTRAT` | code + contrat officiel du fournisseur |
| `PANNE_INJECTEE_REQUISE` | fenetre de panne credible, a prouver automatiquement par injection |
| `EMULATEUR_REQUIS` | haute confiance statique, comportement runtime a verrouiller par test |
| `CLOUD_NON_VERIFIE` | etat du deploiement ou des donnees non inspecte |

### 3.2 Limites

Cette passe:

- n'a effectue aucun appel Stripe ou Firebase;
- n'a lu ni modifie aucune commande sandbox;
- n'a lance aucun E2E heberge;
- n'a effectue aucun deploiement;
- n'est pas un audit juridique ou comptable;
- ne qualifie pas les SLA, la fraude, la fiscalite ou l'exploitation live;
- ne remplace pas la future recette avec comptes et fixtures de test.

Les preuves historiques d'un paiement ou remboursement sandbox reussi prouvent un chemin nominal ponctuel. Elles ne ferment pas les courses et reprises documentees ici.

## 4. Cartographie du moteur actuel

### 4.1 Flux principal

```text
CheckoutView [navigateur]
  |-- lit sys_metadata/delivery et payment_settings
  |-- calcule un total d'affichage
  |-- construit clientOrderId
  `-- appelle createOrder

createOrder [Function europe-west1]
  |-- verifie Auth/OTP et App Check
  |-- relit produits, prix, statut et stock
  |-- reserve le stock + cree orders/{orderId}
  |-- cree un PaymentIntent Stripe
  `-- rattache paymentIntentId a la commande

Stripe Payment Element
  `-- confirme le PaymentIntent

stripeWebhook / stripeConnectWebhook [region par defaut actuelle]
  |-- verifie la signature
  |-- deduplique event.id
  |-- applique succes/echec/refund/account.updated
  `-- ecrit orders et produits

triggers Firestore
  |-- e-mails client/admin
  `-- statistiques commerce

lecteurs
  |-- CheckoutStripeModal / retour 3DS
  |-- MyOrdersView / PDF
  |-- AdminOrders / AdminReturns
  `-- AdminDashboard
```

### 4.2 Flux de compensation et de controle

```text
fermeture modal
  -> cancelOrderClient
  -> restaure stock localement
  -> n'annule pas le PaymentIntent

cleanupPendingPayments
  -> lit jusqu'a 50 pending_payment
  -> relit/cancel parfois Stripe
  -> peut confirmer paid par un chemin distinct
  -> restaure le stock

AdminOrders
  -> ecrit directement orders.status
  -> annule/restaure produit par produit depuis le navigateur

refundOrderAdmin
  -> cree un Refund Stripe idempotent
  -> met a jour la commande
  -> remet automatiquement en stock si le refund reussit

maintenance
  -> peut supprimer toutes les commandes
  -> peut nettoyer immediatement des medias non references
```

### 4.3 Sources de verite actuelles

| Donnee | Source actuelle | Evaluation |
| --- | --- | --- |
| resultat financier Stripe | Stripe PaymentIntent/Refund | autoritaire |
| prix produit au checkout | document produit relu dans `createOrder` | solide |
| stock disponible | `stock`, `sold`, `buyerId` sur le produit | insuffisant pour plusieurs allocations |
| reservation | `stockReserved` + snapshot `stockBefore` dans la commande | non idempotent globalement |
| etat commande | champ unique `orders.status` | melange paiement, logistique et refund |
| paiement autorise | `payment_settings` lu surtout par le navigateur | non autoritaire |
| livraison | `sys_metadata/delivery` + fallbacks code | schema et eligibilite insuffisants |
| identite checkout | Auth verifiee ou OTP invite | bonne base |
| e-mails | triggers Firestore + provider | sans outbox durable |
| chiffre d'affaires | rollup de changements de `status` | materiellement faux |
| facture | PDF genere dans le navigateur | non autoritaire |

## 5. Garanties solides a conserver

L'objectif n'est pas de reecrire ce qui fonctionne. Les garanties suivantes ont ete confirmees:

1. `createOrder` normalise les IDs, collections et quantites.
2. Le prix produit, le statut `published` et le stock sont relus cote serveur.
3. Un changement de prix bloque la creation au lieu de debiter l'ancien total.
4. La reservation initiale et la creation de la commande sont dans une transaction Firestore.
5. Le montant du PaymentIntent vient du total recalcule cote serveur.
6. App Check est impose sur la creation, l'annulation et le remboursement.
7. Auth verifiee ou OTP invite est exige au checkout.
8. Le webhook exige le raw body et la signature Stripe.
9. Le succes PaymentIntent controle montant recu, devise, PI, metadata, utilisateur et compte Connect.
10. Le navigateur attend normalement un statut durable `paid` avant de declarer le paiement confirme.
11. Les lignes de commande conservent un snapshot du produit et du prix.
12. `refundOrderAdmin` exige un admin fort recent, une phrase de confirmation et utilise une cle d'idempotence Stripe.
13. Les commandes Connect conservent le compte Stripe utilise.
14. Les documents `sys_idempotency` sont backend-only.
15. `storage.rules:4-5` interdit tout acces SDK a
    `catalog-projection/**`.
16. `storage.rules:14-34` exige actuellement une assurance admin forte et
    borne MIME/taille pour les uploads SDK de medias.

Ces garanties sont une base credible. Elles ne suffisent pas encore a rendre toutes les transitions convergentes.

## 6. Registre synthetique et contre-validation des constats

Cette matrice remplace les severites initiales. La colonne
`Contre-validation` utilise les classes demandees: `confirme`,
`confirme avec nuance`, `severite a reduire`, `severite a augmenter`,
`refute`, `preuve insuffisante` ou `doublon d'un autre constat`. Aucun constat
n'est totalement refute, a augmenter ou reduit a un doublon integral; plusieurs
sont nuances ou descendus parce qu'ils sont privilegies, conditionnels a une
panne ou en recouvrement partiel.

| ID | Contre-validation | Sev. finale | Sujet | Certitude | Gate |
| --- | --- | --- | --- | --- | --- |
| `NC-001` | confirme | P0 | refus puis retry: paiement Stripe reussi, commande locale rejetee | `CONFIRME_CONTRAT` | 3 |
| `NC-002` | confirme | P0 | stock libere avant annulation Stripe confirmee | `CONFIRME_CODE` | 0B et 3 |
| `NC-003` | confirme | P0 | `stockBefore`/`buyerId` detruisent les allocations concurrentes | `CONFIRME_CODE` | 2 |
| `NC-004` | severite a reduire | P1 | ecritures admin contournent la machine metier; acces admin fort seulement et recouvrement partiel avec NC-002 | `CONFIRME_CODE` | 0B et 4 |
| `NC-005` | severite a reduire | P1 eleve | paiement/livraison non autoritaires et differe sans echeance | `CONFIRME_CODE` | 0B et 2 |
| `NC-006` | severite a reduire | P1 eleve | creation PaymentIntent sans idempotence Stripe ni saga reprenable; debit non deterministe car le client secret n'est normalement pas retourne | `PANNE_INJECTEE_REQUISE` | 3 |
| `NC-007` | confirme avec nuance | P0 sous panne | webhook `processing` non recuperable et paiement orphelin acquitte | `PANNE_INJECTEE_REQUISE` | 3 |
| `NC-008` | severite a reduire | P1 bloquant | aucune gate locale commerce; E2E capables de faux verts | `CONFIRME_CODE` | 0A, 1 et 7B |
| `NC-009` | confirme | P1 | un seul `status` pour paiement, fulfillment, annulation et refund | `CONFIRME_CODE` | 1 |
| `NC-010` | confirme | P1 | annulation multi-SKU lit apres ecriture; violation du contrat transactionnel Firestore | `CONFIRME_CONTRAT` | 2 |
| `NC-011` | severite a reduire | P2 | handler Checkout Session obsolete encore actif en source; exposition cloud non verifiee | `CLOUD_NON_VERIFIE` | 3 |
| `NC-012` | confirme avec nuance | P1 | refund financier confondu avec retour physique/restock; retry callable mieux protege par sa cle Stripe que formule initialement | `CONFIRME_CODE` | 4 |
| `NC-013` | confirme | P1 | etat Stripe Connect canonique divergent | `CONFIRME_CODE` | 2, 4 et 7A |
| `NC-014` | confirme avec nuance | P1 | e-mails sans outbox; exactly-once impossible a garantir avec Gmail SMTP | `CONFIRME_CONTRAT` | 7A |
| `NC-015` | confirme | P1 | chiffre d'affaires faux et rollup non idempotent | `CONFIRME_CODE` | 7A |
| `NC-016` | confirme | P1 | reprise 3DS, panier et suivi invite fragiles | `CONFIRME_CODE` | 5 et 7B |
| `NC-017` | confirme | P1 | PDF facture non autoritaire et disponible hors paiement | `CONFIRME_CODE` | 0B et 7A |
| `NC-018` | confirme avec nuance | P1 | purges/GC incompatibles avec une recette sure; risque semantique et non reprenable, pas ancienne limite generique de 500 writes | `CONFIRME_CODE` | 0B et 7A |
| `NC-019` | severite a reduire | P2 | validation entree/schema commerce insuffisante; recouvrement partiel avec NC-005 | `CONFIRME_CODE` | 1 et 2 |
| `NC-020` | confirme avec nuance | P1 | regions, rapprochement et alertes incomplets; etat cloud non verifie | `CLOUD_NON_VERIFIE` | 7A et 7B |
| `NC-021` | confirme | P2 | modules colossaux et responsabilites melangees | `CONFIRME_CODE` | 1 a 5 |
| `NC-022` | confirme avec nuance | P2 | disputes, version endpoint et durcissement Connect incomplets; SDK Stripe recent deja versionne | `CLOUD_NON_VERIFIE` | apres 8 |

Omission independante ajoutee par la contre-expertise:

| ID | Sev. | Sujet | Certitude | Gate |
| --- | --- | --- | --- | --- |
| `OM-001` | P2 | frontiere Storage trop large pour de futurs documents commerce, registre admin actif non verifie et signed upload non borne en taille | `CONFIRME_CODE` | 5 et 7A |

### 6.1 Faux positifs evites et formulations corrigees

La tentative de falsification ne refute integralement aucun NC, mais elle
interdit plusieurs conclusions initiales trop fortes:

- aucun chemin « debit Stripe sans paiement confirme » n'a ete trouve; le
  scenario P0 prouve est un paiement Stripe reussi que la commande/stock ne
  reconnait plus;
- NC-004 n'est pas une faille client: la voie est reservee a un admin fort,
  meme si elle reste dangereuse pour l'integrite;
- NC-006 n'etablit pas un double debit deterministe: la fenetre PI cree mais non
  rattache exige une panne injectee et le client secret n'est normalement pas
  retourne;
- l'absence de tests de NC-008 ne corrompt pas seule une commande; elle rend un
  faux vert probable et reste donc P1 bloquant, pas P0;
- NC-011 prouve du code source obsolete, pas que l'endpoint est encore deploye;
- NC-018 n'est pas fonde sur une ancienne limite generique de 500 writes: le
  probleme prouve est la suppression globale non reprenable et sans retention;
- NC-019 recouvre largement politique/schema et reste P2;
- NC-022 ne prouve pas un SDK Stripe obsolete:
  `functions/package.json:20` utilise `^20.3.0`; il manque un contrat explicite
  et des durcissements live.

La roadmap evite en consequence quatre chantiers non justifies: migration vers
Checkout Sessions, reecriture big-bang, migration obligatoire de tout
l'historique et reconstruction des purges globales avant la recette. Elle ne
promet pas non plus facture/avoir legal, equivalence de SLA Shopify ou rail live.

## 7. Constats transactionnels prioritaires detailles

### NC-001 - `payment_failed` est traite comme terminal alors que le PaymentIntent reste reessayable

Preuves:

- `functions/src/commerce/stripeWebhook.js:579-586` transforme `payment_intent.payment_failed` en statut terminal et restaure le stock;
- `src/kit/commerce/CheckoutPaymentStep.jsx:23-45` laisse le client soumettre une nouvelle methode sur le meme Payment Element;
- `functions/src/commerce/stripeWebhook.js:33-65` exige encore `pending_payment` et `stockReserved=true` pour accepter un succes;
- `scripts/e2e-hosted-stripe-checkout.mjs:1431-1444` encode actuellement comme succes de test la liberation immediate apres refus.

Scenario:

```text
PI requires_payment_method
  -> premiere carte refusee
  -> webhook payment_failed
  -> order payment_failed + stock libere
  -> deuxieme carte acceptee sur le meme PI
  -> Stripe succeeded
  -> webhook local refuse: order non pending et stock non reserve
```

Impact: paiement confirme chez Stripe, commande non payee localement, produit potentiellement remis en vente.

Correction attendue:

- un refus met a jour la tentative mais ne rend pas la commande terminale;
- le meme PaymentIntent reste rattache a la commande;
- la reservation n'est liberee qu'apres annulation Stripe confirmee ou expiration orchestree;
- le succes Stripe reste monotone et convergent.

Gate:

- carte refusee puis carte acceptee sur le meme PI;
- une commande, un PI, une consommation de stock, etat final `paid`.

Reference fournisseur: Stripe recommande de reutiliser le meme PaymentIntent apres interruption et d'en suivre les tentatives dans son cycle de vie: [Payment Intents API](https://docs.stripe.com/payments/payment-intents).

### NC-002 - trois chemins liberent le stock avant de neutraliser Stripe

Chemins confirmes:

1. fermeture pendant `confirmPayment`;
2. annulation client/admin d'une commande Stripe en attente;
3. cleanup d'un PI `requires_payment_method`.

Preuves:

- `src/kit/commerce/CheckoutStripeModal.jsx:125-137`: le parent reste fermable tant que `confirmationState=idle`;
- `src/kit/commerce/CheckoutPaymentStep.jsx:19-45`: `isProcessing` reste local a l'enfant;
- `src/kit/commerce/CheckoutView.jsx:202-235`: la fermeture appelle `cancelOrderClient`;
- `functions/src/commerce/cancelOrder.js:17-104`: aucune lecture ou annulation Stripe;
- `src/kit/admin/AdminOrders.jsx:56-110`: restauration directe depuis le navigateur;
- `functions/src/commerce/cleanupPendingPayments.js:12-15,41-59,118-124`: `requires_payment_method` est classe terminal sans appel `cancel`.

Invariant cible:

> aucun mouvement `reserved -> released` tant que le PaymentIntent peut encore devenir `succeeded`.

Sequence cible:

```text
cancellation_requested
  -> retrieve Stripe
  |-- succeeded -> apply paid, aucune liberation
  |-- processing -> attendre/reconcilier
  `-- cancelable -> cancel PI
        -> verifier canceled
        -> release reservation exactement une fois
```

### NC-003 - le modele de stock ne represente pas une reservation

Preuves:

- `functions/src/commerce/createOrder.js:418-437`: snapshot `stockBefore`;
- `functions/src/commerce/stripeWebhook.js:292-314` et `functions/src/commerce/refundOrder.js:89-113`: restauration vers `max(currentStock, stockBefore)`;
- `functions/src/commerce/createOrder.js:428-434`: `buyerId` Stripe seulement quand le stock tombe a zero;
- `functions/src/commerce/createOrder.js:260-269`: `buyerId` differe pose pour toute reservation;
- le cleaner utilise encore un autre modele, `increment(quantity)`.

Scenario deterministe:

```text
stock 10
A reserve 1 -> 9, stockBefore A = 10
B reserve 2 -> 7
A est liberee
max(7, 10) -> 10
valeur correcte -> 8
```

Le modele peut aussi bloquer une liberation lorsque `buyerId` pointe vers une autre reservation partielle.

Correction attendue:

- une reservation deterministe par commande et SKU;
- lignes du meme SKU agregees avant transaction;
- etats `held -> committed` ou `held -> released`;
- mouvement `+quantity` applique au plus une fois;
- aucune compensation basee sur une photographie globale;
- `buyerId` retire du role de verrou d'inventaire.

### NC-004 - le navigateur admin est une voie d'ecriture metier

Preuves:

- `firestore.rules:148-165`: `allow read, write: if isStrongArtisan()` autorise aussi create/update/delete; le `allow create:false` ulterieur ne l'annule pas;
- `src/kit/admin/AdminOrders.jsx:28-30`: remplacement direct de `status`;
- `src/kit/admin/AdminOrders.jsx:72-110`: restauration non transactionnelle et non idempotente;
- `app/admin/AdminAppIsland.jsx:228-257`: suppression/remise en vente directe;
- `src/kit/admin/AdminForm.jsx:405-427`: stock et `sold` modifiables directement;
- `firestore.rules:81-96`: pas de protection metier des champs de vente produit.

Impact:

- un meuble paye peut redevenir achetable sans refund;
- une commande non payee peut devenir `shipped` ou `completed`;
- un double clic peut doubler le stock;
- une ecriture admin peut produire de faux e-mails ou stats.

Ce constat concerne l'integrite privilegiee, pas une attaque client anonyme. Il reste bloquant pour une exploitation reelle.

Correction attendue:

- lecture admin autorisee selon besoin;
- ecriture directe interdite sur commandes, reservations et champs de vente;
- commandes serveur idempotentes pour annuler, expedier, livrer, rembourser, retourner et ajuster;
- `expectedVersion`, action autorisee calculee serveur et evenement d'audit atomique.

### NC-005 - les politiques de paiement et de livraison ne sont pas autoritaires

Preuves:

- `functions/src/commerce/createOrder.js:135-137` accepte toujours `stripe_elements`, `deferred` et `manual`;
- `src/kit/admin/AdminPaymentSettings.jsx:127-147` ecrit `stripeEnabled`, mais `createOrder` ne le lit pas;
- `functions/src/commerce/createOrder.js:448-460` accepte un mode absent/inconnu a 0 EUR, ignore `active` et conserve des fallbacks codes;
- `functions/src/commerce/createOrder.js:205-307` ne facture aucun port en differe;
- `functions/src/commerce/cleanupPendingPayments.js:85-87` ignore tout differe;
- `functions/src/email/orderEmails.js:86-93` ne contient pas les coordonnees bancaires annoncees.

Impact:

- kill switch carte uniquement visuel;
- livraison inactive ou inventee acceptee;
- total serveur differe different du total accepte dans l'UI;
- stock immobilise sans expiration;
- un appelant valide peut choisir directement un mode non approuve.

Decision de confinement:

> desactiver `manual/deferred` cote serveur jusqu'a l'existence d'une politique, d'une echeance, d'une preuve d'encaissement et d'un workflow admin dedies.

### NC-006 - la frontiere Firestore/Stripe n'est pas une saga reprenable

Flux actuel:

```text
transaction Firestore: reservation + order + idempotence locale
  -> stripe.paymentIntents.create sans idempotencyKey
  -> batch Firestore: rattachement paymentIntentId
```

Preuves:

- `functions/src/commerce/createOrder.js:343-501`;
- `functions/src/commerce/createOrder.js:507-548`;
- `functions/src/commerce/createOrder.js:557-584` restaure et supprime localement sur toute erreur.

Fenetres:

- Stripe cree le PI mais la reponse ou le batch local echoue;
- le catch supprime la commande et libere le stock sans annuler le PI cree;
- un crash apres reservation laisse une cle locale `reserved` et une commande sans PI;
- un retry peut rester bloque ou creer un nouvel objet Stripe selon le point de panne.

Une erreur reseau ou un `5xx` Stripe est un resultat indetermine, pas une preuve d'echec. Stripe recommande une meme cle d'idempotence pour rejouer une mutation ambiguë: [Advanced error handling](https://docs.stripe.com/error-low-level).

Correction attendue:

- cle Stripe deterministe basee sur `orderId` et la version de tentative;
- etats durables de saga;
- reprise par worker/reconciler;
- jamais de compensation definitive sur une erreur indeterminee;
- annulation explicite du PI connu avant liberation.

### NC-007 - l'inbox webhook ne recupere pas un traitement interrompu

Preuves:

- `functions/src/commerce/stripeWebhook.js:517-539` cree `status=processing`;
- `functions/src/commerce/stripeWebhook.js:519-543` deduplique tout marqueur existant autre que `failed`;
- aucun lease, proprietaire, `processingUntil` ou reclaim;
- `functions/src/commerce/stripeWebhook.js:337-342` traite une commande absente comme `ok/skipped`;
- `functions/src/commerce/stripeWebhook.js:617-620` marque ensuite l'evenement `processed`.

Impact:

- crash apres acquisition: les retries Stripe sont acquittes sans retraitement;
- paiement reussi sans commande: pas d'incident durable ni reconciliation;
- validation echouee: pas de workflow humain borne.

Correction attendue:

- inbox `received -> processing -> processed/failed/dead_letter`;
- lease tokenise et expirant;
- idempotence par evenement et par transition objet/type;
- incident `orphan_paid_payment`;
- worker asynchrone et reconciler.

Stripe ne garantit pas l'ordre, peut livrer des doublons et recommande un traitement asynchrone: [Stripe Webhooks](https://docs.stripe.com/webhooks).

### NC-008 - la qualite actuelle ne peut pas detecter ces regressions

Preuves:

- aucun script `test:commerce:*` dans `package.json`;
- `.github/workflows/quality.yml:28-40` ne lance aucun test commerce;
- `eslint.config.mjs:65-68` ignore `functions/**` et `scripts/**`;
- `tests/smoke.spec.mjs` ne fait qu'un smoke HTTP superficiel du checkout;
- aucune Rules Emulator suite ne couvre les commandes ou les champs de vente admin;
- l'E2E hosted choisit potentiellement un vrai produit, correle par dernier e-mail et peut sortir `0` malgre une preuve incomplete;
- l'E2E refund cible par defaut la derniere commande payee et ne transforme pas toute assertion fausse en exit non nul;
- `e2eStripeHardeningProof` n'est appele par aucune commande et cherche une ancienne cle d'idempotence.

Consequence:

> la CI peut etre verte alors que les constats NC-001 a NC-007 sont toujours presents.

La creation du harnais local est donc une gate d'implementation, pas une tache de finition.

## 8. Constats complementaires P1/P2 detailles

### NC-009 - `orders.status` melange paiement, fulfillment, annulation et refund

Valeurs actuelles:

```text
pending_payment
paid
payment_failed
canceled
cancelled
cancelled_by_client
shipped
completed
refund_pending
refunded
refund_failed
```

`orderStatus.js` retourne un `paymentStatus`, mais aucun writer principal ne l'alimente de maniere autoritaire.

Consequences:

- `paid -> shipped` efface l'etat financier du champ principal;
- un refund efface l'historique de livraison;
- le cleaner, l'admin, les e-mails et les stats interpretent differemment le meme champ;
- les evenements hors ordre peuvent faire regresser l'etat;
- `stockReserved` reste incoherent apres plusieurs transitions.

### NC-010 - l'annulation multi-SKU alterne reads et writes

Dans `functions/src/commerce/cancelOrder.js:68-93`, la boucle lit un produit, l'ecrit, puis lit le suivant. Firestore exige que toutes les lectures d'une transaction precedent toutes les ecritures: [Transactions Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions).

La correction doit:

- agreger les lignes;
- lire commande et toutes les reservations/produits;
- valider;
- appliquer les ecritures ensuite;
- etre prouvee dans l'emulateur avec deux SKU et un SKU duplique.

### NC-011 - l'ancien moteur Checkout Session reste executable

`functions/src/commerce/createOrder.js:330-331` annonce Checkout Session supprime, mais:

- `functions/src/commerce/stripeWebhook.js:384-445` conserve le handler;
- `functions/src/commerce/stripeWebhook.js:568-576` traite encore `checkout.session.completed/expired`.

Le handler reconstruit une commande et decremente le stock sans le contrat de validation du moteur PaymentIntent actuel. Il doit etre retire apres inventaire des evenements legacy ou isole derriere une compatibilite bornee et idempotente par `session.id`.

### NC-012 - refund financier et retour physique sont confondus

Points solides: callable serveur, admin fort recent, confirmation explicite, idempotency key Stripe, verification PI/devise/montant.

Defauts:

- meme restauration `stockBefore`;
- refund reussi remet immediatement en vente, meme si le bien est expedie/livre;
- un refund partiel isole est classe en erreur au lieu d'utiliser le cumul;
- le statut de refund remplace le fulfillment;
- un echec Stripe indetermine est expose comme echec local sans vraie saga.

Cible:

```text
refund succeeded
  |-- bien non expedie -> release/restock admissible
  `-- bien expedie/livre -> return_pending
        -> reception
        -> inspection
        |-- restocked
        `-- written_off
```

### NC-013 - Stripe Connect a plusieurs etats concurrents

Preuves:

- `functions/src/commerce/stripeWebhook.js:551-559` ecrit `webhookChargesEnabled`;
- `functions/src/commerce/stripeConnect.js:150-163` route selon `chargesEnabled`;
- pendant une reconnexion, l'etat d'un compte pending peut alimenter des champs globaux utilises pour le compte actif.

Cible:

- un sous-document d'etat par compte;
- un pointeur actif atomique;
- reconciliation de `charges_enabled`, details et capabilities;
- commandes historiques toujours relues avec leur compte enregistre.

### NC-014 - les e-mails ne possedent pas d'outbox durable

`functions/src/email/orderEmails.js:122-150` envoie sequentiellement, absorbe les erreurs et ne fournit pas de reprise durable. `functions/src/email/transactionalEmail.js:55-88,120-142` montre que la cle fournisseur est appliquee a Resend, pas au transport Gmail actif.

Les triggers Firestore sont livres au moins une fois et sans ordre garanti: [Cloud Firestore triggers](https://firebase.google.com/docs/functions/firestore-events).

Cible:

- outbox ecrite dans la meme transaction que l'evenement metier;
- lease, backoff, compteur, `nextAttemptAt`, dead-letter;
- preuve par destinataire/type et ID provider;
- renvoi admin borne;
- aucune erreur e-mail ne modifie la verite financiere.

### NC-015 - le chiffre d'affaires actuel n'est pas du revenu encaisse

`functions/src/commerce/orderStats.js:11-40` exclut seulement `cancelled` et `cancelled_by_client`.

Sont donc comptes comme CA:

- `pending_payment`;
- `payment_failed`;
- `canceled`;
- `refund_pending`;
- `refunded`;
- `refund_failed`.

Le fallback navigateur reproduit la logique. Le trigger emploie des increments sans ledger d'evenement, alors qu'un trigger peut etre livre plusieurs fois.

Cible:

- montant capture;
- montant rembourse;
- revenu net;
- nombre de commandes payees;
- projections idempotentes ou rebuild deterministe depuis les faits.

Le dashboard ne doit jamais servir de preuve comptable avant cette reconstruction.

### NC-016 - reprise client apres paiement ou redirection fragile

Constats:

- le retour 3DS ecoute directement Firestore sans le fallback callable du modal (`app/checkout/CheckoutPageIsland.jsx:192-252`);
- un guest non connecte peut ne pas pouvoir lire sa commande;
- timeout et echec peuvent ramener silencieusement au checkout;
- le succes UI reste couple au nettoyage du panier (`app/checkout/CheckoutPageIsland.jsx:149-175`);
- le nettoyage supprime les elements courants, pas uniquement le snapshot commande (`app/checkout/CheckoutPageIsland.jsx:149-170`);
- l'UI invite promet un espace client qui exige ensuite une connexion.

Cible:

- reference de reprise opaque;
- endpoint de statut autoritaire;
- etats `processing`, `paid`, `failed`, `needs_review`;
- succes affiche des que `paid` est durable;
- nettoyage cible et rejouable des seules lignes commandees;
- recu/suivi invite explicite.

### NC-017 - le PDF actuel n'est pas une facture autoritaire

`src/kit/commerce/MyOrdersView.jsx:243-261,475-529` permet de generer un PDF pour des commandes non payees, annulees ou remboursees. `src/utils/generateInvoice.js:6-140`:

- genere dans le navigateur;
- derive le numero de l'ID;
- utilise la date de creation;
- ne snapshotte pas une numerotation durable;
- omet une ligne de livraison explicite;
- ne produit pas d'avoir distinct.

Avant validation juridique et comptable, l'UI doit parler de recu provisoire.
La cible technique est un document serveur immutable cree apres encaissement et
une confirmation de remboursement distincte. Le terme et le document « avoir »
restent interdits tant que leur forme juridique/comptable n'est pas validee.

### NC-018 - les outils destructifs ne sont pas compatibles avec la recette

`functions/src/maintenance/tools.js:246-258` (`resetAllOrders`):

- supprime commandes payees et remboursees;
- utilise un batch unique;
- n'a ni archive durable ni restauration;
- est presente comme archive apres un CSV minimal.

Le GC manuel (`functions/src/maintenance/tools.js:57-103`):

- n'a ni dry-run, ni grace, ni quarantaine;
- peut courir entre upload media et ecriture produit.

Les controles admin forts sont utiles mais ne rendent pas l'operation recuperable. Ces actions doivent etre neutralisees pendant la recette, puis remplacees par des workflows bornes.

### NC-019 - le schema d'entree commerce est trop permissif

`functions/src/commerce/createOrder.js:34-40,140-152` recopie des objets `shipping` et `item` avant normalisation partielle. Manquent notamment:

- allowlist stricte des champs;
- tailles maximales;
- types et bornes du stock/prix;
- montants en centimes entiers;
- adresse conditionnelle au mode;
- version de schema;
- aggregation ou rejet explicite des lignes SKU dupliquees.

### NC-020 - regions, observabilite et rapprochement

Le code source place les callables principales en `europe-west1`, mais `functions/src/commerce/stripeWebhook.js:664-675` et `functions/src/commerce/cleanupPendingPayments.js:65-68` utilisent les Functions par defaut. L'etat deploye n'a pas ete verifie.

Manquent:

- reconciliation Stripe -> commande -> reservation;
- backlog de webhooks bloque;
- PI reussi sans commande payee;
- reservation expiree non liberee;
- refund/stock en conflit;
- dead-letter e-mail;
- derive Connect;
- alertes et SLA de convergence.

Une migration de region webhook doit garder une periode de double endpoint controlee; elle ne se fait pas par un simple renommage.

### OM-001 - Storage est solide pour la projection, trop large pour de futurs documents commerce

Garanties actuelles:

- `storage.rules:4-5` refuse toute lecture/ecriture SDK sous
  `catalog-projection/**`;
- `storage.rules:14-34` exige claim admin fort, taille inferieure a 10 MiB et
  MIME image allowliste pour un upload SDK.

Limites:

- `storage.rules:8-9` rend public tout objet hors projection;
- `storage.rules:14-27` ne consulte pas `sys_admin_access.active`, contrairement
  a la frontiere Firestore; un admin revoque mais porteur d'un token encore
  valide peut donc ecrire/supprimer des medias jusqu'au renouvellement;
- `functions/src/maintenance/tools.js:262-281` emet une signed URL 15 minutes
  avec controle type/nom mais sans limite de taille;
- `tests/catalog/emulator/storage-rules.test.cjs:21-37` ne couvre ni revocation,
  ni delete, ni tailles/MIME invalides, ni prefixes;
- App Check Storage et IAM cross-service sont `CLOUD_NON_VERIFIE`.

Aucun document commerce prive actuellement stocke sous ce wildcard n'a ete
identifie. Le risque n'est donc pas P0 transactionnel. La cible est de limiter
les prefixes media, verifier le registre actif, tester create/update/delete et
ne jamais placer factures, avoirs, retours ou exports sous une lecture publique.

## 9. Dette P2 et organisation des fichiers

### NC-021 - modules trop charges et responsabilites melangees

| Fichier | Taille constatee | Responsabilites melangees | Cible |
| --- | ---: | --- | --- |
| `CheckoutView.jsx` | 1153 lignes | formulaire, livraison, OTP, creation, modal, panier, adresse | controller + sections + repository checkout |
| `MyOrdersView.jsx` | 756 lignes | requete, statuts, commandes, profil, support, PDF | repository + presenters + sections |
| `stripeWebhook.js` | 676 lignes | signature, inbox, PI, refund, Connect, legacy | endpoint, inbox worker, reducers separes |
| `createOrder.js` | 613 lignes | schema, identite, politique, stock, saga Stripe | commande domaine + adaptateurs |
| `AdminPaymentSettings.jsx` | 452 lignes | Connect, politique, affichage, mutations | panneaux et commandes serveur |
| `AdminOrders.jsx` | 444 lignes | lecture, transitions, annulation, export, UI | read model + actions server + vues |
| `AdminReturns.jsx` | 384 lignes | recherche, refund, sync, presentation | repository + actions + presentation |

La taille seule n'est pas le defaut principal. Le vrai probleme est que des responsabilites transactionnelles differentes vivent dans les memes modules.

Ordre de refactor:

1. definir le contrat et les tests;
2. extraire le moteur pur;
3. basculer les writers;
4. seulement ensuite scinder les vues.

Un decoupage cosmetique avant la machine d'etat risquerait de disperser les memes incoherences dans davantage de fichiers.

### NC-022 - durcissements Stripe et Connect apres recette sandbox

Preuves et nuance:

- `functions/src/commerce/stripeWebhook.js:550-615` traite compte Connect,
  PaymentIntent, Checkout Session et refund, mais aucun evenement dispute;
- les clients Stripe sont construits sans `apiVersion` explicite, notamment
  `functions/src/commerce/createOrder.js:127` et
  `functions/src/commerce/stripeConnect.js:17-19`;
- `functions/package.json:20` utilise toutefois Stripe `^20.3.0`: l'audit ne
  prouve donc pas un SDK obsolete, seulement l'absence d'un contrat API
  explicitement epingle et teste dans le depot;
- `functions/src/commerce/stripeConnect.js:30-48,177-184` accepte une origine
  fournie a la callable apres validation du protocole, sans allowlist serveur de
  domaines;
- les callables Connect de
  `functions/src/commerce/stripeConnect.js:166-179,254-278,311-313` imposent un
  admin fort mais pas `enforceAppCheck`, contrairement aux callables refund;
- `functions/src/commerce/stripeConnect.js:184-221` ne verrouille pas
  atomiquement la creation d'un nouveau compte: deux appels privilegies
  concurrents peuvent lire le meme etat avant de creer.

Ces ecarts sont P2: ils ne suffisent pas seuls a bloquer la premiere recette
fixture, mais doivent etre fermes avant un rail live.

Apres la premiere recette sandbox:

- traitement des disputes/chargebacks;
- version API Stripe explicitement epinglee;
- allowlist serveur des return URLs Connect;
- App Check explicite sur les callables Connect;
- lock/idempotence de creation de compte Connect;
- pagination admin par curseur;
- politique de retention/anonymisation;
- alertes et runbooks live;
- validation juridique/fiscale des factures et retours.

## 10. Benchmark Stripe, Firestore et Shopify

La cible n'est pas de reproduire l'infrastructure, les SLA ou toutes les fonctions Shopify. La cible est une parite d'invariants sur le noyau:

| Invariant de plateforme mature | Situation actuelle | Cible Seconde Vie |
| --- | --- | --- |
| paiement et fulfillment separes | champ `status` unique | axes separes et transitions fermees |
| stock disponible, reserve et engage distingues | `stock` + `buyerId` | reservations/mouvements par commande-SKU |
| mutation externe idempotente | PI create sans cle Stripe | cle deterministe + saga reprenable |
| webhook duplique/desordonne supporte | event ID sans lease | inbox, reducer monotone, reconciler |
| politique checkout serveur | kill switches UI | politique versionnee autoritaire |
| actions admin comme commandes metier | writes Firestore directs | Functions idempotentes et auditables |
| refund distinct du retour/restock | restock automatique | refund, retour, inspection et disposition separes |
| effets secondaires rejouables | triggers directs | outbox/projections idempotentes |
| tests de concurrence et reprise | absents de la CI | gates locales + E2E isoles |

References officielles:

- Stripe recommande de reutiliser un PaymentIntent et d'envoyer une cle d'idempotence: [Payment Intents API](https://docs.stripe.com/payments/payment-intents).
- Stripe demande de supporter doublons et ordre non garanti des webhooks: [Stripe Webhooks](https://docs.stripe.com/webhooks).
- Firestore exige toutes les lectures avant les ecritures dans une transaction: [Transactions Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions).
- Les triggers Firestore sont livres au moins une fois: [Cloud Firestore triggers](https://firebase.google.com/docs/functions/firestore-events).
- Shopify expose des statuts financiers et de fulfillment distincts: [Order Storefront API](https://shopify.dev/docs/api/storefront/latest/objects/order).
- Shopify distingue notamment inventaire disponible, engage et reserve: [Inventory states](https://shopify.dev/docs/apps/build/orders-fulfillment/inventory-management-apps).

Conclusion du benchmark:

> le moteur custom peut viser des garanties metier comparables, mais ne peut pas revendiquer une equivalence Shopify tant que les transitions, la reprise, l'observabilite et les preuves automatisees ne sont pas fermees.

## 11. Architecture cible

### 11.1 Strategie additive et controle runtime

`schemaVersion: 2` designe un contrat reel, pas une migration cosmetique. Une
commande ne porte cette version que lorsque les reducers, reservations et
writers v2 sont autoritaires. Les champs legacy restent des projections ecrites
dans la meme transaction; ils ne sont jamais relus par le moteur v2 comme
source de verite.

Le controle de bascule est backend-only et fail-closed:

```text
sys_commerce_control/current
  newCheckoutMode: off | v2_fixture | v2_all
  legacyMode: reconcile_only | disabled
  adminMutationMode: read_only | v2
  offlinePaymentMode: off | v2
  activePolicyVersion
  fixtureScopeVersion
  fixtureScopeRef
  controlRevision
  updatedAt
  updatedBy
```

Un document absent, illisible, inconnu ou incomplet equivaut a `off`,
`reconcile_only`, `read_only` et `offlinePaymentMode=off`. Le navigateur peut
recevoir une projection publique sanitisee, mais ne choisit jamais ces valeurs.
Le rollback coupe les nouvelles creations; il ne reactive jamais le writer v1
sur une commande v2.

`commerce_fixture_scopes/{version}` est backend-only, immutable et borne. Il
contient UIDs techniques, inventoryKeys, policyVersion, environnement et
expiration. Une commande fixture snapshotte `runId/fixtureScopeVersion`; ces
champs sont absents d'une commande normale. Une liste mutable dans une policy
publique n'est pas un canary admissible.

### 11.2 Modele de commande v2 minimal

```text
orders/{orderId}
  schemaVersion: 2
  stateVersion
  legacyProjectionVersion
  orderNumber (optionnel avant validation comptable)
  currency: "EUR"

  amounts:
    itemsCents
    shippingCents
    discountCents (optionnel, 0 par defaut)
    taxCents (optionnel, 0 par defaut)
    totalCents
    capturedCents
    refundedCents
    netCents

  checkout:
    status: active | cancellation_requested | closed | needs_review
    closeReason: null | paid | canceled | expired
    clientOrderId
    requestHash
    policyVersion
    expiresAt

  payment:
    provider: stripe | offline
    status:
      awaiting_method
      requires_action
      processing
      succeeded
      canceled
      needs_review
    currentAttemptId
    paymentIntentId
    connectedAccountId
    lastProviderStatus
    succeededAt

  fulfillmentSummary:
    status:
      unfulfilled
      preparing
      ready_for_pickup
      shipped
      picked_up
      delivered
      partial
      canceled
    custody: merchant | carrier | customer | returned | mixed
    trackingNumber
    shippedAt
    deliveredAt

  refundAggregate:
    status: none | pending | partial | full | needs_review
    requestedCents
    pendingCents
    succeededCents
    hasFailure

  inventorySummary:
    status: held | committed | released | restocked | written_off | disposed | mixed | conflict
    reservedQty
    heldQty
    committedQty
    releasedQty
    dispositionPendingQty
    restockedQty
    writtenOffQty

  items[]
    lineId
    cartLineId
    cartRevision
    inventoryKey
    productId
    collectionName
    variantId
    titleSnapshot
    unitAmountCents
    quantity

  customerSnapshot
  shippingSnapshot
  testContext:
    runId
    fixtureScopeVersion
  createdAt
  updatedAt
```

Invariants monetaire:

- tous les montants sont des entiers en centimes et la devise est immutable;
- `itemsCents + shippingCents + taxCents - discountCents = totalCents`;
- `0 <= refundedCents <= capturedCents`;
- `netCents = capturedCents - refundedCents`;
- prix, livraison et total historique sont immutables apres creation;
- `captured/refunded/net` sont des projections derivees des faits financiers,
  pas des compteurs incrementes sans deduplication.

Les axes ont des responsabilites distinctes:

- `payment` ne contient ni refund, ni dispute, ni fulfillment;
- les demandes et resultats de refund vivent sous
  `orders/{orderId}/refunds/{refundRequestId}`;
- les retours physiques et dispositions par ligne vivent sous
  `orders/{orderId}/returns/{returnId}`;
- les allocations logistiques par ligne/quantite vivent sous
  `orders/{orderId}/fulfillments/{fulfillmentId}`; le root est un resume derive;
- les tentatives de paiement vivent sous
  `orders/{orderId}/payment_attempts/{attemptId}`;
- `inventorySummary` est une projection; les reservations par cle d'inventaire
  sont autoritaires;
- le retrait en magasin est represente explicitement par
  `ready_for_pickup/picked_up` et par la garde du bien.

Les sous-collections portent leur propre `schemaVersion`, `stateVersion`,
`commandId`, audit et timestamps serveur. Elles ne sont pas supprimees
implicitement avec le document parent.

Schemas minimaux:

```text
orders/{orderId}/payment_attempts/{attemptId}
  status:
    create_pending | create_inflight | create_unknown | attached
    cancel_requested | canceled | needs_review
  stripeIdempotencyKey
  requestHash
  paymentIntentId
  connectedAccountId
  providerStatus
  leaseToken
  processingUntil

orders/{orderId}/refunds/{refundRequestId}
  status: requested | processing | succeeded | failed | needs_review
  amountCents
  currency
  connectedAccountId
  stripeRefundId
  stripeIdempotencyKey
  lineAllocations[]
  shippingAmountCents
  goodwillAmountCents
  commandId
  effectId

orders/{orderId}/fulfillments/{fulfillmentId}
  status
  custody
  lineAllocations[]
  trackingSnapshot

orders/{orderId}/returns/{returnId}
  status: requested | received | inspected | canceled | needs_review
  lineAllocations[]
  dispositions[]

commerce_financial_facts/{effectId}
  orderId
  type: capture | refund
  amountCents
  currency
  connectedAccountId
  providerObjectId
  effectiveAt
  commandId
```

Un refund de frais de port ou geste commercial ne cree aucun mouvement de
stock. Un refund de marchandise ne reserve une disposition que pour les lignes
et quantites explicites. `refundAggregate` est derive: `pendingCents` peut
coexister avec `succeededCents`; un echec reste sur la requete et
`needs_review` couvre toute somme incoherente.

Projection legacy deterministe:

1. ambiguite -> `needs_review`;
2. refund total confirme -> `refunded`;
3. refund en cours -> `refund_pending`;
4. fulfillment livre -> `completed`, expedie -> `shipped`, seulement si le
   paiement a reussi;
5. paiement reussi non fulfill -> `paid`;
6. annulation -> `canceled` seulement apres PI annule et hold libere;
7. refund partiel conserve `status=paid` et ses champs refund separes.

### 11.3 Reservations et mouvements quantitatifs

L'identite d'une reservation est le hash canonique de:

```text
(orderId, collectionName, productId, variantId-ou-sentinelle)
```

La serialisation est versionnee, longueur-prefixee, Unicode normalisee, avec
collection allowlistee et sentinelle de variant explicite avant hash. Meme
`productId` dans deux collections produit deux cles distinctes.

Deux lignes du meme panier qui ciblent cette cle sont agregees avant la
transaction, tout en conservant leurs allocations par `lineId`.

```text
inventory_reservations/{reservationId}
  schemaVersion: 2
  orderId
  inventoryKey
  productId
  collectionName
  variantId
  lineAllocations[]
  status: held | committed | released | restocked | written_off | disposed | mixed
  reservedQty
  heldQty
  committedQty
  releasedQty
  dispositionPendingQty
  restockedQty
  writtenOffQty
  inventoryVersion
  stateVersion
  expiresAt
  createdAt
  updatedAt

inventory_movements/{effectId}
  reservationId (nullable pour adjustment)
  orderId (nullable pour adjustment)
  inventoryKey
  type:
    hold | commit | release | restock | write_off
    adopt_hold | adopt_commit | adjustment
  quantity
  availableDelta
  inventoryVersionBefore
  inventoryVersionAfter
  commandId
  actor
  reason
  createdAt
```

Invariants:

- `heldQty + committedQty + releasedQty + restockedQty + writtenOffQty =
  reservedQty`;
- `0 <= dispositionPendingQty <= committedQty`;
- `status` est une projection derivee des quantites, ecrite atomiquement et
  utilisee seulement pour les requetes workers;
- `hold` applique `availableDelta=-quantity` une seule fois;
- `commit` ne change pas le stock disponible;
- `release` applique `availableDelta=+quantity` une seule fois;
- `restock` applique `availableDelta=+quantity` seulement apres disposition
  physique admissible, deplace `committed -> restocked` et libere le pending;
- `write_off` deplace `committed -> writtenOff` et ne remet rien en vente;
- un retour ouvert reserve `dispositionPendingQty` dans la meme transaction;
  deux retours ne peuvent pas reclamer la meme unite;
- `adopt_hold/adopt_commit` ont un delta zero et ne servent qu'a representer
  une allocation legacy deja appliquee;
- `quantity` est un entier strictement positif; `availableDelta` est signe;
- un `adjustment` sans commande exige inventoryKey, acteur, raison, comptage et
  precondition de version;
- `product.stock` reste la projection du disponible, jamais le snapshot a
  restaurer;
- chaque effet possede un ID deterministe et une precondition de version;
- une transaction lit commande, reservations et produits avant toute ecriture;
- `stockBefore`, `buyerId` et `sold` ne pilotent plus une compensation.

### 11.4 Inbox webhook, audit et outbox

```text
commerce_webhook_inbox/{hash(scope, accountId-or-platform, eventId)}
  schemaVersion: 2
  eventId
  scope: platform | connect
  accountId
  objectId
  type
  eventCreated
  apiVersion
  livemode
  payloadHash
  verifiedPayloadSnapshot
  signatureVerifiedAt
  status: received | processing | processed | failed | dead_letter
  leaseToken
  processingUntil
  attemptCount
  nextAttemptAt
  lastError
  receivedAt
  processedAt

orders/{orderId}/events/{effectId}
  command
  from
  to
  actor
  reason
  commandId
  payloadHash
  stripeEventId
  createdAt

commerce_outbox/{hash(effectId, template, recipientRole, channel)}
  schemaVersion: 2
  effectId
  aggregateType
  aggregateId
  effectType
  template
  recipientRole
  recipientHash
  channel
  payloadVersion
  payloadSnapshot
  payloadHash
  status: pending | sending | sent | failed | delivery_unknown | dead_letter
  leaseToken
  processingUntil
  attemptCount
  nextAttemptAt
  providerMessageId
  lastError
  createdAt
  sentAt
  purgeAt
```

Le endpoint webhook:

1. choisit le secret par endpoint/configuration avant de faire confiance au
   payload;
2. verifie la signature sur le raw body;
3. persiste un snapshot canonique borne du payload verifie et son hash;
4. repond `2xx` apres cette persistance;
5. laisse un worker a lease appliquer le reducer.

La mutation de domaine et le passage inbox a `processed` sont atomiques. Un
event ID deduplique la livraison; un `effectId` deduplique aussi deux
evenements Stripe distincts qui decrivent le meme effet. Une lease expiree est
reprise. Un paiement reussi orphelin ou une validation incoherente cree un
incident durable, jamais un simple `skipped`.

Le worker utilise `leaseToken` comme fencing token dans la transaction
`apply + processed`; un ancien worker qui a perdu la lease ne peut plus
committer. Un sweeper periodique reprend `received/failed` dus et les leases
expirees, borne les tentatives, alerte la dead-letter et couvre la perte du
trigger asynchrone. Les `effectId` sont specifiques a l'effet: commit/release
par PI+reservation+operation, refund par refund ID+transition, fulfillment par
commande+allocation+transition. Deux vrais cycles non terminaux d'un meme PI
ne sont pas dedupliques comme un seul effet.

L'outbox garantit l'effet metier unique, pas magiquement un envoi exactement
une fois. Avec Gmail SMTP, une coupure apres acceptation du message mais avant
l'accuse local produit `delivery_unknown` et interdit le retry automatique.
Une garantie fournisseur plus forte exige Resend ou un autre provider qui
honore une cle d'idempotence.

Un document outbox independant est cree par
`(effectId, template, recipientRole, channel)` dans la meme transaction que la
transition metier. Son payload est immutable: l'e-mail client et l'e-mail admin
peuvent echouer/reprendre independamment. Un renvoi manuel de
`delivery_unknown` exige une decision avertissant du risque de doublon et cree
une nouvelle tentative auditee; seules les erreurs certaines avant acceptation
sont automatiquement rejouables.

### 11.5 Commandes serveur et contrat client

Surface client minimale:

- `createCheckout`;
- `resumeCheckout`;
- `getCommercePolicyClient`;
- `getOrderStatusClient`;
- `requestOrderCancellation`;
- `consumePurchasedCart`;
- `listCustomerOrders`;
- `getCustomerOrder`;
- `listOrderDocuments`.

Surface interne/admin minimale:

- `applyStripePaymentEvent`;
- `expireReservation`;
- `reconcileCommerceOrder`;
- `markOfflinePaymentReceivedAdmin`, seulement si le differe est reactive;
- `cancelUnpaidOrderAdmin`;
- `markOrderPreparingAdmin`;
- `markOrderReadyForPickupAdmin`;
- `markOrderShippedAdmin`;
- `markOrderPickedUpAdmin`;
- `markOrderDeliveredAdmin`;
- `requestRefundAdmin`;
- `markReturnReceivedAdmin`;
- `setReturnLineDispositionAdmin`;
- `updateCommercePolicyAdmin`;
- `createProductAdmin`;
- `updateProductOfferAdmin`;
- `archiveProductAdmin`;
- `adjustInventoryAdmin`.

`resumeCheckout` verifie la propriete, reprend/reconcilie une saga et ne rend un
client secret que si l'action reste admissible. `getOrderStatusClient` est une
lecture de compatibilite sans effet. Les deux utilisent le meme repository, la
meme projection et le meme reducer; ils ne recreent pas deux chemins de verite.

Chaque mutation:

- authentifie d'abord acteur/propriete, puis valide assurance et
  `allowedActions`;
- exige `commandId` et, pour une creation, `clientOrderId`;
- recalcule `payloadHash` cote serveur depuis une serialisation canonique;
- retrouve ensuite un resultat idempotent avant de verifier
  `expectedVersion`, afin qu'un retry acquitte ne devienne pas un conflit;
- refuse une meme cle avec un payload different;
- applique une transition fermee, sans regression des faits terminaux;
- ecrit audit et projections legacy dans la meme transaction;
- ne laisse jamais le navigateur ecrire prix, paiement, stock ou fulfillment.

Le navigateur conserve un descripteur de reprise non autoritaire
(`clientOrderId`, `orderId`, version du contrat et identite des lignes panier),
mais jamais le client secret, l'OTP ou le total comme verite. `orderId` est un
identifiant, pas un credential; le descripteur est namespace par UID et invalide
au changement d'identite/logout.

La reprise meme appareil exige l'UID proprietaire, anonyme ou permanent. La
reprise inter-appareil utilise un token opaque rotatif, consommable et borne:

```text
commerce_order_access_tokens/{tokenHash}
  orderId
  ownerUid
  purpose
  expiresAt
  consumedAt
  rotation
  purgeAt
```

Cette collection est backend-only; le token brut n'est jamais stocke. Son
contrat est fige en Gate 1 et son backend existe avant `resumeCheckout` Gate 3.

`consumePurchasedCart` est idempotent, lie a une commande
`payment.status=succeeded`, au proprietaire et aux couples
`cartLineId/cartRevision`. Le panier guest est migre vers le UID avant
`createCheckout`, ou utilise une branche locale explicitement testee. Une ligne
legacy sans revision est conservee si sa suppression est ambigue.

## 12. Matrice de transitions cible

| Evenement | Precondition | Checkout/paiement | Inventaire | Fulfillment/garde | Effet |
| --- | --- | --- | --- | --- | --- |
| checkout cree | politique valide, total serveur, stock disponible | `active/awaiting_method` | quantites `held` | `unfulfilled/merchant` | creer ou retrouver le PI avec la meme cle Stripe |
| carte refusee | PI reessayable | `active/awaiting_method` | hold conserve | inchange | aucune liberation, meme PI reutilise |
| PI requires confirmation | tentative client encore admissible | `active/awaiting_method` | hold conserve | inchange | meme PI/attempt, jamais release |
| action 3DS requise | PI `requires_action` | `active/requires_action` | hold conserve | inchange | attendre reprise ou webhook |
| PI processing | PI `processing` | `active/processing` | hold conserve | inchange | reconciler sans timeout terminal |
| PI succeeded | PI, montant, devise, order et compte valides | `closed/succeeded` | `held -> committed` une fois | `unfulfilled/merchant` | fait financier + outbox |
| annulation demandee | paiement non reussi | `cancellation_requested`, paiement inchange | hold conserve | inchange | demander l'annulation Stripe |
| PI canceled | annulation Stripe prouvee | `closed/canceled`, `closeReason=canceled|expired` | `held -> released` une fois | `canceled/merchant` | outbox annulation |
| reservation expiree | non paye et checkout encore actif | `cancellation_requested`, paiement inchange | hold conserve | inchange | annuler/reconcilier le PI avant release |
| paiement offline accepte | mode v2 actif, echeance et preuve durables | `closed/succeeded` | `held -> committed` | `unfulfilled/merchant` | fait financier admin audite |
| preparation | paiement reussi | inchange | committed | `preparing/merchant` | audit |
| retrait pret | paiement reussi, retrait configure | inchange | committed | `ready_for_pickup/merchant` | outbox |
| retrait effectue | preuve de remise | inchange | committed | `picked_up/customer` | audit |
| expedition | paiement reussi | inchange | committed | `shipped/carrier` | outbox |
| livraison | expedition prouvee | inchange | committed | `delivered/customer` | audit |
| refund demande | montant encore remboursable | paiement reste `succeeded`; refund `pending` | inchange | inchange | Refund Stripe idempotent |
| refund partiel confirme sans lignes | frais/livraison/geste commercial | paiement reste `succeeded`; refund `partial` | inchange | inchange | fait financier + confirmation de remboursement |
| refund de lignes avant remise | lignes/quantites explicites, garde merchant | paiement reste `succeeded`; refund partiel/complet | disposition explicite sur seules lignes allouees | resume fulfillment recalcule | remise en vente seulement apres refund valide et mouvement |
| refund total avant remise du bien | garde `merchant`, aucun retour necessaire | paiement reste `succeeded`; refund `full` | disposition `restock` explicite et unique | `canceled/merchant` | remise en vente seulement apres refund valide |
| refund confirme apres remise | garde `carrier` ou `customer` | paiement reste `succeeded`; refund partiel/complet | aucun restock | fulfillment conserve; dossier retour ouvert si necessaire | attendre le retour physique |
| retour recu | reception et quantites prouvees | inchange | aucun delta avant inspection | `custody=returned` | audit |
| retour controle conforme | lignes et quantites inspectees | inchange | `committed -> restocked` une fois | garde `returned` | republication admissible |
| retour non revendable | lignes et quantites inspectees | inchange | `committed -> written_off` une fois | garde `returned` | aucune remise en vente |

Transitions interdites notamment:

- `awaiting_method/requires_action/processing -> released` sans annulation PI;
- `unpaid -> shipped`;
- `paid -> available` par edition produit;
- `refund succeeded + carrier/customer -> restocked` sans retour et inspection;
- une somme de dispositions superieure a la quantite engagee;
- regression d'un evenement Stripe ancien sur un etat plus avance;
- suppression physique d'une commande payee.

Regles de resolution:

- les etats non terminaux Stripe peuvent cycler; ils n'utilisent pas un rang
  total artificiel;
- un `succeeded` Stripe courant, prouve avant annulation provider, gagne et
  empeche toute liberation; un vieux snapshot ne gagne jamais sur un PI
  actuellement `canceled`;
- tout conflit terminal `succeeded/canceled` declenche un retrieve Stripe et un
  incident avant transition;
- `requires_capture` est refuse par la politique ou classe `needs_review` tant
  que la capture manuelle n'est pas implementee;
- un event ancien peut completer un audit, mais pas regresser un axe;
- une ambiguite financiere ou d'inventaire gele les actions et cree
  `needs_review`; elle ne lance pas une compensation speculative.

Les mappings couvrent tous les statuts officiels PaymentIntent:
[PaymentIntent lifecycle](https://docs.stripe.com/payments/paymentintents/lifecycle)
et [PaymentIntent object](https://docs.stripe.com/api/payment_intents/object).

## 13. Rules et frontieres de confiance cibles

### 13.1 Commandes

```text
orders:
  lecture proprietaire/admin bornee ou read model serveur
  creation/update/delete SDK client: false
  ecriture: Admin SDK via commandes metier uniquement

orders/{orderId}/payment_attempts|refunds|returns|fulfillments|events:
  regles explicites par sous-collection
  creation/update/delete SDK client/admin: false

inventory_reservations|inventory_movements:
  lecture SDK: false sauf read model explicitement justifie
  ecriture SDK: false

commerce_webhook_inbox|commerce_outbox|commerce_incidents|
commerce_financial_facts|commerce_order_access_tokens|commerce_fixture_scopes:
  lecture/ecriture SDK: false
```

Les droits du parent ne s'appliquent pas automatiquement a ses
sous-collections. Chacune recoit donc un `match` explicite et un test Rules.

La propriete client repose sur `userId`, y compris un UID anonyme initialise
explicitement avant le checkout. L'OTP lie l'achat invite a cet UID. Un lien
opaque, consommable et rotatif peut permettre la reprise sur un autre appareil;
l'e-mail seul ne devient jamais une preuve de propriete permanente.

### 13.2 Produits

Separer:

- champs editoriaux modifiables selon une allowlist stricte;
- champs commerce `stock`, `sold`, reservation, disponibilite et provenance de
  vente;
- operations de suppression/archive.

Les champs commerce passent par Functions. Une mutation editoriale ne peut pas
modifier indirectement un champ commerce via un objet remplace en bloc. Une
suppression verifie commandes, reservations et references media, puis prefere
l'archive.

Allowlist commerce minimale protegee:

```text
stock, sold, soldAt, buyerId, status,
currentPrice, startingPrice, price, priceOnRequest,
inventoryVersion, disponibilite, provenanceVente,
champs futurs de reservation
```

Les ordres editoriaux tels que `nouveautesOrder/petitsPrixOrder` restent
distincts. La creation produit, l'offre/prix/publication et l'archive passent
respectivement par `createProductAdmin`, `updateProductOfferAdmin` et
`archiveProductAdmin`; `adjustInventoryAdmin` ne remplace pas ces commandes.

### 13.3 Storage

La cible conserve `catalog-projection/**` totalement prive et remplace le
wildcard global par des prefixes media explicites. Pour chaque prefixe:

- lecture publique uniquement si le storefront en a besoin;
- create/update/delete separes;
- claim fort + `sys_admin_access.active` pour toute mutation;
- MIME, taille, nom et chemin bornes;
- aucun document commande, facture, avoir, retour ou export confidentiel;
- tests d'admin actif/revoque, delete, taille, MIME et prefixe.

Le delete media produit par SDK est `false`; suppression et quarantaine passent
par une commande serveur/GC borne apres verification des references.

L'acces Firestore depuis Storage Rules exige un preflight IAM/facturation dans
le projet cible. App Check Storage reste une verification cloud distincte. Le
rail `getUploadUrl` doit appliquer les memes bornes, puis valider/quarantainer
l'objet apres upload, ou etre retire.

Reference officielle: [conditions Cloud Storage Security Rules](https://firebase.google.com/docs/storage/security/rules-conditions).

### 13.4 Politiques

`payment_settings` et `delivery` convergent vers:

```text
commerce_policy_versions/{version}
  document immutable complet, backend-only

sys_commerce_public/current
  projection sanitisee de activePolicyVersion/controlRevision
  lisible par le client
```

`sys_commerce_control/current.activePolicyVersion` est l'unique pointeur
d'activation. Politique et `controlRevision` sont valides/updates atomiquement
par Function. La politique definit ce qui est admissible; le controle runtime
peut toujours couper un mode admissible. Les deux doivent autoriser une
creation.

La politique versionnee contient:

- modes paiement actifs;
- mode differe actif ou non;
- devise;
- prix livraison en centimes entiers;
- modes actifs et IDs allowlistes;
- contraintes d'adresse/zone;
- `holdDurationSeconds` et calcul serveur de `expiresAt`;
- version, auteur, timestamp serveur et audit.

Le controle runtime `sys_commerce_control/current` reste backend-only. Aucun
champ public ne peut activer Stripe, le writer v2, le differe ou les mutations
admin.

Rules cibles pour la projection publique:

```text
match /sys_commerce_public/current:
  allow get: true
  allow list, create, update, delete: false
```

Son schema sanitise est borne et teste; il ne contient ni compte Stripe, ni
secret, ni allowlist d'identites fixture, ni controle backend.

Les paths legacy `delivery/payment_settings` deviennent read-only avant la
bascule. Le wildcard admin actuel doit etre resserre: dans Firestore Rules, un
`allow false` plus specifique n'annule pas un `allow true` concurrent.

### 13.5 Indexes, TTL et retention

Avant d'activer un worker, chaque requete de lease, expiration, reconciliation,
outbox ou migration possede:

- un index ou une justification explicite qu'aucun composite n'est requis;
- un test d'integration qui execute la requete exacte;
- une pagination par curseur et une limite;
- une regle de retention et un proprietaire.

Matrice composite minimale, a ajuster avec la requete executable sans changer
son invariant:

| Requete cible | Filtres/ordre | Composite minimal |
| --- | --- | --- |
| commandes client | `userId ==`, `createdAt desc` | `orders: userId ASC, createdAt DESC` |
| holds expires | `status == held`, `expiresAt asc` | `inventory_reservations: status ASC, expiresAt ASC` |
| inbox due | `status in received/failed`, `nextAttemptAt asc` | `commerce_webhook_inbox: status ASC, nextAttemptAt ASC` |
| leases inbox expirees | `status == processing`, `processingUntil asc` | `commerce_webhook_inbox: status ASC, processingUntil ASC` |
| outbox due | `status in pending/failed`, `nextAttemptAt asc` | `commerce_outbox: status ASC, nextAttemptAt ASC` |
| leases outbox expirees | `status == sending`, `processingUntil asc` | `commerce_outbox: status ASC, processingUntil ASC` |
| incidents ouverts | `status == open`, `createdAt desc` | `commerce_incidents: status ASC, createdAt DESC` |

L'index est deploye separement et doit etre observe `READY` dans le projet cible
avant de deployer/activer la Function qui l'exige. L'emulateur ne prouve ni le
backfill, ni cet etat cloud. La procedure suit la documentation Firebase
[Manage indexes](https://firebase.google.com/docs/firestore/query-data/indexing):
la creation est une operation longue avec backfill, meme sur une base vide.

Firestore TTL ne pilote jamais une echeance metier. Les workers utilisent
`expiresAt`/`nextAttemptAt`; le TTL ne supprime que via un champ `purgeAt`
ajoute apres etat terminal et delai de retention. Il ne doit jamais supprimer
un hold actif, un incident ouvert, une commande comptable ou laisser des
sous-collections orphelines. Les collections financieres suivent la retention
comptable, pas la purge des fixtures. Selon la documentation Firebase
[TTL](https://firebase.google.com/docs/firestore/ttl), l'activation peut prendre
au moins dix minutes, la suppression est non instantanee et ne supprime pas les
sous-collections: aucun critere metier ne peut donc attendre ce mecanisme.

`firestore.indexes.json:45-60` ne declare actuellement aucun `ttl: true`.
Gate 7A choisit explicitement
entre TTL laisse desactive ou field override `purgeAt` active uniquement sur
une collection auxiliaire terminale, apres dry-run, sauvegarde et verification
de la policy active; tout index requis reste observe `READY`. Desactiver TTL ne
restaure jamais les documents deja supprimes.

### 13.6 Ordre Rules sans lockout

1. deployer les indexes, attendre `READY`, puis les Rules backend-only des
   nouvelles collections;
2. deployer les Functions v2 avec controle `off`;
3. deployer les lecteurs v1/v2 et les UI sans fallback vers un writer SDK;
4. verifier `orders` deja read-only depuis Gate 0B, puis proteger les champs
   commerce produit, politiques, Storage et autres writes restants;
5. prouver les callables et lecteurs avec les Rules restrictives;
6. fermer Gate 7A projections/exploitation, puis seulement activer
   `v2_fixture`.

Pour les ecritures legacy deja dangereuses, le confinement Gate 0B rend d'abord
le hard-stop serveur actif et observe, deploie/verifie ensuite les UI read-only,
puis ferme les Rules dans une etape distincte. App Hosting et Rules ne sont pas
atomiques. Un rollback conserve les Rules restrictives et coupe les writers; il
ne rouvre pas les mutations directes.

## 14. Strategie de migration

### 14.1 Principes

- aucune correction massive de stock sans preuve;
- dry-run, comptages et export avant ecriture;
- Stripe est relu pour tout statut financier ambigu;
- deploiement additif, writer v2 desactive par defaut;
- compatibilite de lecture v1/v2, jamais double ecriture concurrente;
- tout handler legacy refuse explicitement `schemaVersion >= 2`;
- le cleaner legacy ne selectionne jamais une commande v2;
- Rules restrictives avant activation, apres deploiement des Functions et UI
  compatibles;
- anciens webhooks en vol pris en compte;
- rollback defini a chaque etape;
- aucune migration massive de l'historique terminal n'est requise.

### 14.2 Mapping prudent v1 vers v2

| Legacy | Mapping initial |
| --- | --- |
| `pending_payment` Stripe | relire PI, commande et reservation; ne rien inferer de Firestore seul |
| `pending_payment` differe | revue obligatoire; pas de v2 sans echeance et preuve du hold |
| `paid` | `succeeded + committed` seulement si PI, montant, devise, compte Connect et allocation sont prouves |
| `shipped` | ne promouvoir que sur preuve fulfillment durable; sinon legacy read-only/review |
| `completed` | ne jamais inferer livraison/garde du seul statut manuel; preuve durable ou review |
| `payment_failed` | relire Stripe; le meme PI peut avoir reussi ensuite |
| `canceled/cancelled*` | `canceled + released` seulement si annulation PI et mouvement sont prouves |
| `refund_pending` | relire le refund Stripe; fulfillment conserve separement |
| `refunded` | montant financier prouve; disposition physique encore a verifier |
| `refund_failed` | paiement reste reussi; resultat Stripe a reconcilier |

Ce tableau sert a classifier, pas a attribuer automatiquement
`schemaVersion: 2`. `stockBefore`, `buyerId`, `sold` et un statut legacy ne
recalculent jamais le stock pendant un backfill.

Classification legacy:

| Classe | Traitement |
| --- | --- |
| `legacy_terminal_read_only` | reste v1, lecture via adaptateur jusqu'a retention |
| `safe_to_adopt` | preuves Stripe et allocation coherentes; adoption idempotente sans nouveau decrement |
| `needs_review` | toute ambiguite argent, compte Connect, stock ou ancienne compensation; actions gelees |

Un historique paye n'est pas « nettoye » pour embellir le modele. Une
reservation legacy adoptee enregistre l'allocation deja realisee avec un
mouvement d'adoption a delta zero; elle ne decremente jamais une seconde fois.
Tous les non-terminaux doivent etre classifies avant activation. Une terminale
`legacy_terminal_read_only` peut etre migree a la demande d'une future action;
`safe_to_migrate_on_demand` est donc une transition controlee, pas une classe
initiale concurrente.

Le manifeste de classification enregistre `updateTime/hash` source, IDs
deterministes, precondition, checkpoint et resultat par ligne. Il verifie
`total source = read_only + candidat adoption + needs_review`; tout conflit de
version devient `needs_review`. Un pending prouve peut etre adopte `held` et un
paye prouve `committed`, toujours a delta zero. Canceled/refunded et toute trace
de compensation/admin legacy ne sont jamais adoptes automatiquement.

### 14.3 Ordre de bascule

1. fermer Gate 0A puis confiner le moteur legacy en Gate 0B;
2. ajouter contrats, reducers, lecteurs v1/v2 et barrières legacy;
3. deployer indexes et Rules backend-only des nouvelles collections;
4. deployer Functions, inbox, reservations et reconciler avec writer `off`;
5. deployer UI v2-first/adaptateur v1 read-only et commandes serveur sans
   fallback writer SDK;
6. verifier `orders` deja read-only; fermer les champs commerce produit,
   politiques, Storage et exceptions restantes;
7. produire le dry-run et classifier toutes les commandes non terminales;
8. drainer ou geler chaque legacy non terminal; aucune adoption n'est requise
   pour le canary;
9. preparer le scope `v2_fixture` mais garder `newCheckoutMode=off`;
10. fermer Gate 7A projections/exploitation sur le SHA final, puis activer ce
    scope exact;
11. executer Gate 7B deux fois, rapprocher et terminaliser le run;
12. autoriser la recette humaine Gate 8;
13. adopter eventuellement une ligne `safe_to_adopt` dans un lot separe,
    reexecutable et reconcilie;
14. elargir a `v2_all` seulement par decision explicite apres observation;
15. migrer l'historique terminal uniquement a la demande;
16. eteindre les lecteurs/handlers legacy quand leur usage mesure est nul.

L'ordre d'autorite est donc:

```text
indexes/additive Rules
  -> Functions v2 OFF
  -> UI v2-first et actions serveur
  -> Rules restrictives
  -> classification legacy
  -> projections finales
  -> activation fixtures
  -> preuves E2E finales
  -> extension eventuelle
```

Il n'existe aucun fallback v2 vers `createOrder`, `cancelOrderClient` ou une
ecriture Firestore directe.

### 14.4 Points de non-retour et rollback

Apres le premier hold v2, le retour complet au moteur legacy n'est plus sur:

- `newCheckoutMode` repasse a `off`;
- les webhooks, workers, lecteurs v2 et reconciler continuent a drainer;
- les UI affichent reprise/maintenance et n'ouvrent pas un nouveau writer;
- les reservations et champs v2 restent en place;
- les Rules commerce ne sont pas rouvertes;
- aucune « migration inverse » de stock n'est executee.

Apres un refund, restock ou adoption legacy, aucune compensation automatique
n'existe. Une correction inventaire exige comptage, raison, `expectedVersion`
et mouvement correctif explicite. Une adoption historique erronee est marquee
`superseded`; elle ne genere pas d'elle-meme un delta inverse. Changer de
region, supprimer un ancien endpoint webhook ou un champ legacy attend la
mesure a zero de son consommateur.

## 15. Roadmap d'implementation fermee

L'ordre de fermeture est strict:

```text
0A -> 0B -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7A -> 7B -> 8
```

Une gate suivante peut etre preparee localement lorsque ses dependances pures
sont disponibles, mais aucun writer, aucune Rule restrictive supplementaire et
aucun test heberge ne sont actives avant la fermeture formelle de la gate
precedente. Chaque gate produit un compte rendu avec preuves, validations non
lancees et rollback.

Les gates qui changent le runtime ont deux etats: `CODE_READY` puis
`SANDBOX_ACTIVE`. Elles ne sont fermees qu'apres activation autorisee, smoke,
observation et rollback verifie. Cette roadmap n'autorise aucun deploiement.
Gate 0A doit rester un lot local court et Gate 0B fait partie de la meme premiere
livraison. Si un paiement peut etre initie pendant ce travail, le hard-stop
serveur/UI minimal de Gate 0B est prioritaire et ne doit pas attendre un
nettoyage lint historique.

### Gate 0A - harnais sentinelle anti-faux-vert

Objectif: prouver le mecanisme de validation avant toute mutation de
confinement.

Livrables minimaux:

```text
lint:functions
test:commerce:runner
test:commerce:containment
test:commerce:rules:containment
test:commerce
```

- `eslint.config.mjs` couvre effectivement `functions/src/commerce/**`,
  `functions/src/email/**`, `functions/src/maintenance/**` et les scripts
  commerce modifies;
- un runner `node:test` local, sans reseau, retourne un exit non nul sur
  assertion fausse, promesse rejetee, timeout et scenario marque incomplet;
- un manifeste machine ferme liste les suites/scenarios attendus; rapport
  JSON/JUnit exige `executed=expected`, tests > 0 et zero
  skip/todo/cancelled/incomplete;
- les fakes comptent les ecritures Firestore, appels Stripe, e-mails et
  mouvements afin de prouver « zero effet »;
- un self-test volontairement faux est execute dans un sous-processus et doit
  etre observe en echec;
- les scripts sont bloquants dans la CI, sans lancer Stripe ou Firebase
  heberges.
- le wrapper Emulator utilise uniquement `firebase emulators:exec`,
  `--project demo-*`, des ports reserves et refuse ADC/projet reel; les
  sous-suites ne redemarrent pas l'emulateur.

Acceptation:

- retirer une assertion sentinelle ou forcer un resultat faux rend le job rouge;
- un sous-processus ESLint invoque la configuration sur une fixture fautive
  hors des sources et observe l'echec attendu;
- chaque scenario retourne une Promise attendue avec timeout/AbortSignal;
  `unhandledRejection`, `uncaughtException` ou scenario non termine = rouge;
- le runner identifie sa version, le SHA, les IDs attendus/executés et les
  suites reellement lancees.

Rollback: additif; aucun changement runtime et aucun deploiement.

### Gate 0B - confinement fail-closed du legacy

Objectif: stopper les nouvelles divergences tout en laissant converger les
paiements deja ouverts.

Livrables:

- controle serveur minimal distinct des reglages UI, fail-closed et verifie
  avant rate limit, reservation, commande ou appel Stripe;
- toute nouvelle creation legacy est refusee, meme si `payment_settings`
  annonce Stripe actif; seuls webhooks et drainage des orders existants restent
  ouverts;
- `manual` et `deferred` sont refuses cote serveur;
- checkout UI en maintenance/suivi minimal, sans creation legacy; la reprise
  complete arrive en Gates 3 et 5;
- `payment_failed` conserve commande, PI et hold;
- fermeture de modale = masquer, jamais liberer;
- annulation client/admin, cleaner et expiration ne liberent plus avant preuve
  d'annulation Stripe;
- refund legacy neutralise tant que refund et stock ne sont pas separes;
- succes webhook toujours traite; l'acquisition `processing` courante possede
  au minimum une lease recuperable et cree un incident sur paiement orphelin;
- Publication, Ventes, Retours, Livraison et Paiement deviennent read-only pour
  les champs commerce avant fermeture des Rules;
- writes SDK `orders`, create/delete produit, champs prix/stock/vente,
  politiques legacy et delete media produit sont fermes ensuite;
- `resetAllStats`, `runGarbageCollector`, `resetAllUsers`,
  `purgeAnonymousUsers`, `purgeAllProducts` et `resetAllOrders` neutralises
  cote serveur;
- facture client masquee hors document admissible et KPI de CA actuel marques
  indisponibles, pas presentes comme comptables.

Tests bloquants:

- controle absent/invalide ou Stripe inactif: zero order, hold, PI, rate-limit
  consomme ou idempotence reservee;
- client modifie demandant `manual/deferred`: refus serveur a zero effet;
- refus puis succes du meme PI: aucune liberation intermediaire;
- fermeture, annulation ou cleaner sur PI ouvert: aucune liberation;
- lease webhook expiree: evenement repris;
- super-admin appelant une des six maintenances: refus serveur;
- write direct d'une commande par Firebase client SDK avec claims admin:
  refuse par Rules;
- champs commerce produit, politique et delete media ne restent pas mutables
  depuis le navigateur.

Rollback: le checkout reste coupe. Aucun ancien release, refund ou writer SDK
n'est reactive. Le risque accepte est un hold temporairement bloque, traite en
`needs_review`, plutot qu'une double vente.

### Gate 1 - contrat de domaine, compatibilite et suite locale

Objectif: rendre la machine d'etat executable et testable sans cloud.

Livrables:

- schema v2 minimal de la section 11 et validateurs d'entree/sortie;
- reducer pur monotone et matrice fermee;
- centimes entiers et fonctions d'invariants;
- projection `v2 -> legacy` deterministe et atomique;
- adaptateur de lecture v1/v2 sans promouvoir une donnee ambigue;
- barrieres: handler v1 refuse v2, cleaner v1 exclut v2;
- horloge, IDs, Stripe et Firestore injectables;
- factories et failpoints nommes;
- reducer checkout frontend, adaptateur de commandes et descripteur de reprise
  developpes derriere flag;
- suites `test:commerce:unit`, `test:commerce:property`,
  `test:commerce:firebase`, `test:commerce:rules`,
  `test:commerce:faults` et agregat `test:commerce`.

Acceptation:

- une preuve pre-correction capture NC-001 a NC-007 en echec; les tests de
  regression fusionnes sont uniquement verts, sans expected-failure permanent;
- toute transition non listee, montant flottant, version obsolete ou projection
  incoherente est refusee;
- meme `commandId`/payload rend le meme resultat; payload different est un
  conflit;
- le lookup idempotent est teste avant `expectedVersion`;
- tests unitaires/property sans reseau; integration Firestore sous emulateur.

Rollback: modules, UI et tests additifs, flags toujours `off`.

### Gate 2 - politique, argent, Connect et inventaire

Objectif: etablir la verite serveur avant toute creation Stripe v2.

Livrables:

- evolution du hard-stop Gate 0B vers politique versionnee et controle runtime
  backend-only, sans changer son defaut `off`;
- schema d'entree allowliste, tailles/bornes et montants en centimes;
- validation serveur de livraison, zone, adresse et mode actif;
- `clientOrderId`, `requestHash` et contrat de lignes panier versionnees;
- aggregation par cle d'inventaire et reservations quantitatives;
- mouvements `hold/commit/release` idempotents; dispositions physiques viennent
  en Gate 4;
- compte Connect actif valide puis epingle sur la commande;
- changement/suspension Connect bloquant les nouveaux checkouts sans rerouter
  les commandes historiques;
- paiement offline toujours `off`, sauf workflow complet accepte plus tard.

Tests bloquants:

- nouvelle creation sous mode/politique absent, inconnu, inactif ou incompatible:
  refus fail-closed; retry exact reprend la politique epinglee;
- livraison negative, flottante, hors zone ou adresse invalide: refus;
- meme identite + `clientOrderId` + hash: meme commande; hash different:
  conflit;
- stock 1 et deux acheteurs: un seul hold;
- stock 10, holds 1 et 2, release 1: disponible 8;
- SKU repete, meme ID dans deux collections, multi-SKU et double release;
- suspension Connect bloque une creation et conserve le compte d'un PI existant.

Rollback: writer `off`; donnees additives conservees; aucune compensation
`stockBefore`.

### Gate 3 - saga PaymentIntent, webhook et reconciliation

Objectif: garantir la convergence argent-commande-reservation sous retry et
panne.

Livrables:

- `createCheckout` avec cle Stripe deterministe et etats de saga durables;
- resultat Stripe inconnu traite comme reprenable, jamais comme echec definitif;
- rattachement PI durable avant remise du client secret;
- annulation/expiration pendant `create_pending/create_unknown`: rejouer la
  meme cle Stripe, retrouver l'eventuel PI, puis l'annuler avant release;
- refus non terminal et reuse du meme PI;
- `requires_action` et `processing` conservant le hold;
- annulation provider-first, expiration et reprise;
- inbox plateforme/Connect avec payload verifie, fencing, sweeper, backoff et
  dead-letter;
- reducer commun aux webhooks, expirations et reconciler;
- fait financier et intention outbox ecrits atomiquement avec le succes;
- triggers e-mail/statistiques legacy ignorent `schemaVersion >= 2`;
- incidents durables pour paiement orphelin, mismatch et etat impossible;
- isolation/suppression bornee du handler Checkout Session legacy;
- requetes workers indexees, bornees et paginees;
- token de reprise guest backend et `resumeCheckout` sur projection canonique.

Tests bloquants avec failpoints:

- create: apres hold; Stripe accepte puis reponse perdue; apres reponse PI avant
  attach; apres attach avant reponse client;
- cancel: apres request; cancel Stripe accepte puis reponse perdue; PI canceled
  observe avant release;
- inbox: apres persist; apres claim; apres retrieve; transaction apply avortee;
  apres commit;
- doublons, evenements distincts de meme effet et ordre inverse;
- scope plateforme, deux comptes Connect, mauvais secret et fencing lease volee;
- refus puis succes sur meme order/PI;
- `processing` prolonge sans release;
- succes concurrent a annulation/expiration/create inconnu;
- PI annule avant release;
- mismatch montant/devise/order/compte;
- PI reussi sans commande: incident durable;
- trigger worker perdu repris par sweeper;
- plus de 50 commandes non pertinentes devant une expiration eligible;
- chaque reprise affirme un seul PI, mouvement, fait et effet outbox.

Rollback: nouvelles creations `off`; webhooks, reader v2 et reconciler restent
actifs. Aucun changement de region dans cette gate.

### Gate 4 - commandes admin/client, refunds et retours

Objectif: supprimer les voies d'ecriture metier hors reducer.

Livrables:

- callables idempotentes pour annulation client, fulfillment, retrait,
  ajustement et archivage;
- commandes serveur de creation produit, offre/prix/publication et archive;
- `allowedActions` calcule serveur;
- refund financier par requete/cumul, distinct du retour et de la disposition;
- dossiers retour et dispositions quantitatives par ligne;
- aucun restock sur echec ou resultat Stripe inconnu;
- refund avant remise du bien et apres livraison traites differemment;
- audit append-only et soft-delete pour les archives;
- paiement offline complet avec echeance/preuve/audit, ou maintien explicite a
  `off`;
- UI admin branchee aux commandes derriere flag, sans `updateDoc/deleteDoc`
  commerce.

Tests bloquants:

- non-admin/admin sans assurance forte/action non permise: refus;
- double clic, retry reseau et commande concurrente: effet unique;
- fulfillment non paye refuse;
- refund partiel puis cumul exact;
- meme `refundRequestId` deduplique; deux IDs partiels distincts restent deux
  operations avec cles Stripe distinctes;
- refund echoue: aucun restock;
- refund accepte puis reponse perdue, avant persistance et avant disposition:
  reprise sans second refund/mouvement;
- bien chez client: refund sans restock, puis reception/inspection;
- q=5 avec deux retours concurrents, inspection partielle
  restock 1/write-off 1 et annulation d'un retour pending;
- dispositions partielles ne depassent jamais la quantite engagee;
- commande historique agit sur son compte Connect d'origine;
- toute mutation sensible possede audit, acteur et raison.

Rollback: actions repassent read-only; les commandes deja acquittees ne sont
jamais inversees par suppression.

### Gate 5 - checkout, espace commandes, admin et Rules

Objectif: basculer tous les consommateurs vers le contrat v2, writer encore
desactive.

Livrables:

- controller checkout unique utilisant la projection serveur et `stateVersion`;
- retour 3DS, reload, back/forward et multi-onglet via `resumeCheckout`;
- fermeture de modale distincte de l'annulation;
- aucun `pagehide`, demontage ou timeout UI ne libere le stock;
- succes affiche uniquement apres projection serveur
  `payment.status=succeeded`, puis avant nettoyage panier;
- nettoyage idempotent des seules lignes `cartLineId/cartRevision` achetees;
- implementation des revisions de lignes paniers local et Firestore;
- Auth Firebase anonyme explicite avant checkout invite;
- espace commandes via `userId`, pagination serveur et actions autorisees;
- lecteur v2-first et adaptateur historique v1 explicite/read-only; aucune
  promotion d'une commande ambigue;
- UI admin Publication/Ventes/Retours/Livraison/Paiement uniquement via
  Functions pour tout champ commerce;
- documents masques tant qu'aucun document serveur admissible n'existe;
- `test:commerce:ui` et `test:commerce:browser`;
- Functions v2 deployees `off`, puis UI v2-first sans fallback writer, puis
  Rules restantes restrictives et tests anti-lockout.

Tests bloquants:

- vieux bundle/contrat refuse avant tout hold;
- aucun appel `createOrder`, `cancelOrderClient` ou write SDK commerce dans le
  chemin v2;
- timeout/reload/3DS retrouve meme order et meme PI;
- reprise executee avant les gardes panier vide/catalogue indisponible;
- refus conserve meme `attemptId`, PI et instance Elements;
- `processing` reste reprenable;
- succes concurrent a annulation affiche le paiement reussi;
- echec du cleanup ne masque ni ne regresse le succes;
- ligne retiree/reajoutee ou modifiee dans un autre onglet n'est pas supprimee;
- guest OTP retrouve sa commande;
- changement d'UID/logout ne reprend jamais un descripteur d'une autre identite;
- UI admin reste fonctionnelle avec Rules restrictives;
- rollback UI garde un lecteur v2 et n'ouvre aucun writer legacy.

Rollback: page de maintenance/reprise, readers v1/v2 et Functions de drainage
restent disponibles; Rules non rouvertes.

### Gate 6 - classification legacy et preparation fixtures sandbox

Objectif: rendre le cutover mesurable sans inventer de verite financiere ou de
stock.

Preparation locale:

- outil read-only par defaut avec `--dry-run`, compteurs, pagination, reprise et
  manifeste;
- classes de la section 14;
- code d'adoption eventuelle teste a delta stock zero mais execution differee;
- registre fixture backend-only immutable avec `fixtureScopeVersion`, UIDs,
  inventoryKeys et policy autorisee;
- mode ecriture exige projet, environnement, confirmation et sauvegarde
  explicites.

Execution sandbox, uniquement sur autorisation cloud separee:

1. verifier projet, regions, endpoints, indexes, Rules et SHA deploye;
2. prendre comptages/sauvegarde adaptee;
3. lancer le dry-run;
4. relire Stripe pour chaque etat financier ambigu;
5. classifier toutes les commandes non terminales;
6. drainer ou geler chaque non-terminal, sans adoption requise;
7. verifier zero correction speculative et zero handler legacy sur v2;
8. verifier le release manifest et le registre fixture;
9. enregistrer ce scope exact, avec `newCheckoutMode=off`.

Acceptation:

- aucun non-terminal non classe;
- dry-run repete identique;
- aucune ecriture d'adoption legacy avant la preuve fixture;
- aucune commande payee supprimee ou statut invente;
- compte Connect historique conserve;
- writers public et fixture toujours fermes; scope incapable de cibler une
  donnee cliente.

Rollback: `newCheckoutMode=off`, drain v2 maintenu, aucune migration inverse.

### Gate 7A - projections, documents et exploitation

Objectif: rendre les preuves secondaires reconstructibles avant la recette
humaine.

Livrables:

- dispatcher outbox, leases, dead-letter et renvoi borne; intention outbox et
  fait financier sont deja atomiques avec le succes depuis Gate 3;
- triggers e-mail/stats legacy fences sur `schemaVersion >= 2`;
- Gmail: `delivery_unknown` sans retry automatique; Resend: idempotency key si
  active;
- faits financiers absolus `captured/refunded/net` et projections
  reconstruisibles en centimes, separees par devise et datees par evenement
  effectif Stripe;
- dashboard marque source, fraicheur et divergences;
- recu sandbox serveur apres paiement et confirmation de remboursement
  distincte; facture/avoir legaux toujours soumis a
  validation juridique/comptable avant live;
- etat Connect par compte, pointeur actif et alerte de derive;
- reconciler manuel/planifie, incidents et seuils d'arret;
- release manifest immutable pour App, Functions, Rules/indexes et policy;
- regions explicites dans un manifeste; pas de migration regionale sans plan
  separe et mutateur unique;
- cleanup de run fixture borne, idempotent et reprenable;
- les maintenances globales restent desactivees; leur reconstruction n'est pas
  un prerequis Gate 8;
- retention/TTL conforme a la section 13;
- apres deploiement/verification du release final, activation
  `newCheckoutMode=v2_fixture` pour le seul scope Gate 6.

Tests bloquants:

- trigger/outbox duplique: un fait et un document outbox par effet/destinataire;
- panne avant envoi, apres envoi simule et apres accuse;
- Gmail ambigu devient `delivery_unknown`;
- pending/failed n'augmente pas le capture; seul refund `succeeded` diminue le
  net; partiels/cumuls, devise et dates effectives sont exacts;
- rebuild repete produit le meme resultat;
- aucun document de paiement avant encaissement;
- refund produit le document correct sans effacer le fulfillment;
- suspension Connect bloque seulement les nouvelles creations du compte actif;
- backlog, paiement orphelin, hold expire, refund/stock et outbox morte
  declenchent incident/alerte;
- cleanup dry-run n'ecrit rien et ne supprime jamais order, PI, refund, ledger
  ou audit paye/rembourse.

Rollback: couper workers non critiques; reconstruire les projections depuis les
faits; ne jamais modifier la verite paiement/stock pour corriger un KPI ou un
e-mail. Toute anomalie repasse d'abord `newCheckoutMode=off`.

Cette gate exige deploiement/activation sandbox et suit donc la meme regle
d'autorisation explicite que Gate 6.

### Gate 7B - E2E coeur sandbox final

Objectif: prouver le SHA final apres Gate 7A, sans demander au hosted de simuler
les failpoints couverts localement.

Runner obligatoire:

- projet, URL et release manifest immuable verifies;
- attestation des Rules/indexes et indexes observes `READY`;
- `livemode=false` prouve sur les objets plateforme et Connect avant mutation;
- comptes techniques exclusivement test;
- fixtures preprovisionnees, versionnees et allowlistees, ou factory backend
  run-scoped; jamais de fallback vers un vrai produit;
- correlation stricte `runId/clientOrderId/orderId/paymentIntentId/accountId`;
- aucune recherche de « derniere commande » ou dernier e-mail global;
- assertion fausse, blocker, timeout ou cleanup incomplet = exit non nul;
- snapshot avant/apres et terminalisation/archive limitee au `runId`;
- orders, PI, refunds, mouvements et audits financiers sont conserves;
- serialisation lorsque des runs partagent une cle d'inventaire;
- aucun changement automatique de webhook, politique globale ou compte Connect.

Scenarios hosted minimaux:

1. paiement accepte, succes durable, reprise et acces client;
2. refus puis succes sur le meme order, PI, attempt et reservation, sans release;
3. 3DS succes puis reprise, et abandon/echec sans faux succes;
4. dismiss/back puis reprise sans mutation metier;
5. annulation explicite d'un autre checkout, PI `canceled` avant release;
6. stock fixture 1 sous concurrence;
7. refund avant fulfillment, fait financier puis une disposition/restock;
8. achat guest OTP, reprise sans connexion forcee et panier concurrent preserve;
9. lecture admin et client coherente;
10. drain final: zero hold non terminal orphelin, operation due, lease expiree,
    incident ouvert ou divergence; reservations committed attendues conservees.

Acceptation: deux runs consecutifs sur le meme release manifest/SHA final,
chacun entierement correle, vert et terminalise. Cette gate touche
Stripe/Firebase sandbox et exige une autorisation explicite.

### Gate 8 - recette humaine client/admin

Objectif: valider UX et exploitation avec comptes test apres les preuves
automatiques.

La recette suit la section 17. Elle ne remplace aucune suite automatique et ne
ferme aucun constat par observation visuelle seule. Elle commence uniquement
apres Gate 7A fermee, Gate 7B verte deux fois sur le SHA final, rapprochement
initial vide et autorisation explicite d'utiliser le sandbox.

## 16. Matrice automatique minimale

### 16.1 Repartition des preuves

| Couche | Prouve | Ne prouve pas |
| --- | --- | --- |
| unitaires/reducer | transitions, argent, idempotence, invariants purs | transactions Firestore |
| generatif seedable | permutations, doublons, algebra des quantites | contention cloud reelle |
| emulateur Firestore/Functions | transactions, crashes injectes, requetes et Rules | indexes deployes, IAM, App Check reel, regions |
| composants/navigateur local | reprise UI, modale, panier, guest, vieux bundle | Stripe reel |
| E2E sandbox Gate 7B | integration Stripe/Firebase/deploiement et signatures | toutes les pannes et permutations |
| reconciliation | absence de divergence observable apres scenario | absence absolue d'un bug non stimule |

Une preuve n'est valide que si le test affirme aussi ses effets negatifs:
absence d'autre commande, autre PI, autre mouvement, autre e-mail ou mutation
hors fixture.

### 16.2 Domaine, concurrence et pannes injectees

1. deux appels simultanes meme `clientOrderId` -> un order et un PI;
2. meme cle avec payload different -> conflit sans nouvel effet;
3. deux comptes, stock 1 -> une seule reservation;
4. stock 10, holds 1 et 2, release de 1 -> disponible 8;
5. SKU duplique, meme ID dans deux collections et multi-SKU atomique;
6. q=5, deux retours concurrents, inspection partielle et annulation pending;
7. deux releases/restocks concurrents -> un seul mouvement;
8. adjustment sans reservation et produit multi-SKU manquant sans effet partiel;
9. crash aux failpoints create/cancel/refund/inbox nommes en Gates 3 et 4;
10. doublon event ID, event IDs distincts de meme effet, vraie tentative
    distincte et ordre inverse;
11. `processing` long, `requires_action`, `requires_capture` et mismatch;
12. plateforme, deux accountIds Connect, mauvais secret, lease volee et sweeper;
13. PI reussi orphelin -> incident, jamais skip;
14. requete paginee avec plus d'une page et element eligible apres 50 lignes;
15. projection legacy et algebra stock identiques quelle que soit la reprise.

Oracle minimal des interleavings:

| Sequence | Resultat attendu |
| --- | --- |
| failed -> succeeded meme PI | hold conserve puis commit unique |
| succeeded -> vieux failed | aucun retour arriere |
| cancel_requested <-> succeeded | retrieve courant; succeeded valide commit |
| expiry <-> create/attach PI | meme cle PI, cancel prouve avant release |
| processing -> succeeded/failed | transition selon etat Stripe courant |
| requires_action -> cancel | cancel prouve puis release |
| canceled -> vieux non-terminal | aucun retour arriere |
| conflit terminal | retrieve + incident, aucune compensation speculative |

Chaque failpoint est nomme et execute au moins deux fois: premiere execution
interrompue, reprise attendue, puis nouveau retry sans effet supplementaire.

### 16.3 Politiques, UI, Rules et control plane

1. controle/politique absent ou invalide -> fail-closed a zero effet;
2. paiement/livraison inconnu, inactif, hors zone ou prix non entier -> refus;
3. suspension/changement Connect sans reroutage historique;
4. write direct order et champs commerce produit refuse;
5. droits proprietaire, guest, admin faible/fort et sous-collections testes;
6. fulfillment non paye, transition obsolete et action non permise refuses;
7. double annulation/refund et refund partiel cumule;
8. refund livre sans restock, puis retour conforme/non conforme;
9. reload, back/forward, 3DS, fermeture et `processing` UI;
10. succes visible avant cleanup; ajout concurrent panier preserve;
11. vieux bundle refuse avant reservation;
12. espace commandes guest et documents masques avant admissibilite.

### 16.4 Projections et exploitation

1. outbox en panne avant send, apres send simule et apres accuse;
2. Gmail ambigu -> `delivery_unknown`, aucun renvoi automatique;
3. trigger/outbox duplique -> un fait/outbox metier; un message provider unique
   seulement si le provider honore l'idempotence;
4. pending/failed ne compte pas; captures et seuls refunds `succeeded` donnent
   le net exact par devise/date effective;
5. rebuild statistiques identique deux fois;
6. recu seulement apres encaissement et confirmation de remboursement distincte;
7. backlog webhook, paiement orphelin, hold expire et derive Connect alertes;
8. reconciliation repeated sans mutation si tout converge;
9. cleanup fixture dry-run a zero ecriture;
10. terminalisation/quarantaine fixture sans suppression des preuves comptables.

### 16.5 E2E sandbox

Le hosted execute seulement les scenarios Gate 7B. Les crashes, ordres
exhaustifs et contentions deterministes restent dans les couches locales. Un
E2E ponctuel ne ferme donc jamais a lui seul NC-001 a NC-007.

Le runner:

- utilise des fixtures preprovisionnees/allowlistees ou une factory backend
  run-scoped et refuse tout fallback;
- exige chaque ID attendu et leur correlation;
- interroge les projections serveur, Stripe test et le ledger, pas uniquement
  le texte UI ou un e-mail;
- enregistre l'etat avant/apres;
- verifie terminalisation/quarantaine et conservation des preuves;
- echoue si un scenario est saute ou si le rapprochement est incomplet.

### 16.6 Protection contre le faux vert et CI

PR locale/CI:

```text
lint:functions
test:commerce:runner
test:commerce:unit
test:commerce:property
test:commerce:firebase
test:commerce:rules
test:commerce:faults
test:commerce
```

Le workflow de PR ne lance aucun E2E heberge. Le workflow sandbox est manuel,
protege par environnement, execute apres Gate 7A et deploiement autorise, puis
verifie le release manifest App/Functions/Rules/indexes/policy. Il publie un
artefact de preuves expurge de tout secret.

Meta-tests obligatoires:

- assertion volontairement fausse -> exit non nul;
- manifeste attendu different du rapport execute/passe -> exit non nul;
- zero test, scenario inconnu/saute/todo/cancelled/incomplet -> exit non nul;
- timeout, rejection/exception non geree, scenario non termine ou open handle
  interdit -> exit non nul;
- mauvaise cible, `livemode=true`, fixture absente ou ID non correle -> abort
  avant mutation;
- cleanup incomplet -> run rouge;
- deux runs du meme SHA necessaires, jamais reutilisation d'une ancienne preuve.

## 17. Recette manuelle avec comptes test

### 17.1 Pre-requis

- Gates 0A a 7A fermees et preuves attachees au release manifest final;
- Gate 7B verte deux fois sur ce meme release;
- aucun `P0/P1` ouvert; une exception ne peut viser qu'un scenario hors Gate 8,
  sans alterer une preuve obligatoire, et porte proprietaire, mitigation et
  echeance;
- rapprochement initial vide, aucune inbox/outbox morte, aucun
  `delivery_unknown` du run non arbitre et aucun hold fixture ancien;
- `newCheckoutMode=v2_fixture`, writer public ferme et allowlist exacte;
- App Hosting, Functions, Rules, indexes, policy et rapport alignes sur le
  release manifest;
- Stripe test seulement, cles et objets avec `livemode=false`;
- compte client test;
- compte guest/OTP test distinct;
- compte admin test fort;
- compte super-admin reserve aux actions qui l'exigent;
- produits fixtures dedies avec stock 1, 2 et 10;
- aucune fixture catalogue cliente choisie par fallback;
- moyens de paiement et livraison de test explicites;
- politique/version et compte Connect fixture epingles;
- tableau de rapprochement et incidents accessibles;
- snapshot, cleanup borne, rollback `newCheckoutMode=off` et responsable
  identifies avant le premier clic.

### 17.2 Parcours client

1. consulter puis acheter un produit stock 1;
2. recharger pendant le checkout;
3. paiement accepte;
4. paiement refuse puis retry avec meme order/PI;
5. 3DS avec retour/reprise;
6. fermeture/back pendant confirmation puis reprise sans mutation;
7. annulation explicite sur un autre checkout, PI canceled avant release;
8. multi-onglet et revision ajoutee/reajoutee preservee;
9. achat authentifie;
10. achat guest OTP puis acces a la commande sans connexion forcee;
11. suivi commande et recu sandbox admissible.

### 17.3 Parcours admin

1. utiliser une fixture preprovisionnee ou la factory run-scoped;
2. constater la reservation;
3. verifier les actions autorisees;
4. preparer puis expedier/livrer une commande payee;
5. traiter un retrait si le mode est active;
6. tenter une transition interdite;
7. rembourser avant remise du bien;
8. rembourser apres livraison puis receptionner/inspecter le retour;
9. suspendre/reactiver une politique et verifier l'absence de contournement;
10. consulter audit, e-mails, stats, documents, incidents et rapprochement;
11. terminaliser/quarantainer uniquement les fixtures du run, sans supprimer
    les preuves financieres.

### 17.4 Preuves attendues

Pour chaque scenario:

- `runId`;
- `orderId`;
- `paymentIntentId`;
- compte Stripe;
- `schemaVersion`, `stateVersion` et version de politique;
- montant/devise;
- etats paiement, inventory et fulfillment;
- mouvements de reservation;
- evenements d'audit;
- preuve e-mail: `effectId`, outbox ID, role destinataire, template, statut,
  providerMessageId ou decision `delivery_unknown`;
- stats: `captured/refunded/net`, devise, dates effectives et sourceVersion;
- document: `documentId`, type, hash et eligibilite;
- stock avant/apres;
- manifeste et comptages avant/apres terminalisation/cleanup.

### 17.5 Go final

La recette est concluante seulement si:

- aucun paiement Stripe reussi ne reste sans
  `payment.status=succeeded`; `status=paid` n'est que sa projection legacy;
- aucun stock n'est libere sauf apres PI `canceled` ou preuve durable qu'aucun
  appel de creation PI n'a commence; `succeeded` impose commit;
- aucune compensation ne s'applique deux fois;
- aucune mutation admin ne contourne le serveur;
- aucun test ne touche une donnee non fixture;
- le rapprochement final est vide;
- les agregats du run concordent aux faits/Stripe au centime et par devise;
- aucun document paiement n'existe avant encaissement et aucun faux
  « avoir » n'est presente;
- chaque e-mail attendu est `sent` ou porte une decision Gmail ambigue
  explicite;
- aucun incident/inbox/outbox non resolu ne reste pour le run;
- toutes les assertions ont un resultat machine non ambigu;
- le cleanup ne supprime ni commande comptable, ni preuve necessaire;
- le client authentifie, l'UID guest et l'admin voient la meme verite metier;
- le passage documentaire de `NO_GO_TRANSACTIONNEL` a `GO_SANDBOX_RECETTE`
  est un changement explicite, jamais une consequence automatique d'un run.

## 18. Hors perimetre de cette stabilisation

Restent differes, sauf demande explicite:

- domaine final et URLs live;
- Stripe/Connect live;
- DNS et e-mail Resend;
- App Check enforcement production;
- taxes et decisions comptables;
- CGV/retours juridiques;
- sauvegardes et SLO production;
- chargebacks avances au-dela du statut/alerte minimal;
- equivalence de SLA ou de support avec Shopify;
- optimisation de cout a grande echelle;
- redesign general du checkout/admin.

## 19. Definition de done du noyau

Le noyau commerce est autorise a entrer en recette humaine Gate 8 lorsque:

- toutes les gates 0A a 7B sont fermees;
- la CI contient `test:commerce` et `lint:functions`;
- les Rules interdisent les writes metier directs;
- Stripe, commande et reservation convergent sous panne/retry;
- les montants et politiques sont autoritaires cote serveur;
- refund, retour et restock sont separes;
- outbox durable, erreurs certaines rejouables, `delivery_unknown` arbitre sans
  retry automatique et stats reconstructibles depuis les faits absolus;
- migration sandbox et rollback sont prouves;
- Gate 7B isolee verte deux fois sur le release final;
- aucune dette `P0/P1` ne subsiste, sauf exception hors recette avec
  proprietaire, mitigation et echeance.

Cet etat se nomme `CORE_V2_FIXTURE_QUALIFIED`; il ne signifie pas
`v2_all`.

Le noyau sandbox est `done` seulement apres la recette Gate 8, un
rapprochement final vide, un cleanup borne et la mise a jour coordonnee de
`AGENTS.md`, `map.md` et des chapitres canoniques. Le statut ne devient pas un
GO live: Stripe live, production, fiscalite et exploitation live restent hors
perimetre.

Apres Gate 8, le statut possible est `PREPROD_TRANSACTIONAL_READY`. Le passage
a `v2_all` exige une decision d'activation et une fenetre d'observation
separees; il n'est pas implicite dans la Definition of Done fixture.

## 20. Handoff d'implementation pour le prochain agent

### 20.1 Instruction de depart

Le prochain agent commence par Gate 0A uniquement. Il ne recree pas de roadmap,
ne renomme pas `NOYAU_COMMERCE_STABILISATION.md` et ne commence pas par une
refonte UI. Avant tout patch:

1. lire `AGENTS.md`, `map.md`, ce document et les chapitres canoniques lies;
2. lancer `git status --short` et preserver tout changement utilisateur;
3. verifier les lignes de preuve du constat traite dans le code courant;
4. annoncer la gate et le critere d'acceptation vises;
5. limiter le premier changement au harnais sentinelle;
6. n'effectuer ni cloud, ni E2E, ni deploiement sans autorisation explicite.

Une gate n'est jamais marquee fermee dans la documentation avant que ses
commandes de validation existent, aient ete executees et que leur sortie soit
non ambigue.

Gate 0A et le hard-stop Gate 0B forment la premiere livraison. Si le sandbox
peut encore accepter un paiement, ne pas deployer/laisser Gate 0A seule: cabler
immediatement le controle off et l'UI maintenance, puis terminer les preuves.

### 20.2 Cinq premieres implementations strictement ordonnees

#### Implementation 1 - Gate 0A, runner et lint reel

Fichiers principaux:

- `package.json`, `functions/package.json`;
- `eslint.config.mjs`;
- `.github/workflows/quality.yml`;
- `tests/commerce/**`.

Resultat attendu: scripts de la Gate 0A, self-test du runner, comptage des effets
et CI rouge sur assertion fausse. Aucun comportement runtime ne change; ce lot
n'est pas deploye seul.

#### Implementation 2 - Gate 0B, confinement serveur et UI read-only

Fichiers principaux:

- `functions/src/commerce/createOrder.js`;
- `functions/src/commerce/cancelOrder.js`;
- `functions/src/commerce/cleanupPendingPayments.js`;
- `functions/src/commerce/stripeWebhook.js`;
- `functions/src/commerce/refundOrder.js`;
- `functions/src/maintenance/tools.js`;
- `functions/index.js`;
- `src/kit/commerce/CheckoutView.jsx`;
- `src/kit/commerce/CheckoutStripeModal.jsx`;
- `app/admin/AdminAppIsland.jsx`;
- `src/kit/admin/AdminForm.jsx`;
- `src/kit/admin/AdminOrders.jsx`;
- `src/kit/admin/AdminReturns.jsx`;
- `src/kit/admin/AdminLivraison.jsx`;
- `src/kit/admin/AdminPaymentSettings.jsx`;
- `src/kit/admin/AdminDashboard.jsx`;
- `src/kit/commerce/MyOrdersView.jsx`;
- `firestore.rules`, `storage.rules`.

Resultat attendu: controle absent = off, aucune nouvelle transaction legacy,
release uniquement apres PI canceled/absence durable de PI, six maintenances
refusees, writers commerce/policy/media read-only, reprise des webhooks bloques
et tests de confinement verts. Le succes des PI deja ouverts reste drainable.

Sous-lots de la meme Gate 0B:

1. controle off, creation coupee et lease webhook;
2. cancel/cleanup/refund/maintenances neutralises;
3. UI read-only, facture/KPI masques, puis Rules fermees apres observation.

#### Implementation 3 - Gate 1, noyau pur et compatibilite

Cible de modules:

```text
functions/src/commerce/domain/
  orderState.js
  money.js
  inventoryInvariants.js
  legacyProjection.js
  policy.js
  idempotency.js

tests/commerce/
  domain/
  faults/
  rules/
  fixtures/

src/kit/commerce/
  checkoutController.js
  orderAdapter.js
  checkoutRecovery.js
```

Resultat attendu: schema/reducer/projection testables, barrières v1/v2,
failpoints, fences `orderEmails/orderStats` et reducer frontend derriere flag.
Ne pas brancher le writer v2.

#### Implementation 4 - Gate 2, politique et reservations

Fichiers principaux ou nouveaux modules:

- politique/controle commerce serveur;
- validation livraison et montants;
- `stripeConnect.js`;
- repository de reservations/mouvements;
- `firestore.rules` et `firestore.indexes.json`;
- tests concurrence et Rules.

Resultat attendu: holds quantitatifs exactement une fois et compte Connect
epingle. Le mode runtime reste `off`.

#### Implementation 5 - Gate 3, saga PI et inbox

Fichiers principaux ou nouveaux modules:

- `createCheckout.js`, `checkoutSaga.js`;
- `requestOrderCancellation.js`;
- `webhookInbox.js`, endpoint Stripe et worker;
- `reconcileCommerceOrder.js`, expiration bornee;
- `resumeCheckout.js`, projection de statut;
- tokens de reprise guest;
- faits financiers et intention outbox atomiques;
- `functions/index.js`;
- suites de failpoints.

Resultat attendu: les scenarios NC-001, NC-002, NC-006 et NC-007 convergent
sous crash/retry. Le checkout public n'est toujours pas active.

### 20.3 Regles de lotissement

- une implementation peut contenir plusieurs commits locaux, mais une seule
  gate de comportement par PR;
- ne pas melanger decomposition cosmetique des gros composants et invariants
  transactionnels;
- chaque nouvelle collection recoit Rules, retention, tests et matrice de
  requetes; un composite est ajoute seulement si la requete l'exige;
- chaque export Function met a jour `functions/index.js`, `map.md` et le
  chapitre canonique;
- toute activation runtime, migration ou Rules restrictive suit l'ordre des
  sections 13 a 15;
- un rollback coupe les creations et conserve le drainage, jamais l'inverse.

### 20.4 Conditions d'arret immediat

Arreter le lot et conserver `NO_GO_TRANSACTIONNEL` si:

- le runner peut encore sortir `0` avec une assertion fausse/incomplete;
- une commande v2 peut etre lue ou mutee par un handler v1;
- une erreur Stripe indeterminee declenche une liberation;
- une Rule necessaire ne peut pas etre testee sans rouvrir un write SDK;
- un writer SDK commerce, policy ou media subsiste apres Gate 0B;
- un backfill propose de deduire le stock depuis `stockBefore` ou `buyerId`;
- un test heberge ne peut pas prouver projet, `livemode`, fixture et IDs;
- un rollback exigerait de reactiver `createOrder` pour une commande v2;
- une adoption legacy est proposee avant la preuve fixture;
- pour migration, activation ou test heberge, l'etat cloud necessaire n'est pas
  connu ou l'autorisation manque; cela ne bloque pas les modules/tests locaux.

## 21. Etat de passation documentaire au 2026-07-26

Les modifications commerce du worktree forment un ensemble coherent:

- `AGENTS.md` porte `STABILISATION_ACTIVE`, `NO_GO_TRANSACTIONNEL` et la
  prochaine Gate 0A;
- `_DOCS/README.md` enregistre ce plan temporaire, son echeance et sa condition
  de suppression;
- `COMMERCE_STRIPE.md` separe l'etat executable actuel des invariants cibles;
- `BACKOFFICE.md` documente les writers directs, les six maintenances a
  neutraliser et la periode read-only;
- `ESPACE_CLIENT.md` reclasse les PDF comme provisoires et bloque la recette
  transactionnelle avant Gate 8;
- `QUALITE_TESTS.md` met les anciens E2E en quarantaine et fixe le harnais
  anti-faux-vert;
- `map.md` cartographie le moteur actuel, la cible additive et l'ordre des gates.

La modification simultanee de `_DOCS/ux/INTERFACE_NAVIGATION.md` est un chantier
UX distinct. Elle correspond aux changements executables presents dans
`ProductReturnRestoreIsland`, `ProductDetailShellIsland`,
`CatalogVersionSyncIsland` et `GalleryMobileShellIsland`, ainsi qu'aux nouvelles
assertions du contrat mobile. Elle n'ouvre, ne ferme et ne reordonne aucune gate
commerce; elle a ete preservee sans modification dans cette passe.

Points de passation Git:

- ce document est actuellement non suivi (`??`); il doit rester visible dans
  `git status --short` jusqu'a une prise en charge volontaire;
- aucun changement executable du worktree ne prouve qu'une gate commerce est
  implementee;
- aucun commit, push, deploiement, migration ou appel cloud n'a ete effectue
  pendant la stabilisation documentaire;
- le prochain agent doit recontroler le status et isoler son lot Gate 0A sans
  ecraser les changements UX presents.

### 21.1 Validations de cette passation

Executees localement, sans mutation de donnees:

- bornes de 72 references `fichier:ligne` sur 28 fichiers: OK;
- presence des 40 liens Markdown locaux des documents touches: OK;
- matrice NC-001 a NC-022: une ligne et une fiche detaillee par ID;
- ordre des headings de gates:
  `0A -> 0B -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7A -> 7B -> 8`;
- `git diff --check`: OK sur les fichiers suivis;
- espaces finaux, fences de code et marqueurs de conflit du plan non suivi: OK;
- contrat mobile execute directement avec le runtime Node local: 20 assertions
  OK, ce qui confirme la coherence du diff UX distinct.

La commande enveloppe `npm run mobile:contract` n'a pas pu demarrer car `npm`
n'est pas expose dans le PATH de ce terminal; le script Node equivalent a bien
ete execute et est vert.

Non executees, car hors passation documentaire ou interdites sans autorisation:

- lint global, build et tests applicatifs;
- futures suites `test:commerce:*`, qui n'existent pas encore;
- Emulator Suite;
- E2E Stripe/Firebase sandbox;
- lecture/ecriture cloud, migration ou deploiement;
- recette avec comptes client/admin.
