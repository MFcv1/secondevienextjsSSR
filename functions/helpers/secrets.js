/**
 * HELPERS: Firebase Secrets (centralisé)
 * Tous les secrets sont définis ici et importés par les modules qui en ont besoin.
 */
const { defineSecret } = require('firebase-functions/params');

const GMAIL_EMAIL = defineSecret('GMAIL_EMAIL');
const GMAIL_PASSWORD = defineSecret('GMAIL_PASSWORD');
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WH_SECRET = defineSecret('STRIPE_WH_SECRET');
const STRIPE_CONNECT_WH_SECRET = defineSecret('STRIPE_CONNECT_WH_SECRET');
const E2E_PROOF_TOKEN = defineSecret('E2E_PROOF_TOKEN');
const SUPER_ADMIN_EMAIL = defineSecret('SUPER_ADMIN_EMAIL');

module.exports = {
    GMAIL_EMAIL,
    GMAIL_PASSWORD,
    STRIPE_SECRET_KEY,
    STRIPE_WH_SECRET,
    STRIPE_CONNECT_WH_SECRET,
    E2E_PROOF_TOKEN,
    SUPER_ADMIN_EMAIL
};
