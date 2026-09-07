'use strict';

const crypto = require('node:crypto');
const { readAdminPage } = require('../admin/readPage');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const {
    checkActiveStrongAdmin,
    normalizeFirestoreId
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    GMAIL_EMAIL,
    GMAIL_PASSWORD,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    TRANSACTIONAL_EMAIL_PROVIDER
} = require('../../helpers/secrets');
const createTransactionalEmailRuntime = (...args) => require('../email/transactionalEmailRuntime').createTransactionalEmailRuntime(...args);
const {
    email,
    hashInvoice,
    invoiceNumber,
    normalizeInvoiceDraft
} = require('./manualInvoiceDomain');
const renderManualInvoicePdf = (...args) => require('./manualInvoicePdf').renderManualInvoicePdf(...args);
const { invoiceEmail } = require('./manualInvoiceEmailTemplate');

const db = admin.firestore();
const PROFILE_REF = 'admin_business_profiles/invoicing';
const INVOICES_COLLECTION = 'admin_invoices';
const INVOICE_SEQUENCES_COLLECTION = 'admin_invoice_sequences';
const PRODUCTS_COLLECTION = 'artifacts/secondevie/public/data/furniture';
const INVOICE_STORAGE_ROOT = 'admin-invoices/v1';
const MAX_RECENT_INVOICES = 60;
const MAX_PRODUCTS = 300;
const EMAIL_SECRETS = [GMAIL_EMAIL, GMAIL_PASSWORD, RESEND_API_KEY];
const MANUAL_INVOICE_GEN2_RUNTIME = Object.freeze({
    region: 'europe-west1',
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '512MiB',
    timeoutSeconds: 60,
    serviceAccount: 'manual-invoice-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    enforceAppCheck: true
});

function callableError(error) {
    if (error instanceof functions.https.HttpsError) return error;
    const safeCodes = new Set([
        'MANUAL_INVOICE_FIELD_REQUIRED',
        'MANUAL_INVOICE_FIELD_TOO_LONG',
        'MANUAL_INVOICE_EMAIL_INVALID',
        'MANUAL_INVOICE_DATE_INVALID',
        'MANUAL_INVOICE_SIREN_INVALID',
        'MANUAL_INVOICE_SIRET_INVALID',
        'MANUAL_INVOICE_QUANTITY_INVALID',
        'MANUAL_INVOICE_AMOUNT_INVALID',
        'MANUAL_INVOICE_LINES_INVALID',
        'MANUAL_INVOICE_TOTAL_INVALID',
        'MANUAL_INVOICE_VAT_INVALID'
    ]);
    if (safeCodes.has(error?.code)) {
        return new functions.https.HttpsError('invalid-argument', error.message);
    }
    console.error('Manual invoice operation failed', {
        code: String(error?.code || error?.message || 'unknown').slice(0, 160)
    });
    return new functions.https.HttpsError('internal', 'La facture n’a pas pu être traitée.');
}

function snapshotTime(value) {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    return null;
}

function serializeInvoice(snapshot) {
    const value = snapshot.data();
    return {
        ...value,
        invoiceId: snapshot.id,
        createdAt: snapshotTime(value.createdAt),
        updatedAt: snapshotTime(value.updatedAt),
        issuedAt: snapshotTime(value.issuedAt),
        lastSentAt: snapshotTime(value.lastSentAt)
    };
}

function firstImage(product) {
    const candidates = [];
    if (Array.isArray(product.imageVariants)) candidates.push(...product.imageVariants);
    if (Array.isArray(product.thumbnails)) candidates.push(...product.thumbnails);
    if (product.thumbnailUrl) candidates.push(product.thumbnailUrl);
    if (Array.isArray(product.images)) candidates.push(...product.images);
    if (product.image) candidates.push(product.image);
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate) return candidate;
        if (!candidate || typeof candidate !== 'object') continue;
        for (const key of ['thumb320', 'thumb384', 'thumb', 'card', 'detailFast', 'medium', 'src', 'url']) {
            if (typeof candidate[key] === 'string' && candidate[key]) return candidate[key];
        }
    }
    return product.imageUrl || '';
}

function productPriceCents(product) {
    const price = Number(product.currentPrice ?? product.price ?? 0);
    return Number.isFinite(price) && price >= 0 ? Math.round(price * 100) : 0;
}

function serializeProduct(snapshot) {
    const product = snapshot.data();
    return {
        id: snapshot.id,
        name: String(product.name || product.title || 'Meuble').slice(0, 180),
        description: String(product.shortDescription || product.description || '').slice(0, 700),
        category: String(product.category || product.categoryId || '').slice(0, 80),
        priceCents: productPriceCents(product),
        stock: Number(product.stock || 0),
        sold: product.sold === true || Number(product.stock || 0) <= 0,
        status: String(product.status || ''),
        image: firstImage(product)
    };
}

function defaultSellerProfile() {
    return {
        businessName: process.env.INVOICE_COMPANY_NAME || 'Seconde Vie',
        legalName: process.env.INVOICE_LEGAL_NAME || '',
        siren: process.env.INVOICE_SIREN || '',
        siret: process.env.INVOICE_SIRET || '',
        address1: process.env.INVOICE_ADDRESS || '',
        address2: '',
        postalCode: process.env.INVOICE_POSTAL_CODE || '',
        city: process.env.INVOICE_CITY || 'Marseille',
        country: 'France',
        email: process.env.INVOICE_EMAIL || '',
        phone: process.env.INVOICE_PHONE || '',
        vatMode: 'franchise',
        vatNumber: '',
        legalForm: process.env.INVOICE_LEGAL_FORM || ''
    };
}

async function getManualInvoiceWorkspaceHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const [profileSnapshot, invoicesSnapshot, productsSnapshot] = await Promise.all([
        db.doc(PROFILE_REF).get(),
        data?.productsOnly === true ? Promise.resolve({ docs: [] }) : readAdminPage({ collection: db.collection(INVOICES_COLLECTION), sortField: 'updatedAt', pageSize: MAX_RECENT_INVOICES, cursor: data?.cursor, referenceField: 'number', reference: data?.reference }),
        data?.includeProducts === false ? Promise.resolve({ docs: [] }) : db.collection(PRODUCTS_COLLECTION).limit(MAX_PRODUCTS).get()
    ]);
    return {
        seller: profileSnapshot.exists ? profileSnapshot.data().seller : defaultSellerProfile(),
        invoices: invoicesSnapshot.docs.map(serializeInvoice),
        nextCursor: invoicesSnapshot.nextCursor || null,
        hasMore: invoicesSnapshot.hasMore === true,
        coverage: invoicesSnapshot.coverage || 'complete',
        products: productsSnapshot.docs
            .map(serializeProduct)
            .sort((left, right) => left.name.localeCompare(right.name, 'fr'))
    };
}

async function saveManualInvoiceDraftHandler(data, context) {
    await checkActiveStrongAdmin(context);
    try {
        const normalized = normalizeInvoiceDraft(data?.invoice || {});
        const providedId = data?.invoiceId
            ? normalizeFirestoreId(data.invoiceId, 'Facture')
            : null;
        const invoiceRef = providedId
            ? db.collection(INVOICES_COLLECTION).doc(providedId)
            : db.collection(INVOICES_COLLECTION).doc();
        const expectedVersion = data?.expectedVersion == null ? null : Number(data.expectedVersion);
        const now = admin.firestore.Timestamp.now();
        const saved = await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(invoiceRef);
            const current = snapshot.exists ? snapshot.data() : null;
            if (current?.status === 'issued') {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'Une facture émise est verrouillée. Dupliquez-la pour créer une nouvelle version.'
                );
            }
            if (
                current && expectedVersion !== null &&
                (!Number.isSafeInteger(expectedVersion) || expectedVersion !== current.version)
            ) {
                throw new functions.https.HttpsError(
                    'aborted',
                    'Cette facture a été modifiée ailleurs. Rechargez-la avant de continuer.'
                );
            }
            const version = Number(current?.version || 0) + 1;
            const record = {
                ...normalized,
                invoiceId: invoiceRef.id,
                status: 'draft',
                number: null,
                version,
                contentHash: hashInvoice(normalized),
                createdAt: current?.createdAt || now,
                createdBy: current?.createdBy || context.auth.uid,
                updatedAt: now,
                updatedBy: context.auth.uid,
                issuedAt: null,
                issuedBy: null,
                emailStatus: current?.emailStatus || 'not_sent',
                lastSentAt: null,
                lastRecipientHash: null
            };
            transaction.set(invoiceRef, record);
            transaction.set(db.doc(PROFILE_REF), {
                schemaVersion: 1,
                seller: normalized.seller,
                updatedAt: now,
                updatedBy: context.auth.uid
            }, { merge: true });
            return record;
        });
        return {
            success: true,
            invoice: {
                ...saved,
                createdAt: snapshotTime(saved.createdAt),
                updatedAt: snapshotTime(saved.updatedAt)
            }
        };
    } catch (error) {
        throw callableError(error);
    }
}

async function loadInvoice(invoiceId) {
    const normalizedId = normalizeFirestoreId(invoiceId, 'Facture');
    const snapshot = await db.collection(INVOICES_COLLECTION).doc(normalizedId).get();
    if (!snapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'Facture introuvable.');
    }
    return { ref: snapshot.ref, invoice: serializeInvoice(snapshot) };
}

async function prepareManualInvoicePdfHandler(data, context) {
    await checkActiveStrongAdmin(context);
    try {
        const { ref, invoice } = await loadInvoice(data?.invoiceId);
        const artifact = invoice.status === 'issued'
            ? await materializeIssuedInvoice(ref, invoice)
            : renderManualInvoicePdf(invoice, { draft: true });
        return {
            success: true,
            document: {
                filename: artifact.filename,
                contentType: artifact.contentType,
                contentBase64: artifact.buffer.toString('base64'),
                sha256: artifact.sha256,
                size: artifact.size,
                status: invoice.status,
                number: invoice.number || null
            }
        };
    } catch (error) {
        throw callableError(error);
    }
}

async function issueInvoice({ invoiceId, sendRequestId, recipient, actorUid }) {
    const invoiceRef = db.collection(INVOICES_COLLECTION).doc(invoiceId);
    const deliveryRef = invoiceRef.collection('deliveries').doc(sendRequestId);
    return db.runTransaction(async (transaction) => {
        const [invoiceSnapshot, deliverySnapshot] = await Promise.all([
            transaction.get(invoiceRef),
            transaction.get(deliveryRef)
        ]);
        if (!invoiceSnapshot.exists) {
            throw new functions.https.HttpsError('not-found', 'Facture introuvable.');
        }
        const current = invoiceSnapshot.data();
        const recipientHash = crypto.createHash('sha256').update(recipient).digest('hex');
        const delivery = deliverySnapshot.exists ? deliverySnapshot.data() : null;
        if (delivery?.recipientHash && delivery.recipientHash !== recipientHash) {
            throw new functions.https.HttpsError('failed-precondition', 'Cette demande d’envoi appartient à un autre destinataire.');
        }
        if (deliverySnapshot.exists && deliverySnapshot.data()?.status === 'sent') {
            return { invoice: { ...current, invoiceId }, deliveryRef, alreadySent: true };
        }
        if (['sending', 'delivery_unknown'].includes(delivery?.status)
            || ['sending', 'delivery_unknown'].includes(current.emailStatus)) {
            throw new functions.https.HttpsError('failed-precondition', 'Un envoi est en cours ou doit être vérifié avant de renvoyer cette facture.');
        }

        let invoice = { ...current, invoiceId };
        if (current.status === 'draft') {
            const year = String(current.issueDate || '').slice(0, 4);
            const sequenceRef = db.collection(INVOICE_SEQUENCES_COLLECTION).doc(year);
            const sequenceSnapshot = await transaction.get(sequenceRef);
            const next = Number(sequenceSnapshot.data()?.lastSequence || 0) + 1;
            const number = invoiceNumber(year, next);
            const issuedAt = admin.firestore.Timestamp.now();
            invoice = {
                ...invoice,
                status: 'issued',
                number,
                issuedAt,
                issuedBy: actorUid,
                version: Number(current.version || 0) + 1
            };
            invoice.contentHash = hashInvoice(invoice);
            transaction.set(sequenceRef, {
                schemaVersion: 1,
                year,
                lastSequence: next,
                lastInvoiceId: invoiceId,
                updatedAt: issuedAt
            }, { merge: true });
            transaction.update(invoiceRef, {
                status: invoice.status,
                number: invoice.number,
                issuedAt,
                issuedBy: actorUid,
                version: invoice.version,
                contentHash: invoice.contentHash,
                updatedAt: issuedAt,
                updatedBy: actorUid,
                emailStatus: 'sending'
            });
        } else if (current.status !== 'issued') {
            throw new functions.https.HttpsError('failed-precondition', 'État de facture invalide.');
        } else {
            transaction.update(invoiceRef, { emailStatus: 'sending' });
        }
        transaction.set(deliveryRef, {
            schemaVersion: 1,
            sendRequestId,
            status: 'sending',
            recipientHash,
            startedAt: admin.firestore.Timestamp.now(),
            startedBy: actorUid,
            provider: null,
            providerMessageId: null,
            errorCode: null,
            completedAt: null
        });
        return { invoice, deliveryRef, alreadySent: false };
    });
}

async function materializeIssuedInvoice(invoiceRef, invoice) {
    const contentHash = hashInvoice(invoice);
    const storagePath = `${INVOICE_STORAGE_ROOT}/${invoice.invoiceId}/${contentHash}.pdf`;
    const file = admin.storage().bucket().file(storagePath);
    const [exists] = await file.exists();
    if (!exists) {
        const rendered = renderManualInvoicePdf(invoice, { draft: false });
        try { await file.save(rendered.buffer, {
            resumable: false,
            preconditionOpts: { ifGenerationMatch: 0 },
            contentType: rendered.contentType,
            metadata: {
                cacheControl: 'private, max-age=0, no-store',
                metadata: {
                    invoiceId: invoice.invoiceId,
                    invoiceNumber: invoice.number,
                    contentHash,
                    sha256: rendered.sha256
                }
            }
        }); } catch (error) {
            // A concurrent materialization won: reuse that immutable object.
            if (Number(error?.code) !== 412) throw error;
        }
    }
    const [metadata] = await file.getMetadata();
    if (!Number.isSafeInteger(Number(metadata.size)) || Number(metadata.size) < 100 || Number(metadata.size) > 2 * 1024 * 1024) {
        throw new Error('MANUAL_INVOICE_PDF_SIZE_INVALID');
    }
    const [buffer] = await admin.storage().bucket().file(storagePath, { generation: metadata.generation }).download();
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    if (buffer.length !== Number(metadata.size) || buffer.subarray(0, 5).toString() !== '%PDF-' || (metadata.metadata?.sha256 && metadata.metadata.sha256 !== sha256)) {
        throw new Error('MANUAL_INVOICE_ARTIFACT_INTEGRITY');
    }
    const artifact = {
        buffer, contentHash, sha256, size: buffer.length, contentType: 'application/pdf',
        filename: `Facture_${String(invoice.number || 'BROUILLON').replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`
    };
    const artifactRef = invoiceRef.collection('artifacts').doc(contentHash);
    await db.runTransaction(async transaction => {
        const existing = await transaction.get(artifactRef);
        if (existing.exists) {
            if (existing.data().sha256 !== sha256) throw new Error('MANUAL_INVOICE_ARTIFACT_INTEGRITY');
            return;
        }
        const { buffer: _buffer, ...descriptor } = artifact;
        void _buffer;
        transaction.create(artifactRef, {
            schemaVersion: 1, ...descriptor, storagePath,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
    return artifact;
}

async function sendManualInvoiceHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const invoiceId = normalizeFirestoreId(data?.invoiceId, 'Facture');
    const sendRequestId = normalizeFirestoreId(data?.sendRequestId, 'Envoi');
    let recipient;
    let claimedDelivery = null;
    let accepted = false;
    try {
        recipient = email(data?.recipient, { required: true });
        const issued = await issueInvoice({
            invoiceId,
            sendRequestId,
            recipient,
            actorUid: context.auth.uid
        });
        if (issued.alreadySent) {
            return { success: true, alreadySent: true, invoice: issued.invoice };
        }
        claimedDelivery = issued.deliveryRef;
        const invoiceRef = db.collection(INVOICES_COLLECTION).doc(invoiceId);
        const artifact = await materializeIssuedInvoice(invoiceRef, issued.invoice);
        const runtime = createTransactionalEmailRuntime({
            provider: TRANSACTIONAL_EMAIL_PROVIDER.value(),
            gmailUser: GMAIL_EMAIL.value(),
            gmailPassword: GMAIL_PASSWORD.value(),
            resendApiKey: RESEND_API_KEY.value(),
            resendFromEmail: RESEND_FROM_EMAIL.value()
        });
        const result = await runtime.sender.send(
            invoiceEmail(issued.invoice, recipient, runtime.fromAddress, artifact),
            { idempotencyKey: `manual-invoice/${sendRequestId}` }
        );
        accepted = true;
        if (!result?.id) throw new Error('MANUAL_INVOICE_PROVIDER_RESPONSE_INVALID');
        const completedAt = admin.firestore.Timestamp.now();
        await db.runTransaction(async (transaction) => {
            transaction.update(issued.deliveryRef, {
                status: 'sent',
                provider: result.provider,
                providerMessageId: result.id,
                completedAt
            });
            transaction.update(invoiceRef, {
                emailStatus: 'sent',
                lastSentAt: completedAt,
                lastRecipientHash: crypto.createHash('sha256').update(recipient).digest('hex'),
                updatedAt: completedAt
            });
        });
        return {
            success: true,
            alreadySent: false,
            invoice: {
                ...issued.invoice,
                issuedAt: snapshotTime(issued.invoice.issuedAt),
                emailStatus: 'sent',
                lastSentAt: completedAt.toDate().toISOString()
            },
            document: {
                filename: artifact.filename,
                sha256: artifact.sha256,
                size: artifact.size
            }
        };
    } catch (error) {
        if (claimedDelivery) {
            const ambiguous = accepted || ['ECONNRESET', 'ESOCKET', 'ETIMEDOUT', 'GMAIL_SEND_FAILED'].includes(error?.code);
            await db.runTransaction(async (transaction) => {
                const delivery = await transaction.get(claimedDelivery);
                // A denied duplicate never owns this write; a successful commit
                // whose response was lost must keep its durable sent status.
                if (delivery.data()?.status !== 'sending') return;
                transaction.update(claimedDelivery, {
                    status: ambiguous ? 'delivery_unknown' : 'failed',
                    errorCode: String(error?.code || 'SEND_FAILED').slice(0, 120),
                    completedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                transaction.update(db.collection(INVOICES_COLLECTION).doc(invoiceId), {
                    emailStatus: ambiguous ? 'delivery_unknown' : 'failed',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }).catch(() => {});
        }
        throw callableError(error);
    }
}

const getManualInvoiceWorkspaceAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true, timeoutSeconds: 30, memory: '512MB' })
    .https.onCall(getManualInvoiceWorkspaceHandler);

const saveManualInvoiceDraftAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true, timeoutSeconds: 30, memory: '512MB' })
    .https.onCall(saveManualInvoiceDraftHandler);

const prepareManualInvoicePdfAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true, timeoutSeconds: 60, memory: '512MB' })
    .https.onCall(prepareManualInvoicePdfHandler);

const sendManualInvoiceAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true, secrets: EMAIL_SECRETS, timeoutSeconds: 60, memory: '512MB' })
    .https.onCall(sendManualInvoiceHandler);

module.exports = {
    getManualInvoiceWorkspaceAdmin,
    getManualInvoiceWorkspaceAdminGen2: onCall(
        { ...MANUAL_INVOICE_GEN2_RUNTIME, timeoutSeconds: 30 },
        async (request) => getManualInvoiceWorkspaceHandler(request.data, request)
    ),
    getManualInvoiceWorkspaceHandler,
    prepareManualInvoicePdfAdmin,
    prepareManualInvoicePdfAdminGen2: onCall(
        MANUAL_INVOICE_GEN2_RUNTIME,
        async (request) => prepareManualInvoicePdfHandler(request.data, request)
    ),
    prepareManualInvoicePdfHandler,
    saveManualInvoiceDraftAdmin,
    saveManualInvoiceDraftAdminGen2: onCall(
        { ...MANUAL_INVOICE_GEN2_RUNTIME, timeoutSeconds: 30 },
        async (request) => saveManualInvoiceDraftHandler(request.data, request)
    ),
    saveManualInvoiceDraftHandler,
    sendManualInvoiceAdmin,
    sendManualInvoiceAdminGen2: onCall(
        { ...MANUAL_INVOICE_GEN2_RUNTIME, secrets: EMAIL_SECRETS },
        async (request) => sendManualInvoiceHandler(request.data, request)
    ),
    sendManualInvoiceHandler,
    serializeProduct
};
