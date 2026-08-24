// Limite d'affichage des racines legeres. Les statistiques historiques ne
// dependent plus de ce lot: elles proviennent des rollups serveur permanents.
export const MAX_ANALYTICS_SESSIONS = 1000;

export const ANALYTICS_TIME_FILTERS = [
    { id: '1h', label: '1h', duration: 60 * 60 * 1000, step: 60 * 1000 },
    { id: '1j', label: '1j', duration: 24 * 60 * 60 * 1000, step: 60 * 60 * 1000 },
    { id: '7j', label: '7j', duration: 7 * 24 * 60 * 60 * 1000, step: 6 * 60 * 60 * 1000 },
    { id: '1mois', label: '1mois', duration: 30 * 24 * 60 * 60 * 1000, step: 24 * 60 * 60 * 1000 },
    { id: '1ans', label: '1ans', duration: 365 * 24 * 60 * 60 * 1000, step: 30 * 24 * 60 * 60 * 1000 },
    { id: 'tout', label: 'Tout', duration: Number.MAX_SAFE_INTEGER, step: 365 * 24 * 60 * 60 * 1000 }
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

export const isUsableAnalyticsIp = (ip) => Boolean(normalizeAnalyticsValue(ip));

export const getIpVisitorKey = (session) => {
    const ip = normalizeAnalyticsValue(session?.ip);
    return ip ? `ip:${ip.toLowerCase()}` : null;
};

export const getVisitorIdentity = (session) => {
    const visitorKey = normalizeAnalyticsValue(session?.visitorKey);
    if (visitorKey) {
        return {
            key: `visitor:${visitorKey}`,
            source: session?.identitySource || 'pseudonymous_uid'
        };
    }
    const userId = normalizeAnalyticsValue(session?.userId);
    if (userId && userId.toLowerCase() !== 'unknown') {
        return {
            key: `uid:${userId}`,
            source: session?.authProvider === 'anonymous' || session?.type === 'anonymous'
                ? 'anonymous_uid'
                : 'auth_uid'
        };
    }

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

export const maskAnalyticsIp = (ip) => {
    const value = normalizeAnalyticsValue(ip);
    if (!value) return 'IP inconnue';

    if (value.includes(':')) {
        return `${value.split(':').slice(0, 4).join(':')}:...`;
    }

    const parts = value.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;

    return 'IP masquee';
};

const getSessionLocationLabel = (session) => {
    const city = normalizeAnalyticsValue(session?.geo?.city);
    if (!city) return 'Localisation inconnue';

    const region = normalizeAnalyticsValue(session?.geo?.region);
    return region ? `${city}, ${region}` : city;
};

const getDayLabel = (dateObj, rawNow = Date.now()) => {
    const dateKey = dateObj.toLocaleDateString('fr-FR');
    const today = new Date(rawNow).toLocaleDateString('fr-FR');
    const yesterday = new Date(rawNow - 86400000).toLocaleDateString('fr-FR');

    if (dateKey === today) return "Aujourd'hui";
    if (dateKey === yesterday) return 'Hier';
    return dateKey;
};

const getSessionLastActivityMillis = (session) => (
    toAnalyticsMillis(session?.lastActivityAt) || toAnalyticsMillis(session?.startedAt)
);

export const buildVisitorDayGroups = (sessions = [], options = {}) => {
    const now = options.now || Date.now();
    const activeWindowMs = options.activeWindowMs || 30000;
    const dayMap = new Map();

    sessions.forEach((session) => {
        const started = toAnalyticsMillis(session.startedAt);
        if (!started) return;

        const dateObj = new Date(started);
        const dateKey = dateObj.toLocaleDateString('fr-FR');
        if (!dayMap.has(dateKey)) {
            dayMap.set(dateKey, {
                key: dateKey,
                label: getDayLabel(dateObj, now),
                timestamp: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime(),
                visitors: new Map()
            });
        }

        const day = dayMap.get(dateKey);
        const identity = getVisitorIdentity(session);
        if (!day.visitors.has(identity.key)) {
            day.visitors.set(identity.key, {
                key: identity.key,
                identitySource: identity.source,
                sessions: []
            });
        }

        day.visitors.get(identity.key).sessions.push(session);
    });

    return Array.from(dayMap.values())
        .map((day) => ({
            ...day,
            visitors: Array.from(day.visitors.values())
                .map((visitor) => {
                    const sortedSessions = [...visitor.sessions].sort(
                        (a, b) => toAnalyticsMillis(b.startedAt) - toAnalyticsMillis(a.startedAt)
                    );
                    const primarySession = sortedSessions[0] || {};
                    const lastActivityAt = Math.max(...sortedSessions.map(getSessionLastActivityMillis));
                    const firstStartedAt = Math.min(...sortedSessions.map(session => toAnalyticsMillis(session.startedAt)).filter(Boolean));
                    const totalDuration = sortedSessions.reduce(
                        (sum, session) => sum + normalizeSessionDuration(session.duration),
                        0
                    );
                    const journeySteps = sortedSessions.reduce(
                        (sum, session) => sum + (
                            Number.isFinite(Number(session.journeyCount))
                                ? Number(session.journeyCount)
                                : (Array.isArray(session.journey) ? session.journey.length : 0)
                        ),
                        0
                    );
                    const isActive = sortedSessions.some((session) => {
                        const lastActive = getSessionLastActivityMillis(session);
                        return session.sessionActive !== false && lastActive && (now - lastActive) <= activeWindowMs;
                    });

                    return {
                        ...visitor,
                        sessions: sortedSessions,
                        sessionCount: sortedSessions.length,
                        totalDuration,
                        journeySteps,
                        firstStartedAt,
                        lastActivityAt,
                        isActive,
                        locationLabel: getSessionLocationLabel(primarySession),
                        deviceLabel: [primarySession.os, primarySession.browser].filter(Boolean).join(' - ') || 'Device inconnu',
                        device: primarySession.device || 'Unknown',
                        ipLabel: maskAnalyticsIp(primarySession.ip)
                    };
                })
                .sort((a, b) => b.lastActivityAt - a.lastActivityAt),
            sessionCount: Array.from(day.visitors.values()).reduce(
                (sum, visitor) => sum + visitor.sessions.length,
                0
            )
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
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

const alignChartSlotStart = (time, step) => {
    const d = new Date(time);
    if (step < 60 * 60 * 1000) {
        const minutesStep = Math.max(1, Math.round(step / 60000));
        d.setMinutes(Math.floor(d.getMinutes() / minutesStep) * minutesStep, 0, 0);
        return d.getTime();
    }
    if (step < 24 * 60 * 60 * 1000) {
        const hoursStep = Math.max(1, Math.round(step / 3600000));
        d.setHours(Math.floor(d.getHours() / hoursStep) * hoursStep, 0, 0, 0);
        return d.getTime();
    }
    d.setHours(0, 0, 0, 0);
    return d.getTime();
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

    const realTraffic = getFilteredTrafficSessions(sessions, filterId, { now });

    const visitorKeys = new Set();
    const ipKeys = new Set();
    const identitySourceCounts = {
        auth_uid: 0,
        anonymous_uid: 0,
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
        const journeyLength = Array.isArray(session.journey) ? session.journey.length : 0;
        totalDuration += duration;
        if (journeyLength <= 1 || duration < 10) bounces += 1;
        if (session.device === 'Mobile') mobiles += 1;
    });

    const slotStart = alignChartSlotStart(cutoff, step);
    const slotEnd = alignChartSlotStart(now - 1, step);
    const timeline = [];
    const slotMap = new Map();
    for (let t = slotStart; t <= slotEnd; t += step) {
        const slot = {
            timestamp: t,
            name: formatSlotLabel(t, filterId),
            visites: 0,
            sessions: 0,
            ips: 0,
            visitorKeys: new Set(),
            ipKeys: new Set()
        };
        timeline.push(slot);
        slotMap.set(t, slot);
    }

    realTraffic.forEach((session) => {
        const started = toAnalyticsMillis(session.startedAt);
        if (!started) return;

        const slot = slotMap.get(alignChartSlotStart(started, step));
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
            method: 'UID Firebase client/anonyme, puis IP serveur, puis session si IP absente.'
        }
    };
};
