const crypto = require('crypto');

const CONTROL_SCHEMA_VERSION = 2;
const CONTROL_DOCUMENT = 'sys_catalog_publication/secondevie';
const REVALIDATION_RETRY_DELAYS_MS = Object.freeze([
    5 * 60 * 1000,
    15 * 60 * 1000,
    60 * 60 * 1000,
    6 * 60 * 60 * 1000,
    24 * 60 * 60 * 1000
]);

function normalizePublicationMode(value) {
    return value === 'paused' ? 'paused' : 'active';
}

function initialPublicationState(now = new Date()) {
    return {
        schemaVersion: CONTROL_SCHEMA_VERSION,
        stateVersion: 1,
        projectionContractVersion: 1,
        mode: 'active',
        dirty: false,
        desiredRevision: 0,
        publishedRevision: 0,
        revalidatedRevision: 0,
        revalidatedManifestSha256: null,
        dirtySince: null,
        quietUntil: null,
        queuedTaskName: null,
        queuedFor: null,
        leaseToken: null,
        leaseOwner: null,
        leaseTargetRevision: null,
        leaseAcquiredAt: null,
        leaseExpiresAt: null,
        buildState: 'idle',
        preparedRevision: null,
        currentManifestPath: null,
        currentManifestSha256: null,
        currentAggregateSha256: null,
        currentImpactPlanPath: null,
        currentImpactPlanSha256: null,
        pendingRevalidationPlan: null,
        pendingRevalidationPlanHash: null,
        pendingRevalidationRevision: null,
        pendingRevalidationManifestSha256: null,
        currentPointerGeneration: null,
        previousRevision: null,
        previousManifestPath: null,
        previousManifestSha256: null,
        lastKnownGoodRevision: null,
        lastKnownGoodManifestPath: null,
        lastKnownGoodManifestSha256: null,
        lastMutationAt: null,
        lastBuildStartedAt: null,
        lastBuildCompletedAt: null,
        lastPublishedAt: null,
        lastRevalidatedAt: null,
        integrityState: 'unknown',
        sourceLagState: 'unknown',
        invalidationState: 'pending',
        servedState: 'pending',
        servedRevision: null,
        servedAggregateSha256: null,
        lastVerifiedAt: null,
        revalidationFailureCount: 0,
        revalidationRetryNotBefore: null,
        revalidationLastFailureAt: null,
        consecutiveFailures: 0,
        lastError: null,
        updatedAt: now
    };
}

function toMillis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (value instanceof Date) return value.getTime();
    if (Number.isFinite(value.seconds)) return (value.seconds * 1000) + Math.floor((value.nanoseconds || 0) / 1e6);
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function isLeaseActive(state, nowMs = Date.now()) {
    return Boolean(state?.leaseToken && toMillis(state.leaseExpiresAt) > nowMs);
}

function nextStateVersion(state) {
    return Math.max(0, Number(state?.stateVersion || 0)) + 1;
}

function catalogRevalidationTaskId(identity, attempt = 0) {
    const revision = Number(identity?.revision || 0);
    const manifestSha256 = String(identity?.manifestSha256 || '');
    const normalizedAttempt = Math.max(0, Number(attempt || 0));
    if (!Number.isInteger(revision) || revision < 1) throw new Error('REVALIDATION_TASK_REVISION_REQUIRED');
    if (!/^[a-f0-9]{64}$/i.test(manifestSha256)) throw new Error('REVALIDATION_TASK_MANIFEST_SHA256_REQUIRED');
    if (!Number.isInteger(normalizedAttempt)) throw new Error('REVALIDATION_TASK_ATTEMPT_INVALID');
    return `catalog-revalidate-r${revision}-${manifestSha256.slice(0, 12)}-a${normalizedAttempt}`;
}

function computeRevalidationRetryNotBefore(failureCount, now = new Date()) {
    const normalizedFailureCount = Math.max(1, Number(failureCount || 1));
    const delayIndex = Math.min(normalizedFailureCount - 1, REVALIDATION_RETRY_DELAYS_MS.length - 1);
    return new Date(now.getTime() + REVALIDATION_RETRY_DELAYS_MS[delayIndex]);
}

function isRollbackActive(state, nowMs = Date.now()) {
    if (!state?.rollbackOperationId || !state?.rollbackState) return false;
    return toMillis(state.rollbackExpiresAt) > nowMs;
}

function computeQuietUntil({ dirtySince, nowMs, publicFields = [] }) {
    const stockOnly = publicFields.length > 0
        && publicFields.every((field) => ['stock', 'sold', 'currentPrice', 'startingPrice', 'price'].includes(field));
    const silenceMs = stockOnly ? 500 : 750;
    const maxBatchAgeMs = 5000;
    const dirtySinceMs = dirtySince ? toMillis(dirtySince) : nowMs;
    return new Date(Math.min(nowMs + silenceMs, dirtySinceMs + maxBatchAgeMs));
}

function acquireLease(state, { owner, targetRevision, now = new Date(), durationMs = 120000, token } = {}) {
    if (normalizePublicationMode(state.mode) === 'paused') return null;
    if (isRollbackActive(state, now.getTime())) return null;
    if (isLeaseActive(state, now.getTime())) return null;
    if (targetRevision > Number(state.desiredRevision || 0)) throw new Error('TARGET_REVISION_AHEAD');
    const leaseToken = token || crypto.randomUUID();
    return {
        leaseToken,
        leaseOwner: owner || 'catalog-worker',
        leaseTargetRevision: targetRevision,
        leaseAcquiredAt: now,
        leaseExpiresAt: new Date(now.getTime() + durationMs),
        stateVersion: nextStateVersion(state),
        buildState: 'building',
        lastBuildStartedAt: now,
        updatedAt: now
    };
}

function assertLease(state, token, targetRevision, nowMs = Date.now()) {
    if (normalizePublicationMode(state?.mode) === 'paused') throw new Error('BUILD_PAUSED');
    if (!token || state?.leaseToken !== token) throw new Error('LEASE_LOST');
    if (!isLeaseActive(state, nowMs)) throw new Error('LEASE_EXPIRED');
    if (Number(state.leaseTargetRevision) !== Number(targetRevision)) throw new Error('LEASE_REVISION_MISMATCH');
    if (Number(state.desiredRevision) !== Number(targetRevision)) throw new Error('BUILD_OBSOLETE');
    return true;
}

function clearLease(now = new Date()) {
    return {
        leaseToken: null,
        leaseOwner: null,
        leaseTargetRevision: null,
        leaseAcquiredAt: null,
        leaseExpiresAt: null,
        updatedAt: now
    };
}

function buildRollbackPreparationUpdate(state, { token, owner = 'catalog-maintenance', targetName, target, updatedAt = new Date(), durationMs = 120000 }) {
    const desiredRevision = Math.max(
        Number(state?.desiredRevision || 0),
        Number(state?.publishedRevision || 0),
        Number(target?.revision || 0)
    );
    return {
        mode: 'paused',
        stateVersion: nextStateVersion(state),
        desiredRevision,
        rollbackState: 'preparing',
        rollbackOperationId: token,
        rollbackOwner: owner,
        rollbackStartedAt: updatedAt,
        rollbackHeartbeatAt: updatedAt,
        rollbackExpiresAt: updatedAt instanceof Date ? new Date(updatedAt.getTime() + durationMs) : updatedAt,
        rollbackToken: token,
        rollbackTarget: targetName,
        rollbackTargetRevision: Number(target.revision),
        rollbackTargetManifestSha256: target.manifestSha256,
        rollbackSourceRevision: Number(state?.publishedRevision || 0) || null,
        rollbackSourceManifestPath: state?.currentManifestPath || null,
        rollbackSourceManifestSha256: state?.currentManifestSha256 || null,
        rollbackPreviousMode: normalizePublicationMode(state?.mode),
        rollbackPreviousDirty: Boolean(state?.dirty),
        rollbackPreviousBuildState: state?.buildState || 'healthy',
        buildState: 'rollback_preparing',
        lastError: null,
        updatedAt
    };
}

function buildRollbackControlUpdate(state, { current, target, currentPointerGeneration, revalidationPlan, updatedAt = new Date() }) {
    const desiredRevision = Math.max(
        Number(state?.desiredRevision || 0),
        Number(state?.publishedRevision || 0),
        Number(current?.revision || 0),
        Number(target?.revision || 0)
    );
    return {
        ...clearLease(updatedAt),
        stateVersion: nextStateVersion(state),
        mode: 'paused',
        dirty: Boolean(state?.dirty),
        desiredRevision,
        publishedRevision: Number(target.revision),
        revalidatedRevision: null,
        revalidatedManifestSha256: null,
        integrityState: 'valid',
        sourceLagState: 'behind',
        invalidationState: 'pending',
        servedState: 'pending',
        servedRevision: null,
        servedAggregateSha256: null,
        revalidationFailureCount: 0,
        revalidationRetryNotBefore: null,
        revalidationLastFailureAt: null,
        currentManifestPath: target.manifestPath,
        currentManifestSha256: target.manifestSha256,
        currentAggregateSha256: target.aggregateSha256 || null,
        currentImpactPlanPath: target.impactPlanPath || null,
        currentImpactPlanSha256: target.impactPlanSha256 || null,
        pendingRevalidationPlan: revalidationPlan || null,
        pendingRevalidationPlanHash: revalidationPlan?.planHash || null,
        pendingRevalidationRevision: revalidationPlan ? Number(target.revision) : null,
        pendingRevalidationManifestSha256: revalidationPlan ? target.manifestSha256 : null,
        currentPointerGeneration,
        previousRevision: current?.revision ? Number(current.revision) : Number(state?.previousRevision || 0) || null,
        previousManifestPath: current?.manifestPath || state?.previousManifestPath || null,
        previousManifestSha256: current?.manifestSha256 || state?.previousManifestSha256 || null,
        rejectedRevision: current?.revision ? Number(current.revision) : Number(state?.publishedRevision || 0) || null,
        rejectedManifestPath: current?.manifestPath || state?.currentManifestPath || null,
        rejectedManifestSha256: current?.manifestSha256 || state?.currentManifestSha256 || null,
        rollbackState: null,
        rollbackOperationId: null,
        rollbackOwner: null,
        rollbackStartedAt: null,
        rollbackHeartbeatAt: null,
        rollbackExpiresAt: null,
        rollbackToken: null,
        rollbackTarget: null,
        rollbackTargetRevision: null,
        rollbackPreviousMode: null,
        rollbackPreviousDirty: null,
        rollbackPreviousBuildState: null,
        rollbackTargetManifestSha256: null,
        rollbackSourceRevision: null,
        rollbackSourceManifestPath: null,
        rollbackSourceManifestSha256: null,
        buildState: 'revalidating',
        lastError: null,
        updatedAt
    };
}

function catalogIdentityMatches(state, revision, manifestSha256) {
    return Number(state?.publishedRevision || 0) === Number(revision || 0)
        && String(state?.currentManifestSha256 || '') === String(manifestSha256 || '');
}

function catalogReleaseIdentityMatches(state, identity = {}) {
    return catalogIdentityMatches(state, identity.revision, identity.manifestSha256)
        && (!identity.aggregateSha256 || String(state?.currentAggregateSha256 || '') === String(identity.aggregateSha256))
        && (!identity.impactPlanSha256 || String(state?.currentImpactPlanSha256 || '') === String(identity.impactPlanSha256));
}

function needsCatalogRevalidation(state, pointer) {
    if (!pointer?.manifestSha256 || !Number(pointer.revision)) return false;
    return Number(state?.revalidatedRevision || 0) !== Number(pointer.revision)
        || String(state?.revalidatedManifestSha256 || '') !== String(pointer.manifestSha256);
}

function cleanError(error) {
    if (!error) return null;
    const code = String(error.code || error.name || 'UNKNOWN').slice(0, 80);
    const message = String(error.message || error).replace(/[\r\n\t]+/g, ' ').slice(0, 240);
    return { code, message };
}

module.exports = {
    CONTROL_DOCUMENT,
    CONTROL_SCHEMA_VERSION,
    acquireLease,
    assertLease,
    buildRollbackControlUpdate,
    buildRollbackPreparationUpdate,
    catalogRevalidationTaskId,
    catalogIdentityMatches,
    catalogReleaseIdentityMatches,
    cleanError,
    clearLease,
    computeQuietUntil,
    computeRevalidationRetryNotBefore,
    initialPublicationState,
    isLeaseActive,
    isRollbackActive,
    needsCatalogRevalidation,
    nextStateVersion,
    normalizePublicationMode,
    toMillis
};
