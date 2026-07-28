'use strict';

const {
    buildFinancialFact,
    buildOutboxIntent,
    deterministicEffectId
} = require('./commerceEffects');
const { hashPayload } = require('./idempotency');
const { deriveInventoryStatus, validateInventorySummary } = require('./inventoryInvariants');
const { reduceOrder, validateOrderV2 } = require('./orderState');
const { buildCommerceIncident, reconcilePaymentIntent } = require('./reconcilePayment');
const { effectIdFor } = require('./reservationRepository');
const { validatePaymentIntentForOrder } = require('./checkoutSaga');

function applierError(code, detail = null) {
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
        throw applierError('COMMERCE_PAYMENT_APPLIER_DEPENDENCY_INVALID', name);
    }
}

function inventoryGroups(order) {
    const groups = new Map();
    for (const line of order.items) {
        const group = groups.get(line.inventoryKey) || {
            inventoryKey: line.inventoryKey,
            productId: line.productId,
            collectionName: line.collectionName,
            variantId: line.variantId,
            quantity: 0
        };
        group.quantity += line.quantity;
        groups.set(line.inventoryKey, group);
    }
    return [...groups.values()].sort(
        (left, right) => left.inventoryKey.localeCompare(right.inventoryKey)
    );
}

function stripDocumentId(value) {
    const { id: _ignoredId, ...document } = value;
    return document;
}

function effectiveAt(paymentIntent, clock) {
    if (Number.isSafeInteger(paymentIntent.created) && paymentIntent.created > 0) {
        return new Date(paymentIntent.created * 1000).toISOString();
    }
    return clock.now();
}

function createPaymentEffectApplier({ refs, clock }) {
    for (const name of [
        'order',
        'reservation',
        'product',
        'movement',
        'incident',
        'financialFact',
        'outbox'
    ]) {
        requireDependency(refs?.[name], `refs.${name}`);
    }
    requireDependency(clock?.now, 'clock.now');

    async function persistIncident(transaction, {
        code,
        orderId,
        paymentIntent,
        details = null,
        order = null
    }) {
        const incidentId = deterministicEffectId([
            'incident',
            code,
            orderId || 'orphan',
            paymentIntent.id || 'unknown'
        ]);
        const incidentRef = refs.incident(incidentId);
        const incidentSnap = await transaction.get(incidentRef);
        if (!snapshotExists(incidentSnap)) {
            transaction.set(incidentRef, {
                ...buildCommerceIncident({
                    code,
                    orderId,
                    providerObjectId: paymentIntent.id || null,
                    details,
                    clock
                }),
                incidentId
            });
        }
        if (order) transaction.set(refs.order(orderId), stripDocumentId(order));
        return { action: 'incident', incidentId, order };
    }

    async function apply(transaction, { entry, paymentIntent }) {
        if (!transaction || typeof transaction.get !== 'function' || typeof transaction.set !== 'function') {
            throw applierError('COMMERCE_PAYMENT_APPLIER_TRANSACTION_INVALID');
        }
        const orderId = paymentIntent?.metadata?.orderId;
        if (typeof orderId !== 'string' || orderId.length < 8) {
            return persistIncident(transaction, {
                code: paymentIntent?.status === 'succeeded'
                    ? 'paid_payment_intent_orphan'
                    : 'payment_intent_orphan',
                orderId: null,
                paymentIntent: paymentIntent || {}
            });
        }
        const orderRef = refs.order(orderId);
        const orderSnap = await transaction.get(orderRef);
        if (!snapshotExists(orderSnap)) {
            return persistIncident(transaction, {
                code: paymentIntent.status === 'succeeded'
                    ? 'paid_payment_intent_orphan'
                    : 'payment_intent_orphan',
                orderId,
                paymentIntent
            });
        }
        const storedOrder = orderSnap.data();
        validateOrderV2(storedOrder);
        const order = { ...storedOrder, id: orderId };

        try {
            validatePaymentIntentForOrder(paymentIntent, order, {
                connectedAccountId: order.payment.connectedAccountId
            });
            const eventAccountId = entry?.scope === 'connect' ? entry.accountId : null;
            if (eventAccountId !== (order.payment.connectedAccountId || null)) {
                throw applierError('COMMERCE_CONNECT_PIN_MISMATCH');
            }
        } catch (cause) {
            const reviewed = reduceOrder(order, {
                type: 'mark_needs_review',
                reason: cause?.code || 'payment_intent_mismatch'
            }, { clock });
            return persistIncident(transaction, {
                code: 'payment_intent_mismatch',
                orderId,
                paymentIntent,
                details: {
                    reason: cause?.code || 'unknown',
                    fields: cause?.detail || null
                },
                order: reviewed
            });
        }

        const reconciliation = reconcilePaymentIntent({ order, paymentIntent, clock });
        if (reconciliation.action === 'incident') {
            return persistIncident(transaction, {
                code: reconciliation.incident.code,
                orderId,
                paymentIntent,
                details: reconciliation.incident.details,
                order: reconciliation.order
            });
        }
        if (reconciliation.action === 'keep_hold') {
            if (reconciliation.order !== order) {
                transaction.set(orderRef, stripDocumentId(reconciliation.order));
            }
            return { action: 'keep_hold', order: reconciliation.order };
        }

        const movementType = reconciliation.action === 'commit' ? 'commit' : 'release';
        const groups = inventoryGroups(order);
        const entries = groups.map((group) => ({
            group,
            reservationRef: refs.reservation(orderId, group.inventoryKey),
            productRef: refs.product(group),
            movementId: effectIdFor(movementType, orderId, group.inventoryKey)
        }));
        for (const entryValue of entries) {
            entryValue.movementRef = refs.movement(entryValue.movementId);
        }

        let fact = null;
        let outbox = null;
        let factRef = null;
        let outboxRef = null;
        if (movementType === 'commit') {
            fact = buildFinancialFact({
                orderId,
                type: 'capture',
                amountCents: paymentIntent.amount,
                currency: String(paymentIntent.currency).toUpperCase(),
                connectedAccountId: order.payment.connectedAccountId,
                providerObjectId: paymentIntent.id,
                effectiveAt: effectiveAt(paymentIntent, clock),
                commandId: `payment-intent:${paymentIntent.id}`
            });
            if (order.testContext) fact = { ...fact, testContext: { ...order.testContext } };
            outbox = buildOutboxIntent({
                effectId: fact.effectId,
                aggregateType: 'order',
                aggregateId: orderId,
                effectType: 'payment_succeeded',
                template: 'order-paid',
                recipientRole: 'customer',
                recipientHash: hashPayload({
                    email: order.customerSnapshot?.email || null,
                    ownerUid: order.userId
                }),
                payloadSnapshot: {
                    orderId,
                    amountCents: paymentIntent.amount,
                    currency: String(paymentIntent.currency).toUpperCase()
                },
                clock
            });
            if (order.testContext) outbox = { ...outbox, testContext: { ...order.testContext } };
            factRef = refs.financialFact(fact.effectId);
            outboxRef = refs.outbox(outbox.outboxId);
        }

        const reads = [];
        for (const entryValue of entries) {
            reads.push(transaction.get(entryValue.reservationRef));
            reads.push(transaction.get(entryValue.productRef));
            reads.push(transaction.get(entryValue.movementRef));
        }
        if (factRef) reads.push(transaction.get(factRef));
        if (outboxRef) reads.push(transaction.get(outboxRef));
        const snapshots = await Promise.all(reads);
        const now = clock.now();

        for (let index = 0; index < entries.length; index += 1) {
            const entryValue = entries[index];
            const reservationSnap = snapshots[index * 3];
            const productSnap = snapshots[(index * 3) + 1];
            const movementSnap = snapshots[(index * 3) + 2];
            if (snapshotExists(movementSnap)) {
                const existing = movementSnap.data();
                if (
                    existing.type !== movementType ||
                    existing.orderId !== orderId ||
                    existing.inventoryKey !== entryValue.group.inventoryKey ||
                    existing.quantity !== entryValue.group.quantity
                ) {
                    throw applierError('COMMERCE_MOVEMENT_IDEMPOTENCY_CONFLICT');
                }
                continue;
            }
            if (!snapshotExists(reservationSnap) || !snapshotExists(productSnap)) {
                throw applierError('COMMERCE_PAYMENT_INVENTORY_INCOMPLETE');
            }
            const reservation = { ...reservationSnap.data() };
            const product = productSnap.data();
            const inventoryVersion = product.inventoryVersion ?? 0;
            if (
                reservation.orderId !== orderId ||
                reservation.inventoryKey !== entryValue.group.inventoryKey ||
                reservation.heldQty !== entryValue.group.quantity ||
                !Number.isSafeInteger(product.stock) ||
                product.stock < 0 ||
                !Number.isSafeInteger(inventoryVersion) ||
                inventoryVersion < 0
            ) {
                throw applierError('COMMERCE_PAYMENT_INVENTORY_CONFLICT');
            }
            reservation.heldQty = 0;
            reservation.stateVersion += 1;
            reservation.updatedAt = now;
            let availableDelta = 0;
            if (movementType === 'commit') {
                reservation.committedQty += entryValue.group.quantity;
            } else {
                reservation.releasedQty += entryValue.group.quantity;
                availableDelta = entryValue.group.quantity;
            }
            reservation.inventoryVersion = inventoryVersion + (availableDelta === 0 ? 0 : 1);
            reservation.status = deriveInventoryStatus(reservation);
            validateInventorySummary(reservation);

            if (availableDelta !== 0) {
                transaction.update(entryValue.productRef, {
                    stock: product.stock + availableDelta,
                    inventoryVersion: inventoryVersion + 1
                });
            }
            transaction.set(entryValue.reservationRef, reservation);
            transaction.set(entryValue.movementRef, {
                schemaVersion: 2,
                effectId: entryValue.movementId,
                reservationId: `${orderId}_${entryValue.group.inventoryKey}`,
                orderId,
                inventoryKey: entryValue.group.inventoryKey,
                type: movementType,
                quantity: entryValue.group.quantity,
                availableDelta,
                inventoryVersionBefore: inventoryVersion,
                inventoryVersionAfter: inventoryVersion + (availableDelta === 0 ? 0 : 1),
                commandId: `payment-intent:${paymentIntent.id}`,
                actor: 'stripe_reconciler',
                reason: `payment_intent_${paymentIntent.status}`,
                payloadHash: hashPayload({
                    type: movementType,
                    orderId,
                    inventoryKey: entryValue.group.inventoryKey,
                    quantity: entryValue.group.quantity,
                    paymentIntentId: paymentIntent.id
                }),
                ...(order.testContext ? { testContext: { ...order.testContext } } : {}),
                createdAt: now
            });
        }

        const factOffset = entries.length * 3;
        if (factRef) {
            const factSnap = snapshots[factOffset];
            if (snapshotExists(factSnap)) {
                const existingFact = factSnap.data();
                if (
                    existingFact.effectId !== fact.effectId ||
                    existingFact.orderId !== fact.orderId ||
                    existingFact.providerObjectId !== fact.providerObjectId ||
                    existingFact.amountCents !== fact.amountCents ||
                    existingFact.currency !== fact.currency
                ) {
                    throw applierError('COMMERCE_FINANCIAL_FACT_IDEMPOTENCY_CONFLICT');
                }
            } else {
                transaction.set(factRef, fact);
            }
        }
        if (outboxRef) {
            const outboxSnap = snapshots[factOffset + 1];
            if (snapshotExists(outboxSnap)) {
                const existingOutbox = outboxSnap.data();
                if (
                    existingOutbox.outboxId !== outbox.outboxId ||
                    existingOutbox.effectId !== outbox.effectId ||
                    existingOutbox.payloadHash !== outbox.payloadHash
                ) {
                    throw applierError('COMMERCE_OUTBOX_IDEMPOTENCY_CONFLICT');
                }
            } else {
                transaction.set(outboxRef, outbox);
            }
        }
        transaction.set(orderRef, stripDocumentId(reconciliation.order));
        return {
            action: reconciliation.action,
            order: reconciliation.order,
            financialFactId: fact?.effectId || null,
            outboxId: outbox?.outboxId || null
        };
    }

    return Object.freeze({ apply });
}

module.exports = { createPaymentEffectApplier };
