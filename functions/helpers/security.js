/**
 * HELPERS: Sécurité centralisée
 * Fonctions de vérification admin/super-admin réutilisables.
 */
const functions = require('firebase-functions/v1');
const { PRODUCT_COLLECTIONS } = require('./config');

// ⚠️ CONFIGURER: Email du Super Admin (doit correspondre à VITE_SUPER_ADMIN_EMAIL)
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || '';

/**
 * Vérifie que l'appelant est un Admin (Custom Claim ou Super Admin email)
 * @throws {HttpsError} si non-admin
 * @returns {{ isSuper: boolean }} info sur le statut
 */
function checkIsAdmin(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const email = context.auth.token.email;
    const isAdminClaim = context.auth.token.admin === true;
    const isSuperEmail = Boolean(SUPER_ADMIN_EMAIL) && email === SUPER_ADMIN_EMAIL;

    if (!isAdminClaim && !isSuperEmail) {
        throw new functions.https.HttpsError('permission-denied', 'Accès refusé : droits administrateur requis.');
    }
    return { isSuper: isSuperEmail };
}

/**
 * Vérifie que l'appelant est LE Super Admin
 * @throws {HttpsError} si non-super-admin
 */
function checkIsSuperAdmin(context) {
    if (!context.auth || !SUPER_ADMIN_EMAIL || context.auth.token.email !== SUPER_ADMIN_EMAIL) {
        throw new functions.https.HttpsError('permission-denied', 'Accès refusé : Super Admin uniquement.');
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
    normalizeProductCollection,
    normalizeFirestoreId,
    normalizeQuantity,
    normalizeImageContentType,
    sanitizeStorageFileName,
    SUPER_ADMIN_EMAIL
};
