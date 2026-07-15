import { NextResponse } from 'next/server';
import {
  analyticsErrorResponse, assertAnalyticsV3Enabled, assertSameOrigin, createAnalyticsSession,
  observeAnalyticsAppCheck, readBoundedJson, tokenCookieName,
} from '../../../../../src/lib/server/analyticsV3';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    assertSameOrigin(request);
    assertAnalyticsV3Enabled();
    const payload = await readBoundedJson(request);
    const appCheckObserved = await observeAnalyticsAppCheck(request);
    const result = await createAnalyticsSession(payload, { appCheckObserved });
    const response = NextResponse.json({ ok: true, sessionId: result.sessionId, measurementMode: result.measurementMode, consentVersion: result.consentVersion });
    response.cookies.set(tokenCookieName(result.tabSessionId), result.token, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api/analytics/v3', maxAge: 86400,
    });
    return response;
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
