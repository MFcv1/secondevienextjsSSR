import { createHash, timingSafeEqual } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Temporary operator probe: off unless its one-use digest is set at runtime.
// Never logs headers or returns credentials; disabled after deployment verification.
export function POST(request) {
  const expected = process.env.RUNTIME_INGRESS_PROBE_SHA256 || '';
  const actual = createHash('sha256').update(request.headers.get('x-runtime-probe') || '').digest('hex');
  if (expected.length !== 64 || !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    return new Response(null, { status: 404 });
  }
  return Response.json({ forwardedFor: request.headers.get('x-forwarded-for'),
    forwardedHost: request.headers.get('x-forwarded-host'), host: request.headers.get('host') },
  { headers: { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' } });
}
