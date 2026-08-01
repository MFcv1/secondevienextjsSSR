/**
 * HELPERS: Firebase Secrets (centralisé)
 * Tous les secrets sont définis ici et importés par les modules qui en ont besoin.
 */
const { defineSecret, defineString } = require('firebase-functions/params');

const GMAIL_EMAIL = defineSecret('GMAIL_EMAIL');
const GMAIL_PASSWORD = defineSecret('GMAIL_PASSWORD');
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const TRANSACTIONAL_EMAIL_PROVIDER = defineString('TRANSACTIONAL_EMAIL_PROVIDER', { default: 'gmail' });
const RESEND_FROM_EMAIL = defineString('RESEND_FROM_EMAIL', { default: '' });
const OTP_HMAC_SECRET = defineSecret('OTP_HMAC_SECRET');
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WH_SECRET = defineSecret('STRIPE_WH_SECRET');
const STRIPE_CONNECT_WH_SECRET = defineSecret('STRIPE_CONNECT_WH_SECRET');
const PAYMENT_LINK_HMAC_SECRET = defineSecret('PAYMENT_LINK_HMAC_SECRET');
const E2E_PROOF_TOKEN = defineSecret('E2E_PROOF_TOKEN');
const SUPER_ADMIN_EMAIL = defineSecret('SUPER_ADMIN_EMAIL');

module.exports = {
    GMAIL_EMAIL,
    GMAIL_PASSWORD,
    RESEND_API_KEY,
    TRANSACTIONAL_EMAIL_PROVIDER,
    RESEND_FROM_EMAIL,
    OTP_HMAC_SECRET,
    STRIPE_SECRET_KEY,
    STRIPE_WH_SECRET,
    STRIPE_CONNECT_WH_SECRET,
    PAYMENT_LINK_HMAC_SECRET,
    E2E_PROOF_TOKEN,
    SUPER_ADMIN_EMAIL
};
