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
    db = admin.firestore()
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
    return control;
}

function withCommerceMutationsEnabled(
    handler,
    requireEnabled = requireCommerceMutationsEnabled
) {
    return async (data, context) => {
        await requireEnabled();
        return handler(data, context);
    };
}

module.exports = {
    CONTROL_PATH,
    requireCommerceMutationsEnabled,
    withCommerceMutationsEnabled
};
