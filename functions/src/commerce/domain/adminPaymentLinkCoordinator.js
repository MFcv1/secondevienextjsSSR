'use strict';

const { getOrderReference } = require('../../shared/orderReference.cjs');

const {
    ADMIN_PAYMENT_LINK_CHANNEL,
    buildPaymentLinkUrl,
    createPaymentLinkState,
    derivePaymentLinkStatus,
    expiresAtFromMinutes,
    rotatePaymentLinkState,
    verifyPaymentLinkToken
} = require('./adminPaymentLink');
const { validateShippingAddressShape } = require('./checkoutInput');
const { hashPayload } = require('./idempotency');
const { applyLegacyProjection } = require('./legacyProjection');
const { validateOrderV2 } = require('./orderState');
const {
    normalizeCommerceControl,
    resolveDelivery,
    resolvePolicyForCheckout,
    validateCommercePolicy
} = require('./policy');

function coordinatorError(code, detail = null) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function snapshotExists(snapshot) {
    return typeof snapshot?.exists === 'function' ? snapshot.exists() : snapshot?.exists === true;
}

function normalizeEmail(value, { optional = false } = {}) {
    const email = String(value || '').trim().toLowerCase();
    if (optional && !email) return null;
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_EMAIL_INVALID');
    }
    return email;
}

function placeholderPostalCode(mode) {
    const prefix = Array.isArray(mode.postalPrefixes) && mode.postalPrefixes.length > 0
        ? String(mode.postalPrefixes[0])
        : '';
    return (prefix || '000').padEnd(Math.max(3, prefix.length), '0').slice(0, 12);
}

function placeholderAddress(mode) {
    return {
        fullName: 'Client a confirmer',
        phone: '',
        line1: 'Adresse a confirmer',
        line2: '',
        postalCode: placeholderPostalCode(mode),
        city: 'A confirmer',
        country: mode.countries[0]
    };
}

function auditEntry(type, actorUid, now, detail = null) {
    return {
        type,
        actorUid,
        at: now,
        ...(detail ? { detail } : {})
    };
}

function appendAudit(paymentLink, entry) {
    const history = Array.isArray(paymentLink.auditTrail)
        ? paymentLink.auditTrail.slice(-19)
        : [];
    return { ...paymentLink, auditTrail: [...history, entry] };
}

function assertPaymentLinkOrder(order) {
    validateOrderV2(order);
    if (
        order.checkout?.channel !== ADMIN_PAYMENT_LINK_CHANNEL ||
        order.checkout?.paymentLink?.version !== 1
    ) {
        throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_ORDER_INVALID');
    }
    return order.checkout.paymentLink;
}

function safeLine(line) {
    return {
        lineId: line.lineId,
        productId: line.productId,
        title: line.titleSnapshot,
        quantity: line.quantity,
        unitAmountCents: line.unitAmountCents,
        totalCents: line.unitAmountCents * line.quantity
    };
}

function maskEmail(value) {
    const email = String(value || '');
    const [local, domain] = email.split('@');
    if (!local || !domain) return null;
    return `${local.slice(0, 1)}${'*'.repeat(Math.min(5, Math.max(2, local.length - 1)))}@${domain}`;
}

function serializePublicOrder(order, nowMillis) {
    const status = derivePaymentLinkStatus(order, nowMillis);
    return {
        orderId: order.id,
        reference: getOrderReference(order),
        status,
        currency: order.currency,
        items: order.items.map(safeLine),
        itemsCents: order.amounts.itemsCents,
        shippingCents: order.amounts.shippingCents,
        totalCents: order.amounts.totalCents,
        delivery: {
            id: order.deliverySnapshot?.id || null,
            shippingCents: order.deliverySnapshot?.shippingCents || 0
        },
        emailLocked: Boolean(order.checkout.paymentLink.emailHint),
        emailHint: maskEmail(order.checkout.paymentLink.emailHint),
        customerDetailsStatus: order.checkout.paymentLink.customerDetailsStatus,
        expiresAt: order.checkout.expiresAt,
        paymentStatus: order.payment.status
    };
}

function serializeAdminOrder(order, { siteUrl, tokenSecret, nowMillis }) {
    const paymentLink = assertPaymentLinkOrder(order);
    return {
        ...serializePublicOrder(order, nowMillis),
        url: buildPaymentLinkUrl({
            siteUrl,
            orderId: order.id,
            paymentLink,
            secret: tokenSecret
        }),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        createdBy: paymentLink.createdBy,
        tokenVersion: paymentLink.tokenVersion,
        customerEmail: order.customerSnapshot?.email || paymentLink.emailHint || null,
        customerName: order.shippingSnapshot?.fullName === 'Client a confirmer'
            ? null
            : order.shippingSnapshot?.fullName || null,
        paymentIntentId: order.payment.paymentIntentId || null,
        auditTrail: Array.isArray(paymentLink.auditTrail) ? paymentLink.auditTrail : []
    };
}

function createAdminPaymentLinkCoordinator({
    db,
    refs,
    checkoutRepository,
    sagaService,
    ids,
    clock,
    tokenSecret,
    siteUrl
}) {
    if (
        typeof db?.runTransaction !== 'function' ||
        typeof db?.collection !== 'function' ||
        typeof refs?.order !== 'function' ||
        typeof refs?.policy !== 'function' ||
        typeof refs?.reservation !== 'function' ||
        typeof checkoutRepository?.prepareCheckout !== 'function' ||
        typeof checkoutRepository?.loadCheckout !== 'function' ||
        typeof sagaService?.ensurePaymentIntent !== 'function' ||
        typeof sagaService?.cancelProviderFirst !== 'function' ||
        typeof ids?.requestId !== 'function' ||
        typeof ids?.tokenNonce !== 'function' ||
        typeof clock?.now !== 'function' ||
        typeof clock?.nowMillis !== 'function'
    ) {
        throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_DEPENDENCY_INVALID');
    }

    async function loadActivePolicy({ requireCheckoutEnabled = true } = {}) {
        const controlSnapshot = await refs.control().get();
        const control = normalizeCommerceControl(
            snapshotExists(controlSnapshot) ? controlSnapshot.data() : null
        );
        if (!control.activePolicyVersion) {
            throw coordinatorError('COMMERCE_CHECKOUT_MODE_OFF');
        }
        const policySnapshot = await refs.policy(control.activePolicyVersion).get();
        if (!snapshotExists(policySnapshot)) {
            throw coordinatorError('COMMERCE_POLICY_MISSING');
        }
        const policy = policySnapshot.data();
        if (requireCheckoutEnabled) {
            resolvePolicyForCheckout(control, policy);
        } else {
            validateCommercePolicy(policy);
        }
        return { control, policy };
    }

    async function getSetup() {
        const { control, policy } = await loadActivePolicy({ requireCheckoutEnabled: false });
        return {
            enabled: control.newCheckoutMode === 'v2_all' && control.adminMutationMode === 'v2',
            policyVersion: policy.version,
            deliveryModes: policy.deliveryModes
                .filter((mode) => mode.active === true)
                .map((mode) => ({
                    id: mode.id,
                    shippingCents: mode.shippingCents,
                    countries: [...mode.countries]
                }))
        };
    }

    async function create({
        actorUid,
        email,
        items,
        deliveryModeId,
        expiryMinutes,
        sourceOrderId = null
    }) {
        const { policy } = await loadActivePolicy();
        const mode = policy.deliveryModes.find((entry) => entry.id === deliveryModeId);
        if (!mode || mode.active !== true) {
            throw coordinatorError('COMMERCE_DELIVERY_MODE_INACTIVE');
        }
        const requestId = ids.requestId();
        const now = clock.now();
        const normalizedEmail = normalizeEmail(email, { optional: true });
        const initialPaymentLink = createPaymentLinkState({
            actorUid,
            email: normalizedEmail,
            tokenNonce: ids.tokenNonce(),
            now
        });
        const paymentLink = appendAudit({
            ...initialPaymentLink,
            ...(sourceOrderId ? { recreatedFromOrderId: sourceOrderId } : {})
        }, auditEntry('created', actorUid, now, sourceOrderId ? { sourceOrderId } : null));
        const normalizedItems = items.map((item, index) => ({
            cartLineId: `link_line_${requestId}_${index}`.slice(0, 160),
            cartRevision: 0,
            productId: item.productId,
            collectionName: item.collectionName,
            variantId: item.variantId,
            quantity: item.quantity
        }));
        const prepared = await checkoutRepository.prepareCheckout({
            ownerUid: `payment_link_${requestId}`,
            ownerEmail: normalizedEmail,
            input: {
                clientOrderId: `payment_link_${requestId}`,
                items: normalizedItems,
                deliveryModeId,
                shippingAddress: placeholderAddress(mode)
            },
            checkoutExpiresAt: expiresAtFromMinutes(expiryMinutes, clock.nowMillis()),
            checkoutChannel: ADMIN_PAYMENT_LINK_CHANNEL,
            checkoutMetadata: { paymentLink }
        });
        return serializeAdminOrder(prepared.order, {
            siteUrl,
            tokenSecret,
            nowMillis: clock.nowMillis()
        });
    }

    async function loadVerifiedPublicOrder({ orderId, token }) {
        const snapshot = await refs.order(orderId).get();
        if (!snapshotExists(snapshot)) {
            throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_NOT_FOUND');
        }
        const order = { id: orderId, ...snapshot.data() };
        const paymentLink = assertPaymentLinkOrder(order);
        if (!verifyPaymentLinkToken({
            orderId,
            paymentLink,
            secret: tokenSecret,
            token
        })) {
            throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_ACCESS_DENIED');
        }
        return order;
    }

    async function getPublic(request) {
        const order = await loadVerifiedPublicOrder(request);
        return serializePublicOrder(order, clock.nowMillis());
    }

    async function resumePayment(request) {
        const order = await loadVerifiedPublicOrder(request);
        const status = derivePaymentLinkStatus(order, clock.nowMillis());
        if (!['ready_to_pay', 'payment_in_progress'].includes(status)) {
            throw coordinatorError(`COMMERCE_ADMIN_PAYMENT_LINK_${status.toUpperCase()}`);
        }
        if (order.checkout.paymentLink.customerDetailsStatus !== 'complete') {
            throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_CUSTOMER_DETAILS_REQUIRED');
        }
        const checkout = await checkoutRepository.loadCheckout({ orderId: order.id });
        return sagaService.ensurePaymentIntent(checkout);
    }

    async function bindCustomerDetails({ orderId, token, email, shippingAddress }) {
        const normalizedEmail = normalizeEmail(email);
        const normalizedAddress = validateShippingAddressShape(shippingAddress);
        const customerDetailsHash = hashPayload({
            email: normalizedEmail,
            shippingAddress: normalizedAddress
        });
        const orderRef = refs.order(orderId);
        await db.runTransaction(async (transaction) => {
            const orderSnapshot = await transaction.get(orderRef);
            if (!snapshotExists(orderSnapshot)) {
                throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_NOT_FOUND');
            }
            const order = { id: orderId, ...orderSnapshot.data() };
            const paymentLink = assertPaymentLinkOrder(order);
            if (!verifyPaymentLinkToken({
                orderId,
                paymentLink,
                secret: tokenSecret,
                token
            })) {
                throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_ACCESS_DENIED');
            }
            const status = derivePaymentLinkStatus(order, clock.nowMillis());
            if (!['active', 'ready_to_pay', 'payment_in_progress'].includes(status)) {
                throw coordinatorError(`COMMERCE_ADMIN_PAYMENT_LINK_${status.toUpperCase()}`);
            }
            if (paymentLink.emailHint && normalizedEmail !== paymentLink.emailHint) {
                throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_EMAIL_MISMATCH');
            }
            if (paymentLink.customerDetailsStatus === 'complete') {
                if (paymentLink.customerDetailsHash !== customerDetailsHash) {
                    throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_CUSTOMER_DETAILS_LOCKED');
                }
                return;
            }
            const policySnapshot = await transaction.get(refs.policy(order.checkout.policyVersion));
            if (!snapshotExists(policySnapshot)) {
                throw coordinatorError('COMMERCE_POLICY_MISSING');
            }
            const policy = policySnapshot.data();
            validateCommercePolicy(policy);
            const delivery = resolveDelivery(
                policy,
                order.deliverySnapshot.id,
                normalizedAddress
            );
            if (
                delivery.shippingCents !== order.amounts.shippingCents ||
                delivery.policyVersion !== order.checkout.policyVersion
            ) {
                throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_DELIVERY_CONFLICT');
            }
            let next = {
                ...order,
                stateVersion: order.stateVersion + 1,
                userEmail: normalizedEmail,
                customerSnapshot: { email: normalizedEmail },
                shippingSnapshot: normalizedAddress,
                checkout: {
                    ...order.checkout,
                    paymentLink: {
                        ...paymentLink,
                        customerDetailsStatus: 'complete',
                        customerDetailsHash,
                        customerDetailsUpdatedAt: clock.now()
                    }
                },
                updatedAt: clock.now()
            };
            delete next.id;
            next = applyLegacyProjection(next);
            validateOrderV2(next);
            transaction.set(orderRef, next);
        });
        const checkout = await checkoutRepository.loadCheckout({ orderId });
        const payment = await sagaService.ensurePaymentIntent(checkout);
        return {
            ...payment,
            status: derivePaymentLinkStatus(checkout.order, clock.nowMillis())
        };
    }

    async function list({ pageSize = 50 }) {
        const snapshot = await db.collection('orders')
            .where('checkout.channel', '==', ADMIN_PAYMENT_LINK_CHANNEL)
            .orderBy('createdAt', 'desc')
            .limit(pageSize)
            .get();
        return snapshot.docs.map((document) => serializeAdminOrder({
            id: document.id,
            ...document.data()
        }, {
            siteUrl,
            tokenSecret,
            nowMillis: clock.nowMillis()
        }));
    }

    async function mutateActiveOrder({
        orderId,
        actorUid,
        type,
        mutate,
        allowedStatuses = ['active', 'ready_to_pay', 'payment_in_progress']
    }) {
        const orderRef = refs.order(orderId);
        return db.runTransaction(async (transaction) => {
            const orderSnapshot = await transaction.get(orderRef);
            if (!snapshotExists(orderSnapshot)) {
                throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_NOT_FOUND');
            }
            const order = { id: orderId, ...orderSnapshot.data() };
            const paymentLink = assertPaymentLinkOrder(order);
            const status = derivePaymentLinkStatus(order, clock.nowMillis());
            if (!allowedStatuses.includes(status)) {
                throw coordinatorError(`COMMERCE_ADMIN_PAYMENT_LINK_${status.toUpperCase()}`);
            }
            const now = clock.now();
            const mutation = await mutate({ transaction, order, paymentLink, now });
            let next = {
                ...order,
                ...mutation,
                stateVersion: order.stateVersion + 1,
                checkout: {
                    ...order.checkout,
                    ...(mutation.checkout || {}),
                    paymentLink: appendAudit(
                        mutation.checkout?.paymentLink || paymentLink,
                        auditEntry(type, actorUid, now)
                    )
                },
                updatedAt: now
            };
            delete next.id;
            next = applyLegacyProjection(next);
            validateOrderV2(next);
            transaction.set(orderRef, next);
            return { id: orderId, ...next };
        });
    }

    async function extend({ orderId, actorUid, expiryMinutes }) {
        const updated = await mutateActiveOrder({
            orderId,
            actorUid,
            type: 'extended',
            mutate: async ({ transaction, order, paymentLink }) => {
                const nowMillis = clock.nowMillis();
                const currentExpiryMillis = Date.parse(order.checkout.expiresAt);
                const extensionBaseMillis = Math.max(nowMillis, currentExpiryMillis);
                const requestedExpiryMillis = Date.parse(
                    expiresAtFromMinutes(expiryMinutes, extensionBaseMillis)
                );
                const maximumExpiryMillis = Date.parse(expiresAtFromMinutes(24 * 60, nowMillis));
                const expiresAt = new Date(
                    Math.min(requestedExpiryMillis, maximumExpiryMillis)
                ).toISOString();
                const reservationRefs = [...new Set(order.items.map((item) => item.inventoryKey))]
                    .map((inventoryKey) => refs.reservation(orderId, inventoryKey));
                const reservationSnapshots = await Promise.all(
                    reservationRefs.map((reference) => transaction.get(reference))
                );
                for (let index = 0; index < reservationSnapshots.length; index += 1) {
                    const snapshot = reservationSnapshots[index];
                    if (!snapshotExists(snapshot) || snapshot.data().status !== 'held') {
                        throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_RESERVATION_INVALID');
                    }
                    transaction.update(reservationRefs[index], {
                        expiresAt,
                        updatedAt: clock.now()
                    });
                }
                return {
                    checkout: {
                        expiresAt,
                        paymentLink: {
                            ...paymentLink,
                            extendedAt: clock.now(),
                            extendedBy: actorUid
                        }
                    }
                };
            }
        });
        return serializeAdminOrder(updated, { siteUrl, tokenSecret, nowMillis: clock.nowMillis() });
    }

    async function regenerate({ orderId, actorUid }) {
        const updated = await mutateActiveOrder({
            orderId,
            actorUid,
            type: 'regenerated',
            allowedStatuses: ['active'],
            mutate: async ({ paymentLink, now }) => ({
                checkout: {
                    paymentLink: rotatePaymentLinkState(paymentLink, {
                        tokenNonce: ids.tokenNonce(),
                        actorUid,
                        now
                    })
                }
            })
        });
        return serializeAdminOrder(updated, { siteUrl, tokenSecret, nowMillis: clock.nowMillis() });
    }

    async function recreate({ orderId, actorUid, expiryMinutes }) {
        const snapshot = await refs.order(orderId).get();
        if (!snapshotExists(snapshot)) {
            throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_NOT_FOUND');
        }
        const source = { id: orderId, ...snapshot.data() };
        const paymentLink = assertPaymentLinkOrder(source);
        const status = derivePaymentLinkStatus(source, clock.nowMillis());
        if (!['expired', 'canceled'].includes(status)) {
            throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_RECREATE_FORBIDDEN');
        }
        return create({
            actorUid,
            email: paymentLink.emailHint || source.customerSnapshot?.email || null,
            items: source.items.map((item) => ({
                productId: item.productId,
                collectionName: item.collectionName,
                variantId: item.variantId,
                quantity: item.quantity
            })),
            deliveryModeId: source.deliverySnapshot.id,
            expiryMinutes,
            sourceOrderId: orderId
        });
    }

    async function annotateCancellation(orderId, actorUid, outcome, type) {
        const orderRef = refs.order(orderId);
        return db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(orderRef);
            if (!snapshotExists(snapshot)) {
                throw coordinatorError('COMMERCE_ADMIN_PAYMENT_LINK_NOT_FOUND');
            }
            const order = { id: orderId, ...snapshot.data() };
            const paymentLink = assertPaymentLinkOrder(order);
            let next = {
                ...order,
                stateVersion: order.stateVersion + 1,
                checkout: {
                    ...order.checkout,
                    ...(type === 'expired' && order.checkout.closeReason === 'canceled'
                        ? { closeReason: 'expired' }
                        : {}),
                    paymentLink: appendAudit(paymentLink, auditEntry(
                        type,
                        actorUid,
                        clock.now(),
                        outcome
                    ))
                },
                updatedAt: clock.now()
            };
            delete next.id;
            next = applyLegacyProjection(next);
            validateOrderV2(next);
            transaction.set(orderRef, next);
            return { id: orderId, ...next };
        });
    }

    async function cancel({ orderId, actorUid }) {
        const checkout = await checkoutRepository.loadCheckout({ orderId });
        assertPaymentLinkOrder(checkout.order);
        const status = derivePaymentLinkStatus(checkout.order, clock.nowMillis());
        if (status === 'paid') return serializeAdminOrder(checkout.order, {
            siteUrl,
            tokenSecret,
            nowMillis: clock.nowMillis()
        });
        if (['canceled', 'expired'].includes(status)) {
            return serializeAdminOrder(checkout.order, {
                siteUrl,
                tokenSecret,
                nowMillis: clock.nowMillis()
            });
        }
        const result = await sagaService.cancelProviderFirst(checkout);
        const updated = await annotateCancellation(orderId, actorUid, result.outcome, 'canceled');
        return serializeAdminOrder(updated, { siteUrl, tokenSecret, nowMillis: clock.nowMillis() });
    }

    async function expire(orderId) {
        const checkout = await checkoutRepository.loadCheckout({ orderId });
        assertPaymentLinkOrder(checkout.order);
        if (Date.parse(checkout.order.checkout.expiresAt) > clock.nowMillis()) {
            return { outcome: 'not_due', orderId };
        }
        const status = derivePaymentLinkStatus(checkout.order, clock.nowMillis());
        if (status === 'paid') return { outcome: 'paid', orderId };
        if (checkout.order.checkout.status === 'closed') {
            return { outcome: checkout.order.checkout.closeReason, orderId };
        }
        const result = await sagaService.cancelProviderFirst(checkout);
        const updated = await annotateCancellation(
            orderId,
            'system:payment-link-expiry',
            result.outcome,
            'expired'
        );
        return { outcome: updated.checkout.closeReason, orderId };
    }

    return Object.freeze({
        bindCustomerDetails,
        cancel,
        create,
        expire,
        extend,
        getPublic,
        getSetup,
        list,
        recreate,
        regenerate,
        resumePayment
    });
}

module.exports = {
    createAdminPaymentLinkCoordinator,
    normalizeEmail,
    serializePublicOrder
};
