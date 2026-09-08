// Package only committed Functions sources, retaining existing cloud webhook aliases.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const directory = path.join(root, 'logs/livraison/2026-09-08-reprise');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const manifestPath = 'deploy/interactions-20260908.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath));
if (manifest.metadata.project !== 'secondevienextjsssr') throw new Error('SANDBOX_REQUIRED');
if (fs.existsSync(path.join(directory, 'uploaded-v2.private.json'))) throw new Error('SOURCE_ALREADY_UPLOADED');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-interactions-source-'));
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
try {
  const archive = execFileSync('git', ['archive', `${commit}:functions`], { maxBuffer: 32 * 1024 * 1024 });
  execFileSync('tar', ['-xf', '-', '-C', temporary], { input: archive });
  const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', `${commit}:functions`], { encoding: 'utf8' }).trim().split('\n');
  if (paths.some(file => /(^|\/)\.env|service-account|\.(pem|key)$/.test(file))) throw new Error('SENSITIVE_ARCHIVE_PATH');
  const entry = path.join(temporary, 'index.js');
  const aliases = '\n// Retain deployed webhook entry points without loading them for isolated readers.\nif (!readerTarget) {\n  const webhooks = require("./src/commerce/v2Webhooks");\n  exports.stripeWebhookV2 = webhooks.stripeWebhookV2;\n  exports.stripeConnectWebhookV2 = webhooks.stripeConnectWebhookV2;\n}\n';
  fs.appendFileSync(entry, aliases);
  execFileSync(process.execPath, ['--check', entry]);
  const zip = path.join(directory, 'source.zip');
  // zip replaces named entries but retains removed files in an old archive.
  if (fs.existsSync(zip)) throw new Error('SOURCE_ARCHIVE_ALREADY_EXISTS');
  execFileSync('zip', ['-q', '-r', zip, '.'], { cwd: temporary });
  const bytes = fs.readFileSync(zip);
  const records = { commit, sha256: sha256(bytes), bytes: bytes.length, packaging: 'git archive HEAD:functions plus two guarded existing webhook aliases', indexSha256: sha256(fs.readFileSync(entry)), entries: paths.length };
  fs.writeFileSync(path.join(directory, 'source.json'), JSON.stringify(records, null, 2), { mode: 0o600 });
  fs.writeFileSync(path.join(directory, 'digest.json'), JSON.stringify({ files: { [manifestPath]: sha256(fs.readFileSync(manifestPath)) } }, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(records));
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
