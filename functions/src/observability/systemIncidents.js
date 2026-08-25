'use strict';

const crypto = require('node:crypto');
const functions = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const { Logging } = require('@google-cloud/logging');
const {
    checkActiveStrongAdmin,
    writeSecurityAudit
} = require('../../helpers/security');
const { runObserved } = require('../../helpers/observability');

const REGION = 'europe-west1';
const PROJECT_ID = 'secondevienextjsssr';
const RUNTIME_SERVICE_ACCOUNT = `observability-admin-runtime@${PROJECT_ID}.iam.gserviceaccount.com`;
const ALLOWED_WINDOWS = new Set([1, 6, 24, 72, 168]);
const MAX_SCAN_ENTRIES = 500;
const MAX_GROUPS = 80;
const MAX_OCCURRENCES = 50;
const SAFE_ID = /^[A-Za-z0-9_:./-]{1,240}$/;
const SENSITIVE_KEY = /(authorization|cookie|email|phone|address|token|secret|password|payload|request|response|card|client.?secret)/i;
const LEGACY_EXPECTED_ERROR_CLASSES = Object.freeze([
    'already-exists',
    'cancelled',
    'failed-precondition',
    'invalid-argument',
    'not-found',
    'permission-denied',
    'resource-exhausted',
    'unauthenticated'
]);

function invalid(message) {
    return new functions.https.HttpsError('invalid-argument', message);
}

function auditUnavailable() {
    return new functions.https.HttpsError('internal', 'Audit de consultation indisponible.', {
        reason: 'OBSERVABILITY_AUDIT_UNAVAILABLE'
    });
}

function safeId(value) {
    const normalized = String(value || '').trim();
    return SAFE_ID.test(normalized) ? normalized : null;
}

function redactText(value, maxLength = 1200) {
    return String(value || '')
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email masqué]')
        .replace(/\b(?:Bearer\s+)?[A-Za-z0-9_-]{32,}\b/g, '[secret masqué]')
        .replace(/\b(?:sk|rk|whsec|pi|re|tok|src|pm)_[A-Za-z0-9_-]{12,}\b/g, '[identifiant masqué]')
        .replace(/([?&](?:token|key|secret|code)=)[^&\s]+/gi, '$1[masqué]')
        .slice(0, maxLength);
}

function normalizeStack(value) {
    return redactText(value, 6000)
        .split('\n')
        .slice(0, 16)
        .map((line) => line.trim())
        .filter((line, index) => index === 0 || /^at\s/.test(line))
        .join('\n');
}

function entryTimestamp(metadata = {}) {
    const value = metadata.timestamp || metadata.receiveTimestamp;
    const date = value instanceof Date ? value : new Date(value || 0);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function firstSafe(payload, keys) {
    for (const key of keys) {
        if (SENSITIVE_KEY.test(key)) continue;
        const value = safeId(payload?.[key]);
        if (value) return value;
    }
    return null;
}

function normalizeEntry(entry) {
    const metadata = entry?.metadata || {};
    const payload = entry?.data && typeof entry.data === 'object' ? entry.data : {};
    const resource = metadata.resource || {};
    const service = safeId(payload.service)
        || safeId(resource.labels?.service_name)
        || safeId(resource.labels?.function_name)
        || 'service-inconnu';
    const functionName = safeId(payload.function) || service;
    const event = safeId(payload.event)
        || safeId(payload.message)
        || safeId(metadata.labels?.event)
        || 'erreur_systeme';
    const errorClass = safeId(payload.errorClass) || safeId(payload.error?.name) || 'unknown';
    const stack = normalizeStack(payload.message || payload.stack_trace || payload.stack || '');
    const topFrame = stack.split('\n').find((line) => /^at\s/.test(line)) || '';
    const fingerprintSource = [service, functionName, event, errorClass, topFrame].join('|');
    const fingerprint = crypto.createHash('sha256').update(fingerprintSource).digest('hex').slice(0, 24);
    return {
        id: safeId(metadata.insertId) || crypto.createHash('sha256').update(`${fingerprint}|${entryTimestamp(metadata)}`).digest('hex').slice(0, 24),
        fingerprint,
        timestamp: entryTimestamp(metadata),
        severity: String(metadata.severity || payload.severity || 'ERROR').toUpperCase().slice(0, 20),
        event,
        errorClass,
        service,
        functionName,
        region: safeId(payload.region) || safeId(resource.labels?.location),
        revision: safeId(payload.revision) || safeId(resource.labels?.revision_name),
        expected: payload.expected === true,
        retryable: payload.retryable === true,
        durationMs: Number.isFinite(payload.durationMs) ? Math.max(0, Math.round(payload.durationMs)) : null,
        message: redactText(payload.summary || payload.error?.message || event, 700),
        stack: stack || null,
        correlationId: firstSafe(payload, ['correlationId', 'requestId']),
        orderId: firstSafe(payload, ['orderId']),
        commandId: firstSafe(payload, ['commandId']),
        traceId: firstSafe(payload, ['traceId']) || safeId(String(metadata.trace || '').split('/').pop()),
        logName: safeId(metadata.logName),
        resourceType: safeId(resource.type)
    };
}

function groupEntries(entries) {
    const groups = new Map();
    for (const item of entries.map(normalizeEntry).filter((entry) => entry.timestamp)) {
        const current = groups.get(item.fingerprint);
        if (!current) {
            groups.set(item.fingerprint, {
                id: item.fingerprint,
                severity: item.severity,
                event: item.event,
                errorClass: item.errorClass,
                service: item.service,
                functionName: item.functionName,
                region: item.region,
                revision: item.revision,
                expected: item.expected,
                retryable: item.retryable,
                count: 1,
                firstSeen: item.timestamp,
                lastSeen: item.timestamp,
                latest: item
            });
            continue;
        }
        current.count += 1;
        if (item.timestamp < current.firstSeen) current.firstSeen = item.timestamp;
        if (item.timestamp > current.lastSeen) {
            current.lastSeen = item.timestamp;
            current.latest = item;
            current.revision = item.revision;
        }
        if (item.severity === 'CRITICAL' || item.severity === 'ALERT' || item.severity === 'EMERGENCY') {
            current.severity = item.severity;
        }
    }
    return [...groups.values()]
        .sort((left, right) => right.lastSeen.localeCompare(left.lastSeen))
        .slice(0, MAX_GROUPS);
}

function normalizeInput(data = {}) {
    const action = String(data.action || 'list');
    if (!['list', 'detail'].includes(action)) throw invalid('Action invalide.');
    const windowHours = Number(data.windowHours || 24);
    if (!ALLOWED_WINDOWS.has(windowHours)) throw invalid('Fenêtre invalide.');
    const severity = String(data.severity || 'error');
    if (!['error', 'critical'].includes(severity)) throw invalid('Sévérité invalide.');
    const fingerprint = action === 'detail' ? safeId(data.fingerprint) : null;
    if (action === 'detail' && !fingerprint) throw invalid('Incident invalide.');
    return { action, windowHours, severity, fingerprint };
}

function buildFilter({ windowHours, severity }) {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
    const legacyExpected = `jsonPayload.errorClass=(${LEGACY_EXPECTED_ERROR_CLASSES.map((value) => `"${value}"`).join(' OR ')})`;
    const unexpectedFailure = `(jsonPayload.event="function_failed" AND (jsonPayload.expected=false OR (NOT jsonPayload.expected:* AND NOT ${legacyExpected})))`;
    const severityFilter = severity === 'critical'
        ? `(severity>=CRITICAL OR ${unexpectedFailure})`
        : `(severity>=ERROR AND (NOT jsonPayload.event="function_failed" OR ${unexpectedFailure}))`;
    return [
        `timestamp>="${since}"`,
        severityFilter,
        '(resource.type="cloud_run_revision" OR resource.type="cloud_function")',
        'logName!="projects/secondevienextjsssr/logs/monitoring.googleapis.com%2FViolationOpenEventv1"',
        'logName!="projects/secondevienextjsssr/logs/monitoring.googleapis.com%2FViolationAutoResolveEventv1"'
    ].join(' AND ');
}

async function fetchEntries(logging, input) {
    const [entries] = await logging.getEntries({
        filter: buildFilter(input),
        orderBy: 'timestamp desc',
        pageSize: MAX_SCAN_ENTRIES,
        autoPaginate: false
    });
    return entries.slice(0, MAX_SCAN_ENTRIES);
}

function cloudLinks(input) {
    const query = encodeURIComponent(buildFilter(input));
    return {
        logs: `https://console.cloud.google.com/logs/query;query=${query}?project=${PROJECT_ID}`,
        errors: `https://console.cloud.google.com/errors;time=P1D?project=${PROJECT_ID}`
    };
}

async function handler(data, context, dependencies = {}) {
    const authorize = dependencies.authorize || checkActiveStrongAdmin;
    const audit = dependencies.audit || writeSecurityAudit;
    const getLogging = dependencies.getLogging || (() => new Logging({ projectId: PROJECT_ID }));
    await authorize(context);
    const input = normalizeInput(data);
    const audited = await audit(`observability.system_${input.action}`, context, {
        windowHours: input.windowHours,
        severity: input.severity,
        ...(input.fingerprint ? { fingerprintHash: crypto.createHash('sha256').update(input.fingerprint).digest('hex') } : {})
    });
    if (audited !== true) throw auditUnavailable();
    const entries = await fetchEntries(getLogging(), input);
    const groups = groupEntries(entries);
    const selected = input.action === 'detail'
        ? groups.find((group) => group.id === input.fingerprint)
        : null;
    const links = cloudLinks(input);
    if (input.action === 'detail') {
        const occurrences = entries
            .map(normalizeEntry)
            .filter((entry) => entry.fingerprint === input.fingerprint)
            .slice(0, MAX_OCCURRENCES);
        return {
            success: true,
            incident: selected || null,
            occurrences,
            links,
            scannedCount: entries.length,
            truncated: entries.length >= MAX_SCAN_ENTRIES || occurrences.length >= MAX_OCCURRENCES
        };
    }
    return {
        success: true,
        groups,
        links,
        scannedCount: entries.length,
        truncated: entries.length >= MAX_SCAN_ENTRIES
    };
}

const getSystemIncidentsAdminGen2 = onCall({
    region: REGION,
    enforceAppCheck: true,
    serviceAccount: RUNTIME_SERVICE_ACCOUNT,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '512MiB',
    timeoutSeconds: 60
}, (request) => runObserved(
    'getSystemIncidentsAdminGen2',
    request,
    (data) => handler(data, request)
));

module.exports = {
    buildFilter,
    fetchEntries,
    getSystemIncidentsAdminGen2,
    groupEntries,
    handler,
    normalizeEntry,
    normalizeInput,
    redactText
};
