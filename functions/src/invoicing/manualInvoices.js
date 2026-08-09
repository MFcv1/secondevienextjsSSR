'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
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
const {
    createTransactionalEmailRuntime
} = require('../email/transactionalEmailRuntime');
const {
    escapeHtml,
    renderCallout,
    renderEmailShell,
    renderSummaryGrid
} = require('../email/emailDesignSystem');
const {
    email,
    hashInvoice,
    invoiceNumber,
    normalizeInvoiceDraft
} = require('./manualInvoiceDomain');
const { renderManualInvoicePdf } = require('./manualInvoicePdf');

const db = admin.firestore();
const PROFILE_REF = 'admin_business_profiles/invoicing';
const INVOICES_COLLECTION = 'admin_invoices';
const INVOICE_SEQUENCES_COLLECTION = 'admin_invoice_sequences';
const PRODUCTS_COLLECTION = 'artifacts/secondevie/public/data/furniture';
const INVOICE_STORAGE_ROOT = 'admin-invoices/v1';
const MAX_RECENT_INVOICES = 60;
const MAX_PRODUCTS = 300;
const EMAIL_SECRETS = [GMAIL_EMAIL, GMAIL_PASSWORD, RESEND_API_KEY];

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
    if (Array.isArray(product.images)) candidates.push(...product.images);
    if (product.image) candidates.push(product.image);
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate) return candidate;
        if (!candidate || typeof candidate !== 'object') continue;
        for (const key of ['thumb384', 'thumb320', 'thumb', 'card', 'medium', 'src', 'url']) {
            if (typeof candidate[key] === 'string' && candidate[key]) return candidate[key];
        }
    }
    return product.thumbnailUrl || product.imageUrl || '';
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

async function getManualInvoiceWorkspaceHandler(_data, context) {
    await checkActiveStrongAdmin(context);
    const [profileSnapshot, invoicesSnapshot, productsSnapshot] = await Promise.all([
        db.doc(PROFILE_REF).get(),
        db.collection(INVOICES_COLLECTION).orderBy('updatedAt', 'desc').limit(MAX_RECENT_INVOICES).get(),
        db.collection(PRODUCTS_COLLECTION).limit(MAX_PRODUCTS).get()
    ]);
    return {
        seller: profileSnapshot.exists ? profileSnapshot.data().seller : defaultSellerProfile(),
        invoices: invoicesSnapshot.docs.map(serializeInvoice),
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
        const { invoice } = await loadInvoice(data?.invoiceId);
        const artifact = renderManualInvoicePdf(invoice, { draft: invoice.status !== 'issued' });
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
        if (deliverySnapshot.exists && deliverySnapshot.data()?.status === 'sent') {
            return { invoice: { ...current, invoiceId }, deliveryRef, alreadySent: true };
        }
        if (deliverySnapshot.exists && deliverySnapshot.data()?.status === 'sending') {
            const startedAt = deliverySnapshot.data()?.startedAt?.toMillis?.() || 0;
            if (Date.now() - startedAt < 2 * 60 * 1000) {
                throw new functions.https.HttpsError('aborted', 'Cet envoi est déjà en cours.');
            }
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
            recipientHash: crypto.createHash('sha256').update(recipient).digest('hex'),
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
    const artifact = renderManualInvoicePdf(invoice, { draft: false });
    const storagePath = `${INVOICE_STORAGE_ROOT}/${invoice.invoiceId}/${artifact.contentHash}.pdf`;
    const file = admin.storage().bucket().file(storagePath);
    const [exists] = await file.exists();
    if (!exists) {
        await file.save(artifact.buffer, {
            resumable: false,
            contentType: artifact.contentType,
            metadata: {
                cacheControl: 'private, max-age=0, no-store',
                metadata: {
                    invoiceId: invoice.invoiceId,
                    invoiceNumber: invoice.number,
                    contentHash: artifact.contentHash,
                    sha256: artifact.sha256
                }
            }
        });
    }
    await invoiceRef.collection('artifacts').doc(artifact.contentHash).set({
        schemaVersion: 1,
        contentHash: artifact.contentHash,
        sha256: artifact.sha256,
        size: artifact.size,
        filename: artifact.filename,
        contentType: artifact.contentType,
        storagePath,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return artifact;
}

function formatMoney(cents) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
        .format(Number(cents || 0) / 100);
}

function customerDisplayName(customer) {
    return customer.customerType === 'business'
        ? customer.businessName
        : [customer.firstName, customer.lastName].filter(Boolean).join(' ');
}

function invoiceEmail(invoice, recipient, senderEmail, artifact) {
    const name = customerDisplayName(invoice.customer);
    const contentHtml = `
        <div style="font:400 14px/1.65 Arial,Helvetica,sans-serif;color:#57504a;">
            ${invoice.lines.slice(0, 8).map((line) => `
                <div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #ded7cc;">
                    <span>${escapeHtml(`${line.quantity} × ${line.name}`)}</span>
                    <strong style="white-space:nowrap;color:#1c1917;">${escapeHtml(formatMoney(line.totalCents))}</strong>
                </div>
            `).join('')}
        </div>`;
    return {
        from: `${invoice.seller.businessName} <${senderEmail}>`,
        to: recipient,
        replyTo: invoice.seller.email || senderEmail,
        subject: `Votre facture ${invoice.number} · ${invoice.seller.businessName}`,
        text: [
            `Bonjour ${name},`,
            `Votre facture ${invoice.number} d’un montant de ${formatMoney(invoice.totalCents)} est jointe à cet e-mail.`,
            `Émise le ${invoice.issueDate}.`,
            `Pour toute question : ${invoice.seller.email}`
        ].join('\n'),
        html: renderEmailShell({
            preheader: `Facture ${invoice.number} — ${formatMoney(invoice.totalCents)}`,
            eyebrow: 'Votre facture',
            title: 'Votre document est prêt.',
            intro: `Bonjour ${name}, vous trouverez votre facture en pièce jointe à cet e-mail.`,
            summaryHtml: renderSummaryGrid([
                { label: 'Facture', value: invoice.number },
                { label: 'Émission', value: invoice.issueDate },
                { label: 'Total', value: formatMoney(invoice.totalCents) }
            ]),
            contentHtml,
            calloutHtml: renderCallout({
                title: 'Document joint au format PDF',
                body: 'Conservez ce document avec vos justificatifs. Répondez à cet e-mail si une information doit être vérifiée.',
                role: 'info',
                detail: artifact.filename
            }),
            footer: `Facture émise par ${invoice.seller.legalName} · SIREN ${invoice.seller.siren}.`
        }),
        attachments: [{
            filename: artifact.filename,
            content: artifact.buffer,
            contentType: artifact.contentType
        }]
    };
}

async function sendManualInvoiceHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const invoiceId = normalizeFirestoreId(data?.invoiceId, 'Facture');
    const sendRequestId = normalizeFirestoreId(data?.sendRequestId, 'Envoi');
    let recipient;
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
        if (invoiceId && sendRequestId) {
            const deliveryRef = db.collection(INVOICES_COLLECTION).doc(invoiceId)
                .collection('deliveries').doc(sendRequestId);
            const ambiguous = ['ECONNRESET', 'ESOCKET', 'ETIMEDOUT', 'GMAIL_SEND_FAILED'].includes(error?.code);
            await Promise.allSettled([
                deliveryRef.set({
                    status: ambiguous ? 'delivery_unknown' : 'failed',
                    errorCode: String(error?.code || 'SEND_FAILED').slice(0, 120),
                    completedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true }),
                db.collection(INVOICES_COLLECTION).doc(invoiceId).set({
                    emailStatus: ambiguous ? 'delivery_unknown' : 'failed',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true })
            ]);
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
    getManualInvoiceWorkspaceHandler,
    prepareManualInvoicePdfAdmin,
    prepareManualInvoicePdfHandler,
    saveManualInvoiceDraftAdmin,
    saveManualInvoiceDraftHandler,
    sendManualInvoiceAdmin,
    sendManualInvoiceHandler,
    serializeProduct
};
