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
const META_APP_ID = defineSecret('META_APP_ID');
const META_APP_SECRET = defineSecret('META_APP_SECRET');
const META_OAUTH_REDIRECT_URI = defineSecret('META_OAUTH_REDIRECT_URI');
const INSTAGRAM_APP_ID = defineSecret('INSTAGRAM_APP_ID');
const INSTAGRAM_APP_SECRET = defineSecret('INSTAGRAM_APP_SECRET');
const INSTAGRAM_OAUTH_REDIRECT_URI = defineSecret('INSTAGRAM_OAUTH_REDIRECT_URI');
const META_TOKEN_ENCRYPTION_KEY = defineSecret('META_TOKEN_ENCRYPTION_KEY');

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
    SUPER_ADMIN_EMAIL,
    META_APP_ID,
    META_APP_SECRET,
    META_OAUTH_REDIRECT_URI,
    INSTAGRAM_APP_ID,
    INSTAGRAM_APP_SECRET,
    INSTAGRAM_OAUTH_REDIRECT_URI,
    META_TOKEN_ENCRYPTION_KEY
};
