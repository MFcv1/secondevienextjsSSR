import { randomUUID } from 'node:crypto';
import { collectFunctionMetrics, PERIODS } from './functionMetricsCore.mjs';

// Three overwritten documents, no per-invocation writes, no scheduled collection.
const TTL = 15 * 60 * 1000;
export async function readCachedFunctionMetrics(period, { db, getToken, collect = collectFunctionMetrics, now = Date.now() }) {
  if (!Object.hasOwn(PERIODS, period)) throw new Error('invalid_period');
  const ref = db.collection('sys_function_metrics_cache').doc(period);
  const owner = randomUUID();
  const cached = await db.runTransaction(async tx => {
    const data = (await tx.get(ref)).data() || {};
    if (data.snapshot?.schemaVersion === 1 && now - Date.parse(data.snapshot.fetchedAt) < TTL) return { ...data.snapshot, cached: true };
    if (data.leaseUntil > now) {
      if (data.snapshot) return { ...data.snapshot, cached: true, stale: true };
      throw new Error('refresh_in_progress');
    }
    tx.set(ref, { leaseUntil: now + 240000, owner }, { merge: true });
    return null;
  });
  if (cached) return cached;
  try {
    const token = await getToken();
    const snapshot = await collect({ token, period, now });
    await db.runTransaction(async tx => {
      if ((await tx.get(ref)).data()?.owner === owner) tx.set(ref, { snapshot, leaseUntil: 0, owner: '' });
    });
    return { ...snapshot, cached: false };
  } catch (error) {
    await db.runTransaction(async tx => {
      if ((await tx.get(ref)).data()?.owner === owner) tx.set(ref, { leaseUntil: 0, owner: '' }, { merge: true });
    });
    throw error;
  }
}
