'use strict';
const { randomUUID } = require('node:crypto');

// Only authoritative commerce transactions use this adapter. Markers are
// committed with their sources, independently of the dashboard projectors.
function runCommerceTransaction(db, callback, { enabled = process.env.COMMERCE_RECONCILIATION_MODE === 'grouped', now = Date.now, token = randomUUID } = {}) {
    if (!enabled) return db.runTransaction(callback);
    return db.runTransaction(async transaction => {
        const days = new Set();
        const track = (ref, data) => {
            if (/^orders\/[^/]+$/.test(ref.path)) days.add(new Date(now()).toISOString().slice(0, 10));
            if (/^commerce_financial_facts\/[^/]+$/.test(ref.path)) {
                const at = Date.parse(data?.effectiveAt);
                if (!Number.isFinite(at)) throw Error('RECONCILIATION_FACT_DATE_INVALID');
                days.add(new Date(at).toISOString().slice(0, 10));
            }
        };
        const wrapped = new Proxy(transaction, { get(target, property) {
            if (['set', 'create', 'update', 'delete'].includes(property)) return (ref, ...args) => {
                track(ref, args[0]); target[property](ref, ...args); return wrapped;
            };
            const value = target[property]; return typeof value === 'function' ? value.bind(target) : value;
        } });
        const result = await callback(wrapped);
        for (const day of days) transaction.set(db.doc(`sys_commerce_reconciliation/${day}`), {
            schemaVersion: 1, dateKey: day, dirtyToken: token(), changedAt: new Date(now()), expireAt: null
        }, { merge: true });
        if (days.size) transaction.set(db.doc('sys_commerce_reconciliation_watermark/current'), { token: token(), changedAt: new Date(now()) });
        return result;
    });
}

// Accounting days remain UTC, matching the existing financial rollups.
// Run at 03:17 Paris on the following calendar date (after both day endings).
function reconciliationDue(day, now = Date.now()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw Error('RECONCILIATION_DAY_INVALID');
    const nextDate = new Date(Date.parse(`${day}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
    const probe = Date.parse(`${nextDate}T03:17:00Z`);
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hourCycle: 'h23' }).format(probe));
    return Math.max(probe - (hour - 3) * 3600000, now + 300000);
}
module.exports = { runCommerceTransaction, reconciliationDue };
