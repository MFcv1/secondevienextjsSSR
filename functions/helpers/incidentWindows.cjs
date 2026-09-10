'use strict';
// Pure bounded projection shared with the browser through shared/incidentWindows.cjs.
const MAX_OCCURRENCES = 512;
const RETENTION_MS = 8 * 86400000;
function appendOccurrence(previous, timestamp, now) {
    const samples = [...(previous?.occurrenceTimes || []), timestamp]
        .filter(value => Number.isFinite(value) && value >= now - RETENTION_MS)
        .sort((a, b) => a - b);
    const removed = samples.length > MAX_OCCURRENCES;
    return {
        occurrenceTimes: samples.slice(-MAX_OCCURRENCES),
        windowCoverageStart: Math.max(Number(previous?.windowCoverageStart) || now,
            removed ? samples[samples.length - MAX_OCCURRENCES] + 1 : 0)
    };
}
function windowOccurrences(group, start, end) {
    if (!Array.isArray(group?.occurrenceTimes)) return { count: null, complete: false };
    return { count: group.occurrenceTimes.filter(value => value >= start && value < end).length,
        complete: Number.isFinite(group.windowCoverageStart) && group.windowCoverageStart <= start };
}
module.exports = { appendOccurrence, windowOccurrences, MAX_OCCURRENCES };
