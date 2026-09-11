import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { repair, summaryFromLedgers } from '../scripts/repair-incident-summary.mjs';
test('repair counts acknowledged contributions, including closes still pending', () => {
  const ledger = (active, severity) => ({ active, severity, sourceUpdateTime: { seconds: 1 } });
  assert.deepEqual(summaryFromLedgers([ledger(true, 'critical'), ledger(true, 'critical'), ledger(false, 'critical'), ledger(true, 'warning')]),
    { activeCritical: 2, activeWarnings: 1, activeTotal: 3 });
});
test('repair refuses incomplete or unbounded ledgers instead of inventing zero', () => {
  assert.throws(() => summaryFromLedgers([{ active: true, severity: 'critical' }]), /INVALID/);
  assert.throws(() => summaryFromLedgers([{ active: true, severity: 'other', sourceUpdateTime: {} }]), /SEVERITY/);
  assert.throws(() => summaryFromLedgers(Array(101).fill({})), /BOUND/);
});
test('repair backs up first and refuses a concurrent projection change', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-incident-repair-'));
  const snapshot = seconds => ({ id: 'current', updateTime: { seconds, nanoseconds: 0 }, data: () => ({ revision: 1 }) });
  const ledgers = { docs: [], size: 0 };
  const summaryRef = { get: async () => snapshot(1) };
  const query = { get: async () => ledgers };
  let writes = 0;
  const db = { doc: () => summaryRef, collection: () => ({ limit: () => query }),
    runTransaction: work => work({ get: async ref => ref === summaryRef ? snapshot(2) : ledgers,
      set: () => { writes++; } }) };
  try {
    const backupPath = path.join(directory, 'before.json');
    await assert.rejects(repair({ db, backupPath, apply: true }), /SOURCE_CHANGED/);
    assert.equal(writes, 0);
    assert.equal(JSON.parse(fs.readFileSync(backupPath)).summary.revision, 1);
  } finally { fs.rmSync(directory, { recursive: true }); }
});
