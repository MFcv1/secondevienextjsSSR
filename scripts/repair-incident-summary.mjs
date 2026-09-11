// Bounded operator repair: restore the counter from its acknowledged ledgers.
// Business incidents remain untouched; pending journal events apply afterwards.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { applyIncidentSummaryDelta } = require('../functions/src/observability/incidentProjection.js');

export function summaryFromLedgers(ledgers) {
  if (ledgers.length > 100) throw Error('INCIDENT_REPAIR_BOUND');
  const counts = { activeCritical: 0, activeWarnings: 0, activeTotal: 0 };
  for (const ledger of ledgers) {
    if (typeof ledger.active !== 'boolean' || !ledger.sourceUpdateTime) throw Error('INCIDENT_LEDGER_INVALID');
    if (!ledger.active) continue;
    if (!['critical', 'warning'].includes(ledger.severity)) throw Error('INCIDENT_LEDGER_SEVERITY');
    counts.activeTotal++;
    counts[ledger.severity === 'critical' ? 'activeCritical' : 'activeWarnings']++;
  }
  return applyIncidentSummaryDelta(counts, {});
}

export async function repair({ db, backupPath, apply = false }) {
  const summaryRef = db.doc('admin_incident_summary/current');
  const query = db.collection('admin_incident_projections').limit(101);
  const [summary, ledgers] = await Promise.all([summaryRef.get(), query.get()]);
  const expected = summaryFromLedgers(ledgers.docs.map(d => d.data()));
  const fingerprint = snapshots => crypto.createHash('sha256').update(JSON.stringify(
    snapshots.map(d => [d.id, d.updateTime?.seconds, d.updateTime?.nanoseconds]).sort()
  )).digest('hex');
  const version = fingerprint([summary, ...ledgers.docs]);
  if (!apply) return { expected, ledgerCount: ledgers.size, version };
  fs.writeFileSync(backupPath, JSON.stringify({ summary: summary.data(),
    ledgers: ledgers.docs.map(d => ({ id: d.id, data: d.data() })), version }, null, 2),
  { mode: 0o600, flag: 'wx' });
  return db.runTransaction(async tx => {
    const currentSummary = await tx.get(summaryRef);
    const currentLedgers = await tx.get(query);
    if (fingerprint([currentSummary, ...currentLedgers.docs]) !== version) throw Error('INCIDENT_REPAIR_SOURCE_CHANGED');
    const counts = summaryFromLedgers(currentLedgers.docs.map(d => d.data()));
    tx.set(summaryRef, { ...currentSummary.data(), schemaVersion: 1, ...counts,
      revision: Number(currentSummary.data()?.revision || 0) + 1,
      ledgerRepair: { at: new Date().toISOString(), version, ledgerCount: currentLedgers.size,
        reason: 'restore_acknowledged_ledger_counts_before_pending_events' } });
    return { repaired: true, ...counts, ledgerCount: currentLedgers.size };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [mode, project, backupPath] = process.argv.slice(2);
  if (!['plan', 'apply'].includes(mode) || project !== 'secondevienextjsssr') throw Error('INCIDENT_REPAIR_TARGET');
  const admin = require('firebase-admin');
  admin.initializeApp({ projectId: project, credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
  try { console.log(JSON.stringify(await repair({ db: admin.firestore(), backupPath, apply: mode === 'apply' }))); }
  finally { await admin.app().delete(); }
}
