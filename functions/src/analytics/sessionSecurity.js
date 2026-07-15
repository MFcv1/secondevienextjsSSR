const crypto = require('crypto');

const SESSION_RESUME_WINDOW_MS = 60 * 60 * 1000;
const CLOSED_SESSION_RESUME_GRACE_MS = 15 * 1000;

const hashSyncToken = (token) => crypto
    .createHash('sha256')
    .update(String(token || ''))
    .digest('hex');

const isValidSyncToken = (sessionData, token, { allowLegacy = true } = {}) => {
    const expectedHash = sessionData?.syncTokenHash;
    if (!expectedHash) return Boolean(allowLegacy);
    if (!token || typeof token !== 'string') return false;

    const actualHash = hashSyncToken(token);
    const expected = Buffer.from(expectedHash, 'hex');
    const actual = Buffer.from(actualHash, 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

const toMillis = (value) => {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    if (value instanceof Date) return value.getTime();
    return 0;
};

const canResumeSession = (sessionData, { authUid, syncToken, now }) => {
    if (!sessionData || sessionData.type === 'admin') return false;
    if (!authUid || authUid === 'unknown') return false;
    if (sessionData.userId !== authUid) return false;
    if (!isValidSyncToken(sessionData, syncToken, { allowLegacy: false })) return false;

    const lastActivityMs = toMillis(sessionData.lastActivityAt) || toMillis(sessionData.startedAt);
    if (!lastActivityMs) return false;
    const inactivityMs = now - lastActivityMs;
    if (sessionData.sessionActive === false && inactivityMs > CLOSED_SESSION_RESUME_GRACE_MS) return false;
    return inactivityMs <= SESSION_RESUME_WINDOW_MS;
};

module.exports = {
    CLOSED_SESSION_RESUME_GRACE_MS,
    SESSION_RESUME_WINDOW_MS,
    canResumeSession,
    hashSyncToken,
    isValidSyncToken,
    toMillis
};
