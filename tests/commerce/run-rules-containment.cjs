'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PROJECT_ID = 'demo-secondevie-commerce';
const FIRESTORE_PORT = 8185;
const STORAGE_PORT = 9295;
const repositoryRoot = path.resolve(__dirname, '..', '..');
const suiteArgumentIndex = process.argv.indexOf('--suite');
const suiteName = suiteArgumentIndex >= 0 ? process.argv[suiteArgumentIndex + 1] : 'rules-containment';
const allowedSuites = new Set(['rules-containment', 'firebase-domain', 'rules-v2']);

function fail(message) {
  process.stderr.write(`COMMERCE_RULES_GUARD ${message}\n`);
  process.exit(1);
}

if (!PROJECT_ID.startsWith('demo-')) fail('project ID must start with demo-');
if (!allowedSuites.has(suiteName)) fail(`unsupported local emulator suite: ${suiteName || 'missing'}`);

const forbiddenCredentialVariables = [
  'GOOGLE_APPLICATION_CREDENTIALS',
  'FIREBASE_TOKEN',
  'CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE',
  'GOOGLE_CLOUD_QUOTA_PROJECT',
].filter((name) => process.env[name]);
if (forbiddenCredentialVariables.length > 0) {
  fail(`cloud credential environment detected: ${forbiddenCredentialVariables.join(', ')}`);
}

for (const name of ['GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT']) {
  if (process.env[name] && process.env[name] !== PROJECT_ID) {
    fail(`${name} points to a non-demo project`);
  }
}
if (process.env.FIRESTORE_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST !== `127.0.0.1:${FIRESTORE_PORT}`) {
  fail('FIRESTORE_EMULATOR_HOST does not use the reserved local port');
}
if (process.env.FIREBASE_STORAGE_EMULATOR_HOST && process.env.FIREBASE_STORAGE_EMULATOR_HOST !== `127.0.0.1:${STORAGE_PORT}`) {
  fail('FIREBASE_STORAGE_EMULATOR_HOST does not use the reserved local port');
}

const javaProbe = spawnSync('java', ['-version'], { encoding: 'utf8' });
if (javaProbe.error || javaProbe.status !== 0) {
  fail('Java is unavailable; refusing to download an emulator dependency');
}

const emulatorCache = path.join(os.homedir(), '.cache', 'firebase', 'emulators');
const cachedEmulators = fs.existsSync(emulatorCache) ? fs.readdirSync(emulatorCache) : [];
if (!cachedEmulators.some((name) => /^cloud-firestore-emulator-v.*\.jar$/.test(name))) {
  fail('Firestore emulator JAR is not cached; refusing to download it');
}
if (
  suiteName === 'rules-containment' &&
  !cachedEmulators.some((name) => /^cloud-storage-rules-runtime-v.*\.jar$/.test(name))
) {
  fail('Storage emulator JAR is not cached; refusing to download it');
}

const firebaseBin = path.join(path.dirname(require.resolve('firebase-tools/package.json')), 'lib', 'bin', 'firebase.js');
const runnerPath = path.join(__dirname, 'runner', 'cli.cjs');
const manifestPath = path.join(__dirname, 'manifest.json');
const configPath = path.join(repositoryRoot, 'firebase.commerce.json');
const quotedCommand = `"${process.execPath}" "${runnerPath}" --manifest "${manifestPath}" --suite ${suiteName}`;
const emulatorSelection = suiteName === 'rules-containment' ? 'firestore,storage' : 'firestore';
const childEnvironment = { ...process.env };
for (const name of forbiddenCredentialVariables) delete childEnvironment[name];
Object.assign(childEnvironment, {
  CI: 'true',
  FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true',
  GCLOUD_PROJECT: PROJECT_ID,
  GOOGLE_CLOUD_PROJECT: PROJECT_ID,
  FIRESTORE_EMULATOR_HOST: `127.0.0.1:${FIRESTORE_PORT}`,
  COMMERCE_ALLOW_LOCAL_EMULATOR: '1',
});
if (suiteName === 'rules-containment') {
  childEnvironment.FIREBASE_STORAGE_EMULATOR_HOST = `127.0.0.1:${STORAGE_PORT}`;
} else {
  delete childEnvironment.FIREBASE_STORAGE_EMULATOR_HOST;
}

const result = spawnSync(process.execPath, [
  firebaseBin,
  'emulators:exec',
  '--config', configPath,
  '--project', PROJECT_ID,
  '--only', emulatorSelection,
  quotedCommand,
], {
  cwd: repositoryRoot,
  encoding: 'utf8',
  env: childEnvironment,
  stdio: 'inherit',
});

if (result.error) fail(result.error.message);
if (result.status !== 0) process.exitCode = result.status || 1;
