'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { firestoreCloudEvent } = require('../../helpers/gcloudFirestoreEvent');
const { compareTimestamps } = require('./dashboardProjection');

const RUNTIME = Object.freeze({
    region: 'europe-west1',
    retry: true,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: 'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com'
});

const hashOpaque = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const needsReview = (value) => value?.status === 'pending_review';

function actionSummaryDelta(before, after) {
    return Number(needsReview(after)) - Number(needsReview(before));
}

const projectAdminActionSummaryFirebaseHandler = onDocumentWritten({
    ...RUNTIME,
    document: 'orders/{orderId}/customer_return_requests/{requestId}'
}, async (event) => {
    const before = event.data?.before?.exists ? event.data.before.data() : null;
    const after = event.data?.after?.exists ? event.data.after.data() : null;
    const sourceUpdateTime = event.data?.after?.exists
        ? event.data.after.updateTime
        : (event.time ? admin.firestore.Timestamp.fromDate(new Date(event.time)) : event.data?.before?.updateTime);
    const sourcePath = event.data?.after?.ref?.path || event.data?.before?.ref?.path
        || `orders/${event.params.orderId}/customer_return_requests/${event.params.requestId}`;
    const ledgerId = hashOpaque(sourcePath);
    const database = admin.firestore();
    const summaryRef = database.doc('admin_action_summary/current');
    const ledgerRef = database.doc(`admin_action_projections/${ledgerId}`);
    const delta = actionSummaryDelta(before, after);

    // Les changements de texte ou de metadata d'une demande ne modifient pas
    // le badge et ne doivent donc provoquer aucune lecture/ecriture projetee.
    if (delta === 0) {
        console.info('admin_action_projection_no_effect', {
            beforeStatus: before?.status || null,
            afterStatus: after?.status || null
        });
        return;
    }

    await database.runTransaction(async (transaction) => {
        const [summarySnapshot, ledgerSnapshot] = await Promise.all([
            transaction.get(summaryRef),
            transaction.get(ledgerRef)
        ]);
        const ledger = ledgerSnapshot.exists ? ledgerSnapshot.data() : null;
        if (compareTimestamps(sourceUpdateTime, ledger?.sourceUpdateTime) <= 0) return;
        const current = summarySnapshot.exists ? summarySnapshot.data() : {};
        const pendingReturns = Number(current.pendingReturns || 0) + delta;
        if (!Number.isSafeInteger(pendingReturns) || pendingReturns < 0) {
            throw new Error('ADMIN_ACTION_SUMMARY_INVALID');
        }
        transaction.set(summaryRef, {
            schemaVersion: 1,
            pendingReturns,
            totalPending: pendingReturns,
            revision: Math.max(0, Number(current.revision || 0)) + 1,
            sourceUpdateTime,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        transaction.set(ledgerRef, {
            schemaVersion: 1,
            active: needsReview(after),
            sourcePathHash: ledgerId,
            sourceUpdateTime,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
    console.info('admin_action_projection_applied', {
        beforeStatus: before?.status || null,
        afterStatus: after?.status || null,
        delta
    });
});

// Le buildpack gcloud appelle `.run` lorsqu'il exporte directement un handler
// Firebase, ce qui court-circuite le decodeur protobuf Firestore. Cette facade
// simple, gouvernee par deploy-functions-targeted, force l'appel du decodeur
// public. Ne pas lui remettre `__endpoint` ou `.run`.
const projectAdminActionSummaryGen2 = (...args) => {
    const [payload, context] = args;
    return projectAdminActionSummaryFirebaseHandler(firestoreCloudEvent(
        payload,
        context,
        `orders/${context?.params?.orderId}/customer_return_requests/${context?.params?.requestId}`
    ));
};

module.exports = {
    actionSummaryDelta,
    needsReview,
    projectAdminActionSummaryGen2
};
