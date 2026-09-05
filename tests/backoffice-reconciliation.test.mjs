import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareReconciliation, prepareSchemaMigration } from '../scripts/prepare-backoffice-reconciliation.mjs';
test('rapprochement dry-run : checkpoint, tombstone, préconditions et reprise déterministe', () => {
  const input = { schemaVersion: 1, project: 'secondevienextjsssr', domain: 'newsletter', summaryRevision: 4,
    sources: [{ id: 'a', version: 'v2', active: true }],
    ledgers: [{ id: 'b', version: 'v1', active: true }] };
  const first = prepareReconciliation(input, { limit: 1 });
  assert.equal(first.expectedActiveCount, 1);
  assert.equal(first.hasMore, true);
  const last = prepareReconciliation(input, { after: first.checkpoint, limit: 1 });
  assert.equal(last.changes[0].tombstone, true);
  assert.equal(last.hasMore, false);
  assert.deepEqual(first, prepareReconciliation(input, { limit: 1 }));
  assert.throws(() => prepareReconciliation({ ...input, project: 'production' }));
});

test('migration additive : archives et shard, uniquement les divergences versionnées', () => {
  const plan = prepareSchemaMigration({project:'secondevienextjsssr',orders:[{id:'order-a',version:'v1',archived:false},{id:'order-b',version:'v2',archived:true,adminArchived:true}],facts:[{id:'fact-a',version:'v3'}]});
  assert.equal(plan.changes.length,2);
  assert.deepEqual(plan.changes[0].patch,{adminArchived:false});
  assert.match(plan.changes[1].patch.shardId,/^0[0-7]$/);
});
