// Explicitly approved, bounded membership migration: four ledgers, two summaries.
// No commerce source, subscriber, payment or refund document is ever written.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const directory = 'logs/recette/backend_delivery_20260905';
const prefix = 'projects/secondevienextjsssr/databases/(default)/documents/';
const base = `https://firestore.googleapis.com/v1/${prefix.slice(0, -1)}`;
const phase = process.argv[2];
if (!['close', 'activate'].includes(phase)) throw new Error('EXPLICIT_PHASE_REQUIRED');
const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
async function call(suffix, body) {
  const response = await fetch(base + suffix, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(`MIGRATION_HTTP_${response.status}`);
  return data;
}
const save = (name, data) => fs.writeFileSync(`${directory}/${name}`, JSON.stringify(data, null, 2), { mode: 0o600 });
const read = name => JSON.parse(fs.readFileSync(`${directory}/${name}`, 'utf8'));
if (fs.existsSync(`${directory}/migration-${phase}-result.json`)) throw new Error('PHASE_ALREADY_RECORDED');
if (phase === 'activate') {
  read('migration-close-result.json');
  for (const name of ['projectAdminActionSummaryGen2', 'projectNewsletterSubscriberGen2']) {
    const deployed = read(`${name}.after.private.json`);
    if (deployed.state !== 'ACTIVE' || Date.now() - Date.parse(deployed.updateTime) < 65_000) throw new Error('WAIT_FOR_OLD_PROJECTOR_REQUESTS');
  }
}
const { transaction } = await call(':beginTransaction', {});
const summaries = ['admin_action_summary/current', 'admin_newsletter_summary/current'];
const documents = await call(':batchGet', { documents: summaries.map(name => prefix + name), transaction });
const found = new Map(documents.filter(row => row.found).map(row => [row.found.name, row.found]));
if (found.size !== 2) throw new Error('SUMMARIES_REQUIRED');
const writes = [];
const backup = { phase, summaries: [...found.values()], ledgers: [], sourceVersions: [] };
const now = { timestampValue: new Date().toISOString() };
const integer = n => ({ integerValue: String(n) });
const bool = value => ({ booleanValue: value });
const totals = {};
for (const [domain, collection, summaryPath, ledgerCollection, maximum] of [
  ['returns', 'customer_return_requests', summaries[0], 'admin_action_projections', 3],
  ['newsletter', 'newsletter_subscribers', summaries[1], 'admin_newsletter_subscriber_projections', 1],
]) {
  const summary = found.get(prefix + summaryPath);
  if (phase === 'close') {
    writes.push({ update: { name: summary.name, fields: { ...summary.fields, ledgerBaselineReady: bool(false) } }, currentDocument: { updateTime: summary.updateTime } });
    continue;
  }
  if (summary.fields.ledgerBaselineReady?.booleanValue !== false) throw new Error('BASELINE_GATE_NOT_CLOSED');
  const sources = (await call(':runQuery', { transaction, structuredQuery: { select: { fields: [{ fieldPath: 'status' }] }, from: [{ collectionId: collection, allDescendants: domain === 'returns' }], limit: maximum + 1 } })).filter(row => row.document).map(row => row.document);
  if (sources.length > maximum) throw new Error('APPROVED_SOURCE_BOUND_EXCEEDED');
  const approved = new Set(read(`${domain}-dry-run.json`).input.sources.map(row => row.id));
  const existing = (await call(':runQuery', { transaction, structuredQuery: { from: [{ collectionId: ledgerCollection }], limit: maximum + 1 } })).filter(row => row.document).map(row => row.document);
  if (existing.length > maximum || existing.some(row => !approved.has(row.name.split('/').at(-1)))) throw new Error('UNAPPROVED_LEDGER');
  backup.ledgers.push(...existing);
  let total = 0;
  for (const source of sources) {
    const id = domain === 'returns' ? crypto.createHash('sha256').update(source.name.slice(prefix.length)).digest('hex') : source.name.split('/').at(-1);
    if (!approved.has(id)) throw new Error('UNAPPROVED_SOURCE');
    const active = domain === 'newsletter' || source.fields?.status?.stringValue === 'pending_review';
    total += Number(active);
    backup.sourceVersions.push({ id, updateTime: source.updateTime, active });
    const ledgerName = prefix + ledgerCollection + '/' + id;
    const previous = existing.find(row => row.name === ledgerName);
    writes.push({ update: { name: ledgerName, fields: {
      schemaVersion: integer(1), tombstone: bool(false), sourceUpdateTime: { timestampValue: source.updateTime }, updatedAt: now,
      ...(domain === 'returns' ? { active: bool(active), sourcePathHash: { stringValue: id } } : { subscriberId: { stringValue: id }, present: bool(true), eventId: { stringValue: 'membership-migration-20260905' } }),
    } }, currentDocument: previous ? { updateTime: previous.updateTime } : { exists: false } });
  }
  if (existing.some(row => !writes.some(write => write.update.name === row.name))) throw new Error('TOMBSTONE_REPLAN_REQUIRED');
  totals[domain] = total;
  writes.push({ update: { name: summary.name, fields: {
    ...summary.fields, schemaVersion: integer(1), ledgerBaselineReady: bool(true), updatedAt: now,
    revision: integer(Number(summary.fields.revision?.integerValue || 0) + 1),
    ...(domain === 'returns' ? { pendingReturns: integer(total), totalPending: integer(total) } : {
      activeCount: integer(total), baselineAt: now, additionsSinceBaseline: integer(0), removalsSinceBaseline: integer(0), source: { stringValue: 'newsletter_subscriber_projection' },
    }),
  } }, currentDocument: { updateTime: summary.updateTime } });
}
if (writes.length > 6) throw new Error('SIX_DOCUMENT_BOUND_EXCEEDED');
save(`migration-${phase}-backup.private.json`, backup);
const result = await call(':commit', { transaction, writes });
save(`migration-${phase}-result.json`, { commitTime: result.commitTime, documents: writes.length, totals });
console.log(JSON.stringify({ phase, documents: writes.length, totals, commitTime: result.commitTime }));
