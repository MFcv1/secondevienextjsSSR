import {
  analyticsErrorResponse, assertSameOrigin, readBoundedJson, requestAnalyticsWithdrawal,
} from '../../../../../src/lib/server/analyticsV3';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const result = await requestAnalyticsWithdrawal(await readBoundedJson(request));
    return Response.json({ ok: true, ...result }, { status: 202 });
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
