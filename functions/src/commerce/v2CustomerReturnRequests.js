'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { APP_ID } = require('../../helpers/config');
const {
    checkActiveStrongAdmin,
    normalizeFirestoreId
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const { STRIPE_SECRET_KEY } = require('../../helpers/secrets');
const { withCommerceMutationsEnabled } = require('./v2ControlGuard');
const {
    buildOutboxIntent,
    deterministicEffectId
} = require('./domain/commerceEffects');
const {
    createCustomerReturnRequest,
    transitionCustomerReturnRequest,
    validateCustomerReturnRequest
} = require('./domain/customerReturnRequest');
const { hashPayload } = require('./domain/idempotency');
const { validateOrderV2 } = require('./domain/orderState');
const {
    createRefundRuntime,
    createReturnRuntime
} = require('./domain/v2Runtime');

const CUSTOMER_REASONS = new Set([
    'changed_mind',
    'damaged',
    'not_as_expected',
    'other'
]);

function clock() {
    return {
        now: () => new Date().toISOString(),
        nowMillis: () => Date.now()
    };
}

function snapshotExists(snapshot) {
    return typeof snapshot?.exists === 'function'
        ? snapshot.exists()
        : snapshot?.exists === true;
}

function normalizeReason(value) {
    if (typeof value !== 'string' || !CUSTOMER_REASONS.has(value)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Motif de demande invalide.'
        );
    }
    return value;
}

function normalizeNote(value) {
    const note = String(value || '').trim();
    if (note.length > 1000) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Le commentaire est trop long.'
        );
    }
    return note;
}

function normalizeLines(value) {
    if (!Array.isArray(value) || value.length < 1 || value.length > 50) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Articles demandes invalides.'
        );
    }
    const seen = new Set();
    return value.map((line) => {
        const lineId = normalizeFirestoreId(line?.lineId, 'Article');
        if (
            seen.has(lineId) ||
            !Number.isSafeInteger(line?.quantity) ||
            line.quantity <= 0
        ) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Articles demandes invalides.'
            );
        }
        seen.add(lineId);
        return { lineId, quantity: line.quantity };
    });
}

function normalizeDecision(value) {
    if (!['refund_now', 'authorize_return', 'refund_after_return', 'reject'].includes(value)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Decision de retour invalide.'
        );
    }
    return value;
}

function normalizeDecisionReason(value) {
    const reason = String(value || '').trim();
    if (reason.length < 3 || reason.length > 500) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Motif de decision invalide.'
        );
    }
    return reason;
}

function customerContext(context) {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentification requise.'
        );
    }
    return { uid: context.auth.uid };
}

function requestRefs(db, orderId, requestId) {
    return {
        order: db.doc(`orders/${orderId}`),
        request: db.doc(`orders/${orderId}/customer_return_requests/${requestId}`),
        audit: db.doc(`orders/${orderId}/events/customer-return-requested-${requestId}`)
    };
}

function validateRequestedLines(order, requestedLines) {
    const orderLines = new Map(order.items.map((line) => [line.lineId, line]));
    for (const line of requestedLines) {
        const orderLine = orderLines.get(line.lineId);
        if (!orderLine || line.quantity > orderLine.quantity) {
            const error = new Error('COMMERCE_CUSTOMER_RETURN_REQUEST_LINES_INVALID');
            error.code = 'COMMERCE_CUSTOMER_RETURN_REQUEST_LINES_INVALID';
            throw error;
        }
    }
}

function calculateRequestedRefundAmount(order, requestedLines) {
    const remainingCents = order.amounts.capturedCents
        - order.refundAggregate.succeededCents
        - order.refundAggregate.pendingCents;
    if (!Number.isSafeInteger(remainingCents) || remainingCents <= 0) return 0;

    const requestedByLine = new Map(
        requestedLines.map((line) => [line.lineId, line.quantity])
    );
    const coversWholeOrder = order.items.every(
        (line) => requestedByLine.get(line.lineId) === line.quantity
    );
    if (coversWholeOrder) return remainingCents;

    const requestedItemsCents = order.items.reduce((sum, line) => {
        const quantity = requestedByLine.get(line.lineId) || 0;
        return sum + (line.unitAmountCents * quantity);
    }, 0);
    return Math.min(requestedItemsCents, remainingCents);
}

function mapError(error) {
    if (error instanceof functions.https.HttpsError) return error;
    const code = String(error?.code || '');
    if (code.includes('NOT_FOUND')) {
        return new functions.https.HttpsError('not-found', 'Commande ou demande introuvable.');
    }
    if (code.includes('ACCESS') || code.includes('ACTOR')) {
        return new functions.https.HttpsError('permission-denied', 'Action non autorisee.');
    }
    if (
        code.includes('TRANSITION') ||
        code.includes('CUSTODY') ||
        code.includes('RETURN_NOT_RESOLVED') ||
        code.includes('IDEMPOTENCY') ||
        code.includes('ACTION_NOT_ALLOWED')
    ) {
        return new functions.https.HttpsError(
            'failed-precondition',
            'Cette demande ne peut pas etre traitee dans son etat actuel.',
            { reason: code }
        );
    }
    if (code.startsWith('COMMERCE_')) {
        return new functions.https.HttpsError(
            'invalid-argument',
            'Demande de retour invalide.',
            { reason: code }
        );
    }
    return new functions.https.HttpsError(
        'internal',
        'La demande de retour n a pas pu etre traitee.'
    );
}

function createCustomerReturnRequestHandler({
    authorize = customerContext,
    dbFactory = () => admin.firestore(),
    requestClock = clock()
} = {}) {
    return async (data, context) => {
        try {
            const actor = authorize(context);
            const orderId = normalizeFirestoreId(data?.orderId, 'Commande');
            const requestId = normalizeFirestoreId(data?.requestId, 'Demande');
            const requestedLines = normalizeLines(data?.lines);
            const reason = normalizeReason(data?.reason);
            const note = normalizeNote(data?.note);
            const db = dbFactory();
            const refs = requestRefs(db, orderId, requestId);
            const effectId = deterministicEffectId([
                'customer-return-requested',
                orderId,
                requestId
            ]);
            const requestHash = hashPayload({
                orderId,
                requestId,
                requestedLines,
                reason,
                note,
                userId: actor.uid
            });
            const outbox = buildOutboxIntent({
                effectId,
                aggregateType: 'customer_return_request',
                aggregateId: orderId,
                effectType: 'customer_return_requested',
                template: 'customer-return-requested-admin',
                recipientRole: 'admin',
                recipientHash: hashPayload({ role: 'admin', channel: 'transactional-sender' }),
                payloadSnapshot: { orderId, requestId, reason },
                clock: requestClock
            });
            const outboxRef = db.doc(`commerce_outbox/${outbox.outboxId}`);
            return await db.runTransaction(async (transaction) => {
                const [orderSnapshot, requestSnapshot, auditSnapshot, outboxSnapshot] = await Promise.all([
                    transaction.get(refs.order),
                    transaction.get(refs.request),
                    transaction.get(refs.audit),
                    transaction.get(outboxRef)
                ]);
                if (!snapshotExists(orderSnapshot)) {
                    const error = new Error('COMMERCE_ORDER_NOT_FOUND');
                    error.code = 'COMMERCE_ORDER_NOT_FOUND';
                    throw error;
                }
                const storedOrder = orderSnapshot.data();
                validateOrderV2(storedOrder);
                const order = { ...storedOrder, id: orderId };
                if (order.userId !== actor.uid) {
                    const error = new Error('COMMERCE_CUSTOMER_RETURN_REQUEST_ACCESS_DENIED');
                    error.code = 'COMMERCE_CUSTOMER_RETURN_REQUEST_ACCESS_DENIED';
                    throw error;
                }
                if (
                    order.payment.status !== 'succeeded' ||
                    order.refundAggregate.status === 'full'
                ) {
                    const error = new Error('COMMERCE_CUSTOMER_RETURN_REQUEST_NOT_ALLOWED');
                    error.code = 'COMMERCE_CUSTOMER_RETURN_REQUEST_NOT_ALLOWED';
                    throw error;
                }
                validateRequestedLines(order, requestedLines);
                if (snapshotExists(requestSnapshot)) {
                    const existing = requestSnapshot.data();
                    validateCustomerReturnRequest(existing);
                    if (existing.requestHash !== requestHash) {
                        const error = new Error('COMMERCE_CUSTOMER_RETURN_REQUEST_IDEMPOTENCY_CONFLICT');
                        error.code = 'COMMERCE_CUSTOMER_RETURN_REQUEST_IDEMPOTENCY_CONFLICT';
                        throw error;
                    }
                    return { request: existing, reused: true };
                }
                const request = createCustomerReturnRequest({
                    requestId,
                    order,
                    lines: requestedLines,
                    reason,
                    note,
                    requestHash,
                    clock: requestClock
                });
                transaction.set(refs.request, request);
                if (!snapshotExists(auditSnapshot)) {
                    transaction.set(refs.audit, {
                        schemaVersion: 2,
                        eventId: `customer-return-requested-${requestId}`,
                        orderId,
                        type: 'customer_return_requested',
                        actor: { uid: actor.uid, role: 'customer', aal2: false },
                        requestId,
                        reason,
                        createdAt: requestClock.now()
                    });
                }
                if (!snapshotExists(outboxSnapshot)) transaction.set(outboxRef, outbox);
                return { request, reused: false };
            });
        } catch (error) {
            throw mapError(error);
        }
    };
}

async function loadDecisionContext(db, orderId, requestId) {
    const refs = requestRefs(db, orderId, requestId);
    const [orderSnapshot, requestSnapshot] = await Promise.all([
        refs.order.get(),
        refs.request.get()
    ]);
    if (!orderSnapshot.exists || !requestSnapshot.exists) {
        const error = new Error('COMMERCE_CUSTOMER_RETURN_REQUEST_NOT_FOUND');
        error.code = 'COMMERCE_CUSTOMER_RETURN_REQUEST_NOT_FOUND';
        throw error;
    }
    const order = { ...orderSnapshot.data(), id: orderId };
    const request = requestSnapshot.data();
    validateOrderV2(order);
    validateCustomerReturnRequest(request);
    return { refs, order, request };
}

async function persistDecision(db, ref, currentRequest, event, decisionClock) {
    return db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) {
            const error = new Error('COMMERCE_CUSTOMER_RETURN_REQUEST_NOT_FOUND');
            error.code = 'COMMERCE_CUSTOMER_RETURN_REQUEST_NOT_FOUND';
            throw error;
        }
        const latest = snapshot.data();
        validateCustomerReturnRequest(latest);
        if (latest.stateVersion !== currentRequest.stateVersion) {
            if (
                event.type === 'authorize_return' &&
                latest.returnId === event.returnId
            ) return latest;
            if (
                event.type === 'refund_started' &&
                latest.refundRequestId === event.refundRequestId
            ) return latest;
            const error = new Error('COMMERCE_CUSTOMER_RETURN_REQUEST_STALE');
            error.code = 'COMMERCE_CUSTOMER_RETURN_REQUEST_TRANSITION_DENIED';
            throw error;
        }
        const next = transitionCustomerReturnRequest(latest, event, {
            clock: decisionClock
        });
        transaction.set(ref, next);
        return next;
    });
}

function decisionRuntimes() {
    const Stripe = require('stripe');
    const db = admin.firestore();
    return {
        db,
        refunds: createRefundRuntime({
            db,
            stripe: Stripe(STRIPE_SECRET_KEY.value()),
            appId: APP_ID
        }).refunds,
        returns: createReturnRuntime({ db, appId: APP_ID }).returns
    };
}

function createAdminCustomerReturnDecisionHandler({
    authorize = checkActiveStrongAdmin,
    runtimeFactory = decisionRuntimes,
    decisionClock = clock()
} = {}) {
    return async (data, context) => {
        try {
            await authorize(context);
            const orderId = normalizeFirestoreId(data?.orderId, 'Commande');
            const requestId = normalizeFirestoreId(data?.requestId, 'Demande');
            const decision = normalizeDecision(data?.decision);
            const reason = normalizeDecisionReason(data?.reason);
            const runtime = runtimeFactory();
            const { refs, order, request } = await loadDecisionContext(
                runtime.db,
                orderId,
                requestId
            );
            const actor = { uid: context.auth.uid, role: 'admin', aal2: true };

            if (decision === 'reject') {
                const next = await persistDecision(runtime.db, refs.request, request, {
                    type: 'reject', actorUid: actor.uid, reason
                }, decisionClock);
                return { request: next, outcome: 'rejected' };
            }

            if (decision === 'authorize_return') {
                if (!['carrier', 'customer'].includes(order.fulfillmentSummary.custody)) {
                    const error = new Error('COMMERCE_CUSTOMER_RETURN_REQUEST_CUSTODY_INVALID');
                    error.code = 'COMMERCE_CUSTOMER_RETURN_REQUEST_CUSTODY_INVALID';
                    throw error;
                }
                const result = await runtime.returns.create({
                    orderId,
                    returnRequestId: requestId,
                    requestedLines: request.lines,
                    actor,
                    reason
                });
                const next = await persistDecision(runtime.db, refs.request, request, {
                    type: 'authorize_return',
                    returnId: result.returnCase.returnId,
                    actorUid: actor.uid,
                    reason
                }, decisionClock);
                return { request: next, returnCase: result.returnCase, outcome: 'return_authorized' };
            }

            let mode = 'direct_refund';
            if (decision === 'refund_now') {
                if (order.fulfillmentSummary.custody !== 'merchant') {
                    const error = new Error('COMMERCE_CUSTOMER_RETURN_REQUEST_CUSTODY_INVALID');
                    error.code = 'COMMERCE_CUSTOMER_RETURN_REQUEST_CUSTODY_INVALID';
                    throw error;
                }
            } else {
                mode = 'return_then_refund';
                if (!request.returnId) {
                    const error = new Error('COMMERCE_CUSTOMER_RETURN_REQUEST_RETURN_NOT_RESOLVED');
                    error.code = 'COMMERCE_CUSTOMER_RETURN_REQUEST_RETURN_NOT_RESOLVED';
                    throw error;
                }
                const returnSnapshot = await runtime.db.doc(
                    `orders/${orderId}/returns/${request.returnId}`
                ).get();
                if (!returnSnapshot.exists || returnSnapshot.data()?.status !== 'resolved') {
                    const error = new Error('COMMERCE_CUSTOMER_RETURN_REQUEST_RETURN_NOT_RESOLVED');
                    error.code = 'COMMERCE_CUSTOMER_RETURN_REQUEST_RETURN_NOT_RESOLVED';
                    throw error;
                }
            }

            const amountCents = calculateRequestedRefundAmount(order, request.lines);
            if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
                const error = new Error('COMMERCE_CUSTOMER_RETURN_REQUEST_NOT_REFUNDABLE');
                error.code = 'COMMERCE_CUSTOMER_RETURN_REQUEST_NOT_REFUNDABLE';
                throw error;
            }
            const refundRequestId = `customer-${requestId}`;
            const result = await runtime.refunds.requestRefund({
                orderId,
                refundRequestId,
                amountCents,
                actor,
                reason
            });
            const next = await persistDecision(runtime.db, refs.request, request, {
                type: 'refund_started',
                mode,
                refundRequestId,
                outcome: result.outcome,
                actorUid: actor.uid,
                reason
            }, decisionClock);
            return { request: next, ...result };
        } catch (error) {
            throw mapError(error);
        }
    };
}

const requestCustomerReturn = regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(createCustomerReturnRequestHandler());

const decideCustomerReturnRequestAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true, secrets: [STRIPE_SECRET_KEY] })
    .https.onCall(withCommerceMutationsEnabled(
        createAdminCustomerReturnDecisionHandler()
    ));

module.exports = {
    calculateRequestedRefundAmount,
    createAdminCustomerReturnDecisionHandler,
    createCustomerReturnRequestHandler,
    decideCustomerReturnRequestAdmin,
    requestCustomerReturn
};
