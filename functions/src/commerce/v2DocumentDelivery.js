'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { normalizeFirestoreId } = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    buildOutboxIntent,
    deterministicEffectId
} = require('./domain/commerceEffects');
const {
    MAX_PDF_BYTES,
    materializeCommerceDocumentArtifact
} = require('./domain/commerceDocumentArtifact');

const EMAIL_DEDUPE_MS = 10 * 60 * 1000;
const MAX_EMAILS_PER_DAY = 24;

function resolveStorageBucketName(env = process.env) {
    const explicitBucket = String(env.FUNCTIONS_STORAGE_BUCKET || '').trim();
    if (explicitBucket) return explicitBucket;

    const firebaseConfig = String(env.FIREBASE_CONFIG || '').trim();
    if (firebaseConfig) {
        try {
            const configuredBucket = String(JSON.parse(firebaseConfig)?.storageBucket || '').trim();
            if (configuredBucket) return configuredBucket;
        } catch {
            // A malformed optional config must not hide the project-derived fallback.
        }
    }

    const projectId = String(
        env.GCLOUD_PROJECT || env.GOOGLE_CLOUD_PROJECT || env.GCP_PROJECT || ''
    ).trim();
    if (!projectId) throw new Error('COMMERCE_DOCUMENT_STORAGE_BUCKET_UNAVAILABLE');
    return `${projectId}.firebasestorage.app`;
}

function deliveryError(code, message = code) {
    const error = new functions.https.HttpsError(code, message);
    error.domainCode = message;
    return error;
}

function requireOwner(context) {
    if (!context.auth?.uid) {
        throw deliveryError('unauthenticated', 'Authentification requise.');
    }
    return context.auth.uid;
}

function recipientFor(order) {
    const email = String(order?.customerSnapshot?.email || order?.userEmail || '')
        .trim()
        .toLowerCase();
    if (!email || email.length > 254 || !email.includes('@')) {
        throw deliveryError('failed-precondition', 'Adresse e-mail de commande indisponible.');
    }
    return email;
}

function maskEmail(email) {
    const [local, domain] = String(email).split('@');
    if (!local || !domain) return 'votre adresse e-mail';
    const localMask = local.length <= 2
        ? `${local[0] || ''}•`
        : `${local.slice(0, 2)}${'•'.repeat(Math.min(6, local.length - 2))}`;
    const [domainName, ...suffix] = domain.split('.');
    const maskedDomain = `${domainName?.[0] || ''}${'•'.repeat(Math.min(5, Math.max(1, (domainName?.length || 1) - 1)))}`;
    return `${localMask}@${maskedDomain}${suffix.length ? `.${suffix.join('.')}` : ''}`;
}

function dayKey(nowMillis) {
    return new Date(nowMillis).toISOString().slice(0, 10);
}

function createDeliveryIntent({ order, document, recipient, nowMillis }) {
    const windowKey = String(Math.floor(nowMillis / EMAIL_DEDUPE_MS));
    const effectId = deterministicEffectId([
        'commerce-document-delivery',
        order.id,
        document.documentId,
        windowKey
    ]);
    const amountCents = document.kind === 'sandbox_refund_confirmation'
        ? document.refundedCents
        : document.capturedCents;
    return buildOutboxIntent({
        effectId,
        aggregateType: 'commerce_document',
        aggregateId: order.id,
        effectType: 'document_delivery_requested',
        template: 'commerce-document-copy',
        recipientRole: 'customer',
        recipientHash: crypto.createHash('sha256').update(recipient).digest('hex'),
        payloadSnapshot: {
            orderId: order.id,
            documentId: document.documentId,
            documentKind: document.kind,
            amountCents,
            currency: document.currency,
            issuedAt: document.issuedAt,
            legalStatus: document.legalStatus
        },
        clock: {
            now: () => new Date(nowMillis).toISOString(),
            nowMillis: () => nowMillis
        }
    });
}

async function queueDeliveryEmail({ db, order, document, recipient, ownerUid, nowMillis }) {
    const intent = createDeliveryIntent({ order, document, recipient, nowMillis });
    const outboxRef = db.doc(`commerce_outbox/${intent.outboxId}`);
    const limitId = `${crypto.createHash('sha256').update(ownerUid).digest('hex').slice(0, 32)}_${dayKey(nowMillis)}`;
    const limitRef = db.doc(`commerce_document_delivery_limits/${limitId}`);
    return db.runTransaction(async (transaction) => {
        const [outboxSnapshot, limitSnapshot] = await Promise.all([
            transaction.get(outboxRef),
            transaction.get(limitRef)
        ]);
        if (outboxSnapshot.exists) {
            return { reused: true, outboxId: intent.outboxId };
        }
        const currentCount = limitSnapshot.exists
            ? Number(limitSnapshot.data()?.count || 0)
            : 0;
        if (!Number.isSafeInteger(currentCount) || currentCount >= MAX_EMAILS_PER_DAY) {
            throw deliveryError(
                'resource-exhausted',
                'Limite quotidienne d’envoi atteinte. Le PDF reste disponible sur le site.'
            );
        }
        transaction.set(outboxRef, intent);
        transaction.set(limitRef, {
            schemaVersion: 1,
            ownerUidHash: crypto.createHash('sha256').update(ownerUid).digest('hex'),
            dayKey: dayKey(nowMillis),
            count: currentCount + 1,
            updatedAt: new Date(nowMillis).toISOString(),
            purgeAt: new Date(nowMillis + (8 * 24 * 60 * 60 * 1000)).toISOString()
        });
        return { reused: false, outboxId: intent.outboxId };
    });
}

function createPrepareCommerceDocumentHandler({
    dbFactory = () => admin.firestore(),
    bucketFactory = () => admin.storage().bucket(resolveStorageBucketName()),
    nowMillis = () => Date.now()
} = {}) {
    return async (data, context) => {
        const ownerUid = requireOwner(context);
        const orderId = normalizeFirestoreId(data?.orderId, 'Commande');
        const documentId = normalizeFirestoreId(data?.documentId, 'Document');
        const db = dbFactory();
        const orderRef = db.doc(`orders/${orderId}`);
        const documentRef = orderRef.collection('documents').doc(documentId);
        const [orderSnapshot, documentSnapshot] = await Promise.all([
            orderRef.get(),
            documentRef.get()
        ]);
        if (!orderSnapshot.exists || orderSnapshot.data()?.userId !== ownerUid) {
            throw deliveryError('not-found', 'Document introuvable.');
        }
        if (!documentSnapshot.exists) {
            throw deliveryError('not-found', 'Document introuvable.');
        }
        const order = { id: orderId, ...orderSnapshot.data() };
        const document = documentSnapshot.data();
        if (
            document.documentId !== documentId ||
            document.orderId !== orderId ||
            document.ownerUid !== ownerUid ||
            document.legalStatus !== 'non_fiscal_sandbox'
        ) {
            throw deliveryError('permission-denied', 'Accès au document refusé.');
        }

        const artifact = await materializeCommerceDocumentArtifact({
            bucket: bucketFactory(),
            artifactRef: documentRef.collection('artifacts').doc('current'),
            order,
            document
        });
        if (artifact.buffer.length > MAX_PDF_BYTES) {
            throw deliveryError('internal', 'Document trop volumineux.');
        }
        const recipient = recipientFor(order);
        let email = { reused: false, queued: false };
        try {
            const queued = await queueDeliveryEmail({
                db,
                order,
                document,
                recipient,
                ownerUid,
                nowMillis: nowMillis()
            });
            email = { ...queued, queued: true };
        } catch (error) {
            if (error instanceof functions.https.HttpsError) {
                email = {
                    queued: false,
                    reused: false,
                    warning: error.message
                };
            } else {
                throw error;
            }
        }

        return {
            success: true,
            document: {
                documentId,
                filename: artifact.filename,
                label: artifact.label,
                contentType: artifact.contentType,
                contentBase64: artifact.buffer.toString('base64'),
                sha256: artifact.sha256,
                size: artifact.size,
                amountCents: artifact.amountCents,
                currency: document.currency,
                issuedAt: document.issuedAt,
                legalStatus: document.legalStatus
            },
            email: {
                ...email,
                maskedRecipient: maskEmail(recipient)
            }
        };
    };
}

const prepareCommerceDocumentDelivery = regionalFunctions()
    .runWith({ enforceAppCheck: true, timeoutSeconds: 60, memory: '512MB' })
    .https.onCall(createPrepareCommerceDocumentHandler());

module.exports = {
    EMAIL_DEDUPE_MS,
    MAX_EMAILS_PER_DAY,
    createDeliveryIntent,
    createPrepareCommerceDocumentHandler,
    maskEmail,
    prepareCommerceDocumentDelivery,
    queueDeliveryEmail,
    resolveStorageBucketName
};
