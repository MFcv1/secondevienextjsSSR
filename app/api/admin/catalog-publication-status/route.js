import { NextResponse } from 'next/server';
import { getAdminAuth } from '../../../../src/lib/server/firebaseAdmin';
import { getMaterializedProductResult } from '../../../../src/lib/server/materializedCatalog';
import { publicEnv } from '../../../../src/lib/server/env';

export const dynamic = 'force-dynamic';

const responseHeaders = { 'cache-control': 'no-store, max-age=0' };

const jsonResponse = (payload, status = 200) => NextResponse.json(payload, {
  status,
  headers: responseHeaders,
});

const getBearerToken = (request) => {
  const match = (request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
};

const isAdminRequest = async (request) => {
  const token = getBearerToken(request);
  if (!token) return false;
  const auth = getAdminAuth();
  if (!auth) return false;
  try {
    const decoded = await auth.verifyIdToken(token);
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || '';
    return decoded.admin === true
      || decoded.superAdmin === true
      || Boolean(superAdminEmail && decoded.email === superAdminEmail);
  } catch {
    return false;
  }
};

export async function POST(request) {
  if (!await isAdminRequest(request)) return jsonResponse({ error: 'forbidden' }, 403);

  const body = await request.json().catch(() => ({}));
  const productId = typeof body.productId === 'string' ? body.productId.trim() : '';
  if (!productId || productId.length > 180) {
    return jsonResponse({ error: 'invalid_product_id' }, 400);
  }

  try {
    const { product, snapshot } = await getMaterializedProductResult(productId, {
      pointerCache: 'fresh'
    });
    if (!product) return jsonResponse({ error: 'product_not_found' }, 404);
    return jsonResponse({
      appId: publicEnv.appId,
      revision: snapshot.revision,
      catalogVersion: snapshot.catalogVersion,
      aggregateSha256: snapshot.aggregateSha256,
      generatedAt: snapshot.generatedAt,
      product,
    });
  } catch (error) {
    console.error('[api/admin/catalog-publication-status] snapshot unavailable', {
      code: error?.message || 'unknown'
    });
    return jsonResponse({ error: 'catalog_unavailable' }, 503);
  }
}
