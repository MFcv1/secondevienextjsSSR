const crypto = require('crypto');
const admin = require('firebase-admin');
const { onCall } = require('firebase-functions/v2/https');
const { functions, regionalFunctions, logFunctionPerf } = require('../../helpers/runtime');
const { getRateLimitClientIp } = require('../../helpers/clientIp');
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { getSiteUrl } = require('../../helpers/config');

const db = admin.firestore();

const RP_NAME = 'Seconde Vie';
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MAX_PASSKEYS_PER_USER = 10;
const USER_VERIFICATION_REQUIRED_MESSAGE = 'Confirmez votre identite avec Windows Hello, Face ID ou le code de votre appareil.';
const PASSKEY_AUTH_GEN2_RUNTIME = Object.freeze({
    region: 'europe-west1',
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: 'auth-login-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    enforceAppCheck: true
});
const PASSKEY_REGISTRATION_GEN2_RUNTIME = Object.freeze({
    region: 'europe-west1',
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: 'auth-passkey-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    enforceAppCheck: true
});

function mapWebAuthnVerificationError(error, ceremony) {
    const details = String(error?.message || '');
    const isUserVerificationFailure = /user verification|user was not verified/i.test(details);
    console.warn('passkey_verification_rejected', {
        ceremony,
        uv: isUserVerificationFailure ? false : null,
        errorName: error?.name || null,
    });
    return new functions.https.HttpsError(
        'permission-denied',
        isUserVerificationFailure ? USER_VERIFICATION_REQUIRED_MESSAGE : 'Passkey non valide.'
    );
}

function assertUserVerification(verification, ceremony) {
    const verificationInfo = ceremony === 'registration'
        ? verification?.registrationInfo
        : verification?.authenticationInfo;
    const uv = verificationInfo?.userVerified === true;
    console.info('passkey_user_verification', { ceremony, uv });
    if (!uv) {
        throw new functions.https.HttpsError(
            'permission-denied',
            USER_VERIFICATION_REQUIRED_MESSAGE
        );
    }
}
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_CHALLENGE_ATTEMPTS = 5;

function normalizeEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) {
        throw new functions.https.HttpsError('invalid-argument', 'Email invalide.');
    }
    return normalized;
}

function getExpectedOrigin(origin) {
    const normalized = String(origin || '').trim();
    let url;
    try {
        url = new URL(normalized);
    } catch {
        throw new functions.https.HttpsError('invalid-argument', 'Origine passkey invalide.');
    }

    const siteUrl = getSiteUrl();
    const configuredOrigin = siteUrl ? new URL(siteUrl).origin : '';
    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '';
    const environmentOrigins = String(process.env.PASSKEY_ALLOWED_ORIGINS || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => new URL(value).origin);
    const sandboxOrigin = projectId
        ? `https://secondevie-next-sandbox--${projectId}.europe-west4.hosted.app`
        : '';
    const allowedOrigins = new Set([configuredOrigin, sandboxOrigin, ...environmentOrigins].filter(Boolean));
    const isLocalOrigin = ['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol === 'http:';
    const allowedOrigin = allowedOrigins.has(url.origin) || isLocalOrigin;

    if (!['https:', 'http:'].includes(url.protocol) || !allowedOrigin) {
        throw new functions.https.HttpsError('permission-denied', 'Origine passkey non autorisee.');
    }
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
        throw new functions.https.HttpsError('permission-denied', 'Passkey requiert HTTPS.');
    }

    return `${url.protocol}//${url.host}`;
}

function assertBase64Url(value, label, maxLength = 2048) {
    const normalized = String(value || '');
    if (normalized.length < 16 || normalized.length > maxLength || !BASE64URL_PATTERN.test(normalized)) {
        throw new functions.https.HttpsError('invalid-argument', `${label} invalide.`);
    }
    return normalized;
}

function assertCredentialResponse(response) {
    if (!response || typeof response !== 'object' || Array.isArray(response)) {
        throw new functions.https.HttpsError('invalid-argument', 'Reponse passkey invalide.');
    }
    assertBase64Url(response.id, 'Credential passkey');
    if (!response.response || typeof response.response !== 'object') {
        throw new functions.https.HttpsError('invalid-argument', 'Reponse passkey incomplete.');
    }
    return response;
}

function getRpIdFromOrigin(origin) {
    return new URL(origin).hostname;
}

function toBase64Url(value) {
    return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value) {
    return Buffer.from(String(value || ''), 'base64url');
}

function hash(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

async function listUserPasskeys(uid) {
    const snap = await db.collection(`users/${uid}/passkeys`).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

function toWebAuthnCredential(passkey) {
    return {
        id: passkey.credentialId,
        publicKey: fromBase64Url(passkey.publicKey),
        counter: Number(passkey.counter || 0),
        transports: Array.isArray(passkey.transports) ? passkey.transports : [],
    };
}

function hashJson(value) {
    return hash(JSON.stringify(value || null));
}

async function mintPasskeyCustomToken(uid) {
    return admin.auth().createCustomToken(uid, {
        signInProvider: 'passkey',
        authMethod: 'passkey',
        authAssurance: 'aal2',
        userVerified: true,
    });
}

async function resumeFailedTokenMint(operationRef, responseHash) {
    let uid = null;
    await db.runTransaction(async (transaction) => {
        const operationSnap = await transaction.get(operationRef);
        if (!operationSnap.exists) return;
        const operation = operationSnap.data();
        const canResume = operation.status === 'failed_retryable'
            && operation.responseHash === responseHash
            && Date.now() <= Number(operation.expiresAtMillis || 0)
            && Number(operation.retryCount || 0) < 1;
        if (!canResume) return;
        uid = operation.uid;
        transaction.update(operationRef, {
            status: 'issuing',
            retryCount: Number(operation.retryCount || 0) + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    if (!uid) return null;
    try {
        const token = await mintPasskeyCustomToken(uid);
        await operationRef.update({
            status: 'token_issued',
            tokenIssuedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return token;
    } catch (error) {
        await operationRef.update({
            status: 'failed_final',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw error;
    }
}

function getClientIp(context) {
    return getRateLimitClientIp(context);
}

async function consumeRateLimit(key, limit, windowMs = RATE_LIMIT_WINDOW_MS) {
    const ref = db.doc(`sys_ratelimit/passkey_limit_${hash(key)}`);
    const now = Date.now();
    await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref);
        const current = snap.exists ? snap.data() : {};
        const windowStartMillis = Number(current.windowStartMillis || 0);
        const inCurrentWindow = now - windowStartMillis < windowMs;
        const count = inCurrentWindow ? Number(current.count || 0) + 1 : 1;
        if (count > limit) {
            throw new functions.https.HttpsError('resource-exhausted', 'Trop de tentatives. Reessayez plus tard.');
        }
        const expiresAtMillis = now + windowMs;
        transaction.set(ref, {
            count,
            windowStartMillis: inCurrentWindow ? windowStartMillis : now,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expireAt: admin.firestore.Timestamp.fromMillis(expiresAtMillis),
        }, { merge: true });
    });
}

async function recordChallengeAttempt(challengeRef, expectedChallenge = null) {
    const challenge = await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(challengeRef);
        const current = assertActiveChallenge(snap, expectedChallenge);
        const attemptCount = Number(current.attemptCount || 0) + 1;
        if (attemptCount > MAX_CHALLENGE_ATTEMPTS) {
            transaction.delete(challengeRef);
            return null;
        }
        transaction.update(challengeRef, {
            attemptCount,
            lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return current;
    });
    if (!challenge) {
        throw new functions.https.HttpsError('resource-exhausted', 'Trop de tentatives passkey.');
    }
    return challenge;
}

function assertActiveChallenge(challengeSnap, expectedChallenge = null) {
    if (!challengeSnap.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'Challenge passkey expire.');
    }
    const challenge = challengeSnap.data();
    if (challenge.status !== 'active' || (expectedChallenge && challenge.challenge !== expectedChallenge)) {
        throw new functions.https.HttpsError('failed-precondition', 'Challenge passkey deja utilise.');
    }
    if (Date.now() > Number(challenge.expiresAtMillis || 0)) {
        throw new functions.https.HttpsError('deadline-exceeded', 'Challenge passkey expire.');
    }
    return challenge;
}

const generatePasskeyRegistrationOptionsHandler = async (data, context) => {
    const startedAt = Date.now();
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Connexion requise.');
    }

    const uid = context.auth.uid;
    await consumeRateLimit(`registration:${uid}`, 10, 60 * 60 * 1000);
    const email = normalizeEmail(context.auth.token.email || data?.email);
    const origin = getExpectedOrigin(data?.origin);
    const rpID = getRpIdFromOrigin(origin);
    const passkeys = await listUserPasskeys(uid);
    if (passkeys.length >= MAX_PASSKEYS_PER_USER) {
        throw new functions.https.HttpsError('resource-exhausted', 'Nombre maximal de passkeys atteint.');
    }

    const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID,
        userName: email,
        userID: Buffer.from(uid),
        userDisplayName: context.auth.token.name || email,
        attestationType: 'none',
        excludeCredentials: passkeys.map((passkey) => ({
            id: passkey.credentialId,
            transports: passkey.transports || [],
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'required',
        },
    });

    const expiresAtMillis = Date.now() + CHALLENGE_TTL_MS;
    await db.doc(`users/${uid}/passkey_challenges/registration`).set({
        challenge: options.challenge,
        origin,
        rpID,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        attemptCount: 0,
        expiresAtMillis,
        expireAt: admin.firestore.Timestamp.fromMillis(expiresAtMillis),
    });

    logFunctionPerf('generatePasskeyRegistrationOptions', startedAt, { phase: 'success' });
    return { options };
};

exports.generatePasskeyRegistrationOptions = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(generatePasskeyRegistrationOptionsHandler);
exports.generatePasskeyRegistrationOptionsGen2 = onCall(
    PASSKEY_REGISTRATION_GEN2_RUNTIME,
    async (request) => generatePasskeyRegistrationOptionsHandler(request.data, request)
);

const verifyPasskeyRegistrationHandler = async (data, context) => {
    const startedAt = Date.now();
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Connexion requise.');
    }

    const uid = context.auth.uid;
    const challengeRef = db.doc(`users/${uid}/passkey_challenges/registration`);
    const challengeSnap = await challengeRef.get();
    if (!challengeSnap.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'Challenge passkey expire.');
    }

    let challenge;
    try {
        challenge = await recordChallengeAttempt(challengeRef);
    } catch (error) {
        if (error.code === 'deadline-exceeded') await challengeRef.delete();
        throw error;
    }

    const response = assertCredentialResponse(data?.response);
    let verification;
    try {
        verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: challenge.challenge,
            expectedOrigin: challenge.origin,
            expectedRPID: challenge.rpID,
            requireUserVerification: true,
        });
    } catch (error) {
        throw mapWebAuthnVerificationError(error, 'registration');
    }

    if (!verification.verified || !verification.registrationInfo?.credential) {
        throw new functions.https.HttpsError('permission-denied', 'Passkey non valide.');
    }
    assertUserVerification(verification, 'registration');

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    const credentialId = credential.id;
    const passkeyRef = db.doc(`users/${uid}/passkeys/${credentialId}`);
    await db.runTransaction(async (transaction) => {
        const freshChallengeSnap = await transaction.get(challengeRef);
        assertActiveChallenge(freshChallengeSnap, challenge.challenge);
        transaction.set(passkeyRef, {
            credentialId,
            publicKey: toBase64Url(credential.publicKey),
            counter: credential.counter || 0,
            transports: Array.isArray(response.response.transports) ? response.response.transports.slice(0, 8) : [],
            credentialDeviceType,
            credentialBackedUp,
            email: normalizeEmail(context.auth.token.email || data?.email),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        transaction.delete(challengeRef);
    });
    logFunctionPerf('verifyPasskeyRegistration', startedAt, { phase: 'success' });
    return { success: true };
};

exports.verifyPasskeyRegistration = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(verifyPasskeyRegistrationHandler);
exports.verifyPasskeyRegistrationGen2 = onCall(
    PASSKEY_REGISTRATION_GEN2_RUNTIME,
    async (request) => verifyPasskeyRegistrationHandler(request.data, request)
);

const generatePasskeyAuthenticationOptionsHandler = async (data, context) => {
    const startedAt = Date.now();
    const email = normalizeEmail(data?.email);
    const emailHash = hash(email);
    await Promise.all([
        consumeRateLimit(`authentication-ip:${getClientIp(context)}`, 20),
        consumeRateLimit(`authentication-email:${emailHash}`, 10),
    ]);
    const origin = getExpectedOrigin(data?.origin);
    const rpID = getRpIdFromOrigin(origin);
    let userRecord = null;
    try {
        userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
        if (error?.code === 'auth/user-not-found') userRecord = null;
        else {
        console.error('Passkey auth user lookup error:', {
            code: error?.code || null,
            message: error?.message || null,
        });
        throw new functions.https.HttpsError('unavailable', 'Connexion passkey indisponible pour le moment.');
        }
    }
    const passkeys = userRecord ? await listUserPasskeys(userRecord.uid) : [];
    const publicCredentials = passkeys.length > 0 ? passkeys : [{
        credentialId: crypto.randomBytes(32).toString('base64url'),
        transports: [],
    }];

    const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: publicCredentials.map((passkey) => ({
            id: passkey.credentialId,
            transports: passkey.transports || [],
        })),
        userVerification: 'required',
    });

    const expiresAtMillis = Date.now() + CHALLENGE_TTL_MS;
    await db.doc(`sys_ratelimit/passkey_auth_${hash(options.challenge)}`).set({
        uid: userRecord?.uid || null,
        challenge: options.challenge,
        origin,
        rpID,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        attemptCount: 0,
        expiresAtMillis,
        expireAt: admin.firestore.Timestamp.fromMillis(expiresAtMillis),
    });

    logFunctionPerf('generatePasskeyAuthenticationOptions', startedAt, {
        phase: 'success',
        emailHash
    });
    return { options };
};

exports.generatePasskeyAuthenticationOptions = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(generatePasskeyAuthenticationOptionsHandler);
exports.generatePasskeyAuthenticationOptionsGen2 = onCall(
    PASSKEY_AUTH_GEN2_RUNTIME,
    async (request) => generatePasskeyAuthenticationOptionsHandler(request.data, request)
);

const verifyPasskeyAuthenticationHandler = async (data, context) => {
    const startedAt = Date.now();
    const challenge = assertBase64Url(data?.challenge, 'Challenge passkey', 1024);
    const challengeRef = db.doc(`sys_ratelimit/passkey_auth_${hash(challenge)}`);
    const operationRef = db.doc(`sys_ratelimit/passkey_operation_${hash(challenge)}`);
    const response = assertCredentialResponse(data?.response);
    const responseHash = hashJson(response);
    await consumeRateLimit(`verification-ip:${getClientIp(context)}`, 30);
    const challengeSnap = await challengeRef.get();
    if (!challengeSnap.exists) {
        try {
            const resumedToken = await resumeFailedTokenMint(operationRef, responseHash);
            if (resumedToken) return { success: true, token: resumedToken, resumed: true };
        } catch (error) {
            console.error('Passkey custom token retry error:', { code: error?.code || null });
        }
        throw new functions.https.HttpsError('failed-precondition', 'Challenge passkey expire.');
    }

    const challengeData = await recordChallengeAttempt(challengeRef, challenge);
    if (challengeData.status !== 'active' || !challengeData.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Connexion passkey refusee.');
    }
    if (Date.now() > Number(challengeData.expiresAtMillis || 0)) {
        await challengeRef.delete();
        throw new functions.https.HttpsError('deadline-exceeded', 'Challenge passkey expire.');
    }

    const credentialId = response.id;
    const passkeyRef = db.doc(`users/${challengeData.uid}/passkeys/${credentialId}`);
    const passkeySnap = await passkeyRef.get();
    if (!passkeySnap.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Connexion passkey refusee.');
    }

    const passkey = passkeySnap.data();
    let verification;
    try {
        verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge: challengeData.challenge,
            expectedOrigin: challengeData.origin,
            expectedRPID: challengeData.rpID,
            credential: toWebAuthnCredential(passkey),
            requireUserVerification: true,
        });
    } catch (error) {
        throw mapWebAuthnVerificationError(error, 'authentication');
    }

    if (!verification.verified) {
        throw new functions.https.HttpsError('permission-denied', 'Passkey refusee.');
    }
    assertUserVerification(verification, 'authentication');

    await db.runTransaction(async (transaction) => {
        const [freshChallengeSnap, freshPasskeySnap] = await Promise.all([
            transaction.get(challengeRef),
            transaction.get(passkeyRef),
        ]);
        const freshChallenge = assertActiveChallenge(freshChallengeSnap, challengeData.challenge);
        if (freshChallenge.uid !== challengeData.uid || !freshPasskeySnap.exists) {
            throw new functions.https.HttpsError('permission-denied', 'Connexion passkey refusee.');
        }
        transaction.update(passkeyRef, {
            counter: verification.authenticationInfo.newCounter,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const operationExpiresAtMillis = Date.now() + CHALLENGE_TTL_MS;
        transaction.set(operationRef, {
            uid: challengeData.uid,
            responseHash,
            status: 'verified',
            retryCount: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAtMillis: operationExpiresAtMillis,
            expireAt: admin.firestore.Timestamp.fromMillis(operationExpiresAtMillis),
        });
        transaction.delete(challengeRef);
    });

    let token;
    try {
        token = await mintPasskeyCustomToken(challengeData.uid);
        await operationRef.update({
            status: 'token_issued',
            tokenIssuedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
        await operationRef.update({
            status: 'failed_retryable',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(() => null);
        console.error('Passkey custom token error:', {
            code: error?.code || null,
            message: error?.message || null,
        });
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Connexion passkey mal configuree cote serveur.'
        );
    }

    logFunctionPerf('verifyPasskeyAuthentication', startedAt, { phase: 'success' });
    return { success: true, token };
};

exports.verifyPasskeyAuthentication = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(verifyPasskeyAuthenticationHandler);
exports.verifyPasskeyAuthenticationGen2 = onCall(
    PASSKEY_AUTH_GEN2_RUNTIME,
    async (request) => verifyPasskeyAuthenticationHandler(request.data, request)
);

module.exports.generatePasskeyAuthenticationOptionsHandler = generatePasskeyAuthenticationOptionsHandler;
module.exports.verifyPasskeyAuthenticationHandler = verifyPasskeyAuthenticationHandler;
module.exports.generatePasskeyRegistrationOptionsHandler = generatePasskeyRegistrationOptionsHandler;
module.exports.verifyPasskeyRegistrationHandler = verifyPasskeyRegistrationHandler;
module.exports.PASSKEY_AUTH_GEN2_RUNTIME = PASSKEY_AUTH_GEN2_RUNTIME;
module.exports.PASSKEY_REGISTRATION_GEN2_RUNTIME = PASSKEY_REGISTRATION_GEN2_RUNTIME;
