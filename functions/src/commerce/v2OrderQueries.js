'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const {
    checkActiveStrongAdmin,
    normalizeFirestoreId
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const { computeAllowedActions } = require('./domain/allowedActions');
const {
    validateCustomerReturnRequest
} = require('./domain/customerReturnRequest');
const { validateOrderV2 } = require('./domain/orderState');
const { validateRefundAttempt } = require('./domain/refundSaga');
const { validateReturnCase } = require('./domain/returnCase');
const { resolveShippingTracking } = require('./domain/shippingTracking');

function normalizePageSize(value, fallback = 25) {
    const pageSize = value == null ? fallback : value;
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Taille de page invalide.'
        );
    }
    return pageSize;
}

function shouldHideRefundConfirmation(order, document = {}) {
    return order?.refundAggregate?.status === 'needs_review' &&
        order?.amounts?.refundedCents === 0 &&
        document.kind === 'sandbox_refund_confirmation';
}

function decodeReturnCursor(value) {
    if (
        typeof value !== 'string' ||
        value.length < 1 ||
        value.length > 500 ||
        !/^[A-Za-z0-9_-]+$/.test(value)
    ) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Curseur de retour invalide.'
        );
    }
    let documentPath;
    try {
        documentPath = Buffer.from(value, 'base64url').toString('utf8');
    } catch {
        documentPath = '';
    }
    const segments = documentPath.split('/');
    if (
        segments.length !== 4 ||
        segments[0] !== 'orders' ||
        segments[2] !== 'returns'
    ) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Curseur de retour invalide.'
        );
    }
    normalizeFirestoreId(segments[1], 'Commande curseur');
    normalizeFirestoreId(segments[3], 'Retour curseur');
    return documentPath;
}

function decodeCustomerReturnRequestCursor(value) {
    if (
        typeof value !== 'string' ||
        value.length < 1 ||
        value.length > 500 ||
        !/^[A-Za-z0-9_-]+$/.test(value)
    ) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Curseur de demande invalide.'
        );
    }
    let documentPath;
    try {
        documentPath = Buffer.from(value, 'base64url').toString('utf8');
    } catch {
        documentPath = '';
    }
    const segments = documentPath.split('/');
    if (
        segments.length !== 4 ||
        segments[0] !== 'orders' ||
        segments[2] !== 'customer_return_requests'
    ) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Curseur de demande invalide.'
        );
    }
    normalizeFirestoreId(segments[1], 'Commande curseur');
    normalizeFirestoreId(segments[3], 'Demande curseur');
    return documentPath;
}

function requireOwner(context) {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentification requise.'
        );
    }
    return context.auth.uid;
}

function serializeOrder(snapshot, actor) {
    const order = snapshot.data();
    if (order.schemaVersion === 2) {
        validateOrderV2(order);
        return {
            ...order,
            id: snapshot.id,
            shipmentTracking: resolveShippingTracking(order.fulfillmentSummary),
            allowedActions: computeAllowedActions(
                { ...order, id: snapshot.id },
                actor
            )
        };
    }
    return {
        ...order,
        id: snapshot.id,
        allowedActions: [],
        legacyReadOnly: true
    };
}

function serializeRefundAttempt(snapshot) {
    const attempt = snapshot.data();
    validateRefundAttempt(attempt);
    return {
        refundRequestId: attempt.refundRequestId,
        amountCents: attempt.amountCents,
        status: attempt.status,
        providerStatus: attempt.providerStatus || null,
        refundId: attempt.refundId || null,
        updatedAt: attempt.updatedAt || null,
        resumable: !['succeeded', 'failed'].includes(attempt.status)
    };
}

async function serializeAdminOrder(snapshot, actor) {
    const serialized = serializeOrder(snapshot, actor);
    if (
        serialized.schemaVersion !== 2 ||
        Number(serialized.refundAggregate?.requestedCents || 0) <= 0
    ) {
        return serialized;
    }
    try {
        const attemptsSnapshot = await snapshot.ref.collection('refunds')
            .orderBy('updatedAt', 'desc')
            .limit(1)
            .get();
        return {
            ...serialized,
            latestRefundAttempt: attemptsSnapshot.empty
                ? null
                : serializeRefundAttempt(attemptsSnapshot.docs[0]),
            refundAttemptReadError: false
        };
    } catch (error) {
        console.error('Admin refund attempt read failed', {
            orderId: snapshot.id,
            code: String(error?.code || error?.message || 'unknown')
        });
        return {
            ...serialized,
            latestRefundAttempt: null,
            refundAttemptReadError: true
        };
    }
}

function serializeCommerceDocument(snapshot, order) {
    const document = snapshot.data();
    if (
        document?.schemaVersion !== 2 ||
        document?.orderId !== snapshot.ref.parent.parent.id ||
        document?.ownerUid !== order.userId ||
        ![
            'sandbox_payment_receipt',
            'sandbox_refund_confirmation'
        ].includes(document?.kind) ||
        document?.legalStatus !== 'non_fiscal_sandbox'
    ) {
        return null;
    }
    return {
        documentId: snapshot.id,
        kind: document.kind,
        legalStatus: document.legalStatus,
        currency: document.currency,
        capturedCents: Number.isSafeInteger(document.capturedCents)
            ? document.capturedCents
            : null,
        refundedCents: Number.isSafeInteger(document.refundedCents)
            ? document.refundedCents
            : null,
        issuedAt: document.issuedAt || null
    };
}

async function serializeOwnedOrder(snapshot, actor) {
    const order = snapshot.data();
    const [documentsSnapshot, requestsSnapshot] = await Promise.all([
        snapshot.ref.collection('documents')
            .orderBy('issuedAt', 'desc')
            .limit(20)
            .get(),
        snapshot.ref.collection('customer_return_requests')
            .orderBy('updatedAt', 'desc')
            .limit(1)
            .get()
    ]);
    let latestCustomerReturnRequest = requestsSnapshot.empty
        ? null
        : serializeCustomerReturnRequest(requestsSnapshot.docs[0]);
    if (latestCustomerReturnRequest?.refundRequestId) {
        const refundSnapshot = await snapshot.ref.collection('refunds')
            .doc(latestCustomerReturnRequest.refundRequestId)
            .get();
        if (refundSnapshot.exists) {
            const refundAttempt = serializeRefundAttempt(refundSnapshot);
            latestCustomerReturnRequest = {
                ...latestCustomerReturnRequest,
                status: refundAttempt.status === 'succeeded'
                    ? 'completed'
                    : (refundAttempt.status === 'failed'
                        ? 'refund_failed'
                        : latestCustomerReturnRequest.status)
            };
        }
    }
    return {
        ...serializeOrder(snapshot, actor),
        latestCustomerReturnRequest,
        documents: documentsSnapshot.docs
            .filter((documentSnapshot) => !shouldHideRefundConfirmation(
                order,
                documentSnapshot.data()
            ))
            .map((documentSnapshot) => serializeCommerceDocument(
                documentSnapshot,
                order
            ))
            .filter(Boolean)
    };
}

function serializeCustomerReturnRequest(snapshot) {
    const request = snapshot.data();
    validateCustomerReturnRequest(request);
    return {
        requestId: snapshot.id,
        orderId: request.orderId,
        status: request.status,
        resolutionMode: request.resolutionMode,
        stateVersion: request.stateVersion,
        lines: request.lines,
        reason: request.reason,
        note: request.note,
        returnId: request.returnId,
        refundRequestId: request.refundRequestId,
        decisionReason: request.decisionReason,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt
    };
}

async function serializeCustomerReturnRequestAdmin(snapshot, db) {
    const request = serializeCustomerReturnRequest(snapshot);
    const orderRef = db.doc(`orders/${request.orderId}`);
    const linkedRefs = [orderRef];
    if (request.returnId) {
        linkedRefs.push(db.doc(`orders/${request.orderId}/returns/${request.returnId}`));
    }
    if (request.refundRequestId) {
        linkedRefs.push(db.doc(`orders/${request.orderId}/refunds/${request.refundRequestId}`));
    }
    const snapshots = await Promise.all(linkedRefs.map((reference) => reference.get()));
    const orderSnapshot = snapshots[0];
    if (!orderSnapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'Commande de la demande introuvable.');
    }
    const order = orderSnapshot.data();
    validateOrderV2(order);
    let index = 1;
    const returnSnapshot = request.returnId ? snapshots[index++] : null;
    const refundSnapshot = request.refundRequestId ? snapshots[index] : null;
    const returnCase = returnSnapshot?.exists ? serializeReturn(returnSnapshot) : null;
    const refundAttempt = refundSnapshot?.exists
        ? serializeRefundAttempt(refundSnapshot)
        : null;
    const derivedStatus = refundAttempt?.status === 'succeeded'
        ? 'completed'
        : (refundAttempt?.status === 'failed' ? 'refund_failed' : request.status);
    const remainingCents = order.amounts.capturedCents
        - order.refundAggregate.succeededCents
        - order.refundAggregate.pendingCents;
    return {
        ...request,
        status: derivedStatus,
        order: {
            id: request.orderId,
            customerSnapshot: order.customerSnapshot,
            shippingSnapshot: order.shippingSnapshot,
            items: order.items,
            amounts: order.amounts,
            currency: order.currency,
            fulfillmentSummary: order.fulfillmentSummary,
            refundAggregate: order.refundAggregate
        },
        returnCase,
        refundAttempt,
        canRefundNow: request.status === 'pending_review'
            && order.fulfillmentSummary.custody === 'merchant'
            && remainingCents > 0,
        canAuthorizeReturn: request.status === 'pending_review'
            && ['carrier', 'customer'].includes(order.fulfillmentSummary.custody),
        canRefundAfterReturn: request.status === 'return_authorized'
            && returnCase?.status === 'resolved'
            && remainingCents > 0,
        canReject: request.status === 'pending_review'
    };
}

function timestampMillis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') {
        return value > 0 && value < 100000000000 ? value * 1000 : value;
    }
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    const seconds = Number(value.seconds ?? value._seconds);
    const nanoseconds = Number(value.nanoseconds ?? value._nanoseconds ?? 0);
    if (!Number.isFinite(seconds)) return 0;
    return (seconds * 1000) +
        (Number.isFinite(nanoseconds) ? Math.floor(nanoseconds / 1000000) : 0);
}

function eventData(snapshot) {
    return typeof snapshot?.data === 'function' ? snapshot.data() : snapshot;
}

function buildAdminOrderTimeline(order, eventSnapshots = []) {
    const timeline = [];
    const append = (type, at, extra = {}) => {
        if (!timestampMillis(at)) return;
        timeline.push({ type, at, ...extra });
    };

    append('order_created', order.createdAt);
    append('payment_succeeded', order.payment?.succeededAt || order.paidAt);

    let hasCancellationEvent = false;
    let hasRefundEvent = false;
    let hasFulfillmentEvent = false;
    for (const snapshot of eventSnapshots) {
        const event = eventData(snapshot) || {};
        const type = event.type || event.action;
        if (type === 'cancellation_completed') {
            hasCancellationEvent = true;
            append('order_cancelled', event.createdAt);
        } else if (type === 'refund_requested') {
            hasRefundEvent = true;
            append('refund_requested', event.createdAt, {
                amountCents: event.amountCents,
                currency: event.currency
            });
        } else if (type === 'refund_succeeded') {
            hasRefundEvent = true;
            append('refund_succeeded', event.createdAt, {
                amountCents: event.amountCents,
                currency: event.currency
            });
        } else if (type === 'refund_failed') {
            hasRefundEvent = true;
            append('refund_failed', event.createdAt, {
                amountCents: event.amountCents,
                currency: event.currency
            });
        } else if ([
            'fulfillment_prepare',
            'fulfillment_ready',
            'fulfillment_pickup',
            'fulfillment_ship',
            'fulfillment_update_tracking',
            'fulfillment_deliver'
        ].includes(type)) {
            hasFulfillmentEvent = true;
            append(type, event.createdAt, {
                carrierCode: event.carrierCode || null,
                carrierName: event.carrierName || null,
                trackingNumber: event.trackingNumber || null
            });
        }
    }

    if (!hasFulfillmentEvent) {
        const fallbackType = {
            preparing: 'fulfillment_prepare',
            ready_for_pickup: 'fulfillment_ready',
            picked_up: 'fulfillment_pickup',
            shipped: 'fulfillment_ship',
            delivered: 'fulfillment_deliver'
        }[order.fulfillmentSummary?.status];
        if (fallbackType) {
            append(fallbackType, order.updatedAt, {
                carrierCode: order.fulfillmentSummary?.carrierCode || null,
                carrierName: order.fulfillmentSummary?.carrierName || null,
                trackingNumber: order.fulfillmentSummary?.trackingNumber || null
            });
        }
    }

    const status = String(order.status || '');
    const isCancelled = [
        'cancelled',
        'canceled',
        'cancelled_by_client'
    ].includes(status) || order.payment?.status === 'canceled';
    if (isCancelled && !hasCancellationEvent) {
        append('order_cancelled', order.cancelledAt || order.canceledAt || order.updatedAt);
    }
    const hasRefund = (
        ['refund_pending', 'refunded', 'refund_failed'].includes(status) ||
        Number(order.refundAggregate?.requestedCents || 0) > 0
    );
    if (hasRefund && !hasRefundEvent) {
        append(
            status === 'refund_pending' ? 'refund_requested' :
                (status === 'refund_failed' ? 'refund_failed' : 'refund_succeeded'),
            order.refundUpdatedAt || order.updatedAt,
            {
                amountCents: order.refundAggregate?.succeededCents || order.refundAmount,
                currency: order.currency || order.refundCurrency
            }
        );
    }

    return timeline.sort((left, right) => timestampMillis(left.at) - timestampMillis(right.at));
}

function returnActions(returnCase) {
    if (['resolved', 'canceled'].includes(returnCase.status)) return [];
    const actions = [];
    const hasReceived = returnCase.lines.some((line) => line.receivedQty > 0);
    const hasPendingReceipt = returnCase.lines.some(
        (line) => line.receivedQty < line.requestedQty
    );
    const hasPendingDisposition = returnCase.lines.some(
        (line) => line.restockedQty + line.writtenOffQty < line.receivedQty
    );
    if (!hasReceived) actions.push('cancel_return');
    if (hasPendingReceipt) actions.push('receive_return');
    if (hasPendingDisposition) {
        actions.push('restock_return', 'write_off_return');
    }
    if (!hasPendingDisposition && hasReceived) actions.push('resolve_return');
    return actions;
}

function serializeReturn(snapshot) {
    const returnCase = snapshot.data();
    validateReturnCase(returnCase);
    return {
        ...returnCase,
        returnId: snapshot.id,
        allowedActions: returnActions(returnCase)
    };
}

async function paginatedQuery({
    query,
    cursorId,
    cursorCollection,
    pageSize
}) {
    let bounded = query;
    if (cursorId) {
        const cursor = await cursorCollection.doc(cursorId).get();
        if (!cursor.exists) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Curseur invalide.'
            );
        }
        bounded = bounded.startAfter(cursor);
    }
    const snapshot = await bounded.limit(pageSize).get();
    return {
        snapshot,
        nextCursor: snapshot.size === pageSize
            ? snapshot.docs[snapshot.docs.length - 1].id
            : null
    };
}

function createGetOrderTimelineAdminHandler({
    authorize = checkActiveStrongAdmin,
    dbFactory = () => admin.firestore()
} = {}) {
    return async (data, context) => {
        await authorize(context);
        const orderId = normalizeFirestoreId(data?.orderId, 'Commande');
        const db = dbFactory();
        const orderRef = db.collection('orders').doc(orderId);
        const [orderSnapshot, eventsSnapshot] = await Promise.all([
            orderRef.get(),
            orderRef.collection('events')
                .orderBy('createdAt', 'asc')
                .limit(100)
                .get()
        ]);
        if (!orderSnapshot.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Commande introuvable.'
            );
        }
        const order = orderSnapshot.data();
        if (order.schemaVersion === 2) validateOrderV2(order);
        return {
            orderId,
            timeline: buildAdminOrderTimeline(order, eventsSnapshot.docs),
            truncated: eventsSnapshot.size === 100
        };
    };
}

function createListMyOrdersHandler({
    authorize = requireOwner,
    dbFactory = () => admin.firestore()
} = {}) {
    return async (data, context) => {
        const ownerUid = authorize(context);
        const pageSize = normalizePageSize(data?.pageSize);
        const cursorId = data?.cursor
            ? normalizeFirestoreId(data.cursor, 'Curseur')
            : null;
        const db = dbFactory();
        const orders = db.collection('orders');
        if (cursorId) {
            const cursor = await orders.doc(cursorId).get();
            if (!cursor.exists || cursor.data()?.userId !== ownerUid) {
                throw new functions.https.HttpsError(
                    'permission-denied',
                    'Curseur de commande refuse.'
                );
            }
        }
        const result = await paginatedQuery({
            query: orders
                .where('userId', '==', ownerUid)
                .orderBy('createdAt', 'desc'),
            cursorId,
            cursorCollection: orders,
            pageSize
        });
        return {
            orders: await Promise.all(result.snapshot.docs.map(
                (snapshot) => serializeOwnedOrder(
                    snapshot,
                    { uid: ownerUid, role: 'customer', aal2: false }
                )
            )),
            nextCursor: result.nextCursor
        };
    };
}

function createListOrdersAdminHandler({
    authorize = checkActiveStrongAdmin,
    dbFactory = () => admin.firestore()
} = {}) {
    return async (data, context) => {
        await authorize(context);
        const pageSize = normalizePageSize(data?.pageSize);
        const cursorId = data?.cursor
            ? normalizeFirestoreId(data.cursor, 'Curseur')
            : null;
        const db = dbFactory();
        const orders = db.collection('orders');
        const result = await paginatedQuery({
            query: orders.orderBy('createdAt', 'desc'),
            cursorId,
            cursorCollection: orders,
            pageSize
        });
        const actor = {
            uid: context.auth.uid,
            role: 'admin',
            aal2: true
        };
        return {
            orders: await Promise.all(result.snapshot.docs.map(
                (snapshot) => serializeAdminOrder(snapshot, actor)
            )),
            nextCursor: result.nextCursor
        };
    };
}

function createListReturnsAdminHandler({
    authorize = checkActiveStrongAdmin,
    dbFactory = () => admin.firestore()
} = {}) {
    return async (data, context) => {
        await authorize(context);
        const pageSize = normalizePageSize(data?.pageSize);
        const cursorPath = data?.cursor
            ? decodeReturnCursor(data.cursor)
            : null;
        const db = dbFactory();
        let query = db.collectionGroup('returns').orderBy('updatedAt', 'desc');
        if (cursorPath) {
            const cursor = await db.doc(cursorPath).get();
            if (!cursor.exists) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'Curseur de retour invalide.'
                );
            }
            query = query.startAfter(cursor);
        }
        const snapshot = await query.limit(pageSize).get();
        return {
            returns: snapshot.docs.map(serializeReturn),
            nextCursor: snapshot.size === pageSize
                ? Buffer.from(
                    snapshot.docs[snapshot.docs.length - 1].ref.path,
                    'utf8'
                ).toString('base64url')
                : null
        };
    };
}

function createListCustomerReturnRequestsAdminHandler({
    authorize = checkActiveStrongAdmin,
    dbFactory = () => admin.firestore()
} = {}) {
    return async (data, context) => {
        await authorize(context);
        const pageSize = normalizePageSize(data?.pageSize);
        const cursorPath = data?.cursor
            ? decodeCustomerReturnRequestCursor(data.cursor)
            : null;
        const db = dbFactory();
        let query = db.collectionGroup('customer_return_requests')
            .orderBy('updatedAt', 'desc');
        if (cursorPath) {
            const cursor = await db.doc(cursorPath).get();
            if (!cursor.exists) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'Curseur de demande invalide.'
                );
            }
            query = query.startAfter(cursor);
        }
        const snapshot = await query.limit(pageSize).get();
        return {
            requests: await Promise.all(snapshot.docs.map(
                (requestSnapshot) => serializeCustomerReturnRequestAdmin(
                    requestSnapshot,
                    db
                )
            )),
            nextCursor: snapshot.size === pageSize
                ? Buffer.from(
                    snapshot.docs[snapshot.docs.length - 1].ref.path,
                    'utf8'
                ).toString('base64url')
                : null
        };
    };
}

const callable = (handler) => regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(handler);

const listMyOrdersV2 = callable(createListMyOrdersHandler());
const listOrdersAdminV2 = callable(createListOrdersAdminHandler());
const listReturnsAdminV2 = callable(createListReturnsAdminHandler());
const listCustomerReturnRequestsAdminV2 = callable(
    createListCustomerReturnRequestsAdminHandler()
);
const getOrderTimelineAdminV2 = callable(createGetOrderTimelineAdminHandler());

module.exports = {
    buildAdminOrderTimeline,
    createGetOrderTimelineAdminHandler,
    createListMyOrdersHandler,
    createListOrdersAdminHandler,
    createListCustomerReturnRequestsAdminHandler,
    createListReturnsAdminHandler,
    decodeReturnCursor,
    decodeCustomerReturnRequestCursor,
    getOrderTimelineAdminV2,
    listMyOrdersV2,
    listOrdersAdminV2,
    listCustomerReturnRequestsAdminV2,
    listReturnsAdminV2,
    normalizePageSize,
    returnActions,
    shouldHideRefundConfirmation,
    serializeAdminOrder,
    serializeCommerceDocument,
    serializeCustomerReturnRequest,
    serializeCustomerReturnRequestAdmin
};
