import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const requireFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const admin = requireFunctions('firebase-admin');
const { getFunctions } = requireFunctions('firebase-admin/functions');
const { createDurableWork, reference, fieldFor } = require('../functions/src/maintenance/durableWork.cjs');
const { taskNames } = require('../functions/src/maintenance/scheduleActivity.cjs');
const args = Object.fromEntries(process.argv.slice(2).map(arg => {
    const [key, ...value] = arg.replace(/^--/, '').split('='); return [key, value.join('=') || true];
}));
if (args.project !== 'secondevienextjsssr' || args.env !== 'sandbox') throw Error('Explicit sandbox project required');
const target = { kind: args.kind, id: args.id };
const identities = { link: 'admin-payment-link-expiry', payment: 'commerce-operations-reconciler',
    inbox: 'commerce-operations-reconciler', session: 'analytics-runtime', sessionGroup: 'analytics-runtime',
    compaction: 'analytics-runtime', archive: 'analytics-runtime', publication: 'product-publication-worker' };
if (!Object.hasOwn(identities, target.kind)) throw Error('Unknown repair kind');
// User ADC has no service-account email. Cloud Tasks must use the same private
// invoker as the domain trigger, with the operator's existing actAs permission.
const app = admin.initializeApp({ projectId: args.project, credential: admin.credential.applicationDefault(),
    serviceAccountId: `${identities[target.kind]}@${args.project}.iam.gserviceaccount.com` });
try {
    const db = app.firestore(), ref = reference(db, target);
    const work = (await ref.get()).data()?.[fieldFor(target.kind)];
    if (!work) throw Error('No durable work on this object; bootstrap separately');
    if (!args.execute) {
        process.stdout.write(JSON.stringify({ mode: 'dry_run', kind: work.kind, operationId: work.operationId,
            version: work.version, generation: work.generation, state: work.state, due: work.due, attempt: work.attempt }) + '\n');
    } else {
        if (args.confirm !== 'REPAIR_EVENT_MAINTENANCE' || args['expected-version'] !== work.version
            || Number(args['expected-generation']) !== work.generation || typeof args.reason !== 'string'
            || args.reason.length < 8 || args.reason.length > 200) throw Error('Exact version, generation, reason and confirmation required');
        const engine = createDurableWork({ db,
            enqueue: (kind, data, config) => getFunctions(app).taskQueue(`locations/europe-west1/functions/${taskNames[kind]}`).enqueue(data, config),
            repairAudit: (tx, before, after) => tx.create(db.doc(`sys_audit_security/maintenance_${before.version}_${after.generation}`), {
                eventType: 'maintenance.repair', operationId: before.operationId, version: before.version,
                previousGeneration: before.generation, generation: after.generation, reason: args.reason,
                createdAt: new Date(), expireAt: new Date(Date.now() + 180 * 86400000)
            })
        });
        process.stdout.write(JSON.stringify(await engine.repair(work)) + '\n');
    }
} finally { await app.delete(); }
