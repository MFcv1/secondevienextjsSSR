'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { maintenanceAlertEntry } = require('../functions/helpers/maintenanceAlert.cjs');
const { normalizeEntry } = require('../functions/src/observability/systemIncidents');
const { toLoggingEntry, isProjectableLogEntry, eventIdFor, logsExplorerUrl } = require('../functions/src/observability/systemIncidentProjection');
const message = { incident: { scoping_project_id: 'secondevienextjsssr', state: 'open', started_at: 1789041900,
    incident_id: '0.test_alert', policy_name: 'Seconde Vie - Événements - Queue interrompue', summary: 'sensitive@example.test',
    resource: { type: 'audited_resource', labels: { private_field: 'do not copy' } } } };
test('transport notification reaches the incident normalizer without copying arbitrary contents', () => {
    const raw = maintenanceAlertEntry(message), value = normalizeEntry(toLoggingEntry(raw));
    assert.equal(value.errorClass, 'TASK_QUEUE_INTERRUPTED');
    assert.equal(value.severity, 'CRITICAL');
    assert.equal(isProjectableLogEntry(raw, value, true), true);
    assert.equal(isProjectableLogEntry(raw, value), false);
    assert.ok(!JSON.stringify(raw).includes('sensitive@example.test'));
    assert.ok(!JSON.stringify(raw).includes('do not copy'));
    assert.equal(eventIdFor(value), eventIdFor(normalizeEntry(toLoggingEntry(maintenanceAlertEntry(message)))));
    const reopened = { incident: { ...message.incident, started_at: message.incident.started_at + 300 } };
    assert.notEqual(eventIdFor(value), eventIdFor(normalizeEntry(toLoggingEntry(maintenanceAlertEntry(reopened)))));
    assert.ok(decodeURIComponent(logsExplorerUrl(value)).includes('labels.violation_id="0.test_alert"'));
});
test('closed, foreign, malformed and unrelated notifications cannot invent incidents', () => {
    for (const patch of [{ state: 'closed' }, { scoping_project_id: 'other' }, { started_at: 'invalid' },
        { policy_name: 'G1 unrelated' }, { policy_name: 'Seconde Vie - Événements - Unrecognized' }, { incident_id: 'bad\nvalue' }]) {
        assert.equal(maintenanceAlertEntry({ incident: { ...message.incident, ...patch } }), null);
    }
});
