import 'server-only';
import { applicationDefault } from 'firebase-admin/app';
import { getAdminDb } from './firebaseAdmin';
import { readCachedFunctionMetrics } from './functionMetricsCache.mjs';
import { METRICS_PROJECT } from './functionMetricsCore.mjs';
import { publicEnv } from './env';

export function readFunctionMetrics(period) {
  if (publicEnv.projectId !== METRICS_PROJECT) throw new Error('sandbox_required');
  return readCachedFunctionMetrics(period, {
    db: getAdminDb(),
    // Host identity: ADC locally, App Hosting service account in the sandbox.
    // Do not widen the existing Firebase certificate's permissions.
    getToken: async () => (await applicationDefault().getAccessToken()).access_token,
  });
}
