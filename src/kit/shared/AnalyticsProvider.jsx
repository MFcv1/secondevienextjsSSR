import { useEffect, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, functionsRegion } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
    ANALYTICS_EVENT_NAME,
    drainBufferedAnalyticsEvents,
    registerAnalyticsEventConsumer,
} from './analyticsEvents';

const ANALYTICS_INIT_DELAY_MS = 1500;
const ANALYTICS_SYNC_INTERVAL_MS = 15000;
const ROUTE_SYNC_DELAY_MS = 750;
const MIN_BEACON_GAP_MS = 3000;
const CLOSED_SESSION_RESUME_GRACE_MS = 15000;

const isLikelyBot = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|whatsapp|telegrambot|linkedinbot|pinterest|preview/i.test(ua);
};

const getDeviceInfo = () => {
    const ua = navigator.userAgent;

    let device = 'Desktop';
    if (/Mobi|Android|iPhone/i.test(ua)) device = 'Mobile';
    if (/Tablet|iPad/i.test(ua)) device = 'Tablet';

    let browser = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('MSIE') || ua.includes('rv:')) browser = 'IE/Edge';

    let os = 'Unknown';
    if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod') || ua.includes('like Mac')) os = 'iOS';
    else if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';

    return { device, browser, os };
};

const ANALYTICS_SESSION_ID_KEY = 'analytics_session_id';
const ANALYTICS_SESSION_TOKEN_KEY = 'analytics_session_token';
const ANALYTICS_SESSION_CLOSED_AT_KEY = 'analytics_session_closed_at';

const readStorageValue = (storage, key) => {
    try {
        return storage?.getItem(key) || null;
    } catch {
        return null;
    }
};

const getStoredAnalyticsSession = () => {
    const sessionId = readStorageValue(sessionStorage, ANALYTICS_SESSION_ID_KEY);
    const syncToken = readStorageValue(sessionStorage, ANALYTICS_SESSION_TOKEN_KEY);
    const closedAt = Number(readStorageValue(sessionStorage, ANALYTICS_SESSION_CLOSED_AT_KEY));
    if (!sessionId || !syncToken) return null;
    if (Number.isFinite(closedAt) && closedAt > 0 && Date.now() - closedAt > CLOSED_SESSION_RESUME_GRACE_MS) return null;
    return { sessionId, syncToken };
};

const persistStorageValue = (storage, key, value) => {
    try {
        if (value) storage?.setItem(key, value);
        else storage?.removeItem(key);
    } catch {
        // Storage can be unavailable in hardened private browsing modes.
    }
};

const persistAnalyticsSession = (sessionId, syncToken) => {
    persistStorageValue(sessionStorage, ANALYTICS_SESSION_ID_KEY, sessionId);
    persistStorageValue(sessionStorage, ANALYTICS_SESSION_TOKEN_KEY, syncToken);
    persistStorageValue(sessionStorage, ANALYTICS_SESSION_CLOSED_AT_KEY, null);
    // Remove stale V1 values: a new tab or a reopened browser is a new session.
    persistStorageValue(localStorage, ANALYTICS_SESSION_ID_KEY, null);
    persistStorageValue(localStorage, ANALYTICS_SESSION_TOKEN_KEY, null);
};

const AnalyticsProvider = ({ view, selectedItemId, selectedItemName, selectedItemPrice, selectedItemContext = null }) => {
    const { user, isAdmin } = useAuth();
    const sessionIdRef = useRef(null);
    const syncTokenRef = useRef(null);
    const initCalledRef = useRef(false);
    const journeyToSend = useRef([]);
    const eventPreviewRef = useRef([]);
    const startTimeRef = useRef(Date.now());
    const activeStartedAtRef = useRef(typeof document !== 'undefined' && document.visibilityState === 'hidden' ? null : Date.now());
    const accumulatedActiveMsRef = useRef(0);
    const lastActionTimeRef = useRef(Date.now());
    const latestViewRef = useRef({ view, selectedItemId, selectedItemName, selectedItemPrice, selectedItemContext });
    const lastRecordedKeyRef = useRef(null);
    const lastSyncAtRef = useRef(0);
    const lastBeaconAtRef = useRef(0);
    const hasRecordedJourneyRef = useRef(false);
    const syncInFlightRef = useRef(false);
    const pendingSyncRef = useRef(null);
    const routeSyncTimerRef = useRef(null);
    const heartbeatTimerRef = useRef(null);
    const armHeartbeatRef = useRef(() => {});
    const flushSessionRef = useRef(async () => false);

    useEffect(() => {
        latestViewRef.current = { view, selectedItemId, selectedItemName, selectedItemPrice, selectedItemContext };
    }, [view, selectedItemId, selectedItemName, selectedItemPrice, selectedItemContext]);

    useEffect(() => {
        const recordAnalyticsEvent = (detail) => {
            if (isAdmin || !detail?.action) return;
            eventPreviewRef.current = [...eventPreviewRef.current, detail].slice(-16);
            scheduleRouteSync('manual');
        };
        const handleAnalyticsEvent = (event) => recordAnalyticsEvent(event?.detail);
        window.addEventListener(ANALYTICS_EVENT_NAME, handleAnalyticsEvent);
        const unregisterConsumer = registerAnalyticsEventConsumer();
        drainBufferedAnalyticsEvents().forEach(recordAnalyticsEvent);
        return () => {
            unregisterConsumer();
            window.removeEventListener(ANALYTICS_EVENT_NAME, handleAnalyticsEvent);
        };
    }, [isAdmin]);

    const getTrackedDuration = () => {
        const activeMs = accumulatedActiveMsRef.current
            + (activeStartedAtRef.current ? Date.now() - activeStartedAtRef.current : 0);
        return Math.max(0, Math.round(activeMs / 1000));
    };

    const pauseActiveTimer = () => {
        if (!activeStartedAtRef.current) return;
        accumulatedActiveMsRef.current += Date.now() - activeStartedAtRef.current;
        activeStartedAtRef.current = null;
    };

    const resumeActiveTimer = () => {
        if (activeStartedAtRef.current) return;
        activeStartedAtRef.current = Date.now();
        lastActionTimeRef.current = Date.now();
    };

    const recordCurrentView = ({ allowPartialDetail = false } = {}) => {
        if (!sessionIdRef.current || isAdmin) return false;

        const current = latestViewRef.current;
        if (current.view === 'detail' && current.selectedItemId && !current.selectedItemName && !allowPartialDetail) return false;

        const actionKey = [
            current.view || '',
            current.selectedItemId || '',
            current.selectedItemName || '',
            current.selectedItemPrice || '',
            current.selectedItemContext?.source || '',
            current.selectedItemContext?.parentFurnitureId || ''
        ].join('|');
        if (lastRecordedKeyRef.current === actionKey) return false;

        const actionTime = Date.now();
        const durationSinceLast = Math.round((actionTime - lastActionTimeRef.current) / 1000);

        let displayId = null;
        if (current.selectedItemId) {
            displayId = current.selectedItemName
                ? `${current.selectedItemId} | ${current.selectedItemName} ${current.selectedItemPrice ? `(${current.selectedItemPrice}EUR)` : ''}`
                : current.selectedItemId;
            if (current.selectedItemContext?.parentFurnitureName) {
                displayId += ` [depuis: ${current.selectedItemContext.parentFurnitureName}]`;
            } else if (current.selectedItemContext?.source) {
                displayId += ` [source: ${current.selectedItemContext.source}]`;
            }
        }

        journeyToSend.current.push({
            page: current.view,
            itemId: displayId,
            time: new Date().toLocaleTimeString('fr-FR'),
            timestampMs: actionTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            duration: durationSinceLast
        });
        lastRecordedKeyRef.current = actionKey;
        lastActionTimeRef.current = actionTime;
        hasRecordedJourneyRef.current = true;
        return true;
    };

    const clearHeartbeatTimer = () => {
        if (!heartbeatTimerRef.current) return;
        clearTimeout(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
    };

    armHeartbeatRef.current = () => {
        clearHeartbeatTimer();
        if (!sessionIdRef.current || isAdmin || document.visibilityState !== 'visible') return;

        const elapsedSinceLastSync = Math.max(0, Date.now() - lastSyncAtRef.current);
        const delay = Math.max(250, ANALYTICS_SYNC_INTERVAL_MS - elapsedSinceLastSync);
        heartbeatTimerRef.current = setTimeout(() => {
            heartbeatTimerRef.current = null;
            flushSessionRef.current({
                sessionActive: true,
                ensureView: true,
                reason: 'heartbeat'
            });
        }, delay);
    };

    flushSessionRef.current = async ({ sessionActive = true, ensureView = false, reason = 'manual' } = {}) => {
        if (!sessionIdRef.current || isAdmin) return false;
        if (syncInFlightRef.current) {
            // A heartbeat never needs a second write immediately after an
            // already-running route/visibility synchronization.
            if (reason !== 'heartbeat') {
                const pending = pendingSyncRef.current;
                pendingSyncRef.current = {
                    sessionActive: pending?.sessionActive === false || sessionActive === false ? false : sessionActive,
                    ensureView: Boolean(pending?.ensureView || ensureView),
                    reason
                };
            }
            return false;
        }
        if (ensureView && !hasRecordedJourneyRef.current) {
            recordCurrentView({ allowPartialDetail: true });
        }

        const chunk = [...journeyToSend.current];
        journeyToSend.current = [];
        syncInFlightRef.current = true;
        lastSyncAtRef.current = Date.now();

        try {
            await httpsCallable(functions, 'syncSession')({
                sessionId: sessionIdRef.current,
                syncToken: syncTokenRef.current,
                duration: getTrackedDuration(),
                journey: chunk,
                lastEventPreview: eventPreviewRef.current,
                sessionActive,
                reason
            });
            return true;
        } catch {
            journeyToSend.current = [...chunk, ...journeyToSend.current];
            return false;
        } finally {
            syncInFlightRef.current = false;
            const pending = pendingSyncRef.current;
            pendingSyncRef.current = null;
            if (pending) {
                queueMicrotask(() => flushSessionRef.current(pending));
            } else {
                armHeartbeatRef.current();
            }
        }
    };

    const scheduleRouteSync = (reason = 'route') => {
        if (routeSyncTimerRef.current) clearTimeout(routeSyncTimerRef.current);
        routeSyncTimerRef.current = setTimeout(() => {
            flushSessionRef.current({
                sessionActive: document.visibilityState === 'visible',
                reason
            });
        }, ROUTE_SYNC_DELAY_MS);
    };

    useEffect(() => {
        let isMounted = true;

        const initSession = async () => {
            const currentView = latestViewRef.current.view;
            if (sessionIdRef.current || initCalledRef.current || !isMounted || isAdmin || !currentView || currentView === 'admin') return;
            if (!user) return;
            if (isLikelyBot()) return;

            initCalledRef.current = true;

            const userInfo = {
                userId: user.uid || 'anonymous',
                email: user.email || null,
                type: isAdmin ? 'admin' : (user && !user.isAnonymous ? 'client' : 'anonymous'),
                ...getDeviceInfo()
            };
            const storedSession = getStoredAnalyticsSession();
            if (storedSession) {
                userInfo.resumeSessionId = storedSession.sessionId;
                userInfo.resumeSyncToken = storedSession.syncToken;
            }

            try {
                const initRes = await httpsCallable(functions, 'initLiveSession')(userInfo);
                if (initRes.data.success && isMounted) {
                    sessionIdRef.current = initRes.data.sessionId;
                    syncTokenRef.current = initRes.data.syncToken || null;
                    const startedAtMs = Number(initRes.data.startedAtMs);
                    if (Number.isFinite(startedAtMs) && startedAtMs > 0) {
                        startTimeRef.current = startedAtMs;
                    }
                    accumulatedActiveMsRef.current = 0;
                    activeStartedAtRef.current = document.visibilityState === 'hidden' ? null : Date.now();
                    lastActionTimeRef.current = Date.now();
                    persistAnalyticsSession(initRes.data.sessionId, initRes.data.syncToken);
                    recordCurrentView({ allowPartialDetail: true });
                    await flushSessionRef.current({
                        sessionActive: document.visibilityState === 'visible',
                        reason: 'init'
                    });
                } else {
                    initCalledRef.current = false;
                }
            } catch (error) {
                console.error('Analytics Init Error:', error);
                initCalledRef.current = false;
            }
        };

        const timeout = setTimeout(() => {
            if (!sessionIdRef.current && !initCalledRef.current) initSession();
        }, ANALYTICS_INIT_DELAY_MS);

        return () => {
            isMounted = false;
            clearTimeout(timeout);
        };
    }, [user, isAdmin]);

    useEffect(() => {
        if (recordCurrentView({ allowPartialDetail: true })) scheduleRouteSync();
        return () => {
            if (routeSyncTimerRef.current) clearTimeout(routeSyncTimerRef.current);
        };
    }, [view, selectedItemId, selectedItemName, selectedItemPrice, selectedItemContext]);

    useEffect(() => {
        armHeartbeatRef.current();
        return () => clearHeartbeatTimer();
    }, [isAdmin]);

    useEffect(() => {
        const handleAffiliateClick = (event) => {
            if (!sessionIdRef.current || isAdmin) return;

            const { productId, productName, productPrice, source, parentFurnitureName } = event.detail;
            const actionTime = Date.now();
            const durationSinceLast = Math.round((actionTime - lastActionTimeRef.current) / 1000);

            let displayId = productId || null;
            if (productId && productName) {
                displayId = `${productId} | ${productName}${productPrice ? ` (${productPrice}EUR)` : ''}`;
            }
            if (parentFurnitureName) {
                displayId += ` [depuis: ${parentFurnitureName}]`;
            }

            journeyToSend.current.push({
                page: `affiliate_${source}`,
                itemId: displayId,
                time: new Date().toLocaleTimeString('fr-FR'),
                timestampMs: actionTime,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                duration: durationSinceLast
            });
            hasRecordedJourneyRef.current = true;
            lastActionTimeRef.current = actionTime;
            scheduleRouteSync('affiliate');
        };

        window.addEventListener('affiliate_product_click', handleAffiliateClick);
        return () => window.removeEventListener('affiliate_product_click', handleAffiliateClick);
    }, [isAdmin]);

    useEffect(() => {
        const sendSessionUpdate = (isActive = true, reason = 'manual') => {
            if (!sessionIdRef.current || isAdmin) return;
            const now = Date.now();
            if (!isActive && now - lastBeaconAtRef.current < MIN_BEACON_GAP_MS) return;
            if (!isActive) persistStorageValue(sessionStorage, ANALYTICS_SESSION_CLOSED_AT_KEY, String(now));

            if (!hasRecordedJourneyRef.current) {
                recordCurrentView({ allowPartialDetail: true });
            }

            const totalDuration = getTrackedDuration();
            const url = `https://${functionsRegion}-${functions.app.options.projectId}.cloudfunctions.net/syncSessionBeacon`;
            const chunk = [...journeyToSend.current];
            if (!isActive) journeyToSend.current = [];
            lastBeaconAtRef.current = now;

            const payload = JSON.stringify({
                sessionId: sessionIdRef.current,
                syncToken: syncTokenRef.current,
                duration: totalDuration,
                journey: chunk,
                lastEventPreview: eventPreviewRef.current,
                sessionActive: isActive,
                reason
            });
            const queued = navigator.sendBeacon(url, payload);
            if (!queued) {
                fetch(url, {
                    method: 'POST',
                    body: payload,
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                    keepalive: true
                }).catch(() => {
                    if (!isActive) journeyToSend.current = [...chunk, ...journeyToSend.current];
                });
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                pauseActiveTimer();
                clearHeartbeatTimer();
                sendSessionUpdate(false, 'visibility_hidden');
                return;
            }

            if (document.visibilityState === 'visible' && sessionIdRef.current && !isAdmin) {
                resumeActiveTimer();
                persistStorageValue(sessionStorage, ANALYTICS_SESSION_CLOSED_AT_KEY, null);
                flushSessionRef.current({
                    sessionActive: true,
                    ensureView: true,
                    reason: 'visible'
                });
            }
        };

        const handleBeforeUnload = (reason) => {
            pauseActiveTimer();
            sendSessionUpdate(false, reason);
        };

        const handleBeforeUnloadEvent = () => handleBeforeUnload('beforeunload');
        const handlePageHide = () => handleBeforeUnload('pagehide');

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnloadEvent);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnloadEvent);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [isAdmin]);

    return null;
};

export default AnalyticsProvider;
