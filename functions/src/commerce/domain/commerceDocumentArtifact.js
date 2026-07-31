'use strict';

const crypto = require('node:crypto');
const { jsPDF } = require('jspdf');

const PDF_CONTENT_TYPE = 'application/pdf';
const MAX_PDF_BYTES = 2 * 1024 * 1024;
const ARTIFACT_ROOT = 'commerce-documents/v2';

function artifactError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function safeText(value, fallback = '') {
    const normalized = String(value ?? fallback)
        .split('')
        .map((character) => {
            const code = character.charCodeAt(0);
            return code < 32 || code === 127 ? ' ' : character;
        })
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
    return normalized || fallback;
}

function safeSegment(value, label) {
    const normalized = safeText(value);
    if (!normalized || normalized.length > 180 || normalized.includes('/')) {
        throw artifactError(`COMMERCE_DOCUMENT_${label}_INVALID`);
    }
    return normalized;
}

function formatMoney(cents, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: String(currency || 'EUR').toUpperCase()
    }).format(Number(cents || 0) / 100);
}

function formatDate(value) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return 'Date indisponible';
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
        timeZone: 'Europe/Paris'
    }).format(new Date(parsed));
}

function descriptorFor(document) {
    if (document.kind === 'sandbox_refund_confirmation') {
        return {
            title: 'CONFIRMATION DE REMBOURSEMENT',
            label: 'Confirmation de remboursement',
            amountLabel: 'Montant remboursé',
            amountCents: document.refundedCents,
            filenamePrefix: 'Confirmation_remboursement'
        };
    }
    if (document.kind === 'sandbox_payment_receipt') {
        return {
            title: 'REÇU DE PAIEMENT',
            label: 'Reçu de paiement',
            amountLabel: 'Montant encaissé',
            amountCents: document.capturedCents,
            filenamePrefix: 'Recu_paiement'
        };
    }
    throw artifactError('COMMERCE_DOCUMENT_KIND_INVALID');
}

function validateInput(order, document) {
    if (
        !order ||
        !document ||
        order.schemaVersion !== 2 ||
        document.schemaVersion !== 2 ||
        document.orderId !== order.id ||
        document.ownerUid !== order.userId ||
        document.legalStatus !== 'non_fiscal_sandbox' ||
        document.currency !== 'EUR' ||
        typeof document.contentHash !== 'string'
    ) {
        throw artifactError('COMMERCE_DOCUMENT_ARTIFACT_INPUT_INVALID');
    }
    safeSegment(order.id, 'ORDER_ID');
    safeSegment(document.documentId, 'ID');
    descriptorFor(document);
}

function addFooter(pdf) {
    const pages = pdf.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
        pdf.setPage(page);
        pdf.setDrawColor(226, 226, 231);
        pdf.line(15, 272, 195, 272);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 105);
        pdf.text(
            'Document sandbox — non fiscal. Il ne constitue ni une facture ni un avoir fiscal.',
            15,
            279,
            { maxWidth: 155 }
        );
        pdf.text(`${page}/${pages}`, 195, 279, { align: 'right' });
    }
}

function renderCommerceDocumentPdf({ order, document }) {
    validateInput(order, document);
    const descriptor = descriptorFor(document);
    const shortOrderId = safeText(order.id).slice(0, 12).toUpperCase();
    const filename = `${descriptor.filenamePrefix}_CMD-${shortOrderId}.pdf`;
    const customerName = safeText(
        order.customerSnapshot?.fullName ||
        order.shippingSnapshot?.fullName ||
        order.userEmail,
        'Client'
    );
    const issuedAtMillis = Date.parse(document.issuedAt);
    const creationDate = Number.isFinite(issuedAtMillis)
        ? new Date(issuedAtMillis)
        : new Date('2026-01-01T00:00:00.000Z');

    const pdf = new jsPDF({
        compress: true,
        putOnlyUsedFonts: true,
        unit: 'mm',
        format: 'a4'
    });
    pdf.setLanguage('fr-FR');
    pdf.setProperties({
        title: descriptor.label,
        subject: `Commande CMD-${shortOrderId}`,
        author: 'Seconde Vie',
        creator: 'Seconde Vie'
    });
    pdf.setCreationDate(creationDate);
    pdf.setFileId(sha256(document.documentId).slice(0, 32).toUpperCase());

    const drawHeader = () => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(17);
        pdf.setTextColor(29, 29, 31);
        pdf.text('Seconde Vie.', 15, 20);
        pdf.setFontSize(14);
        pdf.text(descriptor.title, 195, 20, { align: 'right' });
        pdf.setFillColor(248, 238, 224);
        pdf.roundedRect(15, 29, 180, 17, 2, 2, 'F');
        pdf.setTextColor(126, 72, 26);
        pdf.setFontSize(9);
        pdf.text('DOCUMENT SANDBOX — NON FISCAL', 105, 39.5, { align: 'center' });
        pdf.setTextColor(29, 29, 31);
    };

    drawHeader();
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Commande : CMD-${shortOrderId}`, 15, 59);
    pdf.text(`Client : ${customerName}`, 15, 67, { maxWidth: 180 });
    pdf.text(`Émission : ${formatDate(document.issuedAt)}`, 15, 75);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 105);
    pdf.text(`Référence document : ${document.documentId}`, 15, 83, { maxWidth: 180 });

    let y = 98;
    const drawTableHeader = () => {
        pdf.setFillColor(35, 35, 35);
        pdf.rect(15, y, 180, 10, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Qté', 19, y + 6.5);
        pdf.text('Désignation', 35, y + 6.5);
        pdf.text('Prix unitaire', 158, y + 6.5, { align: 'right' });
        pdf.text('Montant', 191, y + 6.5, { align: 'right' });
        y += 10;
    };
    drawTableHeader();

    const items = Array.isArray(order.items) && order.items.length
        ? order.items.slice(0, 20)
        : [{ quantity: 1, titleSnapshot: 'Commande enregistrée', unitAmountCents: 0 }];
    for (const item of items) {
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const unitCents = Number.isSafeInteger(item.unitAmountCents)
            ? item.unitAmountCents
            : Math.round((Number(item.price) || 0) * 100);
        const title = safeText(item.titleSnapshot || item.name, 'Pièce restaurée');
        const titleLines = pdf.splitTextToSize(title, 90).slice(0, 3);
        const rowHeight = Math.max(12, titleLines.length * 5 + 5);
        if (y + rowHeight > 258) {
            pdf.addPage();
            drawHeader();
            y = 55;
            drawTableHeader();
        }
        pdf.setDrawColor(226, 226, 231);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(15, y, 180, rowHeight, 'FD');
        pdf.setTextColor(29, 29, 31);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.text(String(quantity), 22, y + 7, { align: 'center' });
        pdf.text(titleLines, 35, y + 6);
        pdf.text(formatMoney(unitCents, document.currency), 158, y + 7, { align: 'right' });
        pdf.text(formatMoney(unitCents * quantity, document.currency), 191, y + 7, { align: 'right' });
        y += rowHeight;
    }

    if (y > 244) {
        pdf.addPage();
        drawHeader();
        y = 58;
    }
    y += 14;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(29, 29, 31);
    pdf.text(descriptor.amountLabel, 158, y, { align: 'right' });
    pdf.text(formatMoney(descriptor.amountCents, document.currency), 195, y, { align: 'right' });

    addFooter(pdf);
    const buffer = Buffer.from(pdf.output('arraybuffer'));
    if (buffer.length < 100 || buffer.length > MAX_PDF_BYTES) {
        throw artifactError('COMMERCE_DOCUMENT_ARTIFACT_SIZE_INVALID');
    }
    return Object.freeze({
        buffer,
        filename,
        contentType: PDF_CONTENT_TYPE,
        sha256: sha256(buffer),
        size: buffer.length,
        label: descriptor.label,
        amountCents: descriptor.amountCents
    });
}

function validateStoredRecord(record, document) {
    return Boolean(
        record &&
        record.schemaVersion === 1 &&
        record.sourceContentHash === document.contentHash &&
        typeof record.storagePath === 'string' &&
        record.storagePath.startsWith(`${ARTIFACT_ROOT}/`) &&
        /^[a-f0-9]{64}$/.test(record.sha256 || '') &&
        Number.isSafeInteger(record.size) &&
        record.size > 0 &&
        record.size <= MAX_PDF_BYTES &&
        typeof record.filename === 'string'
    );
}

async function readStoredArtifact({ bucket, record }) {
    const file = bucket.file(record.storagePath);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [buffer] = await file.download();
    if (buffer.length !== record.size || sha256(buffer) !== record.sha256) {
        throw artifactError('COMMERCE_DOCUMENT_ARTIFACT_INTEGRITY_FAILED');
    }
    return {
        buffer,
        file,
        filename: record.filename,
        contentType: PDF_CONTENT_TYPE,
        sha256: record.sha256,
        size: record.size,
        label: record.label,
        amountCents: record.amountCents,
        storagePath: record.storagePath
    };
}

async function materializeCommerceDocumentArtifact({
    bucket,
    artifactRef,
    order,
    document,
    now = () => new Date().toISOString()
}) {
    if (!bucket?.file || !artifactRef?.get || !artifactRef?.create) {
        throw artifactError('COMMERCE_DOCUMENT_ARTIFACT_DEPENDENCY_INVALID');
    }
    validateInput(order, document);
    const existingSnapshot = await artifactRef.get();
    if (existingSnapshot.exists) {
        const record = existingSnapshot.data();
        if (!validateStoredRecord(record, document)) {
            throw artifactError('COMMERCE_DOCUMENT_ARTIFACT_RECORD_INVALID');
        }
        const stored = await readStoredArtifact({ bucket, record });
        if (stored) return stored;
    }

    const rendered = renderCommerceDocumentPdf({ order, document });
    const ownerHash = sha256(document.ownerUid).slice(0, 32);
    const orderId = safeSegment(order.id, 'ORDER_ID');
    const documentId = safeSegment(document.documentId, 'ID');
    const storagePath = `${ARTIFACT_ROOT}/${ownerHash}/${orderId}/${documentId}/${rendered.sha256}.pdf`;
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();
    if (!exists) {
        try {
            await file.save(rendered.buffer, {
                resumable: false,
                contentType: PDF_CONTENT_TYPE,
                metadata: {
                    cacheControl: 'private, no-store, max-age=0',
                    metadata: {
                        sha256: rendered.sha256,
                        sourceContentHash: document.contentHash
                    }
                },
                preconditionOpts: { ifGenerationMatch: 0 }
            });
        } catch (error) {
            if (![409, 412].includes(Number(error?.code))) throw error;
        }
    }
    const record = {
        schemaVersion: 1,
        sourceContentHash: document.contentHash,
        storagePath,
        sha256: rendered.sha256,
        size: rendered.size,
        filename: rendered.filename,
        label: rendered.label,
        amountCents: rendered.amountCents,
        contentType: PDF_CONTENT_TYPE,
        generatedAt: now()
    };
    try {
        await artifactRef.create(record);
    } catch (error) {
        if (error?.code !== 6 && error?.code !== 'already-exists') throw error;
        const concurrent = await artifactRef.get();
        if (!concurrent.exists || !validateStoredRecord(concurrent.data(), document)) {
            throw artifactError('COMMERCE_DOCUMENT_ARTIFACT_CONFLICT');
        }
        const stored = await readStoredArtifact({ bucket, record: concurrent.data() });
        if (!stored) throw artifactError('COMMERCE_DOCUMENT_ARTIFACT_MISSING');
        return stored;
    }
    return {
        ...rendered,
        file,
        storagePath
    };
}

module.exports = {
    ARTIFACT_ROOT,
    MAX_PDF_BYTES,
    PDF_CONTENT_TYPE,
    materializeCommerceDocumentArtifact,
    renderCommerceDocumentPdf,
    sha256
};
