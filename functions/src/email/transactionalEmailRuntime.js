const crypto = require('crypto');
const {
    GMAIL_EMAIL,
    GMAIL_PASSWORD,
    RESEND_API_KEY,
    TRANSACTIONAL_EMAIL_PROVIDER,
    RESEND_FROM_EMAIL
} = require('../../helpers/secrets');
const { createTransactionalEmailSender } = require('./transactionalEmail');

const TRANSACTIONAL_EMAIL_SECRETS = [GMAIL_EMAIL, GMAIL_PASSWORD, RESEND_API_KEY];
let cachedRuntime = null;

function normalizeProvider(value) {
    return String(value || 'gmail').trim().toLowerCase();
}

function createTransactionalEmailRuntime(options = {}) {
    const provider = normalizeProvider(options.provider ?? TRANSACTIONAL_EMAIL_PROVIDER.value());
    const gmailUser = provider === 'gmail' ? (options.gmailUser ?? GMAIL_EMAIL.value()) : options.gmailUser;
    const gmailPassword = provider === 'gmail' ? (options.gmailPassword ?? GMAIL_PASSWORD.value()) : options.gmailPassword;
    const resendApiKey = provider === 'resend' ? (options.resendApiKey ?? RESEND_API_KEY.value()) : options.resendApiKey;
    const resendFromEmail = provider === 'resend' ? (options.resendFromEmail ?? RESEND_FROM_EMAIL.value()) : options.resendFromEmail;
    const fromAddress = provider === 'resend' ? String(resendFromEmail || '').trim() : String(gmailUser || '').trim();

    const sender = createTransactionalEmailSender({
        provider,
        gmail: {
            user: gmailUser,
            password: gmailPassword,
            nodemailerImpl: options.nodemailerImpl
        },
        resend: {
            apiKey: resendApiKey,
            fetchImpl: options.fetchImpl,
            endpoint: options.endpoint,
            timeoutMs: options.timeoutMs,
            maxAttempts: options.maxAttempts,
            sleep: options.sleep
        }
    });

    if (!fromAddress) {
        const error = new Error(provider === 'resend'
            ? 'RESEND_FROM_EMAIL manquant.'
            : 'GMAIL_EMAIL manquant.');
        error.code = 'EMAIL_PROVIDER_CONFIG';
        throw error;
    }

    return { provider, fromAddress, sender };
}

function getTransactionalEmailRuntime() {
    if (!cachedRuntime) cachedRuntime = createTransactionalEmailRuntime();
    return cachedRuntime;
}

function buildEmailIdempotencyKey(operation, ...parts) {
    const prefix = String(operation || 'email').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 48) || 'email';
    const digest = crypto.createHash('sha256').update(parts.map((part) => String(part ?? '')).join('\u001f')).digest('hex');
    return `${prefix}/${digest}`;
}

module.exports = {
    TRANSACTIONAL_EMAIL_SECRETS,
    buildEmailIdempotencyKey,
    createTransactionalEmailRuntime,
    getTransactionalEmailRuntime
};
