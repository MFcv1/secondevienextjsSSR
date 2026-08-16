'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const logger = require('firebase-functions/logger');
const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const sharp = require('sharp');
const { checkActiveStrongAdmin } = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const { commandRepository, mapDomainError } = require('../commerce/v2ProductCommands');
const { normalizeOffer } = require('../commerce/domain/productCommands');
const { enqueueMediaCandidates } = require('../catalog/mediaGarbageCollection');

const REGION = 'europe-west1';
const MEDIA_BUCKET = process.env.PRODUCT_MEDIA_BUCKET || 'secondevienextjsssr.firebasestorage.app';
const MEDIA_TRIGGER_REGION = process.env.PRODUCT_MEDIA_REGION || 'us-central1';
const PRODUCT_PUBLICATION_RUNTIME_SERVICE_ACCOUNT =
    'product-publication-worker@secondevienextjsssr.iam.gserviceaccount.com';
const SESSION_COLLECTION = 'product_publication_sessions';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const FINALIZATION_LEASE_MS = 5 * 60 * 1000;
const STALLED_UPLOAD_MS = 15 * 60 * 1000;
const MAX_PRODUCT_IMAGES = 23;
const ORIGINAL_PATH_PATTERN = /^furniture\/publication-sessions\/([A-Za-z0-9_-]{8,160})\/originals\/(slot-(\d{2}))\/[^/]+$/;

const VARIANT_SPECS = Object.freeze([
    { key: 'thumb320', width: 320, quality: 73, folder: 'thumbnails' },
    { key: 'thumb384', width: 384, quality: 74, folder: 'thumbnails' },
    { key: 'thumb', width: 480, quality: 74, folder: 'thumbnails' },
    { key: 'card', width: 768, quality: 78, folder: 'responsive' },
    { key: 'detailFast', width: 900, quality: 78, folder: 'responsive' },
    { key: 'medium', width: 1024, quality: 80, folder: 'responsive' },
    { key: 'large', width: 1440, quality: 82, folder: 'responsive' },
    { key: 'full', width: 1920, quality: 85, folder: 'responsive' }
]);

function publicationError(code, message = 'Publication produit invalide.') {
    const error = new functions.https.HttpsError('failed-precondition', message, { reason: code });
    error.reason = code;
    return error;
}

function assertIdentifier(value, field) {
    const normalized = String(value || '').trim();
    if (!/^[A-Za-z0-9_-]{8,160}$/.test(normalized)) {
        throw publicationError('PRODUCT_PUBLICATION_ID_INVALID', `${field} invalide.`);
    }
    return normalized;
}

function assertStartPayload(data = {}) {
    const sessionId = assertIdentifier(data.sessionId, 'Session');
    const productId = assertIdentifier(data.productId, 'Produit');
    const expectedMediaCount = Number(data.expectedMediaCount);
    const targetStock = Number(data.targetStock);
    if (!Number.isInteger(expectedMediaCount) || expectedMediaCount < 1 || expectedMediaCount > MAX_PRODUCT_IMAGES) {
        throw publicationError('PRODUCT_PUBLICATION_MEDIA_COUNT_INVALID', 'Ajoutez entre 1 et 23 photos.');
    }
    if (!Number.isInteger(targetStock) || targetStock < 1 || targetStock > 1000) {
        throw publicationError('PRODUCT_PUBLICATION_STOCK_INVALID', 'Le stock initial doit être compris entre 1 et 1000.');
    }
    if (!data.offer || typeof data.offer !== 'object') {
        throw publicationError('PRODUCT_PUBLICATION_OFFER_INVALID', 'Offre invalide.');
    }
    return { sessionId, productId, expectedMediaCount, targetStock, offer: normalizeOffer(data.offer) };
}

function stableCommandId(sessionId, action) {
    const digest = crypto.createHash('sha256').update(sessionId).digest('hex').slice(0, 12);
    return `${sessionId.slice(0, 120)}-${digest}-${action}`;
}

function safeSession(session = {}) {
    const slots = session.slots && typeof session.slots === 'object' ? session.slots : {};
    const slotStates = Object.fromEntries(Object.entries(slots).map(([slot, value]) => [slot, {
        status: value?.status || 'pending',
        error: value?.error || null
    }]));
    return {
        sessionId: session.sessionId,
        productId: session.productId,
        status: session.status || 'uploading',
        expectedMediaCount: Number(session.expectedMediaCount || 0),
        receivedMediaCount: Object.values(slots).filter((slot) => ['processing', 'ready'].includes(slot?.status)).length,
        processedMediaCount: Object.values(slots).filter((slot) => slot?.status === 'ready').length,
        slots: slotStates,
        lastError: session.lastError || null,
        attentionRequired: session.clientState === 'attention_required',
        publishedAt: session.publishedAt || null
    };
}

function normalizeClientFailure(data = {}) {
    const stages = new Set(['local_files', 'storage_upload', 'session_poll', 'version_skew', 'unknown']);
    const stage = stages.has(data.stage) ? data.stage : 'unknown';
    const rawCode = String(data.code || 'PRODUCT_PUBLICATION_CLIENT_FAILED').toUpperCase();
    const code = /^[A-Z0-9_-]{3,100}$/.test(rawCode)
        ? rawCode
        : 'PRODUCT_PUBLICATION_CLIENT_FAILED';
    return { stage, code };
}

function downloadUrl(bucketName, objectName, token) {
    return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucketName)}/o/${encodeURIComponent(objectName)}?alt=media&token=${encodeURIComponent(token)}`;
}

function dominantColor(stats) {
    const value = stats?.dominant;
    return value ? `rgb(${value.r}, ${value.g}, ${value.b})` : '#f7f3ee';
}

async function processImage(bucket, { buffer, sessionId, productId, slotKey }) {
    const rotated = sharp(buffer, { failOn: 'none', limitInputPixels: 40000000 }).rotate();
    const [stats, blurBuffer] = await Promise.all([
        rotated.stats(),
        rotated.clone().resize({ width: 16, height: 16, fit: 'inside', withoutEnlargement: true }).webp({ quality: 45 }).toBuffer()
    ]);
    const variants = {};
    let fullInfo = null;

    for (const spec of VARIANT_SPECS) {
        const { data: output, info } = await rotated.clone()
            .resize({ width: spec.width, withoutEnlargement: true })
            .webp({ quality: spec.quality })
            .toBuffer({ resolveWithObject: true });
        if (spec.key === 'full') fullInfo = info;
        const objectName = `furniture/publication-sessions/${sessionId}/variants/${slotKey}/${spec.folder}/${spec.key}.webp`;
        const token = crypto.randomUUID();
        await bucket.file(objectName).save(output, {
            resumable: false,
            validation: 'crc32c',
            contentType: 'image/webp',
            metadata: {
                cacheControl: 'public, max-age=31536000, immutable',
                metadata: {
                    firebaseStorageDownloadTokens: token,
                    publicationSessionId: sessionId,
                    productId,
                    slotKey,
                    variant: spec.key
                }
            }
        });
        variants[spec.key] = downloadUrl(bucket.name, objectName, token);
    }

    const width = Number(fullInfo?.width || 0);
    const height = Number(fullInfo?.height || 0);
    return {
        variants,
        metadata: {
            width,
            height,
            ratio: width > 0 && height > 0 ? Number((width / height).toFixed(4)) : null,
            dominantColor: dominantColor(stats),
            blurDataUrl: `data:image/webp;base64,${blurBuffer.toString('base64')}`
        }
    };
}

function buildMedia(slots, expectedMediaCount) {
    const ordered = Array.from({ length: expectedMediaCount }, (_, index) => slots[`slot-${String(index).padStart(2, '0')}`]);
    if (ordered.some((slot) => slot?.status !== 'ready' || !slot?.variants?.full)) {
        throw publicationError('PRODUCT_PUBLICATION_MEDIA_INCOMPLETE', 'Certaines photos ne sont pas encore prêtes.');
    }
    const imageVariants = ordered.map((slot) => slot.variants);
    const images = imageVariants.map((variants) => variants.full);
    const thumbnails = imageVariants.map((variants) => variants.thumb384 || variants.thumb || variants.card || variants.full);
    return {
        images,
        thumbnails,
        imageVariants,
        imageMetadata: ordered.map((slot) => slot.metadata || {}),
        imageUrl: images[0] || '',
        thumbnailUrl: thumbnails[0] || images[0] || ''
    };
}

async function acquireFinalization(sessionRef) {
    const token = crypto.randomUUID();
    const now = new Date();
    return admin.firestore().runTransaction(async (transaction) => {
        const snapshot = await transaction.get(sessionRef);
        if (!snapshot.exists) return null;
        const session = snapshot.data();
        if (session.status === 'published') return { alreadyPublished: true, session };
        const leaseExpiresAt = session.finalizationLeaseExpiresAt?.toDate?.() || new Date(session.finalizationLeaseExpiresAt || 0);
        if (session.status === 'finalizing' && leaseExpiresAt.getTime() > now.getTime()) return null;
        if (!['ready', 'finalizing', 'failed'].includes(session.status)) return null;
        transaction.set(sessionRef, {
            status: 'finalizing',
            finalizationToken: token,
            finalizationLeaseExpiresAt: new Date(now.getTime() + FINALIZATION_LEASE_MS),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastError: null
        }, { merge: true });
        return { token, session };
    });
}

async function finalizePublicationSession(sessionId) {
    const db = admin.firestore();
    const sessionRef = db.collection(SESSION_COLLECTION).doc(sessionId);
    const acquired = await acquireFinalization(sessionRef);
    if (!acquired || acquired.alreadyPublished) return acquired?.session || null;
    const session = acquired.session;

    try {
        const access = await db.doc(`sys_admin_access/${session.ownerUid}`).get();
        if (!access.exists || access.data()?.active !== true) {
            throw publicationError('PRODUCT_PUBLICATION_ADMIN_INACTIVE', 'Accès administrateur retiré.');
        }
        const media = buildMedia(session.slots || {}, Number(session.expectedMediaCount));
        const actor = { uid: session.ownerUid, role: 'admin', aal2: true };
        const repository = commandRepository();

        const content = await repository.execute({
            collectionName: 'furniture', productId: session.productId,
            action: 'update_product_content',
            command: { commandId: stableCommandId(sessionId, 'media'), expectedVersion: Number(session.draftCommerceVersion || 0) },
            actor, reason: 'Finalisation medias publication durable', payload: { media }
        });
        const offered = await repository.execute({
            collectionName: 'furniture', productId: session.productId,
            action: 'update_product_offer',
            command: { commandId: stableCommandId(sessionId, 'offer'), expectedVersion: Number(content.commerceVersion) },
            actor, reason: 'Finalisation offre publication durable', payload: { offer: session.offer }
        });
        let current = offered;
        if (Number(session.targetStock) > 0) {
            current = await repository.execute({
                collectionName: 'furniture', productId: session.productId,
                action: 'adjust_inventory',
                command: { commandId: stableCommandId(sessionId, 'stock'), expectedVersion: Number(offered.commerceVersion) },
                actor, reason: 'Finalisation stock publication durable',
                payload: { delta: Number(session.targetStock), expectedInventoryVersion: Number(offered.inventoryVersion || 0) }
            });
        }
        const published = await repository.execute({
            collectionName: 'furniture', productId: session.productId,
            action: 'publish_product',
            command: { commandId: stableCommandId(sessionId, 'publish'), expectedVersion: Number(current.commerceVersion) },
            actor, reason: 'Publication durable finalisee', payload: { published: true }
        });
        const publishedAt = new Date();
        let ownsLease = false;
        await db.runTransaction(async (transaction) => {
            const fresh = await transaction.get(sessionRef);
            if (!fresh.exists || fresh.data()?.status === 'published') return;
            if (fresh.data()?.finalizationToken !== acquired.token) return;
            ownsLease = true;
            transaction.set(sessionRef, {
                status: 'published',
                publishedAt,
                publishedCommerceVersion: published.commerceVersion,
                finalizationToken: null,
                finalizationLeaseExpiresAt: null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastError: null
            }, { merge: true });
        });
        const currentSession = (await sessionRef.get()).data();
        if (!ownsLease && currentSession?.status !== 'published') return currentSession;
        const originalPaths = Object.values(session.slots || {}).map((slot) => slot?.originalPath).filter(Boolean);
        await enqueueMediaCandidates({ db, bucket: admin.storage().bucket(MEDIA_BUCKET) }, {
            paths: originalPaths,
            reason: 'publication_original_quarantine',
            productId: session.productId
        });
        return { ...session, ...currentSession, status: 'published', publishedAt: currentSession?.publishedAt || publishedAt };
    } catch (error) {
        logger.error('product_publication_finalize_failed', { sessionId, code: error?.reason || error?.code || 'unknown' });
        await db.runTransaction(async (transaction) => {
            const fresh = await transaction.get(sessionRef);
            if (!fresh.exists || fresh.data()?.status === 'published') return;
            if (fresh.data()?.finalizationToken !== acquired.token) return;
            transaction.set(sessionRef, {
                status: 'failed',
                lastError: error?.reason || error?.code || 'PRODUCT_PUBLICATION_FINALIZATION_FAILED',
                finalizationToken: null,
                finalizationLeaseExpiresAt: null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
        throw error;
    }
}

const startProductPublicationAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true, timeoutSeconds: 120, memory: '512MB' })
    .https.onCall(async (data, context) => {
        try {
            await checkActiveStrongAdmin(context);
            const { sessionId, productId, expectedMediaCount, targetStock, offer } = assertStartPayload(data);
            const sessionRef = admin.firestore().collection(SESSION_COLLECTION).doc(sessionId);
            const existing = await sessionRef.get();
            if (existing.exists) {
                if (existing.data()?.ownerUid !== context.auth.uid || existing.data()?.productId !== productId) {
                    throw publicationError('PRODUCT_PUBLICATION_SESSION_CONFLICT', 'Cette session appartient à une autre publication.');
                }
                return safeSession(existing.data());
            }
            const actor = { uid: context.auth.uid, role: 'admin', aal2: true };
            const created = await commandRepository().execute({
                collectionName: 'furniture', productId,
                action: 'create_product',
                command: { commandId: stableCommandId(sessionId, 'create'), expectedVersion: 0 },
                actor,
                reason: 'Creation brouillon publication durable',
                payload: { editorial: data.editorial, media: {} }
            });
            const now = new Date();
            const session = {
                schemaVersion: 1,
                sessionId,
                productId,
                ownerUid: context.auth.uid,
                collectionName: 'furniture',
                status: 'uploading',
                expectedMediaCount,
                allowedSlots: Array.from(
                    { length: expectedMediaCount },
                    (_, index) => `slot-${String(index).padStart(2, '0')}`
                ),
                slots: {},
                offer,
                targetStock,
                draftCommerceVersion: created.commerceVersion,
                createdAt: now,
                updatedAt: now,
                expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
                lastError: null,
                clientState: 'active'
            };
            await sessionRef.create(session);
            return safeSession(session);
        } catch (error) {
            throw mapDomainError(error);
        }
    });

const reportProductPublicationClientErrorAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(async (data, context) => {
        await checkActiveStrongAdmin(context);
        const sessionId = assertIdentifier(data?.sessionId, 'Session');
        const failure = normalizeClientFailure(data);
        const ref = admin.firestore().collection(SESSION_COLLECTION).doc(sessionId);
        await admin.firestore().runTransaction(async (transaction) => {
            const snapshot = await transaction.get(ref);
            if (!snapshot.exists || snapshot.data()?.ownerUid !== context.auth.uid) {
                throw new functions.https.HttpsError('not-found', 'Session de publication introuvable.');
            }
            if (snapshot.data()?.status === 'published') return;
            transaction.set(ref, {
                clientState: 'attention_required',
                lastClientError: {
                    ...failure,
                    at: admin.firestore.FieldValue.serverTimestamp()
                },
                lastError: failure.code,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
        return safeSession((await ref.get()).data());
    });

const getProductPublicationSessionAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(async (data, context) => {
        await checkActiveStrongAdmin(context);
        const sessionId = assertIdentifier(data?.sessionId, 'Session');
        const snapshot = await admin.firestore().collection(SESSION_COLLECTION).doc(sessionId).get();
        if (!snapshot.exists || snapshot.data()?.ownerUid !== context.auth.uid) {
            throw new functions.https.HttpsError('not-found', 'Session de publication introuvable.');
        }
        return safeSession(snapshot.data());
    });

const retryProductPublicationFinalizationAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true, timeoutSeconds: 120, memory: '512MB' })
    .https.onCall(async (data, context) => {
        await checkActiveStrongAdmin(context);
        const sessionId = assertIdentifier(data?.sessionId, 'Session');
        const ref = admin.firestore().collection(SESSION_COLLECTION).doc(sessionId);
        const snapshot = await ref.get();
        if (!snapshot.exists || snapshot.data()?.ownerUid !== context.auth.uid) {
            throw new functions.https.HttpsError('not-found', 'Session de publication introuvable.');
        }
        buildMedia(snapshot.data()?.slots || {}, Number(snapshot.data()?.expectedMediaCount));
        if (snapshot.data()?.status === 'failed') {
            await ref.set({ status: 'ready', lastError: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        }
        await finalizePublicationSession(sessionId);
        return safeSession((await ref.get()).data());
    });

const processProductPublicationImage = onObjectFinalized({
    bucket: MEDIA_BUCKET,
    region: MEDIA_TRIGGER_REGION,
    timeoutSeconds: 540,
    memory: '1GiB',
    cpu: 1,
    concurrency: 4,
    minInstances: 0,
    maxInstances: 4,
    serviceAccount: PRODUCT_PUBLICATION_RUNTIME_SERVICE_ACCOUNT,
    retry: true
}, async (event) => {
    const object = event.data;
    const objectName = String(object.name || '');
    const match = objectName.match(ORIGINAL_PATH_PATTERN);
    if (!match) return;
    const [, sessionId, slotKey, slotIndexText] = match;
    const slotIndex = Number(slotIndexText);
    const sessionRef = admin.firestore().collection(SESSION_COLLECTION).doc(sessionId);
    const snapshot = await sessionRef.get();
    if (!snapshot.exists) return;
    const session = snapshot.data();
    if (slotIndex >= Number(session.expectedMediaCount) || !['uploading', 'processing', 'ready', 'failed'].includes(session.status)) return;
    if (!String(object.contentType || '').startsWith('image/') || Number(object.size || 0) > 10 * 1024 * 1024) {
        await admin.firestore().runTransaction(async (transaction) => {
            const fresh = await transaction.get(sessionRef);
            if (!fresh.exists) return;
            transaction.set(sessionRef, {
                status: 'uploading',
                slots: {
                    ...(fresh.data().slots || {}),
                    [slotKey]: { status: 'failed', error: 'PRODUCT_PUBLICATION_IMAGE_INVALID', originalPath: objectName }
                },
                lastError: 'PRODUCT_PUBLICATION_IMAGE_INVALID',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
        return;
    }

    try {
        const processingDecision = await admin.firestore().runTransaction(async (transaction) => {
            const fresh = await transaction.get(sessionRef);
            if (!fresh.exists) return 'skip';
            const current = fresh.data();
            const existingSlot = current.slots?.[slotKey];
            if (existingSlot?.status === 'ready' && String(existingSlot.originalGeneration) === String(object.generation)) {
                const readyCount = Object.values(current.slots || {}).filter((slot) => slot?.status === 'ready').length;
                return readyCount === Number(current.expectedMediaCount) ? 'finalize' : 'skip';
            }
            transaction.set(sessionRef, {
                status: 'processing',
                clientState: 'active',
                slots: {
                    ...(current.slots || {}),
                    [slotKey]: {
                        status: 'processing',
                        originalPath: objectName,
                        originalGeneration: String(object.generation || ''),
                        error: null
                    }
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastError: null
            }, { merge: true });
            return 'process';
        });
        if (processingDecision === 'finalize') {
            try {
                await finalizePublicationSession(sessionId);
            } catch (finalizationError) {
                // La generation est deja prete: conserver le slot et laisser le
                // reconciler reprendre uniquement la finalisation metier.
                logger.error('product_publication_finalize_retry_required', {
                    sessionId,
                    code: finalizationError?.reason || finalizationError?.code || 'unknown'
                });
            }
            return;
        }
        if (processingDecision !== 'process') return;
        const bucket = admin.storage().bucket(MEDIA_BUCKET);
        const [buffer] = await bucket.file(objectName).download();
        const processed = await processImage(bucket, { buffer, sessionId, productId: session.productId, slotKey });
        const ready = await admin.firestore().runTransaction(async (transaction) => {
            const fresh = await transaction.get(sessionRef);
            if (!fresh.exists) return false;
            const current = fresh.data();
            if (String(current.slots?.[slotKey]?.originalGeneration || '') !== String(object.generation || '')) return false;
            const slots = {
                ...(current.slots || {}),
                [slotKey]: {
                    status: 'ready',
                    originalPath: objectName,
                    originalGeneration: String(object.generation || ''),
                    variants: processed.variants,
                    metadata: processed.metadata,
                    error: null
                }
            };
            const processedCount = Object.values(slots).filter((slot) => slot?.status === 'ready').length;
            const allReady = processedCount === Number(current.expectedMediaCount);
            transaction.set(sessionRef, {
                slots,
                status: allReady ? 'ready' : 'processing',
                clientState: 'active',
                processedMediaCount: processedCount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastError: null
            }, { merge: true });
            return allReady;
        });
        if (ready) {
            try {
                await finalizePublicationSession(sessionId);
            } catch (finalizationError) {
                // La finalisation conserve elle-meme l'etat `failed`; les variantes
                // restent prêtes et pourront être rejouées sans retraiter l'image.
                logger.error('product_publication_finalize_retry_required', {
                    sessionId,
                    code: finalizationError?.reason || finalizationError?.code || 'unknown'
                });
            }
        }
    } catch (error) {
        logger.error('product_publication_image_failed', { sessionId, slotKey, code: error?.code || 'unknown' });
        await admin.firestore().runTransaction(async (transaction) => {
            const fresh = await transaction.get(sessionRef);
            if (!fresh.exists) return;
            const current = fresh.data();
            if (String(current.slots?.[slotKey]?.originalGeneration || '') !== String(object.generation || '')) return;
            transaction.set(sessionRef, {
                status: 'uploading',
                slots: {
                    ...(current.slots || {}),
                    [slotKey]: {
                        status: 'failed',
                        originalPath: objectName,
                        originalGeneration: String(object.generation || ''),
                        error: 'PRODUCT_PUBLICATION_IMAGE_PROCESSING_FAILED'
                    }
                },
                lastError: 'PRODUCT_PUBLICATION_IMAGE_PROCESSING_FAILED',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
        throw error;
    }
});

const cleanupProductPublicationSessions = onSchedule({
    schedule: 'every 24 hours',
    region: REGION,
    serviceAccount: PRODUCT_PUBLICATION_RUNTIME_SERVICE_ACCOUNT,
    cpu: 1,
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    timeoutSeconds: 540,
    memory: '512MiB',
    retryCount: 0
}, async () => {
    const db = admin.firestore();
    const expired = await db.collection(SESSION_COLLECTION)
        .where('expiresAt', '<=', new Date())
        .limit(50)
        .get();
    if (expired.empty) return { inspected: 0, queued: 0 };
    const bucket = admin.storage().bucket(MEDIA_BUCKET);
    let queued = 0;
    for (const sessionSnapshot of expired.docs) {
        const [files] = await bucket.getFiles({ prefix: `furniture/publication-sessions/${sessionSnapshot.id}/` });
        const result = await enqueueMediaCandidates({ db, bucket }, {
            paths: files.map((file) => file.name),
            reason: 'expired_publication_session',
            productId: sessionSnapshot.data()?.productId || null
        });
        queued += result.queued;
        await sessionSnapshot.ref.delete();
    }
    return { inspected: expired.size, queued };
});

const reconcileProductPublicationSessions = onSchedule({
    schedule: 'every 15 minutes',
    region: REGION,
    serviceAccount: PRODUCT_PUBLICATION_RUNTIME_SERVICE_ACCOUNT,
    cpu: 1,
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    timeoutSeconds: 540,
    memory: '512MiB',
    retryCount: 0
}, async () => {
    const db = admin.firestore();
    const [candidates, uploadCandidates] = await Promise.all([
        db.collection(SESSION_COLLECTION)
        .where('status', 'in', ['ready', 'finalizing', 'failed'])
        .limit(25)
        .get(),
        db.collection(SESSION_COLLECTION)
            .where('status', 'in', ['uploading', 'processing'])
            .limit(50)
            .get()
    ]);
    const stalledBefore = Date.now() - STALLED_UPLOAD_MS;
    let attentionRequired = 0;
    for (const snapshot of uploadCandidates.docs) {
        const session = snapshot.data();
        const updatedAt = session?.updatedAt?.toDate?.() || new Date(session?.updatedAt || 0);
        const expiresAt = session?.expiresAt?.toDate?.() || new Date(session?.expiresAt || 0);
        if (
            session?.clientState === 'attention_required' ||
            updatedAt.getTime() > stalledBefore ||
            expiresAt.getTime() <= Date.now()
        ) continue;
        await snapshot.ref.set({
            clientState: 'attention_required',
            lastError: session.lastError || 'PRODUCT_PUBLICATION_UPLOAD_STALLED'
        }, { merge: true });
        attentionRequired += 1;
    }
    let resumed = 0;
    for (const snapshot of candidates.docs) {
        try {
            const session = snapshot.data();
            const expiresAt = session?.expiresAt?.toDate?.() || new Date(session?.expiresAt || 0);
            if (expiresAt.getTime() <= Date.now()) continue;
            buildMedia(session?.slots || {}, Number(session?.expectedMediaCount));
            const result = await finalizePublicationSession(snapshot.id);
            if (result?.status === 'published') resumed += 1;
        } catch (error) {
            logger.warn('product_publication_reconcile_deferred', {
                sessionId: snapshot.id,
                code: error?.reason || error?.code || 'unknown'
            });
        }
    }
    return { inspected: candidates.size + uploadCandidates.size, resumed, attentionRequired };
});

module.exports = {
    PRODUCT_PUBLICATION_RUNTIME_SERVICE_ACCOUNT,
    MEDIA_BUCKET,
    MEDIA_TRIGGER_REGION,
    ORIGINAL_PATH_PATTERN,
    SESSION_COLLECTION,
    VARIANT_SPECS,
    buildMedia,
    cleanupProductPublicationSessions,
    finalizePublicationSession,
    getProductPublicationSessionAdmin,
    processProductPublicationImage,
    reconcileProductPublicationSessions,
    reportProductPublicationClientErrorAdmin,
    retryProductPublicationFinalizationAdmin,
    safeSession,
    startProductPublicationAdmin
};
