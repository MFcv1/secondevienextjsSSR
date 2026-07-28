# Commerce, checkout et Stripe

Derniere mise a jour: 2026-07-28
Statut: `STABILISATION_ACTIVE`

Restriction active:

> Decision `NO_GO_TRANSACTIONNEL`. Le parcours nominal carte est implemente,
> mais le noyau n'est pas qualifie pour une recette transactionnelle. L'audit
> executable a invalide le precedent statut `PREPROD_READY` sur les courses
> paiement/annulation, les compensations stock, les mutations admin et les
> preuves automatisees. Le plan ferme est
> [NOYAU_COMMERCE_STABILISATION.md](NOYAU_COMMERCE_STABILISATION.md).
> Les Gates 0A a 5 sont `SANDBOX_ACTIVE_READ_ONLY` depuis le 2026-07-28:
> le confinement legacy, les indexes et les Rules sont actifs; 24 Functions v2
> sont exportees avec App Check. Les lecteurs UID/admin sont actifs, mais le
> checkout, toutes les mutations et les workers v2 restent `off` par flags et
> controle serveur fail-closed. Ce statut ne vaut pas recette transactionnelle.

## 1. Perimetre

Le tunnel couvre panier, verification e-mail, reservation stock, paiement
Stripe, confirmation par webhook, espace client, annulation admissible,
remboursement admin, retour/inspection et disposition eventuelle du stock.

Invariant cible: le navigateur orchestre seulement l'UX; Cloud Functions et
Stripe sont autoritaires pour prix, stock et paiement. Le code Gate 0B coupe le
checkout et les mutations legacy avant effet; les anciens readers et webhooks
restent disponibles uniquement pour le drainage.

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

Le flux ci-dessus decrit le legacy conserve en source pour drainage et reprise.
Dans le worktree Gate 0B, `createOrder` refuse avant Stripe, rate limit,
idempotence, commande ou reservation, et `CheckoutView` affiche la maintenance.

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

`cleanupPendingPayments` est neutralise avant toute lecture/ecriture. La
convergence des PI existants passe par les webhooks signes; un echec reessayable
conserve la commande et le hold.

## 5. Statuts actuels et cible

| Statut | Sens |
| --- | --- |
| `pending_payment` | commande et stock reserves, paiement non confirme |
| `paid` | paiement confirme durablement |
| `payment_failed` | etat historique; le webhook Gate 0B reprojette un refus reessayable en `pending_payment` et conserve le hold |
| `canceled` | signal terminal autoritaire permettant une liberation bornee |
| `refund_pending` | remboursement cree, attente Stripe |
| `refunded` | remboursement confirme; aucune remise en vente automatique, disposition physique requise |
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

Etat Gate 0B:

- un marqueur `processing` possede une lease expiree recuperable et un token de
  fencing pour succes comme echec;
- un paiement reussi sans commande conserve un incident `requiresReview` dans
  le marqueur;
- le succes PaymentIntent reste drainable et un refus reessayable ne libere
  rien;
- la creation de commande depuis `checkout.session.completed` est retiree;
- le reducer monotone commun et l'inbox durable arrivent en Gates 1 et 3.

## 7. Remboursements

`refundOrderAdmin` legacy est neutralise avant authentification, lecture ou appel
Stripe. `syncRefundStatusAdmin` et les webhooks peuvent encore rapprocher un
refund deja ouvert, sans modifier le stock. Le moteur cible separe refund
financier, retour physique, inspection et disposition de stock.

Le back-office `AdminReturns` fournit:

- liste des commandes remboursables;
- confirmation explicite;
- remboursement legacy desactive;
- synchronisation Stripe;
- e-mail client;
- preuve du refund et de la restauration.

Les Rules Gate 0B interdisent creation, mise a jour et suppression SDK de
`orders`, y compris a un admin fort, tout en conservant les lectures legitimes.
Les futures commandes serveur restaureront uniquement les actions admissibles.

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
functions/src/commerce/legacyContainment.js
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

Les gates locales et CI actives sont `lint:functions`,
`test:commerce:runner`, `test:commerce:containment`,
`test:commerce:rules:containment`, `test:commerce:unit`,
`test:commerce:property`, `test:commerce:firebase`,
`test:commerce:rules`, `test:commerce:faults` et leur agregat
`test:commerce`. Gates 0A a 5 sont `SANDBOX_ACTIVE_READ_ONLY`; les E2E
transactionnels heberges restent en quarantaine.

Gate 1 ajoute `functions/src/commerce/domain`: schema v2, reducer pur,
invariants monétaires/quantitatifs, projection legacy, controle fail-closed,
idempotence, dependances injectables et failpoints. `orderStatus` adapte v1/v2;
les handlers et triggers legacy sont fences contre v2. Aucun de ces modules ne
cree une commande v2 ni n'appelle Stripe.

Gate 2 ajoute les contrats purs `checkoutInput`, `inventoryKey`,
`connectPolicy` et `reservationRepository`. La policy calcule les frais de
livraison en centimes et epingle sa version et le compte Connect. Le repository
transactionnel applique des deltas quantitatifs idempotents et conserve un
mouvement par effet. Il est embarque par les callables v2, mais le controle
reste `off`.

Gate 3 est deployee en sandbox en mode `off`. Le runtime v2 couvre le repository
commande/hold/tentative, `createCheckout`/`resumeCheckout`, la meme cle Stripe
sous retry, l'annulation provider-first, le reconciler de tous les statuts PI,
l'ingress signee plateforme/Connect, l'inbox a lease/fencing, les workers et
sweepers bornes, l'expiration, le fait financier et l'outbox atomiques, ainsi
que le token guest backend opaque, mono-usage et rotatif. Les callables
Gate 4/5 importent ce runtime, mais aucun worker/scheduler n'est exporte et le
controle absent refuse checkout et mutations: aucune recette transactionnelle.

Gate 4 est `SANDBOX_ACTIVE_OFF`: `allowedActions` est derive exclusivement du
schema v2 et de l'acteur/AAL2. Les commandes fulfillment sont idempotentes et
auditees; la saga refund conserve une cle Stripe par `refundRequestId`, epingle
le compte Connect historique, cumule les montants dans une transaction avec
fait/outbox et ne touche jamais au stock. Les retours bornent les allocations
concurrentes par ligne, puis appliquent reception, restock et write-off dans
les memes transactions que commande, reservation, produit, mouvement et audit.
L'annulation provider-first possede maintenant un audit convergent. Le rail
produit separe creation en brouillon, offre/prix, stock versionne, publication
et archive souple; il refuse les collections non autorisees et conserve un
audit par commande. Le transport callable est exporte avec App Check et verrou
serveur; le cablage admin produit reste sous un flag compile a `false`.
Le transport callable fulfillment/archive commande est egalement prepare avec
App Check, registre admin actif et AAL2 recent; son acteur est derive du
contexte Auth; il est exporte mais son verrou serveur et son branchement UI
compile a `false` interdisent toute mutation. Le transport
d'annulation client provider-first est prepare avec App Check et secret Stripe;
le proprietaire vient exclusivement du contexte Auth et le runtime minimal ne
branche que la coordination d'annulation. Il est exporte, verrouille `off` et
sans affordance UI. Le
transport refund admin est egalement prepare avec App Check, secret Stripe,
registre admin actif et AAL2 recent; il derive l'acteur du contexte Auth et
branche un runtime minimal sur la saga refund reprenable. Il est exporte,
verrouille `off` et sans UI. Les transports retour admin sont prepares sous
App Check, registre
admin actif et AAL2 recent: ouverture, annulation, reception, restock,
write-off et resolution sont des commandes fermees, versionnees et
quantitatives, avec acteur derive du contexte Auth et runtime minimal. Ils
sont exportes mais bloques par le controle serveur. Les interfaces fulfillment,
annulation, refund et retour sont branchees derriere des flags compiles a
`false`; Livraison et Paiement
n'ecrivent plus directement les champs commerce. Aucune action Gate 4 n'est
active.

Gate 5 est `SANDBOX_ACTIVE_READ_ONLY`. Le transport fournit
`createCheckoutV2`, `resumeCheckoutV2` et des lecteurs commandes/retours
pagines par UID ou admin fort. Cote navigateur, un controller unique suit
`stateVersion`; la reprise 3DS/reload est lue avant les gardes panier,
namespacee par UID et ne persiste aucun secret. Les paniers local et Firestore
portent `cartLineId/cartRevision`; le succes exige
`payment.status=succeeded`, s'affiche avant nettoyage et ne supprime que les
lignes achetees demeurees identiques. `MyOrdersView` utilise le reader UID et
sa pagination; les readers commandes et retours admin sont egalement actifs,
avec un adaptateur v1 explicitement read-only. Les 24 transports sont exportes,
mais le flag checkout et tous les flags de commande restent `false`; le
document de controle absent verrouille aussi les mutations cote serveur.
Rollout actif: `build-2026-07-28-001`.

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
