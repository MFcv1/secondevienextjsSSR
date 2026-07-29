# Commerce, checkout et Stripe

Derniere mise a jour: 2026-07-29
Statut: `PREPROD_TRANSACTIONAL_READY`

Restriction active:

> Les Gates 0A a 8 sont fermees en sandbox depuis le 2026-07-28. La recette
> humaine Gate 8 a qualifie paiement accepte, refus/retry, 3DS, reprise,
> annulation provider-first, concurrence stock, commandes client, fulfillment,
> refund, retour/restock, suspension de policy, e-mails, documents et
> rapprochement. Le statut `PREPROD_TRANSACTIONAL_READY` reste strictement
> borne au sandbox et aux fixtures. L'UI fixture est refermee, les mutations
> admin sont `read_only`, le paiement offline est `off`; ni `v2_all`, ni Stripe
> live, ni un rail production ne sont autorises.

## 1. Perimetre

Le tunnel couvre panier, verification e-mail, reservation stock, paiement
Stripe, confirmation par webhook, espace client, annulation admissible,
remboursement admin, retour/inspection et disposition eventuelle du stock.

Invariant actif: le navigateur orchestre seulement l'UX; Cloud Functions et
Stripe sont autoritaires pour prix, stock et paiement. Les mutations legacy
restent coupees avant effet; leurs readers et webhooks ne servent qu'au
drainage et a la compatibilite read-only.

## 2. Flux d'achat

```text
produit achetable
  -> panier local/Firestore
  -> /checkout dynamique
  -> connexion ou OTP invite
  -> snapshot panier verrouille
  -> createCheckoutV2
  -> transaction commande v2 + reservations quantitatives
  -> Payment Element
  -> Stripe PaymentIntent
  -> webhook signe
  -> order paid
  -> UI de confirmation durable
  -> e-mails + espace client + admin
```

Le flux ci-dessus decrit le runtime v2 qualifie sur fixtures. `createOrder`
legacy reste confine avant Stripe, rate limit, commande ou reservation. Hors
fenetre explicitement autorisee, le flag UI fixture reste ferme.

## 3. Panier et checkout

Composants principaux:

- `CartSidebar` pour le panneau;
- `guestCart.js` pour la persistance visiteur et l'handoff;
- `CheckoutView` pour adresse, livraison et creation de commande;
- `CheckoutStripeModal` pour l'ecran Stripe plein viewport et le suivi durable
  de commande;
- `CheckoutPaymentStep` pour Stripe Elements.

Pendant le paiement, le recap utilise un snapshot du panier. Une reservation stock ne doit pas faire disparaitre visuellement les articles ou modifier le total deja presente.

Quitter l'ecran Stripe ne libere pas le hold et ne remet pas le controller a
`idle`. L'interface conserve localement la session quand le document reste
monte et propose une reprise du meme paiement. Apres reload, elle relit le
descriptor sans secret lie a l'UID Firebase, appelle `resumeCheckoutV2` et
recupere un nouveau `clientSecret` et le total serveur pour le meme
PaymentIntent. Cette detection precede la garde panier vide: le formulaire et
le panier reinitialises ne sont pas une condition de reprise et aucun nouveau
`START`/checkout n'est emis.

## 4. Stock et idempotence

Le runtime v2 agrege les lignes par `inventoryKey`, reserve les quantites dans
une transaction et conserve un mouvement deterministe par effet. La creation
du PaymentIntent reutilise une cle d'idempotence derivee de l'operation. Les
anciens chemins bases sur `stockBefore`, `buyerId` ou une restauration directe
restent confines.

Invariants actifs:

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

Le scheduler legacy `cleanupPendingPayments`, neutralise depuis la Gate 0B, a
ete retire du code et du sandbox le 2026-07-29 apres sept jours sans autre
activite `us-central1` que ses propres executions inutiles. La convergence des
PI existants passe par les webhooks signes; un echec reessayable conserve la
commande et le hold.

## 5. Statuts et axes v2

| Statut | Sens |
| --- | --- |
| `pending_payment` | commande et stock reserves, paiement non confirme |
| `paid` | paiement confirme durablement |
| `payment_failed` | etat historique; le webhook Gate 0B reprojette un refus reessayable en `pending_payment` et conserve le hold |
| `canceled` | signal terminal autoritaire permettant une liberation bornee |
| `refund_pending` | remboursement cree, attente Stripe |
| `refunded` | remboursement confirme; aucune remise en vente automatique, disposition physique requise |
| `refund_failed` | intervention ou nouvelle synchronisation requise |

Le schema v2 separe `checkout`, `payment`, `fulfillment/custody`, la projection
`inventorySummary`, les demandes de refund et les dossiers de retour. Refund
et retour ne deviennent pas des statuts de paiement/fulfillment. Le champ
legacy `status` reste une projection ecrite atomiquement pour compatibilite,
jamais une source de verite v2.

## 6. Webhooks

`stripeWebhookV2` et `stripeConnectWebhookV2` verifient la signature Stripe.
Le handler:

- utiliser le secret de l'environnement correspondant;
- traiter l'evenement de facon idempotente;
- verifier la concordance `orderId`, PaymentIntent, montant, devise et compte Connect;
- journaliser un rejet sans exposer de secret;
- repondre assez vite et decoupler les effets secondaires non critiques si necessaire.

Evenements principaux: succes/echec/annulation PaymentIntent et creation/mise a jour/echec de refund, avec `charge.refunded` comme signal complementaire.

Historique du confinement Gate 0B:

- un marqueur `processing` possede une lease expiree recuperable et un token de
  fencing pour succes comme echec;
- un paiement reussi sans commande conserve un incident `requiresReview` dans
  le marqueur;
- le succes PaymentIntent reste drainable et un refus reessayable ne libere
  rien;
- la creation de commande depuis `checkout.session.completed` est retiree;
- le reducer monotone commun et l'inbox durable ont ete ajoutes en Gates 1 et
  3.

## 7. Remboursements

`refundOrderAdmin` legacy est neutralise avant authentification, lecture ou
appel Stripe. Les commandes v2 separent refund financier, retour physique,
inspection et disposition de stock. Un refund confirme ne modifie jamais seul
le stock.

Le back-office `AdminReturns` et les callables v2 fournissent:

- liste des commandes remboursables;
- confirmation explicite;
- remboursement v2 idempotent sous controle serveur;
- synchronisation Stripe;
- e-mail client;
- preuve du refund et de la restauration.

Les Rules Gate 0B interdisent creation, mise a jour et suppression SDK de
`orders`, y compris a un admin fort, tout en conservant les lectures legitimes.
Les commandes serveur n'exposent que les actions admissibles derivees de
l'etat v2 et de l'acteur.

## 8. Stripe Connect

Stripe Connect sandbox a ete qualifie en Gates 7B/8, y compris le routage
historique epingle et le webhook v2 en `europe-west1`.
`AdminPaymentSettings` reste une surface de pilotage, pas la source
financiere. Connect Live et ses responsabilites d'exploitation restent
distincts et non qualifies.

Avant production:

- creer/valider le compte live de la cliente;
- terminer KYC et capabilities;
- choisir clairement destination charges/frais/transferts;
- creer les secrets et endpoints webhook live;
- effectuer un petit paiement puis remboursement reel;
- documenter rapprochement, litiges et responsabilite des frais.

## 9. E-mails transactionnels

Les evenements commande et remboursement passent par `functions/src/email/transactionalEmail.js`. Gmail reste actif pour la demonstration; Resend est code mais inactif jusqu'au domaine expediteur valide. Voir `../security/AUTHENTIFICATION.md` et `../infra/INFRASTRUCTURE.md`.

Un echec e-mail n'inverse jamais un paiement confirme. L'outbox durable rend
l'effet metier reprenable, mais Gmail SMTP n'applique pas la cle d'idempotence
transmise et ne peut pas garantir
exactement-un envoi si l'accuse est perdu apres acceptation: cet etat devient
`delivery_unknown` sans retry automatique. Une garantie fournisseur plus forte
attend Resend ou un provider avec idempotence effective.

## 10. Preuves sandbox historiques et qualification

Des executions historiques ont observe:

- paiement carte nominal jusqu'a `paid`;
- signature webhook;
- remboursement et visibilite Stripe;
- parcours Connect sandbox.

Ces executions historiques ne sont pas des gates de release actuelles. Les
anciens scripts restent en quarantaine parce qu'ils peuvent utiliser un produit
reel, correler la derniere commande par e-mail ou finir sur une preuve
incomplete. Les Gates 7B/8 les ont remplaces par des runs fail-closed,
run-scoped et correles.

L'architecture PaymentIntent est le choix qualifie; aucune migration vers
Checkout Sessions n'est recommandee.

Gate 7A a ferme les projections/exploitation et Gate 7B a qualifie le
manifeste `release_gate7a_c5259a87f875_f00378380561`. Les deux runs
consecutifs, 11 scenarios chacun, sont verts sur le meme SHA `c5259a8` avec
fixtures et IDs correles. Gate 8 a ensuite ferme la recette humaine sur le
release `release_gate7a_27dda7ebd409_3b1c4e7b0ade`.

Preuves Gate 8:

- paiement carte accepte, refus puis retry sur le meme order/PI et challenge
  3DS complete avec reprise durable;
- annulation explicite provider-first et concurrence deux onglets sur stock 1,
  sans survente ni panier concurrent perdu;
- commande authentifiee et verification OTP invite, suivi et documents
  sandbox admissibles;
- fulfillment prepare/expedie/livre, transition interdite refusee, refunds
  avant et apres livraison, retour physique puis restock;
- policy suspendue refusee a zero commande/stock, puis reactivatee;
- 3 captures et 2 refunds de 1 200 centimes EUR correles, cinq e-mails `sent`
  avec identifiant fournisseur, recus et confirmations de remboursement
  immuables `non_fiscal_sandbox`;
- projection finale sans divergence, operations `healthy`, tous les compteurs
  a zero, aucun hold ni incident ouvert;
- cleanup borne des runs `run_gate8_recipe_v4_20260728` et
  `run_gate8_recipe_v5_20260728`: 10 auxiliaires quarantaines, 41 preuves
  preservees, aucune suppression;
- fenetre fermee a la revision de controle 22, mutations admin revenues en
  `read_only`, puis flag UI fixture compile a `false`.

Recette catalogue reel bornee du 2026-07-29:

- ouverture explicite du run `run_v2all_20260729_loa_orders_retry5` avec cinq
  produits publies exacts, Stripe test et policy UI temporaire;
- commande 10 EUR confirmee dans le Payment Element visible;
- commande 80 EUR capturee puis refund Stripe complet `succeeded`;
- commande 400 EUR avec trois lignes, creee et reservee par l'UI, puis
  confirmee sur son PaymentIntent exact apres un blocage de reprise de modale;
- les cinq reservations ont converge vers `committed`, les cinq stocks vers
  zero et le remboursement n'a cree aucun mouvement de restock;
- trois inbox `payment_intent.succeeded` sont `processed`, les quatre outbox
  paiement/remboursement sont `sent`, les quatre faits financiers sont
  correles et aucun incident n'est ouvert;
- fermeture fail-closed a la revision 32, retour a `v2_fixture`, mutations
  admin `read_only`, policy fixture restauree et flag UI v2 compile a `false`.

Cette recette a trouve deux contrats frontend a reprendre: la fermeture de la
modale apres creation ne reutilise pas correctement le PaymentIntent en
`awaiting_method`. La reprise UX du 2026-07-29 adapte desormais
les timestamps callable de `/mes-commandes`, joint les documents immuables
aux commandes client et normalise les projections v2 de Retours avant filtrage.
Les limites restantes autour du telephone, des images d'items v2 et de la
reprise de paiement n'affectent ni la capture, ni les mouvements, ni les
preuves financieres durables; elles sont suivies dans
`COMMERCE_REPRISE.md`.

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
functions/src/commerce/refundOrder.js
functions/src/commerce/orderStatus.js
src/kit/admin/AdminOrders.jsx
src/kit/admin/AdminReturns.jsx
src/kit/admin/AdminPaymentSettings.jsx
scripts/commerce-v2-all-window.mjs
scripts/confirm-commerce-order-v2.mjs
scripts/refund-commerce-order-v2.mjs
scripts/cleanup-paid-order-cart-v2.mjs
scripts/inspect-commerce-orders-v2.mjs
scripts/audit-commerce-orders-v2.mjs
```

## 12. Gates

```bash
npm run e2e:hosted-stripe
npm run e2e:refund-stripe
pnpm maintenance:audit
```

Ces commandes touchent des services externes et creent des donnees sandbox.
`e2e:hosted-stripe` et `e2e:refund-stripe` actuels sont en quarantaine
`DO_NOT_RUN`: ils ne constituent ni gate, ni outil diagnostique sur une donnee
reelle. Le runner qualifiant est `commerce:e2e:gate7b`; il exige fixture,
`runId/orderId`, release, cible, AAL2/App Check, confirmation exacte et zero
fallback.

Les gates locales et CI actives sont `lint:functions`,
`test:commerce:runner`, `test:commerce:containment`,
`test:commerce:rules:containment`, `test:commerce:unit`,
`test:commerce:property`, `test:commerce:firebase`,
`test:commerce:rules`, `test:commerce:faults` et leur agregat
`test:commerce`. Gates 0A a 8 sont fermees et les anciens E2E transactionnels
heberges restent en quarantaine. Les rapports Gate 7B sont lies aux runs
`run_gate7b_1_1785265815207` et `run_gate7b_2_1785265899510`; les preuves
humaines finales sont correlees aux runs Gate 8 v4/v5 listes ci-dessus.

Gate 6 ajoute `classify-legacy-commerce.mjs`,
`prepare-commerce-fixtures.mjs`, les contrats purs
`legacyClassification.js`/`fixtureScope.js` et 9 tests dedies. Le dry-run final
est reproductible: 26 legacy, 26 `needs_review`, 10 non terminales et zero
ligne non classee. Le scope `fixture_gate6_20260728` contient uniquement un UID
technique et trois inventoryKeys de produits `e2eOnly` stock 1/2/10. Le
controle serveur est explicite. Gate 7A l'a fait passer a
`newCheckoutMode=v2_fixture` sur le seul scope epingle.

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

Etat historique a la fermeture Gate 3: deploiement sandbox en mode `off`. Le runtime v2 couvre le repository
commande/hold/tentative, `createCheckout`/`resumeCheckout`, la meme cle Stripe
sous retry, l'annulation provider-first, le reconciler de tous les statuts PI,
l'ingress signee plateforme/Connect, l'inbox a lease/fencing, les workers et
sweepers bornes, l'expiration, le fait financier et l'outbox atomiques, ainsi
que le token guest backend opaque, mono-usage et rotatif. Les callables
Gate 4/5 importent ce runtime, mais aucun worker/scheduler n'est exporte et le
controle absent refusait checkout et mutations avant les activations bornees
des Gates suivantes.

Etat historique a la fermeture Gate 4: `SANDBOX_ACTIVE_OFF`.
`allowedActions` est derive exclusivement du
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
conditionne par `adminMutationMode=v2` interdisent toute mutation dans l'etat
sandbox courant. Le transport
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
annulation, refund et retour sont compilees mais ne sont exposees par
`AdminAppIsland` que lorsque le control plane autorise `adminMutationMode=v2`;
le flag public checkout ne pilote plus les commandes admin. Livraison et Paiement
n'ecrivent plus directement les champs commerce. Ces actions ont ensuite ete
ouvertes uniquement pendant la fenetre Gate 8, puis refermees.

Gate 5 est `SANDBOX_ACTIVE_READ_ONLY`. Le transport fournit
`createCheckoutV2`, `resumeCheckoutV2` et des lecteurs commandes/retours
pagines par UID ou admin fort. Cote navigateur, un controller unique suit
`stateVersion`; la reprise 3DS/reload est lue avant les gardes panier,
namespacee par UID et ne persiste aucun secret. Les paniers local et Firestore
portent `cartLineId/cartRevision`; le succes exige
`payment.status=succeeded`, s'affiche avant nettoyage et ne supprime que les
lignes achetees demeurees identiques. `MyOrdersView` utilise le reader UID et
sa pagination; les readers commandes et retours admin sont egalement actifs,
avec un adaptateur v1 explicitement read-only. Les transports Gate 5 restent
exportes. Le controle serveur reste borne a `newCheckoutMode=v2_fixture` pour
le scope epingle; tous les flags de commande publics sont revenus a `false`,
les mutations admin restent `read_only` cote serveur et le paiement offline
est `off`.

Gate 7A ajoute les projections financieres absolues, les recus sandbox
explicitement non fiscaux, l'outbox avec leases/dead-letter et statut
`delivery_unknown`, le dispatcher et le reconciler planifies, les commandes
admin de statut/rebuild/cleanup ainsi que les incidents durables. Le dashboard
lit cette projection serveur et affiche les montants captures, rembourses et
nets sans convertir un chargement ou une erreur en zero financier. La sante sandbox est `healthy`, tous les
compteurs sont a zero et aucune TTL commerce n'est activee.

Gate 8 a execute la matrice client/admin complete sur fixtures sandbox. Un
defaut reel du contrat d'annulation client (`cancellationRequestId` au lieu de
`commandId`) a ete corrige et couvert par regression avant reprise de la
recette. L'endpoint Stripe Connect sandbox actif cible maintenant
`stripeConnectWebhookV2` en `europe-west1`; les evenements sont signes,
persistes et rapproches par le runtime v2. La fermeture ne supprime aucune
commande, aucun fait financier, aucun audit ni document.

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
