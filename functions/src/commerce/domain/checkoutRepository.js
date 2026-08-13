'use strict';

const crypto = require('node:crypto');

const { validateCheckoutInput, aggregateCheckoutLines } = require('./checkoutInput');
const { createPaymentAttempt, validatePaymentAttempt } = require('./checkoutSaga');
const { pinConnectedAccount } = require('./connectPolicy');
const { authorizeFixtureRequest } = require('./fixtureScope');
const { hashPayload } = require('./idempotency');
const { eurosToCents } = require('./money');
const { createOrderV2, validateOrderV2 } = require('./orderState');
const {
    resolveCheckoutExpiry,
    resolveDelivery,
    resolvePolicyForCheckout
} = require('./policy');
const { effectIdFor } = require('./reservationRepository');
const { calculatePromotionDiscount, promotionCodeHash } = require('./promotionCode');

function checkoutError(code, detail) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function snapshotExists(snapshot) {
    return typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists === true;
}

function requireDependency(value, name) {
    if (typeof value !== 'function') throw checkoutError('COMMERCE_CHECKOUT_REPOSITORY_DEPENDENCY_INVALID', name);
}

function createCheckoutRepository({ db, refs, ids, clock }) {
    requireDependency(db?.runTransaction, 'db.runTransaction');
    for (const name of [
        'control',
        'policy',
        'fixtureScope',
        'connectAccount',
        'checkoutIdentity',
        'order',
        'attempt',
        'product',
        'reservation',
        'movement'
    ]) {
        requireDependency(refs?.[name], `refs.${name}`);
    }
    requireDependency(ids?.orderId, 'ids.orderId');
    requireDependency(ids?.attemptId, 'ids.attemptId');
    requireDependency(ids?.commandId, 'ids.commandId');
    requireDependency(clock?.now, 'clock.now');

    async function prepareCheckout({
        ownerUid,
        ownerEmail,
        input,
        fixtureContext = null,
        checkoutExpiresAt = null,
        checkoutChannel = null,
        checkoutMetadata = null
    }) {
        if (typeof ownerUid !== 'string' || ownerUid.length < 8) {
            throw checkoutError('COMMERCE_CHECKOUT_OWNER_INVALID');
        }
        if (
            checkoutExpiresAt !== null &&
            (
                typeof checkoutExpiresAt !== 'string' ||
                !Number.isSafeInteger(Date.parse(checkoutExpiresAt))
            )
        ) {
            throw checkoutError('COMMERCE_CHECKOUT_EXPIRY_INVALID');
        }
        if (
            checkoutChannel !== null &&
            (
                typeof checkoutChannel !== 'string' ||
                !/^[a-z0-9_]{3,64}$/.test(checkoutChannel) ||
                !checkoutMetadata ||
                typeof checkoutMetadata !== 'object' ||
                Array.isArray(checkoutMetadata)
            )
        ) {
            throw checkoutError('COMMERCE_CHECKOUT_CHANNEL_INVALID');
        }
        const validated = validateCheckoutInput(input);
        const groups = aggregateCheckoutLines(validated.value.items);
        const identityId = hashPayload({
            ownerUid,
            clientOrderId: validated.value.clientOrderId
        });
        const identityRef = refs.checkoutIdentity(identityId);
        const orderId = ids.orderId();
        const attemptId = ids.attemptId();
        const commandId = ids.commandId();

        return db.runTransaction(async (transaction) => {
            const identitySnap = await transaction.get(identityRef);
            if (snapshotExists(identitySnap)) {
                const identity = identitySnap.data();
                if (
                    identity.ownerUid !== ownerUid ||
                    identity.clientOrderId !== validated.value.clientOrderId ||
                    identity.requestHash !== validated.requestHash
                ) {
                    throw checkoutError('COMMERCE_CHECKOUT_IDEMPOTENCY_CONFLICT');
                }
                const orderSnap = await transaction.get(refs.order(identity.orderId));
                const attemptSnap = await transaction.get(refs.attempt(identity.orderId, identity.attemptId));
                if (!snapshotExists(orderSnap) || !snapshotExists(attemptSnap)) {
                    throw checkoutError('COMMERCE_CHECKOUT_IDEMPOTENCY_INCOMPLETE');
                }
                const existingOrder = orderSnap.data();
                validateOrderV2(existingOrder);
                return {
                    order: { ...existingOrder, id: identity.orderId },
                    attempt: attemptSnap.data(),
                    reused: true
                };
            }

            const controlSnap = await transaction.get(refs.control());
            if (!snapshotExists(controlSnap)) throw checkoutError('COMMERCE_CHECKOUT_MODE_OFF');
            const control = controlSnap.data();
            const activePolicyVersion = control.activePolicyVersion;
            if (typeof activePolicyVersion !== 'string') throw checkoutError('COMMERCE_CHECKOUT_MODE_OFF');

            const policySnap = await transaction.get(refs.policy(activePolicyVersion));
            if (!snapshotExists(policySnap)) throw checkoutError('COMMERCE_POLICY_MISSING');
            let authorizedFixtureContext = null;
            if (control.newCheckoutMode === 'v2_fixture') {
                if (!fixtureContext) throw checkoutError('COMMERCE_CHECKOUT_MODE_OFF');
                const fixtureScopeVersion = control.fixtureScopeVersion;
                if (
                    typeof fixtureScopeVersion !== 'string' ||
                    fixtureContext.fixtureScopeVersion !== fixtureScopeVersion
                ) {
                    throw checkoutError('COMMERCE_FIXTURE_SCOPE_MISMATCH');
                }
                const fixtureScopeSnap = await transaction.get(
                    refs.fixtureScope(fixtureScopeVersion)
                );
                if (!snapshotExists(fixtureScopeSnap)) {
                    throw checkoutError('COMMERCE_FIXTURE_SCOPE_MISSING');
                }
                authorizedFixtureContext = authorizeFixtureRequest(
                    fixtureScopeSnap.data(),
                    {
                        uid: ownerUid,
                        inventoryKeys: groups.map((group) => group.inventoryKey),
                        fixtureScopeVersion,
                        runId: fixtureContext.runId,
                        now: new Date(clock.now())
                    }
                );
            } else if (fixtureContext) {
                throw checkoutError('COMMERCE_FIXTURE_SCOPE_MISMATCH');
            }
            const policy = resolvePolicyForCheckout(control, policySnap.data(), {
                fixture: Boolean(authorizedFixtureContext)
            });
            if (
                authorizedFixtureContext &&
                authorizedFixtureContext.policyVersion !== policy.version
            ) throw checkoutError('COMMERCE_FIXTURE_SCOPE_MISMATCH');
            const delivery = resolveDelivery(
                policy,
                validated.value.deliveryModeId,
                validated.value.shippingAddress
            );

            const accountSnap = await transaction.get(
                refs.connectAccount(policy.stripeConnectedAccountId)
            );
            if (!snapshotExists(accountSnap)) throw checkoutError('COMMERCE_CONNECT_ACCOUNT_NOT_READY');
            const connectedAccount = pinConnectedAccount(policy, accountSnap.data());

            const productEntries = groups.map((group) => ({
                group,
                ref: refs.product(group)
            }));
            const productSnapshots = await Promise.all(
                productEntries.map((entry) => transaction.get(entry.ref))
            );
            const productByInventoryKey = new Map();
            for (let index = 0; index < productEntries.length; index += 1) {
                const { group, ref } = productEntries[index];
                const snapshot = productSnapshots[index];
                if (!snapshotExists(snapshot)) {
                    throw checkoutError('COMMERCE_CHECKOUT_PRODUCT_MISSING', group.inventoryKey);
                }
                const product = snapshot.data();
                const stock = product.stock;
                const inventoryVersion = product.inventoryVersion ?? 0;
                const priceSource = product.currentPrice ?? product.startingPrice ?? product.price;
                const unitAmountCents = eurosToCents(priceSource, `product.${group.productId}.price`);
                if (
                    product.status !== 'published' ||
                    product.priceOnRequest === true ||
                    unitAmountCents <= 0 ||
                    !Number.isSafeInteger(stock) ||
                    stock < group.quantity ||
                    !Number.isSafeInteger(inventoryVersion) ||
                    inventoryVersion < 0
                ) {
                    throw checkoutError('COMMERCE_CHECKOUT_PRODUCT_UNAVAILABLE', group.inventoryKey);
                }
                productByInventoryKey.set(group.inventoryKey, {
                    product,
                    ref,
                    stock,
                    inventoryVersion,
                    unitAmountCents
                });
            }

            const orderLines = validated.value.items.map((line) => {
                const source = productByInventoryKey.get(line.inventoryKey);
                return {
                    lineId: line.cartLineId,
                    cartLineId: line.cartLineId,
                    cartRevision: line.cartRevision,
                    inventoryKey: line.inventoryKey,
                    productId: line.productId,
                    collectionName: line.collectionName,
                    variantId: line.variantId,
                    titleSnapshot: String(source.product.name || source.product.title || line.productId).slice(0, 200),
                    unitAmountCents: source.unitAmountCents,
                    quantity: line.quantity
                };
            });
            let promotion = null;
            let promotionResult = null;
            let promotionRef = null;
            let promotionCustomerRef = null;
            let promotionCustomer = null;
            let promotionRedemptionRef = null;
            let promotionCustomerKey = null;
            if (validated.value.promotionCode) {
                for (const name of ['promotion', 'promotionCustomer', 'promotionRedemption']) {
                    requireDependency(refs?.[name], `refs.${name}`);
                }
                const codeHash = promotionCodeHash(validated.value.promotionCode);
                const customerKey = crypto.createHash('sha256').update(ownerUid).digest('hex');
                promotionCustomerKey = customerKey;
                promotionRef = refs.promotion(codeHash);
                promotionCustomerRef = refs.promotionCustomer(codeHash, customerKey);
                promotionRedemptionRef = refs.promotionRedemption(codeHash, orderId);
                const [promotionSnapshot, customerSnapshot, redemptionSnapshot] = await Promise.all([
                    transaction.get(promotionRef),
                    transaction.get(promotionCustomerRef),
                    transaction.get(promotionRedemptionRef)
                ]);
                if (!snapshotExists(promotionSnapshot)) {
                    throw checkoutError('COMMERCE_PROMOTION_NOT_FOUND');
                }
                if (snapshotExists(redemptionSnapshot)) {
                    throw checkoutError('COMMERCE_PROMOTION_REDEMPTION_CONFLICT');
                }
                promotion = promotionSnapshot.data();
                promotionCustomer = snapshotExists(customerSnapshot)
                    ? customerSnapshot.data()
                    : { reserved: 0, committed: 0 };
                const usage = promotion.usage || {};
                const limits = promotion.limits || {};
                if (Number(usage.reserved || 0) + Number(usage.committed || 0) >= Number(limits.maxRedemptions || 0)) {
                    throw checkoutError('COMMERCE_PROMOTION_LIMIT_REACHED');
                }
                if (Number(promotionCustomer.reserved || 0) + Number(promotionCustomer.committed || 0) >= Number(limits.maxPerCustomer || 0)) {
                    throw checkoutError('COMMERCE_PROMOTION_CUSTOMER_LIMIT_REACHED');
                }
                const ownerEmailHash = crypto.createHash('sha256')
                    .update(String(ownerEmail || '').trim().toLowerCase())
                    .digest('hex');
                promotionResult = calculatePromotionDiscount(promotion, {
                    lines: orderLines,
                    ownerEmailHash,
                    now: clock.now()
                });
            }
            const expiresAt = authorizedFixtureContext?.expiresAt
                || checkoutExpiresAt
                || resolveCheckoutExpiry(policy, clock.now());
            let order = createOrderV2({
                userId: ownerUid,
                clientOrderId: validated.value.clientOrderId,
                requestHash: validated.requestHash,
                policyVersion: policy.version,
                items: orderLines,
                shippingCents: delivery.shippingCents,
                discountCents: promotionResult?.discountCents || 0,
                customerSnapshot: { email: ownerEmail || null },
                shippingSnapshot: validated.value.shippingAddress,
                deliverySnapshot: delivery,
                expiresAt,
                testContext: authorizedFixtureContext ? {
                    runId: authorizedFixtureContext.runId,
                    fixtureScopeVersion: authorizedFixtureContext.fixtureScopeVersion
                } : null,
                clock
            });
            if (promotionResult) {
                order = {
                    ...order,
                    promotionSnapshot: {
                        code: promotion.code,
                        codeHash: promotion.codeHash,
                        name: promotion.name,
                        source: promotion.source,
                        sourceRewardId: promotion.sourceRewardId || null,
                        percentage: promotion.discount.percentage,
                        discountCents: promotionResult.discountCents,
                        eligibleCents: promotionResult.eligibleCents,
                        eligibleProductIds: promotionResult.eligibleProductIds
                    }
                };
            }
            if (checkoutChannel) {
                order = {
                    ...order,
                    checkout: {
                        ...order.checkout,
                        channel: checkoutChannel,
                        ...checkoutMetadata
                    }
                };
            }
            order = {
                ...order,
                payment: {
                    ...order.payment,
                    connectedAccountId: connectedAccount.accountId,
                    currentAttemptId: attemptId
                }
            };
            const attempt = createPaymentAttempt({
                orderId,
                attemptId,
                requestHash: validated.requestHash,
                connectedAccountId: connectedAccount.accountId,
                clock
            });
            validateOrderV2(order);
            const now = clock.now();

            for (const group of groups) {
                const source = productByInventoryKey.get(group.inventoryKey);
                const effectId = effectIdFor('hold', orderId, group.inventoryKey);
                const reservation = {
                    schemaVersion: 2,
                    orderId,
                    inventoryKey: group.inventoryKey,
                    productId: group.productId,
                    collectionName: group.collectionName,
                    variantId: group.variantId,
                    lineAllocations: group.lineAllocations,
                    status: 'held',
                    reservedQty: group.quantity,
                    heldQty: group.quantity,
                    committedQty: 0,
                    releasedQty: 0,
                    dispositionPendingQty: 0,
                    restockedQty: 0,
                    writtenOffQty: 0,
                    inventoryVersion: source.inventoryVersion + 1,
                    stateVersion: 0,
                    expiresAt,
                    ...(authorizedFixtureContext ? {
                        testContext: {
                            runId: authorizedFixtureContext.runId,
                            fixtureScopeVersion: authorizedFixtureContext.fixtureScopeVersion
                        }
                    } : {}),
                    createdAt: now,
                    updatedAt: now
                };
                transaction.update(source.ref, {
                    stock: source.stock - group.quantity,
                    inventoryVersion: source.inventoryVersion + 1
                });
                transaction.set(refs.reservation(orderId, group.inventoryKey), reservation);
                transaction.set(refs.movement(effectId), {
                    schemaVersion: 2,
                    effectId,
                    reservationId: `${orderId}_${group.inventoryKey}`,
                    orderId,
                    inventoryKey: group.inventoryKey,
                    type: 'hold',
                    quantity: group.quantity,
                    availableDelta: -group.quantity,
                    inventoryVersionBefore: source.inventoryVersion,
                    inventoryVersionAfter: source.inventoryVersion + 1,
                    commandId,
                    actor: ownerUid,
                    reason: 'checkout_created',
                    payloadHash: hashPayload({
                        type: 'hold',
                        orderId,
                        inventoryKey: group.inventoryKey,
                        quantity: group.quantity,
                        commandId
                    }),
                    ...(authorizedFixtureContext ? {
                        testContext: {
                            runId: authorizedFixtureContext.runId,
                            fixtureScopeVersion: authorizedFixtureContext.fixtureScopeVersion
                        }
                    } : {}),
                    createdAt: now
                });
            }
            if (promotionResult) {
                transaction.update(promotionRef, {
                    usage: {
                        reserved: Number(promotion.usage?.reserved || 0) + 1,
                        committed: Number(promotion.usage?.committed || 0)
                    },
                    updatedAt: now
                });
                transaction.set(promotionCustomerRef, {
                    schemaVersion: 1,
                    promotionCodeHash: promotion.codeHash,
                    customerKey: promotionCustomerKey,
                    reserved: Number(promotionCustomer.reserved || 0) + 1,
                    committed: Number(promotionCustomer.committed || 0),
                    updatedAt: now
                });
                transaction.set(promotionRedemptionRef, {
                    schemaVersion: 1,
                    orderId,
                    ownerUid,
                    customerKey: promotionCustomerKey,
                    codeHash: promotion.codeHash,
                    code: promotion.code,
                    source: promotion.source,
                    sourceRewardId: promotion.sourceRewardId || null,
                    status: 'reserved',
                    discountCents: promotionResult.discountCents,
                    eligibleCents: promotionResult.eligibleCents,
                    createdAt: now,
                    updatedAt: now
                });
            }
            transaction.set(refs.order(orderId), order);
            transaction.set(refs.attempt(orderId, attemptId), attempt);
            transaction.set(identityRef, {
                schemaVersion: 2,
                ownerUid,
                clientOrderId: validated.value.clientOrderId,
                requestHash: validated.requestHash,
                orderId,
                attemptId,
                policyVersion: policy.version,
                connectedAccountId: connectedAccount.accountId,
                ...(checkoutChannel ? { checkoutChannel } : {}),
                ...(authorizedFixtureContext ? {
                    testContext: {
                        runId: authorizedFixtureContext.runId,
                        fixtureScopeVersion: authorizedFixtureContext.fixtureScopeVersion
                    }
                } : {}),
                createdAt: now
            });
            return {
                order: { ...order, id: orderId },
                attempt,
                reused: false
            };
        });
    }

    async function loadCheckout({ orderId, ownerUid = null }) {
        return db.runTransaction(async (transaction) => {
            const orderSnap = await transaction.get(refs.order(orderId));
            if (!snapshotExists(orderSnap)) throw checkoutError('COMMERCE_ORDER_NOT_FOUND');
            const order = orderSnap.data();
            if (ownerUid !== null && order.userId !== ownerUid) {
                throw checkoutError('COMMERCE_ORDER_ACCESS_DENIED');
            }
            validateOrderV2(order);
            const attemptId = order.payment.currentAttemptId;
            if (!attemptId) {
                const identityRef = refs.checkoutIdentity(hashPayload({
                    ownerUid: order.userId,
                    clientOrderId: order.checkout.clientOrderId
                }));
                const identitySnap = await transaction.get(identityRef);
                if (!snapshotExists(identitySnap)) throw checkoutError('COMMERCE_CHECKOUT_IDEMPOTENCY_INCOMPLETE');
                const identity = identitySnap.data();
                const attemptSnap = await transaction.get(refs.attempt(orderId, identity.attemptId));
                if (!snapshotExists(attemptSnap)) throw checkoutError('COMMERCE_PAYMENT_ATTEMPT_MISSING');
                return { order: { ...order, id: orderId }, attempt: attemptSnap.data() };
            }
            const attemptSnap = await transaction.get(refs.attempt(orderId, attemptId));
            if (!snapshotExists(attemptSnap)) throw checkoutError('COMMERCE_PAYMENT_ATTEMPT_MISSING');
            return { order: { ...order, id: orderId }, attempt: attemptSnap.data() };
        });
    }

    async function loadOwnedCheckout({ orderId, ownerUid }) {
        return loadCheckout({ orderId, ownerUid });
    }

    async function saveAttempt(nextAttempt) {
        validatePaymentAttempt(nextAttempt);
        const attemptRef = refs.attempt(nextAttempt.orderId, nextAttempt.attemptId);
        const orderRef = refs.order(nextAttempt.orderId);
        return db.runTransaction(async (transaction) => {
            const [attemptSnap, orderSnap] = await Promise.all([
                transaction.get(attemptRef),
                transaction.get(orderRef)
            ]);
            if (!snapshotExists(attemptSnap)) throw checkoutError('COMMERCE_PAYMENT_ATTEMPT_MISSING');
            if (!snapshotExists(orderSnap)) throw checkoutError('COMMERCE_ORDER_NOT_FOUND');
            const existing = attemptSnap.data();
            validatePaymentAttempt(existing);
            if (
                existing.stripeIdempotencyKey !== nextAttempt.stripeIdempotencyKey ||
                existing.requestHash !== nextAttempt.requestHash ||
                existing.connectedAccountId !== nextAttempt.connectedAccountId
            ) {
                throw checkoutError('COMMERCE_PAYMENT_ATTEMPT_IDENTITY_CONFLICT');
            }
            if (existing.stateVersion === nextAttempt.stateVersion) {
                if (hashPayload(existing) !== hashPayload(nextAttempt)) {
                    throw checkoutError('COMMERCE_PAYMENT_ATTEMPT_VERSION_CONFLICT');
                }
                return existing;
            }
            if (nextAttempt.stateVersion !== existing.stateVersion + 1) {
                throw checkoutError('COMMERCE_PAYMENT_ATTEMPT_VERSION_CONFLICT');
            }

            const order = orderSnap.data();
            validateOrderV2(order);
            if (
                order.payment.currentAttemptId !== nextAttempt.attemptId ||
                order.checkout.requestHash !== nextAttempt.requestHash ||
                order.payment.connectedAccountId !== nextAttempt.connectedAccountId
            ) {
                throw checkoutError('COMMERCE_PAYMENT_ATTEMPT_ORDER_CONFLICT');
            }

            let nextOrder = order;
            if (
                nextAttempt.paymentIntentId &&
                order.payment.paymentIntentId !== nextAttempt.paymentIntentId
            ) {
                if (
                    order.payment.paymentIntentId &&
                    order.payment.paymentIntentId !== nextAttempt.paymentIntentId
                ) {
                    throw checkoutError('COMMERCE_PAYMENT_INTENT_IDENTITY_CONFLICT');
                }
                nextOrder = {
                    ...order,
                    stateVersion: order.stateVersion + 1,
                    payment: {
                        ...order.payment,
                        paymentIntentId: nextAttempt.paymentIntentId,
                        lastProviderStatus: nextAttempt.providerStatus
                    },
                    updatedAt: clock.now()
                };
                validateOrderV2(nextOrder);
            }
            transaction.set(attemptRef, nextAttempt);
            if (nextOrder !== order) transaction.set(orderRef, nextOrder);
            return nextAttempt;
        });
    }

    return Object.freeze({
        loadCheckout,
        loadOwnedCheckout,
        prepareCheckout,
        saveAttempt
    });
}

module.exports = { createCheckoutRepository };
