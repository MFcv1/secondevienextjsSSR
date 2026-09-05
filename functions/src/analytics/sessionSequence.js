'use strict';

function legacySessionProtocolAllowed(now = Date.now()) {
    const deadline = Date.parse(process.env.ANALYTICS_LEGACY_PROTOCOL_UNTIL || '2026-09-12T00:00:00Z');
    return Number.isFinite(deadline) && now < deadline;
}

function planSessionMessage(current, message, updates) {
    if (current.syncGeneration) {
        if (message.syncGeneration !== current.syncGeneration) return { success: false, generationMismatch: true };
        if (!Number.isSafeInteger(message.syncSequence) || message.syncSequence < 1) return { success: false, sequenceRequired: true };
        if (message.syncSequence <= (current.syncSequence || 0)) return { success: true, stale: true };
        return { success: true, updates: { ...updates, syncSequence: message.syncSequence } };
    }
    // Compatibilité des sessions antérieures : pas de réouverture sans init.
    if (!legacySessionProtocolAllowed()) return { success: false, upgradeRequired: true };
    return { success: true, updates: { ...updates,
        duration: Math.max(Number(current.duration) || 0, updates.duration),
        sessionActive: current.sessionActive === false ? false : updates.sessionActive
    } };
}

module.exports = { planSessionMessage, legacySessionProtocolAllowed };
