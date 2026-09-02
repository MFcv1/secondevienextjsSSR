'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const { onMessagePublished } = require('firebase-functions/v2/pubsub');
const { normalizeEntry } = require('./systemIncidents');

const REGION = 'europe-west1';
const PROJECT_ID = 'secondevienextjsssr';
const TOPIC = 'admin-system-incidents';
const RUNTIME_SERVICE_ACCOUNT = `observability-admin-runtime@${PROJECT_ID}.iam.gserviceaccount.com`;
const EVENT_RETENTION_MS = 8 * 24 * 60 * 60 * 1000;
const INCIDENT_FEED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_FEED_INCIDENTS = 50;
const CRITICAL_SEVERITIES = new Set(['EMERGENCY', 'ALERT', 'CRITICAL']);
const EXPECTED_ERROR_CLASSES = new Set([
    'already-exists',
    'cancelled',
    'failed-precondition',
    'invalid-argument',
    'not-found',
    'permission-denied',
    'resource-exhausted',
    'unauthenticated'
]);

function severityRank(value) {
    const ranks = { DEFAULT: 0, DEBUG: 100, INFO: 200, NOTICE: 300, WARNING: 400, ERROR: 500, CRITICAL: 600, ALERT: 700, EMERGENCY: 800 };
    return ranks[String(value || 'DEFAULT').toUpperCase()] || 0;
}

function parseMessageJson(message = {}) {
    if (message.json && typeof message.json === 'object') return message.json;
    const encoded = message.data;
    if (!encoded) return null;
    try {
        return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    } catch {
        return null;
    }
}

function deriveTextPayload(textPayload) {
    const text = String(textPayload || '');
    const firstLine = text.split('\n')[0].slice(0, 700);
    const errorCode = firstLine.match(/\b([A-Z][A-Z0-9_]{4,})\b/)?.[1] || null;
    return {
        event: /Unhandled error|Error:/.test(firstLine) ? 'function_failed' : 'runtime_error',
        errorClass: errorCode || 'RuntimeError',
        message: text,
        summary: firstLine
    };
}

function toLoggingEntry(rawEntry) {
    if (!rawEntry || typeof rawEntry !== 'object') return null;
    const data = rawEntry.jsonPayload && typeof rawEntry.jsonPayload === 'object'
        ? rawEntry.jsonPayload
        : deriveTextPayload(rawEntry.textPayload || rawEntry.protoPayload?.status?.message);
    return {
        data,
        metadata: {
            insertId: rawEntry.insertId,
            logName: rawEntry.logName,
            receiveTimestamp: rawEntry.receiveTimestamp,
            resource: rawEntry.resource,
            severity: rawEntry.severity,
            timestamp: rawEntry.timestamp,
            trace: rawEntry.trace,
            labels: rawEntry.labels
        }
    };
}

function isProjectableLogEntry(rawEntry, normalized) {
    if (!rawEntry || !normalized?.timestamp) return false;
    if (rawEntry.httpRequest) return false;
    if (/monitoring\.googleapis\.com%2FViolation(?:Open|AutoResolve)Eventv1/.test(String(rawEntry.logName || ''))) return false;
    if (!['cloud_run_revision', 'cloud_function'].includes(String(rawEntry.resource?.type || ''))) return false;
    if (normalized.expected === true || EXPECTED_ERROR_CLASSES.has(normalized.errorClass)) return false;
    return severityRank(normalized.severity) >= severityRank('ERROR')
        || (normalized.event === 'function_failed' && normalized.expected === false);
}

function eventIdFor(normalized) {
    return crypto.createHash('sha256').update([
        normalized.logName || '',
        normalized.id || '',
        normalized.timestamp || '',
        normalized.fingerprint || ''
    ].join('|')).digest('hex');
}

function logsExplorerUrl(normalized) {
    const filters = [];
    if (normalized.logName) filters.push(`logName="${normalized.logName}"`);
    if (normalized.id) filters.push(`insertId="${normalized.id}"`);
    if (normalized.service && normalized.service !== 'service-inconnu') {
        filters.push(`(resource.labels.service_name="${normalized.service}" OR resource.labels.function_name="${normalized.service}")`);
    }
    const query = encodeURIComponent(filters.join(' AND '));
    return `https://console.cloud.google.com/logs/query;query=${query}?project=${PROJECT_ID}`;
}

function timestampMillis(value) {
    if (typeof value?.toMillis === 'function') return value.toMillis();
    const millis = new Date(value || 0).getTime();
    return Number.isFinite(millis) ? millis : 0;
}

function buildIncidentFeed(current, normalized, eventAt, now, latestFields) {
    const threshold = now - INCIDENT_FEED_RETENTION_MS;
    const byFingerprint = new Map();
    for (const item of Array.isArray(current) ? current : []) {
        if (!item?.fingerprint || timestampMillis(item.lastSeen) < threshold) continue;
        byFingerprint.set(item.fingerprint, item);
    }
    const previous = byFingerprint.get(normalized.fingerprint) || null;
    const previousLastSeen = timestampMillis(previous?.lastSeen);
    const isLatest = eventAt >= previousLastSeen;
    byFingerprint.set(normalized.fingerprint, {
        ...(previous || {}),
        schemaVersion: 1,
        fingerprint: normalized.fingerprint,
        expected: false,
        occurrenceCount: Math.max(0, Number(previous?.occurrenceCount) || 0) + 1,
        firstSeen: admin.firestore.Timestamp.fromMillis(
            Math.min(timestampMillis(previous?.firstSeen) || eventAt, eventAt)
        ),
        lastSeen: admin.firestore.Timestamp.fromMillis(Math.max(previousLastSeen, eventAt)),
        ...(isLatest ? latestFields : {})
    });
    return [...byFingerprint.values()]
        .sort((left, right) => timestampMillis(right.lastSeen) - timestampMillis(left.lastSeen))
        .slice(0, MAX_FEED_INCIDENTS);
}

async function projectSystemIncidentMessage(message, dependencies = {}) {
    const database = dependencies.database || admin.firestore();
    const rawEntry = parseMessageJson(message);
    const loggingEntry = toLoggingEntry(rawEntry);
    const normalized = loggingEntry ? normalizeEntry(loggingEntry) : null;
    if (!isProjectableLogEntry(rawEntry, normalized)) {
        return { projected: false, reason: 'filtered' };
    }

    const eventAt = new Date(normalized.timestamp).getTime();
    const now = dependencies.now || Date.now();
    const eventRef = database.collection('admin_system_incident_events').doc(eventIdFor(normalized));
    const summaryRef = database.collection('admin_system_incident_summary').doc('current');

    return database.runTransaction(async (transaction) => {
        const [eventSnapshot, summarySnapshot] = await Promise.all([
            transaction.get(eventRef),
            transaction.get(summaryRef)
        ]);
        if (eventSnapshot.exists) return { projected: false, reason: 'duplicate' };

        const currentSummary = summarySnapshot.exists ? summarySnapshot.data() : null;
        const latestFields = {
            severity: normalized.severity,
            event: normalized.event,
            errorClass: normalized.errorClass,
            service: normalized.service,
            functionName: normalized.functionName,
            region: normalized.region || null,
            revision: normalized.revision || null,
            retryable: normalized.retryable,
            durationMs: normalized.durationMs,
            message: normalized.message,
            stack: normalized.stack,
            correlationId: normalized.correlationId,
            orderId: normalized.orderId,
            commandId: normalized.commandId,
            traceId: normalized.traceId,
            logInsertId: normalized.id,
            logName: normalized.logName || null,
            resourceType: normalized.resourceType || null,
            logsExplorerUrl: logsExplorerUrl(normalized)
        };
        const incidents = buildIncidentFeed(
            currentSummary?.incidents,
            normalized,
            eventAt,
            now,
            latestFields
        );
        const projectedIncident = incidents.find((item) => item.fingerprint === normalized.fingerprint);
        const recentIncidents = incidents.filter((item) => timestampMillis(item.lastSeen) >= now - RECENT_WINDOW_MS);
        const criticalRecent = recentIncidents.filter((item) => CRITICAL_SEVERITIES.has(item.severity)).length;
        const previousSummaryLastSeen = timestampMillis(currentSummary?.lastSeen);
        const isLatestSummaryEvent = eventAt >= previousSummaryLastSeen;

        transaction.create(eventRef, {
            schemaVersion: 1,
            fingerprint: normalized.fingerprint,
            sourceTimestamp: admin.firestore.Timestamp.fromMillis(eventAt),
            createdAt: admin.firestore.Timestamp.fromMillis(now),
            expireAt: admin.firestore.Timestamp.fromMillis(now + EVENT_RETENTION_MS)
        });
        transaction.set(summaryRef, {
            schemaVersion: 1,
            revision: Math.max(0, Number(currentSummary?.revision) || 0) + 1,
            totalOccurrences: Math.max(0, Number(currentSummary?.totalOccurrences) || 0) + 1,
            recentTotal: recentIncidents.length,
            recentCritical: criticalRecent,
            recentErrors: recentIncidents.length - criticalRecent,
            incidents,
            latestFingerprint: isLatestSummaryEvent ? normalized.fingerprint : currentSummary?.latestFingerprint || null,
            latestSeverity: isLatestSummaryEvent ? normalized.severity : currentSummary?.latestSeverity || null,
            lastSeen: admin.firestore.Timestamp.fromMillis(Math.max(previousSummaryLastSeen, eventAt)),
            updatedAt: admin.firestore.Timestamp.fromMillis(now)
        }, { merge: true });
        return {
            projected: true,
            fingerprint: normalized.fingerprint,
            occurrenceCount: projectedIncident?.occurrenceCount || 1,
            recentTotal: recentIncidents.length
        };
    });
}

const projectSystemIncidentGen2 = onMessagePublished({
    topic: TOPIC,
    region: REGION,
    serviceAccount: RUNTIME_SERVICE_ACCOUNT,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 2,
    memory: '256MiB',
    timeoutSeconds: 30,
    retry: true
}, (event) => projectSystemIncidentMessage(event.data?.message));

module.exports = {
    buildIncidentFeed,
    eventIdFor,
    isProjectableLogEntry,
    logsExplorerUrl,
    parseMessageJson,
    projectSystemIncidentGen2,
    projectSystemIncidentMessage,
    severityRank,
    toLoggingEntry
};
