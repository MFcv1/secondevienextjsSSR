'use strict';

const { createHash, randomUUID } = require('node:crypto');
const { millis } = require('./activityMaintenanceCore.cjs');
const FIELD = 'maintenanceWork';
const INACTIVITY_MS = 35 * 60000;
const LEASE_MS = 10 * 60000; // Greater than the 540s handler deadline.
const MAX_ATTEMPTS = 5;
const collections = Object.freeze({ link: 'orders', payment: 'orders', session: 'analytics_sessions', publication: 'product_publication_sessions', inbox: 'commerce_webhook_inbox', compaction: 'sys_analytics_maintenance', archive: 'sys_analytics_maintenance' });
const fieldFor = kind => kind === 'payment' ? 'paymentWatchWork' : FIELD;
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function intent(kind, id, due, version = due) {
    if (!Object.hasOwn(collections, kind) || !/^[A-Za-z0-9_-]{1,160}$/.test(id) || !Number.isSafeInteger(due)) throw Error('WORK_INTENT_INVALID');
    return { schemaVersion: 1, kind, id, operationId: digest([kind, id]), version: digest([kind, id, version]),
        due, generation: 0, state: 'pending', attempt: 0, lease: null, leaseUntil: null, result: null };
}

// These pure helpers are called inside the authoritative business write.
function linkIntent(order, id) {
    if (order.checkout?.channel !== 'admin_payment_link' || order.checkout.status !== 'active') return order;
    const due = millis(order.checkout.expiresAt);
    const previous = order[FIELD];
    if (previous?.kind === 'link' && previous.due === due) return order;
    return { ...order, [FIELD]: intent('link', id, due) };
}
function sessionIntent(current, now, id) {
    if (current?.type === 'admin') return {};
    if (current?.sessionActive && current[FIELD]) return {};
    return { [FIELD]: intent('session', id, now + INACTIVITY_MS, [now, current?.[FIELD]?.version || null]) };
}
function paymentIntent(order, id, now) {
    const next = intent('payment', id, now + 5 * 60000, order.payment.currentAttemptId);
    if (order.paymentWatchWork?.version === next.version) return order;
    return { ...order, paymentWatchWork: next };
}
function inboxIntent(entry) {
    const due = entry.status === 'processing' ? entry.processingUntil : entry.nextAttemptAt;
    if (['processed', 'dead_letter'].includes(entry.status)) {
        return { ...entry, ...(entry[FIELD] ? { [FIELD]: { ...entry[FIELD], state: entry.status === 'processed' ? 'succeeded' : 'needs_attention', lease: null, leaseUntil: null, result: entry.status } } : {}) };
    }
    // Observe a due inbox after a grace period; processing already has a lease deadline.
    return { ...entry, [FIELD]: intent('inbox', entry.inboxId, due + (entry.status === 'processing' ? 1000 : 60000), `${entry.status}:${entry.attemptCount}:${due}`) };
}
function reference(db, work) {
    if (!Object.hasOwn(collections, work?.kind) || !/^[A-Za-z0-9_-]{1,160}$/.test(work.id)) throw Error('WORK_TARGET_INVALID');
    return db.doc(`${collections[work.kind]}/${work.id}`);
}
const same = (a, b) => a?.version === b?.version && a?.generation === b?.generation;
const runnable = work => ['pending', 'scheduled', 'retry_wait', 'running'].includes(work?.state);

async function writeCompactionIntent(tx, db, day, now = Date.now(), archiveAt = null, rearmPending = false) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw Error('WORK_PERIOD_INVALID');
    const ref = db.doc(`sys_analytics_maintenance/${day}`);
    const previous = (await tx.get(ref)).data()?.[FIELD];
    const archiveRef = Number.isSafeInteger(archiveAt) ? db.doc(`sys_analytics_maintenance/archive_${day}`) : null;
    const archive = archiveRef ? await tx.get(archiveRef) : null;
    if (archiveRef && !archive.exists) tx.set(archiveRef, {
        [FIELD]: intent('archive', `archive_${day}`, Math.min(archiveAt, now + 28 * 86400000)),
        archiveAt, dateKey: day, expireAt: new Date(now + 400 * 86400000)
    });
    else if (archiveRef && rearmPending && archive.data()?.[FIELD]?.state === 'pending') {
        const work = archive.data()[FIELD];
        tx.update(archiveRef, { [FIELD]: { ...work, generation: work.generation + 1 } });
    }
    const due = (Math.floor(now / 300000) + 1) * 300000 + 10000;
    if (previous?.due >= due) {
        if (rearmPending && previous.state === 'pending') tx.update(ref, { [FIELD]: { ...previous, generation: previous.generation + 1 } });
        return;
    }
    tx.set(ref, { [FIELD]: intent('compaction', day, due), expireAt: new Date(now + 400 * 86400000) }, { merge: true });
}

function createDurableWork({ db, enqueue, execute, now = Date.now, token = randomUUID, observe = () => {}, repairAudit = null }) {
    async function schedule(work) {
        if (!work || !runnable(work) || work.state === 'running') return { outcome: 'ignored' };
        const ref = reference(db, work);
        const field = fieldFor(work.kind);
        const fresh = (await ref.get()).data()?.[field];
        if (!same(fresh, work) || !runnable(fresh) || fresh.state === 'running') return { outcome: 'superseded' };
        if (!Number.isSafeInteger(fresh.due) || fresh.due > now() + 29 * 86400000) throw Error('WORK_DEADLINE_INVALID');
        const taskId = digest([fresh.version, fresh.generation]);
        try {
            await enqueue(fresh.kind, { schemaVersion: 2, kind: fresh.kind, id: fresh.id, version: fresh.version, generation: fresh.generation, due: fresh.due },
                { id: taskId, scheduleTime: new Date(Math.max(now(), fresh.due)), dispatchDeadlineSeconds: 540 });
        } catch (error) {
            if (![6, 'already-exists', 'functions/task-already-exists'].includes(error?.code)) {
                observe('dispatch_failed', { operationId: fresh.operationId, kind: fresh.kind });
                throw error;
            }
        }
        await db.runTransaction(async tx => {
            const value = (await tx.get(ref)).data()?.[field];
            if (!same(value, fresh) || !['pending', 'retry_wait'].includes(value.state)) return;
            tx.update(ref, { [field]: { ...value, state: 'scheduled', taskId, scheduledAt: now() } });
        });
        return { outcome: 'scheduled', taskId };
    }

    async function dispatch(request) {
        const work = request.data;
        if (work?.schemaVersion !== 2 || !Number.isSafeInteger(work.generation) || work.generation < 0
            || !/^[a-f0-9]{64}$/.test(work.version || '') || !Number.isSafeInteger(work.due)) throw Error('WORK_TASK_INVALID');
        const ref = reference(db, work), lease = token();
        const field = fieldFor(work.kind);
        const acquired = await db.runTransaction(async tx => {
            const value = (await tx.get(ref)).data()?.[field];
            if (!same(value, work) || !runnable(value)) return null;
            if (value.due > now()) throw Error('WORK_TASK_EARLY');
            if (value.state === 'running' && value.leaseUntil > now()) throw Error('WORK_LEASE_BUSY');
            if (value.attempt >= MAX_ATTEMPTS) {
                tx.update(ref, { [field]: { ...value, state: 'needs_attention', result: 'attempts_exhausted', lease: null, leaseUntil: null } });
                return { exhausted: true, ...value };
            }
            const next = { ...value, state: 'running', attempt: value.attempt + 1, lease, leaseUntil: now() + LEASE_MS, startedAt: now() };
            tx.update(ref, { [field]: next });
            return next;
        });
        if (!acquired) return { outcome: 'superseded' };
        if (acquired.exhausted) { observe('needs_attention', { operationId: acquired.operationId, kind: acquired.kind }); return { outcome: 'attention' }; }
        let result, failure;
        try { result = await execute({ ...request, data: { ...work, schemaVersion: 1 }, durable: true }); }
        catch (error) { failure = error; }
        const next = await db.runTransaction(async tx => {
            const value = (await tx.get(ref)).data()?.[field];
            // A paid order, extension, fresh inbox lease or competing worker wins.
            if (!same(value, work) || value.lease !== lease) return null;
            if (value.leaseUntil <= now()) throw Error('WORK_LEASE_EXPIRED');
            let updated = { ...value, lease: null, leaseUntil: null, updatedAt: now() };
            if (failure) updated = { ...updated, state: value.attempt >= MAX_ATTEMPTS ? 'needs_attention' : 'retry_wait', result: 'execution_failed' };
            else if (Number.isSafeInteger(result?.due)) updated = { ...updated, state: 'pending', due: result.due, generation: value.generation + 1, attempt: 0, result: 'deferred' };
            else updated = { ...updated, state: result?.outcome === 'attention' ? 'needs_attention' : result?.outcome === 'stale' ? 'superseded' : 'succeeded', result: String(result?.outcome || 'completed').slice(0, 80), completedAt: now() };
            tx.update(ref, { [field]: updated });
            return updated;
        });
        if (!next) { if (failure) throw failure; return { outcome: 'superseded' }; }
        observe(next.state, { operationId: next.operationId, kind: next.kind, attempt: next.attempt });
        if (failure && next.state !== 'needs_attention') throw failure;
        if (next.state === 'pending') await schedule(next); // Durable intent survives enqueue failure.
        return { outcome: next.state === 'needs_attention' ? 'attention' : result?.outcome || next.state };
    }

    // Explicit, version-checked operator/incident repair; never a periodic scan.
    async function repair(work) {
        const ref = reference(db, work);
        const field = fieldFor(work.kind);
        const next = await db.runTransaction(async tx => {
            const value = (await tx.get(ref)).data()?.[field];
            if (!same(value, work)) throw Error('WORK_REPAIR_VERSION_CHANGED');
            if (!['pending', 'scheduled', 'retry_wait', 'needs_attention', 'running'].includes(value.state)) throw Error('WORK_REPAIR_TERMINAL');
            if (value.state === 'running' && value.leaseUntil > now()) throw Error('WORK_LEASE_BUSY');
            // Financial side effects stay fenced by the domain handler, not by this delivery ID.
            const updated = { ...value, generation: value.generation + 1, state: 'pending', attempt: 0, lease: null, leaseUntil: null, repairedAt: now() };
            if (repairAudit) repairAudit(tx, value, updated);
            tx.update(ref, { [field]: updated });
            return updated;
        });
        return schedule(next);
    }
    return { schedule, dispatch, repair };
}
module.exports = { FIELD, fieldFor, intent, linkIntent, paymentIntent, sessionIntent, inboxIntent, reference, createDurableWork, writeCompactionIntent, MAX_ATTEMPTS };
