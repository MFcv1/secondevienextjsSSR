// One explicitly bounded page. Never a recurring scan or implicit rollout.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldPath } from 'firebase-admin/firestore';
const require = createRequire(import.meta.url);
const { migrationPatch } = require('../functions/src/maintenance/groupedInactivity.cjs');
const args = Object.fromEntries(process.argv.slice(2).map(arg => {
    const [key, ...value] = arg.replace(/^--/, '').split('='); return [key, value.join('=') || true];
}));
if (args.project !== 'secondevienextjsssr' || args.env !== 'sandbox'
    || !['grouped', 'individual'].includes(args.direction)) throw Error('EXPLICIT_SANDBOX_DIRECTION_REQUIRED');
const partitions = Number(args.partitions || 4);
if (![1, 4, 16].includes(partitions) || (args.after && !/^[A-Za-z0-9_-]{1,160}$/.test(args.after))) throw Error('INVALID_ROUTING');
if (args.execute && (args.confirm !== 'MIGRATE_ANALYTICS_INACTIVITY' || !args.backup || !args.reason)) throw Error('BACKUP_AND_REASON_REQUIRED');
initializeApp({ projectId: args.project, credential: applicationDefault() });
const db = getFirestore();
let query = db.collection('analytics_sessions').orderBy(FieldPath.documentId()).limit(100);
if (args.after) query = query.startAfter(args.after);
const page = await query.get();
const eligible = data => data?.sessionActive && data.type !== 'admin'
    && (data.inactivityGroup?.mode === 'grouped') !== (args.direction === 'grouped');
const candidates = page.docs.filter(doc => eligible(doc.data()));
const runId = crypto.randomUUID();
if (args.execute) fs.writeFileSync(args.backup, JSON.stringify({ runId, direction: args.direction,
    records: candidates.map(doc => ({ id: doc.id, updateTime: doc.updateTime.toDate().toISOString(),
        inactivityGroup: doc.data().inactivityGroup || null, maintenanceWork: doc.data().maintenanceWork || null })) }, null, 2), { flag: 'wx', mode: 0o600 });
let changed = 0;
if (args.execute) for (const doc of candidates) {
    const result = await db.runTransaction(async tx => {
        const fresh = await tx.get(doc.ref);
        if (!fresh.exists || !fresh.updateTime.isEqual(doc.updateTime)) throw Error('SOURCE_CHANGED_RERUN_DRY_RUN');
        const patch = await migrationPatch(tx, db, doc.id, fresh.data(), args.direction, Date.now(), partitions);
        if (!patch) return false;
        tx.update(doc.ref, patch);
        tx.create(db.doc(`sys_audit_security/inactivity_${runId}_${doc.id}`), {
            action: 'analytics_inactivity_migration', sessionId: doc.id, direction: args.direction,
            reason: String(args.reason).slice(0, 300), createdAt: new Date(), expireAt: new Date(Date.now() + 90 * 86400000)
        });
        return true;
    });
    if (result) changed++;
}
console.log(JSON.stringify({ runId, mode: args.execute ? 'applied' : 'dry_run', inspected: page.size,
    candidates: candidates.length, changed, nextCursor: page.size === 100 ? page.docs.at(-1).id : null }));
