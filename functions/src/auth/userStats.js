'use strict';

const admin = require('firebase-admin');
const { regionalFunctions } = require('../../helpers/runtime');
const { mergeActivityProjection, planUserStatsEvent } = require('../admin/dashboardProjection');

const db = admin.firestore();
const USER_STATS_REF = db.doc('sys_user_stats/current');

function isRegisteredUser(user) {
    return Boolean(String(user?.email || '').trim());
}

async function adjustRegisteredUserCount(user, present, context = {}) {
    if (!isRegisteredUser(user)) return null;
    const sourceEventTime = admin.firestore.Timestamp.fromDate(
        new Date(context.timestamp || new Date().toISOString())
    );
    const eventId = String(context.eventId || `${present ? 'create' : 'delete'}:${user.uid}`);
    const ledgerRef = db.doc(`admin_user_stats_projections/${user.uid}`);
    const activityRef = db.doc('admin_dashboard/activity');
    await db.runTransaction(async (transaction) => {
        const [snapshot, ledgerSnapshot, activitySnapshot] = await Promise.all([
            transaction.get(USER_STATS_REF),
            transaction.get(ledgerRef),
            transaction.get(activityRef)
        ]);
        const ledger = ledgerSnapshot.exists ? ledgerSnapshot.data() : null;
        const current = snapshot.exists
            ? Math.max(0, Number(snapshot.data()?.registeredUsers || 0))
            : 0;
        const plan = planUserStatsEvent({
            currentCount: current,
            ledger,
            present,
            sourceEventTime,
            eventId
        });
        if (plan.outcome === 'noop') return;
        const registeredUsers = plan.registeredUsers;
        const sourceRevision = Math.max(0, Number(snapshot.data()?.revision || 0)) + 1;
        transaction.set(USER_STATS_REF, {
            registeredUsers,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            version: 1,
            revision: sourceRevision
        }, { merge: true });
        transaction.set(ledgerRef, {
            schemaVersion: 1,
            present,
            sourceEventTime,
            eventId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        if (!activitySnapshot.exists) throw new Error('ADMIN_ACTIVITY_PROJECTION_BASELINE_MISSING');
        const activity = activitySnapshot.data();
        transaction.set(activityRef, mergeActivityProjection(activity, {
            users: {
                registeredUsers,
                sourceRevision,
                sourceUpdatedAt: sourceEventTime
            }
        }, {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            revision: Math.max(0, Number(activity.revision || 0)) + 1
        }));
    });
    return null;
}

const onRegisteredUserCreated = regionalFunctions().auth.user().onCreate(
    (user, context) => adjustRegisteredUserCount(user, true, context)
);

const onRegisteredUserDeleted = regionalFunctions().auth.user().onDelete(
    (user, context) => adjustRegisteredUserCount(user, false, context)
);

module.exports = {
    isRegisteredUser,
    adjustRegisteredUserCount,
    onRegisteredUserCreated,
    onRegisteredUserDeleted
};
