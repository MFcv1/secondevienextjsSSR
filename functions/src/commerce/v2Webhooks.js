'use strict';

const admin = require('firebase-admin');
const { APP_ID } = require('../../helpers/config');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    STRIPE_CONNECT_WH_SECRET,
    STRIPE_CONNECT_WH_SECRET_G10,
    STRIPE_SECRET_KEY,
    STRIPE_WH_SECRET,
    STRIPE_WH_SECRET_G10
} = require('../../helpers/secrets');
const { createCommerceV2Runtime } = require('./domain/v2Runtime');

function runtime() {
    const Stripe = require('stripe');
    return createCommerceV2Runtime({
        db: admin.firestore(),
        stripe: Stripe(STRIPE_SECRET_KEY.value()),
        appId: APP_ID,
        platformWebhookSecret: [
            STRIPE_WH_SECRET.value(),
            STRIPE_WH_SECRET_G10.value()
        ],
        connectWebhookSecret: [
            STRIPE_CONNECT_WH_SECRET.value(),
            STRIPE_CONNECT_WH_SECRET_G10.value()
        ],
        sendOutbox: async () => {
            throw new Error('COMMERCE_OUTBOX_SEND_NOT_AVAILABLE_FROM_WEBHOOK');
        }
    });
}

function createWebhookHandler(scope, runtimeFactory = runtime) {
    return async (request, response) => {
        const signature = request.headers['stripe-signature'];
        if (request.method !== 'POST' || typeof signature !== 'string') {
            response.status(400).json({ received: false });
            return;
        }
        try {
            const rawBody = request.rawBody || Buffer.from(
                typeof request.body === 'string'
                    ? request.body
                    : JSON.stringify(request.body || {})
            );
            let accountId = null;
            if (scope === 'connect') {
                const parsed = JSON.parse(rawBody.toString('utf8'));
                accountId = parsed?.account || null;
            }
            const commerce = runtimeFactory();
            const entry = await commerce.webhookIngress.ingest({
                scope,
                rawBody,
                signature,
                accountId
            });
            if (!entry.ignored && entry.status !== 'processed') {
                await commerce.webhookWorker.process(entry.inboxId);
            }
            response.status(200).json({
                received: true,
                ignored: entry.ignored === true,
                eventId: entry.eventId || null
            });
        } catch (error) {
            const code = String(error?.code || '');
            const signatureFailure = code.includes('SIGNATURE') ||
                code.includes('SCOPE_MISMATCH') ||
                code.includes('REQUEST_INVALID');
            console.error('commerce_v2_webhook_failed', {
                scope,
                code: code || 'COMMERCE_V2_WEBHOOK_UNKNOWN'
            });
            response.status(signatureFailure ? 400 : 500).json({
                received: false,
                code: code || 'COMMERCE_V2_WEBHOOK_FAILED'
            });
        }
    };
}

const webhookRuntime = regionalFunctions().runWith({
    secrets: [
        STRIPE_SECRET_KEY,
        STRIPE_WH_SECRET,
        STRIPE_CONNECT_WH_SECRET,
        STRIPE_WH_SECRET_G10,
        STRIPE_CONNECT_WH_SECRET_G10
    ]
});

const stripeWebhookV2 = webhookRuntime.https.onRequest(
    createWebhookHandler('platform')
);
const stripeConnectWebhookV2 = webhookRuntime.https.onRequest(
    createWebhookHandler('connect')
);

module.exports = {
    createWebhookHandler,
    stripeConnectWebhookV2,
    stripeWebhookV2
};
