// --- HELPERS ---
export const getMillis = (ts) => {
    if (!ts) return 0;
    return typeof ts.toMillis === 'function' ? ts.toMillis() : (ts.seconds * 1000 || 0);
};

export const formatTime = (ts) => {
    const ms = getMillis(ts);
    if (!ms) return "...";
    return new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};