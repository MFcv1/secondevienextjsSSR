#!/usr/bin/env node

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const RESTORE_DATABASE = 'restore-drill-20260815-a';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = 'apphostingaudit/manifests/functions-gen2-g1-cross-service.json';
const RUNTIME_PATHS = ['app', 'functions/src', 'src', 'firebase.json', 'apphosting.yaml'];

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) fail(`G1_CROSS_SERVICE_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function gcloud(args) {
  return JSON.parse(execFileSync('gcloud', [...args, `--project=${PROJECT_ID}`, '--format=json'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }) || 'null');
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function filesUnder(target) {
  const absolute = path.join(ROOT, target);
  const stat = await import('node:fs/promises').then(({ stat: readStat }) => readStat(absolute));
  if (stat.isFile()) return [absolute];
  const files = [];
  for (const entry of await readdir(absolute, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.next')) continue;
    const relative = path.relative(ROOT, path.join(absolute, entry.name));
    if (entry.isDirectory()) files.push(...await filesUnder(relative));
    else files.push(path.join(absolute, entry.name));
  }
  return files;
}

async function runtimeRestoreReferences() {
  const offenders = [];
  for (const target of RUNTIME_PATHS) {
    for (const file of await filesUnder(target)) {
      const content = await readFile(file, 'utf8').catch(() => '');
      if (content.includes(RESTORE_DATABASE)) offenders.push(path.relative(ROOT, file));
    }
  }
  return offenders.sort();
}

async function authUserCount(auth) {
  let count = 0;
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    count += page.users.length;
    pageToken = page.pageToken;
  } while (pageToken);
  return count;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.get('project') !== PROJECT_ID || (args.get('env') || ENVIRONMENT) !== ENVIRONMENT) {
    fail('G1_CROSS_SERVICE_TARGET_INVALID');
  }
  if (args.has('apply') || args.has('write') || args.has('delete')) fail('G1_CROSS_SERVICE_READ_ONLY');

  const credential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    : applicationDefault();
  const app = getApps().find((entry) => entry.name === 'functions-gen2-g1-cross-service') || initializeApp({
    credential,
    projectId: PROJECT_ID
  }, 'functions-gen2-g1-cross-service');

  const [userCount, buckets, secrets, runtimeReferences] = await Promise.all([
    authUserCount(getAuth(app)),
    Promise.resolve(gcloud(['storage', 'buckets', 'list'])),
    Promise.resolve(gcloud(['secrets', 'list'])),
    runtimeRestoreReferences()
  ]);
  const secretVersions = [];
  for (const secret of secrets) {
    const name = secret.name?.split('/').at(-1);
    if (!name) continue;
    const versions = gcloud(['secrets', 'versions', 'list', name]);
    secretVersions.push({
      name,
      states: Object.fromEntries([...versions.reduce((counts, version) => {
        const state = version.state || 'UNKNOWN';
        counts.set(state, (counts.get(state) || 0) + 1);
        return counts;
      }, new Map())].sort())
    });
  }
  secretVersions.sort((left, right) => left.name.localeCompare(right.name));

  const platform = JSON.parse(await readFile(path.join(ROOT, 'apphostingaudit/manifests/functions-platform-g0.json'), 'utf8'));
  const platformText = JSON.stringify(platform);
  const eventarcTargetsRestore = platformText.includes(RESTORE_DATABASE);
  const bucketsSafe = buckets.map((bucket) => ({
    name: bucket.name,
    location: bucket.location,
    storageClass: bucket.storageClass,
    publicAccessPrevention: bucket.iamConfiguration?.publicAccessPrevention || null,
    uniformBucketLevelAccess: bucket.iamConfiguration?.uniformBucketLevelAccess?.enabled === true
  })).sort((left, right) => left.name.localeCompare(right.name));
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    environment: ENVIRONMENT,
    auth: { userCount, state: 'READABLE_UNCHANGED_PROJECT_SCOPE' },
    storage: { buckets: bucketsSafe },
    secrets: {
      valuesRead: false,
      versionStates: secretVersions
    },
    configuration: {
      runtimeRestoreReferences: runtimeReferences,
      eventarcTargetsRestore,
      eventarcCount: platform.metadata?.eventarcCount ?? null
    },
    verdict: runtimeReferences.length === 0 && !eventarcTargetsRestore
      ? 'CROSS_SERVICE_ISOLATION_VERIFIED'
      : 'HOLD_CROSS_SERVICE_ROUTING'
  };
  manifest.manifestDigest = digest(manifest);
  const output = path.resolve(args.get('output') || OUTPUT);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({
    status: 'OK',
    verdict: manifest.verdict,
    authUsers: userCount,
    buckets: bucketsSafe.length,
    secrets: secretVersions.length,
    secretValuesRead: false,
    runtimeRestoreReferences: runtimeReferences,
    eventarcTargetsRestore,
    output: path.relative(process.cwd(), output)
  }, null, 2)}\n`);
  if (manifest.verdict !== 'CROSS_SERVICE_ISOLATION_VERIFIED') process.exitCode = 2;
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ status: 'ERROR', code: String(error?.message || error) })}\n`);
  process.exitCode = 1;
}
