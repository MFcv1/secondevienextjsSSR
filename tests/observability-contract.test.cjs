'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
    hashOpaque,
    normalizeObservabilityInput,
    safeId,
    shouldSampleSuccess,
    stripObservabilityInput
} = require('../functions/helpers/observability');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

test('les identifiants de correlation sont bornes et les sessions sont hachees', () => {
    const context = normalizeObservabilityInput({
        orderId: 'order_123',
        _observability: {
            requestId: 'req_123',
            correlationId: 'corr_123',
            sessionId: 'session-secrete'
        }
    }, {});

    assert.equal(context.requestId, 'req_123');
    assert.equal(context.correlationId, 'corr_123');
    assert.equal(context.orderId, 'order_123');
    assert.equal(context.sessionIdHash, hashOpaque('session-secrete'));
    assert.notEqual(context.sessionIdHash, 'session-secrete');
    assert.equal(safeId('adresse avec espaces'), null);
});

test('les metadonnees techniques ne sont jamais transmises au metier', () => {
    assert.deepEqual(
        stripObservabilityInput({ orderId: 'o1', _observability: { requestId: 'r1' } }),
        { orderId: 'o1' }
    );
});

test('les succes sont echantillonnes mais les taux extremes restent deterministes', () => {
    assert.equal(shouldSampleSuccess({ requestId: 'r1' }, 0), false);
    assert.equal(shouldSampleSuccess({ requestId: 'r1' }, 1), true);
    assert.equal(
        shouldSampleSuccess({ requestId: 'stable' }, 0.05),
        shouldSampleSuccess({ requestId: 'stable' }, 0.05)
    );
});

test('la console admin reste serveur, bornee et sans acces direct aux logs Cloud', () => {
    const callableSource = read('functions/src/observability/diagnosticTimeline.js');
    const uiSource = read('src/kit/admin/AdminIncidentConsole.jsx');
    const rulesSource = read('firestore.rules');

    assert.match(callableSource, /checkActiveStrongAdmin/);
    assert.match(callableSource, /writeSecurityAudit/);
    assert.match(callableSource, /MAX_EVENTS\s*=\s*100/);
    assert.match(uiSource, /getDiagnosticTimelineAdmin/);
    assert.doesNotMatch(uiSource, /logging\.googleapis|business_events|collection\(/);
    assert.match(rulesSource, /match \/business_events\/\{eventId\}[\s\S]*allow read, write: if false/);
});

test('les logs Gen2 et les alertes ciblent aussi Cloud Run revision', () => {
    const monitoringSource = read('scripts/configure-functions-gen2-g1-monitoring.mjs');
    assert.match(monitoringSource, /resource\.type="cloud_run_revision"/);
    assert.match(monitoringSource, /commercereservationexpirydispatchergen2/);
    assert.match(monitoringSource, /commerceoutboxdispatchergen2/);
});

test('le journal metier est minimal, append-only et idempotent', () => {
    const source = read('functions/src/observability/businessEvents.js');
    assert.match(source, /business_events/);
    assert.match(source, /\.doc\(eventId\)\.create\(document\)/);
    assert.match(source, /schemaVersion:\s*1/);
    assert.doesNotMatch(source, /customerSnapshot|shippingAddress|billingAddress/);
    assert.doesNotMatch(source, /payload:\s*after\.payloadSnapshot/);
});
