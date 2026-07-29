// --- HELPERS ---
export const getMillis = (ts) => {
    if (!ts) return 0;
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (ts instanceof Date) return Number.isNaN(ts.getTime()) ? 0 : ts.getTime();
    if (typeof ts === 'number') {
        if (!Number.isFinite(ts)) return 0;
        return ts > 0 && ts < 100000000000 ? ts * 1000 : ts;
    }
    if (typeof ts === 'string') {
        const parsed = Date.parse(ts);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    const seconds = Number(ts.seconds ?? ts._seconds);
    const nanoseconds = Number(ts.nanoseconds ?? ts._nanoseconds ?? 0);
    if (Number.isFinite(seconds)) {
        return (seconds * 1000) + (Number.isFinite(nanoseconds) ? Math.floor(nanoseconds / 1000000) : 0);
    }
    return 0;
};

export const formatTime = (ts) => {
    const ms = getMillis(ts);
    if (!ms) return "...";
    return new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};
