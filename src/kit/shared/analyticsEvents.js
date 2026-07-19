export const ANALYTICS_EVENT_NAME = 'secondevie:analytics-event';

export const emitAnalyticsEvent = (action, itemId = null, itemName = null, metadata = {}) => {
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
