// Source-only update for existing sandbox Functions. No service/trigger/IAM mask.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateDeploymentRequest } from './deploy-functions-targeted.mjs';

const rootDir = process.cwd();
const directory = 'logs/recette/backend_delivery_20260905';
const project = 'secondevienextjsssr';
const api = 'https://cloudfunctions.googleapis.com/v2/';
const command = process.argv[2];
const names = (process.argv[3] || '').split(',').filter(Boolean);
const read = file => JSON.parse(fs.readFileSync(`${directory}/${file}`, 'utf8'));
const write = (file, data) => fs.writeFileSync(`${directory}/${file}`, JSON.stringify(data, null, 2), { mode: 0o600 });
const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
async function request(url, method = 'GET', body) {
  const response = await fetch(url.startsWith('https:') ? url : api + url, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`FUNCTIONS_HTTP_${response.status}: ${data.error?.message || 'request failed'}`);
  return data;
}
const before = read('functions-before.private.json');
if (command === 'upload') {
  if (fs.existsSync(`${directory}/source.json`)) { const previous = read('source.json'); write(`source-${previous.sha256}.json`, previous); }
  const archive = fs.readFileSync(`${directory}/source.zip`);
  const digest = crypto.createHash('sha256').update(archive).digest('hex');
  const upload = await request(`projects/${project}/locations/europe-west1/functions:generateUploadUrl`, 'POST', {});
  const signed = new URL(upload.uploadUrl).searchParams.has('GoogleAccessId');
  const response = await fetch(upload.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/zip', ...(!signed ? { Authorization: `Bearer ${token}` } : {}) }, body: archive });
  if (!response.ok) throw new Error(`SOURCE_UPLOAD_HTTP_${response.status}`);
  write('source.json', { sha256: digest, size: archive.length, storageSource: { ...upload.storageSource, generation: response.headers.get('x-goog-generation') || upload.storageSource.generation } });
  console.log(JSON.stringify({ uploaded: true, sha256: digest, size: archive.length }));
} else if (command === 'deploy') {
  const currentCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const manifestPath = path.resolve(directory, 'manifest.json');
  const manifest = read('manifest.json');
  execFileSync('git', ['merge-base', '--is-ancestor', manifest.metadata.baselineCommit, currentCommit]);
  const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=all', '--', 'functions', 'firebase.json', 'scripts/deploy-backoffice-source.mjs'], { encoding: 'utf8' });
  if (dirty.trim()) throw new Error('DEPLOYMENT_INPUTS_NOT_COMMITTED');
  validateDeploymentRequest({ args: { project, codebase: 'main', commit: currentCommit, allowlist: names.join(',') },
    manifest, rootDir, manifestPath, digestPath: path.resolve(directory, 'digest.json'), currentCommit,
    activeFirebaseProject: project, baselineIsAncestor: true });
  const source = read('source.json');
  if (crypto.createHash('sha256').update(fs.readFileSync(`${directory}/source.zip`)).digest('hex') !== source.sha256) throw new Error('SOURCE_DIGEST_CHANGED');
  // Every target is compared immediately before update; accidental replays stop.
  for (const name of names) {
    const original = before.find(row => row.name.endsWith(`/${name}`));
    if (!original || original.environment !== 'GEN_2') throw new Error('EXISTING_GEN2_REQUIRED');
    const previousResult = fs.existsSync(`${directory}/${name}.after.private.json`) ? read(`${name}.after.private.json`) : original;
    if (fs.existsSync(`${directory}/${name}.operation.json`) && read(`${name}.operation.json`).sourceSha256 === source.sha256) throw new Error(`ALREADY_DISPATCHED:${name}`);
    const current = await request(original.name);
    if (current.state !== 'ACTIVE' || current.serviceConfig.revision !== previousResult.serviceConfig.revision) throw new Error(`REVISION_CHANGED:${name}`);
    const operation = await request(`${original.name}?updateMask=buildConfig.source`, 'PATCH', { buildConfig: { source: { storageSource: source.storageSource } } });
    if (fs.existsSync(`${directory}/${name}.operation.json`)) { const previous = read(`${name}.operation.json`); write(`${name}-${previous.sourceSha256}.operation.json`, previous); }
    write(`${name}.operation.json`, { name: operation.name, previousRevision: current.serviceConfig.revision, sourceSha256: source.sha256 });
    console.log(JSON.stringify({ target: name, operation: operation.name }));
  }
} else if (command === 'status') {
  for (const name of names) {
    const operation = read(`${name}.operation.json`);
    const result = await request(operation.name);
    const current = result.done && !result.error ? await request(before.find(row => row.name.endsWith(`/${name}`)).name) : null;
    if (current) {
      const previous = fs.existsSync(`${directory}/${name}.after.private.json`) ? read(`${name}.after.private.json`) : null;
      write(`${name}.after.private.json`, { ...current, _observedActiveAt: previous?.serviceConfig?.revision === current.serviceConfig.revision ? previous._observedActiveAt || new Date().toISOString() : new Date().toISOString() });
    }
    console.log(JSON.stringify({ target: name, done: Boolean(result.done), error: result.error || null, revision: current?.serviceConfig.revision, state: current?.state }));
  }
} else throw new Error('Usage: upload | deploy names | status names');
