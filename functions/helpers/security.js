/**
 * HELPERS: Sécurité centralisée
 * Fonctions de vérification admin/super-admin réutilisables.
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('node:crypto');
const { PRODUCT_COLLECTIONS } = require('./config');
const { AUDIT_RETENTION_DAYS, timestampAfterDays } = require('./retention');

const SECURITY_AUDIT_COLLECTION = 'sys_audit_security';
const ADMIN_ACCESS_COLLECTION = 'sys_admin_access';

// ⚠️ CONFIGURER: Email du Super Admin (doit correspondre à VITE_SUPER_ADMIN_EMAIL)
function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function getSuperAdminEmail() {
    try {
        const { SUPER_ADMIN_EMAIL } = require('./secrets');
        return normalizeEmail(process.env.SUPER_ADMIN_EMAIL || SUPER_ADMIN_EMAIL.value());
    } catch {
        return normalizeEmail(process.env.SUPER_ADMIN_EMAIL);
    }
}

function logAuthorizationDenial(reason, context) {
    const uid = context.auth?.uid || '';
    console.warn('Security authorization denied', {
        reason,
        authenticated: Boolean(context.auth),
        uidHash: uid ? crypto.createHash('sha256').update(uid).digest('hex').slice(0, 16) : null
    });
}

/**
 * Vérifie que l'appelant est un Admin via un Custom Claim.
 * @throws {HttpsError} si non-admin
 * @returns {{ isSuper: boolean }} info sur le statut
 */
function checkIsAdmin(context) {
    if (!context.auth) {
        logAuthorizationDenial('authentication-required', context);
        throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const isAdminClaim = context.auth.token.admin === true;
    const isSuperClaim = context.auth.token.superAdmin === true;

    if (!isAdminClaim && !isSuperClaim) {
        logAuthorizationDenial('admin-claim-required', context);
        throw new functions.https.HttpsError('permission-denied', 'Accès refusé : droits administrateur requis.');
    }
    return { isSuper: isSuperClaim };
}

/**
 * Vérifie que l'appelant est LE Super Admin
 * @throws {HttpsError} si non-super-admin
 */
function checkIsSuperAdmin(context) {
    if (!context.auth) {
        logAuthorizationDenial('authentication-required', context);
        throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const isSuperClaim = context.auth.token.superAdmin === true;
    if (!isSuperClaim) {
        logAuthorizationDenial('super-admin-claim-required', context);
        throw new functions.https.HttpsError('permission-denied', 'Accès refusé : Super Admin uniquement.');
    }
}

function getAuthAssurance(context) {
    if (!context.auth) {
        return { level: 'none', method: null, userVerified: false };
    }

    const token = context.auth.token || {};
    const firebaseProvider = token.firebase?.sign_in_provider || null;
    const claimedMethod = token.authMethod || token.signInProvider || null;
    const isVerifiedPasskey = claimedMethod === 'passkey'
        && token.authAssurance === 'aal2'
        && token.userVerified === true;
    const isGoogle = firebaseProvider === 'google.com';

    if (isVerifiedPasskey) {
        return { level: 'aal2', method: 'passkey', userVerified: true };
    }
    if (isGoogle) {
        return { level: 'aal2', method: 'google', userVerified: true };
    }

    return {
        level: 'aal1',
        method: claimedMethod || firebaseProvider || 'unknown',
        userVerified: false
    };
}

function checkStrongAdmin(context) {
    const adminInfo = checkIsAdmin(context);
    const assurance = getAuthAssurance(context);
    if (assurance.level !== 'aal2') {
        logAuthorizationDenial('aal2-required', context);
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Confirmez votre identite avec une passkey ou Google pour ouvrir l administration.',
            { reason: 'strong-auth-required', requiredAssurance: 'aal2' }
        );
    }
    return { ...adminInfo, assurance };
}

function checkStrongSuperAdmin(context) {
    checkIsSuperAdmin(context);
    const assurance = getAuthAssurance(context);
    if (assurance.level !== 'aal2') {
        logAuthorizationDenial('aal2-required', context);
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Confirmez votre identite avec une passkey ou Google avant cette action sensible.',
            { reason: 'strong-auth-required', requiredAssurance: 'aal2' }
        );
    }
    return { assurance };
}

// The configured owner email is accepted only for the one-time bootstrap that
// creates claims and the active owner registry. It is never an operational role.
function checkConfiguredSuperAdminBootstrap(context) {
    if (!context.auth) {
        logAuthorizationDenial('bootstrap-authentication-required', context);
        throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const configuredEmail = getSuperAdminEmail();
    const callerEmail = normalizeEmail(context.auth.token.email);
    if (
        !configuredEmail
        || context.auth.token.email_verified !== true
        || callerEmail !== configuredEmail
    ) {
        logAuthorizationDenial('configured-owner-required', context);
        throw new functions.https.HttpsError('permission-denied', 'Bootstrap proprietaire refuse.');
    }
    const assurance = getAuthAssurance(context);
    if (assurance.level !== 'aal2') {
        logAuthorizationDenial('bootstrap-aal2-required', context);
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Confirmez votre identite avec une passkey ou Google avant le bootstrap.',
            { reason: 'strong-auth-required', requiredAssurance: 'aal2' }
        );
    }
    return { assurance };
}

async function getActiveAdminAccess(context, { requireOwner = false } = {}) {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
    }

    const accessSnap = await admin.firestore()
        .collection(ADMIN_ACCESS_COLLECTION)
        .doc(context.auth.uid)
        .get();
    const access = accessSnap.exists ? accessSnap.data() : null;
    if (!access || access.active !== true) {
        logAuthorizationDenial('admin-access-inactive', context);
        throw new functions.https.HttpsError(
            'permission-denied',
            'Acces administrateur retire ou non active.',
            { reason: 'admin-access-inactive' }
        );
    }
    if (requireOwner && access.role !== 'owner') {
        logAuthorizationDenial('owner-access-required', context);
        throw new functions.https.HttpsError(
            'permission-denied',
            'Acces proprietaire requis.',
            { reason: 'owner-access-required' }
        );
    }
    return access;
}

async function checkActiveStrongAdmin(context) {
    const result = checkStrongAdmin(context);
    const access = await getActiveAdminAccess(context);
    return { ...result, access };
}

async function checkActiveStrongSuperAdmin(context) {
    const result = checkStrongSuperAdmin(context);
    const access = await getActiveAdminAccess(context, { requireOwner: true });
    return { ...result, access };
}

function assertConfirmText(data, expectedText, label = 'confirmation') {
    const provided = String(data?.confirmText || '').trim();
    if (provided !== expectedText) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            `Phrase de ${label} invalide.`
        );
    }
}

function getCallerAuditInfo(context) {
    const email = normalizeEmail(context.auth?.token?.email);
    const ip = String(context.rawRequest?.headers?.['x-forwarded-for'] || context.rawRequest?.ip || '').slice(0, 180);
    const userAgent = String(context.rawRequest?.headers?.['user-agent'] || '').slice(0, 500);
    const hash = (value) => value
        ? crypto.createHash('sha256').update(String(value)).digest('hex')
        : null;
    return {
        uid: context.auth?.uid || null,
        emailHash: hash(email),
        isAdmin: context.auth?.token?.admin === true,
        isSuperAdmin: context.auth?.token?.superAdmin === true,
        authTime: context.auth?.token?.auth_time || null,
        ipHash: hash(ip),
        userAgentHash: hash(userAgent)
    };
}

async function writeSecurityAudit(eventType, context, payload = {}) {
    try {
        await admin.firestore().collection(SECURITY_AUDIT_COLLECTION).add({
            eventType,
            caller: getCallerAuditInfo(context),
            payload,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expireAt: timestampAfterDays(AUDIT_RETENTION_DAYS)
        });
    } catch (error) {
        console.error('Security audit write failed:', {
            eventType,
            code: String(error?.code || error?.name || 'unknown').slice(0, 120)
        });
    }
}

function normalizeProductCollection(collectionName = 'furniture') {
    if (typeof collectionName !== 'string' || !PRODUCT_COLLECTIONS.includes(collectionName)) {
        throw new functions.https.HttpsError('invalid-argument', 'Collection produit invalide.');
    }
    return collectionName;
}

function normalizeFirestoreId(value, label = 'Identifiant') {
    if (typeof value !== 'string' || value.length < 1 || value.length > 160 || value.includes('/')) {
        throw new functions.https.HttpsError('invalid-argument', `${label} invalide.`);
    }
    return value;
}

function normalizeQuantity(value, max = 20) {
    const quantity = Number(value ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > max) {
        throw new functions.https.HttpsError('invalid-argument', 'Quantite invalide.');
    }
    return quantity;
}

function normalizeImageContentType(contentType) {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
    if (typeof contentType !== 'string' || !allowed.has(contentType.toLowerCase())) {
        throw new functions.https.HttpsError('invalid-argument', 'Type de fichier image non autorise.');
    }
    return contentType.toLowerCase();
}

function sanitizeStorageFileName(fileName) {
    if (typeof fileName !== 'string' || fileName.length < 1 || fileName.length > 180) {
        throw new functions.https.HttpsError('invalid-argument', 'Nom de fichier invalide.');
    }
    if (fileName.includes('/') || fileName.includes('\\') || fileName === '.' || fileName === '..') {
        throw new functions.https.HttpsError('invalid-argument', 'Chemin de fichier interdit.');
    }
    const safeName = fileName.replace(/[^A-Za-z0-9._-]/g, '_');
    if (!safeName || safeName.startsWith('.')) {
        throw new functions.https.HttpsError('invalid-argument', 'Nom de fichier invalide.');
    }
    return safeName;
}

module.exports = {
    checkIsAdmin,
    checkIsSuperAdmin,
    getAuthAssurance,
    checkStrongAdmin,
    checkStrongSuperAdmin,
    checkConfiguredSuperAdminBootstrap,
    getActiveAdminAccess,
    checkActiveStrongAdmin,
    checkActiveStrongSuperAdmin,
    assertConfirmText,
    getCallerAuditInfo,
    writeSecurityAudit,
    normalizeProductCollection,
    normalizeFirestoreId,
    normalizeQuantity,
    normalizeImageContentType,
    sanitizeStorageFileName,
    normalizeEmail,
    getSuperAdminEmail,
    get SUPER_ADMIN_EMAIL() {
        return getSuperAdminEmail();
    }
};
