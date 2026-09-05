// Applies only the approved additive field plans, atomically and with versions.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const directory = 'logs/recette/backend_delivery_20260905';
const prefix = 'projects/secondevienextjsssr/databases/(default)/documents/';
const base = `https://firestore.googleapis.com/v1/${prefix.slice(0, -1)}`;
if (process.argv[2] !== 'apply') throw new Error('EXPLICIT_APPLY_REQUIRED');
if (fs.existsSync(`${directory}/index-fields-result.json`)) throw new Error('MIGRATION_ALREADY_RECORDED');
const read = name => JSON.parse(fs.readFileSync(`${directory}/${name}`, 'utf8'));
const plans = [read('orders-schema-dry-run.json'), read('analytics_session_facts-schema-dry-run.json')];
if (plans.some(plan => plan.project !== 'secondevienextjsssr' || plan.mode !== 'dry-run') || plans[0].changes.length > 142 || plans[1].changes.length > 181) throw new Error('APPROVED_BOUNDS_EXCEEDED');
const changes = plans.flatMap(plan => plan.changes);
if (!changes.length || new Set(changes.map(row => row.path)).size !== changes.length) throw new Error('INVALID_CHANGE_SET');
const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
async function call(suffix, body) {
  const response = await fetch(base + suffix, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`INDEX_MIGRATION_HTTP_${response.status}`);
  return response.json();
}
const { transaction } = await call(':beginTransaction', {});
const rows = await call(':batchGet', { transaction, documents: changes.map(row => prefix + row.path), mask: { fieldPaths: ['adminArchived', 'archivedAt', 'shardId'] } });
const documents = new Map(rows.filter(row => row.found).map(row => [row.found.name, row.found]));
const writes = changes.map(change => {
  const current = documents.get(prefix + change.path);
  if (!current || current.updateTime !== change.expectedVersion) throw new Error('SOURCE_VERSION_CHANGED_REPLAN_REQUIRED');
  const order = /^orders\/[\w-]+$/.test(change.path);
  if (!order && !/^analytics_session_facts\/[\w-]+$/.test(change.path)) throw new Error('UNAPPROVED_PATH');
  const field = order ? 'adminArchived' : 'shardId';
  if (Object.keys(change.patch).length !== 1 || !(field in change.patch)) throw new Error('UNAPPROVED_FIELD');
  if (order && (typeof change.patch[field] !== 'boolean' || Boolean(current.fields?.archivedAt && !current.fields.archivedAt.nullValue) !== change.patch[field])) throw new Error('ARCHIVE_SOURCE_MISMATCH');
  if (!order && (!/^0[0-7]$/.test(change.patch[field]) || (current.fields?.shardId && current.fields.shardId.stringValue !== change.patch[field]))) throw new Error('EXISTING_SHARD_REQUIRES_SEPARATE_RECONCILIATION');
  return { update: { name: current.name, fields: { [field]: order ? { booleanValue: change.patch[field] } : { stringValue: change.patch[field] } } }, updateMask: { fieldPaths: [field] }, currentDocument: { updateTime: current.updateTime } };
});
fs.writeFileSync(`${directory}/index-fields-backup.private.json`, JSON.stringify([...documents.values()], null, 2), { mode: 0o600 });
const result = await call(':commit', { transaction, writes });
const report = { commitTime: result.commitTime, orders: plans[0].changes.length, facts: plans[1].changes.length, documents: writes.length };
fs.writeFileSync(`${directory}/index-fields-result.json`, JSON.stringify(report, null, 2), { mode: 0o600 });
console.log(JSON.stringify(report));
