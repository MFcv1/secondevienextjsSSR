// Delivery-specific source-only updates, guarded by the existing target validator.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateDeploymentRequest } from './deploy-functions-targeted.mjs';

const rootDir = process.cwd();
const directory = 'logs/livraison/2026-09-08-reprise';
const project = 'secondevienextjsssr';
const operator = 'matthis.fradin2@gmail.com';
const command = process.argv[2];
const names = (process.argv[3] || '').split(',').filter(Boolean);
const read = file => JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(directory, file), JSON.stringify(value, null, 2), { mode: 0o600 });
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const manifestPath = path.resolve('deploy/interactions-20260908.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath));
const before = read('functions-before.private.json');
const currentCommit = git(['rev-parse', 'HEAD']);
const source = read('source.json');
if (!git(['branch', '--show-current']).startsWith('codex/')) throw new Error('CODEX_BRANCH_REQUIRED');
if (source.commit !== currentCommit) throw new Error('SOURCE_COMMIT_MISMATCH');
if (sha(fs.readFileSync(path.join(directory, 'source.zip'))) !== source.sha256) throw new Error('SOURCE_DIGEST_MISMATCH');
if (git(['status', '--porcelain', '--untracked-files=all', '--', 'functions', 'firebase.json', 'scripts/deploy-interactions-source.mjs', 'scripts/deploy-functions-targeted.mjs', 'deploy/interactions-20260908.json'])) throw new Error('UNCOMMITTED_DEPLOYMENT_INPUTS');
git(['merge-base', '--is-ancestor', manifest.metadata.baselineCommit, currentCommit]);
const rollback = read('rollback-manifest.json');
for (const target of manifest.functions) {
  const backup = rollback.find(item => item.name === target.name && item.status === 'captured');
  if (!backup || sha(fs.readFileSync(path.join(directory, 'rollback', `${target.name}.zip`))) !== backup.sha256) throw new Error(`ROLLBACK_MISSING:${target.name}`);
}
if (names.length) validateDeploymentRequest({ args: { project, codebase: 'main', commit: currentCommit, allowlist: names.join(',') }, manifest, rootDir, manifestPath, digestPath: path.resolve(directory, 'digest.json'), currentCommit, activeFirebaseProject: project, baselineIsAncestor: true });
if (command === 'validate') { console.log(JSON.stringify({ valid: true, targets: names, sourceCommit: source.commit, sourceSha256: source.sha256 })); process.exit(0); }

const activeOperator = execFileSync('gcloud', ['config', 'get-value', 'account'], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
if (activeOperator !== operator) throw new Error('OPERATOR_MISMATCH');
const token = execFileSync('gcloud', ['auth', 'print-access-token', `--account=${operator}`], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
async function request(resource, method = 'GET', body, version = 'v2') {
  if (!resource.startsWith(`projects/${project}/`) && !resource.startsWith('operations/')) throw new Error('RESOURCE_PROJECT_MISMATCH');
  const response = await fetch(`https://cloudfunctions.googleapis.com/${version}/${resource}`, { method, headers: { Authorization: `Bearer ${token}`, 'x-goog-user-project': project, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(`FUNCTIONS_HTTP_${response.status}:${result.error?.message || 'request failed'}`);
  return result;
}
const revision = row => row.serviceConfig?.revision || row.versionId;
async function upload(version, archivePath = path.join(directory, 'source.zip'), persist = true) {
  const result = await request(`projects/${project}/locations/europe-west1/functions:generateUploadUrl`, 'POST', {}, version);
  const archive = fs.readFileSync(archivePath);
  const response = await fetch(result.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/zip', ...(new URL(result.uploadUrl).searchParams.has('GoogleAccessId') ? {} : { Authorization: `Bearer ${token}` }) }, body: archive });
  if (!response.ok) throw new Error(`SOURCE_UPLOAD_HTTP_${response.status}`);
  const uploaded = { sha256: sha(archive), ...(version === 'v1' ? { sourceUploadUrl: result.uploadUrl } : { storageSource: { ...result.storageSource, generation: response.headers.get('x-goog-generation') || result.storageSource.generation } }) };
  if (persist) write(`uploaded-${version}.private.json`, uploaded);
  console.log(JSON.stringify({ uploaded: version, sha256: uploaded.sha256 }));
  return uploaded;
}
if (command === 'upload') {
  await upload('v2');
} else if (command === 'upload-gen1') {
  if (names.length !== 1 || names[0] !== 'grantAdminOnAuth') throw new Error('GEN1_TARGET_REQUIRED');
  await upload('v1');
} else if (command === 'deploy') {
  if (names.length !== 1) throw new Error('SINGLE_TARGET_REQUIRED');
  const name = names[0];
  const original = before.find(row => row.name.endsWith(`/${name}`));
  if (!original) throw new Error('EXISTING_FUNCTION_REQUIRED');
  const version = original.environment === 'GEN_2' ? 'v2' : 'v1';
  if (version === 'v1' && name !== 'grantAdminOnAuth') throw new Error('GEN1_NOT_ALLOWLISTED');
  if (fs.existsSync(path.join(directory, `${name}.operation.json`))) throw new Error('ALREADY_DISPATCHED');
  const current = await request(original.name, 'GET', undefined, version);
  if ((current.state || current.status) !== 'ACTIVE' || revision(current) !== revision(original)) throw new Error(`REVISION_CHANGED:${name}`);
  const uploaded = read(`uploaded-${version}.private.json`);
  if (uploaded.sha256 !== source.sha256) throw new Error('UPLOAD_DIGEST_MISMATCH');
  const mask = version === 'v2' ? 'buildConfig.source' : 'sourceUploadUrl';
  const body = version === 'v2' ? { buildConfig: { source: { storageSource: uploaded.storageSource } } } : { name: current.name, sourceUploadUrl: uploaded.sourceUploadUrl };
  // Journal intent before PATCH: a lost response must be inspected, never replayed.
  write(`${name}.operation.json`, { dispatching: true, version, resource: current.name, previousRevision: revision(current), sourceSha256: source.sha256, startedAt: new Date().toISOString() });
  const operation = await request(`${current.name}?updateMask=${mask}`, 'PATCH', body, version);
  write(`${name}.operation.json`, { name: operation.name, version, resource: current.name, previousRevision: revision(current), sourceSha256: source.sha256, startedAt: new Date().toISOString() });
  console.log(JSON.stringify({ target: name, operation: operation.name }));
} else if (command === 'rollback') {
  if (names.length !== 1) throw new Error('SINGLE_TARGET_REQUIRED');
  const name = names[0];
  const original = before.find(row => row.name.endsWith(`/${name}`));
  const version = original.environment === 'GEN_2' ? 'v2' : 'v1';
  if (version === 'v1' && name !== 'grantAdminOnAuth') throw new Error('GEN1_NOT_ALLOWLISTED');
  const deployed = read(`${name}.after.private.json`);
  const current = await request(original.name, 'GET', undefined, version);
  if (revision(current) !== revision(deployed) || (current.state || current.status) !== 'ACTIVE') throw new Error('ROLLBACK_REVISION_CHANGED');
  if (fs.existsSync(path.join(directory, `${name}.rollback.operation.json`))) throw new Error('ROLLBACK_ALREADY_DISPATCHED');
  const mask = version === 'v2' ? 'buildConfig.source' : 'sourceUploadUrl';
  const body = version === 'v2'
    ? { buildConfig: { source: original.buildConfig.source } }
    : { name: current.name, sourceUploadUrl: (await upload('v1', path.join(directory, 'rollback', `${name}.zip`), false)).sourceUploadUrl };
  write(`${name}.rollback.operation.json`, { dispatching: true, version, resource: current.name, previousRevision: revision(current) });
  const operation = await request(`${current.name}?updateMask=${mask}`, 'PATCH', body, version);
  write(`${name}.rollback.operation.json`, { name: operation.name, version, resource: current.name, previousRevision: revision(current) });
  console.log(JSON.stringify({ rollback: name, operation: operation.name }));
} else if (command === 'status' || command === 'status-rollback') {
  for (const name of names) {
    const suffix = command === 'status-rollback' ? '.rollback' : '';
    const operation = read(`${name}${suffix}.operation.json`);
    if (!operation.name) throw new Error(`AMBIGUOUS_DISPATCH:${name}`);
    const result = await request(operation.name, 'GET', undefined, operation.version);
    const current = result.done && !result.error ? await request(operation.resource, 'GET', undefined, operation.version) : null;
    if (current) write(`${name}${suffix}.after.private.json`, current);
    console.log(JSON.stringify({ target: name, done: Boolean(result.done), error: result.error || null, revision: current ? revision(current) : null, state: current?.state || current?.status }));
    if(result.error)process.exitCode=1;
  }
} else throw new Error('Expected validate, upload, upload-gen1, deploy, status, rollback or status-rollback');
