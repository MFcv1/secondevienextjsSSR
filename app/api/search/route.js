import { NextResponse } from 'next/server';
import {
  getPublicCatalog,
} from '../../../src/lib/server/products';
import { buildSearchResponse } from '../../../src/kit/marketplace/searchModel';

export const dynamic = 'force-dynamic';

const getCatalog = async () => {
  const products = await getPublicCatalog('scope=cards&limit=120');
  return products;
};

export async function GET(request) {
  const url = new URL(request.url);
  const query = String(url.searchParams.get('q') || '').trim().slice(0, 80);
  const mode = url.searchParams.get('mode') === 'suggest' ? 'suggest' : 'results';
  const limit = Number(url.searchParams.get('limit')) || (mode === 'suggest' ? 8 : 48);
  const products = await getCatalog();
  const payload = buildSearchResponse(products, query, { mode, limit });

  return NextResponse.json(payload, {
    headers: {
      'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=300',
    },
  });
}
