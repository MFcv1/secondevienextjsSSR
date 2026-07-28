'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const {
    checkRecentActiveStrongAdmin,
    normalizeFirestoreId
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const { computeAllowedActions } = require('./domain/allowedActions');
const { validateOrderV2 } = require('./domain/orderState');
const { validateReturnCase } = require('./domain/returnCase');

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
            orders: result.snapshot.docs.map((snapshot) => serializeOrder(
                snapshot,
                { uid: ownerUid, role: 'customer', aal2: false }
            )),
            nextCursor: result.nextCursor
        };
    };
}

function createListOrdersAdminHandler({
    authorize = checkRecentActiveStrongAdmin,
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
            orders: result.snapshot.docs.map(
                (snapshot) => serializeOrder(snapshot, actor)
            ),
            nextCursor: result.nextCursor
        };
    };
}

function createListReturnsAdminHandler({
    authorize = checkRecentActiveStrongAdmin,
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

const callable = (handler) => regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(handler);

const listMyOrdersV2 = callable(createListMyOrdersHandler());
const listOrdersAdminV2 = callable(createListOrdersAdminHandler());
const listReturnsAdminV2 = callable(createListReturnsAdminHandler());

module.exports = {
    createListMyOrdersHandler,
    createListOrdersAdminHandler,
    createListReturnsAdminHandler,
    decodeReturnCursor,
    listMyOrdersV2,
    listOrdersAdminV2,
    listReturnsAdminV2,
    normalizePageSize,
    returnActions
};
