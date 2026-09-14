'use strict';

const { hashPayload, validateCommand } = require('./idempotency');
const { assertProductIdentity, assertStrongAdmin, applyProductAction } = require('./productCommands');
const { validateInventorySummary } = require('./inventoryInvariants');
const { validateOrderV2 } = require('./orderState');
const { normalizeCommerceControl } = require('./policy');

const SANDBOX_PROJECT = 'secondevienextjsssr';
const RESERVATION_LIMIT = 50;

function refuse(reason) {
    const code = `COMMERCE_SANDBOX_RESTOCK_${reason}`;
    throw Object.assign(new Error(code), { code });
}

// No provider call, expiration override or synthetic return. This credit only
// prevents a later physical disposition from adding the same test unit twice.
function createSandboxInventoryRepository({ db, appId, projectId, clock }) {
    return {
        async restore({ productId, collectionName = 'furniture', command, expectedInventoryVersion, actor }) {
            assertStrongAdmin(actor);
            assertProductIdentity(collectionName, productId);
            validateCommand(command);
            if (projectId !== SANDBOX_PROJECT || appId !== 'secondevie') refuse('ENVIRONMENT');
            if (!/^[A-Za-z0-9_-]{8,160}$/.test(command.commandId)) refuse('INVALID');
            const payloadHash = hashPayload({ productId, collectionName, actorUid: actor.uid,
                expectedVersion: command.expectedVersion, expectedInventoryVersion });
            const productRef = db.doc(`artifacts/${appId}/public/data/${collectionName}/${productId}`);
            const resultRef = db.doc(`commerce_command_results/${command.commandId}`);
            const auditRef = db.doc(`commerce_product_audits/${collectionName}_${productId}/events/${command.commandId}`);
            const movementRef = db.doc(`inventory_movements/sandbox-restock-${command.commandId}`);

            return db.runTransaction(async transaction => {
                const [resultSnap, productSnap, controlSnap, auditSnap, movementSnap] = await Promise.all([
                    transaction.get(resultRef), transaction.get(productRef),
                    transaction.get(db.doc('sys_commerce_control/current')),
                    transaction.get(auditRef), transaction.get(movementRef)
                ]);
                const control = normalizeCommerceControl(controlSnap.exists ? controlSnap.data() : null);
                if (control.newCheckoutMode !== 'v2_all' || control.adminMutationMode !== 'v2'
                    || control.offlinePaymentMode !== 'off') refuse('ENVIRONMENT');
                if (resultSnap.exists) {
                    const previous = resultSnap.data();
                    if (previous.action !== 'restore_sandbox_inventory' || previous.payloadHash !== payloadHash
                        || previous.actorUid !== actor.uid) refuse('CONFLICT');
                    return previous.result;
                }
                if (auditSnap.exists || movementSnap.exists) refuse('CONFLICT');
                if (!productSnap.exists) refuse('INVALID');
                const product = productSnap.data();
                if (product.stock !== 0 || product.status !== 'published') refuse('NOT_EMPTY');
                if ((product.commerceVersion ?? 0) !== command.expectedVersion
                    || (product.inventoryVersion ?? 0) !== expectedInventoryVersion) refuse('STALE');

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

                const now = clock.now();
                const reason = 'Remise en stock sandbox après vente test confirmée';
                const next = applyProductAction({ action: 'adjust_inventory', product,
                    payload: { delta: 1, expectedInventoryVersion }, actor, reason, now });
                next.availability = 'available';
                const reservation = { ...sale.data, sandboxRestockCreditQty: 1,
                    stateVersion: sale.data.stateVersion + 1, updatedAt: now };
                validateInventorySummary(reservation);
                const result = { productId, orderId, commandId: command.commandId, stock: 1,
                    commerceVersion: next.commerceVersion, inventoryVersion: next.inventoryVersion };
                transaction.set(productRef, next);
                transaction.set(sale.ref, reservation);
                transaction.set(movementRef, {
                    schemaVersion: 2, effectId: movementRef.id, orderId,
                    inventoryKey: sale.data.inventoryKey, type: 'sandbox_restock',
                    quantity: 1, availableDelta: 1, commandId: command.commandId,
                    inventoryVersionBefore: expectedInventoryVersion,
                    inventoryVersionAfter: next.inventoryVersion,
                    actor: actor.uid, reason, payloadHash, createdAt: now
                });
                transaction.set(auditRef, {
                    schemaVersion: 2, eventId: command.commandId, productId, collectionName, orderId,
                    action: 'restore_sandbox_inventory', actor, reason, payloadHash,
                    stockBefore: 0, stockAfter: 1,
                    commerceVersionBefore: product.commerceVersion ?? 0,
                    commerceVersionAfter: next.commerceVersion,
                    inventoryVersionBefore: expectedInventoryVersion,
                    inventoryVersionAfter: next.inventoryVersion, createdAt: now
                });
                transaction.set(resultRef, {
                    schemaVersion: 2, commandId: command.commandId, productId,
                    action: 'restore_sandbox_inventory', actorUid: actor.uid,
                    payloadHash, result, createdAt: now
                });
                return result;
            });
        }
    };
}

module.exports = { createSandboxInventoryRepository };
