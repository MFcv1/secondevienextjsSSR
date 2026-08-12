'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const sharp = require('sharp');
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
const { createTransactionalEmailRuntime } = require('../email/transactionalEmailRuntime');
const {
    MAX_PHOTOS,
    MAX_PHOTO_BYTES,
    hashToken,
    normalizeInternalNotes,
    normalizeQuoteRequest,
    normalizeQuoteStatus,
    normalizeUploadToken,
    quoteDocumentId,
    quoteReference,
    tokenMatches
} = require('./quoteRequestDomain');
const { quoteReceiptEmail } = require('./quoteEmailTemplates');

const db = admin.firestore();
const QUOTES_COLLECTION = 'quote_requests';
const QUOTE_AUDIT_COLLECTION = 'sys_audit_quotes';
const QUOTE_STORAGE_ROOT = 'quote-requests/v1';
const MAX_ADMIN_QUOTES = 100;
const EMAIL_SECRETS = [GMAIL_EMAIL, GMAIL_PASSWORD, RESEND_API_KEY];
const PUBLIC_RUNTIME = { enforceAppCheck: true, timeoutSeconds: 60, memory: '512MB' };
const ADMIN_RUNTIME = { enforceAppCheck: true, timeoutSeconds: 30, memory: '512MB' };

function callableError(error, fallback = 'La demande de devis n’a pas pu être traitée.') {
    if (error instanceof functions.https.HttpsError) return error;
    const invalidCodes = new Set([
        'QUOTE_FIELD_REQUIRED',
        'QUOTE_FIELD_TOO_LONG',
        'QUOTE_EMAIL_INVALID',
        'QUOTE_PHONE_INVALID',
        'QUOTE_NUMBER_INVALID',
        'QUOTE_SERVICES_INVALID',
        'QUOTE_REQUEST_ID_INVALID',
        'QUOTE_UPLOAD_TOKEN_INVALID',
        'QUOTE_FURNITURE_INVALID',
        'QUOTE_CONDITION_INVALID',
        'QUOTE_SEVERITY_INVALID',
        'QUOTE_PHOTO_COUNT_INVALID',
        'QUOTE_CONSENT_REQUIRED',
        'QUOTE_STATUS_INVALID'
    ]);
    if (invalidCodes.has(error?.code)) {
        return new functions.https.HttpsError('invalid-argument', error.message);
    }
    console.error('Quote request operation failed', {
        code: String(error?.code || error?.message || 'unknown').slice(0, 160)
    });
    return new functions.https.HttpsError('internal', fallback);
}

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

function clientIp(context) {
    return getRateLimitClientIp(context);
}

function rateLimitRef(scope, value) {
    const digest = crypto.createHash('sha256').update(`${scope}:${value}`).digest('hex');
    return db.doc(`sys_ratelimit/quote_${scope}_${digest}`);
}

async function consumeRateLimit(scope, value, limit, windowMs) {
    const ref = rateLimitRef(scope, value);
    const now = admin.firestore.Timestamp.now();
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists ? snapshot.data() : {};
        const startedAt = current.windowStartedAt?.toMillis?.() || 0;
        const sameWindow = startedAt > 0 && now.toMillis() - startedAt < windowMs;
        const count = sameWindow ? Number(current.count || 0) : 0;
        if (count >= limit) {
            throw new functions.https.HttpsError(
                'resource-exhausted',
                'Trop de demandes ont été envoyées. Réessayez un peu plus tard.'
            );
        }
        transaction.set(ref, {
            scope,
            count: count + 1,
            windowStartedAt: sameWindow ? current.windowStartedAt : now,
            updatedAt: now,
            expiresAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + (2 * windowMs))
        });
    });
}

function assertSubmissionAccess(quote, uploadToken, { allowSubmitted = false } = {}) {
    if (!quote || !tokenMatches(uploadToken, quote.submissionTokenHash)) {
        throw new functions.https.HttpsError('permission-denied', 'Dépôt de demande refusé.');
    }
    if (!allowSubmitted && quote.intakeStatus !== 'receiving') {
        throw new functions.https.HttpsError('failed-precondition', 'Cette demande a déjà été finalisée.');
    }
    const expiresAt = quote.uploadExpiresAt?.toMillis?.() || 0;
    if (!allowSubmitted && (!expiresAt || expiresAt < Date.now())) {
        throw new functions.https.HttpsError('deadline-exceeded', 'Le dépôt des photos a expiré.');
    }
}

async function createQuoteRequestHandler(data, context) {
    try {
        const quote = normalizeQuoteRequest(data);
        const quoteId = quoteDocumentId(quote.clientRequestId);
        const ref = db.collection(QUOTES_COLLECTION).doc(quoteId);
        const tokenHash = hashToken(quote.uploadToken);
        const existing = await ref.get();
        if (existing.exists) {
            const current = existing.data();
            if (!tokenMatches(quote.uploadToken, current.submissionTokenHash)
                || current.customer?.emailLower !== quote.customer.emailLower) {
                throw new functions.https.HttpsError('already-exists', 'Cette demande existe déjà.');
            }
            return {
                quoteId,
                requestNumber: current.requestNumber,
                intakeStatus: current.intakeStatus,
                photoCount: Number(current.photoCount || 0)
            };
        }

        await Promise.all([
            consumeRateLimit('email', quote.customer.emailLower, 5, 60 * 60 * 1000),
            consumeRateLimit('ip', clientIp(context), 20, 60 * 60 * 1000)
        ]);

        const now = admin.firestore.Timestamp.now();
        const requestNumber = quoteReference(now.toDate(), quote.clientRequestId);
        const auditRef = db.collection(QUOTE_AUDIT_COLLECTION).doc();
        const document = {
            requestNumber,
            source: 'public_restoration_form',
            status: 'new',
            intakeStatus: 'receiving',
            version: 1,
            customer: quote.customer,
            customerEmailLower: quote.customer.emailLower,
            project: quote.project,
            expectedPhotoCount: quote.expectedPhotoCount,
            photoCount: 0,
            photos: [],
            internalNotes: '',
            confirmationEmail: { status: 'pending' },
            consent: {
                contact: true,
                recordedAt: now
            },
            ownerUid: context.auth?.uid || null,
            submissionTokenHash: tokenHash,
            uploadExpiresAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + (30 * 60 * 1000)),
            createdAt: now,
            updatedAt: now
        };
        const batch = db.batch();
        batch.create(ref, document);
        batch.create(auditRef, {
            quoteId,
            requestNumber,
            action: 'created_public',
            actorUid: context.auth?.uid || null,
            createdAt: now,
            expireAt: timestampAfterDays(AUDIT_RETENTION_DAYS, now.toMillis())
        });
        try {
            await batch.commit();
        } catch (error) {
            if (error?.code !== 6 && error?.code !== 'already-exists') throw error;
            const raced = await ref.get();
            if (!raced.exists || !tokenMatches(quote.uploadToken, raced.data().submissionTokenHash)) throw error;
            return {
                quoteId,
                requestNumber: raced.data().requestNumber,
                intakeStatus: raced.data().intakeStatus,
                photoCount: Number(raced.data().photoCount || 0)
            };
        }
        return { quoteId, requestNumber, intakeStatus: 'receiving', photoCount: 0 };
    } catch (error) {
        throw callableError(error);
    }
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
    let storageFile = null;
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

        const storagePath = `${QUOTE_STORAGE_ROOT}/${photo.quoteId}/${photo.photoId}.webp`;
        storageFile = admin.storage().bucket().file(storagePath);
        await storageFile.save(rendered.data, {
            resumable: false,
            validation: 'crc32c',
            metadata: {
                contentType: 'image/webp',
                cacheControl: 'private, no-store, max-age=0',
                metadata: { quoteId: photo.quoteId, photoId: photo.photoId }
            }
        });

        let nextCount = 0;
        await db.runTransaction(async (transaction) => {
            const currentSnapshot = await transaction.get(ref);
            if (!currentSnapshot.exists) throw new functions.https.HttpsError('not-found', 'Demande introuvable.');
            const current = currentSnapshot.data();
            assertSubmissionAccess(current, photo.uploadToken);
            const photos = Array.isArray(current.photos) ? current.photos : [];
            if (photos.some((entry) => entry.photoId === photo.photoId)) {
                nextCount = Number(current.photoCount || photos.length);
                return;
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
            nextCount = nextPhotos.length;
            transaction.update(ref, {
                photos: nextPhotos,
                photoCount: nextCount,
                updatedAt: uploadedAt
            });
        });
        return { photoId: photo.photoId, photoCount: nextCount };
    } catch (error) {
        if (storageFile) await storageFile.delete({ ignoreNotFound: true }).catch(() => {});
        throw callableError(error, 'La photo n’a pas pu être ajoutée.');
    }
}

async function finalizeQuoteRequestHandler(data) {
    try {
        const quoteId = normalizeFirestoreId(data?.quoteId, 'Demande');
        const uploadToken = normalizeUploadToken(data?.uploadToken);
        const ref = db.collection(QUOTES_COLLECTION).doc(quoteId);
        let result = null;
        await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(ref);
            if (!snapshot.exists) throw new functions.https.HttpsError('not-found', 'Demande introuvable.');
            const current = snapshot.data();
            assertSubmissionAccess(current, uploadToken, { allowSubmitted: true });
            if (current.intakeStatus === 'submitted') {
                result = current;
                return;
            }
            const now = admin.firestore.Timestamp.now();
            const next = {
                ...current,
                intakeStatus: 'submitted',
                submittedAt: now,
                updatedAt: now,
                confirmationEmail: { status: 'pending' }
            };
            transaction.update(ref, {
                intakeStatus: next.intakeStatus,
                submittedAt: now,
                updatedAt: now,
                confirmationEmail: next.confirmationEmail
            });
            transaction.create(db.collection(QUOTE_AUDIT_COLLECTION).doc(), {
                quoteId,
                requestNumber: current.requestNumber,
                action: 'submitted_public',
                photoCount: Number(current.photoCount || 0),
                createdAt: now,
                expireAt: timestampAfterDays(AUDIT_RETENTION_DAYS, now.toMillis())
            });
            result = next;
        });
        return {
            success: true,
            quoteId,
            requestNumber: result.requestNumber,
            photoCount: Number(result.photoCount || 0),
            confirmationEmailStatus: result.confirmationEmail?.status || 'pending'
        };
    } catch (error) {
        throw callableError(error);
    }
}

async function listQuoteRequestsAdminHandler(_data, context) {
    await checkActiveStrongAdmin(context);
    const snapshot = await db.collection(QUOTES_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(MAX_ADMIN_QUOTES + 1)
        .get();
    return {
        quotes: snapshot.docs.slice(0, MAX_ADMIN_QUOTES).map((entry) => serializeQuote(entry.id, entry.data())),
        hasMore: snapshot.size > MAX_ADMIN_QUOTES,
        limit: MAX_ADMIN_QUOTES
    };
}

async function getQuoteRequestAdminHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const quoteId = normalizeFirestoreId(data?.quoteId, 'Demande');
    const snapshot = await db.collection(QUOTES_COLLECTION).doc(quoteId).get();
    if (!snapshot.exists) throw new functions.https.HttpsError('not-found', 'Demande introuvable.');
    const value = snapshot.data();
    const photos = await Promise.all((value.photos || []).map(async (photo) => {
        let url = null;
        try {
            [url] = await admin.storage().bucket().file(photo.storagePath).getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + (15 * 60 * 1000)
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
    await ref.set({
        confirmationEmail: {
            status: 'sending',
            startedAt,
            eventId: context.eventId || null
        }
    }, { merge: true });
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
        await ref.set({
            confirmationEmail: {
                status: 'sent',
                provider: result.provider,
                providerMessageId: result.id || null,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });
        return result;
    } catch (error) {
        console.error('Quote receipt email failed', {
            quoteId: change.after.id,
            code: String(error?.code || error?.message || 'unknown').slice(0, 120)
        });
        await ref.set({
            confirmationEmail: {
                status: 'failed',
                errorCode: String(error?.code || 'SEND_FAILED').slice(0, 120),
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });
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

module.exports = {
    createQuoteRequest,
    createQuoteRequestHandler,
    finalizeQuoteRequest,
    finalizeQuoteRequestHandler,
    getQuoteRequestAdmin,
    getQuoteRequestAdminHandler,
    listQuoteRequestsAdmin,
    listQuoteRequestsAdminHandler,
    onQuoteRequestSubmitted,
    sendQuoteReceiptEmail,
    serializeQuote,
    updateQuoteRequestAdmin,
    updateQuoteRequestAdminHandler,
    uploadQuoteRequestPhoto,
    uploadQuoteRequestPhotoHandler
};
