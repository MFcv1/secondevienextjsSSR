# Plan integration Stripe Connect - 2026-07-01

## Objectif

Remplacer la passation manuelle des cles Stripe cliente par un onboarding Stripe Connect depuis l'admin.

Decision v1:

- Mode financier: la cliente encaisse directement sur son compte Stripe connecte.
- Type de compte: Standard connecte, pour conserver le Dashboard Stripe complet cote cliente.
- Mode de paiement: garder le Payment Element existant; ne pas migrer vers Stripe Checkout dans cette phase.
- Mode Connect: direct charges, avec `stripeAccount` sur les appels Stripe concernes.
- Changement de compte: double validation super-admin, jamais un remplacement silencieux.

## Etat de depart

Le projet a deja:

- creation de commande serveur avec recalcul prix et reservation stock;
- PaymentIntent + Payment Element;
- webhook Stripe signe avec idempotence;
- remboursements admin + remise en stock;
- cleanup serveur des commandes `pending_payment`;
- preuves E2E sandbox paiement/refund.

Le chantier Connect doit donc ajouter la couche compte connecte sans casser ces invariants.

## Phases et preuves

| Phase | Statut | But | Preuve attendue | Preuve obtenue |
| --- | --- | --- | --- | --- |
| 0 - Documentation | Valide local | Creer cette roadmap et la lier aux consignes agents | Diff doc + lien `AGENTS.md` | `_DOCS/commerce/STRIPE_CONNECT_INTEGRATION_PLAN_2026-07-01.md` cree et `AGENTS.md` lie |
| 1 - Fondations securite | Valide local | Secrets, helpers super-admin recents, stockage Connect backend-only, callables Connect | `node --check` Functions + rules relues | `node --check functions/src/commerce/stripeConnect.js`, `node --check functions/helpers/security.js`, `npm run lint`, `npm run build` OK |
| 2 - Routage paiement | Valide local, runtime a faire | PaymentIntent sur compte connecte si actif, legacy direct sinon | `node --check createOrder` + preuve PI avec `acct_...` | `node --check functions/src/commerce/createOrder.js`, `npm run lint`, `npm run build` OK; preuve PI Connect a faire apres setup Stripe |
| 3 - Webhooks Connect | Valide local, runtime a faire | Endpoint webhook Connect, validation `event.account`, idempotence account-aware | Livraison Stripe `2xx` + order `paid` | `node --check functions/src/commerce/stripeWebhook.js`, `npm run lint`, `npm run build` OK; livraison Stripe Connect a faire |
| 4 - Refund/cleanup Connect | Valide local, runtime a faire | Refund et cleanup sur le compte stocke dans la commande | Refund `re_...` sur meme `acct_...` | `node --check functions/src/commerce/refundOrder.js`, `node --check functions/src/commerce/cleanupPendingPayments.js`, `npm run lint`, `npm run build` OK; refund Connect runtime a faire |
| 5 - UI admin | Valide local, runtime a faire | Page Paiement avec onboarding, statut, sync, double validation reconnect | Capture/admin state + appels refuses admin normal | `npm run lint`, `npm run build` OK; preuve UI connectee a faire apres deploy Functions |
| 6 - E2E complet sandbox | A faire | Achat + webhook + refund + stock avec Connect | JSON E2E + event ids + Firestore | A renseigner |
| 7 - Closeout prod | A faire | Procedure cliente, secrets live plateforme, webhook live, rollback | Checklist prod signee | A renseigner |

## Donnees

Document serveur principal:

```text
sys_metadata/stripe_connect
```

Champs cibles:

```text
activeAccountId
pendingAccountId
status
chargesEnabled
payoutsEnabled
detailsSubmitted
livemode
locked
connectedBy
connectedAt
updatedAt
lastWebhookAt
lastSyncAt
reconnectRequest
previousAccountIds
```

Commandes:

```text
stripeConnectedAccountId
stripeConnectMode = direct_charges
```

Regle importante: un refund doit toujours utiliser le compte stocke sur la commande, pas le compte actuellement actif.

## UI/UX admin cible

Page `Paiement`:

- carte statut Stripe: non connecte, configuration a terminer, actif, restreint;
- bouton `Connecter Stripe` visible seulement super-admin;
- bouton `Continuer la configuration` si `pendingAccountId` existe mais `chargesEnabled` est faux;
- bouton `Synchroniser Stripe` disponible admin;
- bloc securite affichant le compte masque `acct_...1234`, le mode test/live et la derniere synchro;
- zone changement de compte separee, avec texte de confirmation et activation finale explicite.

Messages client checkout:

- si Stripe Connect actif et pret: afficher Stripe normalement;
- si Stripe Connect existe mais incomplet: masquer Stripe et proposer Virement/Wero;
- si Connect absent: conserver le chemin Stripe direct legacy pour ne pas casser la sandbox existante pendant migration.

## Securite

Actions critiques:

- demarrer onboarding;
- demander un changement de compte;
- activer un compte pending;
- deconnecter/revoquer un compte.

Toutes ces actions doivent:

- passer par Cloud Functions;
- exiger super-admin;
- exiger `auth_time` recent;
- journaliser uid, email, ancien compte, nouveau compte, timestamp;
- ne jamais exposer de cle Stripe;
- refuser toute ecriture directe Firestore sur `sys_metadata/stripe_connect`.

Webhooks:

- verifier la signature avec le secret Connect dedie;
- valider `event.account`;
- ignorer tout event Connect dont le compte ne correspond ni au compte actif ni a un compte historique lie a une commande;
- inclure `accountId` dans les cles d'idempotence.

## Procedure de test sandbox

Preconditions manuelles Stripe:

1. Activer Connect sur le compte plateforme Stripe test.
2. Verifier que la cle plateforme sandbox est dans `STRIPE_SECRET_KEY`.
3. Configurer `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` avec la cle publique plateforme sandbox.
4. Creer un endpoint webhook Connect vers `stripeConnectWebhook`.
5. Enregistrer le secret endpoint dans `STRIPE_CONNECT_WH_SECRET`.

Events webhook Connect minimum:

```text
account.updated
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.canceled
refund.created
refund.updated
refund.failed
charge.refunded
```

Tests courts:

```powershell
node --check functions/src/commerce/stripeConnect.js
node --check functions/src/commerce/createOrder.js
node --check functions/src/commerce/stripeWebhook.js
node --check functions/src/commerce/refundOrder.js
node --check functions/src/commerce/cleanupPendingPayments.js
```

Test bout en bout cible:

```powershell
npm run e2e:seed-stripe-product
npm run e2e:hosted-stripe
```

Preuves a archiver:

- `connectedAccountId`;
- `orderId`;
- `paymentIntentId`;
- event id `payment_intent.succeeded`;
- `event.account`;
- `refundId`;
- event id refund;
- statut Firestore commande;
- stock final produit.

## Rollback

Le chemin Stripe direct legacy reste disponible tant que `sys_metadata/stripe_connect.activeAccountId` est absent.

Rollback rapide:

1. Desactiver `stripeEnabled` dans `sys_metadata/payment_settings`.
2. Restaurer le paiement par virement/Wero.
3. Retirer `activeAccountId` uniquement via procedure serveur si le Connect sandbox/prod doit etre coupe.
4. Garder les anciennes commandes avec leur `stripeConnectedAccountId` pour refunds.

## Journal implementation - 2026-07-01

Changements appliques:

- ajout `STRIPE_CONNECT_WH_SECRET`;
- ajout `checkRecentSuperAdmin`;
- protection Firestore de `sys_metadata/stripe_connect` contre les ecritures client;
- ajout des callables `getStripeConnectStatus`, `startStripeConnectOnboarding`, `syncStripeConnectAccount`, `requestStripeConnectReconnect`, `confirmStripeConnectReconnect`;
- ajout endpoint `stripeConnectWebhook`;
- idempotence webhook Stripe incluant le compte Connect;
- validation `event.account` contre `order.stripeConnectedAccountId`;
- `createOrder` cree le PaymentIntent sur le compte connecte si Connect est actif et pret, sinon conserve le chemin legacy;
- Stripe.js peut etre initialise avec `stripeAccount`;
- refund et cleanup utilisent le compte stocke sur la commande;
- page admin Paiement enrichie avec statut Connect, onboarding, sync et changement en double validation.

Validations lancees:

```powershell
node --check functions/src/commerce/stripeConnect.js
node --check functions/src/commerce/createOrder.js
node --check functions/src/commerce/stripeWebhook.js
node --check functions/src/commerce/refundOrder.js
node --check functions/src/commerce/cleanupPendingPayments.js
node --check functions/helpers/security.js
npm run lint
npm run build
```

Resultat: OK.

Preuves runtime restantes:

- deployer Functions avec le nouveau secret `STRIPE_CONNECT_WH_SECRET`: OK 2026-07-01, `stripeConnectWebhook` cree, callables Connect crees, fonctions paiement/refund mises a jour;
- deployer App Hosting admin sandbox: OK 2026-07-01, backend `secondevie-next-sandbox` publie;
- configurer le webhook Connect Stripe sandbox: OK 2026-07-01, endpoint `stripeConnectWebhook`, 8 events Connect, secret `STRIPE_CONNECT_WH_SECRET` version 1 active;
- connecter un compte Standard sandbox depuis l'admin;
- prouver achat, webhook `event.account`, refund et stock restaure.
