const crypto = require('crypto');
const admin = require('firebase-admin');
const { defineSecret } = require('firebase-functions/params');
const { onTaskDispatched } = require('firebase-functions/v2/tasks');
const {
    CONTROL_DOCUMENT,
    catalogIdentityMatches,
    cleanError,
    computeRevalidationRetryNotBefore,
    nextStateVersion
} = require('./publicationState');
const { validateImpactPlan } = require('./impactPlan');
const { catalogLog } = require('./structuredLog');
const { CATALOG_BUILDER_SERVICE_ACCOUNT, CATALOG_REVALIDATION_URL } = require('./catalogConfig');
const { CATEGORY_ALIASES } = require('./catalogRoutes');

const CATALOG_REVALIDATION_HMAC_SECRET = defineSecret('CATALOG_REVALIDATION_HMAC_SECRET');
const REVALIDATION_REGION = 'europe-west1';

function signRevalidationBody(secret, timestamp, body) {
    const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
    return crypto.createHmac('sha256', secret).update(`${timestamp}.${bodyHash}`).digest('hex');
}

async function markCatalogRevalidationFailure(db, input, error, now = () => new Date()) {
    const revision = Number(input?.revision || 0);
    const manifestSha256 = String(input?.manifestSha256 || '');
    return db.runTransaction(async (transaction) => {
        const controlRef = db.doc(CONTROL_DOCUMENT);
        const snap = await transaction.get(controlRef);
        const state = snap.data() || {};
        if (!catalogIdentityMatches(state, revision, manifestSha256)) return false;
        const servedFailure = String(error?.code || error?.message || '').startsWith('CATALOG_SERVED');
        const failureCount = Math.max(0, Number(state.revalidationFailureCount || 0)) + 1;
        const failedAt = now();
        transaction.set(controlRef, {
            buildState: 'degraded',
            stateVersion: nextStateVersion(state),
            ...(servedFailure
                ? { servedState: 'failed' }
                : { invalidationState: 'failed' }),
            revalidationFailureCount: failureCount,
            revalidationRetryNotBefore: computeRevalidationRetryNotBefore(failureCount, failedAt),
            revalidationLastFailureAt: failedAt,
            lastError: cleanError(error),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
    });
}

const delay = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs));

async function readJsonResponse(response, errorCode) {
    const contentType = response.headers?.get?.('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error(`${errorCode}_NON_JSON`);
    try { return await response.json(); } catch { throw new Error(`${errorCode}_INVALID_JSON`); }
}

function classifyServedCatalogVersion(version, identity) {
    const actualRevision = Number(version?.revision);
    const expectedRevision = Number(identity?.revision);
    const actualAggregateSha256 = String(version?.aggregateSha256 || '');
    const expectedAggregateSha256 = String(identity?.aggregateSha256 || '');
    if (!Number.isInteger(actualRevision) || actualRevision < 1) {
        throw Object.assign(new Error('CATALOG_SERVED_VERSION_INVALID'), {
            code: 'CATALOG_SERVED_VERSION_INVALID'
        });
    }
    if (actualRevision > expectedRevision && identity?.newerRevisionSatisfies !== false) {
        return { result: 'superseded', actualRevision, actualAggregateSha256 };
    }
    if (actualRevision !== expectedRevision) {
        throw Object.assign(new Error('CATALOG_SERVED_VERSION_STALE'), {
            code: 'CATALOG_SERVED_VERSION_STALE',
            actualRevision,
            expectedRevision
        });
    }
    if (actualAggregateSha256 !== expectedAggregateSha256) {
        throw Object.assign(new Error('CATALOG_SERVED_VERSION_IDENTITY_MISMATCH'), {
            code: 'CATALOG_SERVED_VERSION_IDENTITY_MISMATCH',
            actualRevision,
            expectedRevision
        });
    }
    return { result: 'observed', actualRevision, actualAggregateSha256 };
}

async function verifyPublishedCatalogVersion(fetchImpl, endpoint, identity, delayImpl = delay) {
    const versionUrl = new URL('/api/catalog/version', new URL(endpoint).origin);
    const attempts = [0, 300, 900];
    let lastError = null;
    for (const waitMs of attempts) {
        if (waitMs) await delayImpl(waitMs);
        try {
            const response = await fetchImpl(versionUrl, {
                redirect: 'manual',
                headers: { accept: 'application/json' },
                signal: AbortSignal.timeout(8000)
            });
            if (!response.ok) throw new Error(`CATALOG_SERVED_VERSION_HTTP_${response.status}`);
            const version = await readJsonResponse(response, 'CATALOG_SERVED_VERSION');
            return classifyServedCatalogVersion(version, identity);
        } catch (error) {
            lastError = error;
        }
    }
    const stale = new Error(lastError?.message || 'CATALOG_SERVED_VERSION_FAILED');
    stale.code = String(stale.message).startsWith('CATALOG_SERVED') ? stale.message : 'CATALOG_SERVED_VERSION_FAILED';
    throw stale;
}

async function verifyServedCatalog(fetchImpl, endpoint, identity, impactPlan, delayImpl = delay) {
    const origin = new URL(endpoint).origin;
    const productImpact = (impactPlan.products || []).find((product) => (
        product?.afterPath || product?.beforePath
    ));
    const productRoutes = productImpact
        ? [
            productImpact.afterPath
                ? { path: productImpact.afterPath, expectedStatus: 200 }
                : null,
            productImpact.beforePath && productImpact.beforePath !== productImpact.afterPath
                ? { path: productImpact.beforePath, expectedStatus: 404 }
                : null
        ].filter(Boolean)
        : [];
    const categoryPaths = (impactPlan.paths || []).filter((path) => path.startsWith('/categorie/'));
    const categoryPath = categoryPaths.find((path) => {
        try {
            const categoryId = decodeURIComponent(path.slice('/categorie/'.length));
            return !CATEGORY_ALIASES[categoryId];
        } catch {
            return false;
        }
    }) || categoryPaths[0];
    const routeExpectations = [
        impactPlan.affectsGallery ? { path: '/', expectedStatus: 200 } : null,
        ...productRoutes,
        categoryPath ? { path: categoryPath, expectedStatus: 200 } : null,
    ].filter(Boolean).filter((entry, index, entries) => (
        entries.findIndex((candidate) => candidate.path === entry.path) === index
    ));
    const attempts = [0, 300, 900];
    let lastError = null;
    for (const waitMs of attempts) {
        if (waitMs) await delayImpl(waitMs);
        try {
            const versionResult = await verifyPublishedCatalogVersion(fetchImpl, endpoint, identity, async () => {});
            if (versionResult.result === 'superseded') return versionResult;
            for (const { path, expectedStatus } of routeExpectations) {
                const routeResponse = await fetchImpl(new URL(path, origin), {
                    redirect: 'manual',
                    headers: { accept: 'text/html' },
                    signal: AbortSignal.timeout(10000)
                });
                if (routeResponse.status !== expectedStatus) {
                    throw new Error(`CATALOG_SERVED_ROUTE_HTTP_${routeResponse.status}`);
                }
                if (expectedStatus === 404) continue;
                const html = await routeResponse.text();
                if (!html.includes(`data-catalog-version="${identity.aggregateSha256}"`)) {
                    throw new Error('CATALOG_SERVED_ROUTE_STALE');
                }
            }
            return versionResult;
        } catch (error) {
            lastError = error;
        }
    }
    const stale = new Error(lastError?.message || 'CATALOG_SERVED_VERIFICATION_FAILED');
    stale.code = String(stale.message).startsWith('CATALOG_SERVED') ? stale.message : 'CATALOG_SERVED_VERIFICATION_FAILED';
    throw stale;
}

async function revalidateCatalog(dependencies, input) {
    const {
        db,
        fetchImpl = fetch,
        endpoint = process.env.CATALOG_REVALIDATION_URL,
        secret,
        projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT,
        delayImpl = delay,
        now = () => new Date(),
        logger = catalogLog
    } = dependencies;
    if (!endpoint || !/^https:\/\//.test(endpoint)) throw new Error('CATALOG_REVALIDATION_URL_REQUIRED');
    if (!secret) throw new Error('CATALOG_REVALIDATION_HMAC_SECRET_REQUIRED');
    if (!projectId) throw new Error('CATALOG_REVALIDATION_PROJECT_ID_REQUIRED');
    const revision = Number(input.revision || 0);
    if (!revision) throw new Error('REVALIDATION_REVISION_REQUIRED');
    const manifestSha256 = String(input.manifestSha256 || '');
    if (!/^[a-f0-9]{64}$/i.test(manifestSha256)) throw new Error('REVALIDATION_MANIFEST_SHA256_REQUIRED');
    const aggregateSha256 = String(input.aggregateSha256 || '');
    if (!/^[a-f0-9]{64}$/i.test(aggregateSha256)) throw new Error('REVALIDATION_AGGREGATE_SHA256_REQUIRED');
    const impactPlan = validateImpactPlan(input.impactPlan, { revision, aggregateSha256 });
    const newerRevisionSatisfies = impactPlan.fullReason !== 'rollback';
    const planHash = String(input.planHash || impactPlan.planHash || '');
    if (planHash !== impactPlan.planHash) throw new Error('REVALIDATION_PLAN_HASH_MISMATCH');
    const impactPlanSha256 = input.impactPlanSha256 ? String(input.impactPlanSha256) : null;
    if (impactPlanSha256 && !/^[a-f0-9]{64}$/i.test(impactPlanSha256)) throw new Error('REVALIDATION_IMPACT_SHA256_INVALID');
    const currentIdentity = await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(db.doc(CONTROL_DOCUMENT));
        const state = snap.data() || {};
        return catalogIdentityMatches(state, revision, manifestSha256);
    });
    if (!currentIdentity) {
        logger('info', { phase: 'revalidate', targetRevision: revision, result: 'superseded_before_dispatch' });
        return { result: 'superseded', revision, aggregateSha256, planHash };
    }
    const body = JSON.stringify({
        schemaVersion: 1,
        projectId,
        audience: new URL(endpoint).origin,
        revision,
        manifestSha256,
        aggregateSha256,
        impactPlanPath: input.impactPlanPath || null,
        impactPlanSha256,
        planHash,
        mode: impactPlan.mode,
        impactPlan
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
        redirect: 'manual',
        signal: AbortSignal.timeout(15000)
    });
    if (response.status >= 300 && response.status < 400) throw new Error('CATALOG_REVALIDATION_REDIRECT_REFUSED');
    if (!response.ok) throw new Error(`CATALOG_REVALIDATION_HTTP_${response.status}`);
    const accepted = await readJsonResponse(response, 'CATALOG_REVALIDATION_RESPONSE');
    if (accepted.ok !== true
        || accepted.projectId !== projectId
        || Number(accepted.acceptedRevision) !== revision
        || accepted.manifestSha256 !== manifestSha256
        || accepted.aggregateSha256 !== aggregateSha256
        || accepted.planHash !== planHash
        || accepted.mode !== impactPlan.mode) {
        throw new Error('CATALOG_REVALIDATION_RESPONSE_IDENTITY_MISMATCH');
    }

    const invalidationAcceptedForCurrentIdentity = await db.runTransaction(async (transaction) => {
        const controlRef = db.doc(CONTROL_DOCUMENT);
        const snap = await transaction.get(controlRef);
        const state = snap.data() || {};
        if (!catalogIdentityMatches(state, revision, manifestSha256)) return false;
        transaction.set(controlRef, {
            stateVersion: nextStateVersion(state),
            invalidationState: 'accepted',
            servedState: 'pending',
            buildState: 'verifying_served_version',
            lastError: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
    });
    if (!invalidationAcceptedForCurrentIdentity) {
        logger('info', { phase: 'revalidate', targetRevision: revision, result: 'superseded_after_dispatch' });
        return { result: 'superseded', revision, aggregateSha256, planHash };
    }

    const publishedVersion = await verifyPublishedCatalogVersion(
        fetchImpl,
        endpoint,
        { revision, manifestSha256, aggregateSha256, newerRevisionSatisfies },
        delayImpl
    );
    if (publishedVersion.result === 'superseded') {
        logger('info', {
            phase: 'revalidate', targetRevision: revision,
            observedRevision: publishedVersion.actualRevision, result: 'superseded_after_dispatch'
        });
        return { result: 'superseded', revision, aggregateSha256, planHash };
    }

    const currentIdentityAccepted = await db.runTransaction(async (transaction) => {
        const controlRef = db.doc(CONTROL_DOCUMENT);
        const signalRef = db.doc('sys_catalog_live/current');
        const snap = await transaction.get(controlRef);
        const state = snap.data() || {};
        if (!catalogIdentityMatches(state, revision, manifestSha256)) return false;
        const signalSnap = await transaction.get(signalRef);
        const currentSignal = signalSnap.exists ? signalSnap.data() : {};
        transaction.set(controlRef, {
            stateVersion: nextStateVersion(state),
            buildState: 'verifying_served_html',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        if (String(currentSignal.aggregateSha256 || '') !== aggregateSha256) {
            transaction.set(signalRef, {
                schemaVersion: 1,
                revision,
                aggregateSha256,
                changedProductIds: (impactPlan.changedProductIds || []).slice(0, 120),
                affectedCategoryIds: (impactPlan.affectedCategoryIds || []).slice(0, 30),
                affectsGallery: Boolean(impactPlan.affectsGallery),
                affectsSearch: Boolean(impactPlan.affectsSearch),
                full: impactPlan.mode === 'full',
                publishedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        return true;
    });
    if (!currentIdentityAccepted) {
        logger('info', { phase: 'revalidate', targetRevision: revision, result: 'superseded_before_signal' });
        return { result: 'superseded', revision, aggregateSha256, planHash };
    }

    const servedVersion = await verifyServedCatalog(
        fetchImpl,
        endpoint,
        { revision, manifestSha256, aggregateSha256, newerRevisionSatisfies },
        impactPlan,
        delayImpl
    );
    if (servedVersion.result === 'superseded') {
        logger('info', {
            phase: 'revalidate', targetRevision: revision,
            observedRevision: servedVersion.actualRevision, result: 'superseded_before_html_proof'
        });
        return { result: 'superseded', revision, aggregateSha256, planHash };
    }

    const currentIdentityRevalidated = await db.runTransaction(async (transaction) => {
        const controlRef = db.doc(CONTROL_DOCUMENT);
        const snap = await transaction.get(controlRef);
        const state = snap.data() || {};
        if (!catalogIdentityMatches(state, revision, manifestSha256)) return false;
        transaction.set(controlRef, {
            stateVersion: nextStateVersion(state),
            revalidatedRevision: revision,
            revalidatedManifestSha256: manifestSha256,
            integrityState: 'valid',
            sourceLagState: Number(state.desiredRevision || 0) > revision ? 'behind' : 'current',
            invalidationState: 'accepted',
            servedState: 'observed',
            servedRevision: revision,
            servedAggregateSha256: aggregateSha256,
            revalidationFailureCount: 0,
            revalidationRetryNotBefore: null,
            revalidationLastFailureAt: null,
            pendingRevalidationPlan: null,
            pendingRevalidationPlanHash: null,
            pendingRevalidationRevision: null,
            pendingRevalidationManifestSha256: null,
            lastVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            buildState: 'published',
            lastError: null,
            lastRevalidatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
    });
    const result = currentIdentityRevalidated ? 'revalidated' : 'superseded';
    logger('info', { phase: 'revalidate', targetRevision: revision, result });
    return { result, revision, aggregateSha256, planHash };
}

const dispatchCatalogRevalidation = onTaskDispatched(
    {
        region: REVALIDATION_REGION,
        serviceAccount: CATALOG_BUILDER_SERVICE_ACCOUNT,
        secrets: [CATALOG_REVALIDATION_HMAC_SECRET],
        cpu: 1,
        concurrency: 1,
        minInstances: 0,
        maxInstances: 1,
        memory: '256MiB',
        timeoutSeconds: 300,
        retryConfig: { maxAttempts: 1, minBackoffSeconds: 5, maxBackoffSeconds: 300, maxDoublings: 5 },
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
            await markCatalogRevalidationFailure(admin.firestore(), request.data || {}, error).catch(() => null);
            throw error;
        }
    }
);

module.exports = {
    CATALOG_REVALIDATION_HMAC_SECRET,
    REVALIDATION_REGION,
    dispatchCatalogRevalidation,
    classifyServedCatalogVersion,
    markCatalogRevalidationFailure,
    revalidateCatalog,
    signRevalidationBody,
    verifyPublishedCatalogVersion,
    verifyServedCatalog
};
