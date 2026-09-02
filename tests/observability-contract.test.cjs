'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
    errorReportingMessage,
    hashOpaque,
    isExpectedError,
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

test('la console admin garde Cloud Logging cote serveur et sous projection expurgee', () => {
    const callableSource = read('functions/src/observability/diagnosticTimeline.js');
    const uiSource = read('src/kit/admin/AdminIncidentConsole.jsx');
    const rulesSource = read('firestore.rules');

    assert.match(callableSource, /checkActiveStrongAdmin/);
    assert.match(callableSource, /writeSecurityAudit/);
    assert.match(callableSource, /MAX_EVENTS\s*=\s*100/);
    assert.match(uiSource, /getDiagnosticTimelineAdmin/);
    assert.doesNotMatch(uiSource, /logging\.googleapis|business_events|collection\(/);
    const systemSource = read('functions/src/observability/systemIncidents.js');
    assert.match(systemSource, /checkActiveStrongAdmin/);
    assert.match(systemSource, /writeSecurityAudit/);
    assert.match(systemSource, /MAX_SCAN_ENTRIES\s*=\s*500/);
    assert.match(systemSource, /SENSITIVE_KEY/);
    assert.match(rulesSource, /match \/business_events\/\{eventId\}[\s\S]*allow read, write: if false/);
    const projectionSource = read('functions/src/observability/systemIncidentProjection.js');
    const realtimeUi = read('src/kit/admin/SystemIncidentConsole.jsx');
    assert.match(projectionSource, /admin_system_incident_events/);
    assert.match(projectionSource, /admin_system_incident_summary/);
    assert.match(projectionSource, /onMessagePublished/);
    assert.match(read('app/admin/AdminAppIsland.jsx'), /onSnapshot\(doc\(db, 'admin_system_incident_summary', 'current'\)/);
    assert.doesNotMatch(realtimeUi, /onSnapshot|collection\(/);
    assert.doesNotMatch(realtimeUi, /getSystemIncidentsAdmin/);
    assert.match(rulesSource, /match \/admin_system_incident_summary\/\{docId\}[\s\S]*isStrongArtisan\(\)/);
    assert.match(rulesSource, /match \/admin_system_incidents\/\{incidentId\}[\s\S]*allow read, write: if false/);
});

test('Error Reporting recoit une pile expurgee seulement pour les erreurs inattendues', () => {
    assert.equal(isExpectedError({ code: 'invalid-argument' }), true);
    assert.equal(isExpectedError(new Error('panne')), false);
    const error = new Error('client@example.com ne doit pas sortir');
    const message = errorReportingMessage(error);
    assert.match(message, /^Error: operation failed/);
    assert.doesNotMatch(message, /client@example\.com/);
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
