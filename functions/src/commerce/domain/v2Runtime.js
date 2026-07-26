'use strict';

const crypto = require('node:crypto');
const { createBoundedWorkerSweeper } = require('./boundedWorkerSweeper');
const {
    createCancellationAuditRepository
} = require('./cancellationAuditRepository');
const { createCancellationCoordinator } = require('./cancellationCoordinator');
const {
    createCheckoutAccessTokenRepository
} = require('./checkoutAccessTokenRepository');
const { createCheckoutCoordinator } = require('./checkoutCoordinator');
const { createCheckoutRepository } = require('./checkoutRepository');
const { createCheckoutSagaRepository } = require('./checkoutSagaRepository');
const { createCheckoutSagaService } = require('./checkoutSagaService');
const { createFirestoreWorkerQueries } = require('./firestoreWorkerQueries');
const { createGuestCheckoutCoordinator } = require('./guestCheckoutCoordinator');
const { createOutboxRepository } = require('./outboxRepository');
const { createOutboxWorker } = require('./outboxWorker');
const { createOrderCommandRepository } = require('./orderCommandRepository');
const { createPaymentEffectApplier } = require('./paymentEffectApplier');
const { createProductCommandRepository } = require('./productCommandRepository');
const { createRefundCoordinator } = require('./refundCoordinator');
const { createRefundRepository } = require('./refundRepository');
const { createRefundSagaService } = require('./refundSagaService');
const { createReservationExpiryWorker } = require('./reservationExpiryWorker');
const { createReturnRepository } = require('./returnRepository');
const { createStripeWebhookIngress } = require('./stripeWebhookIngress');
const { createWebhookInboxRepository } = require('./webhookInboxRepository');
const { createWebhookWorker } = require('./webhookWorker');

function runtimeError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function createClock() {
    return Object.freeze({
        now: () => new Date().toISOString(),
        nowMillis: () => Date.now()
    });
}

function connectedAccountOptions(accountId) {
    return accountId ? { stripeAccount: accountId } : {};
}

function createStripeAdapter(stripe) {
    return Object.freeze({
        async createPaymentIntent(params, options) {
            const paymentIntent = await stripe.paymentIntents.create(params, {
                idempotencyKey: options.idempotencyKey,
                ...connectedAccountOptions(options.connectedAccountId)
            });
            return {
                ...paymentIntent,
                connectedAccountId: options.connectedAccountId || null
            };
        },
        async retrievePaymentIntent(paymentIntentId, accountId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(
                paymentIntentId,
                {},
                connectedAccountOptions(accountId)
            );
            return {
                ...paymentIntent,
                connectedAccountId: accountId || null
            };
        },
        async cancelPaymentIntent(paymentIntentId, accountId) {
            const paymentIntent = await stripe.paymentIntents.cancel(
                paymentIntentId,
                {},
                connectedAccountOptions(accountId)
            );
            return {
                ...paymentIntent,
                connectedAccountId: accountId || null
            };
        },
        async createRefund(params, options) {
            const refund = await stripe.refunds.create(params, {
                idempotencyKey: options.idempotencyKey,
                ...connectedAccountOptions(options.connectedAccountId)
            });
            return {
                ...refund,
                connectedAccountId: options.connectedAccountId || null
            };
        },
        async retrieveRefund(refundId, accountId) {
            const refund = await stripe.refunds.retrieve(
                refundId,
                {},
                connectedAccountOptions(accountId)
            );
            return {
                ...refund,
                connectedAccountId: accountId || null
            };
        }
    });
}

function createRefs(db, appId) {
    const document = (path) => db.doc(path);
    return Object.freeze({
        control: () => document('sys_commerce_control/current'),
        policy: (version) => document(`commerce_policy_versions/${version}`),
        connectAccount: (accountId) => document(`commerce_connect_accounts/${accountId}`),
        checkoutIdentity: (identityId) => document(
            `commerce_checkout_identities/${identityId}`
        ),
        order: (orderId) => document(`orders/${orderId}`),
        attempt: (orderId, attemptId) => document(
            `orders/${orderId}/payment_attempts/${attemptId}`
        ),
        refundAttempt: (orderId, refundRequestId) => document(
            `orders/${orderId}/refunds/${refundRequestId}`
        ),
        returnCase: (orderId, returnId) => document(
            `orders/${orderId}/returns/${returnId}`
        ),
        auditEvent: (orderId, eventId) => document(
            `orders/${orderId}/events/${eventId}`
        ),
        commandResult: (commandId) => document(`commerce_command_results/${commandId}`),
        productAuditEvent: (collectionName, productId, eventId) => document(
            `commerce_product_audits/${collectionName}_${productId}/events/${eventId}`
        ),
        returnAllocation: (orderId, lineId) => document(
            `commerce_return_allocations/${orderId}_${lineId}`
        ),
        product: (group) => document(
            `artifacts/${appId}/public/data/${group.collectionName}/${group.productId}`
        ),
        reservation: (orderId, inventoryKey) => document(
            `inventory_reservations/${orderId}_${inventoryKey}`
        ),
        movement: (effectId) => document(`inventory_movements/${effectId}`),
        inbox: (inboxId) => document(`commerce_webhook_inbox/${inboxId}`),
        outbox: (outboxId) => document(`commerce_outbox/${outboxId}`),
        incident: (incidentId) => document(`commerce_incidents/${incidentId}`),
        financialFact: (factId) => document(`commerce_financial_facts/${factId}`),
        accessToken: (tokenHash) => document(`commerce_order_access_tokens/${tokenHash}`)
    });
}

function createCommerceV2Runtime({
    db,
    stripe,
    appId,
    platformWebhookSecret,
    connectWebhookSecret,
    sendOutbox,
    clock = createClock(),
    failpoints = null
}) {
    if (
        typeof db?.doc !== 'function' ||
        typeof db?.runTransaction !== 'function' ||
        !stripe?.paymentIntents ||
        !stripe?.refunds ||
        typeof stripe?.webhooks?.constructEvent !== 'function' ||
        typeof appId !== 'string' ||
        !appId ||
        typeof platformWebhookSecret !== 'string' ||
        typeof connectWebhookSecret !== 'string' ||
        typeof sendOutbox !== 'function'
    ) {
        throw runtimeError('COMMERCE_V2_RUNTIME_DEPENDENCY_INVALID');
    }
    const refs = createRefs(db, appId);
    const database = {
        runTransaction: (run) => db.runTransaction(run)
    };
    const ids = {
        orderId: () => `ord_${crypto.randomUUID()}`,
        attemptId: () => `att_${crypto.randomUUID()}`,
        commandId: () => `cmd_${crypto.randomUUID()}`,
        leaseToken: () => crypto.randomUUID(),
        rawToken: () => crypto.randomBytes(32).toString('base64url')
    };
    const checkoutRepository = createCheckoutRepository({
        db: database,
        refs,
        ids,
        clock
    });
    const paymentEffectApplier = createPaymentEffectApplier({ refs, clock });
    const sagaRepository = createCheckoutSagaRepository({
        db: database,
        checkoutRepository,
        paymentEffectApplier
    });
    const stripeAdapter = createStripeAdapter(stripe);
    const sagaService = createCheckoutSagaService({
        stripe: stripeAdapter,
        repository: sagaRepository,
        clock,
        failpoints
    });
    const checkoutCoordinator = createCheckoutCoordinator({
        checkoutRepository,
        sagaService
    });
    const accessTokenRepository = createCheckoutAccessTokenRepository({
        db: database,
        refs,
        ids,
        clock
    });
    const guestCheckoutCoordinator = createGuestCheckoutCoordinator({
        accessTokenRepository,
        checkoutCoordinator
    });
    const inboxRepository = createWebhookInboxRepository({
        db: database,
        refs,
        failpoints
    });
    const webhookIngress = createStripeWebhookIngress({
        verifyPlatformEvent: (rawBody, signature) => stripe.webhooks.constructEvent(
            rawBody,
            signature,
            platformWebhookSecret
        ),
        verifyConnectEvent: (rawBody, signature) => stripe.webhooks.constructEvent(
            rawBody,
            signature,
            connectWebhookSecret
        ),
        inboxRepository,
        clock
    });
    const webhookWorker = createWebhookWorker({
        inboxRepository,
        retrievePaymentIntent: stripeAdapter.retrievePaymentIntent,
        applyPaymentIntent: (transaction, input) => paymentEffectApplier.apply(
            transaction,
            input
        ),
        ids,
        clock,
        failpoints
    });
    const outboxRepository = createOutboxRepository({ db: database, refs });
    const outboxWorker = createOutboxWorker({
        repository: outboxRepository,
        send: sendOutbox,
        ids,
        clock
    });
    const expiryWorker = createReservationExpiryWorker({
        checkoutRepository,
        sagaService,
        clock
    });
    const queries = createFirestoreWorkerQueries({ db });
    const orderCommands = createOrderCommandRepository({
        db: database,
        refs,
        clock,
        failpoints
    });
    const productCommands = createProductCommandRepository({
        db: database,
        refs,
        clock,
        failpoints
    });
    const refundRepository = createRefundRepository({
        db: database,
        refs,
        clock
    });
    const refunds = createRefundCoordinator({
        repository: refundRepository,
        sagaService: createRefundSagaService({
            stripe: stripeAdapter,
            repository: refundRepository,
            clock,
            failpoints
        })
    });
    const returns = createReturnRepository({
        db: database,
        refs,
        clock
    });
    const cancellationAuditRepository = createCancellationAuditRepository({
        db: database,
        refs,
        clock
    });
    const cancellations = createCancellationCoordinator({
        checkoutRepository,
        sagaService,
        auditRepository: cancellationAuditRepository
    });

    return Object.freeze({
        checkout: checkoutCoordinator,
        guestCheckout: guestCheckoutCoordinator,
        webhookIngress,
        webhookWorker,
        outboxWorker,
        expiryWorker,
        orderCommands,
        productCommands,
        cancellations,
        refunds,
        returns,
        queries,
        sweepers: Object.freeze({
            dueInbox: createBoundedWorkerSweeper({
                listEligible: queries.listDueInbox,
                processItem: (item) => webhookWorker.process(item.id),
                clock
            }),
            expiredInboxLeases: createBoundedWorkerSweeper({
                listEligible: queries.listExpiredInboxLeases,
                processItem: (item) => webhookWorker.process(item.id),
                clock
            }),
            dueOutbox: createBoundedWorkerSweeper({
                listEligible: queries.listDueOutbox,
                processItem: (item) => outboxWorker.process(item.id),
                clock
            }),
            expiredReservations: createBoundedWorkerSweeper({
                listEligible: queries.listExpiredReservations,
                processItem: expiryWorker.process,
                clock
            })
        })
    });
}

module.exports = {
    createCommerceV2Runtime,
    createStripeAdapter
};
