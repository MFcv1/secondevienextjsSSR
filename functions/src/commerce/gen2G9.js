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

const REGION = 'europe-west1';
const STRIPE_SECRET = ['STRIPE_SECRET_KEY'];
const CONNECT_ADMIN_SECRETS = ['STRIPE_SECRET_KEY', 'SUPER_ADMIN_EMAIL'];
const PAYMENT_LINK_SECRETS = ['STRIPE_SECRET_KEY', 'PAYMENT_LINK_HMAC_SECRET'];
const OUTBOX_SECRETS = ['GMAIL_EMAIL', 'GMAIL_PASSWORD', 'RESEND_API_KEY'];

const callable = (legacyFunction, { secrets = [], memory = '256MiB', timeoutSeconds = 60 } = {}) => onCall({
    region: REGION,
    enforceAppCheck: true,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory,
    timeoutSeconds,
    secrets
}, (request) => legacyFunction.run(request.data, request));

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
}, async () => createSchedulerFence({ db: admin.firestore() }).run({
    schedulerName,
    owner: 'gen2',
    leaseMs: 8 * 60 * 1000
}, handler));

const exported = {
    getStripeConnectStatusGen2: callable(connect.getStripeConnectStatus, { secrets: STRIPE_SECRET }),
    startStripeConnectOnboardingGen2: callable(connect.startStripeConnectOnboarding, { secrets: CONNECT_ADMIN_SECRETS }),
    syncStripeConnectAccountGen2: callable(connect.syncStripeConnectAccount, { secrets: STRIPE_SECRET }),
    requestStripeConnectReconnectGen2: callable(connect.requestStripeConnectReconnect, { secrets: CONNECT_ADMIN_SECRETS }),
    confirmStripeConnectReconnectGen2: callable(connect.confirmStripeConnectReconnect, { secrets: CONNECT_ADMIN_SECRETS }),
    getCommerceOperationsStatusAdminGen2: callable(operations.getCommerceOperationsStatusAdmin),
    rebuildCommerceOperationsAdminGen2: callable(operations.rebuildCommerceOperationsAdmin, { memory: '512MiB', timeoutSeconds: 300 }),
    cleanupFixtureRunAdminGen2: callable(operations.cleanupFixtureRunAdmin, { memory: '512MiB', timeoutSeconds: 180 }),
    createAdminPaymentLinkGen2: callable(paymentLinks.createAdminPaymentLink, { secrets: PAYMENT_LINK_SECRETS }),
    listAdminPaymentLinksGen2: callable(paymentLinks.listAdminPaymentLinks, { secrets: PAYMENT_LINK_SECRETS }),
    extendAdminPaymentLinkGen2: callable(paymentLinks.extendAdminPaymentLink, { secrets: PAYMENT_LINK_SECRETS }),
    regenerateAdminPaymentLinkGen2: callable(paymentLinks.regenerateAdminPaymentLink, { secrets: PAYMENT_LINK_SECRETS }),
    recreateAdminPaymentLinkGen2: callable(paymentLinks.recreateAdminPaymentLink, { secrets: PAYMENT_LINK_SECRETS }),
    cancelAdminPaymentLinkGen2: callable(paymentLinks.cancelAdminPaymentLink, { secrets: PAYMENT_LINK_SECRETS }),
    getAdminPaymentLinkPublicGen2: callable(paymentLinks.getAdminPaymentLinkPublic, { secrets: PAYMENT_LINK_SECRETS }),
    prepareAdminPaymentLinkPaymentGen2: callable(paymentLinks.prepareAdminPaymentLinkPayment, { secrets: PAYMENT_LINK_SECRETS }),
    resumeAdminPaymentLinkPaymentGen2: callable(paymentLinks.resumeAdminPaymentLinkPayment, { secrets: PAYMENT_LINK_SECRETS }),
    createCheckoutV2Gen2: callable(checkout.createCheckoutV2, { secrets: STRIPE_SECRET }),
    resumeCheckoutV2Gen2: callable(checkout.resumeCheckoutV2, { secrets: STRIPE_SECRET }),
    requestRefundAdminGen2: callable(refunds.requestRefundAdmin, { secrets: STRIPE_SECRET }),
    commerceOperationsReconcilerGen2: scheduled({
        schedulerName: 'commerceOperationsReconciler',
        schedule: 'every 60 minutes',
        serviceAccount: 'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com',
        handler: operations.runOperationsRebuild
    }),
    commerceOutboxDispatcherGen2: scheduled({
        schedulerName: 'commerceOutboxDispatcher',
        schedule: 'every 2 minutes',
        serviceAccount: 'commerce-outbox-dispatcher@secondevienextjsssr.iam.gserviceaccount.com',
        secrets: OUTBOX_SECRETS,
        handler: operations.runOutboxDispatcher
    }),
    commerceReservationExpiryDispatcherGen2: scheduled({
        schedulerName: 'commerceReservationExpiryDispatcher',
        schedule: 'every 2 minutes',
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
