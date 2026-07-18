const crypto = require('crypto');
const admin = require('firebase-admin');
const { defineSecret } = require('firebase-functions/params');
const { onTaskDispatched } = require('firebase-functions/v2/tasks');
const { CONTROL_DOCUMENT, cleanError } = require('./publicationState');
const { catalogLog } = require('./structuredLog');
const { CATALOG_BUILDER_SERVICE_ACCOUNT, CATALOG_REVALIDATION_URL } = require('./catalogConfig');

const CATALOG_REVALIDATION_HMAC_SECRET = defineSecret('CATALOG_REVALIDATION_HMAC_SECRET');
const REVALIDATION_REGION = 'europe-west1';

function signRevalidationBody(secret, timestamp, body) {
    const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
    return crypto.createHmac('sha256', secret).update(`${timestamp}.${bodyHash}`).digest('hex');
}

async function revalidateCatalog(dependencies, input) {
    const {
        db,
        fetchImpl = fetch,
        endpoint = process.env.CATALOG_REVALIDATION_URL,
        secret,
        now = () => new Date(),
        logger = catalogLog
    } = dependencies;
    if (!endpoint || !/^https:\/\//.test(endpoint)) throw new Error('CATALOG_REVALIDATION_URL_REQUIRED');
    if (!secret) throw new Error('CATALOG_REVALIDATION_HMAC_SECRET_REQUIRED');
    const revision = Number(input.revision || 0);
    if (!revision) throw new Error('REVALIDATION_REVISION_REQUIRED');
    const body = JSON.stringify({
        schemaVersion: 1,
        revision,
        manifestSha256: String(input.manifestSha256 || ''),
        productIds: Array.isArray(input.productIds) ? input.productIds.slice(0, 120) : [],
        previousCategories: Array.isArray(input.previousCategories) ? input.previousCategories.slice(0, 10) : [],
        nextCategories: Array.isArray(input.nextCategories) ? input.nextCategories.slice(0, 10) : [],
        sitemapChanged: input.sitemapChanged !== false
    });
    const timestamp = String(Math.floor(now().getTime() / 1000));
    const signature = signRevalidationBody(secret, timestamp, body);
    const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-catalog-timestamp': timestamp,
            'x-catalog-signature': signature
        },
        body,
        signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`CATALOG_REVALIDATION_HTTP_${response.status}`);

    await db.runTransaction(async (transaction) => {
        const controlRef = db.doc(CONTROL_DOCUMENT);
        const snap = await transaction.get(controlRef);
        const state = snap.data() || {};
        transaction.set(controlRef, {
            revalidatedRevision: Math.max(Number(state.revalidatedRevision || 0), revision),
            lastRevalidatedAt: admin.firestore.FieldValue.serverTimestamp(),
            buildState: Number(state.publishedRevision || 0) <= revision ? 'healthy' : state.buildState,
            lastError: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    });
    logger('info', { phase: 'revalidate', targetRevision: revision, result: 'success' });
    return { result: 'revalidated', revision };
}

const dispatchCatalogRevalidation = onTaskDispatched(
    {
        region: REVALIDATION_REGION,
        serviceAccount: CATALOG_BUILDER_SERVICE_ACCOUNT,
        secrets: [CATALOG_REVALIDATION_HMAC_SECRET],
        retryConfig: { maxAttempts: 10, minBackoffSeconds: 5, maxBackoffSeconds: 300, maxDoublings: 5 },
        rateLimits: { maxConcurrentDispatches: 1, maxDispatchesPerSecond: 1 }
    },
    async (request) => {
        try {
            return await revalidateCatalog({
                db: admin.firestore(),
                secret: CATALOG_REVALIDATION_HMAC_SECRET.value(),
                endpoint: CATALOG_REVALIDATION_URL
            }, request.data || {});
        } catch (error) {
            await admin.firestore().doc(CONTROL_DOCUMENT).set({
                buildState: 'degraded',
                lastError: cleanError(error),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(() => null);
            throw error;
        }
    }
);

module.exports = {
    CATALOG_REVALIDATION_HMAC_SECRET,
    REVALIDATION_REGION,
    dispatchCatalogRevalidation,
    revalidateCatalog,
    signRevalidationBody
};
