'use strict';
const { intent, createDurableWork } = require('../../maintenance/durableWork.cjs');
const { reconciliationDue } = require('./reconciliationActivity.cjs');

function createReconciliationWork({ db, enqueue, inspect, now = Date.now, observe }) {
    const engine = createDurableWork({ db, enqueue, now, observe,
        completionDue: (record, result, at) => result?.outcome !== 'attention' && record.dirtyToken !== record.verifiedToken ? at + 300000 : null,
        async execute(request) {
            const ref = db.doc(`sys_commerce_reconciliation/${request.data.id}`);
            const before = (await ref.get()).data();
            if (!before) return { outcome: 'stale' };
            const watermarkRef = db.doc('sys_commerce_reconciliation_watermark/current');
            const watermark = (await watermarkRef.get()).data()?.token;
            if (!watermark) throw Error('RECONCILIATION_WATERMARK_MISSING');
            const report = await inspect(request.data.id);
            const clean = await db.runTransaction(async tx => {
                const current = (await tx.get(ref)).data();
                const currentWatermark = (await tx.get(watermarkRef)).data()?.token;
                if (!current || current.dirtyToken !== before.dirtyToken || currentWatermark !== watermark) return false;
                if (current.maintenanceWork?.lease !== request.workLease) throw Error('RECONCILIATION_LEASE_LOST');
                tx.update(ref, { verifiedToken: before.dirtyToken, checkedAt: new Date(now()),
                    report, expireAt: report.divergences.length ? null : new Date(now() + 400 * 86400000) });
                return true;
            });
            return !clean ? { due: now() + 300000 } : { outcome: report.divergences.length ? 'attention' : 'verified' };
        }
    });
    async function scheduleDay(day) {
        const ref = db.doc(`sys_commerce_reconciliation/${day}`);
        const work = await db.runTransaction(async tx => {
            const record = (await tx.get(ref)).data();
            if (!record?.dirtyToken || record.dirtyToken === record.verifiedToken) return null;
            const previous = record.maintenanceWork;
            if (['pending', 'scheduled', 'running', 'retry_wait'].includes(previous?.state)) return previous;
            // An unresolved divergence needs explicit repair unless sources changed.
            if (previous?.state === 'needs_attention' && record.reportToken === record.dirtyToken) return null;
            const next = intent('finance', day, reconciliationDue(day, now()), record.dirtyToken);
            tx.update(ref, { maintenanceWork: next, reportToken: record.dirtyToken }); return next;
        });
        if (work) return engine.schedule(work);
        return { outcome: 'ignored' };
    }
    return { ...engine, scheduleDay };
}
module.exports = { createReconciliationWork };
