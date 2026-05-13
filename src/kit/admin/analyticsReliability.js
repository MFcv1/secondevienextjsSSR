export const MAX_ANALYTICS_SESSIONS = 5000;

export const ANALYTICS_TIME_FILTERS = [
    { id: '1h', label: '1h', duration: 60 * 60 * 1000, step: 60 * 1000 },
    { id: '1j', label: '1j', duration: 24 * 60 * 60 * 1000, step: 60 * 60 * 1000 },
    { id: '7j', label: '7j', duration: 7 * 24 * 60 * 60 * 1000, step: 6 * 60 * 60 * 1000 },
    { id: '1mois', label: '1mois', duration: 30 * 24 * 60 * 60 * 1000, step: 24 * 60 * 60 * 1000 },
    { id: '1ans', label: '1ans', duration: 365 * 24 * 60 * 60 * 1000, step: 30 * 24 * 60 * 60 * 1000 }
];

const MAX_ANALYTICS_DURATION_SECONDS = 24 * 60 * 60;

export const getAnalyticsFilterConfig = (filterId) => (
    ANALYTICS_TIME_FILTERS.find(filter => filter.id === filterId) || ANALYTICS_TIME_FILTERS[2]
);

export const toAnalyticsMillis = (value) => {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return value;

    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeAnalyticsValue = (value) => {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    if (!normalized || normalized.toLowerCase() === 'unknown') return null;
    return normalized;
};

export const getIpVisitorKey = (session) => {
    const ip = normalizeAnalyticsValue(session?.ip);
    return ip ? `ip:${ip.toLowerCase()}` : null;
};

export const getVisitorIdentity = (session) => {
    const userId = normalizeAnalyticsValue(session?.userId);
    if (userId && userId.toLowerCase() !== 'anonymous') {
        return {
            key: `uid:${userId}`,
            source: session?.authProvider === 'anonymous' || session?.type === 'anonymous'
                ? 'anonymous_uid'
                : 'auth_uid'
        };
    }

    const visitorKey = normalizeAnalyticsValue(session?.visitorKey);
    if (visitorKey) return { key: `vk:${visitorKey}`, source: 'visitor_key' };

    const ipKey = getIpVisitorKey(session);
    if (ipKey) return { key: ipKey, source: 'ip' };

    const sessionId = normalizeAnalyticsValue(session?.id);
    return {
        key: sessionId ? `session:${sessionId}` : 'session:unknown',
        source: 'session'
    };
};

export const getReliableVisitorKey = (session) => getVisitorIdentity(session).key;

export const normalizeSessionDuration = (duration) => {
    const value = Number(duration);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(MAX_ANALYTICS_DURATION_SECONDS, Math.round(value)));
};

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const getVisitorConfidenceLabel = (score) => {
    if (score >= 85) return 'forte';
    if (score >= 70) return 'bonne';
    if (score >= 50) return 'moyenne';
    return 'faible';
};

export const buildVisitorConfidence = ({
    uniqueVisitors = 0,
    uniqueIps = 0,
    ipCoverage = 100,
    sessionFallbackCount = 0,
    isWindowComplete = true
} = {}) => {
    if (uniqueVisitors === 0) {
        return {
            score: 100,
            label: 'forte',
            ratio: 1,
            ratioLabel: '1.00',
            detail: 'Aucune visite sur la periode.'
        };
    }

    const ratio = uniqueIps > 0 ? uniqueVisitors / uniqueIps : null;
    const ratioDistance = ratio === null ? 1 : Math.abs(ratio - 1);
    let score = 100 - (ratioDistance * 50);

    score *= Math.max(0, Math.min(1, ipCoverage / 100));
    if (sessionFallbackCount > 0) score -= 12;
    if (!isWindowComplete) score = Math.min(score, 60);
    if (uniqueIps === 0) score = Math.min(score, 35);

    const finalScore = clampScore(score);
    const ratioLabel = ratio === null ? 'sans IP' : ratio.toFixed(2);
    return {
        score: finalScore,
        label: getVisitorConfidenceLabel(finalScore),
        ratio,
        ratioLabel,
        detail: ratio === null
            ? 'Aucune IP utilisable pour comparer les visiteurs.'
            : `${ratioLabel} utilisateur technique par IP unique.`
    };
};

export const getAnalyticsWindow = (filterId, rawNow = Date.now()) => {
    const config = getAnalyticsFilterConfig(filterId);
    const now = filterId === '1h' ? Math.floor(rawNow / 60000) * 60000 : rawNow;
    return {
        ...config,
        now,
        cutoff: now - config.duration
    };
};

export const getFilteredTrafficSessions = (sessions = [], filterId = '1j', options = {}) => {
    const { now, cutoff } = getAnalyticsWindow(filterId, options.now || Date.now());
    return sessions.filter((session) => {
        const started = toAnalyticsMillis(session.startedAt);
        return started >= cutoff && started < now && session.type !== 'admin';
    });
};

const getSessionJourneyLength = (session) => {
    if (typeof session?.pageViews === 'number') return session.pageViews;
    return Array.isArray(session?.journey) ? session.journey.length : 0;
};

const isValidTrafficSession = (session) => {
    if (!session || session.type === 'admin') return false;
    const duration = normalizeSessionDuration(session.duration);
    return duration >= 5 && getSessionJourneyLength(session) >= 1;
};

const formatSlotLabel = (time, filterId) => {
    const d = new Date(time);
    if (filterId === '1h') {
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    if (filterId === '1j') return `${d.getHours()}h`;
    if (filterId === '7j' || filterId === '1mois') {
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' });
};

const getOldestStartedAt = (sessions) => {
    const values = sessions.map(session => toAnalyticsMillis(session.startedAt)).filter(Boolean);
    return values.length > 0 ? Math.min(...values) : null;
};

export const buildAnalyticsStats = (sessions = [], filterId = '1j', options = {}) => {
    const { now, cutoff, step } = getAnalyticsWindow(filterId, options.now || Date.now());
    const maxFetched = options.maxFetched || MAX_ANALYTICS_SESSIONS;
    const fetchedCount = options.fetchedCount ?? sessions.length;
    const coverageStartMs = options.coverageStartMs ?? getOldestStartedAt(sessions);
    const isFetchCapped = fetchedCount >= maxFetched;
    const isWindowComplete = !isFetchCapped || !coverageStartMs || coverageStartMs <= cutoff;

    const realTraffic = getFilteredTrafficSessions(sessions, filterId, { now })
        .filter(isValidTrafficSession);

    const visitorKeys = new Set();
    const ipKeys = new Set();
    const identitySourceCounts = {
        auth_uid: 0,
        anonymous_uid: 0,
        visitor_key: 0,
        ip: 0,
        session: 0
    };

    let missingIpSessions = 0;
    let totalDuration = 0;
    let bounces = 0;
    let mobiles = 0;

    realTraffic.forEach((session) => {
        const identity = getVisitorIdentity(session);
        visitorKeys.add(identity.key);
        identitySourceCounts[identity.source] = (identitySourceCounts[identity.source] || 0) + 1;

        const ipKey = getIpVisitorKey(session);
        if (ipKey) ipKeys.add(ipKey);
        else missingIpSessions += 1;

        const duration = normalizeSessionDuration(session.duration);
        totalDuration += duration;
        if (getSessionJourneyLength(session) <= 1 || duration < 10) bounces += 1;
        if (session.device === 'Mobile') mobiles += 1;
    });

    const timeline = [];
    for (let t = cutoff; t < now; t += step) {
        timeline.push({
            timestamp: t,
            name: formatSlotLabel(t, filterId),
            visites: 0,
            sessions: 0,
            ips: 0,
            visitorKeys: new Set(),
            ipKeys: new Set()
        });
    }

    realTraffic.forEach((session) => {
        const started = toAnalyticsMillis(session.startedAt);
        if (!started) return;

        const slotIdx = Math.floor((started - cutoff) / step);
        const slot = timeline[slotIdx];
        if (!slot) return;

        slot.sessions += 1;
        slot.visitorKeys.add(getReliableVisitorKey(session));
        const ipKey = getIpVisitorKey(session);
        if (ipKey) slot.ipKeys.add(ipKey);
    });

    const chartData = timeline.map((slot) => ({
        timestamp: slot.timestamp,
        name: slot.name,
        visites: slot.visitorKeys.size,
        sessions: slot.sessions,
        ips: slot.ipKeys.size
    }));

    const totalSessions = realTraffic.length;
    const ipCoverage = totalSessions > 0
        ? Math.round(((totalSessions - missingIpSessions) / totalSessions) * 100)
        : 100;

    let confidence = 'haute';
    if (!isWindowComplete) confidence = 'plafonnee';
    else if (ipCoverage < 50) confidence = 'faible';
    else if (ipCoverage < 80 || identitySourceCounts.session > 0) confidence = 'moyenne';

    const visitorConfidence = buildVisitorConfidence({
        uniqueVisitors: visitorKeys.size,
        uniqueIps: ipKeys.size,
        ipCoverage,
        sessionFallbackCount: identitySourceCounts.session,
        isWindowComplete
    });

    return {
        realTraffic,
        chartData,
        kpis: {
            totalSessions,
            uniqueVisitors: visitorKeys.size,
            uniqueIps: ipKeys.size,
            visitorIpRatio: visitorConfidence.ratio,
            visitorIpRatioLabel: visitorConfidence.ratioLabel,
            visitorConfidenceScore: visitorConfidence.score,
            visitorConfidenceLabel: visitorConfidence.label,
            avgDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
            bounceRate: totalSessions > 0 ? Math.round((bounces / totalSessions) * 100) : 0,
            mobilePercentage: totalSessions > 0 ? Math.round((mobiles / totalSessions) * 100) : 0,
            ipCoverage
        },
        dataQuality: {
            confidence,
            isWindowComplete,
            isFetchCapped,
            fetchedCount,
            maxFetched,
            coverageStartMs,
            missingIpSessions,
            identitySourceCounts,
            visitorConfidence,
            method: 'UID Firebase client/anonyme, puis IUD navigateur, puis IP serveur, puis session si IP absente.'
        }
    };
};
