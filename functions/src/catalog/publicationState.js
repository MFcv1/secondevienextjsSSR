const crypto = require('crypto');

const CONTROL_SCHEMA_VERSION = 1;
const CONTROL_DOCUMENT = 'sys_catalog_publication/secondevie';

function normalizePublicationMode(value) {
    return value === 'paused' ? 'paused' : 'active';
}

function initialPublicationState(now = new Date()) {
    return {
        schemaVersion: CONTROL_SCHEMA_VERSION,
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

function computeQuietUntil({ dirtySince, nowMs, publicFields = [] }) {
    const stockOnly = publicFields.length > 0
        && publicFields.every((field) => ['stock', 'sold', 'currentPrice', 'startingPrice', 'price'].includes(field));
    const silenceMs = stockOnly ? 1000 : 5000;
    const maxBatchAgeMs = stockOnly ? 5000 : 30000;
    const dirtySinceMs = dirtySince ? toMillis(dirtySince) : nowMs;
    return new Date(Math.min(nowMs + silenceMs, dirtySinceMs + maxBatchAgeMs));
}

function acquireLease(state, { owner, targetRevision, now = new Date(), durationMs = 120000, token } = {}) {
    if (normalizePublicationMode(state.mode) === 'paused') return null;
    if (isLeaseActive(state, now.getTime())) return null;
    if (targetRevision > Number(state.desiredRevision || 0)) throw new Error('TARGET_REVISION_AHEAD');
    const leaseToken = token || crypto.randomUUID();
    return {
        leaseToken,
        leaseOwner: owner || 'catalog-worker',
        leaseTargetRevision: targetRevision,
        leaseAcquiredAt: now,
        leaseExpiresAt: new Date(now.getTime() + durationMs),
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

function buildRollbackPreparationUpdate(state, { token, targetName, target, updatedAt = new Date() }) {
    const desiredRevision = Math.max(
        Number(state?.desiredRevision || 0),
        Number(state?.publishedRevision || 0),
        Number(target?.revision || 0)
    );
    return {
        mode: 'paused',
        desiredRevision,
        rollbackState: 'preparing',
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

function buildRollbackControlUpdate(state, { current, target, currentPointerGeneration, updatedAt = new Date() }) {
    const desiredRevision = Math.max(
        Number(state?.desiredRevision || 0),
        Number(state?.publishedRevision || 0),
        Number(current?.revision || 0),
        Number(target?.revision || 0)
    );
    return {
        ...clearLease(updatedAt),
        mode: 'paused',
        dirty: Boolean(state?.dirty),
        desiredRevision,
        publishedRevision: Number(target.revision),
        revalidatedRevision: null,
        revalidatedManifestSha256: null,
        currentManifestPath: target.manifestPath,
        currentManifestSha256: target.manifestSha256,
        currentPointerGeneration,
        previousRevision: current?.revision ? Number(current.revision) : Number(state?.previousRevision || 0) || null,
        previousManifestPath: current?.manifestPath || state?.previousManifestPath || null,
        previousManifestSha256: current?.manifestSha256 || state?.previousManifestSha256 || null,
        rejectedRevision: current?.revision ? Number(current.revision) : Number(state?.publishedRevision || 0) || null,
        rejectedManifestPath: current?.manifestPath || state?.currentManifestPath || null,
        rejectedManifestSha256: current?.manifestSha256 || state?.currentManifestSha256 || null,
        rollbackState: null,
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
    catalogIdentityMatches,
    cleanError,
    clearLease,
    computeQuietUntil,
    initialPublicationState,
    isLeaseActive,
    needsCatalogRevalidation,
    normalizePublicationMode,
    toMillis
};
