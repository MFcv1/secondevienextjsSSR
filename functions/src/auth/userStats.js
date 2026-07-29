'use strict';

const admin = require('firebase-admin');
const { regionalFunctions } = require('../../helpers/runtime');

const db = admin.firestore();
const USER_STATS_REF = db.doc('sys_user_stats/current');

function isRegisteredUser(user) {
    return Boolean(String(user?.email || '').trim());
}

async function adjustRegisteredUserCount(user, delta) {
    if (!isRegisteredUser(user)) return null;
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(USER_STATS_REF);
        const current = snapshot.exists
            ? Math.max(0, Number(snapshot.data()?.registeredUsers || 0))
            : 0;
        transaction.set(USER_STATS_REF, {
            registeredUsers: Math.max(0, current + delta),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            version: 1
        }, { merge: true });
    });
    return null;
}

const onRegisteredUserCreated = regionalFunctions().auth.user().onCreate(
    (user) => adjustRegisteredUserCount(user, 1)
);

const onRegisteredUserDeleted = regionalFunctions().auth.user().onDelete(
    (user) => adjustRegisteredUserCount(user, -1)
);

module.exports = {
    isRegisteredUser,
    onRegisteredUserCreated,
    onRegisteredUserDeleted
};
