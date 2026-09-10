import { execFileSync } from 'node:child_process';
const project = 'secondevienextjsssr', region = 'europe-west1';
const flags = new Set(process.argv.slice(2));
if (!flags.has(`--project=${project}`) || !flags.has('--env=sandbox')) throw Error('Explicit sandbox scope required');
const execute = flags.has('--execute');
if (execute && !flags.has('--confirm=RETIRE_EMPTY_PUBLICATION_SCANS')) throw Error('Exact retirement confirmation required');
const gcloud = args => {
    const output = execFileSync('gcloud', [...args, `--project=${project}`, '--format=json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    return output ? JSON.parse(output) : {};
};
const names = ['cleanupProductPublicationSessions', 'reconcileProductPublicationSessions'];
const producers = ['startProductPublicationAdmin', 'startProductPublicationAdminGen2'];
const deployed = gcloud(['functions', 'list']).map(fn => fn.name.split('/').at(-1));
if (producers.some(name => deployed.includes(name))) throw Error('Publication producer still deployed');
const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const response = await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents:runAggregationQuery`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: 'product_publication_sessions' }] }, aggregations: [{ alias: 'total', count: {} }] } })
});
if (!response.ok) throw Error(`Firestore count unavailable: ${response.status}`);
const rows = await response.json();
if (Number(rows[0]?.result?.aggregateFields?.total?.integerValue) !== 0) throw Error('Publication sessions remain; no retirement');
const jobs = names.map(name => {
    const id = `firebase-schedule-${name}-${region}`;
    const before = gcloud(['scheduler', 'jobs', 'describe', id, `--location=${region}`]);
    if (before.httpTarget?.uri !== `https://${region}-${project}.cloudfunctions.net/${name}`) throw Error('Unexpected scheduler target');
    return { id, before: { state: before.state, schedule: before.schedule } };
});
for (const job of jobs) {
    if (execute && job.before.state === 'ENABLED') gcloud(['scheduler', 'jobs', 'pause', job.id, `--location=${region}`]);
    const after = gcloud(['scheduler', 'jobs', 'describe', job.id, `--location=${region}`]);
    job.after = { state: after.state, schedule: after.schedule };
    if (execute && after.state !== 'PAUSED') throw Error('Scheduler pause not confirmed');
}
process.stdout.write(JSON.stringify({ project, observedAt: new Date().toISOString(), mode: execute ? 'paused' : 'dry_run', sessions: 0,
    producersAbsent: producers, jobs, rollback: 'gcloud scheduler jobs resume JOB --location=europe-west1 --project=secondevienextjsssr' }, null, 2) + '\n');
