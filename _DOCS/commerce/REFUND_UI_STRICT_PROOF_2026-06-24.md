# Refund UI Strict proof attempt - 2026-06-24

## Scope

Mission: obtain or prepare the strict proof of the admin UI click `Rembourser` before the target order is already refunded.

This pass did not modify App Check, Stripe payment method UI, checkout code, or refund code. No secrets are included in this report.

## Existing proof reviewed

- `E2E_BACKOFFICE_TEST_ROADMAP_2026-06-18.md`: documents previous refund proofs through callable admin, Stripe, Firestore, webhook, email, and hosted UI post-refund state.
- `E2E_REFUND_EXECUTION_ROADMAP_2026-06-19.md`: explicitly keeps the strict UI click `Rembourser` open because the fresh order had already been refunded before hosted UI proof.
- `logs/ui-admin-returns-proof-2026-06-19.json`: proves hosted admin `Retours` post-refund state for order `9RkYKEaaRCrBWVxU6ALb`, including `Remboursee`, `Stock remis`, refund id, and `Sync Stripe` / `Email client`.
- `logs/ui-client-orders-refunded-proof-2026-06-19.json`: proves client `/mes-commandes` post-refund state.

Conclusion from existing artifacts at the start of the pass: refund backend and post-refund UI were proven, but the strict hosted UI click `Rembourser` remained unproven.

## Resolution after checkout stabilization

Status: `passed`.

Fresh paid order created through hosted checkout:

```text
logs/hosted-stripe-e2e-2026-06-24T20-54-13-574Z.json
```

Strict admin UI refund proof:

```text
logs/ui-admin-returns-strict-refund-2026-06-24-xxHfLd2NLLWyFN5VXz01.json
logs/ui-admin-returns-strict-refund-2026-06-24-xxHfLd2NLLWyFN5VXz01.png
```

Runtime proof summary:

- order: `xxHfLd2NLLWyFN5VXz01`;
- click `Rembourser`: `true`;
- native confirm accepted: `true`;
- UI shows `Remboursee`: `true`;
- UI shows `Stock remis`: `true`;
- UI shows refund id: `true`;
- Firestore order `status=refunded`;
- Firestore order `refundStatus=succeeded`;
- Stripe refund id: `re_3TlxoeRdWb0VNdZq1RL5SfaS`;
- Firestore order `stockRestoredAfterRefund=true`;
- product restored: `stock=1`, `sold=false`, `refundedFromOrderId=xxHfLd2NLLWyFN5VXz01`.

This closes the strict UI click ambiguity.

## Commands run

```powershell
npm run e2e:seed-stripe-product
```

Result: product `sv-e2e-stripe-refund-product` reset in sandbox with `stock=1`, `sold=false`.

```powershell
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$env:E2E_EMAIL = "loa.gto15+sv-refund-ui-$stamp@gmail.com"
$env:E2E_MAILBOX_USER = "loa.gto15@gmail.com"
$env:E2E_HEADLESS = "true"
$env:E2E_CHECKOUT_MODE = "guest-otp"
npm run e2e:hosted-stripe
```

Result artifact: `logs/hosted-stripe-e2e-2026-06-24T17-06-11-838Z.json`

Outcome: blocked before fresh order creation. Final page was `/checkout` with `Connexion requise`, no checkout form, no Stripe payment.

```powershell
npm run e2e:seed-stripe-product
$env:E2E_EMAIL = "loa.gto15+sv-refund-20260619155423@gmail.com"
$env:E2E_PASSWORD = (Get-Content -Raw logs\e2e-refund-client-password.local.txt).Trim()
$env:E2E_MAILBOX_USER = "loa.gto15@gmail.com"
$env:E2E_HEADLESS = "true"
$env:E2E_CHECKOUT_MODE = "verified-user"
npm run e2e:hosted-stripe
```

Result artifact: `logs/hosted-stripe-e2e-2026-06-24T17-07-28-688Z.json`

Outcome: blocked before Stripe payment. The checkout page was filled and email OTP was verified, but Stripe Payment Element iframe never appeared.

Observed script status:

```text
known-blocked-app-check
```

Observed runtime symptoms:

- console includes `Cart sync error: FirebaseError: Missing or insufficient permissions.`
- final URL remains `/checkout`
- error waits for `iframe[src*="stripe.com"], iframe[name^="__privateStripeFrame"]`
- no `passed` checkout proof
- no new paid order was created

## Firestore safety checks

Read-only Firestore check after the attempts:

```text
Product: sv-e2e-stripe-refund-product
stock: 1
sold: false
buyerId: null
refundedFromOrderId: null
```

Order check:

- No fresh paid order was created during this 2026-06-24 run.
- The only matching product/order record surfaced by the read was an old 2026-06-22 test order already `canceled`, not a new refund candidate.

## Current blocker

Superseded: strict UI refund was later executed successfully after the hosted checkout was stabilized.

The immediate blocker is upstream of admin refund:

```text
hosted checkout does not reach Stripe Payment Element / paid order creation
```

The E2E script classifies the run as App Check related, and the browser console also shows Firestore permission/cart sync errors. This agent did not change App Check because it is outside the Refund UI Strict scope.

## Exact resume procedure

After checkout/App Check is fixed enough for `npm run e2e:hosted-stripe` to produce `status=passed`:

1. Reset the dedicated product.

```powershell
npm run e2e:seed-stripe-product
```

2. Create a fresh paid sandbox order on the dedicated product.

```powershell
$env:E2E_EMAIL = "loa.gto15+sv-refund-20260619155423@gmail.com"
$env:E2E_PASSWORD = (Get-Content -Raw logs\e2e-refund-client-password.local.txt).Trim()
$env:E2E_MAILBOX_USER = "loa.gto15@gmail.com"
$env:E2E_HEADLESS = "true"
$env:E2E_CHECKOUT_MODE = "verified-user"
npm run e2e:hosted-stripe
```

3. Read the newest `logs/hosted-stripe-e2e-*.json` and extract:

- `proof.payload.order.id`
- `proof.payload.order.stripePaymentIntentId`
- `email`
- `targetProductId`

4. Open hosted `/admin`, login with the local admin credentials from `logs/e2e-admin.env`, switch to `Retours`, filter by the fresh `orderId`, and only then click `Rembourser`.

5. Confirm the native browser confirm dialog.

6. Capture proof immediately after the click:

- screenshot of admin `Retours`
- visible order id
- visible status `Remboursee` or `En attente Stripe`
- visible `Refund: re_...` when available
- visible `Stock remis` when confirmed
- Firestore order fields: `status`, `refundStatus`, `stripeRefundId`, `stockRestoredAfterRefund`
- product fields: `stock=1`, `sold=false`, `refundedFromOrderId=<orderId>`

## TODO integration proposal

Superseded: the strict item can now be checked.

Suggested TODO wording for the main coordinator:

```text
- [x] cliquer `Rembourser`
  - 2026-06-24 strict proof passed on order `xxHfLd2NLLWyFN5VXz01`; see `logs/ui-admin-returns-strict-refund-2026-06-24-xxHfLd2NLLWyFN5VXz01.json`.
```
