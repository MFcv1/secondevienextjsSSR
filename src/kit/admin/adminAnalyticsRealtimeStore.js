// Dependency-injected channel: navigation subscribers do not own the network listener.
export function createAnalyticsChannel(listen, validate) {
    const empty = Object.freeze({ status: 'idle', data: null });
    let state = empty;
    let owner = null;
    let stop = null;
    let epoch = 0;
    let highWater = null;
    const subscribers = new Set();
    const publish = next => { state = next; subscribers.forEach(fn => fn()); };
    const clear = () => {
        epoch += 1;
        stop?.(); stop = null; highWater = null;
        publish(empty);
    };
    return {
        subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
        getSnapshot: () => state,
        getServerSnapshot: () => empty,
        setOwner(nextOwner) { if (owner !== nextOwner) { clear(); owner = nextOwner; } },
        start() {
            if (!owner || stop) return;
            const currentEpoch = ++epoch;
            publish({ status: state.data ? 'cached' : 'loading', data: state.data });
            const accept = snapshot => {
                if (currentEpoch !== epoch) return;
                // An empty local cache is not proof that the server document is missing.
                if (snapshot.metadata?.fromCache && snapshot.docs?.length !== 2) {
                    publish({ status: state.data ? 'cached' : 'loading', data: state.data });
                    return;
                }
                try {
                    const data = validate(snapshot);
                    const signature = JSON.stringify(data);
                    if (highWater && (data.recent.epoch !== highWater.epoch
                        || data.recent.revision < highWater.revision
                        || (data.recent.revision === highWater.revision && signature !== highWater.signature))) {
                        throw new Error('DATA_REGRESSION');
                    }
                    highWater = { epoch: data.recent.epoch, revision: data.recent.revision, signature };
                    publish({ status: snapshot.metadata?.fromCache ? 'cached' : 'ready', data });
                } catch {
                    publish({ status: 'error', data: null });
                }
            };
            try {
                stop = listen(accept, () => {
                    if (currentEpoch === epoch) publish({ status: 'error', data: null });
                });
            } catch { publish({ status: 'error', data: null }); }
        },
        pause() {
            epoch += 1; stop?.(); stop = null;
            if (state.data) publish({ status: 'cached', data: state.data });
        },
        clear() { owner = null; clear(); }
    };
}

const SIZE = 1024;
const LIMITS = { minute: 61, hour: 25, quarterday: 32, day: 31, tenday: 39, month: 13, year: 50 };
const METRICS = ['sessions', 'duration', 'bounces', 'mobile'];
function registers(encoded) {
    if (typeof encoded !== 'string' || !/^[A-Za-z0-9+/]{1366}==$/.test(encoded)) throw new Error('DATA_SKETCH');
    const result = Uint8Array.from(atob(encoded), value => value.charCodeAt(0));
    if (result.length !== SIZE || result.some(rank => rank > 63)) throw new Error('DATA_SKETCH');
    return result;
}
export function validateAnalyticsSnapshot(snapshot) {
    if (snapshot.metadata?.hasPendingWrites || snapshot.docs?.length !== 2) throw new Error('DATA_MISSING');
    const docs = Object.fromEntries(snapshot.docs.map(doc => [doc.id, doc.data()]));
    for (const name of ['recent', 'history']) {
        const doc = docs[name];
        const allowed = ['schemaVersion', 'epoch', 'revision', 'coverageStartMs', 'detailCoverageStartMs', 'historyComplete', 'generatedAtMs', 'buckets'];
        if (doc?.detailCoverageStartMs !== undefined && (!Number.isSafeInteger(doc.detailCoverageStartMs)
            || doc.detailCoverageStartMs < doc.coverageStartMs || doc.detailCoverageStartMs > doc.generatedAtMs)) throw new Error('DATA_DETAIL_COVERAGE');
        if (!doc || doc.schemaVersion !== 1 || !/^[a-zA-Z0-9_-]{1,80}$/.test(doc.epoch)
            || Object.keys(doc).some(key => !allowed.includes(key))
            || !Number.isSafeInteger(doc.revision) || doc.revision < 1
            || !Number.isSafeInteger(doc.generatedAtMs) || !Number.isSafeInteger(doc.coverageStartMs)
            || doc.coverageStartMs > doc.generatedAtMs || typeof doc.historyComplete !== 'boolean'
            || !doc.buckets || Array.isArray(doc.buckets)
            || new TextEncoder().encode(JSON.stringify(doc)).length > 256 * 1024) throw new Error('DATA_SCHEMA');
        const counts = {};
        for (const [key, bucket] of Object.entries(doc.buckets)) {
            if (!bucket || Object.keys(bucket).some(field => ![...METRICS, 'uniqueHll'].includes(field))) throw new Error('DATA_BUCKET_FIELDS');
            const [kind, value] = key.split('_');
            if (!Object.hasOwn(LIMITS, kind) || ((name === 'recent') !== ['minute', 'hour', 'quarterday'].includes(kind))) throw new Error('DATA_BUCKET');
            const pattern = kind === 'minute' || kind === 'hour' ? /^\d{1,12}$/
                : kind === 'quarterday' ? /^\d{4}-\d{2}-\d{2}-[0-3]$/
                    : kind === 'tenday' ? /^\d{4}-\d{2}-(01|11|21)$/
                        : kind === 'day' ? /^\d{4}-\d{2}-\d{2}$/ : kind === 'month' ? /^\d{4}-\d{2}$/ : /^\d{4}$/;
            if (!pattern.test(value) || key !== `${kind}_${value}` || (counts[kind] = (counts[kind] || 0) + 1) > LIMITS[kind]) throw new Error('DATA_BUCKET');
            if (kind === 'minute' || kind === 'hour') {
                if (!Number.isSafeInteger(Number(value)) || Number(value) * (kind === 'minute' ? 60000 : 3600000) > doc.generatedAtMs) throw new Error('DATA_BUCKET_TIME');
            } else {
                const isoDate = `${kind === 'quarterday' ? value.slice(0, 10) : value}${kind === 'year' ? '-01-01' : kind === 'month' ? '-01' : ''}`;
                const parsed = Date.parse(`${isoDate}T12:00:00Z`);
                if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== isoDate) throw new Error('DATA_BUCKET_TIME');
            }
            for (const metric of METRICS) if (!Number.isSafeInteger(bucket[metric]) || bucket[metric] < 0) throw new Error('DATA_METRIC');
            if (bucket.bounces > bucket.sessions || bucket.mobile > bucket.sessions) throw new Error('DATA_METRIC');
            const sketch = registers(bucket.uniqueHll);
            if (!bucket.sessions && sketch.some(value => value !== 0)) throw new Error('DATA_EMPTY_SKETCH');
        }
    }
    if (docs.recent.epoch !== docs.history.epoch || docs.recent.revision !== docs.history.revision
        || docs.recent.generatedAtMs !== docs.history.generatedAtMs
        || docs.recent.coverageStartMs !== docs.history.coverageStartMs
        || docs.recent.detailCoverageStartMs !== docs.history.detailCoverageStartMs
        || docs.recent.historyComplete !== docs.history.historyComplete) throw new Error('DATA_INCONSISTENT');
    return { recent: docs.recent, history: docs.history };
}
function estimate(values) {
    let inverse = 0;
    let zeroes = 0;
    for (const value of values) { inverse += 2 ** -value; if (!value) zeroes += 1; }
    const raw = (0.7213 / (1 + 1.079 / SIZE)) * SIZE * SIZE / inverse;
    return Math.round(raw <= 2.5 * SIZE && zeroes ? SIZE * Math.log(SIZE / zeroes) : raw);
}
const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFormatter = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
function dateKey(now) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(now)).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}
// Paris calendar slots remain aligned across both daylight-saving transitions.
function slotStart(day, hour = 0) {
    const target = Date.parse(`${day}T${String(hour).padStart(2, '0')}:00:00Z`);
    let timestamp = target;
    for (let i = 0; i < 3; i += 1) {
        const local = Date.parse(`${dateKey(timestamp)}T${timeFormatter.format(timestamp)}:00Z`);
        timestamp += target - local;
    }
    return timestamp;
}
function detailedTimeline(data, period, days, months, now) {
    const weekly = period === '7j';
    const doc = weekly ? data.recent : data.history;
    if (doc.detailCoverageStartMs === undefined) return {
        chartDescription: `Historique disponible par ${weekly ? 'jour' : 'mois'} ; détail ${weekly ? 'par tranche de 6 heures' : 'par tiers de mois'} pas encore disponible.`
    };
    const slots = weekly
        ? days.flatMap(day => [0, 6, 12, 18].map((hour, index) => ({ key: `quarterday_${day}-${index}`, timestamp: slotStart(day, hour), day, hour })))
        : months.flatMap(month => ['01', '11', '21'].map(date => ({ key: `tenday_${month}-${date}`, timestamp: slotStart(`${month}-${date}`), day: `${month}-${date}` })));
    const chartData = slots.map(({ key, timestamp, day, hour }) => {
        const bucket = doc.buckets[key];
        const known = doc.detailCoverageStartMs !== undefined && timestamp >= doc.detailCoverageStartMs && timestamp <= now;
        const value = known ? 0 : null;
        return { timestamp, name: `${day.slice(8)}/${day.slice(5, 7)}`,
            tooltipLabel: `${day.slice(8)}/${day.slice(5, 7)}/${day.slice(0, 4)}${weekly ? ` · ${String(hour).padStart(2, '0')} h – ${hour + 6} h` : ` · du ${day.slice(8)} au ${day.endsWith('21') ? new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)), 0)).getUTCDate() : Number(day.slice(8)) + 9}`}`,
            sessions: bucket?.sessions ?? value, visites: bucket ? estimate(registers(bucket.uniqueHll)) : value, ips: 0 };
    });
    const complete = doc.detailCoverageStartMs !== undefined && slots[0].timestamp >= doc.detailCoverageStartMs;
    return { chartData, chartDescription: `${weekly ? '4 barres par jour · tranches de 6 heures' : '3 barres par mois · du 1 au 10, du 11 au 20 et du 21 à la fin du mois'}. Chaque barre déduplique les visiteurs.${complete ? '' : ' Détail historique partiel : les créneaux inconnus restent vides.'}` };
}
export function realtimeOverview(data, period, now = Date.now()) {
    if (!data) return null;
    const day = dateKey(now);
    const dayOffset = days => new Date(Date.parse(`${day}T12:00:00Z`) - days * 86400000).toISOString().slice(0, 10);
    const currentMonthIndex = Number(day.slice(0, 4)) * 12 + Number(day.slice(5, 7)) - 1;
    const monthIndex = currentMonthIndex - 11;
    const firstMonth = `${Math.floor(monthIndex / 12)}-${String(monthIndex % 12 + 1).padStart(2, '0')}`;
    const settings = {
        '1h': ['minute', Math.floor(now / 60000) - 59, Math.floor(now / 60000), '60 minutes calendaires, minute courante incluse.'],
        '1j': ['hour', Math.floor(now / 3600000) - 23, Math.floor(now / 3600000), '24 tranches horaires, heure courante incluse.'],
        '7j': ['day', dayOffset(6), day, '7 jours calendaires, aujourd’hui inclus.'],
        '1mois': ['day', dayOffset(29), day, '30 jours calendaires, aujourd’hui inclus.'],
        '1ans': ['month', firstMonth, day.slice(0, 7), '12 mois calendaires, mois courant inclus.'],
        'tout': ['year', '0000', day.slice(0, 4), 'Historique conservé, au plus 50 années.']
    };
    const [kind, lower, upper, method] = settings[period] || settings['1j'];
    const doc = ['minute', 'hour'].includes(kind) ? data.recent : data.history;
    const merged = new Uint8Array(SIZE);
    const totals = Object.fromEntries(METRICS.map(key => [key, 0]));
    const chartData = [];
    for (const [key, bucket] of Object.entries(doc.buckets)) {
        if (!key.startsWith(`${kind}_`)) continue;
        const raw = key.slice(kind.length + 1);
        const value = ['minute', 'hour'].includes(kind) ? Number(raw) : raw;
        if (value < lower || value > upper) continue;
        if (!bucket.sessions) continue;
        const sketch = registers(bucket.uniqueHll);
        for (let i = 0; i < SIZE; i += 1) merged[i] = Math.max(merged[i], sketch[i]);
        for (const metric of METRICS) totals[metric] += bucket[metric];
        const timestamp = kind === 'minute' ? value * 60000 : kind === 'hour' ? value * 3600000
            : Date.parse(`${raw}${kind === 'year' ? '-01-01' : kind === 'month' ? '-01' : ''}T12:00:00Z`);
        const name = ['minute', 'hour'].includes(kind)
            ? timeFormatter.format(new Date(timestamp))
            : kind === 'year' ? raw : kind === 'month' ? `${raw.slice(5)}/${raw.slice(0, 4)}` : `${raw.slice(8)}/${raw.slice(5, 7)}`;
        chartData.push({ timestamp, name, sessions: bucket.sessions, visites: estimate(sketch), ips: 0 });
    }
    const lowerMs = kind === 'minute' ? lower * 60000 : kind === 'hour' ? lower * 3600000
        : kind === 'year' ? null : Date.parse(`${lower}${kind === 'month' ? '-01' : ''}T00:00:00Z`) - 2 * 3600000;
    // Conservative near local midnight: never claim coverage not established by bootstrap.
    const complete = doc.historyComplete || (lowerMs !== null && doc.coverageStartMs <= lowerMs);
    // Keep the whole calendar axis, including quiet slots. Before known coverage,
    // leave values unknown rather than presenting missing history as zero traffic.
    const points = new Map(chartData.map(point => [point.timestamp, point]));
    const slots = [];
    if (kind === 'minute' || kind === 'hour') {
        const step = kind === 'minute' ? 60000 : 3600000;
        for (let value = lower; value <= upper; value += 1) slots.push(value * step);
    } else if (kind === 'day') {
        for (let value = Date.parse(`${lower}T12:00:00Z`); value <= Date.parse(`${upper}T12:00:00Z`); value += 86400000) slots.push(value);
    } else if (kind === 'month') {
        for (let value = monthIndex; value <= currentMonthIndex; value += 1) slots.push(Date.UTC(Math.floor(value / 12), value % 12, 1, 12));
    } else {
        const firstYear = Math.max(Number(upper) - 49, Math.min(
            Number(dateKey(doc.coverageStartMs).slice(0, 4)),
            ...chartData.map(point => new Date(point.timestamp).getUTCFullYear())
        ));
        for (let year = firstYear; year <= Number(upper); year += 1) slots.push(Date.UTC(year, 0, 1, 12));
    }
    const timeline = slots.map(timestamp => {
        if (points.has(timestamp)) return points.get(timestamp);
        const raw = new Date(timestamp).toISOString();
        const name = kind === 'minute' || kind === 'hour' ? timeFormatter.format(new Date(timestamp))
            : kind === 'year' ? raw.slice(0, 4) : kind === 'month' ? `${raw.slice(5, 7)}/${raw.slice(0, 4)}` : `${raw.slice(8, 10)}/${raw.slice(5, 7)}`;
        const value = complete || timestamp >= doc.coverageStartMs ? 0 : null;
        return { timestamp, name, sessions: value, visites: value, ips: 0 };
    });
    const detail = ['7j', '1ans'].includes(period) ? detailedTimeline(data, period,
        Array.from({ length: 7 }, (_, index) => dayOffset(6 - index)),
        Array.from({ length: 12 }, (_, index) => {
            const value = monthIndex + index;
            return `${Math.floor(value / 12)}-${String(value % 12 + 1).padStart(2, '0')}`;
        }), now) : {};
    return {
        period, chartData: timeline,
        ...detail,
        kpis: { totalSessions: totals.sessions, uniqueVisitors: estimate(merged), uniqueIps: 0,
            visitorConfidenceLabel: 'estimation pseudonymisée', visitorConfidenceScore: 90,
            avgDuration: totals.sessions ? Math.round(totals.duration / totals.sessions) : 0,
            bounceRate: totals.sessions ? Math.round(100 * totals.bounces / totals.sessions) : 0,
            mobilePercentage: totals.sessions ? Math.round(100 * totals.mobile / totals.sessions) : 0 },
        dataQuality: { confidence: complete ? 'haute' : 'partielle', isWindowComplete: complete, isFetchCapped: false,
            fetchedCount: 2, maxFetched: 2, coverageStartMs: doc.coverageStartMs,
            method: `${method} Sessions commencées sur la période. Visiteurs estimés; durée et rebond finalisés à la fermeture des sessions.` },
        aggregate: { pageCounts: {}, actionCounts: {}, journeySteps: 0, sourceDocuments: 2, uniqueVisitorsEstimated: true }
    };
}
