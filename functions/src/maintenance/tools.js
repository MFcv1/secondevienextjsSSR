/**
 * MAINTENANCE: Outils admin (Garbage Collector, Purge Users, Reset Stats, etc.)
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const {
    assertConfirmText,
    checkActiveStrongAdmin,
    checkActiveStrongSuperAdmin,
    getSuperAdminEmail,
    normalizeProductCollection,
    normalizeImageContentType,
    sanitizeStorageFileName,
    writeSecurityAudit
} = require('../../helpers/security');
const { APP_ID, PRODUCT_COLLECTIONS } = require('../../helpers/config');
const { collectStoragePaths } = require('../triggers/mediaCleanup');
const { regionalFunctions } = require('../../helpers/runtime');
const { assertLegacyMutationBlocked } = require('../commerce/legacyContainment');
const db = admin.firestore();

// --- RESET STATS (Compteurs produits) ---
exports.resetAllStats = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(async (data, context) => {
    void data;
    void context;
    assertLegacyMutationBlocked(functions, 'resetAllStats');
});

// --- GARBAGE COLLECTOR (Storage orphelin) ---
exports.runGarbageCollector = regionalFunctions().runWith({ enforceAppCheck: true, timeoutSeconds: 540, memory: '1GB' }).https.onCall(async (data, context) => {
    assertLegacyMutationBlocked(functions, 'runGarbageCollector');
    await checkActiveStrongAdmin(context);
    assertConfirmText(data, 'NETTOYER CLOUD', 'nettoyage cloud');
    const bucket = admin.storage().bucket();
    let stats = { scanDate: new Date().toISOString(), ghostDocsDeleted: 0, orphanedImagesDeleted: 0, errors: [] };

    try {
        const activeImagePaths = new Set();
        for (const colName of PRODUCT_COLLECTIONS) {
            const colRef = db.collection(`artifacts/${APP_ID}/public/data/${colName}`);
            const allRefs = await colRef.listDocuments();
            const chunkSize = 100;
            for (let i = 0; i < allRefs.length; i += chunkSize) {
                const chunk = allRefs.slice(i, i + chunkSize);
                if (chunk.length === 0) continue;
                const snaps = await db.getAll(...chunk);
                for (const snap of snaps) {
                    if (!snap.exists) continue;
                    collectStoragePaths(snap.data()).forEach(path => activeImagePaths.add(path));
                }
            }
        }

        const foldersToClean = PRODUCT_COLLECTIONS.map(c => `${c}/`);
        for (const folder of foldersToClean) {
            const [files] = await bucket.getFiles({ prefix: folder });
            for (const file of files) {
                if (!activeImagePaths.has(file.name)) {
                    try {
                        await file.delete();
                        stats.orphanedImagesDeleted++;
                    } catch { stats.errors.push(file.name); }
                }
            }
        }
        await writeSecurityAudit('maintenance.run_garbage_collector', context, { stats });
        return { success: true, stats };
    } catch (error) {
        console.error("Critical GC Error:", error);
        throw new functions.https.HttpsError('internal', 'Nettoyage de maintenance impossible.');
    }
});

// --- PURGE UTILISATEURS (Super Admin) ---
exports.resetAllUsers = regionalFunctions().runWith({ enforceAppCheck: true, timeoutSeconds: 540, memory: '1GB' }).https.onCall(async (data, context) => {
    assertLegacyMutationBlocked(functions, 'resetAllUsers');
    await checkActiveStrongSuperAdmin(context);
    assertConfirmText(data, 'PURGER CLIENTS', 'purge clients');
    try {
        const superAdminEmail = getSuperAdminEmail();
        let nextPageToken;
        let usersDeleted = 0;
        const preservedUids = [];
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            const toDelete = [];
            for (const user of listUsersResult.users) {
                if (superAdminEmail && String(user.email || '').trim().toLowerCase() === superAdminEmail) {
                    preservedUids.push(user);
                    continue;
                }
                toDelete.push(user.uid);
            }
            if (toDelete.length > 0) {
                await admin.auth().deleteUsers(toDelete);
                usersDeleted += toDelete.length;
            }
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        await writeSecurityAudit('maintenance.reset_all_users', context, {
            usersDeleted,
            preservedCount: preservedUids.length
        });
        return { success: true, count: usersDeleted, message: `${usersDeleted} comptes supprimés.` };
    } catch (error) {
        console.error("❌ Erreur Purge :", error);
        throw new functions.https.HttpsError('internal', 'Purge utilisateurs impossible.');
    }
});

// --- PURGE ANONYMES ---
exports.purgeAnonymousUsers = regionalFunctions().runWith({ enforceAppCheck: true, timeoutSeconds: 540, memory: '1GB' }).https.onCall(async (data, context) => {
    assertLegacyMutationBlocked(functions, 'purgeAnonymousUsers');
    await checkActiveStrongSuperAdmin(context);
    assertConfirmText(data, 'PURGER ANONYMES', 'purge anonymes');
    try {
        let nextPageToken;
        let totalDeleted = 0;
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            const usersToDelete = [];
            for (const user of listUsersResult.users) {
                if (!user.email && user.providerData.length === 0) {
                    usersToDelete.push(user.uid);
                }
            }
            if (usersToDelete.length > 0) {
                const cleanupRes = await admin.auth().deleteUsers(usersToDelete);
                totalDeleted += cleanupRes.successCount;
            }
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);
        await writeSecurityAudit('maintenance.purge_anonymous_users', context, { totalDeleted });
        return { success: true, count: totalDeleted };
    } catch {
        throw new functions.https.HttpsError('internal', 'Purge utilisateurs anonymes impossible.');
    }
});

// --- PURGE MEUBLES (Tous les produits + images + sous-collections) ---
exports.purgeAllProducts = regionalFunctions().runWith({ enforceAppCheck: true, timeoutSeconds: 540, memory: '1GB' }).https.onCall(async (data, context) => {
    assertLegacyMutationBlocked(functions, 'purgeAllProducts');
    await checkActiveStrongSuperAdmin(context);
    assertConfirmText(data, 'PURGER MEUBLES', 'purge meubles');
    const bucket = admin.storage().bucket();
    let totalDocsDeleted = 0;
    let totalImagesDeleted = 0;

    try {
        for (const colName of PRODUCT_COLLECTIONS) {
            const colRef = db.collection(`artifacts/${APP_ID}/public/data/${colName}`);
            const snapshot = await colRef.get();

            for (const doc of snapshot.docs) {
                const docData = doc.data();

                // 1. Supprimer les images Storage manuellement (le trigger onDelete peut être lent)
                const imageUrls = [...(docData.images || []), ...(docData.thumbnails || [])];
                for (const url of imageUrls) {
                    try {
                        const pathMatch = url.match(/\/o\/(.+?)\?/);
                        if (pathMatch) {
                            await bucket.file(decodeURIComponent(pathMatch[1])).delete();
                            totalImagesDeleted++;
                        }
                    } catch (e) { if (e.code !== 404) console.error(`Erreur image:`, e.message); }
                }

                // 2. Supprimer le document produit lui-même
                await doc.ref.delete();
                totalDocsDeleted++;
            }
        }

        // 3. Nettoyage final: supprimer tout fichier restant dans les dossiers Storage
        for (const colName of PRODUCT_COLLECTIONS) {
            const [files] = await bucket.getFiles({ prefix: `${colName}/` });
            for (const file of files) {
                try { await file.delete(); totalImagesDeleted++; } catch { /* ignore */ }
            }
        }

        await writeSecurityAudit('maintenance.purge_all_products', context, {
            totalDocsDeleted,
            totalImagesDeleted
        });

        return {
            success: true,
            docsDeleted: totalDocsDeleted,
            imagesDeleted: totalImagesDeleted,
            message: `${totalDocsDeleted} produits et ${totalImagesDeleted} images supprimés.`
        };
    } catch (error) {
        console.error("❌ Erreur Purge Produits:", error);
        throw new functions.https.HttpsError('internal', 'Purge produits impossible.');
    }
});

// --- PURGE COMMANDES ---
exports.resetAllOrders = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(async (data, context) => {
    assertLegacyMutationBlocked(functions, 'resetAllOrders');
    await checkActiveStrongSuperAdmin(context);
    assertConfirmText(data, 'PURGER COMMANDES', 'purge commandes');
    try {
        const ordersSnap = await db.collection('orders').get();
        const batch = db.batch();
        ordersSnap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        await writeSecurityAudit('maintenance.reset_all_orders', context, { count: ordersSnap.size });
        return { success: true, count: ordersSnap.size };
    } catch {
        throw new functions.https.HttpsError('internal', 'Purge commandes impossible.');
    }
});

// --- UPLOAD SÉCURISÉ (URL Signée) ---
exports.getUploadUrl = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(async (data, context) => {
    await checkActiveStrongAdmin(context);
    const { fileName, contentType, collectionName } = data;
    if (!fileName || !contentType) throw new functions.https.HttpsError('invalid-argument', 'Params manquants.');

    const bucket = admin.storage().bucket();
    const safeCollectionName = normalizeProductCollection(collectionName || 'furniture');
    const safeFileName = sanitizeStorageFileName(fileName);
    const safeContentType = normalizeImageContentType(contentType);
    const filePath = `${safeCollectionName}/${safeFileName}`;
    const file = bucket.file(filePath);

    try {
        const [url] = await file.getSignedUrl({
            action: 'write',
            version: 'v4',
            expires: Date.now() + 15 * 60 * 1000,
            contentType: safeContentType
        });
        return { success: true, uploadUrl: url, filePath: filePath };
    } catch {
        throw new functions.https.HttpsError('internal', 'Generation URL upload impossible.');
    }
});
