const crypto = require('crypto');
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const { APP_ID } = require('../../helpers/config');
const { STRIPE_SECRET_KEY, E2E_PROOF_TOKEN } = require('../../helpers/secrets');
const { createOrderHandler } = require('./createOrder');

const db = admin.firestore();

const safeString = (value) => String(value || '').trim();

function hasMatchingToken(provided, expected) {
    const left = Buffer.from(safeString(provided));
    const right = Buffer.from(safeString(expected));
    if (!left.length || left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
}

function serialize(value) {
    if (!value || typeof value !== 'object') return value;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (Array.isArray(value)) return value.map(serialize);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
}

async function pickProofProduct(skipPattern) {
    const snap = await db.collection(`artifacts/${APP_ID}/public/data/furniture`).limit(80).get();
    const skipRegex = skipPattern ? new RegExp(skipPattern, 'i') : null;
    const candidates = snap.docs
        .map((doc) => ({ id: doc.id, data: doc.data() || {} }))
        .filter(({ data }) => {
            const name = String(data.name || '').trim();
            const price = Number(data.currentPrice || data.startingPrice || 0);
            const stock = Number(data.stock ?? 0);
            if (skipRegex?.test(name)) return false;
            return data.status === 'published' && price > 0 && stock > 0 && data.sold !== true;
        })
        .sort((left, right) => Number(right.data.stock ?? 0) - Number(left.data.stock ?? 0));

    const selected = candidates[0];
    if (!selected) {
        throw new functions.https.HttpsError('failed-precondition', 'Aucun produit sandbox disponible pour la preuve E2E.');
    }

    return {
        id: selected.id,
        collectionName: 'furniture',
        name: selected.data.name || selected.id,
        price: Number(selected.data.currentPrice || selected.data.startingPrice || 0),
        stockBefore: Number(selected.data.stock ?? 0),
        image: Array.isArray(selected.data.images) ? selected.data.images[0] || null : selected.data.imageUrl || null
    };
}

async function readProductStock(item) {
    const snap = await db.doc(`artifacts/${APP_ID}/public/data/${item.collectionName}/${item.id}`).get();
    return {
        id: item.id,
        collectionName: item.collectionName,
        exists: snap.exists,
        stock: snap.exists ? Number(snap.data()?.stock ?? 0) : null,
        sold: snap.exists ? snap.data()?.sold === true : null,
        buyerId: snap.exists ? snap.data()?.buyerId || null : null
    };
}

async function findStripeEvent(stripe, type, paymentIntentId) {
    const events = await stripe.events.list({ type, limit: 25 });
    return events.data.find((event) => event?.data?.object?.id === paymentIntentId) || null;
}

async function ensureCanceledWebhookEventEnabled(stripe) {
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
    const target = endpoints.data.find((endpoint) => (
        endpoint.status === 'enabled' &&
        String(endpoint.url || '').includes('cloudfunctions.net/stripeWebhook')
    ));
    if (!target) {
        return { found: false, updated: false };
    }

    const enabledEvents = target.enabled_events || [];
    if (enabledEvents.includes('*') || enabledEvents.includes('payment_intent.canceled')) {
        return { found: true, updated: false, endpointId: target.id, enabledEvents };
    }

    const nextEvents = Array.from(new Set([...enabledEvents, 'payment_intent.canceled'])).sort();
    const updated = await stripe.webhookEndpoints.update(target.id, { enabled_events: nextEvents });
    return {
        found: true,
        updated: true,
        endpointId: target.id,
        enabledEvents: updated.enabled_events || nextEvents
    };
}

async function restoreOrderStock(transaction, orderRef, order) {
    for (const item of (order.items || [])) {
        const itemId = item.id || item.originalId;
        const collectionName = item.collectionName || item.collection || 'furniture';
        if (!itemId) continue;

        const itemRef = db.doc(`artifacts/${APP_ID}/public/data/${collectionName}/${itemId}`);
        const itemSnap = await transaction.get(itemRef);
        if (!itemSnap.exists) continue;

        const itemData = itemSnap.data() || {};
        const buyerId = itemData.buyerId || null;
        if (buyerId && buyerId !== order.userId) continue;

        transaction.update(itemRef, {
            stock: Number(itemData.stock ?? 0) + (Number(item.quantity) || 1),
            sold: false,
            soldAt: admin.firestore.FieldValue.delete(),
            buyerId: admin.firestore.FieldValue.delete()
        });
    }

    transaction.update(orderRef, {
        status: 'canceled',
        stockReserved: false,
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        cleanupReason: 'e2e_stripe_hardening_recovery'
    });
}

async function cleanupStaleE2eCanceledOrders(stripe) {
    const snap = await db.collection('orders')
        .where('status', '==', 'pending_payment')
        .limit(50)
        .get();
    let cleaned = 0;

    for (const orderSnap of snap.docs) {
        const order = orderSnap.data() || {};
        if (!String(order.userId || '').startsWith('e2e_') || order.stockReserved !== true || !order.stripePaymentIntentId) {
            continue;
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId).catch(() => null);
        if (paymentIntent?.status !== 'canceled') continue;

        await db.runTransaction(async (transaction) => {
            const freshSnap = await transaction.get(orderSnap.ref);
            if (!freshSnap.exists) return;
            const freshOrder = freshSnap.data() || {};
            if (freshOrder.status !== 'pending_payment' || freshOrder.stockReserved !== true) return;
            await restoreOrderStock(transaction, orderSnap.ref, freshOrder);
            cleaned += 1;
        });
    }

    return cleaned;
}

async function waitForCancellationProof(stripe, orderId, paymentIntentId, product, stockBefore) {
    let latest = null;
    for (let attempt = 0; attempt < 18; attempt += 1) {
        const orderSnap = await db.collection('orders').doc(orderId).get();
        const orderData = orderSnap.exists ? orderSnap.data() || {} : {};
        const canceledEvent = await findStripeEvent(stripe, 'payment_intent.canceled', paymentIntentId).catch(() => null);
        const idempSnap = canceledEvent?.id
            ? await db.doc(`sys_idempotency/stripe_${canceledEvent.id}`).get()
            : null;
        const stock = await readProductStock(product);

        latest = {
            order: serialize({
                exists: orderSnap.exists,
                status: orderData.status || null,
                stockReserved: orderData.stockReserved === true,
                canceledAt: orderData.canceledAt || null,
                stockRestoredAt: orderData.stockRestoredAt || null,
                stockRestoreConflict: orderData.stockRestoreConflict === true,
                stripePaymentIntentId: orderData.stripePaymentIntentId || null
            }),
            webhook: {
                canceledEventId: canceledEvent?.id || null,
                idempotencyStatus: idempSnap?.exists ? idempSnap.data()?.status || null : null,
                idempotencyProcessedAt: serialize(idempSnap?.exists ? idempSnap.data()?.processedAt || null : null)
            },
            stock,
            assertions: {
                orderCanceled: orderData.status === 'canceled',
                stockReservationCleared: orderData.stockReserved === false,
                canceledWebhookProcessed: idempSnap?.exists && idempSnap.data()?.status === 'processed',
                stockRestoredToBefore: stock.exists && stock.stock === stockBefore,
                stockNotSold: stock.exists && stock.sold === false,
                stockRestoreNoConflict: orderData.stockRestoreConflict !== true
            }
        };

        if (Object.values(latest.assertions).every(Boolean)) return latest;
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    return latest;
}

exports.e2eStripeHardeningProof = functions
    .runWith({ secrets: [STRIPE_SECRET_KEY, E2E_PROOF_TOKEN], timeoutSeconds: 180, memory: '512MB' })
    .https.onRequest(async (req, res) => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'method_not_allowed' });
        }

        let expectedToken = '';
        try {
            expectedToken = E2E_PROOF_TOKEN.value();
        } catch {
            expectedToken = '';
        }

        if (!hasMatchingToken(req.get('x-e2e-proof-token'), expectedToken)) {
            return res.status(403).json({ error: 'forbidden' });
        }

        try {
            const payload = req.body || {};
            const email = safeString(payload.email) || 'loa.gto15@gmail.com';
            const stripe = Stripe(STRIPE_SECRET_KEY.value());
            const webhookEndpoint = await ensureCanceledWebhookEventEnabled(stripe);
            const staleCleanupCount = await cleanupStaleE2eCanceledOrders(stripe);
            const runId = `e2e_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
            const clientOrderId = `hardening_${runId}`;
            const product = await pickProofProduct(safeString(payload.skipProductsRegex) || 'buffet|^dd$|chaise');
            const context = {
                auth: {
                    uid: runId,
                    token: {
                        email,
                        email_verified: true,
                        firebase: {
                            sign_in_provider: 'password',
                            identities: {}
                        }
                    }
                },
                rawRequest: req
            };

            const orderData = {
                shipping: {
                    fullName: 'E2E Hardening',
                    email,
                    phone: '0600000000',
                    address: '1 rue du Test',
                    city: 'Paris',
                    zip: '75001',
                    deliveryMode: 'retrait'
                },
                paymentMethod: 'stripe_elements',
                clientOrderId,
                total: product.price,
                items: [{
                    id: product.id,
                    originalId: product.id,
                    collectionName: product.collectionName,
                    quantity: 1,
                    image: product.image
                }]
            };

            const first = await createOrderHandler({ orderData }, context);
            const second = await createOrderHandler({ orderData }, context);
            const sameOrder = first.orderId === second.orderId;
            const samePaymentIntent = first.paymentIntentId === second.paymentIntentId;

            const canceled = await stripe.paymentIntents.cancel(first.paymentIntentId);
            const cancellationProof = await waitForCancellationProof(
                stripe,
                first.orderId,
                first.paymentIntentId,
                product,
                product.stockBefore
            );

            const proof = {
                success: sameOrder &&
                    samePaymentIntent &&
                    cancellationProof &&
                    Object.values(cancellationProof.assertions || {}).every(Boolean),
                runId,
                webhookEndpoint,
                staleCleanupCount,
                product: {
                    id: product.id,
                    name: product.name,
                    stockBefore: product.stockBefore
                },
                idempotency: {
                    clientOrderId,
                    first: {
                        orderId: first.orderId,
                        paymentIntentId: first.paymentIntentId
                    },
                    second: {
                        orderId: second.orderId,
                        paymentIntentId: second.paymentIntentId,
                        reused: second.reused === true
                    },
                    assertions: {
                        sameOrder,
                        samePaymentIntent,
                        secondCallReused: second.reused === true
                    }
                },
                stripe: {
                    canceledPaymentIntentId: canceled.id,
                    canceledStatus: canceled.status
                },
                cancellation: cancellationProof
            };

            return res.status(proof.success ? 200 : 500).json(proof);
        } catch (error) {
            console.error('E2E Stripe hardening proof failed:', error);
            return res.status(500).json({
                error: 'e2e_stripe_hardening_failed',
                message: String(error?.message || error)
            });
        }
    });
