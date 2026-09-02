'use strict';

const admin = require('firebase-admin');
const { onCall } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const connect = require('./stripeConnect');
const checkout = require('./v2Checkout');
const operations = require('./v2Operations');
const paymentLinks = require('./v2AdminPaymentLinks');
const refunds = require('./v2RefundCommands');
const reservations = require('./v2ReservationExpiry');
const { createSchedulerFence } = require('./domain/schedulerFence');
const { runObserved, structuredLog } = require('../../helpers/observability');

const REGION = 'europe-west1';
const STRIPE_SECRET = ['STRIPE_SECRET_KEY'];
const CONNECT_ADMIN_SECRETS = ['STRIPE_SECRET_KEY', 'SUPER_ADMIN_EMAIL'];
const PAYMENT_LINK_SECRETS = ['STRIPE_SECRET_KEY', 'PAYMENT_LINK_HMAC_SECRET'];
const OUTBOX_SECRETS = ['GMAIL_EMAIL', 'GMAIL_PASSWORD', 'RESEND_API_KEY'];

const callable = (functionName, legacyFunction, { secrets = [], memory = '256MiB', timeoutSeconds = 60 } = {}) => onCall({
    region: REGION,
    enforceAppCheck: true,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory,
    timeoutSeconds,
    secrets
}, (request) => runObserved(
    `${functionName}Gen2`,
    request,
    (data) => legacyFunction.run(data, request)
));

const scheduled = ({
    schedulerName,
    schedule,
    serviceAccount,
    secrets = [],
    handler
}) => onSchedule({
    region: REGION,
    schedule,
    timeZone: 'UTC',
    retryCount: 0,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '512MiB',
    timeoutSeconds: 300,
    serviceAccount,
    secrets
}, async () => {
    const startedAt = Date.now();
    try {
        const result = await createSchedulerFence({ db: admin.firestore() }).run({
            schedulerName,
            owner: 'gen2',
            leaseMs: 8 * 60 * 1000
        }, handler);
        structuredLog('info', 'scheduler_completed', {
            function: `${schedulerName}Gen2`,
            service: process.env.K_SERVICE || `${schedulerName}Gen2`,
            region: process.env.K_REGION || process.env.FUNCTION_REGION || REGION,
            revision: process.env.K_REVISION || null,
            durationMs: Date.now() - startedAt,
            outcome: 'success'
        });
        return result;
    } catch (error) {
        structuredLog('error', 'scheduler_failed', {
            function: `${schedulerName}Gen2`,
            service: process.env.K_SERVICE || `${schedulerName}Gen2`,
            region: process.env.K_REGION || process.env.FUNCTION_REGION || REGION,
            revision: process.env.K_REVISION || null,
            durationMs: Date.now() - startedAt,
            outcome: 'failed',
            errorClass: String(error?.code || error?.name || 'unknown').slice(0, 120)
        });
        throw error;
    }
});

const exported = {
    getStripeConnectStatusGen2: callable('getStripeConnectStatus', connect.getStripeConnectStatus, { secrets: STRIPE_SECRET }),
    startStripeConnectOnboardingGen2: callable('startStripeConnectOnboarding', connect.startStripeConnectOnboarding, { secrets: CONNECT_ADMIN_SECRETS }),
    syncStripeConnectAccountGen2: callable('syncStripeConnectAccount', connect.syncStripeConnectAccount, { secrets: STRIPE_SECRET }),
    requestStripeConnectReconnectGen2: callable('requestStripeConnectReconnect', connect.requestStripeConnectReconnect, { secrets: CONNECT_ADMIN_SECRETS }),
    confirmStripeConnectReconnectGen2: callable('confirmStripeConnectReconnect', connect.confirmStripeConnectReconnect, { secrets: CONNECT_ADMIN_SECRETS }),
    getCommerceOperationsStatusAdminGen2: callable('getCommerceOperationsStatusAdmin', operations.getCommerceOperationsStatusAdmin),
    rebuildCommerceOperationsAdminGen2: callable('rebuildCommerceOperationsAdmin', operations.rebuildCommerceOperationsAdmin, { memory: '512MiB', timeoutSeconds: 300 }),
    cleanupFixtureRunAdminGen2: callable('cleanupFixtureRunAdmin', operations.cleanupFixtureRunAdmin, { memory: '512MiB', timeoutSeconds: 180 }),
    createAdminPaymentLinkGen2: callable('createAdminPaymentLink', paymentLinks.createAdminPaymentLink, { secrets: PAYMENT_LINK_SECRETS }),
    listAdminPaymentLinksGen2: callable('listAdminPaymentLinks', paymentLinks.listAdminPaymentLinks, { secrets: PAYMENT_LINK_SECRETS }),
    extendAdminPaymentLinkGen2: callable('extendAdminPaymentLink', paymentLinks.extendAdminPaymentLink, { secrets: PAYMENT_LINK_SECRETS }),
    regenerateAdminPaymentLinkGen2: callable('regenerateAdminPaymentLink', paymentLinks.regenerateAdminPaymentLink, { secrets: PAYMENT_LINK_SECRETS }),
    recreateAdminPaymentLinkGen2: callable('recreateAdminPaymentLink', paymentLinks.recreateAdminPaymentLink, { secrets: PAYMENT_LINK_SECRETS }),
    cancelAdminPaymentLinkGen2: callable('cancelAdminPaymentLink', paymentLinks.cancelAdminPaymentLink, { secrets: PAYMENT_LINK_SECRETS }),
    getAdminPaymentLinkPublicGen2: callable('getAdminPaymentLinkPublic', paymentLinks.getAdminPaymentLinkPublic, { secrets: PAYMENT_LINK_SECRETS }),
    prepareAdminPaymentLinkPaymentGen2: callable('prepareAdminPaymentLinkPayment', paymentLinks.prepareAdminPaymentLinkPayment, { secrets: PAYMENT_LINK_SECRETS }),
    resumeAdminPaymentLinkPaymentGen2: callable('resumeAdminPaymentLinkPayment', paymentLinks.resumeAdminPaymentLinkPayment, { secrets: PAYMENT_LINK_SECRETS }),
    createCheckoutV2Gen2: callable('createCheckoutV2', checkout.createCheckoutV2, { secrets: STRIPE_SECRET }),
    resumeCheckoutV2Gen2: callable('resumeCheckoutV2', checkout.resumeCheckoutV2, { secrets: STRIPE_SECRET }),
    requestRefundAdminGen2: callable('requestRefundAdmin', refunds.requestRefundAdmin, { secrets: STRIPE_SECRET }),
    commerceOperationsReconcilerGen2: scheduled({
        schedulerName: 'commerceOperationsReconciler',
        schedule: '17 3 * * *',
        serviceAccount: 'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com',
        handler: operations.runOperationsRebuild
    }),
    commerceWebhookCoverageWatchdogGen2: scheduled({
        schedulerName: 'commerceWebhookCoverageWatchdog',
        schedule: 'every 15 minutes',
        serviceAccount: 'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com',
        handler: operations.runWebhookCoverageWatchdog
    }),
    commerceOutboxDispatcherGen2: scheduled({
        schedulerName: 'commerceOutboxDispatcher',
        schedule: 'every 60 minutes',
        serviceAccount: 'commerce-outbox-dispatcher@secondevienextjsssr.iam.gserviceaccount.com',
        secrets: OUTBOX_SECRETS,
        handler: operations.runOutboxDispatcher
    }),
    commerceReservationExpiryDispatcherGen2: scheduled({
        schedulerName: 'commerceReservationExpiryDispatcher',
        schedule: 'every 60 minutes',
        serviceAccount: 'commerce-reservation-expiry@secondevienextjsssr.iam.gserviceaccount.com',
        secrets: STRIPE_SECRET,
        handler: reservations.runReservationExpiryDispatcher
    }),
    expireAdminPaymentLinksGen2: scheduled({
        schedulerName: 'expireAdminPaymentLinks',
        schedule: 'every 5 minutes',
        serviceAccount: 'admin-payment-link-expiry@secondevienextjsssr.iam.gserviceaccount.com',
        secrets: PAYMENT_LINK_SECRETS,
        handler: paymentLinks.expireAdminPaymentLinksHandler
    })
};

module.exports = exported;
