# Roadmap — Durcissement Stripe + Firebase sans migration SQL

Projet: `MFcv1/secondevienextjsSSR`
Commit de départ: `6b816dc v0.9.4`
Contexte produit: marketplace dédiée à un seul site / une seule gérante.
Stack actuel: Firebase App Hosting + Next.js + Firebase Functions + Firestore + Stripe PaymentElement.

## Décision architecture

Ne pas créer de base SQL maintenant.

Pour ce projet, SQL/Postgres serait une sur-couche inutile tant que le modèle reste:

- une seule gérante / un seul vendeur métier;
- pas de Stripe Connect;
- pas de payouts multi-vendeurs;
- pas de commissions vendeurs;
- pas de reporting comptable complexe;
- pas de multi-vendeur dans une même commande.

Le bon modèle actuel est:

```txt
Firestore = état applicatif, commandes, stock, projections dashboard
Stripe = vérité financière
Cloud Functions = seule autorité paiement / stock / statut commande
```

SQL deviendra pertinent seulement si le produit évolue vers une vraie marketplace multi-acteurs:

```txt
vendeurs multiples
Stripe Connect
commissions
seller balances
transfers / payouts
refunds / disputes fréquents
exports comptables avancés
audit financier lourd
```

## Objectif de cette roadmap

Durcir l'architecture existante sans changer de stack.

Priorité:

1. Sécuriser Stripe / paiement.
2. Éviter double commande / double réservation stock.
3. Aligner les permissions Firestore + callable Functions.
4. Corriger les vulnérabilités npm.
5. Ajouter de la réconciliation Stripe -> Firestore.
6. Corriger la gate SEO `/sitemap.xml`.

---

## Phase 0 — Vérification de base avant travaux

### Actions

```bash
git status --short --branch
git pull --ff-only
npm run build
npm run next:routes
cd functions && npm install && cd ..
```

Puis syntax check Functions:

```bash
cd functions
find . -name "*.js" -not -path "./node_modules/*" -print0 | xargs -0 -n1 node --check
cd ..
```

### Critères d'acceptation

- Repo propre avant modification.
- Build Next OK.
- Toute erreur existante documentée avant de commencer.

---

## Phase 1 — Corriger les vulnérabilités npm

### Constat actuel

Root:

```txt
13 vulnérabilités
3 high
10 moderate
```

Functions:

```txt
15 vulnérabilités
4 high
11 moderate
```

Packages à surveiller:

- `nodemailer`;
- `@grpc/grpc-js`;
- `form-data`;
- `protobufjs`;
- dépendances transitives `firebase-admin` / Google Cloud.

### Actions recommandées

1. Dans root:

```bash
npm audit
npm audit fix
npm run build
npm run next:routes
```

2. Dans `functions`:

```bash
cd functions
npm audit
npm audit fix
npm run deploy -- --dry-run # si supporté localement, sinon skip
cd ..
```

3. Upgrade ciblé `nodemailer` si l'audit ne le corrige pas automatiquement.

4. Ne pas faire `npm audit fix --force` sans audit manuel des breaking changes.

### Fichiers probables

```txt
package.json
package-lock.json
functions/package.json
functions/package-lock.json
```

### Critères d'acceptation

- 0 vulnérabilité `high` restante, ou justification écrite si dépendance transitive non corrigeable sans major risquée.
- `npm run build` OK.
- Syntax check Functions OK.
- Aucun secret ajouté dans le repo.

---

## Phase 2 — Durcir `payment_intent.succeeded`

### Problème

Le webhook Stripe confirme actuellement une commande si l'`orderId` existe.

Il faut vérifier strictement que le PaymentIntent correspond bien à la commande stockée.

### Fichier principal

```txt
functions/src/commerce/stripeWebhook.js
```

### Actions

Dans le handler `payment_intent.succeeded`, avant de passer la commande en `paid`, valider:

```txt
paymentIntent.status === 'succeeded'
paymentIntent.currency === 'eur'
paymentIntent.amount_received === Math.round(order.total * 100)
paymentIntent.metadata.orderId === orderRef.id
paymentIntent.metadata.userId === order.userId
paymentIntent.id === order.stripePaymentIntentId
order.status === 'pending_payment'
order.stockReserved === true
```

Si une validation échoue:

- ne pas marquer `paid`;
- logger une alerte claire;
- marquer l'idempotency event en `failed`;
- retourner 500 ou état contrôlé selon le cas pour permettre retry Stripe si utile.

### Critères d'acceptation

- Un PaymentIntent avec mauvais montant ne peut pas passer la commande en `paid`.
- Un PaymentIntent avec mauvaise devise ne peut pas passer la commande en `paid`.
- Un PaymentIntent qui ne correspond pas à `order.stripePaymentIntentId` ne peut pas confirmer la commande.
- Le webhook reste idempotent.

---

## Phase 3 — Ajouter l'idempotence backend à `createOrder`

### Problème

Le front limite le double clic, mais le backend peut encore créer plusieurs commandes si l'appel callable est répété.

### Fichiers principaux

```txt
src/kit/commerce/CheckoutView.jsx
functions/src/commerce/createOrder.js
```

### Design recommandé

Créer une clé `clientOrderId` côté front au moment où l'utilisateur lance le paiement.

Exemple:

```js
crypto.randomUUID()
```

Envoyer cette clé à `createOrder`:

```js
orderData: {
  ...,
  clientOrderId
}
```

Côté backend:

- normaliser `clientOrderId`;
- calculer une clé d'idempotence liée à l'utilisateur ou à l'email invité;
- créer un document backend-only, par exemple:

```txt
sys_idempotency/create_order_${userIdOrGuestHash}_${clientOrderId}
```

Flux attendu:

```txt
si clé inconnue:
  réserver stock
  créer order
  créer PaymentIntent
  stocker orderId + paymentIntentId + clientSecret

si clé déjà connue et order pending:
  retourner le PaymentIntent existant

si clé déjà paid:
  retourner un état clair: already_paid
```

### Critères d'acceptation

- Double appel identique ne réserve pas deux fois le stock.
- Double appel identique ne crée pas deux PaymentIntents actifs.
- Le front peut retry sans casser le stock.
- Les docs/commentaires expliquent le rôle de `clientOrderId`.

---

## Phase 4 — Durcir `getOrderStatusClient`

### Problème

`getOrderStatusClient` est moins strict que `firestore.rules`.

Il accepte plus facilement une égalité email:

```txt
token.email === orderData.userEmail
```

Il faut aligner la logique sur les règles Firestore:

```txt
email vérifié
ou provider Google fiable
ou OTP invité valide
```

### Fichier principal

```txt
functions/src/commerce/orderStatus.js
```

### Actions

Créer une fonction équivalente à la logique Firestore:

```txt
hasTrustedCheckoutAuth(context, orderEmail)
```

Elle doit exiger:

- `context.auth` présent;
- email token normalisé = email commande;
- `email_verified === true` OU provider Google fiable;
- sinon OTP invité via `assertGuestCheckoutOtpVerified`.

### Critères d'acceptation

- Un user avec email non vérifié ne peut pas lire une commande juste via email matching.
- Un invité OTP peut lire uniquement sa commande.
- Un user owner par UID continue de fonctionner si l'auth est fiable.

---

## Phase 5 — Restreindre `cancelOrderClient`

### Problème

L'annulation client automatique doit rester un mécanisme checkout/stock, pas un système de remboursement business.

### Fichier principal

```txt
functions/src/commerce/cancelOrder.js
```

### Règle cible

Autoriser l'annulation client automatique uniquement pour:

```txt
pending_payment
payment_failed
canceled
cancelled_by_client no-op
```

Bloquer tout état business:

```txt
paid
confirmed
payment_received
shipped
completed
refund_pending
refunded
```

Pour une commande `paid`, le message doit indiquer:

```txt
Commande déjà payée: remboursement Stripe requis avant annulation.
```

### Critères d'acceptation

- Une commande `paid` ne restaure jamais le stock via annulation client simple.
- Une commande `pending_payment` peut être annulée et restaurer le stock.
- Une commande déjà annulée ne double-restaure pas le stock.

---

## Phase 6 — Ajouter une reconciliation Stripe -> Firestore

### Problème

Les webhooks peuvent arriver en retard, être rejoués, ou échouer temporairement.

Même avec un bon webhook, une tâche de reconciliation est utile.

### Nouveau fichier possible

```txt
functions/src/commerce/reconcileStripePayments.js
```

Exporter ensuite dans:

```txt
functions/index.js
```

### Design recommandé

Scheduled function toutes les X heures:

```txt
- trouver les orders pending_payment récentes ou anciennes;
- récupérer le PaymentIntent Stripe;
- si succeeded et montant/devise/orderId OK -> marquer paid;
- si canceled/requires_payment_method après TTL -> restaurer stock;
- logger reconciliationNote / reconciledAt;
- ne jamais faire confiance au front.
```

### Critères d'acceptation

- Une commande payée mais webhook raté finit confirmée.
- Une commande expirée finit annulée/restaurée.
- Les mismatches montant/devise sont loggés et non confirmés.

---

## Phase 7 — Corriger la gate SEO `/sitemap.xml`

### Problème actuel

```bash
npm run next:routes
```

échoue avec:

```txt
/sitemap.xml revalidate expected 300, got false
```

### Fichiers probables

```txt
app/sitemap.xml/route.js
scripts/check-next-route-classification.cjs
```

ou équivalent selon structure réelle.

### Actions

- Vérifier si `/sitemap.xml` doit être ISR avec `revalidate = 300`.
- Corriger l'export Next ou adapter le check si Next 15 expose différemment la metadata.
- Relancer:

```bash
npm run build
npm run next:routes
```

### Critères d'acceptation

- `npm run next:routes` passe à 0 issue.

---

## Phase 8 — Documentation minimale à ajouter après corrections

Créer ou compléter:

```txt
docs/STRIPE_FIREBASE_FLOW.md
docs/PAYMENT_STATE_MACHINE.md
```

Contenu minimal:

- Firestore n'est pas la vérité financière;
- Stripe est la vérité paiement;
- `success_url` / `return_url` = UX seulement;
- webhook signé obligatoire;
- idempotence webhook + idempotence createOrder;
- états de commande autorisés;
- procédure refund manuelle si commande déjà payée;
- procédure de test Stripe sandbox.

---

## Ordre conseillé pour l'agent qui prend le relais

1. Créer une branche:

```bash
git checkout -b hardening/stripe-firebase-roadmap
```

2. Faire Phase 1.
3. Commit.
4. Faire Phase 2 + tests manuels/syntax.
5. Commit.
6. Faire Phase 3.
7. Commit.
8. Faire Phase 4 + Phase 5.
9. Commit.
10. Faire Phase 6.
11. Commit.
12. Faire Phase 7.
13. Commit.
14. Ouvrir PR ou push branch selon workflow.

## Commandes de vérification finales

```bash
git status --short
npm run build
npm run next:routes
npm audit
cd functions
npm audit
find . -name "*.js" -not -path "./node_modules/*" -print0 | xargs -0 -n1 node --check
cd ..
```

## Résumé décisionnel

Ne pas migrer vers SQL maintenant.

La priorité n'est pas de changer de base de données. La priorité est de rendre le flow Firebase/Stripe existant plus robuste:

```txt
vulnérabilités npm
validation webhook stricte
idempotence createOrder
permissions order status
annulation client safe
reconciliation Stripe
SEO route gate
```

Quand le business deviendra multi-vendeur / Connect / commissions / payouts, réouvrir la question Postgres ou Cloud SQL.
