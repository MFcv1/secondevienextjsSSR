'use strict';

const crypto = require('crypto');

const META_CONNECTION_ID = 'default';
const INSTAGRAM_CONNECTION_ID = 'instagram_direct';
const META_OAUTH_TTL_MS = 10 * 60 * 1000;
const META_ASSET_CHOICE_TTL_MS = 15 * 60 * 1000;
const META_PUBLICATION_LOCK_MS = 10 * 60 * 1000;
const META_MEDIA_LIMIT = 10;
const META_CAPTION_LIMIT = 2200;
const META_GRAPH_VERSION_DEFAULT = 'v24.0';
const META_OAUTH_SCOPES = Object.freeze([
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'instagram_basic',
    'instagram_content_publish',
    'business_management'
]);
const INSTAGRAM_OAUTH_SCOPES = Object.freeze([
    'instagram_business_basic',
    'instagram_business_content_publish'
]);

function sha256(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function safeEqualHex(left, right) {
    if (!/^[a-f0-9]{64}$/i.test(String(left || '')) || !/^[a-f0-9]{64}$/i.test(String(right || ''))) {
        return false;
    }
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createOAuthState(randomBytes = crypto.randomBytes) {
    const stateId = randomBytes(16).toString('hex');
    const verifier = randomBytes(32).toString('base64url');
    return {
        stateId,
        verifierHash: sha256(verifier),
        state: `${stateId}.${verifier}`
    };
}

function parseAndVerifyOAuthState(state, expectedHash) {
    const raw = String(state || '');
    const separatorIndex = raw.indexOf('.');
    if (separatorIndex < 1 || separatorIndex === raw.length - 1) return null;
    const stateId = raw.slice(0, separatorIndex);
    const verifier = raw.slice(separatorIndex + 1);
    if (!/^[a-f0-9]{32}$/i.test(stateId) || !/^[A-Za-z0-9_-]{40,80}$/.test(verifier)) return null;
    return safeEqualHex(sha256(verifier), expectedHash) ? { stateId } : null;
}

function deriveEncryptionKey(secret) {
    const cleanSecret = String(secret || '').trim();
    if (cleanSecret.length < 32) {
        throw new Error('META_ENCRYPTION_SECRET_TOO_SHORT');
    }
    return crypto.createHash('sha256').update(cleanSecret).digest();
}

function encryptToken(token, secret, randomBytes = crypto.randomBytes) {
    const cleanToken = String(token || '').trim();
    if (!cleanToken) throw new Error('META_TOKEN_MISSING');
    const iv = randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', deriveEncryptionKey(secret), iv);
    const encrypted = Buffer.concat([cipher.update(cleanToken, 'utf8'), cipher.final()]);
    return Object.freeze({
        alg: 'aes-256-gcm',
        iv: iv.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'),
        value: encrypted.toString('base64')
    });
}

function decryptToken(payload, secret) {
    if (payload?.alg !== 'aes-256-gcm' || !payload?.iv || !payload?.tag || !payload?.value) {
        throw new Error('META_TOKEN_PAYLOAD_INVALID');
    }
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        deriveEncryptionKey(secret),
        Buffer.from(payload.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    return Buffer.concat([
        decipher.update(Buffer.from(payload.value, 'base64')),
        decipher.final()
    ]).toString('utf8');
}

function stripStoryFormatting(value) {
    return String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/==(?:fill|underline):[a-z]+\|([^=]+)==/gi, '$1')
        .replace(/^\s{0,3}(#{1,6}|>|[-*+]\s|\d+[.)]\s)\s*/gm, '')
        .replace(/[*_~`]+/g, '')
        .replace(/\r?\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeHashtags(value) {
    const tokens = String(value || '')
        .replace(/[\r\n]+/g, ' ')
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)
        .filter((token) => /^#[\p{L}\p{N}_]{1,80}$/u.test(token));
    return Array.from(new Set(tokens)).join(' ').slice(0, 500);
}

function truncateCaption(text, maxLength = META_CAPTION_LIMIT) {
    const cleanText = String(text || '').trim();
    if (cleanText.length <= maxLength) return cleanText;
    return `${cleanText.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function buildSocialCaption({ name, description, hashtags }) {
    const title = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 180);
    const story = stripStoryFormatting(description);
    const tags = normalizeHashtags(hashtags);
    const reservedForTags = tags ? tags.length + 2 : 0;
    const editorialLimit = Math.max(1, META_CAPTION_LIMIT - reservedForTags);
    const editorial = truncateCaption([title, story].filter(Boolean).join('\n\n'), editorialLimit);
    return truncateCaption([editorial, tags].filter(Boolean).join('\n\n'));
}

function normalizeTargets(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('META_TARGETS_INVALID');
    }
    const targets = {
        instagram: value.instagram === true,
        facebook: value.facebook === true
    };
    if (!targets.instagram && !targets.facebook) throw new Error('META_TARGETS_EMPTY');
    return targets;
}

function normalizeMediaUrls(value) {
    if (!Array.isArray(value)) return [];
    const urls = [];
    for (const candidate of value) {
        if (urls.length >= META_MEDIA_LIMIT) break;
        try {
            const parsed = new URL(String(candidate || ''));
            if (parsed.protocol !== 'https:' || parsed.username || parsed.password) continue;
            const url = parsed.toString();
            if (url.length > 2048 || urls.includes(url)) continue;
            urls.push(url);
        } catch {
            // Invalid or relative URLs are intentionally ignored.
        }
    }
    return urls;
}

function normalizeCommandId(value) {
    const commandId = String(value || '').trim();
    if (!/^[A-Za-z0-9_-]{12,180}$/.test(commandId)) throw new Error('META_COMMAND_ID_INVALID');
    return commandId;
}

function publicationDocumentId(commandId) {
    return `meta_${sha256(normalizeCommandId(commandId)).slice(0, 40)}`;
}

function stablePayloadHash(payload) {
    const canonical = JSON.stringify({
        productId: String(payload?.productId || ''),
        collectionName: String(payload?.collectionName || ''),
        targets: normalizeTargets(payload?.targets || {}),
        hashtags: normalizeHashtags(payload?.hashtags || '')
    });
    return sha256(canonical);
}

function timestampToMillis(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value?.toMillis === 'function') return value.toMillis();
    return null;
}

function publicConnectionState(data = {}) {
    const status = String(data.status || 'not_connected');
    return {
        connected: status === 'connected',
        status,
        pageName: String(data.pageName || ''),
        instagramUsername: String(data.instagramUsername || ''),
        instagramAvailable: Boolean(data.instagramUserId),
        facebookAvailable: Boolean(data.pageId),
        scopes: Array.isArray(data.scopes) ? data.scopes.filter((scope) => META_OAUTH_SCOPES.includes(scope)) : [],
        connectedAtMillis: timestampToMillis(data.connectedAt),
        lastVerifiedAtMillis: timestampToMillis(data.lastVerifiedAt),
        tokenExpiresAtMillis: timestampToMillis(data.tokenExpiresAt),
        reauthorizationRequired: data.reauthorizationRequired === true,
        selectionSessionId: status === 'selection_required' ? String(data.selectionSessionId || '') : '',
        candidates: status === 'selection_required' && Array.isArray(data.candidates)
            ? data.candidates.slice(0, 50).map((candidate) => ({
                id: String(candidate.id || ''),
                pageName: String(candidate.pageName || ''),
                instagramUsername: String(candidate.instagramUsername || ''),
                instagramAvailable: candidate.instagramAvailable === true,
                facebookAvailable: candidate.facebookAvailable === true
            }))
            : []
    };
}

function publicInstagramConnectionState(data = {}) {
    const status = String(data.status || 'not_connected');
    return {
        connected: status === 'connected',
        status,
        provider: 'instagram_login',
        instagramUsername: String(data.instagramUsername || ''),
        instagramAvailable: Boolean(data.instagramUserId),
        facebookAvailable: false,
        scopes: Array.isArray(data.scopes)
            ? data.scopes.filter((scope) => INSTAGRAM_OAUTH_SCOPES.includes(scope))
            : [],
        connectedAtMillis: timestampToMillis(data.connectedAt),
        lastVerifiedAtMillis: timestampToMillis(data.lastVerifiedAt),
        tokenExpiresAtMillis: timestampToMillis(data.tokenExpiresAt),
        reauthorizationRequired: data.reauthorizationRequired === true
    };
}

function safeErrorCode(error) {
    const graphCode = Number(error?.graphCode || error?.details?.graphCode || error?.details?.code);
    if ([10, 100, 190, 200, 368].includes(graphCode)) return `meta_${graphCode}`;
    const code = String(error?.code || 'meta_error').replace(/[^a-z0-9_-]/gi, '').slice(0, 80);
    return code || 'meta_error';
}

module.exports = {
    META_ASSET_CHOICE_TTL_MS,
    META_CAPTION_LIMIT,
    META_CONNECTION_ID,
    INSTAGRAM_CONNECTION_ID,
    META_GRAPH_VERSION_DEFAULT,
    META_MEDIA_LIMIT,
    META_OAUTH_SCOPES,
    INSTAGRAM_OAUTH_SCOPES,
    META_OAUTH_TTL_MS,
    META_PUBLICATION_LOCK_MS,
    buildSocialCaption,
    createOAuthState,
    decryptToken,
    encryptToken,
    normalizeCommandId,
    normalizeHashtags,
    normalizeMediaUrls,
    normalizeTargets,
    parseAndVerifyOAuthState,
    publicConnectionState,
    publicInstagramConnectionState,
    publicationDocumentId,
    safeErrorCode,
    sha256,
    stablePayloadHash,
    stripStoryFormatting,
    truncateCaption
};
