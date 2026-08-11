import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '../../../../src/lib/server/adminAuthorization';
import { getMaterializedProductResult } from '../../../../src/lib/server/materializedCatalog';
import { publicEnv } from '../../../../src/lib/server/env';
import { readBoundedJsonBody, RequestBodyError } from '../../../../src/lib/server/requestBody';

export const dynamic = 'force-dynamic';

const responseHeaders = { 'cache-control': 'no-store, max-age=0' };

const jsonResponse = (payload, status = 200) => NextResponse.json(payload, {
  status,
  headers: responseHeaders,
});

export async function POST(request) {
  const adminCheck = await authorizeAdminRequest(request);
  if (!adminCheck.ok) return jsonResponse({ error: adminCheck.error }, adminCheck.status);

  let body;
  try {
    ({ body } = await readBoundedJsonBody(request, { maxBytes: 4096 }));
  } catch (error) {
    if (error instanceof RequestBodyError) return jsonResponse({ error: error.code }, error.status);
    return jsonResponse({ error: 'invalid_request' }, 400);
  }
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
