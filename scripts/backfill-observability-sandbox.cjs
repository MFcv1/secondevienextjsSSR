'use strict';

// Utilise exactement la meme instance SDK que le code Functions pour eviter
// de melanger deux classes Timestamp/FieldValue pendant le backfill local.
const admin = require('../functions/node_modules/firebase-admin');

const EXPECTED_PROJECT = 'secondevienextjsssr';
const APPLY_CONFIRMATION = 'BACKFILL_SANDBOX_OBSERVABILITY';
const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 500;

function readArg(name) {
    const prefix = `--${name}=`;
    const match = process.argv.find((value) => value.startsWith(prefix));
    return match ? match.slice(prefix.length) : null;
}

const projectId = readArg('project') || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const apply = process.argv.includes('--apply');
if (projectId !== EXPECTED_PROJECT) {
    throw new Error(`Projet refuse: ${projectId || 'absent'}. Sandbox attendu: ${EXPECTED_PROJECT}.`);
}
if (apply && readArg('confirm') !== APPLY_CONFIRMATION) {
    throw new Error(`Confirmation requise: --confirm=${APPLY_CONFIRMATION}`);
}

process.env.GCLOUD_PROJECT = projectId;
admin.initializeApp({ projectId });
const db = admin.firestore();
const {
    archiveDay,
    compactDay,
    compactMonth,
    compactYear,
    materializeSessionFact
} = require('../functions/src/analytics/rollups');

function millis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    if (typeof value === 'number') return value;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function dateKey(value) {
    return new Date(value).toISOString().slice(0, 10);
}

async function readCollection(name) {
    const documents = [];
    let cursor = null;
    for (;;) {
        let query = db.collection(name)
            .orderBy(admin.firestore.FieldPath.documentId())
            .limit(PAGE_SIZE);
        if (cursor) query = query.startAfter(cursor);
        const snapshot = await query.get();
        documents.push(...snapshot.docs);
        if (snapshot.size < PAGE_SIZE) break;
        cursor = snapshot.docs.at(-1);
    }
    return documents;
}

function orderSort(left, right) {
    const time = millis(left.data()?.createdAt) - millis(right.data()?.createdAt);
    return time || left.id.localeCompare(right.id);
}

async function planOrders() {
    const orders = (await readCollection('orders')).sort(orderSort);
    const assigned = new Map();
    const used = new Set();
    for (const document of orders) {
        const existing = Number(document.data()?.orderNumber);
        if (Number.isSafeInteger(existing) && existing > 0 && !used.has(existing)) {
            assigned.set(document.id, existing);
            used.add(existing);
        }
    }
    let next = 1;
    for (const document of orders) {
        if (assigned.has(document.id)) continue;
        while (used.has(next)) next += 1;
        assigned.set(document.id, next);
        used.add(next);
        next += 1;
    }
    const max = used.size ? Math.max(...used) : 0;
    return {
        orders,
        assigned,
        max,
        missing: orders.filter((document) => !Number.isSafeInteger(Number(document.data()?.orderNumber))).length
    };
}

async function applyOrders(plan) {
    let batch = db.batch();
    let writes = 0;
    for (const document of plan.orders) {
        if (Number(document.data()?.orderNumber) === plan.assigned.get(document.id)) continue;
        batch.set(document.ref, { orderNumber: plan.assigned.get(document.id) }, { merge: true });
        writes += 1;
        if (writes % 400 === 0) {
            await batch.commit();
            batch = db.batch();
        }
    }
    batch.set(db.doc('sys_counters/orders'), {
        schemaVersion: 1,
        nextOrderNumber: plan.max + 1,
        lastAssignedNumber: plan.max,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    await batch.commit();
    return writes + 1;
}

async function planSessions() {
    const sessions = await readCollection('analytics_sessions');
    const dates = new Set();
    const archiveDates = new Set();
    const cutoff = Date.now() - (75 * DAY_MS);
    let sensitive = 0;
    let missingExpiry = 0;
    for (const document of sessions) {
        const value = document.data() || {};
        const startedAt = millis(value.startedAt) || millis(value.lastActivityAt);
        if (startedAt) {
            dates.add(dateKey(startedAt));
            if (startedAt <= cutoff) archiveDates.add(dateKey(startedAt));
        }
        if (value.email || value.ip || value.ipMeta || value.userAgent) sensitive += 1;
        if (!value.expireAt) missingExpiry += 1;
    }
    return { sessions, dates, archiveDates, sensitive, missingExpiry };
}

async function applySessions(plan) {
    const archiveResults = [];
    for (const key of [...plan.archiveDates].sort()) {
        archiveResults.push(await archiveDay(key, db, admin.storage()));
    }

    const clientSessions = plan.sessions.filter((document) => document.data()?.type !== 'admin');
    for (let offset = 0; offset < clientSessions.length; offset += 10) {
        await Promise.all(clientSessions.slice(offset, offset + 10).map((document) => (
            materializeSessionFact(document.id, document.data() || {}, db)
        )));
    }

    let processed = 0;
    let batch = db.batch();
    let pending = 0;
    for (const document of plan.sessions) {
        const value = document.data() || {};
        const startedAt = millis(value.startedAt) || millis(value.lastActivityAt) || Date.now();
        batch.set(document.ref, {
            email: admin.firestore.FieldValue.delete(),
            ip: admin.firestore.FieldValue.delete(),
            ipMeta: admin.firestore.FieldValue.delete(),
            userAgent: admin.firestore.FieldValue.delete(),
            expireAt: admin.firestore.Timestamp.fromMillis(startedAt + (90 * DAY_MS))
        }, { merge: true });
        processed += 1;
        pending += 1;
        if (pending === 300) {
            await batch.commit();
            batch = db.batch();
            pending = 0;
        }
    }
    if (pending) await batch.commit();

    for (const key of [...plan.dates].sort()) await compactDay(key, db);
    const months = new Set([...plan.dates].map((key) => key.slice(0, 7)));
    for (const key of [...months].sort()) await compactMonth(key, db);
    const years = new Set([...months].map((key) => key.slice(0, 4)));
    for (const key of [...years].sort()) await compactYear(key, db);
    return { processed, archivedDays: archiveResults.length, compactedDays: plan.dates.size };
}

async function main() {
    const [orders, sessions] = await Promise.all([planOrders(), planSessions()]);
    const report = {
        mode: apply ? 'apply' : 'dry-run',
        projectId,
        orders: { total: orders.orders.length, missingNumber: orders.missing, nextOrderNumber: orders.max + 1 },
        analytics: {
            sessions: sessions.sessions.length,
            days: sessions.dates.size,
            daysToArchive: sessions.archiveDates.size,
            documentsWithLegacySensitiveFields: sessions.sensitive,
            documentsMissingExpiry: sessions.missingExpiry
        }
    };
    if (apply) {
        report.applied = {
            orderWrites: await applyOrders(orders),
            analytics: await applySessions(sessions)
        };
    }
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
    process.stderr.write(`${error?.stack || error}\n`);
    process.exitCode = 1;
});
