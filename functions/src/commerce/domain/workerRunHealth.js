'use strict';

function runError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function nonNegative(value, field) {
    if (!Number.isSafeInteger(value) || value < 0) throw runError(`COMMERCE_WORKER_RUN_INVALID:${field}`);
    return value;
}

function buildWorkerRunSummary({
    worker,
    runId,
    startedAtMillis,
    finishedAtMillis,
    results
}) {
    if (
        typeof worker !== 'string' || !/^[a-z][a-z0-9_]{2,80}$/.test(worker) ||
        typeof runId !== 'string' || !/^[A-Za-z0-9_-]{8,80}$/.test(runId) ||
        !Array.isArray(results) || results.length < 1
    ) {
        throw runError('COMMERCE_WORKER_RUN_INVALID');
    }
    const normalized = results.map(({ name, result }) => {
        if (typeof name !== 'string' || !name) throw runError('COMMERCE_WORKER_RUN_RESULT_NAME_INVALID');
        const failureCount = Array.isArray(result?.failures)
            ? result.failures.length
            : nonNegative(result?.failureCount || 0, `${name}.failureCount`);
        return Object.freeze({
            name,
            pages: nonNegative(result?.pages || 0, `${name}.pages`),
            processed: nonNegative(result?.processed || 0, `${name}.processed`),
            failureCount,
            exhausted: result?.exhausted === true,
            backlogAgeSeconds: Number.isSafeInteger(result?.backlogAgeSeconds)
                ? Math.max(0, result.backlogAgeSeconds)
                : null
        });
    });
    const incomplete = normalized.some((result) => result.failureCount > 0 || result.exhausted);
    return Object.freeze({
        schemaVersion: 1,
        worker,
        runId,
        status: incomplete ? 'incomplete' : 'completed',
        startedAtMillis: nonNegative(startedAtMillis, 'startedAtMillis'),
        finishedAtMillis: nonNegative(finishedAtMillis, 'finishedAtMillis'),
        durationMs: Math.max(0, finishedAtMillis - startedAtMillis),
        resultCount: normalized.length,
        processed: normalized.reduce((sum, result) => sum + result.processed, 0),
        failureCount: normalized.reduce((sum, result) => sum + result.failureCount, 0),
        exhausted: normalized.some((result) => result.exhausted),
        results: Object.freeze(normalized)
    });
}

function assertWorkerRunComplete(summary) {
    if (summary?.status !== 'completed') {
        const error = runError('COMMERCE_WORKER_RUN_INCOMPLETE');
        error.summary = summary;
        throw error;
    }
    return summary;
}

module.exports = { assertWorkerRunComplete, buildWorkerRunSummary };
