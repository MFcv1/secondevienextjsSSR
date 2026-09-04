'use strict';

const admin = require('../functions/node_modules/firebase-admin');

const EXPECTED_PROJECT = 'secondevienextjsssr';
const APPLY_TOKEN = 'REPAIR_ANALYTICS_DAY_SANDBOX';
const MAX_FACTS = 400;
const DAY_MS = 24 * 60 * 60 * 1000;
const apply = process.argv.includes('--apply');
const dateArg = process.argv.find((argument) => argument.startsWith('--date='))?.slice('--date='.length);

if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateArg || ''))) {
    throw new Error('--date=YYYY-MM-DD requis');
}
if (apply && process.env.APPROVAL !== APPLY_TOKEN) {
    throw new Error(`APPROVAL=${APPLY_TOKEN} requis avec --apply`);
}

admin.initializeApp({ projectId: EXPECTED_PROJECT });
const {
    compactDay,
    compactMonth,
    compactYear,
    contributionFor,
    materializeDashboardInsights,
    materializeSessionFact,
    removeMaterializedSessionFact
} = require('../functions/src/analytics/rollups');
const db = admin.firestore();

async function main() {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || EXPECTED_PROJECT;
    if (projectId !== EXPECTED_PROJECT) throw new Error(`Projet interdit: ${projectId}`);
    const ageDays = Math.floor((Date.now() - Date.parse(`${dateArg}T12:00:00.000Z`)) / DAY_MS);
    if (!Number.isFinite(ageDays) || ageDays < -1 || ageDays > 14) {
        throw new Error('La reparation est reservee a une journee recente de moins de 14 jours');
    }

    const facts = await db.collection('analytics_session_facts')
        .where('contribution.dateKey', '==', dateArg)
        .limit(MAX_FACTS + 1)
        .get();
    if (facts.size > MAX_FACTS) throw new Error(`Borne depassee: plus de ${MAX_FACTS} faits`);
    const sourceSnapshots = facts.empty
        ? []
        : await db.getAll(...facts.docs.map((document) => db.doc(`analytics_sessions/${document.id}`)));
    const orphans = [];
    const updates = [];
    facts.docs.forEach((factDocument, index) => {
        const source = sourceSnapshots[index];
        if (!source?.exists || source.data()?.type === 'admin') {
            orphans.push(factDocument.id);
            return;
        }
        const current = factDocument.data()?.contribution || {};
        const expected = contributionFor(factDocument.id, source.data());
        if (JSON.stringify(current) !== JSON.stringify(expected)) updates.push(factDocument.id);
    });

    if (apply) {
        for (const sessionId of orphans) await removeMaterializedSessionFact(sessionId, db);
        for (const sessionId of updates) {
            const source = await db.doc(`analytics_sessions/${sessionId}`).get();
            if (source.exists) await materializeSessionFact(sessionId, source.data(), db);
        }
        await compactDay(dateArg, db);
        await compactMonth(dateArg.slice(0, 7), db);
        await compactYear(dateArg.slice(0, 4), db);
        await materializeDashboardInsights(db);
    }

    process.stdout.write(`${JSON.stringify({
        mode: apply ? 'apply' : 'dry-run',
        projectId,
        dateKey: dateArg,
        facts: facts.size,
        orphanFacts: orphans.length,
        timezoneCorrections: updates.length,
        plannedFactDeletes: apply ? orphans.length : 0,
        plannedFactUpdates: apply ? updates.length : 0,
        identifiersExposed: false,
        maximumFacts: MAX_FACTS
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
