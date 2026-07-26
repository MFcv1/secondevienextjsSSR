'use strict';

const {
    consumeAndRotateAccessToken,
    createAccessTokenRecord,
    hashAccessToken
} = require('./checkoutAccessToken');

function repositoryError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function snapshotExists(snapshot) {
    return typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists === true;
}

function createCheckoutAccessTokenRepository({
    db,
    refs,
    ids,
    clock,
    ttlMs = 30 * 60 * 1000,
    retentionMs = 30 * 24 * 60 * 60 * 1000
}) {
    if (
        typeof db?.runTransaction !== 'function' ||
        typeof refs?.order !== 'function' ||
        typeof refs?.accessToken !== 'function' ||
        typeof ids?.rawToken !== 'function' ||
        typeof clock?.now !== 'function' ||
        typeof clock?.nowMillis !== 'function' ||
        !Number.isSafeInteger(ttlMs) ||
        ttlMs <= 0
    ) {
        throw repositoryError('COMMERCE_ACCESS_TOKEN_REPOSITORY_DEPENDENCY_INVALID');
    }

    function tokenTimes(nowMillis) {
        return {
            expiresAt: new Date(nowMillis + ttlMs).toISOString(),
            purgeAt: new Date(nowMillis + retentionMs).toISOString()
        };
    }

    async function issue({ orderId, ownerUid }) {
        const rawToken = ids.rawToken();
        const times = tokenTimes(clock.nowMillis());
        const record = createAccessTokenRecord({
            rawToken,
            orderId,
            ownerUid,
            expiresAt: times.expiresAt,
            purgeAt: times.purgeAt
        });
        await db.runTransaction(async (transaction) => {
            const orderRef = refs.order(orderId);
            const tokenRef = refs.accessToken(record.tokenHash);
            const [orderSnap, tokenSnap] = await Promise.all([
                transaction.get(orderRef),
                transaction.get(tokenRef)
            ]);
            if (!snapshotExists(orderSnap) || orderSnap.data().userId !== ownerUid) {
                throw repositoryError('COMMERCE_ORDER_ACCESS_DENIED');
            }
            if (snapshotExists(tokenSnap)) throw repositoryError('COMMERCE_ACCESS_TOKEN_COLLISION');
            transaction.set(tokenRef, record);
        });
        return { rawToken, expiresAt: record.expiresAt };
    }

    async function consumeAndRotate({ rawToken, ownerUid }) {
        const currentHash = hashAccessToken(rawToken);
        const nextRawToken = ids.rawToken();
        const nextHash = hashAccessToken(nextRawToken);
        const nowMillis = clock.nowMillis();
        const times = tokenTimes(nowMillis);
        return db.runTransaction(async (transaction) => {
            const currentRef = refs.accessToken(currentHash);
            const nextRef = refs.accessToken(nextHash);
            const [currentSnap, nextSnap] = await Promise.all([
                transaction.get(currentRef),
                transaction.get(nextRef)
            ]);
            if (!snapshotExists(currentSnap)) {
                throw repositoryError('COMMERCE_ACCESS_TOKEN_DENIED');
            }
            const current = currentSnap.data();
            const orderRef = refs.order(current.orderId);
            const orderSnap = await transaction.get(orderRef);
            if (!snapshotExists(orderSnap) || orderSnap.data().userId !== ownerUid) {
                throw repositoryError('COMMERCE_ACCESS_TOKEN_DENIED');
            }
            if (snapshotExists(nextSnap)) throw repositoryError('COMMERCE_ACCESS_TOKEN_COLLISION');
            const expiresAtMillis = Date.parse(current.expiresAt);
            const rotated = consumeAndRotateAccessToken(current, {
                rawToken,
                ownerUid,
                nowMillis,
                expiresAtMillis,
                consumedAt: clock.now(),
                nextRawToken,
                nextExpiresAt: times.expiresAt,
                nextPurgeAt: times.purgeAt
            });
            transaction.set(currentRef, rotated.consumed);
            transaction.set(nextRef, rotated.next);
            return {
                orderId: current.orderId,
                ownerUid,
                nextRawToken,
                expiresAt: rotated.next.expiresAt
            };
        });
    }

    return Object.freeze({
        consumeAndRotate,
        issue
    });
}

module.exports = { createCheckoutAccessTokenRepository };
