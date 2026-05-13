import React, { createContext, useContext, useRef, useCallback } from 'react';

const AnalyticsContext = createContext(null);
export const ANALYTICS_EVENT_NAME = 'secondevie:analytics-event';

export const emitAnalyticsEvent = (action, itemId, itemName, metadata = {}) => {
    if (typeof window === 'undefined' || !action) return;
    window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT_NAME, {
        detail: {
            action,
            itemId,
            itemName,
            time: new Date().toLocaleTimeString('fr-FR'),
            timestamp: Date.now(),
            ...metadata
        }
    }));
};

export const AnalyticsProvider = ({ children, trackEventRef }) => {
    // trackEventRef est fourni par le parent (AnalyticsProvider.jsx original)
    const trackEvent = useCallback((action, itemId, itemName, metadata = {}) => {
        if (trackEventRef && trackEventRef.current) {
            trackEventRef.current({
                action,      // 'favorite_add', 'favorite_remove', 'cart_add', 'cart_remove'
                itemId,
                itemName,
                time: new Date().toLocaleTimeString('fr-FR'),
                ...metadata
            });
        }
    }, [trackEventRef]);

    return (
        <AnalyticsContext.Provider value={{ trackEvent }}>
            {children}
        </AnalyticsContext.Provider>
    );
};

export const useAnalytics = () => {
    const ctx = useContext(AnalyticsContext);
    if (!ctx) {
        // Fallback: retourne une fonction vide si pas de provider
        return { trackEvent: () => {} };
    }
    return ctx;
};

export default AnalyticsContext;
