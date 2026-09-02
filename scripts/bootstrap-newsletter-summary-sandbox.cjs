'use strict';

const admin = require('firebase-admin');

const EXPECTED_PROJECT = 'secondevienextjsssr';
const APPLY_TOKEN = 'BOOTSTRAP_NEWSLETTER_SUMMARY_SANDBOX';
const apply = process.argv.includes('--apply');

if (apply && process.env.APPROVAL !== APPLY_TOKEN) {
    throw new Error(`APPROVAL=${APPLY_TOKEN} requis avec --apply`);
}

admin.initializeApp({ projectId: EXPECTED_PROJECT });
const db = admin.firestore();

async function main() {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || EXPECTED_PROJECT;
    if (projectId !== EXPECTED_PROJECT) throw new Error(`Projet interdit: ${projectId}`);

    const aggregate = await db.collection('newsletter_subscribers').count().get();
    const activeCount = Number(aggregate.data().count || 0);
    const current = await db.doc('admin_newsletter_summary/current').get();
    const report = {
        mode: apply ? 'apply' : 'dry-run',
        projectId,
        activeCount,
        currentExists: current.exists,
        plannedWrites: apply ? 1 : 0,
        estimatedDocumentReads: Math.max(1, Math.ceil(activeCount / 1000))
    };

    if (apply) {
        const now = admin.firestore.Timestamp.now();
        await db.doc('admin_newsletter_summary/current').set({
            schemaVersion: 1,
            activeCount,
            additionsSinceBaseline: 0,
            removalsSinceBaseline: 0,
            baselineAt: now,
            source: 'newsletter_subscriber_projection',
            latestSourceUpdateTime: now,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            revision: Math.max(0, Number(current.data()?.revision || 0)) + 1
        });
    }
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
});
