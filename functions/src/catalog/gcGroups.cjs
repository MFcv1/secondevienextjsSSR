'use strict';
const { randomUUID } = require('node:crypto');
const { intent, createDurableWork } = require('../maintenance/durableWork.cjs');
const DAY = 86400000;
function gcGroup(kind, notBefore) {
    if (!['media', 'release'].includes(kind) || !Number.isFinite(notBefore)) throw Error('GC_GROUP_INVALID');
    const due = Math.ceil(notBefore / DAY) * DAY;
    return { id: `${kind}_${new Date(due).toISOString().slice(0, 10)}`, kind, due };
}
function markGcGroup(tx, db, group, token = randomUUID()) {
    tx.set(db.doc(`sys_catalog_gc_groups/${group.id}`), {
        schemaVersion: 1, category: group.kind, availableAt: group.due,
        dirtyToken: token, expireAt: null, cursor: null
    }, { merge: true });
}
function createGcWork({ db, enqueue, inspect, hasCandidates = async () => true, now = Date.now, observe }) {
    const engine = createDurableWork({ db, enqueue, now, observe,
        completionDue: (record, result, at) => result?.outcome !== 'attention' && record.dirtyToken !== record.inspectedToken ? at + 300000 : null,
        async execute(request) {
            const ref = db.doc(`sys_catalog_gc_groups/${request.data.id}`);
            const group = (await ref.get()).data();
            if (!group) return { outcome: 'stale' };
            const remaining = await hasCandidates({ id: request.data.id, ...group });
            if (remaining && group.availableAt > now()) return { due: Math.min(group.availableAt, now() + 28 * DAY) };
            const page = remaining ? await inspect({ id: request.data.id, ...group }) : { report: { result: 'empty', deleted: 0 }, cursor: null };
            const committed = await db.runTransaction(async tx => {
                const current = (await tx.get(ref)).data();
                if (current?.maintenanceWork?.lease !== request.workLease) throw Error('GC_GROUP_LEASE_LOST');
                if (current.dirtyToken !== group.dirtyToken) return false;
                tx.update(ref, { cursor: page.cursor || null, report: page.report,
                    ...(page.cursor ? {} : { inspectedToken: group.dirtyToken, expireAt: new Date(now() + 400 * DAY) }),
                    inspectedAt: new Date(now()) });
                return true;
            });
            return !committed || page.cursor ? { due: now() + 60000 } : { outcome: 'dry_run_completed' };
        }
    });
    async function scheduleGroup(id) {
        const ref = db.doc(`sys_catalog_gc_groups/${id}`);
        const work = await db.runTransaction(async tx => {
            const group = (await tx.get(ref)).data();
            if (!group?.dirtyToken || group.dirtyToken === group.inspectedToken) return null;
            if (['pending', 'scheduled', 'running', 'retry_wait'].includes(group.maintenanceWork?.state)) return group.maintenanceWork;
            const next = intent('gc', id, Math.min(group.availableAt, now() + 28 * DAY), group.dirtyToken);
            if (group.maintenanceWork?.state === 'needs_attention' && group.maintenanceWork.version === next.version) return null;
            tx.update(ref, { maintenanceWork: next, cursor: null }); return next;
        });
        return work ? engine.schedule(work) : { outcome: 'ignored' };
    }
    return { ...engine, scheduleGroup };
}
module.exports = { gcGroup, markGcGroup, createGcWork };
