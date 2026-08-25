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
