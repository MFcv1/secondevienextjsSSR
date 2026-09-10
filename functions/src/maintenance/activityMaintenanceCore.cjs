'use strict';

const { createHash } = require('node:crypto');
const INACTIVITY_MS = 35 * 60 * 1000;
const PUBLICATION_STALL_MS = 15 * 60 * 1000;
const COMPACTION_MS = 5 * 60 * 1000;
const millis = value => typeof value?.toMillis === 'function' ? value.toMillis()
    : value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value || '');
const activeLink = data => data?.checkout?.channel === 'admin_payment_link'
    && data.checkout.status === 'active' && Number.isFinite(millis(data.checkout.expiresAt));
const activeSession = data => data?.sessionActive === true && data.type !== 'admin'
    && Number.isFinite(millis(data.lastActivityAt));
const publicationOpen = data => ['uploading', 'processing', 'ready', 'finalizing', 'failed'].includes(data?.status);
const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(id);

function taskIdentity(kind, id, due) {
    return createHash('sha256').update(JSON.stringify([kind, id, due])).digest('hex');
}

function planWrite(kind, id, before, after, eventAt) {
    if (!validId(id)) throw new Error('MAINTENANCE_INVALID_ID');
    if (kind === 'link') {
        if (!activeLink(after) || (activeLink(before) && before.checkout.expiresAt === after.checkout.expiresAt)) return null;
        return { kind, id, due: millis(after.checkout.expiresAt) };
    }
    if (kind === 'session') {
        // One chain per active lifetime, not one task per heartbeat.
        if (!activeSession(after) || activeSession(before)) return null;
        return { kind, id, due: millis(after.lastActivityAt) + INACTIVITY_MS };
    }
    if (kind === 'publication') {
        if (!publicationOpen(after)) return null;
        // Internal finalization writes must not create an unbounded retry loop.
        if (before && !(after.status === 'ready' && before.status !== 'ready')
            && JSON.stringify(before.slots) === JSON.stringify(after.slots)) return null;
        const at = millis(after.updatedAt);
        if (!Number.isFinite(at)) throw new Error('MAINTENANCE_PUBLICATION_TIME_MISSING');
        return { kind, id, due: at + (['uploading', 'processing'].includes(after.status) ? PUBLICATION_STALL_MS : 5000) };
    }
    if (kind === 'compaction') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(id) || !Number.isFinite(eventAt)) throw new Error('MAINTENANCE_INVALID_PERIOD');
        // A bucket closes before its task executes. Subsequent writes use another ID.
        return { kind, id, due: (Math.floor(eventAt / COMPACTION_MS) + 1) * COMPACTION_MS + 10000 };
    }
    throw new Error('MAINTENANCE_INVALID_KIND');
}

function createActivityMaintenance({ db, enqueue, expireLink, finalizePublication, compactPeriod, archivePeriod, inspectInbox, inspectPayment, serverTimestamp, now = Date.now }) {
    async function schedule(plan) {
        if (!plan) return { outcome: 'ignored' };
        if (!Number.isFinite(plan.due)) throw new Error('MAINTENANCE_INVALID_DUE');
        // Current business deadlines are <=24h. Never silently lose a future task.
        if (plan.due > now() + 29 * 86400000) throw new Error('MAINTENANCE_DEADLINE_TOO_DISTANT');
        try {
            await enqueue(plan.kind, { schemaVersion: 1, ...plan }, {
                id: taskIdentity(plan.kind, plan.id, plan.due),
                scheduleTime: new Date(Math.max(now(), plan.due)), dispatchDeadlineSeconds: 540
            });
            return { outcome: 'scheduled' };
        } catch (error) {
            if ([6, 'already-exists', 'functions/task-already-exists'].includes(error?.code)) return { outcome: 'duplicate' };
            throw error; // Firestore retries; never acknowledge a lost enqueue.
        }
    }

    async function dispatch(request) {
        const input = request.data;
        if (input?.schemaVersion !== 1 || !validId(input.id) || !Number.isFinite(input.due)
            || !['link', 'session', 'publication', 'compaction', 'inbox', 'archive', 'payment'].includes(input.kind)) throw new Error('MAINTENANCE_INVALID_TASK');
        if (input.due > now()) throw new Error('MAINTENANCE_TASK_EARLY');
        if (input.kind === 'inbox') return inspectInbox(input.id);
        if (input.kind === 'payment') return inspectPayment(input.id);
        if (input.kind === 'archive') {
            if (!/^archive_\d{4}-\d{2}-\d{2}$/.test(input.id)) throw Error('MAINTENANCE_INVALID_PERIOD');
            const record = (await db.doc(`sys_analytics_maintenance/${input.id}`).get()).data();
            if (!record) return { outcome: 'stale' };
            if (!Number.isSafeInteger(record.archiveAt)) throw Error('MAINTENANCE_ARCHIVE_DATE_INVALID');
            if (record.archiveAt > now()) return { outcome: 'deferred', due: Math.min(record.archiveAt, now() + 28 * 86400000) };
            await archivePeriod(input.id.slice(8));
            return { outcome: 'archived' };
        }
        if (input.kind === 'compaction') {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(input.id)) throw new Error('MAINTENANCE_INVALID_PERIOD');
            await compactPeriod(input.id);
            return { outcome: 'compacted' };
        }
        const collection = { link: 'orders', session: 'analytics_sessions', publication: 'product_publication_sessions' }[input.kind];
        const ref = db.doc(`${collection}/${input.id}`);
        if (input.kind === 'session') {
            const result = await db.runTransaction(async tx => {
                const snap = await tx.get(ref), data = snap.data();
                if (!snap.exists || !activeSession(data) || data.inactivityGroup?.mode === 'grouped') return { outcome: 'stale' };
                const due = Math.ceil(millis(data.lastActivityAt)) + INACTIVITY_MS;
                if (due > now()) return { outcome: 'deferred', due };
                tx.update(ref, { sessionActive: false, finalizedBy: 'inactivity_task', finalizedAt: serverTimestamp() });
                return { outcome: 'finalized' };
            });
            if (result.due && !request.durable) await schedule({ ...input, due: result.due });
            return result;
        }
        const snap = await ref.get(), data = snap.data();
        if (!snap.exists) return { outcome: 'stale' };
        if (input.kind === 'link') {
            if (!activeLink(data) || millis(data.checkout.expiresAt) !== input.due) return { outcome: 'stale' };
            // expire() also checks paid/closed and expectedExpiry inside its saga.
            return expireLink(input.id);
        }
        if (!publicationOpen(data)) return { outcome: 'stale' };
        if (millis(data.expiresAt) <= now()) return { outcome: 'expired' };
        if (['uploading', 'processing'].includes(data.status)) {
            const due = millis(data.updatedAt) + PUBLICATION_STALL_MS;
            if (!Number.isFinite(due)) throw new Error('MAINTENANCE_PUBLICATION_TIME_MISSING');
            if (due > now()) {
                if (!request.durable) await schedule({ ...input, due });
                return { outcome: 'deferred', due };
            }
            const marked = await markAttention(ref, snap, 'PRODUCT_PUBLICATION_UPLOAD_STALLED');
            return { outcome: marked ? 'attention' : 'stale' };
        }
        if (data.status === 'finalizing' && millis(data.finalizationLeaseExpiresAt) > now()) {
            const due = millis(data.finalizationLeaseExpiresAt) + 1000;
            if (!request.durable) await schedule({ ...input, due });
            return { outcome: 'deferred', due };
        }
        try {
            const result = await finalizePublication(input.id);
            // A competing worker can hold the lease. Do not silently abandon the check.
            if (result?.status !== 'published') throw new Error('MAINTENANCE_PUBLICATION_NOT_COMPLETE');
            return { outcome: 'published' };
        } catch (error) {
            if ((request.retryCount || 0) >= 4) {
                const fresh = await ref.get();
                await markAttention(ref, fresh, 'PRODUCT_PUBLICATION_RETRIES_EXHAUSTED');
            }
            throw error;
        }
    }

    async function markAttention(ref, observed, reason) {
        return db.runTransaction(async tx => {
            const fresh = await tx.get(ref);
            if (!fresh.exists || !publicationOpen(fresh.data())
                || !fresh.updateTime.isEqual(observed.updateTime)
                || fresh.data().clientState === 'attention_required') return false;
            tx.update(ref, { clientState: 'attention_required', lastError: fresh.data().lastError || reason });
            return true;
        });
    }
    return { schedule, dispatch };
}
module.exports = { createActivityMaintenance, planWrite, taskIdentity, millis, INACTIVITY_MS };
