'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { APP_ID } = require('../../helpers/config');
const { normalizeFirestoreId } = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const { STRIPE_SECRET_KEY } = require('../../helpers/secrets');
const { createCheckoutRuntime } = require('./domain/v2Runtime');
const { resolveCheckoutEmail } = require('./checkoutEmailIdentity');

function checkoutRuntime() {
    const Stripe = require('stripe');
    return createCheckoutRuntime({
        db: admin.firestore(),
        stripe: Stripe(STRIPE_SECRET_KEY.value()),
        appId: APP_ID
    });
}

const { createCheckoutHandlers } = require('./checkoutHandlers.cjs');
const { createCheckoutHandler, createResumeCheckoutHandler, normalizeFixtureRequest } = createCheckoutHandlers({
    admin, HttpsError: functions.https.HttpsError, normalizeFirestoreId, resolveCheckoutEmail, checkoutRuntime
});

const callable = (handler) => regionalFunctions()
    .runWith({
        enforceAppCheck: true,
        secrets: [STRIPE_SECRET_KEY]
    })
    .https.onCall(handler);

const createCheckoutV2 = callable(createCheckoutHandler());
const resumeCheckoutV2 = callable(createResumeCheckoutHandler());

module.exports = {
    createCheckoutHandler,
    createCheckoutV2,
    createResumeCheckoutHandler,
    normalizeFixtureRequest,
    resumeCheckoutV2
};
