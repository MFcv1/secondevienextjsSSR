'use strict';

const crypto = require('node:crypto');

function commandError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function canonicalize(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') {
        return JSON.stringify(value);
    }
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) throw commandError('COMMERCE_CANONICAL_PAYLOAD_INVALID');
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
    if (value && typeof value === 'object') {
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null) {
            throw commandError('COMMERCE_CANONICAL_PAYLOAD_INVALID');
        }
        const keys = Object.keys(value).sort();
        if (keys.some((key) => value[key] === undefined)) {
            throw commandError('COMMERCE_CANONICAL_PAYLOAD_INVALID');
        }
        return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
    }
    throw commandError('COMMERCE_CANONICAL_PAYLOAD_INVALID');
}

function hashPayload(payload) {
    return crypto.createHash('sha256').update(canonicalize(payload)).digest('hex');
}

function validateCommand(command) {
    if (!command || typeof command !== 'object') throw commandError('COMMERCE_COMMAND_INVALID');
    if (typeof command.commandId !== 'string' || command.commandId.length < 8 || command.commandId.length > 160) {
        throw commandError('COMMERCE_COMMAND_ID_INVALID');
    }
    if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 0) {
        throw commandError('COMMERCE_EXPECTED_VERSION_INVALID');
    }
    return true;
}

async function executeIdempotentCommand({
    order,
    command,
    lookupResult,
    persistResult,
    transition,
    failpoints = null
}) {
    validateCommand(command);
    if (typeof lookupResult !== 'function' || typeof persistResult !== 'function' || typeof transition !== 'function') {
        throw commandError('COMMERCE_COMMAND_DEPENDENCY_INVALID');
    }
    const payloadHash = hashPayload(command.payload ?? null);
    failpoints?.hit('command.before_idempotency_lookup', { commandId: command.commandId });
    const existing = await lookupResult(command.commandId);
    failpoints?.hit('command.after_idempotency_lookup', { commandId: command.commandId });

    if (existing) {
        if (existing.payloadHash !== payloadHash) {
            throw commandError('COMMERCE_IDEMPOTENCY_PAYLOAD_CONFLICT');
        }
        return existing.result;
    }

    if (!order || order.stateVersion !== command.expectedVersion) {
        throw commandError('COMMERCE_STALE_VERSION');
    }

    failpoints?.hit('command.before_transition', { commandId: command.commandId });
    const result = transition(order, command.payload);
    failpoints?.hit('command.after_transition_before_persist', { commandId: command.commandId });
    await persistResult({
        commandId: command.commandId,
        payloadHash,
        result
    });
    failpoints?.hit('command.after_persist_before_response', { commandId: command.commandId });
    return result;
}

module.exports = {
    canonicalize,
    executeIdempotentCommand,
    hashPayload,
    validateCommand
};
