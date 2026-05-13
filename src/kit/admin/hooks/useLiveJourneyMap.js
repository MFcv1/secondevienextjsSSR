import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { buildJourneyAnalytics, TIME_FILTERS } from '../siteMapModel';

const getRefreshMs = (filterId) => {
    if (filterId === '15m') return 30000;
    if (filterId === '1h') return 45000;
    return 120000;
};

export const useLiveJourneyMap = (model, timeFilterId, options = {}) => {
    const { enabled = true, sessionsOverride = null } = options;
    const activeFilter = useMemo(
        () => TIME_FILTERS.find((filter) => filter.id === timeFilterId) || TIME_FILTERS[0],
        [timeFilterId]
    );
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastSyncedAt, setLastSyncedAt] = useState(0);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = window.setInterval(() => setNow(Date.now()), 5000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        let cancelled = false;
        let intervalId = null;

        if (!enabled) {
            setLoading(false);
            setError(null);
            setLastSyncedAt(Date.now());
            return () => {
                cancelled = true;
            };
        }

        const fetchSessions = async () => {
            setLoading(true);
            setError(null);

            try {
                const cutoff = new Date(Date.now() - activeFilter.ms);
                const sessionsQuery = query(
                    collection(db, 'analytics_sessions'),
                    where('lastActivityAt', '>=', cutoff),
                    orderBy('lastActivityAt', 'desc'),
                    limit(activeFilter.limit)
                );

                const snapshot = await getDocs(sessionsQuery);
                if (cancelled) return;

                const clean = snapshot.docs
                    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
                    .filter((session) => session.type !== 'admin');

                setSessions(clean);
                setLastSyncedAt(Date.now());
                setLoading(false);
            } catch (snapshotError) {
                if (cancelled) return;
                console.error('useLiveJourneyMap: window listener error', snapshotError);
                setError(snapshotError);
                setLoading(false);
            }
        };

        fetchSessions();
        intervalId = window.setInterval(fetchSessions, getRefreshMs(activeFilter.id));

        return () => {
            cancelled = true;
            if (intervalId) window.clearInterval(intervalId);
        };
    }, [activeFilter.id, activeFilter.limit, activeFilter.ms, enabled]);

    const sourceSessions = useMemo(() => {
        if (!Array.isArray(sessionsOverride)) return sessions;
        return sessionsOverride;
    }, [sessions, sessionsOverride]);

    const analytics = useMemo(
        () => buildJourneyAnalytics(model, sourceSessions, now),
        [model, now, sourceSessions]
    );

    return {
        activeFilter,
        analytics,
        error,
        lastSyncedAt,
        loading,
        now,
        sessions: sourceSessions
    };
};

export default useLiveJourneyMap;
