'use strict';
const { intent, createDurableWork } = require('../maintenance/durableWork.cjs');
const { toMillis, CONTROL_DOCUMENT } = require('./publicationState');
const OPEN = ['pending', 'scheduled', 'running', 'retry_wait'];

function cycleIntent(state, now = Date.now(), due = now + 180000) {
    if (process.env.CATALOG_EVENT_MAINTENANCE_MODE !== 'durable' && state.maintenanceWork?.kind !== 'catalog') return {};
    if (state.maintenanceWork?.kind === 'catalog' && OPEN.includes(state.maintenanceWork.state)) return {};
    return { maintenanceWork: { ...intent('catalog', 'secondevie', due, [state.stateVersion || 0, now]), recoveries: 0 } };
}

function cycleStatus(state, now) {
    if (!state) return { outcome: 'stale' };
    const rollback = ['preparing', 'incomplete'].includes(state.rollbackState);
    const pending = rollback || (state.mode !== 'paused' && (state.dirty || Number(state.desiredRevision) > Number(state.publishedRevision)))
        || Number(state.revalidatedRevision) !== Number(state.publishedRevision)
        || state.servedState !== 'observed' || state.invalidationState !== 'accepted';
    if (!pending) return { outcome: 'completed' };
    const due = Math.max(state.leaseToken ? toMillis(state.leaseExpiresAt) + 1000 : 0,
        rollback ? toMillis(state.rollbackExpiresAt) + 1000 : 0,
        toMillis(state.revalidationRetryNotBefore), toMillis(state.quietUntil));
    if (due > now) return { due };
    return { outcome: 'recover' };
}

function createCatalogCycleRuntime({ db, enqueue, reconcile, now = Date.now, observe }) {
    return createDurableWork({ db, enqueue, now, observe,
        completionDue: (state, result, at) => result?.outcome === 'completed' && cycleStatus(state, at).outcome !== 'completed'
            ? Math.max(at + 180000, cycleStatus(state, at).due || 0) : null,
        async execute(request) {
        const ref = db.doc(CONTROL_DOCUMENT);
        let state = (await ref.get()).data();
        const status = cycleStatus(state, now());
        if (status.outcome !== 'recover') return status;
        const allowed = await db.runTransaction(async tx => {
            const fresh = (await tx.get(ref)).data();
            const work = fresh?.maintenanceWork;
            if (work?.version !== request.data.version || work.lease !== request.workLease) return false;
            if (Number(work.recoveries || 0) >= 5) return false;
            tx.update(ref, { maintenanceWork: { ...work, recoveries: Number(work.recoveries || 0) + 1 } });
            return true;
        });
        if (!allowed) return { outcome: 'attention' };
        await reconcile();
        state = (await ref.get()).data();
        const next = cycleStatus(state, now());
        return next.outcome === 'recover' ? { due: now() + 180000 } : next;
    } });
}
module.exports = { cycleIntent, cycleStatus, createCatalogCycleRuntime };
