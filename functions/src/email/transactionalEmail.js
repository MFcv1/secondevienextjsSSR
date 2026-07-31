const nodemailer = require('nodemailer');

const RESEND_EMAIL_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_ATTEMPTS = 2;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

class EmailProviderError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = 'EmailProviderError';
        this.code = options.code || 'EMAIL_PROVIDER_ERROR';
        this.provider = options.provider || null;
        this.responseCode = options.responseCode || null;
        this.retryable = options.retryable === true;
        this.cause = options.cause;
    }
}

function requireString(value, label) {
    const normalized = String(value || '').trim();
    if (!normalized) {
        throw new EmailProviderError(`${label} manquant.`, {
            code: 'EMAIL_PROVIDER_CONFIG',
            retryable: false
        });
    }
    return normalized;
}

function normalizeIdempotencyKey(value) {
    const key = requireString(value, 'Cle idempotente');
    if (key.length > 256) {
        throw new EmailProviderError('Cle idempotente trop longue.', {
            code: 'EMAIL_IDEMPOTENCY_KEY_INVALID',
            retryable: false
        });
    }
    return key;
}

function normalizeAttachments(attachments) {
    if (attachments == null) return undefined;
    if (!Array.isArray(attachments) || attachments.length > 3) {
        throw new EmailProviderError('Pièces jointes invalides.', {
            code: 'EMAIL_ATTACHMENTS_INVALID',
            retryable: false
        });
    }
    let totalBytes = 0;
    return attachments.map((attachment) => {
        const filename = requireString(attachment?.filename, 'Nom de pièce jointe')
            .replace(/[^A-Za-z0-9._-]/g, '_')
            .slice(0, 120);
        const content = Buffer.isBuffer(attachment?.content)
            ? attachment.content
            : attachment?.content instanceof Uint8Array
                ? Buffer.from(attachment.content)
                : null;
        if (!content || !content.length) {
            throw new EmailProviderError('Contenu de pièce jointe invalide.', {
                code: 'EMAIL_ATTACHMENT_CONTENT_INVALID',
                retryable: false
            });
        }
        totalBytes += content.length;
        if (totalBytes > MAX_ATTACHMENT_BYTES) {
            throw new EmailProviderError('Pièces jointes trop volumineuses.', {
                code: 'EMAIL_ATTACHMENTS_TOO_LARGE',
                retryable: false
            });
        }
        const contentType = String(attachment?.contentType || 'application/octet-stream')
            .trim()
            .toLowerCase();
        if (contentType !== 'application/pdf') {
            throw new EmailProviderError('Type de pièce jointe refusé.', {
                code: 'EMAIL_ATTACHMENT_TYPE_INVALID',
                retryable: false
            });
        }
        return { filename, content, contentType };
    });
}

function normalizeMessage(message = {}) {
    return {
        from: requireString(message.from, 'Expediteur'),
        to: message.to,
        subject: requireString(message.subject, 'Objet'),
        html: message.html,
        text: message.text,
        cc: message.cc,
        bcc: message.bcc,
        replyTo: message.replyTo || message.reply_to,
        attachments: normalizeAttachments(message.attachments)
    };
}

function createGmailEmailSender({ user, password, nodemailerImpl = nodemailer } = {}) {
    const gmailUser = requireString(user, 'Compte Gmail');
    const gmailPassword = requireString(password, 'Mot de passe Gmail');
    const transporter = nodemailerImpl.createTransport({
        service: 'gmail',
        disableFileAccess: true,
        disableUrlAccess: true,
        pool: true,
        maxConnections: 2,
        maxMessages: 100,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        auth: {
            user: gmailUser,
            pass: gmailPassword
        }
    });

    return {
        provider: 'gmail',
        async send(message) {
            try {
                const result = await transporter.sendMail(normalizeMessage(message));
                return {
                    provider: 'gmail',
                    id: result?.messageId || null
                };
            } catch (error) {
                throw new EmailProviderError('Echec du transport Gmail.', {
                    code: error?.code || 'GMAIL_SEND_FAILED',
                    provider: 'gmail',
                    responseCode: error?.responseCode || null,
                    retryable: error?.code !== 'EAUTH' && error?.responseCode !== 535,
                    cause: error
                });
            }
        }
    };
}

function createResendEmailSender({
    apiKey,
    fetchImpl = globalThis.fetch,
    endpoint = RESEND_EMAIL_ENDPOINT,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs))
} = {}) {
    const resendApiKey = requireString(apiKey, 'Cle API Resend');
    if (typeof fetchImpl !== 'function') {
        throw new EmailProviderError('Client HTTP indisponible.', {
            code: 'EMAIL_PROVIDER_CONFIG',
            provider: 'resend',
            retryable: false
        });
    }

    const attempts = Math.max(1, Math.min(Number(maxAttempts) || 1, 2));
    const requestTimeoutMs = Math.max(1000, Math.min(Number(timeoutMs) || DEFAULT_TIMEOUT_MS, 10000));

    return {
        provider: 'resend',
        async send(message, options = {}) {
            const normalizedMessage = normalizeMessage(message);
            const idempotencyKey = normalizeIdempotencyKey(options.idempotencyKey);
            const payload = {
                from: normalizedMessage.from,
                to: normalizedMessage.to,
                subject: normalizedMessage.subject
            };
            if (normalizedMessage.html !== undefined) payload.html = normalizedMessage.html;
            if (normalizedMessage.text !== undefined) payload.text = normalizedMessage.text;
            if (normalizedMessage.cc !== undefined) payload.cc = normalizedMessage.cc;
            if (normalizedMessage.bcc !== undefined) payload.bcc = normalizedMessage.bcc;
            if (normalizedMessage.replyTo !== undefined) payload.reply_to = normalizedMessage.replyTo;
            if (normalizedMessage.attachments !== undefined) {
                payload.attachments = normalizedMessage.attachments.map((attachment) => ({
                    filename: attachment.filename,
                    content: attachment.content.toString('base64')
                }));
            }

            let lastError = null;
            for (let attempt = 1; attempt <= attempts; attempt += 1) {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
                try {
                    const response = await fetchImpl(endpoint, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${resendApiKey}`,
                            'Content-Type': 'application/json',
                            'Idempotency-Key': idempotencyKey
                        },
                        body: JSON.stringify(payload),
                        signal: controller.signal
                    });
                    const responseBody = await response.json().catch(() => ({}));
                    if (response.ok) {
                        return {
                            provider: 'resend',
                            id: responseBody?.id || null
                        };
                    }

                    const retryable = RETRYABLE_STATUS_CODES.has(response.status);
                    lastError = new EmailProviderError('Echec de l API Resend.', {
                        code: responseBody?.name || responseBody?.code || 'RESEND_SEND_FAILED',
                        provider: 'resend',
                        responseCode: response.status,
                        retryable
                    });
                    if (!retryable || attempt >= attempts) throw lastError;
                } catch (error) {
                    if (error instanceof EmailProviderError) {
                        if (!error.retryable || attempt >= attempts) throw error;
                        lastError = error;
                    } else {
                        lastError = new EmailProviderError('Resend temporairement indisponible.', {
                            code: error?.name === 'AbortError' ? 'RESEND_TIMEOUT' : 'RESEND_NETWORK_ERROR',
                            provider: 'resend',
                            retryable: true,
                            cause: error
                        });
                        if (attempt >= attempts) throw lastError;
                    }
                } finally {
                    clearTimeout(timeout);
                }

                await sleep(150 * attempt);
            }

            throw lastError;
        }
    };
}

function createTransactionalEmailSender(options = {}) {
    const provider = String(options.provider || 'gmail').trim().toLowerCase();
    if (provider === 'gmail') return createGmailEmailSender(options.gmail);
    if (provider === 'resend') return createResendEmailSender(options.resend);
    throw new EmailProviderError('Provider email non supporte.', {
        code: 'EMAIL_PROVIDER_UNSUPPORTED',
        provider,
        retryable: false
    });
}

module.exports = {
    EmailProviderError,
    MAX_ATTACHMENT_BYTES,
    createGmailEmailSender,
    createResendEmailSender,
    createTransactionalEmailSender,
    normalizeAttachments,
    normalizeMessage
};
