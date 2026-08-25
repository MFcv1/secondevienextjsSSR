'use strict';

const crypto = require('node:crypto');
const logger = require('firebase-functions/logger');

const SAFE_ID = /^[A-Za-z0-9_:.-]{1,180}$/;

function safeId(value) {
    const normalized = String(value || '').trim();
    return SAFE_ID.test(normalized) ? normalized : null;
}

function hashOpaque(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return null;
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

function requestTraceId(request) {
    const header = String(
        request?.rawRequest?.headers?.['x-cloud-trace-context']
        || request?.headers?.['x-cloud-trace-context']
        || ''
    );
    const candidate = header.split('/')[0];
    return /^[a-f0-9]{16,32}$/i.test(candidate) ? candidate.toLowerCase() : null;
}

function normalizeObservabilityInput(data, request) {
    const input = data && typeof data === 'object' && !Array.isArray(data)
        ? data._observability
        : null;
    const requestId = safeId(input?.requestId) || crypto.randomUUID();
    return Object.freeze({
        requestId,
        traceId: requestTraceId(request) || safeId(input?.traceId),
        correlationId: safeId(input?.correlationId) || requestId,
        sessionIdHash: hashOpaque(input?.sessionId),
        orderId: safeId(data?.orderId || data?.order?.id),
        commandId: safeId(data?.commandId || data?.idempotencyKey)
    });
}

function stripObservabilityInput(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data) || !('_observability' in data)) {
        return data;
    }
    const clean = { ...data };
    delete clean._observability;
    return clean;
}

function runtimeIdentity(functionName) {
    return {
        function: functionName,
        region: process.env.FUNCTION_REGION || process.env.K_REGION || null,
        revision: process.env.K_REVISION || null,
        service: process.env.K_SERVICE || functionName
    };
}

function errorClass(error) {
    return String(error?.code || error?.name || 'unknown').slice(0, 120);
}

const EXPECTED_ERROR_CODES = new Set([
    'already-exists',
    'cancelled',
    'failed-precondition',
    'invalid-argument',
    'not-found',
    'permission-denied',
    'resource-exhausted',
    'unauthenticated'
]);

function isExpectedError(error) {
    return EXPECTED_ERROR_CODES.has(String(error?.code || '').replace(/^functions\//, ''));
}

function errorReportingMessage(error) {
    const kind = errorClass(error);
    const frames = String(error?.stack || '')
        .split('\n')
        .slice(1, 13)
        .map((line) => line.trim())
        .filter((line) => /^at\s/.test(line))
        .map((line) => line
            .replace(/\/workspace\//g, '')
            .replace(/\([^()]*node_modules\//g, '(node_modules/'));
    return [`${kind}: operation failed`, ...frames].join('\n').slice(0, 6000);
}

function structuredLog(severity, message, fields = {}, options = {}) {
    const payload = {
        event: message,
        severity: String(severity || 'info').toUpperCase(),
        ...Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined))
    };
    const method = severity === 'critical'
        ? 'error'
        : severity === 'error'
            ? 'error'
            : severity === 'warning'
                ? 'warn'
                : severity === 'debug'
                    ? 'debug'
                    : 'info';
    if (options.errorReportingMessage && method === 'error') {
        const reportable = new Error('operation failed');
        reportable.stack = options.errorReportingMessage;
        logger.error(reportable, payload);
        return;
    }
    logger[method](message, payload);
}

function shouldSampleSuccess(context, rate = Number(process.env.OBSERVABILITY_SUCCESS_SAMPLE_RATE || 0.05)) {
    if (!Number.isFinite(rate) || rate <= 0) return false;
    if (rate >= 1) return true;
    const key = String(context?.requestId || context?.correlationId || '');
    const bucket = crypto.createHash('sha256').update(key).digest().readUInt32BE(0) / 0xffffffff;
    return bucket < rate;
}

async function runObserved(functionName, request, handler) {
    const startedAt = Date.now();
    const cleanData = stripObservabilityInput(request?.data);
    const context = normalizeObservabilityInput(request?.data, request);
    try {
        const result = await handler(cleanData, request, context);
        const sampleRate = Number(process.env.OBSERVABILITY_SUCCESS_SAMPLE_RATE || 0.05);
        if (shouldSampleSuccess(context, sampleRate)) {
            structuredLog('info', 'function_completed', {
                ...runtimeIdentity(functionName),
                ...context,
                durationMs: Date.now() - startedAt,
                outcome: 'success',
                sampled: true,
                sampleRate
            });
        }
        return result;
    } catch (error) {
        const expected = isExpectedError(error);
        structuredLog(expected ? 'warning' : 'error', 'function_failed', {
            ...runtimeIdentity(functionName),
            ...context,
            durationMs: Date.now() - startedAt,
            outcome: 'failed',
            errorClass: errorClass(error),
            expected,
            retryable: error?.retryable === true
        }, {
            ...(expected ? {} : { errorReportingMessage: errorReportingMessage(error) })
        });
        throw error;
    }
}

module.exports = {
    errorClass,
    errorReportingMessage,
    hashOpaque,
    isExpectedError,
    normalizeObservabilityInput,
    runObserved,
    safeId,
    shouldSampleSuccess,
    stripObservabilityInput,
    structuredLog
};
