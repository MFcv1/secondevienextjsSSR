'use strict';

function createCheckoutEmailResolver({ HttpsError, verifyOtp }) {
    return async (context, data) => {
        const token = context.auth?.token || {};
        const email = String(data?.customerEmail ?? token.email ?? '').trim().toLowerCase();
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new HttpsError('invalid-argument', 'Email de commande invalide.');
        }
        const tokenEmail = String(token.email || '').trim().toLowerCase();
        if (email === tokenEmail && token.email_verified === true) return email;
        return verifyOtp(context.auth.uid, email, data?.checkoutOtpToken);
    };
}
module.exports = { createCheckoutEmailResolver };
