import { authorizeAdminRequest } from '../../../../src/lib/server/adminAuthorization';
import { readProjectCosts } from '../../../../src/lib/server/projectCosts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (body, status = 200) => Response.json(body, { status, headers: {
  'cache-control': 'private, no-store, max-age=0', 'x-robots-tag': 'noindex',
} });
export async function GET(request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  try { return json(await readProjectCosts()); }
  catch { return json({ error: 'costs_unavailable' }, 503); }
}
