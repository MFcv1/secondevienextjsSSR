import fs from 'node:fs';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

// Plan uniquement : aucune dépendance Firebase, credential ou transport réseau.
// Le snapshot d'entrée est expurgé (ID, version et contribution booléenne).
export function prepareReconciliation(input, { after = '', limit = 100 } = {}) {
  if (input?.schemaVersion !== 1 || !['returns', 'newsletter'].includes(input.domain)
      || input.project !== 'secondevienextjsssr' || !Number.isSafeInteger(input.summaryRevision)
      || !Array.isArray(input.sources) || !Array.isArray(input.ledgers)
      || !Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error('INVALID_RECONCILIATION_INPUT');
  const source = new Map();
  const ledger = new Map();
  for (const [rows, target] of [[input.sources, source], [input.ledgers, ledger]]) {
    for (const row of rows) {
      if (!row || !/^[\w/-]{1,500}$/.test(row.id) || typeof row.active !== 'boolean' || typeof row.version !== 'string' || target.has(row.id)) throw new Error('INVALID_RECONCILIATION_ROW');
      target.set(row.id, row);
    }
  }
  const keys = [...new Set([...source.keys(), ...ledger.keys()])].sort();
  const candidates = keys.filter(id => id > after);
  const page = candidates.slice(0, limit);
  const changes = page.flatMap(id => {
    const current = source.get(id);
    const applied = ledger.get(id);
    const active = current?.active === true;
    if (applied && applied.active === active && applied.version === current?.version) return [];
    return [{ id, expectedSourceVersion: current?.version || null, expectedLedgerVersion: applied?.version || null, active, tombstone: !current }];
  });
  const digest = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  return {
    schemaVersion: 1, mode: 'dry-run', domain: input.domain, project: input.project,
    inputDigest: digest, expectedSummaryRevision: input.summaryRevision,
    sourceCount: source.size, ledgerCount: ledger.size,
    expectedActiveCount: [...source.values()].filter(row => row.active).length,
    changes, checkpoint: page.at(-1) || after,
    hasMore: candidates.length > limit,
    deliveryBlockedUntil: 'baseline gate closed, snapshot backed up, ledgers reconciled, count/CAS activation, pending events drained'
  };
}

export function prepareSchemaMigration({ project, orders = [], facts = [] }) {
  if (project !== 'secondevienextjsssr' || orders.length + facts.length > 500) throw new Error('BOUNDED_SCHEMA_PAGE_REQUIRED');
  const changes = [];
  for (const row of orders) {
    if (!/^[\w-]{1,200}$/.test(row.id) || typeof row.version !== 'string' || typeof row.archived !== 'boolean') throw new Error('INVALID_ORDER_SCHEMA_ROW');
    if (row.adminArchived !== row.archived) changes.push({ path: `orders/${row.id}`, expectedVersion: row.version, patch: { adminArchived: row.archived } });
  }
  for (const row of facts) {
    if (!/^[\w-]{1,200}$/.test(row.id) || typeof row.version !== 'string') throw new Error('INVALID_FACT_SCHEMA_ROW');
    const shardId = String(parseInt(crypto.createHash('sha256').update(row.id).digest('hex').slice(0, 8), 16) % 8).padStart(2, '0');
    if (row.shardId !== shardId) changes.push({ path: `analytics_session_facts/${row.id}`, expectedVersion: row.version, patch: { shardId } });
  }
  return { mode: 'dry-run', project, changes, checkpoint: facts.at(-1)?.id || orders.at(-1)?.id || null };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = Object.fromEntries(process.argv.slice(2).map(arg => {
    const at = arg.indexOf('='); return [arg.slice(2, at), arg.slice(at + 1)];
  }));
  if (!args.input || Object.keys(args).some(key => !['input', 'after', 'limit'].includes(key))) throw new Error('Usage: --input=local.json [--after=id] [--limit=100]. Dry-run uniquement.');
  console.log(JSON.stringify(prepareReconciliation(JSON.parse(fs.readFileSync(args.input, 'utf8')), {
    after: args.after || '', limit: args.limit ? Number(args.limit) : 100
  }), null, 2));
}
