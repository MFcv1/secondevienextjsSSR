// Authorized P4 only. Create-only/resumable seed; no source edits, no deletions, no UI cutover.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const admin = require('../functions/node_modules/firebase-admin');
const { buildSeed, projectSession } = require('../functions/src/analytics/realtime');
const PROJECT = 'secondevienextjsssr';
const CONTROL = 'analytics_realtime_control/current';
const hash = data => createHash('sha256').update(JSON.stringify(data)).digest('hex');
const canonical = value => JSON.stringify(value, function (_key, item) {
    return item && Object.getPrototypeOf(item) === Object.prototype
        ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item;
});
export function seedDocuments(seed, now) {
    return [
        ['admin_analytics_realtime/recent', seed.recent], ['admin_analytics_realtime/history', seed.history],
        ...Object.entries(seed.buckets).map(([key, value]) => [`analytics_realtime_buckets/${key}`, value]),
        ...Object.entries(seed.ledgers).map(([key, value]) => [`analytics_realtime_ledgers/${key}`,
            { ...value, updatedAt: admin.firestore.Timestamp.fromMillis(now) }])
    ];
}
export async function verifySeed(db, documents) {
    for (let i = 0; i < documents.length; i += 200) {
        const chunk = documents.slice(i, i + 200);
        const snapshots = await db.getAll(...chunk.map(([path]) => db.doc(path)));
        if (snapshots.some((snapshot, index) => !snapshot.exists || canonical(snapshot.data()) !== canonical(chunk[index][1]))) {
            throw new Error('BOOTSTRAP_SEED_DIVERGENCE');
        }
    }
}
export async function bootstrap(db, input, expectedDigest, mode) {
    if (!['seed', 'activate', 'pause'].includes(mode)) throw new Error('BOOTSTRAP_MODE');
    const seed = buildSeed(input);
    if (hash(seed) !== expectedDigest) throw new Error('BOOTSTRAP_DIGEST');
    const controlRef = db.doc(CONTROL);
    const check = control => {
        if (control?.epoch !== input.epoch || control?.seedDigest !== expectedDigest) throw new Error('BOOTSTRAP_CONTROL_MISMATCH');
    };
    if (mode === 'pause') {
        await db.runTransaction(async tx => {
            const control = (await tx.get(controlRef)).data(); check(control);
            tx.update(controlRef, { mode: 'paused' });
        });
        return { mode: 'paused', sourceWrites: 0, controlWrites: 1 };
    }
    // A stale export requires a new inventory, not an unchecked backfill.
    if (Date.now() - input.now > 30 * 60000 || input.now > Date.now()) throw new Error('BOOTSTRAP_INVENTORY_EXPIRED');
    const documents = seedDocuments(seed, input.now);
    if (documents.length > 10000) throw new Error('BOOTSTRAP_DOCUMENT_LIMIT');
    let created = 0;
    if (mode === 'seed') {
        await db.runTransaction(async tx => {
            const existing = await tx.get(controlRef);
            if (existing.exists) { check(existing.data()); return; }
            for (const collection of ['admin_analytics_realtime', 'analytics_realtime_buckets', 'analytics_realtime_ledgers']) {
                if (!(await tx.get(db.collection(collection).limit(1))).empty) throw new Error('BOOTSTRAP_TARGET_NOT_EMPTY');
            }
            tx.create(controlRef, { ...seed.control, seedDigest: expectedDigest });
        });
        for (let i = 0; i < documents.length; i += 200) {
            const chunk = documents.slice(i, i + 200);
            created += await db.runTransaction(async tx => {
                const control = (await tx.get(controlRef)).data(); check(control);
                if (control.mode !== 'paused' || control.bootstrapComplete) throw new Error('BOOTSTRAP_NOT_PAUSED');
                const snapshots = await tx.getAll(...chunk.map(([path]) => db.doc(path)));
                let writes = 0;
                snapshots.forEach((snapshot, index) => {
                    const [path, value] = chunk[index];
                    if (snapshot.exists) {
                        if (canonical(snapshot.data()) !== canonical(value)) throw new Error('BOOTSTRAP_EXISTING_DOCUMENT_MISMATCH');
                    } else { tx.create(db.doc(path), value); writes++; }
                });
                return writes;
            });
        }
        await verifySeed(db, documents);
        return { mode: 'paused', created, verified: documents.length, sourceWrites: 0 };
    }
    const current = (await controlRef.get()).data(); check(current);
    if (current.mode !== 'shadow') {
        if (current.mode !== 'paused' || current.bootstrapComplete) throw new Error('BOOTSTRAP_ACTIVATION_STATE');
        await verifySeed(db, documents);
        await db.runTransaction(async tx => {
            const control = (await tx.get(controlRef)).data(); check(control);
            if (control.mode !== 'paused' || control.bootstrapComplete) throw new Error('BOOTSTRAP_ACTIVATION_RACE');
            tx.update(controlRef, { mode: 'shadow', bootstrapComplete: true });
        });
    }
    // The live trigger owns events after activation. This bounded sweep catches changes
    // during the paused seed, including deleted sources from the initial inventory.
    const sources = await db.collection('analytics_sessions').select().limit(2001).get();
    if (sources.size > 2000) throw new Error('BOOTSTRAP_CATCHUP_LIMIT');
    const ids = new Set([...input.sessions.map(row => row.id), ...sources.docs.map(doc => doc.id)]);
    if (ids.size > 4000) throw new Error('BOOTSTRAP_CATCHUP_LIMIT');
    const outcomes = {};
    for (const id of ids) {
        const result = await projectSession(id, db);
        outcomes[result] = (outcomes[result] || 0) + 1;
    }
    return { mode: 'shadow', caughtUp: ids.size, outcomes, sourceWrites: 0, readyForCutover: false };
}
async function main() {
    const args = Object.fromEntries(process.argv.slice(2).map(arg => {
        const match = /^--([a-z-]+)=(.+)$/.exec(arg); if (!match) throw new Error('BOOTSTRAP_ARGUMENT'); return match.slice(1);
    }));
    if (args.project !== PROJECT || process.env.APPROVAL !== 'ANALYTICS_REALTIME_P4_SANDBOX') throw new Error('BOOTSTRAP_AUTHORIZATION_REQUIRED');
    for (const key of ['GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT']) {
        if (process.env[key] && process.env[key] !== PROJECT) throw new Error('BOOTSTRAP_PROJECT');
    }
    if (process.env.FIRESTORE_EMULATOR_HOST) throw new Error('BOOTSTRAP_NOT_CLOUD');
    const input = JSON.parse(readFileSync(args.input, 'utf8'));
    const app = admin.initializeApp({ projectId: PROJECT });
    try { console.log(JSON.stringify(await bootstrap(admin.firestore(), input, args.digest, args.mode), null, 2)); }
    finally { await app.delete(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => { console.error(`Bootstrap stopped (${error.code || error.message}). Inspect control before resuming.`); process.exitCode = 1; });
}
