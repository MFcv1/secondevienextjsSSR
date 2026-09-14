import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '../../../../src/lib/server/adminAuthorization';
import { getAdminDb } from '../../../../src/lib/server/firebaseAdmin';
import { publicEnv } from '../../../../src/lib/server/env';
import { readBoundedJsonBody, RequestBodyError } from '../../../../src/lib/server/requestBody';
import eligibility from '../../../../functions/src/commerce/domain/sandboxInventoryEligibility';

export const dynamic = 'force-dynamic';
const json = (body, status = 200) => NextResponse.json(body, {
    status, headers: { 'cache-control': 'no-store, max-age=0' },
});

export async function POST(request) {
    const admin = await authorizeAdminRequest(request);
    if (!admin.ok) return json({ error: admin.error }, admin.status);
    let body;
    try {
        ({ body } = await readBoundedJsonBody(request, { maxBytes: 8192 }));
    } catch (error) {
        return json({ error: 'invalid_request' }, error instanceof RequestBodyError ? error.status : 400);
    }
    const products = body?.products;
    if (!Array.isArray(products) || products.length < 1 || products.length > 10
        || products.some(p => !p || typeof p.productId !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/.test(p.productId)
            || !Number.isSafeInteger(p.expectedVersion) || p.expectedVersion < 0
            || !Number.isSafeInteger(p.expectedInventoryVersion) || p.expectedInventoryVersion < 0)
        || body.collectionName !== 'furniture') return json({ error: 'invalid_request' }, 400);
    const results = [];
    // At most ten products per request, sequential bounded queries.
    for (const { productId, expectedVersion, expectedInventoryVersion } of products) {
        const product = { productId, expectedVersion, expectedInventoryVersion };
        try {
            const result = await eligibility.inspectSandboxRestock({
                db: getAdminDb(), appId: publicEnv.appId, projectId: publicEnv.projectId,
                actor: { uid: admin.decoded.uid, role: 'admin', aal2: true },
                collectionName: body.collectionName, ...product,
            });
            results.push({ ...product, ...result });
        } catch (error) {
            const reason = String(error?.code || '');
            results.push({ ...product, eligible: false,
                reason: reason.startsWith('COMMERCE_SANDBOX_RESTOCK_') ? reason : 'CHECK_UNAVAILABLE' });
        }
    }
    return json({ results });
}
