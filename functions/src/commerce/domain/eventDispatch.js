'use strict';

const crypto = require('node:crypto');

function taskId(prefix, identity) {
    const digest = crypto.createHash('sha256').update(JSON.stringify(identity)).digest('hex');
    return `${prefix}-${digest}`;
}

function outboxSchedule(entry) {
    if (!entry || !['pending', 'failed'].includes(entry.status)) return null;
    const nextAttemptAt = Number(entry.nextAttemptAt);
    if (!Number.isSafeInteger(nextAttemptAt) || nextAttemptAt < 0) return null;
    return {
        attemptCount: Math.max(0, Number(entry.attemptCount || 0)),
        nextAttemptAt
    };
}

function reservationSchedule(entry) {
    if (!entry || entry.status !== 'held') return null;
    const expiresAtMillis = Date.parse(entry.expiresAt);
    if (!Number.isSafeInteger(expiresAtMillis)) return null;
    return {
        orderId: String(entry.orderId || ''),
        stateVersion: Math.max(0, Number(entry.stateVersion || 0)),
        expiresAt: entry.expiresAt,
        expiresAtMillis
    };
}

function sameSchedule(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

module.exports = { outboxSchedule, reservationSchedule, sameSchedule, taskId };
