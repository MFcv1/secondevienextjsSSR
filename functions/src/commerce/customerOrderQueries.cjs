'use strict';
const { computeAllowedActions } = require('./domain/allowedActions');
const { validateCustomerReturnRequest } = require('./domain/customerReturnRequest');
const { validateOrderV2 } = require('./domain/orderState');
const { validateRefundAttempt } = require('./domain/refundSaga');
const { resolveShippingTracking } = require('./domain/shippingTracking');

function createCustomerOrderQueries({ admin, HttpsError, normalizeFirestoreId }) {
const functions = { https: { HttpsError } };
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

async function paginatedQuery({
    query,
    cursorId,
    cursorSnapshot,
    cursorCollection,
    pageSize
}) {
    let bounded = query;
    if (cursorId) {
        const cursor = cursorSnapshot || await cursorCollection.doc(cursorId).get();
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
        let cursorSnapshot;
        if (cursorId) {
            cursorSnapshot = await orders.doc(cursorId).get();
            if (!cursorSnapshot.exists || cursorSnapshot.data()?.userId !== ownerUid) {
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
            cursorSnapshot,
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

return { normalizePageSize, shouldHideRefundConfirmation, requireOwner, serializeOrder, serializeRefundAttempt, serializeCommerceDocument, serializeOwnedOrder, serializeCustomerReturnRequest, paginatedQuery, createListMyOrdersHandler };
}
module.exports = { createCustomerOrderQueries };
