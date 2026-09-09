'use strict';

const { performance } = require('node:perf_hooks');

const STAGES = new Set([
    'rate-limit', 'user-lookup', 'credentials-read', 'options-create',
    'challenge-write', 'challenge-read', 'challenge-attempt',
    'signature-verify', 'challenge-consume', 'token-mint', 'operation-write'
]);

// Request-local, monotonic intervals. No account, credential or token is logged.
function createPasskeyTimer(ceremony, { now = () => performance.now(), log = console.info } = {}) {
    if (!['options', 'verify'].includes(ceremony)) throw new Error('Unknown passkey ceremony');
    let previous = now();
    return (stage) => {
        if (!STAGES.has(stage)) throw new Error('Unknown passkey stage');
        const current = now();
        const elapsedMs = Math.max(0, Math.round(current - previous));
        previous = current;
        try {
            log('passkey_stage_perf', { event: 'passkey_stage_perf', ceremony, stage, elapsedMs });
        } catch {
            // Diagnostics must never break authentication.
        }
    };
}

module.exports = { createPasskeyTimer };
