'use strict';

const admin = require('firebase-admin');
const {
    normalizeFinancialHistorySource
} = require('../functions/src/admin/financialHistoryDomain');

const EXPECTED_PROJECT = 'secondevienextjsssr';
const APPLY_TOKEN = 'BOOTSTRAP_FINANCIAL_HISTORY_SANDBOX';
const apply = process.argv.includes('--apply');

if (apply && process.env.APPROVAL !== APPLY_TOKEN) {
    throw new Error(`APPROVAL=${APPLY_TOKEN} requis avec --apply`);
}

admin.initializeApp({ projectId: EXPECTED_PROJECT });
const db = admin.firestore();

async function readCollection(name) {
    const rows = [];
    let cursor = null;
    do {
        let request = db.collection(name)
            .orderBy(admin.firestore.FieldPath.documentId())
            .limit(500);
        if (cursor) request = request.startAfter(cursor);
        const snapshot = await request.get();
        rows.push(...snapshot.docs);
        cursor = snapshot.size === 500 ? snapshot.docs.at(-1) : null;
    } while (cursor);
    return rows;
}

function add(map, key, cents) {
    map.set(key, Number(map.get(key) || 0) + cents);
}

async function main() {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || EXPECTED_PROJECT;
    if (projectId !== EXPECTED_PROJECT) throw new Error(`Projet interdit: ${projectId}`);

    const [legacy, commerce, existingDay, existingMonth, existingYear] = await Promise.all([
        readCollection('sales_stats_daily'),
        readCollection('commerce_financial_daily'),
        db.collection('admin_finance_history_days').limit(1).get(),
        db.collection('admin_finance_history_months').limit(1).get(),
        db.collection('admin_finance_history_years').limit(1).get()
    ]);
    const projectionAlreadyInitialized =
        !existingDay.empty || !existingMonth.empty || !existingYear.empty;
    if (apply && projectionAlreadyInitialized) {
        throw new Error('Projection deja initialisee: utiliser les projecteurs ou une reconciliation dediee');
    }
    const days = new Map();
    const consume = (sourceKind, snapshot) => {
        const contribution = normalizeFinancialHistorySource(sourceKind, snapshot.data());
        if (!contribution || contribution.ignored) return;
        const current = days.get(contribution.dateKey) || {
            dateKey: contribution.dateKey,
            totalRevenueCents: 0,
            sources: {}
        };
        current.totalRevenueCents += contribution.revenueCents;
        current.sources[sourceKind] = {
            revenueCents: contribution.revenueCents,
            tombstone: false,
            sourceUpdateTime: snapshot.updateTime,
            eventId: `bootstrap:${sourceKind}:${snapshot.id}`
        };
        days.set(contribution.dateKey, current);
    };
    legacy.forEach((snapshot) => consume('legacy', snapshot));
    commerce.forEach((snapshot) => consume('commerce', snapshot));

    const months = new Map();
    const years = new Map();
    for (const day of days.values()) {
        add(months, day.dateKey.slice(0, 7), day.totalRevenueCents);
        add(years, day.dateKey.slice(0, 4), day.totalRevenueCents);
    }

    if (apply) {
        const writer = db.bulkWriter();
        for (const day of days.values()) {
            writer.set(db.doc(`admin_finance_history_days/${day.dateKey}`), {
                schemaVersion: 1,
                ...day,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                revision: 1
            });
        }
        for (const [monthKey, totalRevenueCents] of months) {
            writer.set(db.doc(`admin_finance_history_months/${monthKey}`), {
                schemaVersion: 1,
                monthKey,
                totalRevenueCents,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                revision: 1
            });
        }
        for (const [yearKey, totalRevenueCents] of years) {
            writer.set(db.doc(`admin_finance_history_years/${yearKey}`), {
                schemaVersion: 1,
                yearKey,
                totalRevenueCents,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                revision: 1
            });
        }
        await writer.close();
    }

    process.stdout.write(`${JSON.stringify({
        mode: apply ? 'apply' : 'dry-run',
        projectId,
        sourceReads: legacy.length + commerce.length,
        sourceDocuments: { legacy: legacy.length, commerce: commerce.length },
        projectionAlreadyInitialized,
        projectionDocuments: { days: days.size, months: months.size, years: years.size },
        plannedWrites: apply ? days.size + months.size + years.size : 0
    }, null, 2)}\n`);
}

main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
});
