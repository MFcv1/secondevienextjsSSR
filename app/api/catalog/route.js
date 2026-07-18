import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  getMaterializedProductResult,
  queryMaterializedCatalog,
} from '../../../src/lib/server/materializedCatalog';
import { publicEnv } from '../../../src/lib/server/env';

export const dynamic = 'force-dynamic';

const CACHE_CONTROL = 'public, max-age=60, s-maxage=120, stale-while-revalidate=300';
const ERROR_CACHE_CONTROL = 'no-store, max-age=0';

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
  if (status !== 200) {
    return new NextResponse(body, {
      status,
      headers: { 'cache-control': ERROR_CACHE_CONTROL, 'content-type': 'application/json' },
    });
  }
  const etag = `"${crypto.createHash('sha256').update(body).digest('base64url')}"`;
  const headers = { 'cache-control': CACHE_CONTROL, etag };
  if (request.headers.get('if-none-match') === etag) return new NextResponse(null, { status: 304, headers });
  return new NextResponse(body, { status, headers: { ...headers, 'content-type': 'application/json' } });
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const parsedLimit = parseLimit(searchParams);
  if (!parsedLimit.valid) return jsonResponse(request, { error: 'invalid_limit' }, 400);
  const cursor = String(searchParams.get('cursor') || '').trim();
  if (cursor && !parsedLimit.value) return jsonResponse(request, { error: 'invalid_cursor' }, 400);

  try {
    const id = String(searchParams.get('id') || '').trim();
    if (id) {
      const { product, snapshot } = await getMaterializedProductResult(id);
      if (!product) return jsonResponse(request, { error: 'product_not_found' }, 404);
      return jsonResponse(request, {
        appId: publicEnv.appId,
        catalogVersion: snapshot.catalogVersion,
        generatedAt: snapshot.generatedAt,
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
      'access-control-allow-headers': 'Content-Type',
      'cache-control': ERROR_CACHE_CONTROL,
    },
  });
}
