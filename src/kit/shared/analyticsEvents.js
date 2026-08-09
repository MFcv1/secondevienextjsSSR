export const ANALYTICS_EVENT_NAME = 'secondevie:analytics-event';
const ANALYTICS_EVENT_RUNTIME_KEY = '__svAnalyticsEventRuntimeV1';
const MAX_BUFFERED_ANALYTICS_EVENTS = 32;

const getAnalyticsEventRuntime = () => {
    if (typeof window === 'undefined') return null;
    if (!window[ANALYTICS_EVENT_RUNTIME_KEY]) {
        window[ANALYTICS_EVENT_RUNTIME_KEY] = {
            consumers: 0,
            queue: []
        };
    }
    return window[ANALYTICS_EVENT_RUNTIME_KEY];
};

export const registerAnalyticsEventConsumer = () => {
    const runtime = getAnalyticsEventRuntime();
    if (!runtime) return () => {};
    runtime.consumers += 1;
    let active = true;
    return () => {
        if (!active) return;
        active = false;
        runtime.consumers = Math.max(0, runtime.consumers - 1);
    };
};

export const drainBufferedAnalyticsEvents = () => {
    const runtime = getAnalyticsEventRuntime();
    if (!runtime || runtime.queue.length === 0) return [];
    return runtime.queue.splice(0, runtime.queue.length);
};

export const emitAnalyticsEvent = (action, itemId = null, itemName = null, metadata = {}) => {
    if (typeof window === 'undefined' || !action) return;
    const detail = {
        action,
        itemId,
        itemName,
        time: new Date().toLocaleTimeString('fr-FR'),
        timestamp: Date.now(),
        ...metadata
    };
    const runtime = getAnalyticsEventRuntime();
    if (runtime && runtime.consumers === 0) {
        runtime.queue.push(detail);
        if (runtime.queue.length > MAX_BUFFERED_ANALYTICS_EVENTS) {
            runtime.queue.splice(0, runtime.queue.length - MAX_BUFFERED_ANALYTICS_EVENTS);
        }
    }
    window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT_NAME, { detail }));
};
