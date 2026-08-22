'use strict';

const crypto = require('node:crypto');

const DEFAULT_LEASE_MS = 8 * 60 * 1000;
const SCHEDULER_NAME = /^[A-Za-z][A-Za-z0-9_-]{2,80}$/;

function createSchedulerFence({
    db,
    nowMillis = () => Date.now(),
    token = () => crypto.randomUUID()
}) {
    if (!db || typeof db.runTransaction !== 'function') {
        throw new Error('COMMERCE_SCHEDULER_FENCE_DB_INVALID');
    }

    async function run({ schedulerName, owner = 'gen2', leaseMs = DEFAULT_LEASE_MS }, handler) {
        if (!SCHEDULER_NAME.test(String(schedulerName || '')) || typeof handler !== 'function') {
            throw new Error('COMMERCE_SCHEDULER_FENCE_INPUT_INVALID');
        }
        const reference = db.doc(
            `sys_commerce_operations/current/scheduler_leases/${schedulerName}`
        );
        const leaseToken = token();
        const startedAtMillis = nowMillis();
        const claim = await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(reference);
            const current = snapshot.exists ? snapshot.data() : {};
            if (current.enabled === false) {
                return { acquired: false, reason: 'kill_switch' };
            }
            if (
                current.active === true &&
                Number(current.leaseUntilMillis || 0) > startedAtMillis
            ) {
                return { acquired: false, reason: 'leased', fence: current.fence || 0 };
            }
            const fence = Number(current.fence || 0) + 1;
            transaction.set(reference, {
                schemaVersion: 1,
                enabled: true,
                owner,
                active: true,
                fence,
                leaseToken,
                leaseUntilMillis: startedAtMillis + leaseMs,
                startedAtMillis,
                updatedAtMillis: startedAtMillis
            }, { merge: true });
            return { acquired: true, fence };
        });
        if (!claim.acquired) {
            return { skipped: true, reason: claim.reason, fence: claim.fence || null };
        }

        let outcome = 'completed';
        try {
            const result = await handler({ fence: claim.fence, leaseToken });
            return { skipped: false, fence: claim.fence, result };
        } catch (error) {
            outcome = 'failed';
            throw error;
        } finally {
            const finishedAtMillis = nowMillis();
            await db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(reference);
                const current = snapshot.exists ? snapshot.data() : {};
                if (current.leaseToken !== leaseToken || current.fence !== claim.fence) return;
                transaction.set(reference, {
                    active: false,
                    leaseUntilMillis: 0,
                    lastOutcome: outcome,
                    finishedAtMillis,
                    updatedAtMillis: finishedAtMillis
                }, { merge: true });
            });
        }
    }

    return Object.freeze({ run });
}

module.exports = { createSchedulerFence, DEFAULT_LEASE_MS };
