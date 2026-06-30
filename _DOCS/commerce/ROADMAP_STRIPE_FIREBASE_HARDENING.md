# Roadmap Stripe / Firebase Hardening

Mise a jour: 2026-06-18

Objectif: durcir les flux commande, paiement Stripe, statut client et restauration de stock sans introduire SQL pour le contexte mono-vendeuse actuel. Firestore + Functions + Stripe restent les sources de verite operationnelles.

## Etat Court

- Phase 2: code applique. Le webhook `payment_intent.succeeded` verifie strictement montant, devise, `paymentIntent.id`, metadata, statut commande et reservation stock avant de passer `paid`.
- Phase 3: code applique. `createOrder` utilise une idempotence backend via `clientOrderId` pour Stripe, manual et deferred.
- Phase 4: code applique. `orderStatusClient` suit la logique stricte des rules Firestore: email verifie ou provider Google fiable, sinon OTP invite.
- Phase 5: code applique cote cancel/webhook; refund serveur admin deja implemente et valide en sandbox.
- Phase 6: preuves sandbox OK pour succes, echec, refund, `payment_intent.canceled` et retry `createOrder` avec meme `clientOrderId`.
- Phase 7: chemin actuel Next: `app/sitemap.js`, pas `app/sitemap.xml/route.js`.

## Phase 0 - Cadre Execution

Le worktree peut etre sale pendant les passes agent. Avant une execution risquee, travailler sur branche dediee ou sauvegarder les changements locaux utiles. Ne pas imposer `git pull --ff-only` comme prerequis universel dans ce repo.

Validation recommandee:

- Lire `git status --short`.
- Identifier les fichiers deja modifies par une autre passe.
- Ne jamais revert des changements non faits par l'agent courant.

## Phase 1 - Dependances

Ne pas lancer `npm audit fix` en aveugle.

Ordre recommande:

1. Lancer l'audit.
2. Identifier les paquets et le risque reel.
3. Appliquer un patch cible.
4. Valider avec les tests/gates strictement utiles.

## Phase 2 - Webhook Stripe Strict

Fichier principal: `functions/src/commerce/stripeWebhook.js`

`payment_intent.succeeded` doit refuser la confirmation si l'une de ces conditions echoue:

- `paymentIntent.status === 'succeeded'`
- `paymentIntent.currency === 'eur'`
- `paymentIntent.amount_received === Math.round(order.total * 100)`
- `paymentIntent.id === order.stripePaymentIntentId`
- `paymentIntent.metadata.orderId === orderId`
- `paymentIntent.metadata.userId === order.userId`
- `paymentIntent.metadata.userEmail === order.userEmail`
- `order.status === 'pending_payment'`
- `order.stockReserved === true`

Evenements negatifs a prouver:

- `payment_intent.payment_failed`
- `payment_intent.canceled`

Ces deux chemins doivent restaurer le stock uniquement si `stockReserved === true`, puis passer `stockReserved` a `false`.

## Phase 3 - Idempotence createOrder

Fichier principal: `functions/src/commerce/createOrder.js`

Ajouter une cle frontend `clientOrderId` et une idempotence backend dans `sys_idempotency` pour:

- `stripe_elements`
- `manual`
- `deferred`

But: un double appel callable ne doit pas creer deux commandes ni reserver deux fois le stock. Un retry doit retourner la commande ou le PaymentIntent deja cree.

## Phase 4 - Statut Commande Client

Fichier principal: `functions/src/commerce/orderStatus.js`

Aligner le callable sur `firestore.rules`:

- UID proprietaire accepte seulement avec email fiable.
- Email fiable = `email_verified === true` ou provider Google fiable.
- Invite = OTP checkout valide obligatoire.

## Phase 5 - Refund / Cancel / Stock Restore

Fait:

- Refund serveur admin implemente.
- Validation sandbox refund effectuee sur paiement reel sandbox.

A completer / garder durci:

- `cancelOrderClient` doit etre no-op si deja annulee.
- Restaurer seulement si `stockReserved === true`.
- Verifier que `buyerId` absent ou egal au `order.userId`.
- Remettre `stockReserved: false` apres restauration.
- Tracer tout conflit de restauration stock cote webhook.

## Phase 6 - Tests E2E Paiement

Scenarios couverts:

- Deja prouve: succes Stripe sandbox, commande `paid`, stock coherent, email/webhook OK.
- Deja prouve: echec paiement Stripe sandbox, commande `payment_failed`, stock restaure.
- Deja prouve: refund admin sandbox, commande `refunded`, stock restaure.
- Prouve le 2026-06-18: annulation `payment_intent.canceled`, commande `canceled`, stock restaure.
- Prouve le 2026-06-18: double retry `createOrder` avec meme `clientOrderId`, meme commande, meme PaymentIntent, aucune double reservation.

Preuve recente:

- `logs/stripe-hardening-proof-2026-06-18T21-26-40.json`
- `e2eStripeHardeningProof` a active `payment_intent.canceled` sur l'endpoint webhook Stripe sandbox puis valide le flux.

## Phase 7 - SEO / Sitemap

Le repo utilise `app/sitemap.js`. Toute instruction mentionnant `app/sitemap.xml/route.js` est datee et doit etre adaptee au fichier actuel.

## Phase 8 - Decision Architecture

Pas de migration SQL maintenant. Le risque prioritaire se situe dans les invariants transactionnels et financiers:

- confiance minimale dans les donnees client;
- validation Stripe stricte;
- idempotence backend;
- restauration stock non ambigue;
- observabilite des conflits.
