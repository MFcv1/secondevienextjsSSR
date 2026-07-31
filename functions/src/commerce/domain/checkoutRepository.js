'use strict';

const { validateCheckoutInput, aggregateCheckoutLines } = require('./checkoutInput');
const { createPaymentAttempt, validatePaymentAttempt } = require('./checkoutSaga');
const { pinConnectedAccount } = require('./connectPolicy');
const { authorizeFixtureRequest } = require('./fixtureScope');
const { hashPayload } = require('./idempotency');
const { eurosToCents } = require('./money');
const { createOrderV2, validateOrderV2 } = require('./orderState');
const { resolveDelivery, resolvePolicyForCheckout } = require('./policy');
const { effectIdFor } = require('./reservationRepository');

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
        fixtureContext = null
    }) {
        if (typeof ownerUid !== 'string' || ownerUid.length < 8) {
            throw checkoutError('COMMERCE_CHECKOUT_OWNER_INVALID');
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
            let order = createOrderV2({
                userId: ownerUid,
                clientOrderId: validated.value.clientOrderId,
                requestHash: validated.requestHash,
                policyVersion: policy.version,
                items: orderLines,
                shippingCents: delivery.shippingCents,
                customerSnapshot: { email: ownerEmail || null },
                shippingSnapshot: validated.value.shippingAddress,
                deliverySnapshot: delivery,
                expiresAt: authorizedFixtureContext?.expiresAt || null,
                testContext: authorizedFixtureContext ? {
                    runId: authorizedFixtureContext.runId,
                    fixtureScopeVersion: authorizedFixtureContext.fixtureScopeVersion
                } : null,
                clock
            });
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
                    expiresAt: authorizedFixtureContext?.expiresAt || null,
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
