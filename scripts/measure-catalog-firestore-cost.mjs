import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  SANDBOX_PROJECT,
  assertSandbox,
  parseArgs,
  writeEvidence,
} from './catalog-sandbox-lib.mjs';

const args = parseArgs();
const projectId = String(args.project || SANDBOX_PROJECT);
assertSandbox(projectId);
const minutes = Math.max(1, Math.min(Number(args.minutes || 30), 180));
const windowsGcloud = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin', 'gcloud.cmd')
  : '';
const gcloud = process.env.GCLOUD_CLI
  || (process.platform === 'win32' && windowsGcloud && fs.existsSync(windowsGcloud) ? 'gcloud.cmd' : 'gcloud');
const filter = [
  `timestamp>=\"${new Date(Date.now() - minutes * 60000).toISOString()}\"`,
  'protoPayload.serviceName=firestore.googleapis.com',
  '(protoPayload.methodName:*GetDocument OR protoPayload.methodName:*ListDocuments OR protoPayload.methodName:*RunQuery)',
].join(' AND ');
const gcloudArgs = [
  'logging', 'read', filter,
  `--project=${projectId}`,
  '--format=json',
  '--limit=10000',
];
const cloudSdkRoot = windowsGcloud ? path.resolve(path.dirname(windowsGcloud), '..') : '';
const bundledPython = cloudSdkRoot ? path.join(cloudSdkRoot, 'platform', 'bundledpython', 'python.exe') : '';
const gcloudPython = cloudSdkRoot ? path.join(cloudSdkRoot, 'lib', 'gcloud.py') : '';
const result = process.platform === 'win32' && fs.existsSync(bundledPython) && fs.existsSync(gcloudPython)
  ? spawnSync(bundledPython, ['-S', gcloudPython, ...gcloudArgs], {
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, CLOUDSDK_ROOT_DIR: cloudSdkRoot, PYTHONHOME: '' },
  })
  : spawnSync(gcloud, gcloudArgs, { encoding: 'utf8', windowsHide: true });
if (result.error) throw new Error(`gcloud logging read failed to start: ${result.error.message}`);
if (result.status !== 0) throw new Error(`gcloud logging read failed: ${String(result.stderr || result.stdout || 'unknown error').slice(0, 500)}`);
const entries = JSON.parse(result.stdout || '[]');
const text = JSON.stringify(entries);
const publicMetaMatches = text.match(/artifacts\/secondevie\/public\/meta/g) || [];
const furnitureMatches = text.match(/artifacts\/secondevie\/public\/data\/furniture/g) || [];
const evidence = {
  ok: publicMetaMatches.length === 0 && furnitureMatches.length === 0,
  projectId,
  windowMinutes: minutes,
  auditEntryCount: entries.length,
  publicMetaReferences: publicMetaMatches.length,
  furnitureReferences: furnitureMatches.length,
  note: 'Valid only for a deliberately isolated window with Firestore Data Access enabled, then restored.',
};
evidence.evidencePath = writeEvidence('catalog-firestore-cost', evidence);
console.log(JSON.stringify(evidence, null, 2));
if (!evidence.ok) process.exitCode = 1;
