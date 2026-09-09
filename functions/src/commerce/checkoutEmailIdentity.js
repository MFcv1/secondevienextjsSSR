'use strict';

const functions = require('firebase-functions/v1');
const { createCheckoutEmailResolver } = require('./checkoutEmailIdentityCore.cjs');

// The contact address is separate from ownership, which always remains the UID.
async function resolveCheckoutEmail(context, data, verifyOtp = (...args) => (
    require('../auth/guestCheckoutOtp').assertGuestCheckoutOtpVerified(...args)
)) {
    return createCheckoutEmailResolver({ HttpsError: functions.https.HttpsError, verifyOtp })(context, data);
}

module.exports = { resolveCheckoutEmail };
