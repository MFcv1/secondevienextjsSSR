/**
 * MAINTENANCE: Outils admin (Garbage Collector, Purge Users, Reset Stats, etc.)
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const {
    checkIsAdmin,
    checkIsSuperAdmin,
    normalizeProductCollection,
    normalizeImageContentType,
    sanitizeStorageFileName,
    SUPER_ADMIN_EMAIL
} = require('../../helpers/security');
const { APP_ID, PRODUCT_COLLECTIONS } = require('../../helpers/config');
const { collectStoragePaths } = require('../triggers/mediaCleanup');
const db = admin.firestore();

// --- RESET STATS (Compteurs produits) ---
exports.resetAllStats = functions.https.onCall(async (data, context) => {
    checkIsSuperAdmin(context);
    let totalOp = 0;
    try {
        for (const colName of PRODUCT_COLLECTIONS) {
            const itemsRef = db.collection(`artifacts/${APP_ID}/public/data/${colName}`);
            const itemsSnap = await itemsRef.get();
            const itemPromises = itemsSnap.docs.map(async (itemDoc) => {
                const batch = db.batch();
                let opCount = 0;
                const subCollections = ['likes', 'comments'];
                for (const sub of subCollections) {
                    const subSnap = await itemDoc.ref.collection(sub).get();
                    subSnap.forEach(d => { batch.delete(d.ref); opCount++; });
                }
                batch.update(itemDoc.ref, {
                    likeCount: 0, shareCount: 0
                });
                if (opCount > 0) { await batch.commit(); return opCount; }
                return 0;
            });
            const results = await Promise.all(itemPromises);
            totalOp += results.reduce((acc, curr) => acc + curr, 0);
        }
        return { success: true, count: totalOp };
    } catch (error) {
        console.error("Erreur Reset Stats:", error);
        throw new functions.https.HttpsError('internal', "Erreur lors du nettoyage.");
    }
});

// --- GARBAGE COLLECTOR (Storage orphelin) ---
exports.runGarbageCollector = functions.runWith({ timeoutSeconds: 540, memory: '1GB' }).https.onCall(async (data, context) => {
    checkIsAdmin(context);
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
                    if (!snap.exists) {
                        const subs = ['likes', 'comments'];
                        let ops = 0;
                        const batch = db.batch();
                        for (const sub of subs) {
                            const subDocs = await snap.ref.collection(sub).get();
                            subDocs.forEach(d => { batch.delete(d.ref); ops++; });
                        }
                        if (ops > 0) { await batch.commit(); stats.ghostDocsDeleted++; }
                    } else {
                        collectStoragePaths(snap.data()).forEach(path => activeImagePaths.add(path));
                    }
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
                    } catch (e) { stats.errors.push(file.name); }
                }
            }
        }
        return { success: true, stats };
    } catch (error) {
        console.error("Critical GC Error:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// --- PURGE UTILISATEURS (Super Admin) ---
exports.resetAllUsers = functions.runWith({ timeoutSeconds: 540, memory: '1GB' }).https.onCall(async (data, context) => {
    checkIsSuperAdmin(context);
    try {
        let nextPageToken;
        let usersDeleted = 0;
        const preservedUids = [];
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            const toDelete = [];
            for (const user of listUsersResult.users) {
                if (user.email === SUPER_ADMIN_EMAIL) {
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

        return { success: true, count: usersDeleted, message: `${usersDeleted} comptes supprimés.` };
    } catch (error) {
        console.error("❌ Erreur Purge :", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// --- PURGE ANONYMES ---
exports.purgeAnonymousUsers = functions.runWith({ timeoutSeconds: 540, memory: '1GB' }).https.onCall(async (data, context) => {
    checkIsSuperAdmin(context);
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
        return { success: true, count: totalDeleted };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// --- PURGE MEUBLES (Tous les produits + images + sous-collections) ---
exports.purgeAllProducts = functions.runWith({ timeoutSeconds: 540, memory: '1GB' }).https.onCall(async (data, context) => {
    checkIsSuperAdmin(context);
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

                // 2. Supprimer les sous-collections
                const subCollections = ['likes', 'comments'];
                for (const sub of subCollections) {
                    const subSnap = await doc.ref.collection(sub).get();
                    if (!subSnap.empty) {
                        const batch = db.batch();
                        subSnap.forEach(d => batch.delete(d.ref));
                        await batch.commit();
                    }
                }

                // 3. Supprimer le document produit lui-même
                await doc.ref.delete();
                totalDocsDeleted++;
            }
        }

        // 4. Nettoyage final: supprimer tout fichier restant dans les dossiers Storage
        for (const colName of PRODUCT_COLLECTIONS) {
            const [files] = await bucket.getFiles({ prefix: `${colName}/` });
            for (const file of files) {
                try { await file.delete(); totalImagesDeleted++; } catch (e) { /* ignore */ }
            }
        }

        return {
            success: true,
            docsDeleted: totalDocsDeleted,
            imagesDeleted: totalImagesDeleted,
            message: `${totalDocsDeleted} produits et ${totalImagesDeleted} images supprimés.`
        };
    } catch (error) {
        console.error("❌ Erreur Purge Produits:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// --- PURGE COMMANDES ---
exports.resetAllOrders = functions.https.onCall(async (data, context) => {
    checkIsSuperAdmin(context);
    try {
        const ordersSnap = await db.collection('orders').get();
        const batch = db.batch();
        ordersSnap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return { success: true, count: ordersSnap.size };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// --- UPLOAD SÉCURISÉ (URL Signée) ---
exports.getUploadUrl = functions.https.onCall(async (data, context) => {
    checkIsAdmin(context);
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
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
