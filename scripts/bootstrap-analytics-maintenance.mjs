import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url), requireFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const admin = requireFunctions('firebase-admin');
const { writeCompactionIntent } = require('../functions/src/maintenance/durableWork.cjs');
const { utcDayBounds } = require('../functions/src/analytics/rollups');
const args = Object.fromEntries(process.argv.slice(2).map(arg => {
    const [key, ...value] = arg.replace(/^--/, '').split('='); return [key, value.join('=') || true];
}));
const start = Date.parse(args.from), end = Date.parse(args.to), DAY = 86400000;
if (args.project !== 'secondevienextjsssr' || args.env !== 'sandbox'
    || !/^\d{4}-\d{2}-\d{2}$/.test(args.from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(args.to || '')
    || !Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start >= 31 * DAY) throw Error('Explicit sandbox date range of at most 31 days required');
if (args.execute && (args.confirm !== 'BOOTSTRAP_ANALYTICS_MAINTENANCE' || typeof args.backup !== 'string')) throw Error('Confirmation and new backup path required');
const app = admin.initializeApp({ projectId: args.project, credential: admin.credential.applicationDefault() });
try {
    const db = app.firestore(), plans = [];
    for (let time = start; time <= end; time += DAY) {
        const day = new Date(time).toISOString().slice(0, 10);
        const source = await db.doc(`analytics_rollup_days/${day}`).get();
        if (!source.exists) continue;
        const references = [db.doc(`sys_analytics_maintenance/${day}`), db.doc(`sys_analytics_maintenance/archive_${day}`)];
        const [compaction, archive, manifest] = await db.getAll(...references, db.doc(`analytics_archive_manifests/${day}`));
        if (compaction.exists && compaction.data()?.maintenanceWork?.state !== 'pending'
            && ((archive.exists && archive.data()?.maintenanceWork?.state !== 'pending')
                || (!archive.exists && manifest.data()?.status === 'complete'))) continue;
        plans.push({ day, references, snapshots: [compaction, archive], source,
            archiveAt: manifest.data()?.status === 'complete' ? null : utcDayBounds(day).end + 75 * DAY });
    }
    if (args.execute) writeFileSync(args.backup, JSON.stringify({ project: args.project, capturedAt: new Date().toISOString(),
        records: plans.flatMap(plan => plan.snapshots.map((snapshot, i) => ({ path: plan.references[i].path, before: snapshot.data() || null }))) }, null, 2), { flag: 'wx', mode: 0o600 });
    let written = 0;
    if (args.execute) for (const plan of plans) {
        await db.runTransaction(async tx => {
            const source = await tx.get(plan.source.ref);
            const current = await Promise.all(plan.references.map(ref => tx.get(ref)));
            if (!source.exists || !source.updateTime.isEqual(plan.source.updateTime)
                || current.some((snapshot, i) => snapshot.exists !== plan.snapshots[i].exists
                    || (snapshot.exists && !snapshot.updateTime.isEqual(plan.snapshots[i].updateTime)))) throw Error('ANALYTICS_BOOTSTRAP_CHANGED_RERUN_DRY_RUN');
            await writeCompactionIntent(tx, db, plan.day, Date.now(), plan.archiveAt, true);
            if (plan.archiveAt === null && current[1].data()?.maintenanceWork?.state === 'pending') tx.update(plan.references[1], {
                maintenanceWork: { ...current[1].data().maintenanceWork, state: 'succeeded', result: 'already_archived', completedAt: Date.now() }
            });
        });
        written++;
    }
    process.stdout.write(JSON.stringify({ mode: args.execute ? 'applied' : 'dry_run', from: args.from, to: args.to, candidateDays: plans.length, written }) + '\n');
} finally { await app.delete(); }
