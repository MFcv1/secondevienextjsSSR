'use strict';

const { assertActionAllowed } = require('./allowedActions');
const { deterministicEffectId } = require('./commerceEffects');
const { hashPayload } = require('./idempotency');
const { deriveInventoryStatus, validateInventorySummary } = require('./inventoryInvariants');
const { reduceOrder, validateOrderV2 } = require('./orderState');
const {
    createReturnCase,
    reduceReturnCase,
    validateReturnCase
} = require('./returnCase');

function repositoryError(code, detail = null) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function snapshotExists(snapshot) {
    return typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists === true;
}

function requireDependency(value, name) {
    if (typeof value !== 'function') {
        throw repositoryError('COMMERCE_RETURN_REPOSITORY_DEPENDENCY_INVALID', name);
    }
}

function validateActor(actor) {
    if (
        !actor ||
        typeof actor.uid !== 'string' ||
        actor.uid.length < 3 ||
        actor.role !== 'admin' ||
        actor.aal2 !== true
    ) {
        throw repositoryError('COMMERCE_ACTOR_INVALID');
    }
}

function createReturnRepository({ db, refs, clock }) {
    requireDependency(db?.runTransaction, 'db.runTransaction');
    for (const name of [
        'order',
        'returnCase',
        'returnAllocation',
        'reservation',
        'product',
        'movement',
        'commandResult',
        'auditEvent'
    ]) {
        requireDependency(refs?.[name], `refs.${name}`);
    }
    requireDependency(clock?.now, 'clock.now');

    async function create({
        orderId,
        returnRequestId,
        requestedLines,
        actor,
        reason
    }) {
        validateActor(actor);
        const returnId = deterministicEffectId(['return', orderId, returnRequestId]);
        const returnRef = refs.returnCase(orderId, returnId);
        const orderRef = refs.order(orderId);
        const auditRef = refs.auditEvent(orderId, `return-opened-${returnId}`);
        const lineIds = requestedLines.map((line) => line.lineId);
        if (new Set(lineIds).size !== lineIds.length) {
            throw repositoryError('COMMERCE_RETURN_QUANTITY_INVALID');
        }
        const allocationRefs = lineIds.map((lineId) => refs.returnAllocation(orderId, lineId));
        const requestHash = hashPayload({ orderId, returnRequestId, requestedLines, reason });
        return db.runTransaction(async (transaction) => {
            const snapshots = await Promise.all([
                transaction.get(orderRef),
                transaction.get(returnRef),
                transaction.get(auditRef),
                ...allocationRefs.map((ref) => transaction.get(ref))
            ]);
            if (!snapshotExists(snapshots[0])) throw repositoryError('COMMERCE_ORDER_NOT_FOUND');
            const storedOrder = snapshots[0].data();
            validateOrderV2(storedOrder);
            const order = { ...storedOrder, id: orderId };
            assertActionAllowed(order, actor, 'open_return');
            if (snapshotExists(snapshots[1])) {
                const existing = snapshots[1].data();
                if (existing.requestHash !== requestHash) {
                    throw repositoryError('COMMERCE_RETURN_IDEMPOTENCY_CONFLICT');
                }
                return { returnCase: existing, reused: true };
            }
            if (snapshotExists(snapshots[2])) {
                throw repositoryError('COMMERCE_AUDIT_APPEND_ONLY_CONFLICT');
            }
            const nextReturn = {
                ...createReturnCase({
                    order,
                    returnRequestId,
                    requestedLines,
                    reason,
                    actor: actor.uid,
                    clock
                }),
                requestHash
            };
            const orderLines = new Map(order.items.map((line) => [line.lineId, line]));
            nextReturn.lines.forEach((line, index) => {
                const allocationSnap = snapshots[index + 3];
                const current = snapshotExists(allocationSnap)
                    ? allocationSnap.data().requestedQty
                    : 0;
                const orderLine = orderLines.get(line.lineId);
                if (
                    !Number.isSafeInteger(current) ||
                    current < 0 ||
                    current + line.requestedQty > orderLine.quantity
                ) {
                    throw repositoryError('COMMERCE_RETURN_ALLOCATION_EXCEEDED', line.lineId);
                }
                transaction.set(allocationRefs[index], {
                    schemaVersion: 2,
                    orderId,
                    lineId: line.lineId,
                    requestedQty: current + line.requestedQty,
                    updatedAt: clock.now()
                });
            });
            transaction.set(returnRef, nextReturn);
            transaction.set(auditRef, {
                schemaVersion: 2,
                eventId: `return-opened-${returnId}`,
                orderId,
                returnId,
                type: 'return_opened',
                actor,
                reason,
                requestHash,
                createdAt: clock.now()
            });
            return { returnCase: nextReturn, reused: false };
        });
    }

    async function apply({
        orderId,
        returnId,
        commandId,
        expectedVersion,
        event,
        actor,
        reason
    }) {
        validateActor(actor);
        if (
            typeof commandId !== 'string' ||
            commandId.length < 8 ||
            !Number.isSafeInteger(expectedVersion) ||
            expectedVersion < 0 ||
            typeof reason !== 'string' ||
            reason.length < 3
        ) {
            throw repositoryError('COMMERCE_RETURN_COMMAND_INVALID');
        }
        const returnRef = refs.returnCase(orderId, returnId);
        const orderRef = refs.order(orderId);
        const commandRef = refs.commandResult(commandId);
        const auditRef = refs.auditEvent(orderId, commandId);
        const payloadHash = hashPayload({ orderId, returnId, event, actorUid: actor.uid, reason });

        return db.runTransaction(async (transaction) => {
            const [returnSnap, orderSnap, commandSnap, auditSnap] = await Promise.all([
                transaction.get(returnRef),
                transaction.get(orderRef),
                transaction.get(commandRef),
                transaction.get(auditRef)
            ]);
            if (snapshotExists(commandSnap)) {
                const existing = commandSnap.data();
                if (existing.payloadHash !== payloadHash || existing.actorUid !== actor.uid) {
                    throw repositoryError('COMMERCE_IDEMPOTENCY_PAYLOAD_CONFLICT');
                }
                return existing.result;
            }
            if (
                !snapshotExists(returnSnap) ||
                !snapshotExists(orderSnap) ||
                snapshotExists(auditSnap)
            ) {
                throw repositoryError('COMMERCE_RETURN_COMMAND_INCOMPLETE');
            }
            const currentReturn = returnSnap.data();
            const storedOrder = orderSnap.data();
            validateReturnCase(currentReturn);
            validateOrderV2(storedOrder);
            if (currentReturn.stateVersion !== expectedVersion) {
                throw repositoryError('COMMERCE_STALE_VERSION');
            }
            const nextReturn = reduceReturnCase(currentReturn, event, { clock });
            let nextOrder = { ...storedOrder, id: orderId };
            const extraWrites = [];

            if (event.type === 'receive' && nextOrder.fulfillmentSummary.custody !== 'returned') {
                nextOrder = reduceOrder(nextOrder, { type: 'return_received' }, { clock });
            }
            if (['restock', 'write_off'].includes(event.type)) {
                const lineById = new Map(currentReturn.lines.map((line) => [line.lineId, line]));
                const groups = new Map();
                for (const disposition of event.lines) {
                    const line = lineById.get(disposition.lineId);
                    const group = groups.get(line.inventoryKey) || {
                        inventoryKey: line.inventoryKey,
                        quantity: 0
                    };
                    group.quantity += disposition.quantity;
                    groups.set(line.inventoryKey, group);
                }
                const entries = [...groups.values()].map((group) => {
                    const orderLine = nextOrder.items.find(
                        (line) => line.inventoryKey === group.inventoryKey
                    );
                    const movementId = deterministicEffectId([
                        'return-disposition',
                        event.type,
                        returnId,
                        commandId,
                        group.inventoryKey
                    ]);
                    return {
                        group,
                        productRef: refs.product(orderLine),
                        reservationRef: refs.reservation(orderId, group.inventoryKey),
                        movementRef: refs.movement(movementId),
                        movementId
                    };
                });
                const inventorySnapshots = await Promise.all(entries.flatMap((entry) => [
                    transaction.get(entry.productRef),
                    transaction.get(entry.reservationRef),
                    transaction.get(entry.movementRef)
                ]));
                for (let index = 0; index < entries.length; index += 1) {
                    const entry = entries[index];
                    const productSnap = inventorySnapshots[index * 3];
                    const reservationSnap = inventorySnapshots[(index * 3) + 1];
                    const movementSnap = inventorySnapshots[(index * 3) + 2];
                    if (snapshotExists(movementSnap)) {
                        throw repositoryError('COMMERCE_RETURN_MOVEMENT_ALREADY_EXISTS');
                    }
                    if (!snapshotExists(productSnap) || !snapshotExists(reservationSnap)) {
                        throw repositoryError('COMMERCE_RETURN_INVENTORY_INCOMPLETE');
                    }
                    const product = productSnap.data();
                    const reservation = { ...reservationSnap.data() };
                    if (reservation.committedQty < entry.group.quantity) {
                        throw repositoryError('COMMERCE_RETURN_DISPOSITION_EXCEEDED');
                    }
                    reservation.committedQty -= entry.group.quantity;
                    if (event.type === 'restock') {
                        reservation.restockedQty += entry.group.quantity;
                    } else {
                        reservation.writtenOffQty += entry.group.quantity;
                    }
                    reservation.stateVersion += 1;
                    reservation.updatedAt = clock.now();
                    const inventoryVersion = product.inventoryVersion ?? 0;
                    reservation.inventoryVersion = inventoryVersion +
                        (event.type === 'restock' ? 1 : 0);
                    reservation.status = deriveInventoryStatus(reservation);
                    validateInventorySummary(reservation);
                    if (event.type === 'restock') {
                        extraWrites.push(() => transaction.update(entry.productRef, {
                            stock: product.stock + entry.group.quantity,
                            inventoryVersion: inventoryVersion + 1
                        }));
                    }
                    extraWrites.push(() => transaction.set(entry.reservationRef, reservation));
                    extraWrites.push(() => transaction.set(entry.movementRef, {
                        schemaVersion: 2,
                        effectId: entry.movementId,
                        orderId,
                        returnId,
                        inventoryKey: entry.group.inventoryKey,
                        type: event.type === 'restock' ? 'return_restock' : 'return_write_off',
                        quantity: entry.group.quantity,
                        availableDelta: event.type === 'restock' ? entry.group.quantity : 0,
                        commandId,
                        actor: actor.uid,
                        reason,
                        payloadHash,
                        createdAt: clock.now()
                    }));
                }
                const total = event.lines.reduce((sum, line) => sum + line.quantity, 0);
                nextOrder = reduceOrder(nextOrder, {
                    type: event.type === 'restock' ? 'return_restocked' : 'return_written_off',
                    quantity: total
                }, { clock });
            }
            if (event.type === 'cancel') {
                const allocationRefs = currentReturn.lines.map(
                    (line) => refs.returnAllocation(orderId, line.lineId)
                );
                const allocationSnapshots = await Promise.all(
                    allocationRefs.map((ref) => transaction.get(ref))
                );
                currentReturn.lines.forEach((line, index) => {
                    const snapshot = allocationSnapshots[index];
                    if (!snapshotExists(snapshot)) {
                        throw repositoryError('COMMERCE_RETURN_ALLOCATION_MISSING');
                    }
                    const allocation = snapshot.data();
                    if (allocation.requestedQty < line.requestedQty) {
                        throw repositoryError('COMMERCE_RETURN_ALLOCATION_CONFLICT');
                    }
                    extraWrites.push(() => transaction.set(allocationRefs[index], {
                        ...allocation,
                        requestedQty: allocation.requestedQty - line.requestedQty,
                        updatedAt: clock.now()
                    }));
                });
            }

            const result = {
                orderId,
                returnId,
                commandId,
                returnStateVersion: nextReturn.stateVersion,
                returnStatus: nextReturn.status,
                orderStateVersion: nextOrder.stateVersion
            };
            transaction.set(returnRef, nextReturn);
            transaction.set(orderRef, stripId(nextOrder));
            for (const write of extraWrites) write();
            transaction.set(commandRef, {
                schemaVersion: 2,
                commandId,
                orderId,
                actorUid: actor.uid,
                payloadHash,
                result,
                createdAt: clock.now()
            });
            transaction.set(auditRef, {
                schemaVersion: 2,
                eventId: commandId,
                orderId,
                returnId,
                type: `return_${event.type}`,
                actor,
                reason,
                payloadHash,
                returnVersionBefore: currentReturn.stateVersion,
                returnVersionAfter: nextReturn.stateVersion,
                orderVersionBefore: storedOrder.stateVersion,
                orderVersionAfter: nextOrder.stateVersion,
                createdAt: clock.now()
            });
            return result;
        });
    }

    return Object.freeze({ apply, create });
}

function stripId(value) {
    const { id: _ignoredId, ...document } = value;
    return document;
}

module.exports = { createReturnRepository };
