'use strict';

const crypto = require('node:crypto');
const { readAdminPage } = require('../admin/readPage');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const sharp = (...args) => require('sharp')(...args);
const { getRateLimitClientIp } = require('../../helpers/clientIp');
const { checkActiveStrongAdmin, normalizeFirestoreId } = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const { AUDIT_RETENTION_DAYS, timestampAfterDays } = require('../../helpers/retention');
const {
    GMAIL_EMAIL,
    GMAIL_PASSWORD,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    TRANSACTIONAL_EMAIL_PROVIDER
} = require('../../helpers/secrets');
const createTransactionalEmailRuntime = (...args) => require('../email/transactionalEmailRuntime').createTransactionalEmailRuntime(...args);
const {
    MAX_PHOTOS,
    MAX_PHOTO_BYTES,
    normalizeInternalNotes,
    normalizeQuoteStatus,
    normalizeUploadToken,
} = require('./quoteRequestDomain');
const { quoteReceiptEmail } = require('./quoteEmailTemplates');

const db = admin.firestore();
const QUOTES_COLLECTION = 'quote_requests';
const QUOTE_AUDIT_COLLECTION = 'sys_audit_quotes';
const QUOTE_STORAGE_ROOT = 'quote-requests/v1';
const MAX_ADMIN_QUOTES = 100;
const EMAIL_CLAIM_LEASE_MS = 2 * 60 * 1000;
const GEN1_QUOTE_EMAIL_HANDOFF_MS = 20 * 1000;
const EMAIL_SECRETS = [GMAIL_EMAIL, GMAIL_PASSWORD, RESEND_API_KEY];
const PUBLIC_RUNTIME = { enforceAppCheck: true, timeoutSeconds: 60, memory: '512MB' };
const ADMIN_RUNTIME = { enforceAppCheck: true, timeoutSeconds: 30, memory: '512MB' };
const QUOTE_GEN2_RUNTIME = Object.freeze({
    region: 'europe-west1',
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '512MiB',
    timeoutSeconds: 60,
    serviceAccount: 'quote-request-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    enforceAppCheck: true
});


const { createPublicQuoteHandlers } = require('./publicQuoteHandlers.cjs');
const { callableError, assertSubmissionAccess, createQuoteRequestHandler, finalizeQuoteRequestHandler } = createPublicQuoteHandlers({
    admin, HttpsError: functions.https.HttpsError, normalizeFirestoreId, getRateLimitClientIp, timestampAfterDays, AUDIT_RETENTION_DAYS
});

function timestampIso(value) {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    return null;
}

function serializeQuote(id, value, { includePhotos = false } = {}) {
    const photos = Array.isArray(value.photos) ? value.photos : [];
    return {
        quoteId: id,
        requestNumber: value.requestNumber || id.slice(0, 12),
        source: value.source || 'public_restoration_form',
        status: value.status || 'new',
        intakeStatus: value.intakeStatus || 'receiving',
        version: Number(value.version || 1),
        customer: value.customer || {},
        project: value.project || {},
        expectedPhotoCount: Number(value.expectedPhotoCount || 0),
        photoCount: Number(value.photoCount || photos.length || 0),
        photos: includePhotos ? photos : undefined,
        internalNotes: String(value.internalNotes || ''),
        confirmationEmail: {
            status: value.confirmationEmail?.status || 'pending',
            completedAt: timestampIso(value.confirmationEmail?.completedAt)
        },
        createdAt: timestampIso(value.createdAt),
        submittedAt: timestampIso(value.submittedAt),
        updatedAt: timestampIso(value.updatedAt),
        statusChangedAt: timestampIso(value.statusChangedAt)
    };
}






function normalizePhotoInput(data) {
    const quoteId = normalizeFirestoreId(data?.quoteId, 'Demande');
    if (!/^quote_[a-f0-9]{32}$/.test(quoteId)) {
        throw new functions.https.HttpsError('invalid-argument', 'Demande invalide.');
    }
    const photoId = String(data?.photoId || '').trim().toLowerCase();
    if (!/^[a-f0-9]{24,64}$/.test(photoId)) {
        throw new functions.https.HttpsError('invalid-argument', 'Photo invalide.');
    }
    const uploadToken = normalizeUploadToken(data?.uploadToken);
    const fileName = String(data?.fileName || 'photo').trim().replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 100);
    const contentType = String(data?.contentType || '').trim().toLowerCase();
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
        throw new functions.https.HttpsError('invalid-argument', 'Format de photo non pris en charge.');
    }
    const encoded = String(data?.base64 || '').trim();
    if (!encoded || encoded.length > Math.ceil(MAX_PHOTO_BYTES * 4 / 3) + 8 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
        throw new functions.https.HttpsError('invalid-argument', 'Photo trop volumineuse ou invalide.');
    }
    const buffer = Buffer.from(encoded, 'base64');
    if (!buffer.length || buffer.length > MAX_PHOTO_BYTES) {
        throw new functions.https.HttpsError('invalid-argument', 'Photo trop volumineuse ou invalide.');
    }
    return { quoteId, photoId, uploadToken, fileName, contentType, buffer };
}

async function uploadQuoteRequestPhotoHandler(data) {
    try {
        const photo = normalizePhotoInput(data);
        const ref = db.collection(QUOTES_COLLECTION).doc(photo.quoteId);
        const before = await ref.get();
        if (!before.exists) throw new functions.https.HttpsError('not-found', 'Demande introuvable.');
        const quote = before.data();
        assertSubmissionAccess(quote, photo.uploadToken);
        const existing = (quote.photos || []).find((entry) => entry.photoId === photo.photoId);
        if (existing) return { photoId: photo.photoId, photoCount: Number(quote.photoCount || quote.photos.length) };
        if (Number(quote.photoCount || 0) >= MAX_PHOTOS) {
            throw new functions.https.HttpsError('failed-precondition', 'Le nombre maximal de photos est atteint.');
        }

        const rendered = await sharp(photo.buffer, { failOn: 'warning', limitInputPixels: 25_000_000 })
            .rotate()
            .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82, effort: 4 })
            .toBuffer({ resolveWithObject: true });
        if (!rendered.info.width || !rendered.info.height || rendered.data.length > MAX_PHOTO_BYTES) {
            throw new functions.https.HttpsError('invalid-argument', 'Photo illisible ou trop volumineuse.');
        }

        // Each attempt owns its object. A concurrent request with the same
        // photoId must neither overwrite nor delete the winning upload.
        const storagePath = `${QUOTE_STORAGE_ROOT}/${photo.quoteId}/${photo.photoId}_${crypto.randomUUID()}.webp`;
        const storageFile = admin.storage().bucket().file(storagePath);
        await storageFile.save(rendered.data, {
            resumable: false,
            validation: 'crc32c',
            metadata: {
                contentType: 'image/webp',
                cacheControl: 'private, no-store, max-age=0',
                metadata: { quoteId: photo.quoteId, photoId: photo.photoId }
            }
        });

        const result = await db.runTransaction(async (transaction) => {
            const currentSnapshot = await transaction.get(ref);
            if (!currentSnapshot.exists) throw new functions.https.HttpsError('not-found', 'Demande introuvable.');
            const current = currentSnapshot.data();
            assertSubmissionAccess(current, photo.uploadToken);
            const photos = Array.isArray(current.photos) ? current.photos : [];
            if (photos.some((entry) => entry.photoId === photo.photoId)) {
                return { photoCount: Number(current.photoCount || photos.length), duplicate: true };
            }
            if (photos.length >= MAX_PHOTOS) {
                throw new functions.https.HttpsError('failed-precondition', 'Le nombre maximal de photos est atteint.');
            }
            const uploadedAt = admin.firestore.Timestamp.now();
            const nextPhotos = [...photos, {
                photoId: photo.photoId,
                originalName: photo.fileName,
                storagePath,
                contentType: 'image/webp',
                width: rendered.info.width,
                height: rendered.info.height,
                size: rendered.data.length,
                uploadedAt
            }];
            transaction.update(ref, {
                photos: nextPhotos,
                photoCount: nextPhotos.length,
                updatedAt: uploadedAt
            });
            return { photoCount: nextPhotos.length, duplicate: false };
        });
        if (result.duplicate) {
            await storageFile.delete({ ignoreNotFound: true }).catch(() => {});
        }
        return { photoId: photo.photoId, photoCount: result.photoCount };
    } catch (error) {
        // A failed response does not prove the transaction failed to commit.
        // Keep the object until its lack of references can be established.
        throw callableError(error, 'La photo n’a pas pu être ajoutée.');
    }
}


async function listQuoteRequestsAdminHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const page = await readAdminPage({ collection: db.collection(QUOTES_COLLECTION), sortField: 'createdAt', pageSize: MAX_ADMIN_QUOTES, cursor: data?.cursor, referenceField: 'requestNumber', reference: data?.reference });
    return {
        quotes: page.docs.map((entry) => serializeQuote(entry.id, entry.data())),
        hasMore: page.hasMore,
        nextCursor: page.nextCursor,
        coverage: page.coverage,
        limit: MAX_ADMIN_QUOTES
    };
}

async function getQuoteRequestAdminHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const quoteId = normalizeFirestoreId(data?.quoteId, 'Demande');
    const snapshot = await db.collection(QUOTES_COLLECTION).doc(quoteId).get();
    if (!snapshot.exists) throw new functions.https.HttpsError('not-found', 'Demande introuvable.');
    const value = snapshot.data();
    const photosExpireAt = Date.now() + (15 * 60 * 1000);
    const photos = await Promise.all((value.photos || []).map(async (photo) => {
        let url = null;
        try {
            [url] = await admin.storage().bucket().file(photo.storagePath).getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: photosExpireAt
            });
        } catch (error) {
            console.warn('Quote photo signing failed', {
                quoteId,
                photoId: photo.photoId,
                code: String(error?.code || 'SIGN_FAILED').slice(0, 80)
            });
        }
        return {
            photoId: photo.photoId,
            originalName: photo.originalName,
            width: photo.width,
            height: photo.height,
            size: photo.size,
            expiresAt: photosExpireAt,
            url
        };
    }));
    return { quote: { ...serializeQuote(snapshot.id, value, { includePhotos: true }), photos } };
}

async function updateQuoteRequestAdminHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const quoteId = normalizeFirestoreId(data?.quoteId, 'Demande');
    const status = normalizeQuoteStatus(data?.status);
    const internalNotes = normalizeInternalNotes(data?.internalNotes);
    const expectedVersion = Number(data?.expectedVersion);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
        throw new functions.https.HttpsError('invalid-argument', 'Version de demande invalide.');
    }
    const ref = db.collection(QUOTES_COLLECTION).doc(quoteId);
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) throw new functions.https.HttpsError('not-found', 'Demande introuvable.');
        const current = snapshot.data();
        const currentVersion = Number(current.version || 1);
        if (currentVersion !== expectedVersion) {
            throw new functions.https.HttpsError(
                'aborted',
                'Cette demande a été modifiée ailleurs. Actualisez avant de recommencer.',
                { reason: 'quote-version-conflict' }
            );
        }
        const now = admin.firestore.Timestamp.now();
        const statusChanged = status !== current.status;
        transaction.update(ref, {
            status,
            internalNotes,
            version: currentVersion + 1,
            updatedAt: now,
            statusChangedAt: statusChanged ? now : (current.statusChangedAt || now),
            lastHandledBy: context.auth.uid
        });
        transaction.create(db.collection(QUOTE_AUDIT_COLLECTION).doc(), {
            quoteId,
            requestNumber: current.requestNumber,
            action: 'updated_admin',
            actorUid: context.auth.uid,
            previousStatus: current.status || 'new',
            nextStatus: status,
            notesChanged: internalNotes !== String(current.internalNotes || ''),
            previousVersion: currentVersion,
            nextVersion: currentVersion + 1,
            createdAt: now,
            expireAt: timestampAfterDays(AUDIT_RETENTION_DAYS, now.toMillis())
        });
    });
    return getQuoteRequestAdminHandler({ quoteId }, context);
}

async function sendQuoteReceiptEmail(change, context) {
    const before = change.before.data() || {};
    const quote = change.after.data() || {};
    if (before.intakeStatus === 'submitted' || quote.intakeStatus !== 'submitted') return null;
    const ref = change.after.ref;
    const startedAt = admin.firestore.Timestamp.now();
    const eventId = String(context.eventId || `quote-received/${change.after.id}`);
    const claimed = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists || snapshot.data()?.intakeStatus !== 'submitted') return false;
        const delivery = snapshot.data()?.confirmationEmail || {};
        if (['sent', 'delivery_unknown'].includes(delivery.status)) return false;
        const leaseStartedAt = delivery.startedAt?.toMillis?.() || 0;
        if (delivery.status === 'sending' && leaseStartedAt > startedAt.toMillis() - EMAIL_CLAIM_LEASE_MS) {
            return false;
        }
        if (delivery.status === 'sending') {
            transaction.set(ref, {
                confirmationEmail: { ...delivery, status: 'delivery_unknown' }
            }, { merge: true });
            return false;
        }
        transaction.set(ref, {
            confirmationEmail: {
                status: 'sending',
                startedAt,
                eventId,
                attemptCount: Number(delivery.attemptCount || 0) + 1
            }
        }, { merge: true });
        return true;
    });
    if (!claimed) return null;
    let accepted = false;
    try {
        const runtime = createTransactionalEmailRuntime({
            provider: TRANSACTIONAL_EMAIL_PROVIDER.value(),
            gmailUser: GMAIL_EMAIL.value(),
            gmailPassword: GMAIL_PASSWORD.value(),
            resendApiKey: RESEND_API_KEY.value(),
            resendFromEmail: RESEND_FROM_EMAIL.value()
        });
        const result = await runtime.sender.send(
            quoteReceiptEmail(quote, runtime.fromAddress),
            { idempotencyKey: `quote-received/${change.after.id}` }
        );
        accepted = true;
        if (!result?.id) throw new Error('QUOTE_EMAIL_PROVIDER_RESPONSE_INVALID');
        await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(ref);
            if (snapshot.data()?.confirmationEmail?.eventId !== eventId) return;
            transaction.set(ref, {
                confirmationEmail: {
                    status: 'sent',
                    eventId,
                    provider: result.provider,
                    providerMessageId: result.id || null,
                    completedAt: admin.firestore.FieldValue.serverTimestamp()
                }
            }, { merge: true });
        });
        return result;
    } catch (error) {
        console.error('Quote receipt email failed', {
            quoteId: change.after.id,
            code: String(error?.code || error?.message || 'unknown').slice(0, 120)
        });
        await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(ref);
            const delivery = snapshot.data()?.confirmationEmail;
            if (delivery?.eventId !== eventId || delivery.status !== 'sending') return;
            transaction.set(ref, {
                confirmationEmail: {
                    status: accepted || ['ECONNRESET', 'ESOCKET', 'ETIMEDOUT', 'GMAIL_SEND_FAILED'].includes(error?.code)
                        ? 'delivery_unknown'
                        : 'failed',
                    eventId,
                    errorCode: String(error?.code || 'SEND_FAILED').slice(0, 120),
                    completedAt: admin.firestore.FieldValue.serverTimestamp()
                }
            }, { merge: true });
        });
        return null;
    }
}

const createQuoteRequest = regionalFunctions().runWith(PUBLIC_RUNTIME).https.onCall(createQuoteRequestHandler);
const uploadQuoteRequestPhoto = regionalFunctions().runWith(PUBLIC_RUNTIME).https.onCall(uploadQuoteRequestPhotoHandler);
const finalizeQuoteRequest = regionalFunctions().runWith(PUBLIC_RUNTIME).https.onCall(finalizeQuoteRequestHandler);
const listQuoteRequestsAdmin = regionalFunctions().runWith(ADMIN_RUNTIME).https.onCall(listQuoteRequestsAdminHandler);
const getQuoteRequestAdmin = regionalFunctions().runWith(ADMIN_RUNTIME).https.onCall(getQuoteRequestAdminHandler);
const updateQuoteRequestAdmin = regionalFunctions().runWith(ADMIN_RUNTIME).https.onCall(updateQuoteRequestAdminHandler);
const onQuoteRequestSubmitted = regionalFunctions()
    .runWith({ secrets: EMAIL_SECRETS, timeoutSeconds: 60, memory: '512MB' })
    .firestore.document(`${QUOTES_COLLECTION}/{quoteId}`)
    .onUpdate(sendQuoteReceiptEmail);
const onQuoteRequestSubmittedGen2 = onDocumentUpdated(
    {
        document: `${QUOTES_COLLECTION}/{quoteId}`,
        region: 'europe-west1',
        cpu: 'gcf_gen1',
        concurrency: 1,
        minInstances: 0,
        maxInstances: 1,
        memory: '512MiB',
        timeoutSeconds: 60,
        serviceAccount: QUOTE_GEN2_RUNTIME.serviceAccount,
        secrets: EMAIL_SECRETS,
        retry: true
    },
    async (event) => {
        // Pendant la coexistence, la Gen1 conserve la priorité sur son claim
        // `confirmationEmail`. La Gen2 relit ensuite le document et ne livre
        // que si aucun worker Gen1 n'a acquis le lease.
        await new Promise((resolve) => setTimeout(resolve, GEN1_QUOTE_EMAIL_HANDOFF_MS));
        return sendQuoteReceiptEmail(event.data, { eventId: event.id, params: event.params });
    }
);

module.exports = {
    createQuoteRequest,
    createQuoteRequestGen2: onCall(QUOTE_GEN2_RUNTIME, async (request) => createQuoteRequestHandler(request.data, request)),
    createQuoteRequestHandler,
    finalizeQuoteRequest,
    finalizeQuoteRequestGen2: onCall(QUOTE_GEN2_RUNTIME, async (request) => finalizeQuoteRequestHandler(request.data, request)),
    finalizeQuoteRequestHandler,
    getQuoteRequestAdmin,
    getQuoteRequestAdminGen2: onCall({ ...QUOTE_GEN2_RUNTIME, timeoutSeconds: 30 }, async (request) => getQuoteRequestAdminHandler(request.data, request)),
    getQuoteRequestAdminHandler,
    listQuoteRequestsAdmin,
    listQuoteRequestsAdminGen2: onCall({ ...QUOTE_GEN2_RUNTIME, timeoutSeconds: 30 }, async (request) => listQuoteRequestsAdminHandler(request.data, request)),
    listQuoteRequestsAdminHandler,
    onQuoteRequestSubmitted,
    onQuoteRequestSubmittedGen2,
    sendQuoteReceiptEmail,
    serializeQuote,
    updateQuoteRequestAdmin,
    updateQuoteRequestAdminGen2: onCall({ ...QUOTE_GEN2_RUNTIME, timeoutSeconds: 30 }, async (request) => updateQuoteRequestAdminHandler(request.data, request)),
    updateQuoteRequestAdminHandler,
    uploadQuoteRequestPhoto,
    uploadQuoteRequestPhotoGen2: onCall(QUOTE_GEN2_RUNTIME, async (request) => uploadQuoteRequestPhotoHandler(request.data, request)),
    uploadQuoteRequestPhotoHandler
};
