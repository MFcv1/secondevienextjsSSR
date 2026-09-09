// Read-only audit: Monitoring + inventory. No invocation of application handlers.
// Access token remains in process memory and is never included in artifacts.
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { collectFunctionMetrics } from '../../../src/lib/server/functionMetricsCore.mjs';

const directory = new URL('./', import.meta.url);
const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const now = Date.now();
for (const period of ['24h', '7d', '30d']) {
  const result = await collectFunctionMetrics({ token, period, now });
  await writeFile(new URL(`metrics-${period}.json`, directory), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ period, start: result.start, end: result.end, functions: result.rows.length,
    calls: result.rows.reduce((sum, row) => sum + (row.calls || 0), 0),
    noSeries: result.rows.filter(row => row.calls === null).length,
    top: result.rows.slice(0, 12).map(({ name, calls, meanMs, p95Ms, errors, rejected }) => ({ name, calls, meanMs, p95Ms, errors, rejected })) }));
}
