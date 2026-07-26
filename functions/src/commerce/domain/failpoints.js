'use strict';

const FAILPOINT_NAMES = Object.freeze([
    'command.before_idempotency_lookup',
    'command.after_idempotency_lookup',
    'command.before_transition',
    'command.after_transition_before_persist',
    'command.after_persist_before_response',
    'create.after_hold',
    'create.after_stripe_response_before_attach',
    'create.after_attach_before_response',
    'cancel.after_request',
    'cancel.after_stripe_cancel_before_release',
    'inbox.after_persist',
    'inbox.after_claim',
    'inbox.after_retrieve',
    'inbox.before_apply_commit',
    'inbox.after_commit'
]);

function createFailpointController(schedule = {}) {
    const remaining = new Map();
    for (const [name, count] of Object.entries(schedule)) {
        if (!FAILPOINT_NAMES.includes(name) || !Number.isSafeInteger(count) || count < 0) {
            const error = new Error(`COMMERCE_FAILPOINT_INVALID:${name}`);
            error.code = 'COMMERCE_FAILPOINT_INVALID';
            throw error;
        }
        remaining.set(name, count);
    }
    return Object.freeze({
        hit(name) {
            if (!FAILPOINT_NAMES.includes(name)) {
                const error = new Error(`COMMERCE_FAILPOINT_UNKNOWN:${name}`);
                error.code = 'COMMERCE_FAILPOINT_UNKNOWN';
                throw error;
            }
            const count = remaining.get(name) || 0;
            if (count <= 0) return;
            remaining.set(name, count - 1);
            const error = new Error(`COMMERCE_FAILPOINT_TRIGGERED:${name}`);
            error.code = 'COMMERCE_FAILPOINT_TRIGGERED';
            error.failpoint = name;
            throw error;
        }
    });
}

module.exports = {
    FAILPOINT_NAMES,
    createFailpointController
};
