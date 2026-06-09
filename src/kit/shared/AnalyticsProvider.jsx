import { useEffect, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ANALYTICS_EVENT_NAME, AnalyticsProvider as AnalyticsContextProvider } from '../contexts/AnalyticsContext';
import { resolvePageKey, isSessionEntryView, stepSignature } from './pageTaxonomy';

const REALTIME_FLUSH_MS = 10000;
const PRESENCE_HEARTBEAT_MS = 60000;
const PRESENCE_SAMPLE_RATE = 0.02;

const isLikelyBot = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|whatsapp|telegrambot|linkedinbot|pinterest|preview/i.test(ua);
};

// ── Device / UA parser (corrigé ordre iOS avant Mac) ────────────
const getDeviceInfo = () => {
    const ua = navigator.userAgent || '';
    let device = 'Desktop';
    if (/iPad|Tablet/i.test(ua)) device = 'Tablet';
    else if (/Mobi|Android|iPhone/i.test(ua)) device = 'Mobile';

    let browser = 'Unknown';
    if (ua.indexOf('Edg') > -1) browser = 'Edge';
    else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';
    else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('MSIE') > -1 || ua.indexOf('rv:') > -1) browser = 'IE';

    let os = 'Unknown';
    if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod|like Mac OS X/i.test(ua)) os = 'iOS';
    else if (/Win/i.test(ua)) os = 'Windows';
    else if (/Mac/i.test(ua)) os = 'MacOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    return { device, browser, os };
};

/**
 * AnalyticsProvider — Source unique de tracking visiteur.
 *
 * Règles (voir datadiag.md) :
 *   R1  Session démarre QUAND l'utilisateur entre dans la galerie / catégorie / détail / wishlist.
 *       La vitrine (view='home') est bufferisée localement mais ne crée pas de session.
 *   R2  Validité : imposée côté dashboard (filtre duration>=5 && pageViews>=1). Ici on transmet.
 *   R3  visitorKey : calculé côté Cloud Function à partir de IP + User-Agent.
 *   R4  Clôture via pagehide / visibilitychange / beforeunload + sendBeacon.
 *   R5  Admins exclus côté client.
 */
const AnalyticsProvider = ({
    view,
    activeCategoryId,
    galleryFilter,
    urlParams,
    children,
}) => {
    const { user, isAdmin } = useAuth();

    // Identifiants / horloges
    const sessionIdRef = useRef(null);
    const initCalledRef = useRef(false);        // verrou synchrone anti-doublon init
    const startTimeRef = useRef(Date.now());    // démarre au 1er mount (pas à l'init session)
    const sessionStartAtRef = useRef(null);     // horloge spécifique à la session (ms)
    const lastActionTimeRef = useRef(null);
    const pageViewsRef = useRef(0);

    // Buffers
    const pendingJourneyRef = useRef([]);       // étapes vues AVANT qu'une session soit créée
    const journeyPreviewRef = useRef([]);
    const eventPreviewRef = useRef([]);
    const journeyToSend = useRef([]);
    const eventsToSend = useRef([]);
    const realtimeFlushTimerRef = useRef(null);
    const syncSessionCallableRef = useRef(null);
    const flushInFlightRef = useRef(false);
    const lastSignatureRef = useRef(null);      // anti-doublon étapes
    const lastTrackedStepRef = useRef(null);
    const sampledPresenceRef = useRef(Math.random() < PRESENCE_SAMPLE_RATE);
    const visitorKeyRef = useRef(null);

    // Tracking event externe (favoris, panier)
    const trackEventRef = useRef(null);
    trackEventRef.current = (event) => {
        if (isAdmin) return;
        if (isLikelyBot()) return;
        const nextEvent = {
            ...event,
            previousStep: lastTrackedStepRef.current || null,
            time: event?.time || new Date().toLocaleTimeString('fr-FR'),
            timestamp: Number(event?.timestamp) || Date.now()
        };
        eventsToSend.current.push(nextEvent);
        eventPreviewRef.current = [...eventPreviewRef.current, compactEventForPreview(nextEvent)].slice(-16);
        scheduleRealtimeFlush(REALTIME_FLUSH_MS);
    };

    // ── Helpers ──────────────────────────────────────────────────
    const buildStep = (nav) => {
        const resolved = resolvePageKey(nav);
        const now = Date.now();
        const duration = lastActionTimeRef.current
            ? Math.round((now - lastActionTimeRef.current) / 1000)
            : 0;
        lastActionTimeRef.current = now;
        pageViewsRef.current += 1;

        return {
            pageKey: resolved.pageKey,
            pageLabel: resolved.pageLabel,
            pageColor: resolved.pageColor,
            section: resolved.section,
            context: resolved.context,
            // Compat rétro : conserve aussi `page` et `itemId` au format ancien (pour anciens reads).
            page: resolved.pageKey,
            itemId: resolved.context.itemId
                ? `${resolved.context.itemId}${resolved.context.itemName ? ` | ${resolved.context.itemName}` : ''}${resolved.context.itemPrice ? ` (${resolved.context.itemPrice}€)` : ''}`
                : null,
            time: new Date().toLocaleTimeString('fr-FR'),
            timestamp: now,
            duration,
        };
    };

    const compactStepForPrevious = (step) => ({
        pageKey: step?.pageKey || step?.page || 'unknown',
        page: step?.page || step?.pageKey || 'unknown',
        pageLabel: step?.pageLabel || null,
        context: step?.context || {},
        itemId: step?.itemId || null,
        timestamp: step?.timestamp || Date.now()
    });

    const attachPreviousStep = (step) => {
        const previousStep = lastTrackedStepRef.current;
        lastTrackedStepRef.current = compactStepForPrevious(step);
        return previousStep ? { ...step, previousStep } : step;
    };

    const compactEventForPreview = (event) => ({
        action: event?.action || 'unknown',
        itemId: event?.itemId || null,
        itemName: event?.itemName || null,
        previousStep: event?.previousStep || null,
        timestamp: event?.timestamp || Date.now()
    });

    const getSyncSessionCallable = () => {
        if (!syncSessionCallableRef.current) {
            syncSessionCallableRef.current = httpsCallable(functions, 'syncSession');
        }
        return syncSessionCallableRef.current;
    };

    const clearRealtimeFlush = () => {
        if (realtimeFlushTimerRef.current) {
            window.clearTimeout(realtimeFlushTimerRef.current);
            realtimeFlushTimerRef.current = null;
        }
    };

    const restoreChunks = (journeyChunk, eventChunk) => {
        journeyToSend.current = [...journeyChunk, ...journeyToSend.current];
        eventsToSend.current = [...eventChunk, ...eventsToSend.current];
    };

    const flushLiveSession = async ({ force = false, sessionActive, presenceOnly = false } = {}) => {
        if (!sessionIdRef.current || isAdmin) return;

        if (flushInFlightRef.current) {
            scheduleRealtimeFlush(REALTIME_FLUSH_MS);
            return;
        }

        const chunk = [...journeyToSend.current];
        const eventsChunk = [...eventsToSend.current];
        if (!force && chunk.length === 0 && eventsChunk.length === 0) return;

        journeyToSend.current = [];
        eventsToSend.current = [];
        flushInFlightRef.current = true;

        const totalDuration = sessionStartAtRef.current
            ? Math.round((Date.now() - sessionStartAtRef.current) / 1000)
            : 0;

        try {
            await getSyncSessionCallable()({
                sessionId: sessionIdRef.current,
                duration: totalDuration,
                pageViews: pageViewsRef.current,
                journey: chunk,
                events: eventsChunk,
                visitorKey: visitorKeyRef.current,
                lastJourneyPreview: journeyPreviewRef.current,
                lastEventPreview: eventPreviewRef.current,
                presenceSampleRate: PRESENCE_SAMPLE_RATE,
                sessionActive: sessionActive ?? document.visibilityState === 'visible',
                presenceOnly,
            });
        } catch (err) {
            restoreChunks(chunk, eventsChunk);
        } finally {
            flushInFlightRef.current = false;
        }
    };

    function scheduleRealtimeFlush(delay = REALTIME_FLUSH_MS) {
        if (typeof window === 'undefined') return;
        clearRealtimeFlush();
        realtimeFlushTimerRef.current = window.setTimeout(() => {
            realtimeFlushTimerRef.current = null;
            flushLiveSession({ force: false });
        }, delay);
    }

    const tryInitSession = async (entryNav) => {
        if (sessionIdRef.current || initCalledRef.current) return;
        if (isAdmin) return;
        if (isLikelyBot()) return;
        if (!user) return; // auth pas stable
        initCalledRef.current = true;

        const userInfo = {
            userId: user?.uid || 'anonymous',
            email: user?.email || null,
            type: isAdmin ? 'admin' : (user && !user.isAnonymous ? 'client' : 'anonymous'),
            entryPageKey: entryNav?.pageKey || 'unknown',
            ...getDeviceInfo(),
        };

        try {
            const initRes = await httpsCallable(functions, 'initLiveSession')(userInfo);
            if (initRes?.data?.success && initRes.data.sessionId) {
                sessionIdRef.current = initRes.data.sessionId;
                visitorKeyRef.current = initRes.data.visitorKey || null;
                sessionStartAtRef.current = Date.now();

                // Flush le buffer pré-session : inclure la vitrine si elle a été vue.
                const buffered = [...pendingJourneyRef.current];
                pendingJourneyRef.current = [];
                journeyToSend.current.push(...buffered);
                scheduleRealtimeFlush(REALTIME_FLUSH_MS);
            } else {
                initCalledRef.current = false; // réouvrir
            }
        } catch (err) {
            console.error('Analytics init error:', err);
            initCalledRef.current = false;
        }
    };

    // ── Record page change (buffer ou push direct) ───────────────
    useEffect(() => {
        if (isAdmin) return;
        if (isLikelyBot()) return;

        const nav = { view, activeCategoryId, galleryFilter, urlParams };

        const rawStep = buildStep(nav);

        // Anti-doublon : ne pas pousser deux fois la même signature d'affilée
        const sig = stepSignature(rawStep);
        if (sig && sig === lastSignatureRef.current) return;
        lastSignatureRef.current = sig;
        const step = attachPreviousStep(rawStep);
        journeyPreviewRef.current = [...journeyPreviewRef.current, step].slice(-16);

        if (sessionIdRef.current) {
            journeyToSend.current.push(step);
            scheduleRealtimeFlush(REALTIME_FLUSH_MS);
        } else {
            // Session pas encore démarrée : bufferiser.
            pendingJourneyRef.current.push(step);

            // R1 — si cette view est une entry view, tenter init
            if (isSessionEntryView(view) && user) {
                tryInitSession(step);
            }
        }
    }, [view, activeCategoryId, galleryFilter, user, isAdmin]);

    // ── Retry init si user/auth devient disponible APRÈS l'entrée ─
    useEffect(() => {
        if (sessionIdRef.current || isAdmin || !user) return;
        if (!isSessionEntryView(view)) return;
        tryInitSession();
    }, [user, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const handleExternalEvent = (event) => {
            if (event?.detail) trackEventRef.current?.(event.detail);
        };

        window.addEventListener(ANALYTICS_EVENT_NAME, handleExternalEvent);
        return () => window.removeEventListener(ANALYTICS_EVENT_NAME, handleExternalEvent);
    }, []);

    // ── Sampled presence heartbeat ───────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            if (!sessionIdRef.current || isAdmin) return;
            if (document.visibilityState !== 'visible') return;

            const hasPendingData = journeyToSend.current.length > 0 || eventsToSend.current.length > 0;
            if (hasPendingData) {
                flushLiveSession({ force: false, sessionActive: true });
                return;
            }

            if (sampledPresenceRef.current) {
                flushLiveSession({ force: true, sessionActive: true, presenceOnly: true });
            }
        }, PRESENCE_HEARTBEAT_MS);

        return () => clearInterval(interval);
    }, [isAdmin]);

    // ── Closure handlers (desktop + mobile) ──────────────────────
    useEffect(() => {
        const sendSessionUpdate = (isActive = true) => {
            if (!sessionIdRef.current || isAdmin) return;
            clearRealtimeFlush();
            const totalDuration = sessionStartAtRef.current
                ? Math.round((Date.now() - sessionStartAtRef.current) / 1000)
                : 0;
            const url = `https://us-central1-${functions.app.options.projectId}.cloudfunctions.net/syncSessionBeacon`;

            const chunk = [...journeyToSend.current];
            const eventsChunk = [...eventsToSend.current];
            if (!isActive) {
                journeyToSend.current = [];
                eventsToSend.current = [];
            }

            const payload = JSON.stringify({
                sessionId: sessionIdRef.current,
                duration: totalDuration,
                pageViews: pageViewsRef.current,
                journey: chunk,
                events: eventsChunk,
                visitorKey: visitorKeyRef.current,
                lastJourneyPreview: journeyPreviewRef.current,
                lastEventPreview: eventPreviewRef.current,
                presenceSampleRate: PRESENCE_SAMPLE_RATE,
                sessionActive: isActive,
                presenceOnly: chunk.length === 0 && eventsChunk.length === 0,
            });

            navigator.sendBeacon(url, payload);
        };

        const handleVisibilityChange = () => {
            if (!sessionIdRef.current) return;
            if (document.visibilityState === 'hidden') {
                sendSessionUpdate(false);
            } else if (document.visibilityState === 'visible') {
                const hasPendingData = journeyToSend.current.length > 0 || eventsToSend.current.length > 0;
                flushLiveSession({
                    force: hasPendingData || sampledPresenceRef.current,
                    sessionActive: true,
                    presenceOnly: !hasPendingData
                });
            }
        };

        const handlePageHide = () => sendSessionUpdate(false);
        const handleBeforeUnload = () => sendSessionUpdate(false);

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isAdmin]);

    useEffect(() => () => clearRealtimeFlush(), []);

    return (
        <AnalyticsContextProvider trackEventRef={trackEventRef}>
            {children}
        </AnalyticsContextProvider>
    );
};

export default AnalyticsProvider;
