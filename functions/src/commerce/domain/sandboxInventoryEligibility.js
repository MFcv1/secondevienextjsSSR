'use strict';

const { assertProductIdentity, assertStrongAdmin } = require('./productCommands');
const { validateInventorySummary } = require('./inventoryInvariants');
const { validateOrderV2 } = require('./orderState');
const { normalizeCommerceControl } = require('./policy');

function refuse(reason) {
    const code = `COMMERCE_SANDBOX_RESTOCK_${reason}`;
    throw Object.assign(new Error(code), { code });
}

async function readSandboxRestockSale({ transaction, db, productId, collectionName, expectedInventoryVersion }) {
    const RESERVATION_LIMIT = 50;
    const page = await transaction.get(db.collection('inventory_reservations')
        .where('productId', '==', productId).limit(RESERVATION_LIMIT + 1));
    if (page.docs.length > RESERVATION_LIMIT) refuse('INCOMPLETE');
    const reservations = page.docs.map(doc => ({ ref: doc.ref, data: doc.data() }))
        .filter(entry => entry.data.collectionName === collectionName);
    for (const { data } of reservations) {
        validateInventorySummary(data);
        if (data.status === 'conflict' || !Number.isSafeInteger(data.stateVersion)
            || data.stateVersion < 0 || !Number.isSafeInteger(data.inventoryVersion)
            || data.inventoryVersion < 0) refuse('INCOMPLETE');
        // Even an overdue hold belongs to the expiry engine until released.
        if (data.heldQty > 0) refuse('RESERVED');
    }
    const candidates = reservations.filter(({ data }) => data.committedQty === 1
        && data.inventoryVersion === expectedInventoryVersion
        && (data.sandboxRestockCreditQty ?? 0) === 0);
    if (candidates.length !== 1) refuse('NO_SALE');
    const sale = candidates[0];
    if (sale.data.dispositionPendingQty > 0) refuse('RETURN_PENDING');
    const orderId = sale.data.orderId;
    if (typeof orderId !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/.test(orderId)) refuse('NO_SALE');
    const orderSnap = await transaction.get(db.doc(`orders/${orderId}`));
    if (!orderSnap.exists) refuse('NO_SALE');
    const order = orderSnap.data();
    validateOrderV2(order);
    if (order.payment.provider !== 'stripe' || order.payment.status !== 'succeeded'
        || order.checkout.closeReason !== 'paid' || order.amounts.capturedCents <= 0
        || !order.payment.paymentIntentId) refuse('NO_SALE');
    if (order.refundAggregate.status !== 'none') refuse('RETURN_PENDING');
    const accountId = order.payment.connectedAccountId;
    if (typeof accountId !== 'string' || !/^acct_[A-Za-z0-9]+$/.test(accountId)) refuse('ENVIRONMENT');
    const line = order.items.find(item => item.inventoryKey === sale.data.inventoryKey
        && item.productId === productId && item.collectionName === collectionName);
    if (!line || line.quantity !== 1) refuse('NO_SALE');
    const [accountSnap, returnsSnap] = await Promise.all([
        transaction.get(db.doc(`commerce_connect_accounts/${accountId}`)),
        transaction.get(db.collection(`orders/${orderId}/returns`).limit(1))
    ]);
    if (!accountSnap.exists || accountSnap.data().livemode !== false) refuse('ENVIRONMENT');
    if (returnsSnap.docs.length) refuse('RETURN_PENDING');

    return { sale, orderId };
}

async function inspectSandboxRestock({ db, appId, projectId, actor, productId,
    collectionName = 'furniture', expectedVersion, expectedInventoryVersion }) {
    assertStrongAdmin(actor);
    assertProductIdentity(collectionName, productId);
    if (projectId !== 'secondevienextjsssr' || appId !== 'secondevie') refuse('ENVIRONMENT');
    return db.runTransaction(async transaction => {
        const [productSnap, controlSnap] = await Promise.all([
            transaction.get(db.doc(`artifacts/${appId}/public/data/${collectionName}/${productId}`)),
            transaction.get(db.doc('sys_commerce_control/current')),
        ]);
        const control = normalizeCommerceControl(controlSnap.exists ? controlSnap.data() : null);
        if (control.newCheckoutMode !== 'v2_all' || control.adminMutationMode !== 'v2'
            || control.offlinePaymentMode !== 'off') refuse('ENVIRONMENT');
        if (!productSnap.exists) refuse('INVALID');
        const product = productSnap.data();
        if (product.stock !== 0 || product.status !== 'published') refuse('NOT_EMPTY');
        if ((product.commerceVersion ?? 0) !== expectedVersion
            || (product.inventoryVersion ?? 0) !== expectedInventoryVersion) refuse('STALE');
        await readSandboxRestockSale({ transaction, db, productId, collectionName, expectedInventoryVersion });
        return { eligible: true };
    }, { readOnly: true });
}

module.exports = { readSandboxRestockSale, inspectSandboxRestock };
