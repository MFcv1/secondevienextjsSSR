#!/usr/bin/env node

import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import admin from 'firebase-admin';

const require = createRequire(import.meta.url);
const { createOrderV2, reduceOrder } = require('../functions/src/commerce/domain/orderState');

const PROJECT = 'secondevienextjsssr';
const APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const fail = (code) => { throw new Error(code); };

if ((process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID) !== PROJECT) fail('G8_PROOF_PROJECT_MISMATCH');
if (!APP_ID || !API_KEY || !SERVICE_ACCOUNT_JSON) fail('G8_PROOF_FIXTURE_MISSING');
const serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);
if (serviceAccount.project_id !== PROJECT) fail('G8_PROOF_SERVICE_ACCOUNT_INVALID');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: PROJECT });

const db = admin.firestore();
const auth = admin.auth();
const ownerAccess = await db.collection('sys_admin_access').where('active', '==', true).where('role', '==', 'owner').limit(2).get();
if (ownerAccess.size !== 1) fail('G8_PROOF_OWNER_AMBIGUOUS');
const owner = await auth.getUser(ownerAccess.docs[0].id);
if (owner.emailVerified !== true || owner.customClaims?.admin !== true || owner.customClaims?.superAdmin !== true) fail('G8_PROOF_OWNER_INVALID');

const appCheck = await admin.appCheck().createToken(APP_ID, { ttlMillis: 30 * 60 * 1000 });
const custom = await auth.createCustomToken(owner.uid, { authMethod: 'passkey', authAssurance: 'aal2', userVerified: true });
const exchange = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Firebase-AppCheck': appCheck.token },
    body: JSON.stringify({ token: custom, returnSecureToken: true })
});
const exchanged = await exchange.json().catch(() => null);
if (!exchange.ok || !exchanged?.idToken) fail('G8_PROOF_TOKEN_EXCHANGE_FAILED');
const idToken = exchanged.idToken;

const call = async (target, data = {}) => {
    const response = await fetch(`https://europe-west1-${PROJECT}.cloudfunctions.net/${target}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${idToken}`,
            'X-Firebase-AppCheck': appCheck.token
        },
        body: JSON.stringify({ data })
    });
    const payload = await response.json().catch(() => null);
    if (response.status !== 200 || payload?.error) fail(`G8_PROOF_CALL_FAILED:${target}:${response.status}:${payload?.error?.status || 'UNKNOWN'}`);
    return payload.result;
};

const runSuffix = crypto.randomUUID().replaceAll('-', '');
const runId = `g8_fixture_${runSuffix}`;
const orderId = `ord_g8_${runSuffix}`;
const productId = `fixture_g8_${runSuffix}`;
const inventoryKey = `furniture:${productId}:default`;
const lineId = `line_g8_${runSuffix}`;
const productRef = db.doc(`artifacts/secondevie/public/data/furniture/${productId}`);
const orderRef = db.doc(`orders/${orderId}`);
const reservationRef = db.doc(`inventory_reservations/${orderId}_${inventoryKey}`);
const allocationRef = db.doc(`commerce_return_allocations/${orderId}_${lineId}`);
const productAuditRef = db.doc(`commerce_product_audits/furniture_${productId}`);
const commandIds = [];

const command = (label) => {
    const value = `g8_${label}_${crypto.randomUUID().replaceAll('-', '')}`;
    commandIds.push(value);
    return value;
};
const clock = { now: () => new Date().toISOString() };
const baseOrder = createOrderV2({
    userId: owner.uid,
    clientOrderId: `client_${runSuffix}`,
    requestHash: crypto.createHash('sha256').update(runId).digest('hex'),
    policyVersion: 'g8-fixture-policy',
    items: [{
        lineId,
        cartLineId: `cart_${runSuffix}`,
        cartRevision: 1,
        inventoryKey,
        productId,
        collectionName: 'furniture',
        variantId: null,
        titleSnapshot: 'Fixture réversible G8',
        unitAmountCents: 12300,
        quantity: 2
    }],
    shippingCents: 0,
    customerSnapshot: { email: owner.email },
    shippingSnapshot: { country: 'FR' },
    deliverySnapshot: { id: 'delivery-carrier', shippingCents: 0, policyVersion: 'g8-fixture-policy' },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    clock
});
let order = reduceOrder(baseOrder, {
    type: 'payment_succeeded',
    amountCents: baseOrder.amounts.totalCents,
    currency: 'EUR',
    paymentIntentId: `pi_fixture_${runSuffix}`
}, { clock });
order.testContext = { fixtureScopeVersion: runId, runId };

let returnId = null;
try {
    await productRef.create({
        name: 'Fixture réversible G8',
        description: 'Fixture technique non publiée et exclue du catalogue.',
        category: 'tests',
        material: 'fixture',
        status: 'draft',
        e2eOnly: true,
        stock: 0,
        sold: true,
        currentPrice: 123,
        startingPrice: 123,
        priceOnRequest: false,
        inventoryVersion: 0,
        commerceVersion: 1,
        testContext: { fixtureScopeVersion: runId, runId }
    });
    await orderRef.create(order);
    await reservationRef.create({
        schemaVersion: 2,
        orderId,
        inventoryKey,
        status: 'committed',
        reservedQty: 2,
        heldQty: 0,
        committedQty: 2,
        releasedQty: 0,
        dispositionPendingQty: 0,
        restockedQty: 0,
        writtenOffQty: 0,
        inventoryVersion: 0,
        fixtureScopeVersion: runId,
        createdAt: clock.now(),
        updatedAt: clock.now()
    });

    await call('preflightProductMutationAdminGen2');
    await call('getDeliveryPolicyAdminGen2');
    await call('listPromotionCodesAdminGen2');

    let version = order.stateVersion;
    for (const [target, data] of [
        ['markOrderPreparingAdminGen2', {}],
        ['markOrderShippedAdminGen2', { carrierCode: 'other', carrierName: 'Fixture', trackingNumber: `G8-${runSuffix.slice(0, 12)}` }],
        ['updateOrderTrackingAdminGen2', { carrierCode: 'other', carrierName: 'Fixture', trackingNumber: `G8-${runSuffix.slice(0, 12)}-U` }],
        ['markOrderDeliveredAdminGen2', {}]
    ]) {
        const result = await call(target, {
            orderId,
            expectedVersion: version,
            commandId: command(target),
            reason: 'fixture réversible G8',
            ...data
        });
        version = result.stateVersion;
    }

    const opened = await call('openReturnAdminGen2', {
        orderId,
        returnRequestId: `return_${runSuffix}`,
        requestedLines: [{ lineId, quantity: 2 }],
        reason: 'fixture réversible G8'
    });
    returnId = opened.returnCase.returnId;
    let returnVersion = opened.returnCase.stateVersion;
    for (const [target, eventLines] of [
        ['markReturnReceivedAdminGen2', [{ lineId, quantity: 2 }]],
        ['restockReturnLinesAdminGen2', [{ lineId, quantity: 1 }]],
        ['writeOffReturnLinesAdminGen2', [{ lineId, quantity: 1 }]]
    ]) {
        const result = await call(target, {
            orderId,
            returnId,
            expectedVersion: returnVersion,
            commandId: command(target),
            reason: 'fixture réversible G8',
            lines: eventLines
        });
        returnVersion = result.returnStateVersion;
    }
    const resolved = await call('resolveReturnAdminGen2', {
        orderId,
        returnId,
        expectedVersion: returnVersion,
        commandId: command('resolveReturnAdminGen2'),
        reason: 'fixture réversible G8'
    });
    if (resolved.returnStatus !== 'resolved') fail('G8_PROOF_RETURN_NOT_RESOLVED');

    const [mine, adminOrders, timeline, returns] = await Promise.all([
        call('listMyOrdersV2Gen2', { pageSize: 1 }),
        call('listOrdersAdminV2Gen2', { pageSize: 1 }),
        call('getOrderTimelineAdminV2Gen2', { orderId }),
        call('listReturnsAdminV2Gen2', { pageSize: 1 })
    ]);
    const finalOrder = (await orderRef.get()).data();
    const finalProduct = (await productRef.get()).data();
    if (!mine.orders?.some((value) => value.id === orderId)) fail('G8_PROOF_MY_ORDER_MISSING');
    if (!adminOrders.orders?.some((value) => value.id === orderId)) fail('G8_PROOF_ADMIN_ORDER_MISSING');
    if (timeline.orderId !== orderId || !Array.isArray(timeline.timeline)) fail('G8_PROOF_TIMELINE_MISSING');
    if (!returns.returns?.some((value) => value.returnId === returnId)) fail('G8_PROOF_RETURN_READER_MISSING');
    if (finalOrder.inventorySummary?.restockedQty !== 1 || finalOrder.inventorySummary?.writtenOffQty !== 1) fail('G8_PROOF_DISPOSITION_INVALID');
    if (finalProduct.stock !== 1 || finalProduct.inventoryVersion !== 1) fail('G8_PROOF_STOCK_INVALID');

    process.stdout.write(`${JSON.stringify({
        project: PROJECT,
        fixture: 'G8_REVERSIBLE_SINGLE',
        paymentCreated: false,
        refundCreated: false,
        orderDurableAfterCleanup: false,
        commandIds: commandIds.length,
        stockDeltaRestock: 1,
        writeOffQuantity: 1,
        paginationPageSize: 1,
        readersProved: 4,
        fixtureRestored: true,
        tokensPersisted: false
    })}\n`);
} finally {
    const [movementSnapshot, outboxSnapshot] = await Promise.all([
        db.collection('inventory_movements').where('orderId', '==', orderId).get(),
        db.collection('commerce_outbox').where('aggregateId', '==', orderId).get()
    ]);
    await Promise.all(movementSnapshot.docs.map((document) => document.ref.delete()));
    await Promise.all(outboxSnapshot.docs.map((document) => document.ref.delete()));
    await Promise.all(commandIds.map((id) => db.doc(`commerce_command_results/${id}`).delete()));
    await Promise.all([
        db.recursiveDelete(orderRef),
        db.recursiveDelete(productAuditRef),
        reservationRef.delete(),
        allocationRef.delete(),
        productRef.delete()
    ]);
}
