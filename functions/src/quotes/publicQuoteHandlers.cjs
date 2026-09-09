'use strict';
const crypto = require('node:crypto');
const { normalizeQuoteRequest, quoteDocumentId, hashToken, tokenMatches, quoteReference, normalizeUploadToken } = require('./quoteRequestDomain');

function createPublicQuoteHandlers({ admin, HttpsError, normalizeFirestoreId, getRateLimitClientIp, timestampAfterDays, AUDIT_RETENTION_DAYS }) {
const functions = { https: { HttpsError } };
const db = admin.firestore();
const QUOTES_COLLECTION = 'quote_requests';
const QUOTE_AUDIT_COLLECTION = 'sys_audit_quotes';
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

return { callableError, clientIp, rateLimitRef, consumeRateLimit, assertSubmissionAccess, createQuoteRequestHandler, finalizeQuoteRequestHandler };
}
module.exports = { createPublicQuoteHandlers };
