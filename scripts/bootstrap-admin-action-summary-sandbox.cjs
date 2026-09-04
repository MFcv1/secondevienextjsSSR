'use strict';

const admin = require('../functions/node_modules/firebase-admin');

const EXPECTED_PROJECT = 'secondevienextjsssr';
const APPLY_TOKEN = 'BOOTSTRAP_ADMIN_ACTION_SUMMARY_SANDBOX';
const apply = process.argv.includes('--apply');

if (apply && process.env.APPROVAL !== APPLY_TOKEN) {
    throw new Error(`APPROVAL=${APPLY_TOKEN} requis avec --apply`);
}

admin.initializeApp({ projectId: EXPECTED_PROJECT });
const db = admin.firestore();

async function main() {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || EXPECTED_PROJECT;
    if (projectId !== EXPECTED_PROJECT) throw new Error(`Projet interdit: ${projectId}`);

    const [pendingAggregate, current] = await Promise.all([
        db.collectionGroup('customer_return_requests')
            .where('status', '==', 'pending_review')
            .count()
            .get(),
        db.doc('admin_action_summary/current').get()
    ]);
    const pendingReturns = Number(pendingAggregate.data().count || 0);
    if (!Number.isSafeInteger(pendingReturns) || pendingReturns < 0) {
        throw new Error('ADMIN_ACTION_SUMMARY_BOOTSTRAP_INVALID');
    }

    if (apply) {
        await db.doc('admin_action_summary/current').set({
            schemaVersion: 1,
            pendingReturns,
            totalPending: pendingReturns,
            revision: Math.max(0, Number(current.data()?.revision || 0)) + 1,
            source: 'bounded_collection_group_count_bootstrap',
            sourceUpdateTime: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    process.stdout.write(`${JSON.stringify({
        mode: apply ? 'apply' : 'dry-run',
        projectId,
        pendingReturns,
        currentExists: current.exists,
        plannedWrites: apply ? 1 : 0,
        estimatedIndexEntryReads: Math.max(1, Math.ceil(pendingReturns / 1000))
    }, null, 2)}\n`);
}

main()
    .catch((error) => {
        process.stderr.write(`${error.stack || error.message}\n`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await admin.app().delete().catch(() => {});
    });
