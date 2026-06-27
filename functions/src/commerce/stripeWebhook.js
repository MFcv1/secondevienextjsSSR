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
const { STRIPE_SECRET_KEY, STRIPE_WH_SECRET } = require('../../helpers/secrets');
const { APP_ID } = require('../../helpers/config');
const { timestampFromNow, SYSTEM_DOC_RETENTION_DAYS } = require('../analytics/constants');

const db = admin.firestore();
const Stripe = require('stripe');

const EXPECTED_PAYMENT_INTENT_CURRENCY = 'eur';
const EXPECTED_PAYMENT_INTENT_ORDER_STATUS = 'pending_payment';
const REFUND_FAILURE_STATUSES = new Set(['failed', 'canceled']);

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

async function restoreStockAfterPaidRefund(transaction, order, orderId) {
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
    for (const { item, ref, snap } of snaps) {
        const itemId = item.id || item.originalId || null;
        if (!snap.exists) {
            conflicts.push({ itemId, reason: 'missing_product' });
            continue;
        }
        const currentBuyerId = snap.data()?.buyerId || null;
        if (currentBuyerId && currentBuyerId !== order.userId) {
            conflicts.push({ itemId, reason: 'reserved_by_other_buyer' });
            continue;
        }
        const quantity = Number(item.quantity) || 1;
        const currentStock = Number(snap.data()?.stock ?? 0);
        const stockBefore = Number(item.stockBefore);
        const targetStock = Number.isFinite(stockBefore) && stockBefore >= quantity
            ? Math.max(currentStock, stockBefore)
            : currentStock + quantity;
        const alreadyAvailable = !currentBuyerId && snap.data()?.sold !== true && currentStock >= quantity;
        if (!Number.isFinite(stockBefore) && alreadyAvailable) {
            transaction.update(ref, {
                sold: false,
                refundedFromOrderId: orderId,
                refundedAt: admin.firestore.FieldValue.serverTimestamp(),
                soldAt: admin.firestore.FieldValue.delete(),
                buyerId: admin.firestore.FieldValue.delete()
            });
            continue;
        }
        transaction.update(ref, {
            stock: targetStock,
            sold: false,
            refundedFromOrderId: orderId,
            refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            soldAt: admin.firestore.FieldValue.delete(),
            buyerId: admin.firestore.FieldValue.delete()
        });
    }

    return conflicts;
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

async function handleStripeRefundEvent(refund) {
    const orderRef = await findOrderRefForRefund(refund);
    if (!orderRef) {
        console.warn('Stripe refund event without matching order:', refund?.id);
        return;
    }

    await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) return;

        const order = orderSnap.data();
        const orderId = orderSnap.id;
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

        let stockRestoreConflicts = [];
        if (nextStatus === 'refunded' && order.stockRestoredAfterRefund !== true) {
            stockRestoreConflicts = await restoreStockAfterPaidRefund(transaction, order, orderId);
        }
        const stockRestored = nextStatus === 'refunded' && stockRestoreConflicts.length === 0;

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
            stockRestoreConflictDetails: stockRestoreConflicts.length > 0 ? stockRestoreConflicts : admin.firestore.FieldValue.delete()
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

async function handlePaymentIntentSucceeded(paymentIntent, idempRef) {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
        console.warn('PaymentIntent succeeded without metadata.orderId:', paymentIntent.id);
        await idempRef.set({
            status: 'ignored',
            ignoredAt: admin.firestore.FieldValue.serverTimestamp(),
            ignoreReason: 'missing_order_id'
        }, { merge: true });
        return;
    }

    const orderRef = db.collection('orders').doc(orderId);
    const result = await db.runTransaction(async (transaction) => {
        const freshOrderSnap = await transaction.get(orderRef);
        if (!freshOrderSnap.exists) {
            return { ok: true, skipped: true, reason: 'missing_order' };
        }

        const freshOrder = freshOrderSnap.data();
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

async function handleCheckoutSessionCompleted(stripe, session) {
    const userId = session.metadata?.userId || null;
    const shippingMeta = session.metadata?.shippingMeta ? JSON.parse(session.metadata.shippingMeta) : {};
    const total = Number(session.amount_total || 0) / 100;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product']
    });

    const items = lineItems.data.map((li) => {
        const product = li.price.product;
        return {
            id: product.metadata?.id || product.metadata?.firestoreId || null,
            collectionName: product.metadata?.collection || product.metadata?.collectionName || 'furniture',
            name: product.name,
            price: li.amount_total / 100,
            quantity: li.quantity || 1
        };
    });

    const orderRef = db.collection('orders').doc();
    const orderData = {
        userId,
        userEmail: session.customer_details?.email || session.customer_email || null,
        items,
        total,
        shipping: shippingMeta,
        paymentMethod: 'stripe',
        stripeSessionId: session.id,
        status: 'paid',
        stockReserved: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.runTransaction(async (transaction) => {
        const productReads = [];
        for (const item of items) {
            if (!item.id) continue;
            const colName = item.collectionName || 'furniture';
            const itemRef = db.doc(`artifacts/${APP_ID}/public/data/${colName}/${item.id}`);
            const itemSnap = await transaction.get(itemRef);
            productReads.push({ item, itemRef, itemSnap });
        }

        for (const { item, itemRef, itemSnap } of productReads) {
            if (!itemSnap.exists) continue;
            const itemDb = itemSnap.data();
            const currentStock = itemDb.stock !== undefined ? Number(itemDb.stock) : 1;
            const quantity = Number(item.quantity) || 1;
            const nextStock = Math.max(0, currentStock - quantity);
            transaction.update(itemRef, {
                stock: nextStock,
                sold: nextStock === 0,
                buyerId: userId,
                soldAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        transaction.set(orderRef, orderData);
    });

    console.log('Stripe Checkout session created paid order:', orderRef.id);
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
        if (order.status === 'paid' || order.paidAt) return;
        if (order.stripeSessionId && order.stripeSessionId !== session.id) return;

        await restoreReservedStockForUnpaidOrder(transaction, orderRef, order, {
            status: 'canceled',
            canceledAt: admin.firestore.FieldValue.serverTimestamp(),
            cancelReason: 'checkout_session_expired'
        });
    });
}

async function handlePaymentIntentTerminal(pi, nextOrderFields) {
    const orderId = pi.metadata?.orderId;
    if (!orderId) return;

    const orderRef = db.collection('orders').doc(orderId);
    await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) return;

        const order = orderSnap.data();
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

exports.stripeWebhook = functions.runWith({ secrets: [STRIPE_SECRET_KEY, STRIPE_WH_SECRET] }).https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const stripe = Stripe(STRIPE_SECRET_KEY.value());
    const sig = req.headers['stripe-signature'];
    const endpointSecret = STRIPE_WH_SECRET.value();

    if (!endpointSecret) {
        console.error('STRIPE_WH_SECRET not configured. Rejecting webhook.');
        return res.status(500).send('Webhook secret not configured');
    }

    let event;
    try {
        const rawBody = req.rawBody;
        if (!rawBody) {
            console.error('Missing raw request body. Blocking webhook signature verification.');
            return res.status(400).send('Missing raw body');
        }
        if (!sig) {
            console.error('Missing Stripe signature. Blocking unsigned webhook.');
            return res.status(400).send('Missing signature');
        }
        event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook Security Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const idempRef = db.doc(`sys_idempotency/stripe_${event.id}`);
    const markWebhookFailed = async (reason) => {
        try {
            await idempRef.set({
                status: 'failed',
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
                failureReason: String(reason?.message || reason || 'unknown').slice(0, 500)
            }, { merge: true });
        } catch (error) {
            console.error('Idempotence failure marker error:', error);
        }
    };

    try {
        const shouldProcess = await db.runTransaction(async (tx) => {
            const snap = await tx.get(idempRef);
            if (snap.exists) {
                const status = snap.data()?.status;
                if (status === 'failed') {
                    tx.update(idempRef, {
                        status: 'processing',
                        retryAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    return true;
                }
                return false;
            }

            tx.create(idempRef, {
                type: event.type,
                status: 'processing',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
            });
            return true;
        });

        if (!shouldProcess) {
            console.log('Stripe webhook already processed:', event.id);
            return res.json({ received: true, deduped: true });
        }
    } catch (e) {
        console.error('Idempotence check error:', e);
        return res.status(500).send('Webhook idempotence check error');
    }

    try {
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            console.log('Webhook: PaymentIntent succeeded:', paymentIntent.id);
            await handlePaymentIntentSucceeded(paymentIntent, idempRef);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log('Webhook: Checkout session completed:', session.id);
            await handleCheckoutSessionCompleted(stripe, session);
        }

        if (event.type === 'checkout.session.expired') {
            const session = event.data.object;
            await handleCheckoutSessionExpired(session);
        }

        if (event.type === 'payment_intent.payment_failed') {
            const pi = event.data.object;
            console.error(`Payment failed for PI ${pi.id}, Order: ${pi.metadata?.orderId || 'N/A'}, Reason: ${pi.last_payment_error?.message || 'unknown'}`);
            await handlePaymentIntentTerminal(pi, {
                status: 'payment_failed',
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
                failureReason: pi.last_payment_error?.message || 'Payment failed'
            });
        }

        if (event.type === 'payment_intent.canceled') {
            const pi = event.data.object;
            console.warn(`PaymentIntent canceled for PI ${pi.id}, Order: ${pi.metadata?.orderId || 'N/A'}`);
            await handlePaymentIntentTerminal(pi, {
                status: 'canceled',
                canceledAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        if (event.type === 'refund.created' || event.type === 'refund.updated' || event.type === 'refund.failed') {
            const refund = event.data.object;
            console.log('Webhook: Refund event:', event.type, refund.id, refund.status);
            await handleStripeRefundEvent(refund);
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
                });
            }
        }

        await idempRef.set({
            status: 'processed',
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return res.json({ received: true });
    } catch (error) {
        console.error(`Stripe webhook handler error (${event.type}):`, error);
        await markWebhookFailed(error);
        return res.status(500).send('Webhook handler error');
    }
});
