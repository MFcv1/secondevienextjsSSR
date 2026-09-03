// P4 read-only inventory. This script never writes to Google Cloud.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { buildSeed, contribution, keysFor, changeBucket } = require('../functions/src/analytics/realtime');
const { point, summaryBucket } = require('../functions/src/analytics/realtime');
const PROJECT = 'secondevienextjsssr';
const LIMIT = 2000;
const counters = ['sessions', 'duration', 'bounces', 'mobile'];
const version = value => ({ seconds: value.seconds, nanoseconds: value.nanoseconds });
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const zeroSketch = Buffer.alloc(1024).toString('base64');

// Midnight Paris, including both daylight-saving transitions. No host timezone dependency.
export function parisMidnight(day) {
    const noon = Date.parse(`${day}T12:00:00Z`);
    if (!Number.isFinite(noon) || new Date(noon).toISOString().slice(0, 10) !== day) throw new Error('INVENTORY_DATE');
    const candidate = noon - 14 * 3600000;
    for (let offset = 0; offset <= 3; offset++) {
        const ms = candidate + offset * 3600000;
        if (keysFor(ms)[2] === `day_${day}` && keysFor(ms - 1)[2] !== `day_${day}`) return ms;
    }
    throw new Error('INVENTORY_MIDNIGHT');
}

export function prepareInventory({ sessions, facts, days, exclusions, now, epoch }) {
    if ([sessions, facts, days, exclusions].some(rows => rows.length > LIMIT)) throw new Error('INVENTORY_LIMIT');
    if (!sessions.length) throw new Error('INVENTORY_NO_SOURCE_BOUNDARY');
    const sourceDays = sessions.map(({ data }) => {
        const ms = typeof data.startedAt?.toMillis === 'function' ? data.startedAt.toMillis() : data.startedAt;
        if (!Number.isSafeInteger(ms) || ms <= 0 || ms > now) throw new Error('INVENTORY_SOURCE_DATE');
        return keysFor(ms)[2].slice(4);
    });
    const firstMutableDay = [...sourceDays].sort()[0];
    const mutableSinceMs = parisMidnight(firstMutableDay);
    const sourceIds = new Set(sessions.map(row => row.id));
    // A missing mutable source might have been withdrawn as admin, not expired by TTL.
    // Do not guess from the old fact; this requires explicit operator classification.
    if (facts.some(row => !sourceIds.has(row.id) && row.data.contribution.dateKey >= firstMutableDay)) {
        throw new Error('INVENTORY_ORPHAN_MUTABLE_FACT');
    }
    const legacyDays = days.filter(day => day.dateKey < firstMutableDay);
    for (const day of legacyDays) {
        let expected;
        for (const fact of facts.filter(row => row.data.contribution.dateKey === day.dateKey)) {
            const c = fact.data.contribution;
            expected = changeBucket(expected, null, { ...c, point: point(c.subject) });
        }
        if (!expected || digest(summaryBucket(expected)) !== digest(Object.fromEntries([...counters, 'uniqueHll'].map(key => [key, day[key]])))) {
            throw new Error('INVENTORY_IMMUTABLE_BASELINE_UNPROVEN');
        }
    }
    const allDates = [...sourceDays, ...days.map(day => day.dateKey)].sort();
    const input = { epoch, now, mutableSinceMs, coverageStartMs: parisMidnight(allDates[0]), historyComplete: false,
        // Export neither UID nor journey nor email. IDs remain private replay handles.
        sessions: sessions.map(({ id, data, updateTime }) => ({ id, updateTime: version(updateTime),
            prepared: contribution(id, data), data: data.type === 'admin' ? { type: 'admin' } : {} })),
        facts: facts.map(({ id, data, updateTime }) => ({ id, updateTime: version(updateTime), data: {
            contribution: Object.fromEntries(['dateKey', 'subject', ...counters].map(field => [field, data.contribution[field]]))
        } })), exclusions: exclusions.filter(row => row.data.reason === 'admin_identity_resolved').map(row => row.id), legacyDays };
    const seed = buildSeed(input);
    const differences = days.flatMap(day => {
        const expected = seed.buckets[`day_${day.dateKey}`];
        const fields = counters.filter(field => day[field] !== (expected?.[field] || 0));
        const sketchEqual = day.uniqueHll === (expected?.uniqueHll || zeroSketch);
        return fields.length || !sketchEqual ? [{ date: day.dateKey, fields, previousSessions: day.sessions,
            sourceSessions: expected?.sessions || 0, sketchEqual }] : [];
    });
    // Explain legacy date drift using immutable source timestamps, not a guessed offset.
    const sourcesById = new Map(sessions.map(row => [row.id, row]));
    const dateCorrections = facts.flatMap(fact => {
        const source = sourcesById.get(fact.id);
        if (!source || source.data.type === 'admin') return [];
        const expectedDay = contribution(source.id, source.data).keys[2].slice(4);
        const previousDay = fact.data.contribution.dateKey;
        return previousDay === expectedDay ? [] : [{ previousDay, expectedDay }];
    });
    const dayDrift = new Map();
    for (const { previousDay, expectedDay } of dateCorrections) {
        dayDrift.set(previousDay, (dayDrift.get(previousDay) || 0) - 1);
        dayDrift.set(expectedDay, (dayDrift.get(expectedDay) || 0) + 1);
    }
    const unaccountedSessionDays = differences.filter(row => row.sourceSessions - row.previousSessions !== (dayDrift.get(row.date) || 0));
    const report = { schemaVersion: 1, project: PROJECT, observedAt: new Date(now).toISOString(), cloudWrites: 0,
        sourceDocuments: sessions.length, sourceAdmins: sessions.filter(row => row.data.type === 'admin').length,
        factDocuments: facts.length, dailyDocuments: days.length, exclusions: exclusions.length,
        mutableSince: new Date(mutableSinceMs).toISOString(), immutableDays: legacyDays.length,
        expectedSessions: Object.entries(seed.buckets).filter(([key]) => key.startsWith('year_')).reduce((sum, [, b]) => sum + b.sessions, 0),
        previousSessions: days.reduce((sum, day) => sum + day.sessions, 0),
        ledgerDocuments: Object.keys(seed.ledgers).length, tombstones: Object.values(seed.ledgers).filter(row => row.tombstone).length,
        bucketDocuments: Object.keys(seed.buckets).length, plannedBootstrapWrites: Object.keys(seed.ledgers).length + Object.keys(seed.buckets).length + 3,
        publicBytes: { recent: Buffer.byteLength(JSON.stringify(seed.recent)), history: Buffer.byteLength(JSON.stringify(seed.history)) },
        dateCorrections, dailyDifferences: differences, unaccountedSessionDays, historyComplete: false,
        seedDigest: digest(seed), inputDigest: digest(input), readyForCutover: false };
    return { input, seed, report };
}

export async function inventory(db, { now, epoch }) {
    const fields = {
        analytics_sessions: ['startedAt', 'type', 'sessionActive', 'duration', 'journeyCount', 'journey', 'device', 'userId'],
        analytics_session_facts: ['contribution.dateKey', 'contribution.subject', ...counters.map(key => `contribution.${key}`)],
        analytics_rollup_days: ['dateKey', ...counters, 'uniqueHll'],
        analytics_session_exclusions: ['reason']
    };
    // All queries share one consistent Firestore snapshot. LIMIT+1 rejects truncation.
    const snapshots = await db.runTransaction(async tx => Promise.all(Object.entries(fields).map(([collection, selected]) =>
        tx.get(db.collection(collection).select(...selected).limit(LIMIT + 1)))), { readOnly: true });
    if (snapshots.some(snapshot => snapshot.size > LIMIT)) throw new Error('INVENTORY_LIMIT');
    const records = snapshot => snapshot.docs.map(doc => ({ id: doc.id, data: doc.data(), updateTime: doc.updateTime }));
    const result = prepareInventory({ now, epoch, sessions: records(snapshots[0]), facts: records(snapshots[1]),
        days: snapshots[2].docs.map(doc => doc.data()), exclusions: records(snapshots[3]) });
    result.report.sourceSnapshotReadTime = snapshots[0].readTime.toDate().toISOString();
    return result;
}

async function main() {
    if (process.argv.slice(2).join(' ') !== '--cloud --project=secondevienextjsssr') throw new Error('INVENTORY_EXPLICIT_SANDBOX_REQUIRED');
    for (const key of ['GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT']) {
        if (process.env[key] && process.env[key] !== PROJECT) throw new Error('INVENTORY_PROJECT_MISMATCH');
    }
    if (process.env.FIRESTORE_EMULATOR_HOST) throw new Error('INVENTORY_EMULATOR_NOT_CLOUD');
    const admin = require('../functions/node_modules/firebase-admin');
    const app = admin.initializeApp({ projectId: PROJECT });
    try {
        const now = Date.now();
        const epoch = `p4-${now}`;
        const result = await inventory(admin.firestore(), { now, epoch });
        const folder = fileURLToPath(new URL(`../output/analytics-realtime/${epoch}/`, import.meta.url));
        mkdirSync(folder, { recursive: true, mode: 0o700 });
        chmodSync(folder, 0o700);
        for (const [name, value] of Object.entries(result)) writeFileSync(`${folder}${name}.json`, JSON.stringify(value, null, 2), { mode: 0o600, flag: 'wx' });
        console.log(JSON.stringify({ ...result.report, privateArtifacts: folder }, null, 2));
    } finally { await app.delete(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => { console.error(`Inventory refused (${error.code || error.message}). No cloud write.`); process.exitCode = 1; });
}
