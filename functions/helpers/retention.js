'use strict';

const admin = require('firebase-admin');

const DAY_MS = 24 * 60 * 60 * 1000;
const AUDIT_RETENTION_DAYS = 366;
const AFFILIATE_RETENTION_DAYS = 90;

function timestampAfterDays(days, nowMillis = Date.now()) {
    const normalizedDays = Number(days);
    const normalizedNow = Number(nowMillis);
    if (!Number.isFinite(normalizedDays) || normalizedDays <= 0) {
        throw new Error('RETENTION_DAYS_INVALID');
    }
    if (!Number.isFinite(normalizedNow) || normalizedNow <= 0) {
        throw new Error('RETENTION_NOW_INVALID');
    }
    return admin.firestore.Timestamp.fromMillis(
        normalizedNow + (Math.floor(normalizedDays) * DAY_MS)
    );
}

module.exports = {
    AFFILIATE_RETENTION_DAYS,
    AUDIT_RETENTION_DAYS,
    DAY_MS,
    timestampAfterDays
};
