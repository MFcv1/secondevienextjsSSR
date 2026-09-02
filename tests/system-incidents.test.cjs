'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    buildFilter,
    groupEntries,
    handler,
    normalizeEntry,
    normalizeInput,
    redactText
} = require('../functions/src/observability/systemIncidents');
const {
    isProjectableLogEntry,
    parseMessageJson,
    projectSystemIncidentMessage,
    toLoggingEntry
} = require('../functions/src/observability/systemIncidentProjection');

function fakeEntry({ timestamp = '2026-08-25T12:00:00.000Z', insertId = 'log-1', revision = 'checkout-00001-abc' } = {}) {
    return {
        metadata: {
            timestamp: new Date(timestamp), insertId, severity: 'ERROR',
            resource: { type: 'cloud_run_revision', labels: { service_name: 'createcheckoutv2gen2', revision_name: revision, location: 'europe-west1' } },
            trace: 'projects/demo/traces/abcdef1234567890'
        },
        data: {
            event: 'function_failed', function: 'createCheckoutV2Gen2', service: 'createcheckoutv2gen2',
            errorClass: 'Error', expected: false, correlationId: 'corr_123', orderId: 'order_123',
            message: 'Error: refus pour client@example.com token abcdefghijklmnopqrstuvwxyz123456\n    at checkout (/workspace/functions/src/checkout.js:42:3)'
        }
    };
}

test('les erreurs identiques sont dédupliquées sans perdre le nombre ni les dates', () => {
    const groups = groupEntries([fakeEntry(), fakeEntry({ timestamp: '2026-08-25T12:01:00.000Z', insertId: 'log-2', revision: 'checkout-00002-def' })]);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].count, 2);
    assert.equal(groups[0].firstSeen, '2026-08-25T12:00:00.000Z');
    assert.equal(groups[0].lastSeen, '2026-08-25T12:01:00.000Z');
    assert.equal(groups[0].revision, 'checkout-00002-def');
});

test('la projection retire les valeurs sensibles et conserve les corrélations sûres', () => {
    const entry = normalizeEntry(fakeEntry());
    assert.equal(entry.correlationId, 'corr_123');
    assert.equal(entry.orderId, 'order_123');
    assert.doesNotMatch(entry.stack, /client@example\.com|abcdefghijklmnopqrstuvwxyz123456/);
    assert.match(entry.stack, /\[email masqué\]/);
    assert.equal(redactText('jo@example.com'), '[email masqué]');
});

test('les fenêtres et filtres Cloud Logging restent bornés', () => {
    assert.deepEqual(normalizeInput({ action: 'list', windowHours: 24, severity: 'error' }), { action: 'list', windowHours: 24, severity: 'error', fingerprint: null });
    assert.throws(() => normalizeInput({ action: 'list', windowHours: 999 }), /Fenêtre invalide/);
    const filter = buildFilter({ windowHours: 24, severity: 'critical' });
    assert.match(filter, /severity>=CRITICAL/);
    assert.match(filter, /jsonPayload\.expected=false/);
    assert.match(filter, /ViolationOpenEventv1/);
});

test('la consultation liste et détail est autorisée, auditée et fail-closed', async () => {
    let authorized = 0;
    let audits = 0;
    const dependencies = {
        authorize: async () => { authorized += 1; },
        audit: async () => { audits += 1; return true; },
        getLogging: () => ({ getEntries: async () => [[fakeEntry()]] })
    };
    const list = await handler({ action: 'list', windowHours: 24 }, {}, dependencies);
    assert.equal(list.groups.length, 1);
    const detail = await handler({ action: 'detail', windowHours: 24, fingerprint: list.groups[0].id }, {}, dependencies);
    assert.equal(detail.occurrences.length, 1);
    assert.equal(authorized, 2);
    assert.equal(audits, 2);
    await assert.rejects(handler({ action: 'list', windowHours: 24 }, {}, { ...dependencies, audit: async () => false }), /Audit de consultation indisponible/);
});

function fakeProjectionDatabase() {
    const documents = new Map();
    const operations = { reads: 0, writes: 0 };
    return {
        documents,
        operations,
        collection(name) {
            return { doc: (id) => ({ path: `${name}/${id}` }) };
        },
        async runTransaction(callback) {
            const transaction = {
                get: async (ref) => {
                    operations.reads += 1;
                    return {
                        exists: documents.has(ref.path),
                        data: () => documents.get(ref.path)
                    };
                },
                create: (ref, data) => {
                    if (documents.has(ref.path)) throw new Error('already-exists');
                    operations.writes += 1;
                    documents.set(ref.path, data);
                },
                set: (ref, data, options) => {
                    operations.writes += 1;
                    documents.set(ref.path, options?.merge
                        ? { ...(documents.get(ref.path) || {}), ...data }
                        : data);
                }
            };
            return callback(transaction);
        }
    };
}

function fakeRoutedLog({ insertId = 'routed-1', httpRequest = null } = {}) {
    return {
        insertId,
        logName: 'projects/secondevienextjsssr/logs/run.googleapis.com%2Fstderr',
        timestamp: '2026-09-02T09:30:00.000Z',
        severity: 'ERROR',
        resource: {
            type: 'cloud_run_revision',
            labels: {
                service_name: 'dispatchcatalogrevalidation',
                revision_name: 'dispatchcatalogrevalidation-00013-cop',
                location: 'europe-west1'
            }
        },
        textPayload: 'Unhandled error Error: CATALOG_SERVED_VERSION_STALE pour client@example.com\n    at verifyPublishedCatalogVersion (/workspace/catalogRevalidation.js:42:3)',
        ...(httpRequest ? { httpRequest } : {})
    };
}

test('le sink transforme uniquement les erreurs runtime utiles et ignore les request logs', () => {
    const raw = fakeRoutedLog();
    const encoded = Buffer.from(JSON.stringify(raw)).toString('base64');
    assert.deepEqual(parseMessageJson({ data: encoded }), raw);
    const normalized = normalizeEntry(toLoggingEntry(raw));
    assert.equal(normalized.errorClass, 'CATALOG_SERVED_VERSION_STALE');
    assert.equal(normalized.service, 'dispatchcatalogrevalidation');
    assert.doesNotMatch(normalized.stack, /client@example\.com/);
    assert.equal(isProjectableLogEntry(raw, normalized), true);
    const requestLog = fakeRoutedLog({ httpRequest: { status: 500 } });
    assert.equal(isProjectableLogEntry(requestLog, normalizeEntry(toLoggingEntry(requestLog))), false);
});

test('la projection temps réel est idempotente et ne stocke aucun payload brut', async () => {
    const database = fakeProjectionDatabase();
    const message = { json: fakeRoutedLog() };
    const first = await projectSystemIncidentMessage(message, { database, now: Date.parse('2026-09-02T09:31:00.000Z') });
    assert.deepEqual(database.operations, { reads: 2, writes: 2 });
    const replay = await projectSystemIncidentMessage(message, { database, now: Date.parse('2026-09-02T09:32:00.000Z') });
    assert.equal(first.projected, true);
    assert.deepEqual(replay, { projected: false, reason: 'duplicate' });
    const summary = database.documents.get('admin_system_incident_summary/current');
    const incident = summary.incidents.find((item) => item.fingerprint === first.fingerprint);
    assert.equal(database.documents.size, 2);
    assert.equal(incident.occurrenceCount, 1);
    assert.equal(summary.revision, 1);
    assert.equal(summary.recentTotal, 1);
    assert.deepEqual(database.operations, { reads: 4, writes: 2 });
    assert.doesNotMatch(JSON.stringify([...database.documents.values()]), /client@example\.com/);
    assert.doesNotMatch(JSON.stringify(incident), /textPayload|jsonPayload|httpRequest/);
});

test('le back-office écoute Firestore et ne rappelle plus la callable Cloud Logging', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const consoleSource = fs.readFileSync(path.resolve(__dirname, '../src/kit/admin/SystemIncidentConsole.jsx'), 'utf8');
    const shellSource = fs.readFileSync(path.resolve(__dirname, '../app/admin/AdminAppIsland.jsx'), 'utf8');
    assert.match(shellSource, /onSnapshot\(doc\(db, 'admin_system_incident_summary', 'current'\)/);
    assert.match(shellSource, /data\.incidents\.length <= 50/);
    assert.match(consoleSource, /logsExplorerUrl/);
    assert.doesNotMatch(consoleSource, /onSnapshot|collection\(|getSystemIncidentsAdmin|getCallableFunction/);
});
