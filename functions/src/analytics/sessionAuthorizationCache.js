const DEFAULT_TTL_MS = 60 * 1000;
const DEFAULT_MAX_ENTRIES = 1_000;

const createSessionAuthorizationCache = ({
    ttlMs = DEFAULT_TTL_MS,
    maxEntries = DEFAULT_MAX_ENTRIES,
    now = () => Date.now()
} = {}) => {
    const entries = new Map();

    const removeExpired = () => {
        const currentTime = now();
        for (const [sessionId, entry] of entries) {
            if (entry.expiresAt <= currentTime) entries.delete(sessionId);
        }
    };

    const get = (sessionId) => {
        const key = String(sessionId || '');
        if (!key) return null;

        const entry = entries.get(key);
        if (!entry) return null;
        if (entry.expiresAt <= now()) {
            entries.delete(key);
            return null;
        }

        // Refresh insertion order so the size bound behaves like a small LRU.
        entries.delete(key);
        entries.set(key, entry);
        return entry.syncTokenHash;
    };

    const set = (sessionId, syncTokenHash) => {
        const key = String(sessionId || '');
        const hash = String(syncTokenHash || '');
        if (!key || !hash) return;

        removeExpired();
        entries.delete(key);
        entries.set(key, {
            syncTokenHash: hash,
            expiresAt: now() + Math.max(1, ttlMs)
        });

        while (entries.size > Math.max(1, maxEntries)) {
            const oldestKey = entries.keys().next().value;
            entries.delete(oldestKey);
        }
    };

    const remove = (sessionId) => entries.delete(String(sessionId || ''));
    const clear = () => entries.clear();
    const size = () => entries.size;

    return { get, set, remove, clear, size };
};

module.exports = {
    DEFAULT_TTL_MS,
    DEFAULT_MAX_ENTRIES,
    createSessionAuthorizationCache
};
