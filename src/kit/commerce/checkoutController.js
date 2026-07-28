import { COMMERCE_V2_UI_ENABLED } from './commerceUiFlags.js';

export const COMMERCE_V2_CHECKOUT_ENABLED =
    COMMERCE_V2_UI_ENABLED;

export const CHECKOUT_CONTROLLER_STATES = Object.freeze([
    'idle',
    'creating',
    'awaiting_method',
    'requires_action',
    'processing',
    'succeeded',
    'canceled',
    'needs_review'
]);

const TRANSITIONS = Object.freeze({
    idle: Object.freeze({ START: 'creating', RESTORE: 'awaiting_method' }),
    creating: Object.freeze({
        CREATED: 'awaiting_method',
        FAILED_RETRYABLE: 'idle',
        AMBIGUOUS: 'needs_review'
    }),
    awaiting_method: Object.freeze({
        SUBMIT: 'processing',
        REQUIRES_ACTION: 'requires_action',
        PROCESSING: 'processing',
        SUCCEEDED: 'succeeded',
        CANCELED: 'canceled',
        AMBIGUOUS: 'needs_review'
    }),
    requires_action: Object.freeze({
        RESUME: 'processing',
        PROCESSING: 'processing',
        SUCCEEDED: 'succeeded',
        CANCELED: 'canceled',
        AMBIGUOUS: 'needs_review'
    }),
    processing: Object.freeze({
        RETRY_METHOD: 'awaiting_method',
        REQUIRES_ACTION: 'requires_action',
        SUCCEEDED: 'succeeded',
        CANCELED: 'canceled',
        AMBIGUOUS: 'needs_review'
    }),
    succeeded: Object.freeze({}),
    canceled: Object.freeze({}),
    needs_review: Object.freeze({})
});

export function createCheckoutControllerState() {
    return Object.freeze({
        status: 'idle',
        orderId: null,
        clientOrderId: null,
        errorCode: null
    });
}

export function reduceCheckoutController(
    state,
    event,
    { enabled = COMMERCE_V2_CHECKOUT_ENABLED } = {}
) {
    if (!enabled) return state;
    if (!state || !CHECKOUT_CONTROLLER_STATES.includes(state.status) || !event?.type) {
        throw new Error('COMMERCE_CHECKOUT_CONTROLLER_INPUT_INVALID');
    }
    const nextStatus = TRANSITIONS[state.status]?.[event.type];
    if (!nextStatus) throw new Error(`COMMERCE_CHECKOUT_CONTROLLER_TRANSITION_DENIED:${state.status}:${event.type}`);
    return Object.freeze({
        ...state,
        status: nextStatus,
        orderId: event.orderId ?? state.orderId,
        clientOrderId: event.clientOrderId ?? state.clientOrderId,
        errorCode: event.errorCode ?? null
    });
}
