const crypto = require('crypto');

const CONTROL_SCHEMA_VERSION = 1;
const CONTROL_DOCUMENT = 'sys_catalog_publication/secondevie';
const MODE_VALUES = new Set(['legacy', 'shadow', 'snapshot_canary', 'snapshot', 'paused', 'rollback']);

function initialPublicationState(now = new Date()) {
    return {
        schemaVersion: CONTROL_SCHEMA_VERSION,
        projectionContractVersion: 1,
        mode: 'legacy',
        dirty: false,
        desiredRevision: 0,
        publishedRevision: 0,
        revalidatedRevision: 0,
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
    if (!MODE_VALUES.has(state.mode || 'legacy')) throw new Error('INVALID_PUBLICATION_MODE');
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

function cleanError(error) {
    if (!error) return null;
    const code = String(error.code || error.name || 'UNKNOWN').slice(0, 80);
    const message = String(error.message || error).replace(/[\r\n\t]+/g, ' ').slice(0, 240);
    return { code, message };
}

module.exports = {
    CONTROL_DOCUMENT,
    CONTROL_SCHEMA_VERSION,
    MODE_VALUES,
    acquireLease,
    assertLease,
    cleanError,
    clearLease,
    computeQuietUntil,
    initialPublicationState,
    isLeaseActive,
    toMillis
};
