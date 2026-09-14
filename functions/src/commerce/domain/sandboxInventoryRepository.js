'use strict';

const { hashPayload, validateCommand } = require('./idempotency');
const { assertProductIdentity, assertStrongAdmin, applyProductAction } = require('./productCommands');
const { validateInventorySummary } = require('./inventoryInvariants');
const { readSandboxRestockSale } = require('./sandboxInventoryEligibility');
const { normalizeCommerceControl } = require('./policy');

const SANDBOX_PROJECT = 'secondevienextjsssr';

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

                const { sale, orderId } = await readSandboxRestockSale({
                    transaction, db, productId, collectionName, expectedInventoryVersion
                });

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
