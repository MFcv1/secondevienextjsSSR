'use strict';

// Use the exact SDK instance loaded by the Functions domain. Firestore
// sentinels are class instances and cannot cross two firebase-admin copies.
const admin = require('../functions/node_modules/firebase-admin');

const EXPECTED_PROJECT = 'secondevienextjsssr';
const APPLY_TOKEN = 'BACKFILL_ANALYTICS_FACTS_SANDBOX';
const PAGE_SIZE = 100;
const MAX_SESSIONS = 5000;
const apply = process.argv.includes('--apply');

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
    materializeSessionFact
} = require('../functions/src/analytics/rollups');

const db = admin.firestore();

async function main() {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || EXPECTED_PROJECT;
    if (projectId !== EXPECTED_PROJECT) throw new Error(`Projet interdit: ${projectId}`);

    const [inactiveCount, factCount] = await Promise.all([
        db.collection('analytics_sessions').where('sessionActive', '==', false).count().get(),
        db.collection('analytics_session_facts').count().get()
    ]);
    const inactiveSessions = Number(inactiveCount.data().count || 0);
    const materializedFactsBefore = Number(factCount.data().count || 0);
    if (inactiveSessions > MAX_SESSIONS) {
        throw new Error(`Backfill refuse: ${inactiveSessions} sessions depassent la borne ${MAX_SESSIONS}`);
    }

    if (!apply) {
        process.stdout.write(`${JSON.stringify({
            mode: 'dry-run',
            projectId,
            inactiveSessions,
            materializedFactsBefore,
            maximumSessions: MAX_SESSIONS,
            plannedWrites: 0
        }, null, 2)}\n`);
        return;
    }

    const outcomes = { created: 0, updated: 0, noop: 0, ignored: 0 };
    const dayKeys = new Set();
    let cursor = null;
    let processed = 0;
    do {
        let query = db.collection('analytics_sessions')
            .where('sessionActive', '==', false)
            .orderBy('lastActivityAt', 'asc')
            .limit(PAGE_SIZE);
        if (cursor) query = query.startAfter(cursor);
        const snapshot = await query.get();
        for (const document of snapshot.docs) {
            const session = document.data();
            const outcome = await materializeSessionFact(document.id, session, db);
            outcomes[outcome] = Number(outcomes[outcome] || 0) + 1;
            if (session.type !== 'admin') {
                dayKeys.add(contributionFor(document.id, session).dateKey);
            }
            processed += 1;
        }
        cursor = snapshot.size === PAGE_SIZE ? snapshot.docs.at(-1) : null;
    } while (cursor);

    if (processed !== inactiveSessions) {
        throw new Error(`Backfill incomplet: ${processed}/${inactiveSessions}`);
    }

    let changedDays = 0;
    for (const key of [...dayKeys].sort()) {
        const result = await compactDay(key, db);
        if (result.changed) changedDays += 1;
    }
    const monthKeys = [...new Set([...dayKeys].map((key) => key.slice(0, 7)))].sort();
    const yearKeys = [...new Set([...dayKeys].map((key) => key.slice(0, 4)))].sort();
    for (const key of monthKeys) await compactMonth(key, db);
    for (const key of yearKeys) await compactYear(key, db);
    const insights = await materializeDashboardInsights(db);

    process.stdout.write(`${JSON.stringify({
        mode: 'apply',
        projectId,
        inactiveSessions,
        materializedFactsBefore,
        processed,
        outcomes,
        compacted: {
            days: dayKeys.size,
            changedDays,
            months: monthKeys.length,
            years: yearKeys.length,
            insightsChanged: insights.changed === true
        },
        estimatedFactReads: processed * 2,
        estimatedFactWrites: (outcomes.created + outcomes.updated) * 2
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
