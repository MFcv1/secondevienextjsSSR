import { NextResponse } from 'next/server';
import { getMaterializedCatalogSnapshot } from '../../../../src/lib/server/materializedCatalog';
import { getCatalogVersionHttpState } from '../../../../src/lib/server/catalogVersionContract';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const snapshot = await getMaterializedCatalogSnapshot();
    const state = getCatalogVersionHttpState(snapshot, request.headers.get('if-none-match') || '');
    if (state.status === 304) return new NextResponse(null, { status: 304, headers: state.headers });
    return NextResponse.json(state.payload, { headers: state.headers });
  } catch (error) {
    console.error('[api/catalog/version] snapshot unavailable', { code: error?.message || 'unknown' });
    return NextResponse.json({ error: 'catalog_unavailable' }, {
      status: 503,
      headers: { 'cache-control': 'no-store, max-age=0' },
    });
  }
}
