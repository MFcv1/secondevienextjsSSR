// Source-only updates: preserve existing triggers, identities, secrets and limits.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { validateDeploymentRequest } from './deploy-functions-targeted.mjs';
const project = 'secondevienextjsssr';
const allowed = new Set(['createAdminPaymentLinkGen2', 'extendAdminPaymentLinkGen2',
    'recreateAdminPaymentLinkGen2', 'regenerateAdminPaymentLinkGen2', 'prepareAdminPaymentLinkPaymentGen2',
    'resumeAdminPaymentLinkPaymentGen2', 'createCheckoutV2Gen2', 'resumeCheckoutV2Gen2',
    'stripeWebhookV2Gen2', 'stripeConnectWebhookV2Gen2', 'initLiveSessionGen2',
    'syncSessionGen2', 'syncSessionBeaconGen2', 'aggregateAnalyticsSessionGen2',
    'projectSystemIncidentGen2', 'captureProjectCostsGen2', 'getOrderTimelineAdminV2Gen2']);
const [command, directoryArg, name] = process.argv.slice(2);
if (!['deploy', 'status'].includes(command) || !directoryArg || !allowed.has(name)) throw Error('EXPLICIT_TARGET_REQUIRED');
const directory = path.resolve(directoryArg), read = file => JSON.parse(fs.readFileSync(path.join(directory, file)));
const write = (file, value) => fs.writeFileSync(path.join(directory, file), JSON.stringify(value, null, 2), { mode: 0o600 });
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = read('source.json'), currentCommit = git(['rev-parse', 'HEAD']);
git(['merge-base', '--is-ancestor', source.commit, currentCommit]);
if (git(['rev-parse', `${source.commit}:functions`]) !== git(['rev-parse', `${currentCommit}:functions`])) throw Error('FUNCTIONS_TREE_CHANGED');
if (git(['status', '--porcelain', '--untracked-files=all', '--', 'functions', 'firebase.json', 'scripts/deploy-event-producers.mjs', 'scripts/deploy-functions-targeted.mjs'])) throw Error('UNCOMMITTED_INPUTS');
if (sha(fs.readFileSync(path.join(directory, 'source.zip'))) !== source.sha256) throw Error('SOURCE_DIGEST_CHANGED');
const manifestPath = path.join(directory, 'manifest.json'), manifest = read('manifest.json');
validateDeploymentRequest({ args: { project, codebase: 'main', commit: currentCommit, allowlist: name },
    manifest, rootDir: process.cwd(), manifestPath, digestPath: path.join(directory, 'digest.json'), currentCommit,
    activeFirebaseProject: project, baselineIsAncestor: true });
const original = read('producers-before.private.json').find(row => row.name.endsWith(`/${name}`));
if (!original || original.environment !== 'GEN_2') throw Error('EXISTING_GEN2_REQUIRED');
const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
async function api(resource, method = 'GET', body) {
    if (!resource.startsWith(`projects/${project}/`)) throw Error('RESOURCE_PROJECT_MISMATCH');
    const r = await fetch(`https://cloudfunctions.googleapis.com/v2/${resource}`, { method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}) });
    const j = await r.json(); if (!r.ok) throw Error(`FUNCTIONS_HTTP_${r.status}:${j.error?.message}`); return j;
}
if (command === 'status') {
    const operation = read(`${name}.operation.json`);
    if (!operation.name) throw Error('UNCERTAIN_DISPATCH_REQUIRES_INSPECTION');
    const result = await api(operation.name);
    const after = result.done && !result.error ? await api(original.name) : null;
    if (after) write(`${name}.after.private.json`, after);
    console.log(JSON.stringify({ target: name, done: Boolean(result.done), error: result.error || null, revision: after?.serviceConfig.revision }));
} else {
    if (fs.existsSync(path.join(directory, `${name}.operation.json`))) throw Error('ALREADY_DISPATCHED');
    const current = await api(original.name);
    if (current.state !== 'ACTIVE' || current.serviceConfig.revision !== original.serviceConfig.revision) throw Error('REVISION_CHANGED');
    const backup = read('rollback-manifest.json').find(row => row.name === name);
    if (!backup || sha(fs.readFileSync(path.join(directory, 'rollback', `${name}.zip`))) !== backup.sha256) throw Error('ROLLBACK_NOT_VERIFIED');
    const storageSource = { bucket: source.uri.slice(5).split('/')[0], object: source.uri.slice(5).split('/').slice(1).join('/'), generation: source.generation };
    write(`${name}.operation.json`, { dispatching: true, previousRevision: current.serviceConfig.revision, sourceSha256: source.sha256 });
    const operation = await api(`${current.name}?updateMask=buildConfig.source`, 'PATCH', { buildConfig: { source: { storageSource } } });
    write(`${name}.operation.json`, { name: operation.name, previousRevision: current.serviceConfig.revision, sourceSha256: source.sha256 });
    console.log(JSON.stringify({ target: name, operation: operation.name }));
}
