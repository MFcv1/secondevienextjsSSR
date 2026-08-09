'use strict';

const crypto = require('node:crypto');

const QUOTE_STATUSES = Object.freeze([
    'new',
    'qualifying',
    'waiting_customer',
    'in_review',
    'proposal_ready',
    'closed',
    'declined'
]);

const FURNITURE_TYPES = new Map([
    ['buffet', 'Buffet'],
    ['armoire', 'Armoire'],
    ['commode', 'Commode'],
    ['miroir', 'Miroir'],
    ['chaise', 'Chaise'],
    ['table', 'Table']
]);

const CONDITIONS = new Set([
    'Bon état, entretien léger',
    'Rayures ou marques visibles',
    'Structure fragilisée',
    'Restauration complète'
]);

const SEVERITIES = new Set(['Légers', 'Modérés', 'Importants']);

const SERVICES = new Map([
    ['poncage', { label: 'Ponçage manuel adapté', minCents: 4500, maxCents: 12000 }],
    ['nettoyage', { label: 'Nettoyage & dépoussiérage profond', minCents: 2000, maxCents: 4500 }],
    ['entretien', { label: "Application d'un produit d'entretien", minCents: 2500, maxCents: 5500 }],
    ['defauts', { label: 'Rattrapage des défauts', minCents: 2500, maxCents: 9000, hasSeverity: true }],
    ['renforts', { label: 'Renforts & consolidation', minCents: 4000, maxCents: 11000 }],
    ['protection', { label: 'Finition & protection', minCents: 3000, maxCents: 7500 }]
]);

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 1536 * 1024;

function domainError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function text(value, label, { required = false, min = 0, max = 500 } = {}) {
    const normalized = String(value ?? '').trim().replace(/\r\n?/g, '\n');
    if (required && normalized.length < Math.max(1, min)) {
        throw domainError('QUOTE_FIELD_REQUIRED', `${label} requis.`);
    }
    if (normalized.length > max) {
        throw domainError('QUOTE_FIELD_TOO_LONG', `${label} trop long.`);
    }
    return normalized;
}

function email(value) {
    const normalized = text(value, 'E-mail', { required: true, max: 254 }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) {
        throw domainError('QUOTE_EMAIL_INVALID', 'Adresse e-mail invalide.');
    }
    return normalized;
}

function phone(value) {
    const normalized = text(value, 'Téléphone', { required: true, max: 40 });
    const digits = normalized.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) {
        throw domainError('QUOTE_PHONE_INVALID', 'Numéro de téléphone invalide.');
    }
    return normalized;
}

function optionalNumber(value, label, max) {
    if (value === '' || value == null) return null;
    const normalized = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(normalized) || normalized < 0 || normalized > max) {
        throw domainError('QUOTE_NUMBER_INVALID', `${label} invalide.`);
    }
    return Math.round(normalized * 10) / 10;
}

function normalizeServiceIds(value, severity) {
    if (!Array.isArray(value) || value.length > SERVICES.size) {
        throw domainError('QUOTE_SERVICES_INVALID', 'Prestations invalides.');
    }
    const ids = [...new Set(value.map((entry) => String(entry || '').trim()))];
    if (ids.some((id) => !SERVICES.has(id))) {
        throw domainError('QUOTE_SERVICES_INVALID', 'Prestations invalides.');
    }
    return ids.map((id) => {
        const service = SERVICES.get(id);
        return {
            id,
            label: service.label,
            minCents: service.minCents,
            maxCents: service.maxCents,
            severity: service.hasSeverity ? severity : null
        };
    });
}

function normalizeClientRequestId(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!/^[a-f0-9-]{32,64}$/.test(normalized)) {
        throw domainError('QUOTE_REQUEST_ID_INVALID', 'Identifiant de demande invalide.');
    }
    return normalized;
}

function normalizeUploadToken(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(normalized)) {
        throw domainError('QUOTE_UPLOAD_TOKEN_INVALID', 'Jeton de dépôt invalide.');
    }
    return normalized;
}

function normalizeQuoteRequest(payload = {}) {
    const customer = payload.customer || {};
    const project = payload.project || {};
    const furnitureType = String(project.furnitureType || '').trim();
    if (!FURNITURE_TYPES.has(furnitureType)) {
        throw domainError('QUOTE_FURNITURE_INVALID', 'Type de meuble invalide.');
    }

    const condition = text(project.condition, 'État du meuble', { max: 120 });
    if (condition && !CONDITIONS.has(condition)) {
        throw domainError('QUOTE_CONDITION_INVALID', 'État du meuble invalide.');
    }

    const severity = text(project.severity || 'Modérés', 'Sévérité', { max: 20 });
    if (!SEVERITIES.has(severity)) {
        throw domainError('QUOTE_SEVERITY_INVALID', 'Sévérité invalide.');
    }

    const firstName = text(customer.firstName, 'Prénom', { required: true, min: 1, max: 80 });
    const lastName = text(customer.lastName, 'Nom', { max: 100 });
    const customerEmail = email(customer.email);
    const expectedPhotoCount = Number(payload.expectedPhotoCount ?? 0);
    if (!Number.isInteger(expectedPhotoCount) || expectedPhotoCount < 0 || expectedPhotoCount > MAX_PHOTOS) {
        throw domainError('QUOTE_PHOTO_COUNT_INVALID', 'Nombre de photos invalide.');
    }
    if (payload.consent !== true) {
        throw domainError('QUOTE_CONSENT_REQUIRED', 'Votre accord est requis pour envoyer la demande.');
    }

    const services = normalizeServiceIds(project.serviceIds || [], severity);
    const estimate = services.reduce((total, service) => ({
        minCents: total.minCents + service.minCents,
        maxCents: total.maxCents + service.maxCents
    }), { minCents: 0, maxCents: 0 });

    return {
        clientRequestId: normalizeClientRequestId(payload.clientRequestId),
        uploadToken: normalizeUploadToken(payload.uploadToken),
        customer: {
            firstName,
            lastName,
            fullName: [firstName, lastName].filter(Boolean).join(' '),
            email: customerEmail,
            emailLower: customerEmail,
            phone: phone(customer.phone),
            location: text(customer.location, 'Localisation', { max: 160 })
        },
        project: {
            furnitureType,
            furnitureLabel: FURNITURE_TYPES.get(furnitureType),
            condition,
            dimensions: {
                heightCm: optionalNumber(project.dimensions?.height, 'Hauteur', 1000),
                widthCm: optionalNumber(project.dimensions?.width, 'Largeur', 1000),
                depthCm: optionalNumber(project.dimensions?.depth, 'Profondeur', 1000),
                weightKg: optionalNumber(project.dimensions?.weight, 'Poids', 1000)
            },
            description: text(project.description, 'Description', { max: 3000 }),
            notes: text(project.notes, 'Précisions', { max: 2000 }),
            services,
            indicativeEstimate: {
                ...estimate,
                currency: 'EUR'
            }
        },
        expectedPhotoCount
    };
}

function normalizeQuoteStatus(value) {
    const normalized = String(value || '').trim();
    if (!QUOTE_STATUSES.includes(normalized)) {
        throw domainError('QUOTE_STATUS_INVALID', 'Statut de devis invalide.');
    }
    return normalized;
}

function normalizeInternalNotes(value) {
    return text(value, 'Notes internes', { max: 4000 });
}

function quoteDocumentId(clientRequestId) {
    return `quote_${crypto.createHash('sha256').update(clientRequestId).digest('hex').slice(0, 32)}`;
}

function quoteReference(now, clientRequestId) {
    const date = now instanceof Date ? now : new Date(now);
    if (Number.isNaN(date.getTime())) throw domainError('QUOTE_DATE_INVALID', 'Date de demande invalide.');
    const day = date.toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = crypto.createHash('sha256').update(clientRequestId).digest('hex').slice(0, 6).toUpperCase();
    return `DEV-${day}-${suffix}`;
}

function hashToken(value) {
    return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function tokenMatches(value, expectedHash) {
    const actual = Buffer.from(hashToken(value), 'hex');
    const expected = Buffer.from(String(expectedHash || ''), 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

module.exports = {
    CONDITIONS,
    FURNITURE_TYPES,
    MAX_PHOTOS,
    MAX_PHOTO_BYTES,
    QUOTE_STATUSES,
    SERVICES,
    hashToken,
    normalizeClientRequestId,
    normalizeInternalNotes,
    normalizeQuoteRequest,
    normalizeQuoteStatus,
    normalizeUploadToken,
    quoteDocumentId,
    quoteReference,
    tokenMatches
};
