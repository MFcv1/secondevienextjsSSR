'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const {
    checkActiveStrongAdmin,
    checkActiveStrongSuperAdmin,
    assertConfirmText,
    normalizeFirestoreId,
    normalizeProductCollection,
    writeSecurityAudit
} = require('../../helpers/security');
const { APP_ID, getSiteUrl } = require('../../helpers/config');
const { regionalFunctions } = require('../../helpers/runtime');
const { AUDIT_RETENTION_DAYS, timestampAfterDays } = require('../../helpers/retention');
const {
    META_APP_ID,
    META_APP_SECRET,
    META_OAUTH_REDIRECT_URI,
    INSTAGRAM_APP_ID,
    INSTAGRAM_APP_SECRET,
    INSTAGRAM_OAUTH_REDIRECT_URI,
    META_TOKEN_ENCRYPTION_KEY
} = require('../../helpers/secrets');
const {
    META_ASSET_CHOICE_TTL_MS,
    INSTAGRAM_CONNECTION_ID,
    INSTAGRAM_OAUTH_SCOPES,
    META_CONNECTION_ID,
    META_GRAPH_VERSION_DEFAULT,
    META_OAUTH_SCOPES,
    META_OAUTH_TTL_MS,
    META_PUBLICATION_LOCK_MS,
    buildSocialCaption,
    createOAuthState,
    decryptToken,
    encryptToken,
    normalizeCommandId,
    normalizeHashtags,
    normalizeInstagramProfileResponse,
    normalizeMediaUrls,
    normalizeTargets,
    parseAndVerifyOAuthState,
    publicConnectionState,
    publicInstagramConnectionState,
    publicationDocumentId,
    safeErrorCode,
    stablePayloadHash
} = require('./metaContract');

const db = () => admin.firestore();
const CONNECTION_COLLECTION = 'sys_meta_connections';
const OAUTH_STATE_COLLECTION = 'sys_meta_oauth_states';
const ASSET_CHOICE_COLLECTION = 'sys_meta_asset_choices';
const PUBLICATION_COLLECTION = 'sys_social_publications';
const META_AUDIT_COLLECTION = 'sys_audit_meta';
const META_SECRETS = [META_APP_ID, META_APP_SECRET, META_OAUTH_REDIRECT_URI, META_TOKEN_ENCRYPTION_KEY];
const INSTAGRAM_SECRETS = [INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_OAUTH_REDIRECT_URI, META_TOKEN_ENCRYPTION_KEY];
const PUBLICATION_SECRETS = [META_TOKEN_ENCRYPTION_KEY];

function secretValue(secret, envName) {
    const value = String(process.env[envName] || secret.value() || '').trim();
    if (!value) throw new functions.https.HttpsError('failed-precondition', 'La connexion Meta n’est pas configurée.');
    return value;
}

function serverTimestamp() {
    return admin.firestore.FieldValue.serverTimestamp();
}

function graphBaseUrl(host = 'graph.facebook.com') {
    const version = String(process.env.META_GRAPH_VERSION || META_GRAPH_VERSION_DEFAULT).trim();
    if (!/^v\d+\.\d+$/.test(version)) return `https://${host}/${META_GRAPH_VERSION_DEFAULT}`;
    return `https://${host}/${version}`;
}

function graphError(status, payload) {
    const graphCode = Number(payload?.error?.code || 0) || null;
    const error = new Error('META_GRAPH_REQUEST_FAILED');
    error.graphCode = graphCode;
    error.graphStatus = status;
    error.graphTraceId = String(payload?.error?.fbtrace_id || '').slice(0, 120);
    return error;
}

async function graphRequest(path, { method = 'GET', token, params = {}, host = 'graph.facebook.com', versioned = true } = {}) {
    const cleanPath = String(path || '').replace(/^\/+/, '');
    if (!/^[A-Za-z0-9_.?=&/:-]+$/.test(cleanPath)) throw new Error('META_GRAPH_PATH_INVALID');
    const query = new URLSearchParams();
    const body = new URLSearchParams();
    const target = method === 'GET' ? query : body;
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') target.set(key, String(value));
    }
    if (token) target.set('access_token', token);
    const baseUrl = versioned ? graphBaseUrl(host) : `https://${host}`;
    const url = `${baseUrl}/${cleanPath}${query.size ? `?${query}` : ''}`;
    const response = await fetch(url, {
        method,
        headers: method === 'GET' ? undefined : { 'content-type': 'application/x-www-form-urlencoded' },
        body: method === 'GET' ? undefined : body,
        signal: AbortSignal.timeout(25_000)
    });
    let payload = null;
    try {
        payload = await response.json();
    } catch {
        throw graphError(response.status, null);
    }
    if (!response.ok || payload?.error) throw graphError(response.status, payload);
    return payload;
}

async function auditMeta(eventType, context, payload = {}) {
    try {
        const actorEmail = String(context?.auth?.token?.email || '').trim().toLowerCase();
        await db().collection(META_AUDIT_COLLECTION).add({
            eventType,
            actorUid: context?.auth?.uid || null,
            actorEmailHash: actorEmail ? crypto.createHash('sha256').update(actorEmail).digest('hex') : null,
            payload,
            createdAt: serverTimestamp(),
            expireAt: timestampAfterDays(AUDIT_RETENTION_DAYS)
        });
    } catch (error) {
        console.error('Meta audit write failed', { eventType, code: safeErrorCode(error) });
    }
}

function normalizeOrigin(value) {
    try {
        const origin = new URL(String(value || '')).origin;
        const siteOrigin = new URL(getSiteUrl()).origin;
        const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        if (origin !== siteOrigin && !isLocal) throw new Error('ORIGIN_NOT_ALLOWED');
        return origin;
    } catch {
        throw new functions.https.HttpsError('invalid-argument', 'Origine de connexion invalide.');
    }
}

function candidateProjection(candidate) {
    return {
        id: candidate.id,
        pageName: candidate.pageName,
        instagramUsername: candidate.instagramUsername,
        instagramAvailable: Boolean(candidate.instagramUserId),
        facebookAvailable: true
    };
}

function connectionDocument(candidate, encryptedPageToken, context) {
    return {
        status: 'connected',
        pageId: candidate.pageId,
        pageName: candidate.pageName,
        instagramUserId: candidate.instagramUserId || null,
        instagramUsername: candidate.instagramUsername || '',
        pageToken: encryptedPageToken,
        scopes: Array.isArray(candidate.scopes) ? candidate.scopes : [],
        tokenExpiresAt: candidate.tokenExpiresAt || null,
        connectedByUid: context?.auth?.uid || null,
        connectedByEmail: String(context?.auth?.token?.email || '').toLowerCase().slice(0, 320),
        connectedAt: serverTimestamp(),
        lastVerifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reauthorizationRequired: false,
        selectionSessionId: admin.firestore.FieldValue.delete(),
        candidates: admin.firestore.FieldValue.delete()
    };
}

function callbackHtml({ origin, status, message, nonce, source = 'seconde-vie-meta-oauth', title = 'Connexion Meta' }) {
    const safePayload = JSON.stringify({ source, status, message }).replace(/</g, '\\u003c');
    const safeOrigin = JSON.stringify(origin).replace(/</g, '\\u003c');
    const safeAdminUrl = JSON.stringify(`${origin}/admin`).replace(/</g, '\\u003c');
    return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body><p>${status === 'connected' ? 'Connexion terminée. Cette fenêtre va se fermer.' : 'La connexion n’a pas abouti. Tu peux fermer cette fenêtre.'}</p><script nonce="${nonce}">if(window.opener){window.opener.postMessage(${safePayload},${safeOrigin});window.close();}else{window.location.replace(${safeAdminUrl});}</script></body></html>`;
}

function sendCallback(res, origin, status, message, httpStatus = 200, options = {}) {
    const nonce = crypto.randomBytes(18).toString('base64url');
    const html = callbackHtml({ origin, status, message, nonce, ...options });
    res.status(httpStatus)
        .set('cache-control', 'no-store, max-age=0')
        .set('x-frame-options', 'DENY')
        .set('referrer-policy', 'no-referrer')
        .set('content-security-policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'none'; base-uri 'none'; frame-ancestors 'none'`)
        .type('html')
        .send(html);
}

async function exchangeOAuthCode(code) {
    const appId = secretValue(META_APP_ID, 'META_APP_ID');
    const appSecret = secretValue(META_APP_SECRET, 'META_APP_SECRET');
    const redirectUri = secretValue(META_OAUTH_REDIRECT_URI, 'META_OAUTH_REDIRECT_URI');
    const shortToken = await graphRequest('oauth/access_token', {
        params: { client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }
    });
    const longToken = await graphRequest('oauth/access_token', {
        params: {
            grant_type: 'fb_exchange_token',
            client_id: appId,
            client_secret: appSecret,
            fb_exchange_token: shortToken.access_token
        }
    });
    const token = String(longToken.access_token || shortToken.access_token || '');
    const expiresInSeconds = Number(longToken.expires_in || shortToken.expires_in || 0);
    return {
        token,
        tokenExpiresAt: expiresInSeconds > 0
            ? admin.firestore.Timestamp.fromMillis(Date.now() + expiresInSeconds * 1000)
            : null
    };
}

async function fetchGrantedScopes(userToken) {
    const result = await graphRequest('me/permissions', { token: userToken });
    const granted = (Array.isArray(result.data) ? result.data : [])
        .filter((permission) => permission?.status === 'granted')
        .map((permission) => String(permission.permission || ''))
        .filter((permission) => META_OAUTH_SCOPES.includes(permission));
    const required = META_OAUTH_SCOPES.filter((permission) => permission !== 'business_management');
    if (required.some((permission) => !granted.includes(permission))) {
        const error = new Error('META_REQUIRED_PERMISSION_MISSING');
        error.code = 'meta_permissions_missing';
        throw error;
    }
    return granted;
}

async function fetchMetaCandidates(userToken, { scopes, tokenExpiresAt }) {
    const result = await graphRequest('me/accounts', {
        token: userToken,
        params: {
            fields: 'id,name,access_token,tasks,instagram_business_account',
            limit: 100
        }
    });
    const pages = (Array.isArray(result.data) ? result.data : [])
        .filter((page) => page?.id && page?.access_token)
        .slice(0, 50);
    return Promise.all(pages.map(async (page) => {
        let instagram = page.instagram_business_account || null;
        if (instagram?.id) {
            try {
                const details = await graphRequest(String(page.id), {
                    token: String(page.access_token),
                    params: { fields: 'instagram_business_account{id,username}' }
                });
                instagram = details.instagram_business_account || instagram;
            } catch {
                // The opaque Instagram id is enough to publish; username is presentation only.
            }
        }
        return {
            id: crypto.randomBytes(12).toString('hex'),
            pageId: String(page.id),
            pageName: String(page.name || 'Page Facebook').slice(0, 180),
            pageToken: String(page.access_token),
            instagramUserId: instagram?.id ? String(instagram.id) : null,
            instagramUsername: String(instagram?.username || '').slice(0, 180),
            scopes,
            tokenExpiresAt
        };
    }));
}

async function startMetaOAuthHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const origin = normalizeOrigin(data?.origin);
    const appId = secretValue(META_APP_ID, 'META_APP_ID');
    const redirectUri = secretValue(META_OAUTH_REDIRECT_URI, 'META_OAUTH_REDIRECT_URI');
    const { stateId, verifierHash, state } = createOAuthState();
    await db().collection(OAUTH_STATE_COLLECTION).doc(stateId).set({
        verifierHash,
        provider: 'facebook',
        origin,
        status: 'pending',
        uid: context.auth.uid,
        email: String(context.auth.token.email || '').toLowerCase().slice(0, 320),
        createdAt: serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + META_OAUTH_TTL_MS)
    });
    const query = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        state,
        response_type: 'code',
        scope: META_OAUTH_SCOPES.join(','),
        auth_type: 'rerequest'
    });
    await auditMeta('meta_oauth_started', context);
    return {
        url: `https://www.facebook.com/dialog/oauth?${query}`,
        callbackOrigin: new URL(redirectUri).origin
    };
}

async function metaOAuthCallbackHandler(req, res) {
    if (req.method !== 'GET') {
        res.status(405).set('allow', 'GET').send('Method not allowed');
        return;
    }
    const rawState = String(req.query.state || '');
    const stateId = rawState.split('.', 1)[0];
    if (!/^[a-f0-9]{32}$/i.test(stateId)) {
        sendCallback(res, new URL(getSiteUrl()).origin, 'error', 'État OAuth invalide.', 400);
        return;
    }
    const stateRef = db().collection(OAUTH_STATE_COLLECTION).doc(stateId);
    const stateSnap = await stateRef.get();
    const stateData = stateSnap.exists ? stateSnap.data() : null;
    const origin = stateData?.origin || new URL(getSiteUrl()).origin;
    if (!stateData || stateData.provider !== 'facebook' || !parseAndVerifyOAuthState(rawState, stateData.verifierHash)) {
        sendCallback(res, origin, 'error', 'État OAuth invalide.', 400);
        return;
    }
    const expiresAt = stateData.expiresAt?.toMillis?.() || 0;
    if (stateData.status !== 'pending' || expiresAt <= Date.now()) {
        sendCallback(res, origin, 'error', 'Cette tentative de connexion a expiré.', 400);
        return;
    }
    try {
        await db().runTransaction(async (transaction) => {
            const current = await transaction.get(stateRef);
            const currentData = current.exists ? current.data() : null;
            if (
                !currentData ||
                currentData.status !== 'pending' ||
                (currentData.expiresAt?.toMillis?.() || 0) <= Date.now()
            ) {
                throw new Error('META_OAUTH_STATE_ALREADY_USED');
            }
            transaction.update(stateRef, { status: 'processing', processingAt: serverTimestamp() });
        });
    } catch {
        sendCallback(res, origin, 'error', 'Cette tentative de connexion a déjà été utilisée.', 400);
        return;
    }
    if (req.query.error || !req.query.code) {
        await stateRef.update({ status: 'cancelled', completedAt: serverTimestamp() });
        sendCallback(res, origin, 'cancelled', 'Connexion Meta annulée.');
        return;
    }
    try {
        const tokenInfo = await exchangeOAuthCode(String(req.query.code));
        const grantedScopes = await fetchGrantedScopes(tokenInfo.token);
        const candidates = await fetchMetaCandidates(tokenInfo.token, {
            scopes: grantedScopes,
            tokenExpiresAt: tokenInfo.tokenExpiresAt
        });
        if (candidates.length === 0) throw new Error('META_NO_MANAGEABLE_PAGE');
        const encryptionKey = secretValue(META_TOKEN_ENCRYPTION_KEY, 'META_TOKEN_ENCRYPTION_KEY');
        const connectionRef = db().collection(CONNECTION_COLLECTION).doc(META_CONNECTION_ID);
        if (candidates.length === 1) {
            const candidate = candidates[0];
            await connectionRef.set(connectionDocument(candidate, encryptToken(candidate.pageToken, encryptionKey), {
                auth: { uid: stateData.uid, token: { email: stateData.email } }
            }), { merge: true });
            await stateRef.update({ status: 'completed', completedAt: serverTimestamp() });
            await auditMeta('meta_oauth_connected', { auth: { uid: stateData.uid, token: { email: stateData.email } } }, {
                pageName: candidate.pageName,
                instagramAvailable: Boolean(candidate.instagramUserId)
            });
            sendCallback(res, origin, 'connected', 'Compte Meta connecté.');
            return;
        }
        const sessionId = crypto.randomBytes(16).toString('hex');
        const projectedCandidates = candidates.map(candidateProjection);
        await db().collection(ASSET_CHOICE_COLLECTION).doc(sessionId).set({
            uid: stateData.uid,
            candidates: candidates.map((candidate) => ({
                ...candidateProjection(candidate),
                pageId: candidate.pageId,
                instagramUserId: candidate.instagramUserId,
                scopes: candidate.scopes,
                tokenExpiresAt: candidate.tokenExpiresAt,
                pageToken: encryptToken(candidate.pageToken, encryptionKey)
            })),
            createdAt: serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + META_ASSET_CHOICE_TTL_MS)
        });
        await connectionRef.set({
            status: 'selection_required',
            selectionSessionId: sessionId,
            candidates: projectedCandidates,
            pageId: admin.firestore.FieldValue.delete(),
            pageName: admin.firestore.FieldValue.delete(),
            instagramUserId: admin.firestore.FieldValue.delete(),
            instagramUsername: admin.firestore.FieldValue.delete(),
            pageToken: admin.firestore.FieldValue.delete(),
            connectedByUid: stateData.uid,
            updatedAt: serverTimestamp()
        }, { merge: true });
        await stateRef.update({ status: 'selection_required', completedAt: serverTimestamp() });
        sendCallback(res, origin, 'selection_required', 'Choisis la Page à utiliser.');
    } catch (error) {
        console.error('Meta OAuth callback failed', { code: safeErrorCode(error), graphTraceId: error?.graphTraceId || null });
        await stateRef.update({ status: 'failed', errorCode: safeErrorCode(error), completedAt: serverTimestamp() });
        sendCallback(res, origin, 'error', 'La connexion Meta n’a pas abouti.', 400);
    }
}

async function exchangeInstagramOAuthCode(code) {
    const appId = secretValue(INSTAGRAM_APP_ID, 'INSTAGRAM_APP_ID');
    const appSecret = secretValue(INSTAGRAM_APP_SECRET, 'INSTAGRAM_APP_SECRET');
    const redirectUri = secretValue(INSTAGRAM_OAUTH_REDIRECT_URI, 'INSTAGRAM_OAUTH_REDIRECT_URI');
    const shortToken = await graphRequest('oauth/access_token', {
        method: 'POST',
        host: 'api.instagram.com',
        versioned: false,
        params: {
            client_id: appId,
            client_secret: appSecret,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code
        }
    });
    const shortAccessToken = String(shortToken.access_token || '');
    if (!shortAccessToken || !shortToken.user_id) throw new Error('INSTAGRAM_TOKEN_EXCHANGE_INVALID');
    const longToken = await graphRequest('access_token', {
        host: 'graph.instagram.com',
        versioned: false,
        params: {
            grant_type: 'ig_exchange_token',
            client_secret: appSecret,
            access_token: shortAccessToken
        }
    });
    const token = String(longToken.access_token || shortAccessToken);
    const expiresInSeconds = Number(longToken.expires_in || shortToken.expires_in || 0);
    return {
        token,
        instagramUserId: String(shortToken.user_id),
        tokenExpiresAt: expiresInSeconds > 0
            ? admin.firestore.Timestamp.fromMillis(Date.now() + expiresInSeconds * 1000)
            : null
    };
}

async function fetchInstagramProfile(token, expectedUserId = '') {
    const profile = await graphRequest('me', {
        host: 'graph.instagram.com',
        token,
        params: { fields: 'user_id,username' }
    });
    return normalizeInstagramProfileResponse(profile, expectedUserId);
}

async function startInstagramOAuthHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const origin = normalizeOrigin(data?.origin);
    const appId = secretValue(INSTAGRAM_APP_ID, 'INSTAGRAM_APP_ID');
    const redirectUri = secretValue(INSTAGRAM_OAUTH_REDIRECT_URI, 'INSTAGRAM_OAUTH_REDIRECT_URI');
    const { stateId, verifierHash, state } = createOAuthState();
    await db().collection(OAUTH_STATE_COLLECTION).doc(stateId).set({
        verifierHash,
        provider: 'instagram',
        origin,
        status: 'pending',
        uid: context.auth.uid,
        email: String(context.auth.token.email || '').toLowerCase().slice(0, 320),
        createdAt: serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + META_OAUTH_TTL_MS)
    });
    const query = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        state,
        response_type: 'code',
        scope: INSTAGRAM_OAUTH_SCOPES.join(','),
        force_reauth: 'true'
    });
    await auditMeta('instagram_oauth_started', context);
    return {
        url: `https://www.instagram.com/oauth/authorize?${query}`,
        callbackOrigin: new URL(redirectUri).origin
    };
}

async function instagramOAuthCallbackHandler(req, res) {
    const callbackOptions = { source: 'seconde-vie-instagram-oauth', title: 'Connexion Instagram' };
    if (req.method !== 'GET') {
        res.status(405).set('allow', 'GET').send('Method not allowed');
        return;
    }
    const rawState = String(req.query.state || '');
    const stateId = rawState.split('.', 1)[0];
    if (!/^[a-f0-9]{32}$/i.test(stateId)) {
        sendCallback(res, new URL(getSiteUrl()).origin, 'error', 'État OAuth invalide.', 400, callbackOptions);
        return;
    }
    const stateRef = db().collection(OAUTH_STATE_COLLECTION).doc(stateId);
    const stateSnap = await stateRef.get();
    const stateData = stateSnap.exists ? stateSnap.data() : null;
    const origin = stateData?.origin || new URL(getSiteUrl()).origin;
    if (!stateData || stateData.provider !== 'instagram' || !parseAndVerifyOAuthState(rawState, stateData.verifierHash)) {
        sendCallback(res, origin, 'error', 'État OAuth invalide.', 400, callbackOptions);
        return;
    }
    if (stateData.status !== 'pending' || (stateData.expiresAt?.toMillis?.() || 0) <= Date.now()) {
        sendCallback(res, origin, 'error', 'Cette tentative de connexion a expiré.', 400, callbackOptions);
        return;
    }
    try {
        await db().runTransaction(async (transaction) => {
            const current = await transaction.get(stateRef);
            const currentData = current.exists ? current.data() : null;
            if (!currentData || currentData.status !== 'pending' || (currentData.expiresAt?.toMillis?.() || 0) <= Date.now()) {
                throw new Error('INSTAGRAM_OAUTH_STATE_ALREADY_USED');
            }
            transaction.update(stateRef, { status: 'processing', processingAt: serverTimestamp() });
        });
    } catch {
        sendCallback(res, origin, 'error', 'Cette tentative de connexion a déjà été utilisée.', 400, callbackOptions);
        return;
    }
    if (req.query.error || !req.query.code) {
        await stateRef.update({ status: 'cancelled', completedAt: serverTimestamp() });
        sendCallback(res, origin, 'cancelled', 'Connexion Instagram annulée.', 200, callbackOptions);
        return;
    }
    try {
        const tokenInfo = await exchangeInstagramOAuthCode(String(req.query.code));
        const profile = await fetchInstagramProfile(tokenInfo.token, tokenInfo.instagramUserId);
        const encryptionKey = secretValue(META_TOKEN_ENCRYPTION_KEY, 'META_TOKEN_ENCRYPTION_KEY');
        await db().collection(CONNECTION_COLLECTION).doc(INSTAGRAM_CONNECTION_ID).set({
            status: 'connected',
            provider: 'instagram_login',
            instagramUserId: profile.instagramUserId,
            instagramUsername: profile.instagramUsername,
            instagramAccessToken: encryptToken(tokenInfo.token, encryptionKey),
            scopes: [...INSTAGRAM_OAUTH_SCOPES],
            tokenExpiresAt: tokenInfo.tokenExpiresAt,
            connectedByUid: stateData.uid,
            connectedByEmail: stateData.email,
            connectedAt: serverTimestamp(),
            lastVerifiedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            reauthorizationRequired: false
        }, { merge: true });
        await stateRef.update({ status: 'completed', completedAt: serverTimestamp() });
        await auditMeta('instagram_oauth_connected', { auth: { uid: stateData.uid, token: { email: stateData.email } } }, {
            instagramUsername: profile.instagramUsername
        });
        sendCallback(res, origin, 'connected', 'Compte Instagram connecté.', 200, callbackOptions);
    } catch (error) {
        console.error('Instagram OAuth callback failed', { code: safeErrorCode(error), graphTraceId: error?.graphTraceId || null });
        await stateRef.update({ status: 'failed', errorCode: safeErrorCode(error), completedAt: serverTimestamp() });
        sendCallback(res, origin, 'error', 'La connexion Instagram n’a pas abouti.', 400, callbackOptions);
    }
}

async function getInstagramConnectionStatusHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const snap = await db().collection(CONNECTION_COLLECTION).doc(INSTAGRAM_CONNECTION_ID).get();
    return publicInstagramConnectionState(snap.exists ? snap.data() : {});
}

async function verifyInstagramConnectionHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const ref = db().collection(CONNECTION_COLLECTION).doc(INSTAGRAM_CONNECTION_ID);
    const snap = await ref.get();
    const connection = snap.exists ? snap.data() : null;
    if (!connection || connection.status !== 'connected' || !connection.instagramAccessToken) {
        throw new functions.https.HttpsError('failed-precondition', 'Aucun compte Instagram n’est connecté.');
    }
    try {
        const token = decryptToken(connection.instagramAccessToken, secretValue(META_TOKEN_ENCRYPTION_KEY, 'META_TOKEN_ENCRYPTION_KEY'));
        const profile = await fetchInstagramProfile(token, connection.instagramUserId);
        await ref.update({
            instagramUsername: profile.instagramUsername,
            lastVerifiedAt: serverTimestamp(),
            reauthorizationRequired: false,
            updatedAt: serverTimestamp()
        });
        const updated = await ref.get();
        return publicInstagramConnectionState(updated.data());
    } catch (error) {
        const requiresAuth = Number(error.graphCode) === 190;
        await ref.update({
            reauthorizationRequired: requiresAuth,
            lastVerificationErrorCode: safeErrorCode(error),
            updatedAt: serverTimestamp()
        });
        throw new functions.https.HttpsError(
            requiresAuth ? 'failed-precondition' : 'unavailable',
            requiresAuth ? 'La connexion Instagram doit être renouvelée.' : 'Instagram ne répond pas pour le moment.',
            { reason: requiresAuth ? 'instagram-reauthorization-required' : 'instagram-verification-failed' }
        );
    }
}

async function disconnectInstagramConnectionHandler(data, context) {
    await checkActiveStrongSuperAdmin(context);
    assertConfirmText(data, 'DECONNECTER INSTAGRAM', 'déconnexion');
    await db().collection(CONNECTION_COLLECTION).doc(INSTAGRAM_CONNECTION_ID).set({
        status: 'not_connected',
        instagramUserId: admin.firestore.FieldValue.delete(),
        instagramUsername: admin.firestore.FieldValue.delete(),
        instagramAccessToken: admin.firestore.FieldValue.delete(),
        scopes: admin.firestore.FieldValue.delete(),
        tokenExpiresAt: admin.firestore.FieldValue.delete(),
        reauthorizationRequired: false,
        disconnectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }, { merge: true });
    await Promise.all([
        auditMeta('instagram_disconnected', context),
        writeSecurityAudit('instagram_disconnected', context)
    ]);
    return { connected: false, status: 'not_connected', provider: 'instagram_login' };
}

async function getMetaConnectionStatusHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const snap = await db().collection(CONNECTION_COLLECTION).doc(META_CONNECTION_ID).get();
    return publicConnectionState(snap.exists ? snap.data() : {});
}

async function selectMetaAssetHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const sessionId = normalizeFirestoreId(data?.sessionId, 'Session Meta');
    const candidateId = normalizeFirestoreId(data?.candidateId, 'Page Meta');
    const choiceRef = db().collection(ASSET_CHOICE_COLLECTION).doc(sessionId);
    const choiceSnap = await choiceRef.get();
    const choice = choiceSnap.exists ? choiceSnap.data() : null;
    if (!choice || choice.uid !== context.auth.uid || (choice.expiresAt?.toMillis?.() || 0) <= Date.now()) {
        throw new functions.https.HttpsError('failed-precondition', 'Cette sélection Meta a expiré.');
    }
    const candidate = choice.candidates?.find((item) => item.id === candidateId);
    if (!candidate) throw new functions.https.HttpsError('invalid-argument', 'Page Meta invalide.');
    const connectionRef = db().collection(CONNECTION_COLLECTION).doc(META_CONNECTION_ID);
    await connectionRef.set(connectionDocument(candidate, candidate.pageToken, context), { merge: true });
    await choiceRef.delete();
    await auditMeta('meta_asset_selected', context, {
        pageName: candidate.pageName,
        instagramAvailable: Boolean(candidate.instagramUserId)
    });
    return publicConnectionState({ ...candidate, status: 'connected', connectedAt: Date.now(), lastVerifiedAt: Date.now() });
}

async function verifyMetaConnectionHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const ref = db().collection(CONNECTION_COLLECTION).doc(META_CONNECTION_ID);
    const snap = await ref.get();
    const connection = snap.exists ? snap.data() : null;
    if (!connection || connection.status !== 'connected' || !connection.pageToken) {
        throw new functions.https.HttpsError('failed-precondition', 'Aucun compte Meta n’est connecté.');
    }
    try {
        const token = decryptToken(connection.pageToken, secretValue(META_TOKEN_ENCRYPTION_KEY, 'META_TOKEN_ENCRYPTION_KEY'));
        const page = await graphRequest(connection.pageId, {
            token,
            params: { fields: 'id,name,instagram_business_account{id,username}' }
        });
        await ref.update({
            pageName: String(page.name || connection.pageName).slice(0, 180),
            instagramUserId: page.instagram_business_account?.id || null,
            instagramUsername: String(page.instagram_business_account?.username || '').slice(0, 180),
            lastVerifiedAt: serverTimestamp(),
            reauthorizationRequired: false,
            updatedAt: serverTimestamp()
        });
        const updated = await ref.get();
        return publicConnectionState(updated.data());
    } catch (error) {
        const requiresAuth = Number(error.graphCode) === 190;
        await ref.update({
            reauthorizationRequired: requiresAuth,
            lastVerificationErrorCode: safeErrorCode(error),
            updatedAt: serverTimestamp()
        });
        throw new functions.https.HttpsError(
            requiresAuth ? 'failed-precondition' : 'unavailable',
            requiresAuth ? 'La connexion Meta doit être renouvelée.' : 'Meta ne répond pas pour le moment.',
            { reason: requiresAuth ? 'meta-reauthorization-required' : 'meta-verification-failed' }
        );
    }
}

async function disconnectMetaConnectionHandler(data, context) {
    await checkActiveStrongSuperAdmin(context);
    assertConfirmText(data, 'DECONNECTER META', 'déconnexion');
    await db().collection(CONNECTION_COLLECTION).doc(META_CONNECTION_ID).set({
        status: 'not_connected',
        pageId: admin.firestore.FieldValue.delete(),
        pageName: admin.firestore.FieldValue.delete(),
        instagramUserId: admin.firestore.FieldValue.delete(),
        instagramUsername: admin.firestore.FieldValue.delete(),
        pageToken: admin.firestore.FieldValue.delete(),
        scopes: admin.firestore.FieldValue.delete(),
        candidates: admin.firestore.FieldValue.delete(),
        selectionSessionId: admin.firestore.FieldValue.delete(),
        reauthorizationRequired: false,
        disconnectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }, { merge: true });
    await Promise.all([
        auditMeta('meta_disconnected', context),
        writeSecurityAudit('meta_disconnected', context)
    ]);
    return { connected: false, status: 'not_connected' };
}

function extractProductMedia(product) {
    const candidates = [];
    for (const item of Array.isArray(product.images) ? product.images : []) {
        if (typeof item === 'string') candidates.push(item);
        else candidates.push(item?.url || item?.src || item?.full || '');
    }
    if (candidates.length === 0) candidates.push(product.imageUrl || '');
    return normalizeMediaUrls(candidates);
}

function publicPublicationState(id, publication = {}) {
    const destinations = {};
    for (const key of ['instagram', 'facebook']) {
        const stage = publication.destinations?.[key] || {};
        destinations[key] = {
            requested: stage.requested === true,
            status: String(stage.status || (stage.requested ? 'prepared' : 'skipped')),
            errorCode: String(stage.errorCode || ''),
            updatedAtMillis: stage.updatedAt?.toMillis?.() || null
        };
    }
    return {
        publicationId: id,
        productId: String(publication.productId || ''),
        overallStatus: String(publication.overallStatus || 'prepared'),
        siteStatus: String(publication.siteStatus || 'published'),
        destinations
    };
}

function preparedDestination(requested) {
    return { requested, status: requested ? 'prepared' : 'skipped', updatedAt: serverTimestamp() };
}

async function prepareSocialPublicationHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const [facebookSnap, instagramSnap] = await db().getAll(
        db().collection(CONNECTION_COLLECTION).doc(META_CONNECTION_ID),
        db().collection(CONNECTION_COLLECTION).doc(INSTAGRAM_CONNECTION_ID)
    );
    const facebookConnection = facebookSnap.exists ? facebookSnap.data() : null;
    const instagramConnection = instagramSnap.exists ? instagramSnap.data() : null;
    const collectionName = normalizeProductCollection(data?.collectionName);
    const productId = normalizeFirestoreId(data?.productId, 'Produit');
    let targets;
    let commandId;
    try {
        targets = normalizeTargets(data?.targets);
        commandId = normalizeCommandId(data?.commandId);
    } catch {
        throw new functions.https.HttpsError('invalid-argument', 'Paramètres de publication Meta invalides.');
    }
    const directInstagramAvailable = instagramConnection?.status === 'connected'
        && Boolean(instagramConnection.instagramUserId && instagramConnection.instagramAccessToken);
    const facebookInstagramAvailable = facebookConnection?.status === 'connected'
        && Boolean(facebookConnection.instagramUserId && facebookConnection.pageToken);
    const facebookAvailable = facebookConnection?.status === 'connected'
        && Boolean(facebookConnection.pageId && facebookConnection.pageToken);
    if (targets.instagram && !directInstagramAvailable && !facebookInstagramAvailable) {
        throw new functions.https.HttpsError('failed-precondition', 'Connecte d’abord un compte Instagram professionnel.');
    }
    if (targets.facebook && !facebookAvailable) {
        throw new functions.https.HttpsError('failed-precondition', 'Connecte Facebook pour publier aussi sur la Page.');
    }
    const routing = {
        instagramProvider: targets.instagram
            ? (directInstagramAvailable ? 'instagram_login' : 'facebook_login')
            : '',
        facebookProvider: targets.facebook ? 'facebook_login' : ''
    };
    const productRef = db().doc(`artifacts/${APP_ID}/public/data/${collectionName}/${productId}`);
    const productSnap = await productRef.get();
    const product = productSnap.exists ? productSnap.data() : null;
    if (!product || product.status !== 'published') {
        throw new functions.https.HttpsError('failed-precondition', 'Le meuble doit d’abord être publié sur le site.');
    }
    const mediaUrls = extractProductMedia(product);
    if (mediaUrls.length === 0) {
        throw new functions.https.HttpsError('failed-precondition', 'Ajoute au moins une image publique au meuble.');
    }
    const hashtags = normalizeHashtags(data?.hashtags || '');
    const payload = { productId, collectionName, targets, hashtags, routing };
    const payloadHash = stablePayloadHash(payload);
    const publicationId = publicationDocumentId(commandId);
    const ref = db().collection(PUBLICATION_COLLECTION).doc(publicationId);
    await db().runTransaction(async (transaction) => {
        const existing = await transaction.get(ref);
        if (existing.exists) {
            if (existing.data().payloadHash !== payloadHash) {
                throw new functions.https.HttpsError('already-exists', 'Cette commande de publication est déjà utilisée.');
            }
            return;
        }
        transaction.create(ref, {
            commandId,
            payloadHash,
            productId,
            collectionName,
            routing,
            product: {
                name: String(product.name || '').slice(0, 180),
                description: String(product.description || '').slice(0, 12_000),
                mediaUrls,
                caption: buildSocialCaption({
                    name: product.name,
                    description: product.description,
                    hashtags
                })
            },
            siteStatus: 'published',
            overallStatus: 'prepared',
            destinations: {
                instagram: preparedDestination(targets.instagram),
                facebook: preparedDestination(targets.facebook)
            },
            createdByUid: context.auth.uid,
            createdByEmail: String(context.auth.token.email || '').toLowerCase().slice(0, 320),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    });
    const snap = await ref.get();
    return publicPublicationState(publicationId, snap.data());
}

async function updateDestination(ref, destination, patch) {
    const prefixed = {};
    for (const [key, value] of Object.entries(patch)) prefixed[`destinations.${destination}.${key}`] = value;
    prefixed[`destinations.${destination}.updatedAt`] = serverTimestamp();
    prefixed.updatedAt = serverTimestamp();
    await ref.update(prefixed);
}

async function waitForInstagramContainer(containerId, accessToken, graphHost) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const container = await graphRequest(containerId, {
            token: accessToken,
            host: graphHost,
            params: { fields: 'status_code,status' }
        });
        const statusCode = String(container.status_code || '').toUpperCase();
        if (statusCode === 'FINISHED') return;
        if (['ERROR', 'EXPIRED'].includes(statusCode)) {
            const error = new Error('META_INSTAGRAM_CONTAINER_FAILED');
            error.code = `instagram_container_${statusCode.toLowerCase()}`;
            throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    const error = new Error('META_INSTAGRAM_CONTAINER_TIMEOUT');
    error.code = 'instagram_container_timeout';
    throw error;
}

async function publishInstagram(publication, connection, accessToken, graphHost, ref) {
    const media = publication.product.mediaUrls;
    await updateDestination(ref, 'instagram', { status: 'creating_media', errorCode: admin.firestore.FieldValue.delete() });
    let creationId;
    if (media.length === 1) {
        const created = await graphRequest(`${connection.instagramUserId}/media`, {
            method: 'POST', host: graphHost, token: accessToken, params: { image_url: media[0], caption: publication.product.caption }
        });
        creationId = String(created.id);
        await waitForInstagramContainer(creationId, accessToken, graphHost);
    } else {
        const children = [];
        for (const imageUrl of media) {
            const child = await graphRequest(`${connection.instagramUserId}/media`, {
                method: 'POST', host: graphHost, token: accessToken, params: { image_url: imageUrl, is_carousel_item: 'true' }
            });
            const childId = String(child.id);
            await waitForInstagramContainer(childId, accessToken, graphHost);
            children.push(childId);
        }
        const parent = await graphRequest(`${connection.instagramUserId}/media`, {
            method: 'POST',
            host: graphHost,
            token: accessToken,
            params: { media_type: 'CAROUSEL', children: children.join(','), caption: publication.product.caption }
        });
        creationId = String(parent.id);
        await waitForInstagramContainer(creationId, accessToken, graphHost);
    }
    await updateDestination(ref, 'instagram', { status: 'publishing', creationId });
    const published = await graphRequest(`${connection.instagramUserId}/media_publish`, {
        method: 'POST', host: graphHost, token: accessToken, params: { creation_id: creationId }
    });
    await updateDestination(ref, 'instagram', { status: 'published', remoteId: String(published.id || '') });
}

async function publishFacebook(publication, connection, pageToken, ref) {
    const media = publication.product.mediaUrls;
    await updateDestination(ref, 'facebook', { status: 'creating_media', errorCode: admin.firestore.FieldValue.delete() });
    if (media.length === 1) {
        const published = await graphRequest(`${connection.pageId}/photos`, {
            method: 'POST',
            token: pageToken,
            params: { url: media[0], caption: publication.product.caption, published: 'true' }
        });
        await updateDestination(ref, 'facebook', { status: 'published', remoteId: String(published.post_id || published.id || '') });
        return;
    }
    const attachedMedia = [];
    for (const imageUrl of media) {
        const photo = await graphRequest(`${connection.pageId}/photos`, {
            method: 'POST', token: pageToken, params: { url: imageUrl, published: 'false' }
        });
        attachedMedia.push({ media_fbid: String(photo.id) });
    }
    await updateDestination(ref, 'facebook', { status: 'publishing' });
    const post = await graphRequest(`${connection.pageId}/feed`, {
        method: 'POST',
        token: pageToken,
        params: { message: publication.product.caption, attached_media: JSON.stringify(attachedMedia) }
    });
    await updateDestination(ref, 'facebook', { status: 'published', remoteId: String(post.id || '') });
}

async function acquirePublicationLock(ref, context, requestedDestinations) {
    return db().runTransaction(async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Publication introuvable.');
        const publication = snap.data();
        const lockUntil = publication.lockUntil?.toMillis?.() || 0;
        if (lockUntil > Date.now()) {
            throw new functions.https.HttpsError('aborted', 'Cette publication est déjà en cours.');
        }
        const selected = requestedDestinations || ['instagram', 'facebook'];
        const runnable = selected.filter((destination) => {
            const stage = publication.destinations?.[destination];
            return stage?.requested === true && stage.status !== 'published';
        });
        transaction.update(ref, {
            overallStatus: runnable.length ? 'publishing' : publication.overallStatus,
            lockOwnerUid: context.auth.uid,
            lockUntil: admin.firestore.Timestamp.fromMillis(Date.now() + META_PUBLICATION_LOCK_MS),
            updatedAt: serverTimestamp()
        });
        return { publication, runnable };
    });
}

function normalizeRequestedDestinations(value) {
    if (value === undefined) return null;
    if (!Array.isArray(value) || value.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Destination de reprise invalide.');
    }
    const allowed = Array.from(new Set(value.map(String)));
    if (allowed.some((item) => !['instagram', 'facebook'].includes(item))) {
        throw new functions.https.HttpsError('invalid-argument', 'Destination de reprise invalide.');
    }
    return allowed;
}

async function runSocialPublicationHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const publicationId = normalizeFirestoreId(data?.publicationId, 'Publication');
    const requestedDestinations = normalizeRequestedDestinations(data?.destinations);
    const ref = db().collection(PUBLICATION_COLLECTION).doc(publicationId);
    const { publication, runnable } = await acquirePublicationLock(ref, context, requestedDestinations);
    if (runnable.length === 0) {
        const current = await ref.get();
        return publicPublicationState(publicationId, current.data());
    }
    const [facebookSnap, instagramSnap] = await db().getAll(
        db().collection(CONNECTION_COLLECTION).doc(META_CONNECTION_ID),
        db().collection(CONNECTION_COLLECTION).doc(INSTAGRAM_CONNECTION_ID)
    );
    const facebookConnection = facebookSnap.exists ? facebookSnap.data() : null;
    const instagramConnection = instagramSnap.exists ? instagramSnap.data() : null;
    const encryptionKey = secretValue(META_TOKEN_ENCRYPTION_KEY, 'META_TOKEN_ENCRYPTION_KEY');
    for (const destination of runnable) {
        try {
            if (destination === 'instagram') {
                const useDirectInstagram = publication.routing?.instagramProvider === 'instagram_login';
                const connection = useDirectInstagram ? instagramConnection : facebookConnection;
                const encryptedToken = useDirectInstagram ? connection?.instagramAccessToken : connection?.pageToken;
                if (!connection || connection.status !== 'connected' || !connection.instagramUserId || !encryptedToken) {
                    throw new Error('INSTAGRAM_CONNECTION_UNAVAILABLE');
                }
                const token = decryptToken(encryptedToken, encryptionKey);
                await publishInstagram(
                    publication,
                    connection,
                    token,
                    useDirectInstagram ? 'graph.instagram.com' : 'graph.facebook.com',
                    ref
                );
            }
            if (destination === 'facebook') {
                if (!facebookConnection || facebookConnection.status !== 'connected' || !facebookConnection.pageId || !facebookConnection.pageToken) {
                    throw new Error('FACEBOOK_CONNECTION_UNAVAILABLE');
                }
                const token = decryptToken(facebookConnection.pageToken, encryptionKey);
                await publishFacebook(publication, facebookConnection, token, ref);
            }
        } catch (error) {
            console.error('Meta publication destination failed', {
                destination,
                code: safeErrorCode(error),
                graphTraceId: error?.graphTraceId || null
            });
            await updateDestination(ref, destination, { status: 'failed', errorCode: safeErrorCode(error) });
        }
    }
    const finishedSnap = await ref.get();
    const finished = finishedSnap.data();
    const requested = ['instagram', 'facebook'].filter((key) => finished.destinations?.[key]?.requested === true);
    const publishedCount = requested.filter((key) => finished.destinations?.[key]?.status === 'published').length;
    const overallStatus = publishedCount === requested.length
        ? 'published'
        : publishedCount > 0 ? 'partial_failure' : 'failed';
    await ref.update({
        overallStatus,
        lockUntil: admin.firestore.FieldValue.delete(),
        lockOwnerUid: admin.firestore.FieldValue.delete(),
        completedAt: overallStatus === 'published' ? serverTimestamp() : admin.firestore.FieldValue.delete(),
        updatedAt: serverTimestamp()
    });
    await auditMeta('meta_publication_completed', context, { publicationId, overallStatus });
    const current = await ref.get();
    return publicPublicationState(publicationId, current.data());
}

async function getSocialPublicationStatusHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const publicationId = normalizeFirestoreId(data?.publicationId, 'Publication');
    const snap = await db().collection(PUBLICATION_COLLECTION).doc(publicationId).get();
    if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Publication introuvable.');
    return publicPublicationState(publicationId, snap.data());
}

const callableRuntime = { enforceAppCheck: true, secrets: META_SECRETS, timeoutSeconds: 60, memory: '256MB' };
const publicationRuntime = { enforceAppCheck: true, secrets: PUBLICATION_SECRETS, timeoutSeconds: 300, memory: '512MB' };

const startMetaOAuthAdmin = regionalFunctions().runWith(callableRuntime).https.onCall(startMetaOAuthHandler);
const metaOAuthCallback = regionalFunctions().runWith({ secrets: META_SECRETS, timeoutSeconds: 60, memory: '256MB' }).https.onRequest(metaOAuthCallbackHandler);
const startInstagramOAuthAdmin = regionalFunctions().runWith({ ...callableRuntime, secrets: INSTAGRAM_SECRETS }).https.onCall(startInstagramOAuthHandler);
const instagramOAuthCallback = regionalFunctions().runWith({ secrets: INSTAGRAM_SECRETS, timeoutSeconds: 60, memory: '256MB' }).https.onRequest(instagramOAuthCallbackHandler);
const getMetaConnectionStatusAdmin = regionalFunctions().runWith({ enforceAppCheck: true, secrets: PUBLICATION_SECRETS }).https.onCall(getMetaConnectionStatusHandler);
const getInstagramConnectionStatusAdmin = regionalFunctions().runWith({ enforceAppCheck: true, secrets: PUBLICATION_SECRETS }).https.onCall(getInstagramConnectionStatusHandler);
const selectMetaAssetAdmin = regionalFunctions().runWith({ enforceAppCheck: true, secrets: PUBLICATION_SECRETS }).https.onCall(selectMetaAssetHandler);
const verifyMetaConnectionAdmin = regionalFunctions().runWith({ enforceAppCheck: true, secrets: PUBLICATION_SECRETS }).https.onCall(verifyMetaConnectionHandler);
const disconnectMetaConnectionAdmin = regionalFunctions().runWith({ enforceAppCheck: true, secrets: PUBLICATION_SECRETS }).https.onCall(disconnectMetaConnectionHandler);
const verifyInstagramConnectionAdmin = regionalFunctions().runWith({ enforceAppCheck: true, secrets: PUBLICATION_SECRETS }).https.onCall(verifyInstagramConnectionHandler);
const disconnectInstagramConnectionAdmin = regionalFunctions().runWith({ enforceAppCheck: true, secrets: PUBLICATION_SECRETS }).https.onCall(disconnectInstagramConnectionHandler);
const prepareSocialPublicationAdmin = regionalFunctions().runWith(publicationRuntime).https.onCall(prepareSocialPublicationHandler);
const runSocialPublicationAdmin = regionalFunctions().runWith(publicationRuntime).https.onCall(runSocialPublicationHandler);
const getSocialPublicationStatusAdmin = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(getSocialPublicationStatusHandler);

module.exports = {
    disconnectInstagramConnectionAdmin,
    disconnectMetaConnectionAdmin,
    getInstagramConnectionStatusAdmin,
    getMetaConnectionStatusAdmin,
    getSocialPublicationStatusAdmin,
    instagramOAuthCallback,
    metaOAuthCallback,
    prepareSocialPublicationAdmin,
    runSocialPublicationAdmin,
    selectMetaAssetAdmin,
    startInstagramOAuthAdmin,
    startMetaOAuthAdmin,
    verifyInstagramConnectionAdmin,
    verifyMetaConnectionAdmin
};
