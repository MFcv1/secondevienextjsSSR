# Commerce, checkout et Stripe

Derniere mise a jour: 2026-08-13
Statut: `PREPROD_TRANSACTIONAL_READY`

Etat actif:

> Les Gates 0A a 8 sont fermees en sandbox depuis le 2026-07-28. La recette
> humaine Gate 8 a qualifie paiement accepte, refus/retry, 3DS, reprise,
> annulation provider-first, concurrence stock, commandes client, fulfillment,
> refund, retour/restock, suspension de policy, e-mails, documents et
> rapprochement. Le statut `PREPROD_TRANSACTIONAL_READY` reste strictement
> borne au sandbox. Depuis le 2026-08-02, `v2_all` et les mutations admin sont
> actifs pour les tests fonctionnels publication/achat. Le paiement offline
> reste `off`; Stripe live et le rail production ne sont pas autorises.

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

Le checkout visible emploie uniquement un vocabulaire client. Les notions de
projection, webhook, serveur, `PaymentIntent`, idempotence et controle plane
restent dans le code, les journaux et le back-office. L'ecran de paiement est
plein cadre sans gouttiere exterieure sur grand ecran, passe en une colonne sur
mobile et conserve une largeur de lecture bornee pour Stripe. La confirmation
finale est elle aussi un ecran plein viewport, pas une carte modale centree.

Pendant le paiement, le recap utilise un snapshot du panier. Une reservation stock ne doit pas faire disparaitre visuellement les articles ou modifier le total deja presente.

Quitter l'ecran Stripe ne libere pas le hold et ne remet pas le controller a
`idle`. L'interface conserve localement la session quand le document reste
monte et propose une reprise du meme paiement. Apres reload, elle relit le
descriptor sans secret lie a l'UID Firebase, appelle `resumeCheckoutV2` et
recupere un nouveau `clientSecret` et le total serveur pour le meme
PaymentIntent. Cette detection precede la garde panier vide: le formulaire et
le panier reinitialises ne sont pas une condition de reprise et aucun nouveau
`START`/checkout n'est emis.

Une commande deja confirmee est terminale pour la reprise. Le coordinateur
renvoie `COMMERCE_CHECKOUT_TERMINAL_PAID` avant toute restitution du
PaymentIntent. Le client supprime alors le descripteur et uniquement les lignes
achetees dont `cartLineId` et `cartRevision` correspondent, puis reconstruit un
checkout neuf pour les autres lignes. Un nouveau panier ne peut donc jamais
heriter du `clientSecret` ni du montant d'une commande payee.

Une commande encore impayee reste reprenable, mais le recapitulatif est alors
reconstruit exclusivement depuis son snapshot immuable renvoye par le serveur.
Les lignes ajoutees ensuite au panier ne remplacent jamais visuellement les
lignes associees au PaymentIntent repris; elles restent preservees pour le
checkout suivant.

### 3.1 Codes promotionnels

Le navigateur peut transmettre uniquement un code normalise et les identites
de lignes. `previewPromotionCodeV2` relit les prix autoritaires et fournit un
apercu; cet apercu n'accorde aucun droit. Lors de `createCheckoutV2`, la meme
transaction Firestore relit le code, son statut, sa periode, son audience, son
perimetre produit et ses limites, recalcule la remise, reserve une utilisation,
reserve le stock et persiste la commande. Le montant du PaymentIntent est
derive du total de cette commande, jamais d'un montant client.

`commerce_promotion_codes/{sha256(code)}` conserve la definition et les
compteurs; `customers/{sha256(uid)}` borne l'usage par compte et
`redemptions/{orderId}` lie l'utilisation a une commande. Un succes Stripe
deplace atomiquement `reserved` vers `committed`. Une annulation ou expiration
libere la reservation; un remboursement ne rend jamais le code reutilisable.
Les retries webhook sont idempotents sur le statut de redemption.

Les gains existants du jeu newsletter sont materialises vers ce meme invariant
au premier controle, puis les nouveaux gains le sont des leur reclamation. Ils
restent mono-usage, lies au hash de l'e-mail verifie et ne peuvent pas etre
appliques depuis un autre compte. Le code brut n'est pas une autorisation: seule
la validation backend dans la transaction checkout fait foi.

La requalification sandbox du 2026-08-13 a valide le cycle complet avec un
code admin produit de 10 %: 850 EUR autoritaires, 85 EUR de remise et un
PaymentIntent Stripe test de 765 EUR. L'abandon puis la reprise du meme checkout
ont conserve une seule commande et une seule reservation. Apres confirmation,
la commande est `paid`, le recu client est disponible et les compteurs passent
de `reserved=1, committed=0` a `reserved=0, committed=1`.

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

Les actions serveur de fulfillment sont suspendues lorsque
`refundAggregate.status` vaut `pending`, `needs_review` ou `full`. Elles
restent admissibles apres un remboursement `partial`, car la commande conserve
un solde paye et peut encore devoir etre remise au client. Cette interdiction
est derivee dans `computeAllowedActions` et reappliquee defensivement par la
presentation Ventes contre un cache client perime.

Un remboursement peut passer de `refund_pending` a `refunded` dans le meme
appel lorsque Stripe renvoie immediatement `succeeded`; l'etat intermediaire
n'a pas vocation a rester visible. S'il persiste (`unknown`,
`provider_pending` ou interruption avant persistance), la reprise admin relit
la derniere tentative bornee et rejoue exactement sa `refundRequestId`. La
cle Stripe idempotente reste identique: une reponse perdue ne cree donc pas un
second refund. La reprise exige un administrateur actif avec AAL2 Google ou passkey,
reste soumise au control plane `adminMutationMode=v2` et ajoute un evenement
d'audit distinct sans modifier l'auteur initial de la demande.

Le workflow client ajoute le 2026-08-01 une couche distincte
`orders/{orderId}/customer_return_requests/{requestId}`. Sa creation exige le
proprietaire Auth, App Check, une commande v2 payee et des lignes quantitatives
valides; elle ne contacte jamais Stripe et programme une notification admin
outbox. La decision admin reste forte et fail-closed. `refund_now` est admis
seulement avec une garde `merchant` et reutilise la saga refund complete. Une
demande couvrant toute la commande rembourse le solde restant; une demande
partielle rembourse le prix serveur des lignes demandees, borne par ce solde.
`authorize_return` est admis avec une garde `carrier` ou
`customer` et reutilise le dossier physique existant. Dans ce second parcours,
`refund_after_return` exige un retour `resolved`, donc des quantites recues et
entierement disposees apres inspection. Le refund conserve son identite
deterministe derivee de la demande client et ne provoque aucun restock seul.

## 6. Webhooks

`stripeWebhookV2` et `stripeConnectWebhookV2` verifient la signature Stripe.
Depuis G10, leurs owners fournisseur sont les paralleles Gen2
`stripeWebhookV2Gen2` et `stripeConnectWebhookV2Gen2`. Ils acceptent pendant la
fenetre de rollback le secret precedent et le secret G10 distinct; les quatre
Functions Gen1 et les versions de secrets precedentes sont conservees jusqu'a
G12.
Le handler:

- utiliser le secret de l'environnement correspondant;
- traiter l'evenement de facon idempotente;
- verifier la concordance `orderId`, PaymentIntent, montant, devise et compte Connect;
- journaliser un rejet sans exposer de secret;
- repondre assez vite et decoupler les effets secondaires non critiques si necessaire.

Evenements principaux: succes/echec/annulation PaymentIntent et creation/mise a jour/echec de refund, avec `charge.refunded` comme signal complementaire.

Le rail v2 ingere explicitement `refund.created`, `refund.updated` et
`refund.failed`. Le worker relit l'objet Refund autoritaire dans le compte
Connect epingle, verifie commande, tentative, montant, devise et metadata,
puis applique sous le fencing inbox la tentative, la commande, l'audit et les
deux outbox client/admin. Un echec libere le montant `pending`, place le refund
en `needs_review` lorsqu'aucun remboursement n'a reussi et ne cree aucun faux
fait financier de remboursement.

Stripe peut exceptionnellement faire evoluer un Refund du statut `succeeded`
vers `failed` (par exemple carte expiree ou annulee). Cette transition n'est
pas un conflit terminal: le worker ajoute un fait financier immuable
`refund_reversal`, compense le montant rembourse dans le rollup, conserve le
stock engage et place la commande en `needs_review`. La tentative garde le meme
ID fournisseur; aucune seconde demande de remboursement n'est creee. Les
documents deja materialises restent des preuves d'audit, mais la confirmation
de remboursement devenue fausse n'est plus projetee au client.

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

Les cinq callables de statut, onboarding, synchronisation et reconnexion
exigent App Check, admin actif et AAL2; le test de durcissement les couvre via
l'inventaire exhaustif de tous les transports callable, sans liste specifique
a Stripe Connect.

Avant production:

- creer/valider le compte live de la cliente;
- terminer KYC et capabilities;
- choisir clairement destination charges/frais/transferts;
- creer les secrets et endpoints webhook live;
- effectuer un petit paiement puis remboursement reel;
- documenter rapprochement, litiges et responsabilite des frais.

## 9. E-mails transactionnels

Les evenements commande et remboursement passent par `functions/src/email/transactionalEmail.js`. Gmail reste actif pour la demonstration; Resend est code mais inactif jusqu'au domaine expediteur valide. Voir `../security/AUTHENTIFICATION.md` et `../infra/INFRASTRUCTURE.md`.

La galerie, l'inventaire des 13 rendus et leur cycle de vie visuel sont
documentes dans
[EMAILS_TRANSACTIONNELS.md](../email/EMAILS_TRANSACTIONNELS.md).

Pour commerce v2, `commerceEmailTemplates.js` et
`emailDesignSystem.js` rendent les confirmations paiement, les transitions
d'execution et les remboursements en HTML responsive avec repli texte. Les
valeurs commande sont echappees avant insertion HTML.

Le paiement cree atomiquement deux intentions outbox distinctes:

- `order-paid` pour le client;
- `order-paid-admin` pour l'administrateur, sans copie BCC.

La notification administrateur porte les coordonnees client, l'adresse, la
methode de livraison, les lignes, le montant, le PaymentIntent Stripe et un
lien direct `/admin?order_id=...`. Le back-office ouvre alors l'onglet
commandes et deploie la commande cible.

Chaque commande v2 emet aussi un message client lors des transitions
`order-preparing`, `order-ready-for-pickup`, `order-picked-up`,
`order-shipped` et `order-delivered`. Le numero de suivi est inclus lorsqu'il
existe.

L'expedition accepte un transporteur normalise et un numero facultatif. Les
pages de suivi sont derivees cote serveur depuis une allowlist et ne proviennent
jamais d'une URL libre du navigateur. `fulfillment_update_tracking` et la
callable `updateOrderTrackingAdmin` modifient uniquement les metadonnees d'une
commande deja expediee: elles ne rejouent ni `fulfillment_ship`, ni le transfert
de garde, ni l'e-mail d'expedition. Une outbox idempotente
`order-tracking-updated` informe le client de la correction.

Un remboursement confirme ou en echec cree egalement deux intentions
atomiques, client et administrateur. Les modeles
`order-refunded[-admin]` et `order-refund-failed[-admin]` portent la reference
Stripe, expliquent l'absence de restock implicite et interdisent une relance
aveugle en cas de resultat non confirme.

Chaque nouvelle commande conserve aussi `deliverySnapshot` en plus de
`shippingSnapshot` et des montants. Le premier restitue la policy/methode
choisie; le second reste le snapshot d'adresse et de contact. Les anciennes
commandes financieres ne sont pas retro-modifiees.

Un echec e-mail n'inverse jamais un paiement confirme. L'outbox durable rend
l'effet metier reprenable, mais Gmail SMTP n'applique pas la cle d'idempotence
transmise et ne peut pas garantir
exactement-un envoi si l'accuse est perdu apres acceptation: cet etat devient
`delivery_unknown` sans retry automatique. Une garantie fournisseur plus forte
attend Resend ou un provider avec idempotence effective.

La recette reelle du 2026-07-30 a confirme un MIME multipart valide et
SPF/DKIM/DMARC `pass` via Gmail SMTP. Gmail a toutefois place le message dans
les spams: la reputation du compte de recette ne constitue pas une preuve de
delivrabilite production. Le placement inbox attend le domaine final, Resend
et ses DNS SPF/DKIM/DMARC; il ne doit pas etre contourne par une modification
du contrat metier ou un marquage automatique de la boite cliente.

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

La vague Functions G9 du 2026-08-22 a cree les paralleles Gen2 des callables
Connect, checkout/reprise, refund et liens de paiement sous Stripe test
uniquement. Les revisions sont `ACTIVE`, leurs Gen1 restent intactes et aucun
appel Connect mutateur n'a servi de preuve. `commerce:e2e:gate7b` n'a pas ete
consomme: son preflight exige `v2_fixture/read_only`, incompatible avec l'etat
sandbox autorise `v2_all/v2`. Le cutover client attend toujours le build App
Hosting G9 est servi par `build-2026-08-22-001` apres rollback et reactivation.
G10 a ensuite bascule les endpoints Stripe test Platform et Connect vers les
deux paralleles Gen2, avec refus non signe 400, replay idempotent, rollback et
reactivation. Aucun build App Hosting n'etait requis.

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
functions/src/commerce/v2Webhooks.js
functions/src/commerce/stripeConnect.js
functions/src/commerce/v2Cancellation.js
functions/src/commerce/v2RefundCommands.js
functions/src/commerce/orderStatus.js
functions/src/commerce/domain/refundEffectApplier.js
src/kit/admin/AdminOrders.jsx
src/kit/admin/AdminReturns.jsx
src/kit/admin/AdminPaymentSettings.jsx
scripts/commerce-v2-all-window.mjs
scripts/audit-refund-failed-v2.mjs
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

Pour la recette M01-M13, `commerce:v2-all:window` expose d'abord un statut
read-only, puis une decouverte deterministe des cinq produits achetables les
moins chers hors donnees `[RECETTE]`. `preflight` et `open` epinglent ces cinq
IDs; `close` ne redemande ni buyer ni produits, afin de rester executable
depuis un checkpoint minimal. `commerce:refund-failed:preflight` est une gate
non mutante: elle exige les trois Functions A-017/A-018 actives et redeployees
apres leur correction, des endpoints qui refusent une signature invalide et
les trois abonnements Stripe test `refund.created|updated|failed`. Elle ne
cree aucun evenement, paiement ou remboursement; ses deux requetes non signees
creent seulement des invocations rejetees et leurs logs techniques.

Le rapprochement post-campagne `audit-commerce-orders-v2.mjs` accepte deux ou
trois commandes distinctes: deux pour la matrice M01-M13 actuelle, trois pour
les campagnes historiques encore auditables. Il refuse toute liste vide,
dupliquee ou plus large.

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
audit par commande. Le transport callable est exporte avec App Check; le
cablage admin produit est actif et independant du control transactionnel.
Le transport callable fulfillment/archive commande est egalement prepare avec
App Check, registre admin actif et AAL2 Google ou passkey; son acteur est derive du
contexte Auth; il est exporte mais son verrou serveur et son branchement UI
conditionne par `adminMutationMode=v2` autorisent les mutations dans l'etat
sandbox courant. Le transport
d'annulation client provider-first est prepare avec App Check et secret Stripe;
le proprietaire vient exclusivement du contexte Auth et le runtime minimal ne
branche que la coordination d'annulation. Il est exporte et actif dans l'UI
sandbox.

La matrice fulfillment est egalement derivee du `deliverySnapshot` fige au
checkout. Apres preparation, un retrait magasin expose seulement `Pret au
retrait`, puis `Retire`; une livraison expose seulement `Expedier`, puis
`Livre` et la mise a jour du suivi. Un snapshot de livraison absent ne donne
aucun raccourci logistique: le serveur refuse la transition incompatible,
meme si une ancienne interface la proposait.

Le transport refund admin est egalement prepare avec App Check, secret Stripe,
registre admin actif et AAL2 Google ou passkey; il derive l'acteur du contexte Auth et
branche un runtime minimal sur la saga refund reprenable. Il est exporte et
actif dans l'UI sandbox. Les transports retour admin sont prepares sous
App Check, registre
admin actif et AAL2 Google ou passkey: ouverture, annulation, reception, restock,
write-off et resolution sont des commandes fermees, versionnees et
quantitatives, avec acteur derive du contexte Auth et runtime minimal. Ils
sont exportes et autorises par le controle serveur sandbox. Les interfaces fulfillment,
annulation, refund et retour sont compilees mais ne sont exposees par
`AdminAppIsland` que lorsque le control plane autorise `adminMutationMode=v2`;
le flag public checkout ne pilote plus les commandes admin. Livraison et Paiement
n'ecrivent plus directement les champs commerce. Ces actions ont ensuite ete
ouvertes durablement sur le sandbox depuis le 2026-08-02.

Gate 5 est `SANDBOX_TRANSACTIONAL_ACTIVE`. Le transport fournit
`createCheckoutV2`, `resumeCheckoutV2` et des lecteurs commandes/retours
pagines par UID ou admin fort. Cote navigateur, un controller unique suit
`stateVersion`; la reprise 3DS/reload est lue avant les gardes panier,
namespacee par UID et ne persiste aucun secret. Les paniers local et Firestore
portent `cartLineId/cartRevision`; le succes exige
`payment.status=succeeded`, s'affiche avant nettoyage et ne supprime que les
lignes achetees demeurees identiques. `MyOrdersView` utilise le reader UID et
sa pagination; les readers commandes et retours admin sont egalement actifs,
avec un adaptateur v1 historique explicitement read-only. Les transports Gate 5
restent exportes. Le controle serveur sandbox est `newCheckoutMode=v2_all`,
les commandes publiques et admin sont actives, et le paiement offline reste
`off`.

Gate 7A ajoute les projections financieres absolues, les recus sandbox
explicitement non fiscaux, l'outbox avec leases/dead-letter et statut
`delivery_unknown`, le dispatcher et le reconciler planifies, les commandes
admin de statut/rebuild/cleanup ainsi que les incidents durables. Le dashboard
lit cette projection serveur et affiche les montants captures, rembourses et
nets sans convertir un chargement ou une erreur en zero financier. Les faits
nouveaux incrementent atomiquement un total par devise et un rollup quotidien;
le reconciliateur, desormais horaire, ne pilote plus la fraicheur de l'UI et
sert seulement a reconstruire les valeurs absolues et controler les
divergences. La sante sandbox est `healthy`, tous les
compteurs sont a zero et aucune TTL commerce n'est activee.

La fermeture G1 du 2026-08-15 qualifie aussi le dispatcher d'expiration avec
une fixture `e2eOnly` et Stripe test: reservation de 1, annulation fournisseur,
liberation du stock 10 -> 9 -> 10, puis second passage sans mouvement ni
variation de stock. Aucun refund, replay financier, restock ou delete n'a ete
execute. Le runner fail-closed est
`functions:prove-reservation-expiry:g1`; son manifeste de preuve est
`apphostingaudit/manifests/functions-gen2-g1-worker-rollout.json`.

Depuis la correction documentaire du 2026-08-12, le recu sandbox est cree
dans la meme transaction que la capture, et la confirmation de remboursement
dans la meme transaction que le fait financier de refund. Le reconciliateur
horaire conserve uniquement son role de reconstruction idempotente et de
reparation des documents historiques; il n'est plus le chemin nominal de
creation des documents visibles dans l'espace client. Une collision d'identite
ou de `contentHash` echoue explicitement au lieu d'ecraser un document.

La livraison documentaire ajoute un rail de consultation sans modifier les
faits financiers: `prepareCommerceDocumentDelivery` controle Auth, App Check
et l'UID proprietaire, puis materialise un PDF immutable dans le prefixe
Storage prive `commerce-documents/v2`. Le navigateur recoit les octets bornes
pour ouvrir, enregistrer ou partager le document; une outbox dedupliquee
programme la meme copie en piece jointe vers l'adresse de commande. Une panne
ou une limite e-mail ne modifie ni le paiement, ni le document, ni son acces.
Ce rail est deploye sur le sandbox depuis le 2026-08-01; son acces client reste
soumis aux controles et proprietes v2 existants.
Le bucket Storage est toujours passe explicitement au SDK Admin: configuration
dediee, `FIREBASE_CONFIG.storageBucket` ou derivee du projet Google Cloud. Le
runtime ne suppose jamais que `admin.initializeApp()` a injecte un bucket par
defaut dans une revision Gen2.

Gate 8 a execute la matrice client/admin complete sur fixtures sandbox. Un
defaut reel du contrat d'annulation client (`cancellationRequestId` au lieu de
`commandId`) a ete corrige et couvert par regression avant reprise de la
recette. L'endpoint Stripe Connect sandbox actif cible maintenant
`stripeConnectWebhookV2` en `europe-west1`; les evenements sont signes,
persistes et rapproches par le runtime v2. La fermeture ne supprime aucune
commande, aucun fait financier, aucun audit ni document.

### 12.1 Liens de paiement admin sans compte

Le rail de secours code le 2026-08-01 reutilise le noyau v2 et Stripe Payment
Element; il ne repose pas sur les Payment Links statiques du Dashboard Stripe.
L'administratrice selectionne un ou plusieurs meubles, une policy de livraison,
une validite bornee et, facultativement, un e-mail verrouille. Le serveur cree
l'order, la tentative et les holds dans la transaction autoritaire existante,
sans faire confiance au prix ou au stock du navigateur.

L'URL `/payer/[orderId]/[token]` contient uniquement l'identifiant de commande
et une signature HMAC opaque, rotative et non stockee en clair. La route est
dynamique, `noindex/nofollow`, `no-referrer`, ne demande ni compte ni OTP et
collecte nom, e-mail, telephone et adresse. Ces coordonnees sont validees par
allowlist puis la saga cree ou reprend le meme PaymentIntent. Le succes reste
exclusivement derive de l'etat durable `paid` produit par le webhook v2.

Cycle de vie:

- creation: reservation immediate pour 30 minutes a 24 heures;
- prolongation: ajout a l'echeance actuelle, plafond de 24 heures restantes;
- changement d'URL: rotation HMAC uniquement avant remise du PaymentIntent;
- annulation/expiration: verification et annulation Stripe provider-first,
  puis liberation idempotente des holds;
- expiration: scheduler borne aux seules commandes actives arrivees a echeance;
- lien ferme: recreation d'une nouvelle order, avec nouvelle validation du
  prix, du stock, de la policy et du compte Connect;
- etat ambigu: `needs_review`, sans recreation ni liberation optimiste.

Les mutations exigent un admin actif avec AAL2 Google ou passkey, App Check,
`newCheckoutMode=v2_all`, `adminMutationMode=v2`, une policy active et le
secret serveur `PAYMENT_LINK_HMAC_SECRET`. La lecture publique exige la
signature HMAC et App Check. Les e-mails d'une commande sans compte contiennent
le recapitulatif mais ne pointent pas vers `/mes-commandes`.

Etat au 2026-08-02: code, tests unitaires, route, onglet, index, secret HMAC et
Functions deployes sur le sandbox. Les smokes HTTP et App Check sont verts. Les
controls sont `v2_all/v2`, le paiement offline est `off` et Stripe reste en
mode test; aucune transaction live n'est autorisee.

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
