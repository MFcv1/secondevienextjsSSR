'use strict';

// Lazy entry for the public server. No deployed callable or provider secret declaration.
const { createCheckoutRuntime, createAdminPaymentLinkRuntime } = require('./domain/v2Runtime');
let stripe;
let stripeKey;
function getStripe(secret) {
    if (!secret || !secret.startsWith('sk_test_')) throw new Error('PUBLIC_STRIPE_TEST_REQUIRED');
    if (!stripe || stripeKey !== secret) {
        stripe = require('stripe')(secret);
        stripeKey = secret;
    }
    return stripe;
}
function getPublicCheckoutRuntime({ db, secret, increment }) {
    return createCheckoutRuntime({ db, stripe: getStripe(secret), appId: 'secondevie', increment });
}
function getPublicPaymentLinkRuntime({ db, secret, tokenSecret, siteUrl, increment }) {
    if (!tokenSecret) throw new Error('PUBLIC_PAYMENT_LINK_SECRET_REQUIRED');
    return createAdminPaymentLinkRuntime({ db, stripe: getStripe(secret), appId: 'secondevie', tokenSecret, siteUrl, increment }).paymentLinks;
}
module.exports = { getPublicCheckoutRuntime, getPublicPaymentLinkRuntime };
