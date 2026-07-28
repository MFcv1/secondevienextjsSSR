'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const {
    normalizeCommerceControl
} = require('./domain/policy');

const CONTROL_PATH = 'sys_commerce_control/current';

function snapshotExists(snapshot) {
    return typeof snapshot?.exists === 'function'
        ? snapshot.exists()
        : snapshot?.exists === true;
}

async function requireCommerceMutationsEnabled({
    db = admin.firestore(),
    data = null
} = {}) {
    const snapshot = await db.doc(CONTROL_PATH).get();
    const control = normalizeCommerceControl(
        snapshotExists(snapshot) ? snapshot.data() : null
    );
    if (control.adminMutationMode !== 'v2') {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Les mutations commerce v2 sont en lecture seule.',
            { reason: 'COMMERCE_ADMIN_MUTATIONS_OFF' }
        );
    }
    if (control.newCheckoutMode === 'v2_fixture') {
        const orderId = typeof data?.orderId === 'string' ? data.orderId : null;
        const productId = typeof data?.productId === 'string' ? data.productId : null;
        const collectionName = typeof data?.collectionName === 'string'
            ? data.collectionName
            : 'furniture';
        let targetSnapshot = null;
        if (orderId && !orderId.includes('/')) {
            targetSnapshot = await db.doc(`orders/${orderId}`).get();
        } else if (
            productId &&
            !productId.includes('/') &&
            /^[A-Za-z0-9_-]{1,80}$/.test(collectionName)
        ) {
            targetSnapshot = await db.doc(
                `artifacts/secondevie/public/data/${collectionName}/${productId}`
            ).get();
        }
        const target = snapshotExists(targetSnapshot) ? targetSnapshot.data() : null;
        const targetScope = target?.testContext?.fixtureScopeVersion
            || target?.fixtureScopeVersion
            || null;
        if (
            !target ||
            targetScope !== control.fixtureScopeVersion ||
            (productId && target.e2eOnly !== true)
        ) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'La mutation Gate 8 est limitee aux fixtures.',
                { reason: 'COMMERCE_ADMIN_FIXTURE_SCOPE_DENIED' }
            );
        }
    }
    return control;
}

function withCommerceMutationsEnabled(
    handler,
    requireEnabled = requireCommerceMutationsEnabled
) {
    return async (data, context) => {
        await requireEnabled({ data });
        return handler(data, context);
    };
}

module.exports = {
    CONTROL_PATH,
    requireCommerceMutationsEnabled,
    withCommerceMutationsEnabled
};
