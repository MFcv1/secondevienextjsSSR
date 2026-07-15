import { cookies } from 'next/headers';
import {
  analyticsErrorResponse, appendAnalyticsBatch, assertAnalyticsV3Enabled, assertSameOrigin,
  observeAnalyticsAppCheck, readBoundedJson, tokenCookieName,
} from '../../../../../src/lib/server/analyticsV3';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    assertSameOrigin(request);
    assertAnalyticsV3Enabled();
    const payload = await readBoundedJson(request);
    const jar = await cookies();
    const token = jar.get(tokenCookieName(payload?.tabSessionId))?.value;
    const appCheckObserved = await observeAnalyticsAppCheck(request);
    const result = await appendAnalyticsBatch(payload, token, { appCheckObserved });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
