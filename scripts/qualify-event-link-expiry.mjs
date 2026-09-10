// Privileged infrastructure recipe on one existing e2eOnly fixture. This does
// not impersonate an admin or qualify the browser's authenticated create flow.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { createCheckoutRuntime } = require('./src/commerce/domain/v2Runtime');
const { createPaymentLinkState } = require('./src/commerce/domain/adminPaymentLink');
const { effectIdFor } = require('./src/commerce/domain/reservationRepository');
const flags = new Set(process.argv.slice(2));
if (!['--project=secondevienextjsssr', '--env=sandbox', '--execute',
    '--confirm=ONE_FIXTURE_STRIPE_TEST_EXPIRY_NO_CHARGE'].every(f => flags.has(f))) throw Error('EXPLICIT_BOUNDED_RECIPE_REQUIRED');
const project = 'secondevienextjsssr', region = 'europe-west1';
const job = `firebase-schedule-expireAdminPaymentLinksGen2-${region}`;
const gcloud = args => execFileSync('gcloud', [...args, `--project=${project}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const check = (ok, code) => { if (!ok) throw Error(code); };
initializeApp({ projectId: project, credential: applicationDefault() });
const db = getFirestore();
const productRef = db.doc('artifacts/secondevie/public/data/furniture/fixture_gate6_stock10_03');
const [productSnap, controlSnap] = await Promise.all([productRef.get(), db.doc('sys_commerce_control/current').get()]);
const product = productSnap.data(), control = controlSnap.data();
check(product?.e2eOnly === true && product.e2ePurpose === 'g1_reservation_expiry_proof'
    && product.status === 'published' && Number.isSafeInteger(product.stock) && product.stock >= 1, 'FIXTURE_UNSAFE');
check(control?.newCheckoutMode === 'v2_all' && control.adminMutationMode === 'v2'
    && control.offlinePaymentMode === 'off', 'SANDBOX_CONTROL_CHANGED');
const policy = (await db.doc(`commerce_policy_versions/${control.activePolicyVersion}`).get()).data();
const mode = policy?.deliveryModes?.find(m => m.active && m.countries?.includes('FR'));
check(mode && /^acct_/.test(policy.stripeConnectedAccountId), 'POLICY_UNAVAILABLE');
const key = gcloud(['secrets', 'versions', 'access', '4', '--secret=STRIPE_SECRET_KEY']);
check(key.startsWith('sk_test_'), 'LIVE_STRIPE_FORBIDDEN');
const stripe = new (require('stripe'))(key);
const account = await stripe.accounts.retrieve(policy.stripeConnectedAccountId);
const accountState = (await db.doc(`commerce_connect_accounts/${policy.stripeConnectedAccountId}`).get()).data();
check(account.livemode !== true && accountState?.livemode === false && accountState.chargesEnabled, 'CONNECT_NOT_TEST_READY');
const beforeJob = JSON.parse(gcloud(['scheduler', 'jobs', 'describe', job, `--location=${region}`, '--format=json']));
check(beforeJob.state === 'ENABLED' && beforeJob.httpTarget?.uri === `https://${region}-${project}.cloudfunctions.net/expireAdminPaymentLinksGen2`, 'SCHEDULER_PRECONDITION');
const id = `qualification_link_${Date.now()}`, now = Date.now();
const result = { id, startedAt: new Date(now).toISOString(), fixture: productRef.id,
    beforeStock: product.stock, paymentAllowed: false, observations: [], passed: false };
const output = `/tmp/${id}.json`;
fs.writeFileSync(output, JSON.stringify(result, null, 2), { mode: 0o600 });
let paused = false;
try {
    gcloud(['scheduler', 'jobs', 'pause', job, `--location=${region}`]); paused = true;
    const runtime = createCheckoutRuntime({ db, stripe, appId: 'secondevie' });
    const checkout = await runtime.checkout.createCheckout({ ownerUid: id, ownerEmail: null,
        input: { clientOrderId: id, items: [{ cartLineId: id, cartRevision: 1,
            productId: productRef.id, collectionName: 'furniture', variantId: null, quantity: 1 }],
        deliveryModeId: mode.id, shippingAddress: { fullName: 'Recette expiration technique',
            line1: '1 rue du Test', line2: '', postalCode: '75001', city: 'Paris', country: 'FR' } },
        checkoutExpiresAt: new Date(now + 90000).toISOString(), checkoutChannel: 'admin_payment_link',
        checkoutMetadata: { qualificationRunId: id, paymentLink: createPaymentLinkState({
            actorUid: 'system:qualification-events', tokenNonce: crypto.randomBytes(24).toString('base64url'), now: new Date(now).toISOString() }) } });
    result.orderId = checkout.orderId;
    fs.writeFileSync(output, JSON.stringify(result, null, 2), { mode: 0o600 });
    const orderRef = db.doc(`orders/${checkout.orderId}`);
    const initialOrder = (await orderRef.get()).data();
    const inventoryKey = initialOrder.items[0].inventoryKey;
    const reservationRef = db.doc(`inventory_reservations/${checkout.orderId}_${inventoryKey}`);
    const movementRef = db.doc(`inventory_movements/${effectIdFor('release', checkout.orderId, inventoryKey)}`);
    const initialIntent = await stripe.paymentIntents.retrieve(checkout.paymentIntentId, {}, { stripeAccount: checkout.connectedAccountId });
    check(!initialIntent.livemode && initialIntent.status === 'requires_payment_method', 'UNEXPECTED_PROVIDER_STATE');
    check((await productRef.get()).data().stock === product.stock - 1
        && (await reservationRef.get()).data()?.status === 'held', 'RESERVATION_NOT_PROVED');
    result.reservationProved = true;
    for (let n = 0; n < 48; n++) {
        const order = (await orderRef.get()).data();
        result.observations.push({ at: new Date().toISOString(), state: order.maintenanceWork?.state,
            result: order.maintenanceWork?.result, closeReason: order.checkout.closeReason });
        if (order.maintenanceWork?.state === 'succeeded' && order.checkout.closeReason === 'expired') {
            const [reservation, movement, stock, pi] = await Promise.all([reservationRef.get(), movementRef.get(), productRef.get(),
                stripe.paymentIntents.retrieve(checkout.paymentIntentId, {}, { stripeAccount: checkout.connectedAccountId })]);
            result.providerStatus = pi.status;
            result.reservationStatus = reservation.data()?.status;
            result.releaseMovementExists = movement.exists;
            result.finalStock = stock.data()?.stock;
            result.passed = !pi.livemode && pi.status === 'canceled' && reservation.data()?.status === 'released'
                && movement.exists && result.finalStock === product.stock;
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    check(result.passed, 'EXPIRY_PROOF_FAILED_REVIEW_OWN_ORDER');
} finally {
    // Restore the previous scan if qualification fails. Never blindly release
    // a hold or cancel an ambiguous payment just to clean up a test.
    if (paused && !result.passed) gcloud(['scheduler', 'jobs', 'resume', job, `--location=${region}`]);
    result.finishedAt = new Date().toISOString();
    fs.writeFileSync(output, JSON.stringify(result, null, 2), { mode: 0o600 });
    console.log(JSON.stringify(result));
}
