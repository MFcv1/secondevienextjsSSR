import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  getMaterializedProduct,
  queryMaterializedCatalog,
} from '../../../src/lib/server/materializedCatalog';
import { publicCatalogUrl, publicEnv } from '../../../src/lib/server/env';

export const dynamic = 'force-dynamic';

const CACHE_CONTROL = 'public, max-age=60, s-maxage=120, stale-while-revalidate=300';

const parseLimit = (searchParams) => {
  if (!searchParams.has('limit')) return { value: null, valid: true };
  const value = Number(searchParams.get('limit'));
  return Number.isInteger(value) && value > 0
    ? { value: Math.min(value, 120), valid: true }
    : { value: null, valid: false };
};

const parseCategories = (searchParams) => [...new Set([
  ...searchParams.getAll('category'),
  ...searchParams.getAll('categories'),
].flatMap((value) => String(value || '').split(',')).map((value) => value.trim()).filter(Boolean))].slice(0, 10);

const jsonResponse = (request, payload, status = 200) => {
  const body = JSON.stringify(payload);
  const etag = `"${crypto.createHash('sha256').update(body).digest('base64url')}"`;
  const headers = { 'cache-control': CACHE_CONTROL, etag };
  if (request.headers.get('if-none-match') === etag) return new NextResponse(null, { status: 304, headers });
  return new NextResponse(body, { status, headers: { ...headers, 'content-type': 'application/json' } });
};

const proxyLegacyCatalog = async (request) => {
  const requestUrl = new URL(request.url);
  const target = publicCatalogUrl(requestUrl.searchParams.toString());
  const response = await fetch(target, {
    headers: {
      accept: 'application/json',
      'x-catalog-proxy-hop': 'app-hosting',
      ...(request.headers.get('if-none-match') ? { 'if-none-match': request.headers.get('if-none-match') } : {}),
    },
    cache: 'no-store',
  });
  const body = response.status === 304 ? null : await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      'cache-control': response.headers.get('cache-control') || CACHE_CONTROL,
      ...(response.headers.get('etag') ? { etag: response.headers.get('etag') } : {}),
      ...(response.status === 304 ? {} : { 'content-type': 'application/json' }),
    },
  });
};

export async function GET(request) {
  const canaryRequested = publicEnv.catalogCanaryEnabled
    && request.headers.get('x-catalog-canary') === 'snapshot';
  if (!['snapshot', 'snapshot_canary'].includes(publicEnv.publicCatalogSource) && !canaryRequested) {
    return proxyLegacyCatalog(request);
  }
  const { searchParams } = new URL(request.url);
  const parsedLimit = parseLimit(searchParams);
  if (!parsedLimit.valid) return jsonResponse(request, { error: 'invalid_limit' }, 400);
  const cursor = String(searchParams.get('cursor') || '').trim();
  if (cursor && !parsedLimit.value) return jsonResponse(request, { error: 'invalid_cursor' }, 400);

  try {
    const id = String(searchParams.get('id') || '').trim();
    if (id) {
      const product = await getMaterializedProduct(id);
      if (!product) return jsonResponse(request, { error: 'product_not_found' }, 404);
      const snapshot = await queryMaterializedCatalog({ limit: 1 });
      return jsonResponse(request, {
        appId: publicEnv.appId,
        catalogVersion: snapshot.snapshot.catalogVersion,
        generatedAt: snapshot.snapshot.generatedAt,
        product,
      });
    }
    const scope = searchParams.get('scope') === 'cards' ? 'cards' : 'full';
    const categories = parseCategories(searchParams);
    const result = await queryMaterializedCatalog({ scope, limit: parsedLimit.value, categories, cursor });
    const segmented = Boolean(parsedLimit.value || categories.length || cursor || scope === 'cards');
    const payload = segmented ? {
      appId: publicEnv.appId,
      catalogVersion: result.snapshot.catalogVersion,
      generatedAt: result.snapshot.generatedAt,
      partial: Boolean(parsedLimit.value || categories.length || cursor),
      limit: parsedLimit.value,
      scope,
      categories,
      cursor: cursor || null,
      nextCursor: result.nextCursor,
      cursors: { furniture: result.nextCursor },
      collections: { furniture: result.products },
    } : {
      appId: publicEnv.appId,
      catalogVersion: result.snapshot.catalogVersion,
      generatedAt: result.snapshot.generatedAt,
      collections: { furniture: result.products },
    };
    return jsonResponse(request, payload);
  } catch (error) {
    if (error?.message === 'INVALID_CATALOG_CURSOR') return jsonResponse(request, { error: 'invalid_cursor' }, 400);
    console.error('[api/catalog] snapshot unavailable', { code: error?.message || 'unknown' });
    return jsonResponse(request, { error: 'catalog_unavailable' }, 503);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-catalog-canary',
      'cache-control': CACHE_CONTROL,
    },
  });
}
