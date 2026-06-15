const crypto = require('crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { getSiteUrl } = require('../../helpers/config');
const { timestampFromNow, SYSTEM_DOC_RETENTION_DAYS } = require('../analytics/constants');

const db = admin.firestore();

const RP_NAME = 'Seconde Vie';
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

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
    const configuredHost = siteUrl ? new URL(siteUrl).hostname : '';
    const allowedHost = (
        url.hostname === configuredHost ||
        url.hostname.endsWith('.hosted.app') ||
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1'
    );

    if (!['https:', 'http:'].includes(url.protocol) || !allowedHost) {
        throw new functions.https.HttpsError('permission-denied', 'Origine passkey non autorisee.');
    }
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
        throw new functions.https.HttpsError('permission-denied', 'Passkey requiert HTTPS.');
    }

    return `${url.protocol}//${url.host}`;
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

exports.generatePasskeyRegistrationOptions = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Connexion requise.');
    }

    const uid = context.auth.uid;
    const email = normalizeEmail(context.auth.token.email || data?.email);
    const origin = getExpectedOrigin(data?.origin);
    const rpID = getRpIdFromOrigin(origin);
    const passkeys = await listUserPasskeys(uid);

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
            userVerification: 'preferred',
        },
    });

    await db.doc(`users/${uid}/passkey_challenges/registration`).set({
        challenge: options.challenge,
        origin,
        rpID,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAtMillis: Date.now() + CHALLENGE_TTL_MS,
        expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS),
    });

    return { options };
});

exports.verifyPasskeyRegistration = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Connexion requise.');
    }

    const uid = context.auth.uid;
    const challengeRef = db.doc(`users/${uid}/passkey_challenges/registration`);
    const challengeSnap = await challengeRef.get();
    if (!challengeSnap.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'Challenge passkey expire.');
    }

    const challenge = challengeSnap.data();
    if (Date.now() > Number(challenge.expiresAtMillis || 0)) {
        await challengeRef.delete();
        throw new functions.https.HttpsError('deadline-exceeded', 'Challenge passkey expire.');
    }

    const verification = await verifyRegistrationResponse({
        response: data?.response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: challenge.origin,
        expectedRPID: challenge.rpID,
        requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo?.credential) {
        throw new functions.https.HttpsError('permission-denied', 'Passkey non valide.');
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    const credentialId = credential.id;
    await db.doc(`users/${uid}/passkeys/${credentialId}`).set({
        credentialId,
        publicKey: toBase64Url(credential.publicKey),
        counter: credential.counter || 0,
        transports: data?.response?.response?.transports || [],
        credentialDeviceType,
        credentialBackedUp,
        email: normalizeEmail(context.auth.token.email || data?.email),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await challengeRef.delete();
    return { success: true };
});

exports.generatePasskeyAuthenticationOptions = functions.https.onCall(async (data) => {
    const email = normalizeEmail(data?.email);
    const origin = getExpectedOrigin(data?.origin);
    const rpID = getRpIdFromOrigin(origin);
    let userRecord;
    try {
        userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
        if (error?.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError('not-found', 'Aucune passkey active pour cet email.');
        }
        console.error('Passkey auth user lookup error:', {
            code: error?.code || null,
            message: error?.message || null,
        });
        throw new functions.https.HttpsError('unavailable', 'Connexion passkey indisponible pour le moment.');
    }
    const passkeys = await listUserPasskeys(userRecord.uid);

    if (passkeys.length === 0) {
        throw new functions.https.HttpsError('not-found', 'Aucune passkey active pour cet email.');
    }

    const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: passkeys.map((passkey) => ({
            id: passkey.credentialId,
            transports: passkey.transports || [],
        })),
        userVerification: 'preferred',
    });

    await db.doc(`sys_ratelimit/passkey_auth_${hash(options.challenge)}`).set({
        email,
        uid: userRecord.uid,
        challenge: options.challenge,
        origin,
        rpID,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAtMillis: Date.now() + CHALLENGE_TTL_MS,
        expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS),
    });

    return { options };
});

exports.verifyPasskeyAuthentication = functions.https.onCall(async (data) => {
    const challenge = String(data?.challenge || '');
    const challengeRef = db.doc(`sys_ratelimit/passkey_auth_${hash(challenge)}`);
    const challengeSnap = await challengeRef.get();
    if (!challengeSnap.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'Challenge passkey expire.');
    }

    const challengeData = challengeSnap.data();
    if (Date.now() > Number(challengeData.expiresAtMillis || 0)) {
        await challengeRef.delete();
        throw new functions.https.HttpsError('deadline-exceeded', 'Challenge passkey expire.');
    }

    const credentialId = data?.response?.id;
    const passkeyRef = db.doc(`users/${challengeData.uid}/passkeys/${credentialId}`);
    const passkeySnap = await passkeyRef.get();
    if (!passkeySnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Passkey inconnue.');
    }

    const passkey = passkeySnap.data();
    const verification = await verifyAuthenticationResponse({
        response: data?.response,
        expectedChallenge: challengeData.challenge,
        expectedOrigin: challengeData.origin,
        expectedRPID: challengeData.rpID,
        credential: toWebAuthnCredential(passkey),
        requireUserVerification: false,
    });

    if (!verification.verified) {
        throw new functions.https.HttpsError('permission-denied', 'Passkey refusee.');
    }

    await passkeyRef.update({
        counter: verification.authenticationInfo.newCounter,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await challengeRef.delete();

    let token;
    try {
        token = await admin.auth().createCustomToken(challengeData.uid, {
            signInProvider: 'passkey',
        });
    } catch (error) {
        console.error('Passkey custom token error:', {
            code: error?.code || null,
            message: error?.message || null,
        });
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Connexion passkey mal configuree cote serveur.'
        );
    }

    return { success: true, token };
});
