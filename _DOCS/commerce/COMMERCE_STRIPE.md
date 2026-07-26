# Commerce, checkout et Stripe

Derniere mise a jour: 2026-07-26
Statut: `STABILISATION_ACTIVE`

Restriction active:

> Decision `NO_GO_TRANSACTIONNEL`. Le parcours nominal carte est implemente,
> mais le noyau n'est pas qualifie pour une recette transactionnelle. L'audit
> executable a invalide le precedent statut `PREPROD_READY` sur les courses
> paiement/annulation, les compensations stock, les mutations admin et les
> preuves automatisees. Le plan ferme est
> [NOYAU_COMMERCE_STABILISATION.md](NOYAU_COMMERCE_STABILISATION.md).

## 1. Perimetre

Le tunnel couvre panier, verification e-mail, reservation stock, paiement
Stripe, confirmation par webhook, espace client, annulation admissible,
remboursement admin, retour/inspection et disposition eventuelle du stock.

Invariant cible: le navigateur orchestre seulement l'UX; Cloud Functions et
Stripe sont autoritaires pour prix, stock et paiement. Le checkout nominal
revalide deja prix et reservation initiale au serveur, mais les mutations admin
et compensations legacy contournent encore partiellement cet invariant jusqu'a
Gate 0B.

## 2. Flux d'achat

```text
produit achetable
  -> panier local/Firestore
  -> /checkout dynamique
  -> connexion ou OTP invite
  -> snapshot panier verrouille
  -> createOrder
  -> transaction stock + order pending_payment
  -> Payment Element
  -> Stripe PaymentIntent
  -> webhook signe
  -> order paid
  -> UI de confirmation durable
  -> e-mails + espace client + admin
```

`createOrder` revalide chaque article, le prix, le stock, l'identite et l'e-mail verifie. La disponibilite affichee par le client ne suffit pas.

## 3. Panier et checkout

Composants principaux:

- `CartSidebar` pour le panneau;
- `guestCart.js` pour la persistance visiteur et l'handoff;
- `CheckoutView` pour adresse, livraison et creation de commande;
- `CheckoutStripeModal` pour le suivi durable de commande;
- `CheckoutPaymentStep` pour Stripe Elements.

Pendant le paiement, le recap utilise un snapshot du panier. Une reservation stock ne doit pas faire disparaitre visuellement les articles ou modifier le total deja presente.

## 4. Stock et idempotence

La creation de commande reserve actuellement le stock dans une transaction. Cette reservation initiale protege le chemin nominal contre une survente simple.

Les compensations ne sont pas encore fiables pour plusieurs allocations: elles melangent `stockBefore`, `buyerId`, increments et restaurations directes admin. La creation du PaymentIntent ne fournit pas non plus de cle d'idempotence Stripe. Ces points sont bloquants dans le plan de stabilisation.

Invariants cibles:

- pas de stock negatif;
- lignes d'une meme cle d'inventaire agregees avant reservation, avec snapshots
  de lignes conserves;
- pas de double commande sur une meme operation logique;
- commande, mouvement, webhook et effet secondaire possedent chacun leur cle
  d'idempotence adaptee;
- une commande `paid` ne doit jamais etre restauree comme abandonnee;
- un remboursement ne restaure qu'une quantite admissible, apres validation
  Stripe et disposition physique;
- les conflits de restauration passent en etat a verifier, pas en succes silencieux.

Le `cleanupPendingPayments` actuel ne constitue pas encore une preuve de ces invariants: il peut liberer un PI `requires_payment_method` sans l'annuler, possede un second chemin moins strict pour marquer `paid` et peut etre affame par son lot de 50 commandes.

## 5. Statuts actuels et cible

| Statut | Sens |
| --- | --- |
| `pending_payment` | commande et stock reserves, paiement non confirme |
| `paid` | paiement confirme durablement |
| `payment_failed` | etat legacy actuellement traite a tort comme terminal pour un PI reessayable |
| `canceled` | commande annulee localement; le PI n'est pas encore neutralise sur tous les chemins |
| `refund_pending` | remboursement cree, attente Stripe |
| `refunded` | remboursement confirme; le code legacy peut alors restaurer automatiquement le stock, comportement a neutraliser |
| `refund_failed` | intervention ou nouvelle synchronisation requise |

Le code actuel reutilise le meme champ `status` pour paiement, annulation,
logistique et remboursement. La cible additive separe `checkout`, `payment`,
`fulfillment/custody`, une projection `inventorySummary`, les demandes de
refund et les dossiers de retour. Refund et retour ne deviennent pas des
statuts de paiement/fulfillment. Le champ legacy reste temporairement une
projection ecrite atomiquement, jamais une source de verite v2.

## 6. Webhooks

`stripeWebhook` et `stripeConnectWebhook` verifient la signature Stripe. Le handler doit:

- utiliser le secret de l'environnement correspondant;
- traiter l'evenement de facon idempotente;
- verifier la concordance `orderId`, PaymentIntent, montant, devise et compte Connect;
- journaliser un rejet sans exposer de secret;
- repondre assez vite et decoupler les effets secondaires non critiques si necessaire.

Evenements principaux: succes/echec/annulation PaymentIntent et creation/mise a jour/echec de refund, avec `charge.refunded` comme signal complementaire.

Limites actuelles:

- un marqueur webhook reste bloque en `processing` sans lease recuperable si l'instance meurt;
- un paiement reussi sans commande est acquitte comme ignore;
- l'ordre des evenements n'est pas gere par un reducer monotone commun;
- le handler Checkout Session annonce comme retire reste executable;
- le cleanup ne reutilise pas toutes les validations du webhook.

## 7. Remboursements

`refundOrderAdmin` est une bonne base d'action metier forte. Elle cree un Refund Stripe idempotent, conserve la commande et valide PaymentIntent, devise et montant. `syncRefundStatusAdmin` relit Stripe pour recuperer un etat incomplet.

La remise en stock actuelle reste a corriger: elle utilise la photographie `stockBefore` et remet automatiquement en vente apres refund, y compris pour un bien expedie ou livre. Le moteur cible separe refund financier, retour physique, inspection et disposition de stock.

Le back-office `AdminReturns` fournit:

- liste des commandes remboursables;
- confirmation explicite;
- remboursement et remise en vente automatique actuelle, a neutraliser;
- synchronisation Stripe;
- e-mail client;
- preuve du refund et de la restauration.

L'interdiction de supprimer manuellement une commande payee est un invariant
cible. Les Rules actuelles autorisent encore a un admin fort l'ecriture et la
suppression directes de `orders`; Gate 0B les rend read-only apres neutralisation
des UI, puis les commandes serveur restaurent les actions admissibles.

## 8. Stripe Connect

Des parcours sandbox historiques ont valide Connect sur le chemin nominal. Ils ne qualifient pas l'etat actuel comme stable: `account.updated` ecrit des champs differents de ceux lus par le routage, et une reconnexion peut melanger l'etat pending et actif. `AdminPaymentSettings` reste une surface de pilotage, pas la source financiere.

Avant production:

- creer/valider le compte live de la cliente;
- terminer KYC et capabilities;
- choisir clairement destination charges/frais/transferts;
- creer les secrets et endpoints webhook live;
- effectuer un petit paiement puis remboursement reel;
- documenter rapprochement, litiges et responsabilite des frais.

## 9. E-mails transactionnels

Les evenements commande et remboursement passent par `functions/src/email/transactionalEmail.js`. Gmail reste actif pour la demonstration; Resend est code mais inactif jusqu'au domaine expediteur valide. Voir `../security/AUTHENTIFICATION.md` et `../infra/INFRASTRUCTURE.md`.

Un echec e-mail ne doit pas inverser un paiement confirme. Le code actuel
absorbe plusieurs erreurs et Gmail n'applique pas la cle d'idempotence transmise.
L'outbox rend l'effet metier rejouable, mais Gmail SMTP ne peut pas garantir
exactement-un envoi si l'accuse est perdu apres acceptation: cet etat devient
`delivery_unknown` sans retry automatique. Une garantie fournisseur plus forte
attend Resend ou un provider avec idempotence effective.

## 10. Preuves sandbox historiques et qualification

Des executions historiques ont observe:

- paiement carte nominal jusqu'a `paid`;
- signature webhook;
- remboursement et visibilite Stripe;
- parcours Connect sandbox.

Ces executions ne sont pas des gates de release actuelles. Les scripts peuvent utiliser un produit reel, correler la derniere commande par e-mail ou terminer sans rendre toute assertion bloquante. Ils ne couvrent pas refus puis retry, fermeture concurrente, PI orphelin, webhook bloque, stock partage, livraison injectee ou mutation admin.

L'architecture PaymentIntent reste le choix cible; aucune migration vers Checkout Sessions n'est recommandee. Le travail consiste a rendre l'orchestration PaymentIntent actuelle idempotente, reprenable et testee.

Gate 7A ferme les projections/exploitation. La preuve qualifiante du coeur sera
ensuite le nouvel E2E sandbox isole de la Gate 7B, vert deux fois sur le release
final avec fixtures et IDs correles, avant la recette humaine Gate 8.

## 11. Fichiers structurants

```text
src/kit/commerce/CartSidebar.jsx
src/kit/commerce/CheckoutView.jsx
src/kit/commerce/CheckoutStripeModal.jsx
src/kit/commerce/CheckoutPaymentStep.jsx
src/kit/commerce/purchasability.js
functions/src/commerce/createOrder.js
functions/src/commerce/stripeWebhook.js
functions/src/commerce/stripeConnect.js
functions/src/commerce/cancelOrder.js
functions/src/commerce/cleanupPendingPayments.js
functions/src/commerce/refundOrder.js
functions/src/commerce/orderStatus.js
src/kit/admin/AdminOrders.jsx
src/kit/admin/AdminReturns.jsx
src/kit/admin/AdminPaymentSettings.jsx
```

## 12. Gates

```bash
npm run e2e:hosted-stripe
npm run e2e:refund-stripe
pnpm maintenance:audit
```

Ces commandes touchent des services externes et creent des donnees sandbox.
`e2e:hosted-stripe` et `e2e:refund-stripe` actuels sont en quarantaine
`DO_NOT_RUN` jusqu'a leur remplacement fail-closed: ils ne constituent ni gate,
ni outil diagnostique sur une donnee reelle. Le futur runner Gate 7B exige
fixture, `runId/orderId`, cible, AAL2/App Check et zero fallback.

Les futures gates locales et CI (`test:commerce:*`, `lint:functions`) sont
definies dans le plan de stabilisation. Le prochain lot est Gate 0A
(harnais sentinelle), puis Gate 0B (confinement); aucune implementation ne doit
commencer directement par un checkout v2 actif.

## 13. Conditions production

- [ ] cles et webhooks Stripe live separes;
- [ ] compte Connect live valide;
- [ ] moyens de paiement actifs et domaines wallet explicitement verifies;
- [ ] domaine final et return URLs finales;
- [ ] CGV/retours valides juridiquement;
- [ ] taxes, frais, livraison et devise confirms par la cliente;
- [ ] paiement/remboursement live de faible montant;
- [ ] alertes webhook et rapprochement operationnel;
- [ ] moyen redirect teste seulement s'il est active commercialement.
