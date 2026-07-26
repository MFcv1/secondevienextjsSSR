'use strict';

const crypto = require('node:crypto');

function tokenError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function hashAccessToken(token) {
    if (typeof token !== 'string' || token.length < 32 || token.length > 512) {
        throw tokenError('COMMERCE_ACCESS_TOKEN_INVALID');
    }
    return crypto.createHash('sha256').update(token).digest('hex');
}

function createAccessTokenRecord({
    rawToken,
    orderId,
    ownerUid,
    purpose = 'resume_checkout',
    expiresAt,
    purgeAt,
    rotation = 0
}) {
    if (
        typeof orderId !== 'string' ||
        typeof ownerUid !== 'string' ||
        !Number.isSafeInteger(rotation) ||
        rotation < 0
    ) {
        throw tokenError('COMMERCE_ACCESS_TOKEN_INVALID');
    }
    return {
        schemaVersion: 2,
        tokenHash: hashAccessToken(rawToken),
        orderId,
        ownerUid,
        purpose,
        expiresAt,
        consumedAt: null,
        rotation,
        purgeAt
    };
}

function consumeAndRotateAccessToken(record, {
    rawToken,
    ownerUid,
    nowMillis,
    expiresAtMillis,
    consumedAt,
    nextRawToken,
    nextExpiresAt,
    nextPurgeAt
}) {
    if (
        record.tokenHash !== hashAccessToken(rawToken) ||
        record.ownerUid !== ownerUid ||
        record.consumedAt !== null ||
        !Number.isSafeInteger(expiresAtMillis) ||
        expiresAtMillis <= nowMillis
    ) {
        throw tokenError('COMMERCE_ACCESS_TOKEN_DENIED');
    }
    return {
        consumed: {
            ...record,
            consumedAt
        },
        next: createAccessTokenRecord({
            rawToken: nextRawToken,
            orderId: record.orderId,
            ownerUid: record.ownerUid,
            purpose: record.purpose,
            expiresAt: nextExpiresAt,
            purgeAt: nextPurgeAt,
            rotation: record.rotation + 1
        })
    };
}

module.exports = {
    consumeAndRotateAccessToken,
    createAccessTokenRecord,
    hashAccessToken
};
