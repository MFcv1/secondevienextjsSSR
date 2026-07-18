const logger = require('firebase-functions/logger');

const ALLOWED_FIELDS = new Set([
    'phase',
    'eventHash',
    'buildId',
    'targetRevision',
    'desiredRevision',
    'publishedRevision',
    'durationMs',
    'sourceDocuments',
    'eventsCoalesced',
    'publicProducts',
    'snapshotBytes',
    'filesWritten',
    'result',
    'code',
    'mode',
    'taskName',
    'ageMs'
]);

function sanitize(fields = {}) {
    const safe = { component: 'catalog-publication' };
    Object.entries(fields).forEach(([key, value]) => {
        if (!ALLOWED_FIELDS.has(key) || value === undefined || value === null) return;
        if (typeof value === 'string') safe[key] = value.slice(0, 240);
        else if (typeof value === 'number' || typeof value === 'boolean') safe[key] = value;
    });
    return safe;
}

function catalogLog(level, fields, message = 'catalog_publication') {
    const method = typeof logger[level] === 'function' ? logger[level] : logger.info;
    method(message, sanitize(fields));
}

module.exports = { ALLOWED_FIELDS, catalogLog, sanitize };
