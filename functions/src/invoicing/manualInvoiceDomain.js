'use strict';

const crypto = require('node:crypto');

const MAX_LINES = 30;
const MAX_TEXT_LENGTH = 500;

function invoiceError(code, message = code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function text(value, label, { required = false, max = MAX_TEXT_LENGTH } = {}) {
    const normalized = String(value ?? '').trim().replace(/\s+/g, ' ');
    if (required && !normalized) throw invoiceError('MANUAL_INVOICE_FIELD_REQUIRED', `${label} requis.`);
    if (normalized.length > max) throw invoiceError('MANUAL_INVOICE_FIELD_TOO_LONG', `${label} trop long.`);
    return normalized;
}

function multiline(value, label, { max = 2000 } = {}) {
    const normalized = String(value ?? '').trim().replace(/\r\n?/g, '\n');
    if (normalized.length > max) throw invoiceError('MANUAL_INVOICE_FIELD_TOO_LONG', `${label} trop long.`);
    return normalized;
}

function email(value, { required = false } = {}) {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (!normalized && !required) return '';
    if (
        !normalized || normalized.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ) {
        throw invoiceError('MANUAL_INVOICE_EMAIL_INVALID', 'Adresse e-mail invalide.');
    }
    return normalized;
}

function date(value, label, { required = true } = {}) {
    const normalized = String(value ?? '').trim();
    if (!normalized && !required) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || !Number.isFinite(Date.parse(`${normalized}T12:00:00.000Z`))) {
        throw invoiceError('MANUAL_INVOICE_DATE_INVALID', `${label} invalide.`);
    }
    return normalized;
}

function postalAddress(input = {}, label) {
    return {
        address1: text(input.address1, `${label} — adresse`, { required: true, max: 160 }),
        address2: text(input.address2, `${label} — complément`, { max: 160 }),
        postalCode: text(input.postalCode, `${label} — code postal`, { required: true, max: 20 }),
        city: text(input.city, `${label} — ville`, { required: true, max: 100 }),
        country: text(input.country || 'France', `${label} — pays`, { required: true, max: 100 })
    };
}

function normalizeSeller(input = {}) {
    const siren = text(input.siren, 'SIREN', { required: true, max: 20 }).replace(/\s/g, '');
    if (!/^\d{9}$/.test(siren)) throw invoiceError('MANUAL_INVOICE_SIREN_INVALID', 'Le SIREN doit contenir 9 chiffres.');
    const siret = text(input.siret, 'SIRET', { max: 20 }).replace(/\s/g, '');
    if (siret && !/^\d{14}$/.test(siret)) throw invoiceError('MANUAL_INVOICE_SIRET_INVALID', 'Le SIRET doit contenir 14 chiffres.');
    const vatMode = ['franchise', 'standard', 'margin'].includes(input.vatMode)
        ? input.vatMode
        : 'franchise';
    return {
        businessName: text(input.businessName, 'Nom commercial', { required: true, max: 120 }),
        legalName: text(input.legalName, 'Nom légal', { required: true, max: 160 }),
        siren,
        siret,
        ...postalAddress(input, 'Entreprise'),
        email: email(input.email, { required: true }),
        phone: text(input.phone, 'Téléphone entreprise', { max: 40 }),
        vatMode,
        vatNumber: text(input.vatNumber, 'Numéro de TVA', { max: 40 }),
        legalForm: text(input.legalForm, 'Forme juridique', { max: 80 })
    };
}

function normalizeCustomer(input = {}) {
    const customerType = input.customerType === 'business' ? 'business' : 'individual';
    const firstName = text(input.firstName, 'Prénom client', { max: 100 });
    const lastName = text(input.lastName, 'Nom client', { max: 100 });
    const businessName = text(input.businessName, 'Entreprise cliente', { max: 160 });
    if (customerType === 'business' && !businessName) {
        throw invoiceError('MANUAL_INVOICE_FIELD_REQUIRED', 'Entreprise cliente requise.');
    }
    if (customerType === 'individual' && (!firstName || !lastName)) {
        throw invoiceError('MANUAL_INVOICE_FIELD_REQUIRED', 'Nom et prénom du client requis.');
    }
    return {
        customerType,
        firstName,
        lastName,
        businessName,
        email: email(input.email),
        phone: text(input.phone, 'Téléphone client', { max: 40 }),
        ...postalAddress(input, 'Client')
    };
}

function normalizeLine(input = {}, index) {
    const quantity = Number(input.quantity);
    const unitPriceCents = Number(input.unitPriceCents);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
        throw invoiceError('MANUAL_INVOICE_QUANTITY_INVALID', `Quantité invalide à la ligne ${index + 1}.`);
    }
    if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0 || unitPriceCents > 100_000_000) {
        throw invoiceError('MANUAL_INVOICE_AMOUNT_INVALID', `Prix invalide à la ligne ${index + 1}.`);
    }
    const lineId = text(input.lineId, 'Ligne', { max: 120 }) || crypto.randomUUID();
    return {
        lineId,
        productId: text(input.productId, 'Meuble', { max: 160 }) || null,
        name: text(input.name, `Désignation ${index + 1}`, { required: true, max: 180 }),
        description: multiline(input.description, `Description ${index + 1}`, { max: 700 }),
        quantity,
        unitPriceCents,
        totalCents: quantity * unitPriceCents
    };
}

function normalizeInvoiceDraft(input = {}) {
    if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > MAX_LINES) {
        throw invoiceError('MANUAL_INVOICE_LINES_INVALID', `Ajoutez entre 1 et ${MAX_LINES} lignes.`);
    }
    const lines = input.lines.map(normalizeLine);
    const subtotalCents = lines.reduce((sum, line) => sum + line.totalCents, 0);
    if (!Number.isSafeInteger(subtotalCents) || subtotalCents <= 0) {
        throw invoiceError('MANUAL_INVOICE_TOTAL_INVALID', 'Le total de la facture doit être supérieur à zéro.');
    }
    const seller = normalizeSeller(input.seller);
    const vatCents = seller.vatMode === 'standard'
        ? Number(input.vatCents || 0)
        : 0;
    if (!Number.isSafeInteger(vatCents) || vatCents < 0 || vatCents > subtotalCents) {
        throw invoiceError('MANUAL_INVOICE_VAT_INVALID', 'Montant de TVA invalide.');
    }
    return {
        schemaVersion: 1,
        currency: 'EUR',
        seller,
        customer: normalizeCustomer(input.customer),
        lines,
        issueDate: date(input.issueDate, 'Date de facture'),
        saleDate: date(input.saleDate || input.issueDate, 'Date de vente'),
        dueDate: date(input.dueDate || input.issueDate, 'Date d’échéance'),
        paymentMethod: text(input.paymentMethod, 'Mode de règlement', { max: 100 }),
        paymentTerms: text(input.paymentTerms || 'Paiement comptant', 'Conditions de règlement', { required: true, max: 300 }),
        notes: multiline(input.notes, 'Notes', { max: 2000 }),
        subtotalCents,
        vatCents,
        totalCents: subtotalCents + vatCents,
        activityType: 'goods'
    };
}

function invoiceNumber(year, sequence) {
    if (!/^\d{4}$/.test(String(year)) || !Number.isSafeInteger(sequence) || sequence < 1) {
        throw invoiceError('MANUAL_INVOICE_SEQUENCE_INVALID');
    }
    return `FAC-${year}-${String(sequence).padStart(6, '0')}`;
}

function hashInvoice(invoice) {
    const keys = [
        'schemaVersion', 'currency', 'seller', 'customer', 'lines', 'issueDate',
        'saleDate', 'dueDate', 'paymentMethod', 'paymentTerms', 'notes',
        'subtotalCents', 'vatCents', 'totalCents', 'activityType', 'number'
    ];
    const snapshot = Object.fromEntries(keys.map((key) => [key, invoice[key] ?? null]));
    return crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
}

module.exports = {
    MAX_LINES,
    email,
    hashInvoice,
    invoiceNumber,
    normalizeInvoiceDraft,
    normalizeSeller
};
