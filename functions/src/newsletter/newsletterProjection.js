'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const {
    planNewsletterProjection,
    projectionError
} = require('./newsletterProjectionDomain');

const db = admin.firestore();
const SUMMARY_DOCUMENT = 'admin_newsletter_summary/current';
const LEDGER_COLLECTION = 'admin_newsletter_subscriber_projections';
const RUNTIME_SERVICE_ACCOUNT =
    'newsletter-runtime@secondevienextjsssr.iam.gserviceaccount.com';

function deletionEventTimestamp(event) {
    const date = event?.time ? new Date(event.time) : null;
    return date && Number.isFinite(date.getTime())
        ? admin.firestore.Timestamp.fromDate(date)
        : (event.data?.before?.updateTime || null);
}

function correlationId(eventId) {
    return crypto.createHash('sha256').update(String(eventId || 'missing'))
        .digest('hex').slice(0, 16);
}

async function projectNewsletterSubscriber(event) {
    const startedAt = Date.now();
    const beforeExists = event.data?.before?.exists === true;
    const afterExists = event.data?.after?.exists === true;

    // Le compteur materialise mesure la presence du document. Une simple
    // modification de profil ne change rien et ne justifie aucune transaction.
    if (beforeExists === afterExists) return null;

    const subscriberId = String(event.params.subscriberId || '');
    const sourceUpdateTime = afterExists
        ? event.data.after.updateTime
        : deletionEventTimestamp(event);
    if (!subscriberId || !sourceUpdateTime) {
        throw projectionError('ADMIN_NEWSLETTER_EVENT_INVALID');
    }

    const result = await db.runTransaction(async (transaction) => {
        const summaryRef = db.doc(SUMMARY_DOCUMENT);
        const ledgerRef = db.doc(`${LEDGER_COLLECTION}/${subscriberId}`);
        const [summarySnapshot, ledgerSnapshot] = await Promise.all([
            transaction.get(summaryRef),
            transaction.get(ledgerRef)
        ]);
        if (!summarySnapshot.exists) {
            throw projectionError('ADMIN_NEWSLETTER_SUMMARY_BASELINE_MISSING');
        }
        const summary = summarySnapshot.data();
        const ledger = ledgerSnapshot.exists ? ledgerSnapshot.data() : null;
        const plan = planNewsletterProjection({
            currentCount: Number(summary.activeCount),
            ledger,
            previousPresent: beforeExists,
            present: afterExists,
            sourceUpdateTime,
            eventId: event.id
        });
        if (plan.outcome === 'noop') return plan;

        const revision = Math.max(0, Number(summary.revision || 0)) + 1;
        transaction.set(summaryRef, {
            schemaVersion: 1,
            activeCount: plan.activeCount,
            additionsSinceBaseline: Math.max(0, Number(summary.additionsSinceBaseline || 0)) +
                (plan.delta > 0 ? 1 : 0),
            removalsSinceBaseline: Math.max(0, Number(summary.removalsSinceBaseline || 0)) +
                (plan.delta < 0 ? 1 : 0),
            baselineAt: summary.baselineAt,
            source: 'newsletter_subscriber_projection',
            latestSourceUpdateTime: sourceUpdateTime,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            revision
        });
        transaction.set(ledgerRef, {
            schemaVersion: 1,
            subscriberId,
            present: afterExists,
            tombstone: !afterExists,
            sourceUpdateTime,
            eventId: event.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return plan;
    });

    logger.info('admin_newsletter_projection_completed', {
        schemaVersion: 1,
        correlationId: correlationId(event.id),
        outcome: result.outcome,
        delta: result.delta,
        durationMs: Date.now() - startedAt,
        sourceLagMs: Math.max(0, Date.now() - sourceUpdateTime.toMillis())
    });
    return null;
}

const projectNewsletterSubscriberGen2 = onDocumentWritten({
    document: 'newsletter_subscribers/{subscriberId}',
    region: 'europe-west1',
    retry: true,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: RUNTIME_SERVICE_ACCOUNT
}, projectNewsletterSubscriber);

module.exports = {
    LEDGER_COLLECTION,
    SUMMARY_DOCUMENT,
    projectNewsletterSubscriber,
    projectNewsletterSubscriberGen2
};
