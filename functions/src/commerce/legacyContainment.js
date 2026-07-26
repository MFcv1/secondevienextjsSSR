'use strict';

const CONTROL_PATH = 'sys_commerce_control/current';
const CONTAINMENT_CODE = 'COMMERCE_READ_ONLY';
const V2_HANDLER_REQUIRED_CODE = 'V2_ORDER_REQUIRES_V2_HANDLER';
const DESTRUCTIVE_MAINTENANCE_ACTIONS = Object.freeze([
    'resetAllStats',
    'runGarbageCollector',
    'resetAllUsers',
    'purgeAnonymousUsers',
    'purgeAllProducts',
    'resetAllOrders'
]);

function containmentError(functions, action) {
    return new functions.https.HttpsError(
        'failed-precondition',
        'Le commerce est temporairement en lecture seule. Aucune nouvelle operation transactionnelle n’est acceptee.',
        { reason: CONTAINMENT_CODE, action }
    );
}

async function readLegacyContainmentControl(db) {
    try {
        const snapshot = await db.doc(CONTROL_PATH).get();
        const data = snapshot.exists ? snapshot.data() || {} : {};
        return {
            source: snapshot.exists ? 'document' : 'absent',
            newLegacyOrders: false,
            newLegacyPaymentIntents: false,
            offlinePayments: false,
            adminMutations: false,
            rawMode: typeof data.legacyMode === 'string' ? data.legacyMode : null
        };
    } catch {
        return {
            source: 'unreadable',
            newLegacyOrders: false,
            newLegacyPaymentIntents: false,
            offlinePayments: false,
            adminMutations: false,
            rawMode: null
        };
    }
}

async function assertLegacyOrderCreationBlocked({ db, functions, paymentMethod }) {
    await readLegacyContainmentControl(db);
    const action = paymentMethod === 'manual' || paymentMethod === 'deferred'
        ? 'offline-payment'
        : 'legacy-order-creation';
    throw containmentError(functions, action);
}

function assertLegacyMutationBlocked(functions, action) {
    throw containmentError(functions, action);
}

function isV2Order(order) {
    return order?.schemaVersion === 2;
}

function assertLegacyOrderDocument(functions, order, action) {
    if (!isV2Order(order)) return;
    if (functions?.https?.HttpsError) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Cette commande requiert le moteur commerce v2.',
            { reason: V2_HANDLER_REQUIRED_CODE, action }
        );
    }
    const error = new Error(`${V2_HANDLER_REQUIRED_CODE}:${action}`);
    error.code = V2_HANDLER_REQUIRED_CODE;
    throw error;
}

function mayReleaseLegacyReservation(paymentIntentStatus) {
    return paymentIntentStatus === 'canceled';
}

module.exports = {
    CONTAINMENT_CODE,
    CONTROL_PATH,
    DESTRUCTIVE_MAINTENANCE_ACTIONS,
    V2_HANDLER_REQUIRED_CODE,
    assertLegacyOrderDocument,
    assertLegacyMutationBlocked,
    assertLegacyOrderCreationBlocked,
    isV2Order,
    mayReleaseLegacyReservation,
    readLegacyContainmentControl
};
