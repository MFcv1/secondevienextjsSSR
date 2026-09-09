'use strict';
const { onMessagePublished } = require('firebase-functions/v2/pubsub');
const admin = require('firebase-admin');
const { parseBudgetMessage, mergeCosts } = require('./projectCostsCore.cjs');

exports.captureProjectCostsGen2 = onMessagePublished({
    topic: 'project-costs-budget', region: 'europe-west1', memory: '256MiB',
    cpu: 'gcf_gen1', concurrency: 1, minInstances: 0, maxInstances: 1,
    timeoutSeconds: 30, retry: true,
    serviceAccount: 'project-costs-runtime@secondevienextjsssr.iam.gserviceaccount.com',
}, async event => {
    let row;
    try {
        row = parseBudgetMessage(event.data.message, {
            account: process.env.PROJECT_COSTS_BILLING_ACCOUNT,
            budget: process.env.PROJECT_COSTS_BUDGET_ID,
        });
    } catch (error) {
        if (error.message === 'billing_not_configured') throw error;
        console.warn('project_costs_message_rejected'); // Never log the billing payload.
        return;
    }
    const db = admin.firestore();
    await db.runTransaction(async transaction => {
        const ref = db.doc('sys_project_costs/current');
        const [snapshot, traffic] = await Promise.all([
            transaction.get(ref), transaction.get(db.doc('admin_analytics_realtime/history')),
        ]);
        const next = mergeCosts(snapshot.data(), [row], traffic.data());
        if (next) transaction.set(ref, next);
    });
});
