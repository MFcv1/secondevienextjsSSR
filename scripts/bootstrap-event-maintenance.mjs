import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url), requireFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const admin = requireFunctions('firebase-admin');
const { bootstrapPatch } = require('../functions/src/maintenance/bootstrapCore.cjs');
const { fieldFor } = require('../functions/src/maintenance/durableWork.cjs');
const args = Object.fromEntries(process.argv.slice(2).map(arg => {
    const [key, ...value] = arg.replace(/^--/, '').split('='); return [key, value.join('=') || true];
}));
const collections = { catalog: 'sys_catalog_publication', outbox: 'commerce_outbox', reservation: 'orders', link: 'orders', payment: 'orders', session: 'analytics_sessions', inbox: 'commerce_webhook_inbox' };
if (args.project !== 'secondevienextjsssr' || args.env !== 'sandbox' || !Object.hasOwn(collections, args.kind)) throw Error('Explicit bounded sandbox kind required');
if (args.after && !/^[A-Za-z0-9_-]{1,160}$/.test(args.after)) throw Error('Invalid cursor');
if (args.execute && (args.confirm !== 'BOOTSTRAP_EVENT_MAINTENANCE' || typeof args.backup !== 'string')) throw Error('Confirmation and a new backup path required');
// Explicit migration plans the new ownership even while producer defaults
// remain legacy. Deploy and qualify consumers before executing this command.
if (['outbox', 'reservation'].includes(args.kind)) process.env.COMMERCE_EVENT_MAINTENANCE_MODE = 'durable';
if (args.kind === 'catalog') process.env.CATALOG_EVENT_MAINTENANCE_MODE = 'durable';
const app = admin.initializeApp({ projectId: args.project, credential: admin.credential.applicationDefault() });
try {
    const db = app.firestore();
    let query = db.collection(collections[args.kind]).orderBy(admin.firestore.FieldPath.documentId()).limit(100);
    if (args.after) query = query.startAfter(args.after);
    const page = await query.get(), now = Date.now();
    const candidates = page.docs.filter(doc => bootstrapPatch(args.kind, doc.id, doc.data(), now));
    // Only work metadata is affected. No raw order, token, email or payload in the backup.
    if (args.execute) writeFileSync(args.backup, JSON.stringify({ project: args.project, kind: args.kind, capturedAt: new Date().toISOString(),
        records: candidates.map(doc => ({ path: doc.ref.path, field: fieldFor(args.kind), before: doc.data()[fieldFor(args.kind)] || null, updateTime: doc.updateTime.toDate().toISOString() })) }, null, 2), { flag: 'wx', mode: 0o600 });
    let written = 0;
    if (args.execute) for (const doc of candidates) {
        const changed = await db.runTransaction(async tx => {
            const fresh = await tx.get(doc.ref);
            const work = bootstrapPatch(args.kind, doc.id, fresh.data(), Date.now());
            if (!work) return false;
            // Backup and mutation refer to exactly the same source version.
            if (!fresh.updateTime.isEqual(doc.updateTime)) throw Error('BOOTSTRAP_SOURCE_CHANGED_RERUN_DRY_RUN');
            tx.update(doc.ref, { [fieldFor(args.kind)]: work }); return true;
        });
        if (changed) written++;
    }
    process.stdout.write(JSON.stringify({ mode: args.execute ? 'applied' : 'dry_run', kind: args.kind,
        inspected: page.size, candidates: candidates.length, written,
        nextCursor: page.size === 100 ? page.docs.at(-1).id : null, complete: page.size < 100 }) + '\n');
} finally { await app.delete(); }
