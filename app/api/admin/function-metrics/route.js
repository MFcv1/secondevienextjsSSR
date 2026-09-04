import { authorizeAdminRequest } from '../../../../src/lib/server/adminAuthorization';
import { readFunctionMetrics } from '../../../../src/lib/server/functionMetrics';
import { PERIODS } from '../../../../src/lib/server/functionMetricsCore.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store, max-age=0' } });

export async function GET(request) {
  const authorization = await authorizeAdminRequest(request);
  if (!authorization.ok) return json({ error: authorization.error }, authorization.status);
  const period = new URL(request.url).searchParams.get('period') || '24h';
  if (!Object.hasOwn(PERIODS, period)) return json({ error: 'invalid_period' }, 400);
  try { return json(await readFunctionMetrics(period)); }
  catch (error) {
    const code = ['refresh_in_progress', 'google_403', 'google_429', 'metrics_truncated', 'inventory_incomplete'].includes(error.message) ? error.message : 'metrics_unavailable';
    console.warn('[function-metrics]', code);
    return json({ error: code }, code === 'refresh_in_progress' ? 409 : 503);
  }
}
