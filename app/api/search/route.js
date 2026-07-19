import { NextResponse } from 'next/server';
import { queryMaterializedCatalog } from '../../../src/lib/server/materializedCatalog';
import { isProductPublicVisible } from '../../../src/lib/seo/indexability';
import { buildSearchResponse } from '../../../src/kit/marketplace/searchModel';

export const dynamic = 'force-dynamic';

const getCatalog = async () => {
  const result = await queryMaterializedCatalog({ scope: 'cards', limit: 120 });
  return {
    catalogVersion: result.snapshot.catalogVersion,
    products: result.products.filter(isProductPublicVisible),
  };
};

export async function GET(request) {
  const url = new URL(request.url);
  const query = String(url.searchParams.get('q') || '').trim().slice(0, 80);
  const mode = url.searchParams.get('mode') === 'suggest' ? 'suggest' : 'results';
  const limit = Number(url.searchParams.get('limit')) || (mode === 'suggest' ? 8 : 48);
  const catalog = await getCatalog();
  const payload = {
    ...buildSearchResponse(catalog.products, query, { mode, limit }),
    catalogVersion: catalog.catalogVersion,
  };

  return NextResponse.json(payload, {
    headers: {
      'cache-control': 'public, max-age=0, s-maxage=0, must-revalidate',
    },
  });
}
