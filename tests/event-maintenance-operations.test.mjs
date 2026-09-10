import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildMaintenanceMonitoring } from '../scripts/event-maintenance-monitoring.mjs';
const require = createRequire(import.meta.url);
const { bootstrapPatch } = require('../functions/src/maintenance/bootstrapCore.cjs');
const now = Date.parse('2026-09-10T00:00:00Z');
test('bootstrap seeds only missing active work and never restarts a finished operation', () => {
    assert.equal(bootstrapPatch('link', 'id', { checkout: { status: 'closed' } }, now), null);
    assert.equal(bootstrapPatch('session', 'id', { type: 'admin', sessionActive: true, lastActivityAt: now }, now), null);
    assert.equal(bootstrapPatch('session', 'id', { maintenanceWork: { state: 'succeeded' }, sessionActive: true }, now), null);
    assert.equal(bootstrapPatch('inbox', 'id', { status: 'processed' }, now), null);
    const next = bootstrapPatch('link', 'id', { checkout: { status: 'active', channel: 'admin_payment_link', expiresAt: new Date(now).toISOString() } }, now);
    assert.equal(next.due, now); assert.equal(next.state, 'pending');
    const rearmed = bootstrapPatch('link', 'id', { maintenanceWork: next }, now);
    assert.equal(rearmed.version, next.version); assert.equal(rearmed.generation, next.generation + 1);
    assert.equal(bootstrapPatch('payment', 'id', { checkout: { status: 'active', channel: 'admin_payment_link' }, payment: {} }, now), null);
});
test('monitoring requires actual destinations and watches delivery, never an empty-business heartbeat', () => {
    assert.throws(() => buildMaintenanceMonitoring({ channels: [], subscriptions: [] }), /channels/);
    const result = buildMaintenanceMonitoring({ channels: ['projects/secondevienextjsssr/notificationChannels/123'], subscriptions: ['eventarc-real-subscription'] });
    assert.equal(result.policies.length, 5);
    const encoded = JSON.stringify(result);
    assert.match(encoded, /oldest_unacked_message_age/); assert.match(encoded, /PauseQueue/);
    assert.match(encoded, /task_attempt_count/); assert.doesNotMatch(encoded, /conditionAbsent|queue\/depth/);
    assert.doesNotMatch(encoded, /dispatchPublicationCheckGen2/);
});
test('disabled task handlers fail instead of acknowledging queued work as done', async () => {
    const saved = process.env.ACTIVITY_MAINTENANCE_ENABLED;
    delete process.env.ACTIVITY_MAINTENANCE_ENABLED;
    try {
        const exports = require('../functions/src/maintenance/activityMaintenance');
        for (const [name, handler] of Object.entries(exports)) {
            if (name.startsWith('dispatch')) await assert.rejects(handler.run({ data: {} }), /MAINTENANCE_DISABLED/);
        }
    } finally {
        if (saved === undefined) delete process.env.ACTIVITY_MAINTENANCE_ENABLED;
        else process.env.ACTIVITY_MAINTENANCE_ENABLED = saved;
    }
});
