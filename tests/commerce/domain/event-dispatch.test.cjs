'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    outboxSchedule,
    reservationSchedule,
    sameSchedule,
    taskId
} = require('../../../functions/src/commerce/domain/eventDispatch');

const root = path.resolve(__dirname, '../../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('chaque etat outbox eligible produit une tache deterministe', () => {
    const entry = { status: 'failed', attemptCount: 2, nextAttemptAt: 12345 };
    assert.deepEqual(outboxSchedule(entry), { attemptCount: 2, nextAttemptAt: 12345 });
    assert.equal(outboxSchedule({ ...entry, status: 'sent' }), null);
    assert.equal(taskId('outbox', entry), taskId('outbox', entry));
    assert.equal(sameSchedule(outboxSchedule(entry), outboxSchedule({ ...entry })), true);
});

test('une reservation held est planifiee exactement a son echeance', () => {
    const entry = {
        status: 'held', orderId: 'order-1234', stateVersion: 3,
        expiresAt: '2026-09-02T12:00:00.000Z'
    };
    const schedule = reservationSchedule(entry);
    assert.equal(schedule.orderId, 'order-1234');
    assert.equal(schedule.stateVersion, 3);
    assert.equal(schedule.expiresAtMillis, Date.parse(entry.expiresAt));
    assert.equal(reservationSchedule({ ...entry, status: 'committed' }), null);
});

test('les reveils toutes les deux minutes sont remplaces par evenements et watchdog horaire', () => {
    const events = read('functions/src/commerce/commerceEventDispatch.js');
    const gen2 = read('functions/src/commerce/gen2G9.js');
    const iam = read('scripts/configure-event-driven-commerce-iam.mjs');
    assert.match(events, /onCommerceOutboxWrittenGen2/);
    assert.match(events, /dispatchCommerceOutboxTaskGen2/);
    assert.match(events, /onCommerceReservationWrittenGen2/);
    assert.match(events, /dispatchCommerceReservationExpiryTaskGen2/);
    assert.doesNotMatch(gen2, /schedule:\s*'every 2 minutes'/);
    assert.equal((gen2.match(/schedule:\s*'every 60 minutes'/g) || []).length >= 2, true);
    assert.match(events, /invoker:\s*\[OUTBOX_SERVICE_ACCOUNT\]/);
    assert.match(events, /invoker:\s*\[RESERVATION_SERVICE_ACCOUNT\]/);
    assert.match(iam, /roles\/cloudtasks\.enqueuer/);
    assert.match(iam, /roles\/iam\.serviceAccountTokenCreator/);
    assert.match(iam, /checks\.publicInvoker === false/);
});
