import { cookies } from 'next/headers';
import {
  analyticsErrorResponse, assertAnalyticsV3Enabled, assertSameOrigin, closeAnalyticsSession,
  readBoundedJson, tokenCookieName,
} from '../../../../../src/lib/server/analyticsV3';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    assertSameOrigin(request);
    assertAnalyticsV3Enabled();
    const payload = await readBoundedJson(request);
    const jar = await cookies();
    const token = jar.get(tokenCookieName(payload?.tabSessionId))?.value;
    const result = await closeAnalyticsSession(payload, token);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
