'use strict';

const functions = require('firebase-functions/v1');

// The contact address is separate from ownership, which always remains the UID.
async function resolveCheckoutEmail(context, data, verifyOtp = (...args) => (
    require('../auth/guestCheckoutOtp').assertGuestCheckoutOtpVerified(...args)
)) {
    const token = context.auth?.token || {};
    const email = String(data?.customerEmail ?? token.email ?? '').trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new functions.https.HttpsError('invalid-argument', 'Email de commande invalide.');
    }
    const tokenEmail = String(token.email || '').trim().toLowerCase();
    if (email === tokenEmail && token.email_verified === true) return email;
    return verifyOtp(context.auth.uid, email, data?.checkoutOtpToken);
}

module.exports = { resolveCheckoutEmail };
