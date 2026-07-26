/**
 * COMMERCE: Stripe webhook.
 *
 * Security:
 * - Stripe signature is mandatory.
 * - Stripe events are deduped by event.id.
 * - payment_intent.succeeded never trusts metadata alone: it validates the
 *   order id, user id, user email, amount, currency, PI id and order status.
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('node:crypto');
const { STRIPE_SECRET_KEY, STRIPE_WH_SECRET, STRIPE_CONNECT_WH_SECRET } = require('../../helpers/secrets');
const { APP_ID } = require('../../helpers/config');
const { timestampFromNow, SYSTEM_DOC_RETENTION_DAYS } = require('../analytics/constants');
const { assertLegacyOrderDocument } = require('./legacyContainment');

const db = admin.firestore();
const Stripe = require('stripe');

const EXPECTED_PAYMENT_INTENT_CURRENCY = 'eur';
const EXPECTED_PAYMENT_INTENT_ORDER_STATUS = 'pending_payment';
const REFUND_FAILURE_STATUSES = new Set(['failed', 'canceled']);
const WEBHOOK_LEASE_MS = 5 * 60 * 1000;

function toCents(value) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return null;
    return Math.round(numberValue * 100);
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function validateSucceededPaymentIntent(paymentIntent, order, orderId) {
    const errors = [];
    const expectedAmount = toCents(order.total);

    if (paymentIntent.status !== 'succeeded') {
        errors.push('payment_intent_status_not_succeeded');
    }
    if (String(paymentIntent.currency || '').toLowerCase() !== EXPECTED_PAYMENT_INTENT_CURRENCY) {
        errors.push('currency_mismatch');
    }
    if (expectedAmount === null || Number(paymentIntent.amount_received) !== expectedAmount) {
        errors.push('amount_received_mismatch');
    }
    if (paymentIntent.id !== order.stripePaymentIntentId) {
        errors.push('payment_intent_id_mismatch');
    }
    if (paymentIntent.metadata?.orderId !== orderId) {
        errors.push('metadata_order_id_mismatch');
    }
    if (paymentIntent.metadata?.userId !== order.userId) {
        errors.push('metadata_user_id_mismatch');
    }
    if (normalizeEmail(paymentIntent.metadata?.userEmail) !== normalizeEmail(order.userEmail)) {
        errors.push('metadata_user_email_mismatch');
    }
    if ((order.status || '') !== EXPECTED_PAYMENT_INTENT_ORDER_STATUS) {
        errors.push('order_status_not_pending_payment');
    }
    if (order.stockReserved !== true) {
        errors.push('stock_not_reserved');
    }

    return errors;
}

function getOrderStatusFromRefund(refund) {
    if (refund?.status === 'succeeded') return 'refunded';
    if (REFUND_FAILURE_STATUSES.has(refund?.status)) return 'refund_failed';
    return 'refund_pending';
}

function getRefundPaymentIntentId(refund) {
    return typeof refund?.payment_intent === 'string'
        ? refund.payment_intent
        : refund?.payment_intent?.id || null;
}

function validateRefundForOrder(refund, order, orderId) {
    const errors = [];
    const expectedAmount = toCents(order.total);
    const paymentIntentId = getRefundPaymentIntentId(refund);

    if (!refund?.id) errors.push('missing_refund_id');
    if (paymentIntentId !== order.stripePaymentIntentId) errors.push('payment_intent_mismatch');
    if (refund?.metadata?.orderId && refund.metadata.orderId !== orderId) errors.push('metadata_order_id_mismatch');
    if (String(refund?.currency || '').toLowerCase() !== EXPECTED_PAYMENT_INTENT_CURRENCY) errors.push('currency_mismatch');
    if (expectedAmount === null || Number(refund?.amount || 0) < expectedAmount) errors.push('partial_refund_requires_manual_review');

    return errors;
}

function validateEventConnectedAccount(order, eventAccountId) {
    const orderAccountId = order.stripeConnectedAccountId || null;
    if (orderAccountId && !eventAccountId) return 'missing_connect_event_account';
    if (eventAccountId && orderAccountId !== eventAccountId) return 'connect_account_mismatch';
    return null;
}

async function findOrderRefForRefund(refund) {
    const orderId = refund?.metadata?.orderId || null;
    if (orderId) return db.collection('orders').doc(orderId);

    const paymentIntentId = typeof refund?.payment_intent === 'string'
        ? refund.payment_intent
        : refund?.payment_intent?.id;
    if (!paymentIntentId) return null;

    const snap = await db.collection('orders')
        .where('stripePaymentIntentId', '==', paymentIntentId)
        .limit(1)
        .get();
    if (snap.empty) return null;
    return snap.docs[0].ref;
}

async function handleStripeRefundEvent(refund, eventAccountId = null) {
    const orderRef = await findOrderRefForRefund(refund);
    if (!orderRef) {
        console.warn('Stripe refund event without matching order:', refund?.id);
        return;
    }

    await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) return;

        const order = orderSnap.data();
        assertLegacyOrderDocument(null, order, 'legacy-stripe-refund-webhook');
        const orderId = orderSnap.id;
        const accountValidationError = validateEventConnectedAccount(order, eventAccountId);
        if (accountValidationError) {
            transaction.update(orderRef, {
                refundValidationError: accountValidationError,
                refundUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.warn('Stripe refund event ignored: connected account mismatch', {
                refundId: refund?.id,
                orderId,
                eventAccountId,
                orderAccountId: order.stripeConnectedAccountId || null
            });
            return;
        }
        const refundPaymentIntentId = getRefundPaymentIntentId(refund);
        if (refundPaymentIntentId !== order.stripePaymentIntentId) {
            console.warn('Stripe refund event ignored: payment intent mismatch', {
                refundId: refund?.id,
                orderId,
                refundPaymentIntentId,
                orderPaymentIntentId: order.stripePaymentIntentId
            });
            return;
        }

        let nextStatus = getOrderStatusFromRefund(refund);
        const refundValidationErrors = validateRefundForOrder(refund, order, orderId);
        let failureReason = refund.failure_reason || null;

        if (nextStatus === 'refunded' && refundValidationErrors.length > 0) {
            nextStatus = 'refund_failed';
            failureReason = failureReason || refundValidationErrors.join(',');
        }

        const stockRestoreConflicts = [];
        const stockRestored = order.stockRestoredAfterRefund === true;

        transaction.update(orderRef, {
            status: nextStatus,
            refundStatus: refund.status || null,
            stripeRefundId: refund.id || order.stripeRefundId || null,
            refundAmount: refund.amount || order.refundAmount || null,
            refundCurrency: refund.currency || order.refundCurrency || null,
            refundFailureReason: failureReason,
            refundValidationError: refundValidationErrors.length > 0 ? refundValidationErrors.join(',') : admin.firestore.FieldValue.delete(),
            refundUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            refundedAt: nextStatus === 'refunded'
                ? (order.refundedAt || admin.firestore.FieldValue.serverTimestamp())
                : admin.firestore.FieldValue.delete(),
            stockRestoredAfterRefund: stockRestored || order.stockRestoredAfterRefund === true,
            stockRestoreConflict: stockRestoreConflicts.length > 0,
            stockRestoreConflictDetails: admin.firestore.FieldValue.delete(),
            physicalDispositionRequired: nextStatus === 'refunded'
        });
    });
}

async function restoreReservedStockForUnpaidOrder(transaction, orderRef, order, nextOrderFields) {
    if (order.stockReserved !== true || order.status === 'paid' || order.paidAt) {
        transaction.update(orderRef, nextOrderFields);
        return;
    }

    const entries = (order.items || [])
        .map((item) => {
            const itemId = item.id || item.originalId;
            const col = item.collectionName || item.collection || 'furniture';
            if (!itemId) return null;
            return {
                item,
                ref: db.doc(`artifacts/${APP_ID}/public/data/${col}/${itemId}`)
            };
        })
        .filter(Boolean);

    const snaps = [];
    for (const entry of entries) {
        snaps.push({ ...entry, snap: await transaction.get(entry.ref) });
    }

    const conflicts = [];
    const writes = [];
    for (const { item, ref, snap } of snaps) {
        const itemId = item.id || item.originalId || null;
        if (!snap.exists) {
            conflicts.push({ itemId, reason: 'missing_product' });
            continue;
        }

        const current = snap.data();
        const quantity = Number(item.quantity) || 1;
        const currentStock = Number(current.stock ?? 0);
        const currentBuyerId = current.buyerId || null;

        if (currentBuyerId && currentBuyerId !== order.userId) {
            conflicts.push({ itemId, reason: 'reserved_by_other_buyer' });
            continue;
        }

        const stockBefore = Number(item.stockBefore);
        const targetStock = Number.isFinite(stockBefore) && stockBefore >= quantity
            ? Math.max(currentStock, stockBefore)
            : currentStock + quantity;
        const alreadyAvailable = !currentBuyerId && current.sold !== true && currentStock >= quantity;

        if (alreadyAvailable && !Number.isFinite(stockBefore)) {
            writes.push({ ref, stock: null });
            continue;
        }

        writes.push({ ref, stock: targetStock });
    }

    for (const write of writes) {
        const updates = {
            sold: false,
            soldAt: admin.firestore.FieldValue.delete(),
            buyerId: admin.firestore.FieldValue.delete()
        };
        if (write.stock !== null) updates.stock = write.stock;
        transaction.update(write.ref, updates);
    }

    transaction.update(orderRef, {
        ...nextOrderFields,
        stockReserved: false,
        stockRestoredAt: conflicts.length === 0 ? admin.firestore.FieldValue.serverTimestamp() : admin.firestore.FieldValue.delete(),
        stockRestoreConflict: conflicts.length > 0,
        stockRestoreConflictDetails: conflicts.length > 0 ? conflicts : admin.firestore.FieldValue.delete()
    });
}

async function handlePaymentIntentSucceeded(paymentIntent, idempRef, eventAccountId = null) {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
        console.warn('PaymentIntent succeeded without metadata.orderId:', paymentIntent.id);
        await idempRef.set({
            status: 'ignored',
            ignoredAt: admin.firestore.FieldValue.serverTimestamp(),
            ignoreReason: 'missing_order_id',
            requiresReview: true,
            incidentCode: 'paid_payment_intent_missing_order_id',
            incidentPaymentIntentId: paymentIntent.id
        }, { merge: true });
        return;
    }

    const orderRef = db.collection('orders').doc(orderId);
    const result = await db.runTransaction(async (transaction) => {
        const freshOrderSnap = await transaction.get(orderRef);
        if (!freshOrderSnap.exists) {
            transaction.update(idempRef, {
                requiresReview: true,
                incidentCode: 'paid_payment_intent_missing_order',
                incidentOrderId: orderId,
                incidentPaymentIntentId: paymentIntent.id,
                incidentAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { ok: true, skipped: true, reason: 'missing_order' };
        }

        const freshOrder = freshOrderSnap.data();
        assertLegacyOrderDocument(null, freshOrder, 'legacy-stripe-payment-webhook');
        const accountValidationError = validateEventConnectedAccount(freshOrder, eventAccountId);
        if (accountValidationError) {
            transaction.update(orderRef, {
                paymentValidationError: accountValidationError,
                paymentValidationFailedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { ok: false, reason: accountValidationError };
        }
        if (freshOrder.status === 'paid') {
            if (freshOrder.stripePaymentIntentId !== paymentIntent.id) {
                return { ok: false, reason: 'paid_order_payment_intent_mismatch' };
            }
            return { ok: true, skipped: true, reason: 'already_paid' };
        }

        const validationErrors = validateSucceededPaymentIntent(paymentIntent, freshOrder, orderId);
        if (validationErrors.length > 0) {
            transaction.update(orderRef, {
                paymentValidationError: validationErrors.join(','),
                paymentValidationFailedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { ok: false, reason: validationErrors.join(',') };
        }

        transaction.update(orderRef, {
            status: 'paid',
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            stripePaymentIntentId: paymentIntent.id,
            paymentMethod: 'stripe'
        });
        return { ok: true, confirmed: true };
    });

    if (!result.ok) {
        throw new Error(`PaymentIntent validation failed: ${result.reason}`);
    }
    console.log('Stripe PaymentIntent confirmed order:', orderId, result);
}

async function handleCheckoutSessionExpired(session) {
    console.log('Webhook: Checkout session expired:', session.id);
    const orderId = session.metadata?.orderId || null;
    if (!orderId) return;

    const orderRef = db.collection('orders').doc(orderId);
    await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) return;
        const order = orderSnap.data() || {};
        assertLegacyOrderDocument(null, order, 'legacy-checkout-session-webhook');
        if (order.status === 'paid' || order.paidAt) return;
        if (order.stripeSessionId && order.stripeSessionId !== session.id) return;

        await restoreReservedStockForUnpaidOrder(transaction, orderRef, order, {
            status: 'canceled',
            canceledAt: admin.firestore.FieldValue.serverTimestamp(),
            cancelReason: 'checkout_session_expired'
        });
    });
}

async function handlePaymentIntentTerminal(pi, nextOrderFields, eventAccountId = null) {
    const orderId = pi.metadata?.orderId;
    if (!orderId) return;

    const orderRef = db.collection('orders').doc(orderId);
    await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) return;

        const order = orderSnap.data();
        assertLegacyOrderDocument(null, order, 'legacy-stripe-terminal-webhook');
        const accountValidationError = validateEventConnectedAccount(order, eventAccountId);
        if (accountValidationError) {
            transaction.update(orderRef, {
                paymentValidationError: accountValidationError,
                paymentValidationFailedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return;
        }
        if (order.status === 'paid' || order.paidAt) return;
        if (order.stripePaymentIntentId && order.stripePaymentIntentId !== pi.id) {
            transaction.update(orderRef, {
                paymentValidationError: 'terminal_event_payment_intent_id_mismatch',
                paymentValidationFailedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return;
        }

        await restoreReservedStockForUnpaidOrder(transaction, orderRef, order, nextOrderFields);
    });
}

async function processStripeEvent(_stripe, event, res) {
    const eventAccountId = event.account || null;
    const safeAccountKey = eventAccountId ? String(eventAccountId).replace(/[^A-Za-z0-9_]/g, '_') : 'platform';
    const idempRef = db.doc(`sys_idempotency/stripe_${safeAccountKey}_${event.id}`);
    const leaseToken = crypto.randomUUID();
    const markWebhookFailed = async (reason) => {
        try {
            await db.runTransaction(async (tx) => {
                const marker = await tx.get(idempRef);
                if (!marker.exists || marker.data()?.leaseToken !== leaseToken) {
                    console.warn('Webhook failure marker ignored after lease loss:', event.id);
                    return;
                }
                tx.update(idempRef, {
                    status: 'failed',
                    failedAt: admin.firestore.FieldValue.serverTimestamp(),
                    failureReason: String(reason?.message || reason || 'unknown').slice(0, 500),
                    processingUntil: admin.firestore.FieldValue.delete()
                });
            });
        } catch (error) {
            console.error('Idempotence failure marker error:', error);
        }
    };

    try {
        const shouldProcess = await db.runTransaction(async (tx) => {
            const snap = await tx.get(idempRef);
            if (snap.exists) {
                const marker = snap.data() || {};
                const status = marker.status;
                const processingUntilMillis = marker.processingUntil?.toMillis
                    ? marker.processingUntil.toMillis()
                    : 0;
                if (status === 'failed' || (status === 'processing' && processingUntilMillis <= Date.now())) {
                    tx.update(idempRef, {
                        status: 'processing',
                        leaseToken,
                        processingUntil: admin.firestore.Timestamp.fromMillis(Date.now() + WEBHOOK_LEASE_MS),
                        retryAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    return true;
                }
                return false;
            }

            tx.create(idempRef, {
                type: event.type,
                stripeAccount: eventAccountId,
                status: 'processing',
                leaseToken,
                processingUntil: admin.firestore.Timestamp.fromMillis(Date.now() + WEBHOOK_LEASE_MS),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
            });
            return true;
        });

        if (!shouldProcess) {
            console.log('Stripe webhook already processed:', event.id, eventAccountId || 'platform');
            return res.json({ received: true, deduped: true });
        }
    } catch (e) {
        console.error('Idempotence check error:', e);
        return res.status(500).send('Webhook idempotence check error');
    }

    try {
        if (event.type === 'account.updated') {
            const account = event.data.object;
            await db.doc('sys_metadata/stripe_connect').set({
                lastWebhookAt: admin.firestore.FieldValue.serverTimestamp(),
                lastWebhookAccountId: account.id || eventAccountId || null,
                webhookChargesEnabled: account.charges_enabled === true,
                webhookPayoutsEnabled: account.payouts_enabled === true,
                webhookDetailsSubmitted: account.details_submitted === true
            }, { merge: true });
        }

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            console.log('Webhook: PaymentIntent succeeded:', paymentIntent.id);
            await handlePaymentIntentSucceeded(paymentIntent, idempRef, eventAccountId);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log('Webhook: Checkout session completed:', session.id);
            await idempRef.set({
                requiresReview: true,
                incidentCode: 'legacy_checkout_session_completed',
                incidentCheckoutSessionId: session.id,
                incidentPaymentIntentId: session.payment_intent || null,
                incidentAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        if (event.type === 'checkout.session.expired') {
            const session = event.data.object;
            await handleCheckoutSessionExpired(session);
        }

        if (event.type === 'payment_intent.payment_failed') {
            const pi = event.data.object;
            console.error(`Payment failed for PI ${pi.id}, Order: ${pi.metadata?.orderId || 'N/A'}, Reason: ${pi.last_payment_error?.message || 'unknown'}`);
            await handlePaymentIntentRetryableFailure(pi, eventAccountId);
        }

        if (event.type === 'payment_intent.canceled') {
            const pi = event.data.object;
            console.warn(`PaymentIntent canceled for PI ${pi.id}, Order: ${pi.metadata?.orderId || 'N/A'}`);
            await handlePaymentIntentTerminal(pi, {
                status: 'canceled',
                canceledAt: admin.firestore.FieldValue.serverTimestamp()
            }, eventAccountId);
        }

        if (event.type === 'refund.created' || event.type === 'refund.updated' || event.type === 'refund.failed') {
            const refund = event.data.object;
            console.log('Webhook: Refund event:', event.type, refund.id, refund.status);
            await handleStripeRefundEvent(refund, eventAccountId);
        }

        if (event.type === 'charge.refunded') {
            const charge = event.data.object;
            const refunds = Array.isArray(charge.refunds?.data) ? charge.refunds.data : [];
            const latestRefund = refunds.sort((a, b) => Number(b.created || 0) - Number(a.created || 0))[0];
            if (latestRefund) {
                console.log('Webhook: Charge refunded:', charge.id, latestRefund.id, latestRefund.status);
                await handleStripeRefundEvent({
                    ...latestRefund,
                    payment_intent: latestRefund.payment_intent || charge.payment_intent
                }, eventAccountId);
            }
        }

        await db.runTransaction(async (tx) => {
            const marker = await tx.get(idempRef);
            if (!marker.exists || marker.data()?.leaseToken !== leaseToken) {
                throw new Error('Webhook lease lost before commit');
            }
            tx.update(idempRef, {
                status: 'processed',
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                processingUntil: admin.firestore.FieldValue.delete()
            });
        });

        return res.json({ received: true });
    } catch (error) {
        console.error(`Stripe webhook handler error (${event.type}):`, error);
        await markWebhookFailed(error);
        return res.status(500).send('Webhook handler error');
    }
}

async function handlePaymentIntentRetryableFailure(pi, eventAccountId = null) {
    const orderId = pi.metadata?.orderId;
    if (!orderId) return;
    const orderRef = db.collection('orders').doc(orderId);
    await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) return;
        const order = orderSnap.data();
        assertLegacyOrderDocument(null, order, 'legacy-stripe-retryable-webhook');
        if (order.status === 'paid' || order.paidAt) return;
        if (validateEventConnectedAccount(order, eventAccountId)) return;
        if (order.stripePaymentIntentId && order.stripePaymentIntentId !== pi.id) return;
        transaction.update(orderRef, {
            status: 'pending_payment',
            stockReserved: true,
            paymentAttemptStatus: 'requires_payment_method',
            paymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
            paymentFailureReason: pi.last_payment_error?.message || 'Payment method refused'
        });
    });
}

function constructStripeEvent(req, res, stripe, endpointSecret, secretName) {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return null;
    }

    const sig = req.headers['stripe-signature'];

    if (!endpointSecret) {
        console.error(`${secretName} not configured. Rejecting webhook.`);
        res.status(500).send('Webhook secret not configured');
        return null;
    }

    try {
        const rawBody = req.rawBody;
        if (!rawBody) {
            console.error('Missing raw request body. Blocking webhook signature verification.');
            res.status(400).send('Missing raw body');
            return null;
        }
        if (!sig) {
            console.error('Missing Stripe signature. Blocking unsigned webhook.');
            res.status(400).send('Missing signature');
            return null;
        }
        return stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook Security Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return null;
    }
}

exports.stripeWebhook = functions.runWith({ secrets: [STRIPE_SECRET_KEY, STRIPE_WH_SECRET] }).https.onRequest(async (req, res) => {
    const stripe = Stripe(STRIPE_SECRET_KEY.value());
    const event = constructStripeEvent(req, res, stripe, STRIPE_WH_SECRET.value(), 'STRIPE_WH_SECRET');
    if (!event) return null;
    return processStripeEvent(stripe, event, res);
});

exports.stripeConnectWebhook = functions.runWith({ secrets: [STRIPE_SECRET_KEY, STRIPE_CONNECT_WH_SECRET] }).https.onRequest(async (req, res) => {
    const stripe = Stripe(STRIPE_SECRET_KEY.value());
    const event = constructStripeEvent(req, res, stripe, STRIPE_CONNECT_WH_SECRET.value(), 'STRIPE_CONNECT_WH_SECRET');
    if (!event) return null;
    return processStripeEvent(stripe, event, res);
});
