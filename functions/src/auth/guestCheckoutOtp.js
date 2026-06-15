const crypto = require('crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const nodemailer = require('nodemailer');
const { GMAIL_EMAIL, GMAIL_PASSWORD } = require('../../helpers/secrets');
const { getSiteUrl } = require('../../helpers/config');
const { timestampFromNow, SYSTEM_DOC_RETENTION_DAYS } = require('../analytics/constants');

const db = admin.firestore();

const OTP_TTL_MS = 10 * 60 * 1000;
const VERIFIED_TTL_MS = 30 * 60 * 1000;
const MIN_RESEND_MS = 60 * 1000;
const MAX_EMAIL_SENDS_PER_HOUR = 5;
const MAX_IP_SENDS_PER_HOUR = 20;
const MAX_VERIFY_ATTEMPTS = 5;

function normalizeEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) {
        throw new functions.https.HttpsError('invalid-argument', 'Email invalide.');
    }
    return normalized;
}

function normalizeCode(code) {
    const normalized = String(code || '').replace(/\D/g, '');
    if (!/^\d{6}$/.test(normalized)) {
        throw new functions.https.HttpsError('invalid-argument', 'Code invalide.');
    }
    return normalized;
}

function sha256(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function createCheckoutOtpToken() {
    return crypto.randomBytes(32).toString('base64url');
}

function hashOtp(email, code) {
    const secret = GMAIL_PASSWORD.value();
    if (!secret) {
        throw new functions.https.HttpsError('failed-precondition', 'Configuration email incomplete.');
    }
    return crypto
        .createHmac('sha256', secret)
        .update(`${email}:${code}`)
        .digest('hex');
}

function getOtpRef(email) {
    return db.doc(`sys_ratelimit/guest_checkout_otp_${sha256(email)}`);
}

function getIpRef(context) {
    const ip = context.rawRequest?.ip || context.rawRequest?.headers?.['x-forwarded-for'] || 'unknown';
    return db.doc(`sys_ratelimit/guest_checkout_otp_ip_${sha256(ip)}`);
}

function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: GMAIL_EMAIL.value(),
            pass: GMAIL_PASSWORD.value()
        }
    });
}

function buildEmailHtml(code) {
    const siteUrl = getSiteUrl();
    return `
        <div style="font-family: sans-serif; color: #1c1917; max-width: 560px;">
            <h1 style="margin:0 0 16px;">Code de validation</h1>
            <p>Votre code de validation Seconde Vie est :</p>
            <p style="font-size:32px; letter-spacing:8px; font-weight:700; margin:24px 0;">${code}</p>
            <p>Ce code expire dans 10 minutes. Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
            <p style="color:#78716c;font-size:12px;">${siteUrl}</p>
        </div>
    `;
}

async function clearOtpAfterMailFailure(emailRef, error) {
    await emailRef.set({
        otpHash: admin.firestore.FieldValue.delete(),
        expiresAt: admin.firestore.FieldValue.delete(),
        expiresAtMillis: admin.firestore.FieldValue.delete(),
        nextSendAtMillis: admin.firestore.FieldValue.delete(),
        lastMailErrorAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMailErrorCode: error?.code || null,
        lastMailErrorResponseCode: error?.responseCode || null,
        expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
    }, { merge: true });
}

function mapMailError(error) {
    console.error('Guest checkout OTP mail error:', {
        code: error?.code || null,
        responseCode: error?.responseCode || null,
        command: error?.command || null
    });

    if (error?.code === 'EAUTH' || error?.responseCode === 535) {
        return new functions.https.HttpsError(
            'failed-precondition',
            "Configuration email invalide. Verifiez le mot de passe d'application Gmail."
        );
    }

    return new functions.https.HttpsError(
        'unavailable',
        "Impossible d'envoyer le code pour le moment. Reessayez dans quelques instants."
    );
}

exports.sendGuestCheckoutOtp = functions
    .runWith({ secrets: [GMAIL_EMAIL, GMAIL_PASSWORD] })
    .https.onCall(async (data, context) => {
        const email = normalizeEmail(data?.email);
        const adminEmail = GMAIL_EMAIL.value();
        const gmailPassword = GMAIL_PASSWORD.value();
        if (!adminEmail || !gmailPassword) {
            throw new functions.https.HttpsError('failed-precondition', 'Configuration email incomplete.');
        }

        const code = String(crypto.randomInt(100000, 1000000));
        const now = Date.now();
        const expiresAtMillis = now + OTP_TTL_MS;
        const emailRef = getOtpRef(email);
        const ipRef = getIpRef(context);

        await db.runTransaction(async (tx) => {
            const [emailSnap, ipSnap] = await Promise.all([tx.get(emailRef), tx.get(ipRef)]);
            const emailState = emailSnap.exists ? emailSnap.data() : {};
            const ipState = ipSnap.exists ? ipSnap.data() : {};

            if (emailState.nextSendAtMillis && now < emailState.nextSendAtMillis) {
                throw new functions.https.HttpsError('resource-exhausted', 'Patientez avant de demander un nouveau code.');
            }

            const emailWindowResetAt = emailState.sendWindowResetAtMillis || 0;
            const emailSendCount = now < emailWindowResetAt ? Number(emailState.sendCount || 0) : 0;
            if (emailSendCount >= MAX_EMAIL_SENDS_PER_HOUR) {
                throw new functions.https.HttpsError('resource-exhausted', 'Trop de codes demandes pour cet email. Reessayez plus tard.');
            }

            const ipWindowResetAt = ipState.sendWindowResetAtMillis || 0;
            const ipSendCount = now < ipWindowResetAt ? Number(ipState.sendCount || 0) : 0;
            if (ipSendCount >= MAX_IP_SENDS_PER_HOUR) {
                throw new functions.https.HttpsError('resource-exhausted', 'Trop de codes demandes. Reessayez plus tard.');
            }

            tx.set(emailRef, {
                emailHash: sha256(email),
                otpHash: hashOtp(email, code),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: admin.firestore.Timestamp.fromMillis(expiresAtMillis),
                expiresAtMillis,
                nextSendAtMillis: now + MIN_RESEND_MS,
                sendCount: emailSendCount + 1,
                sendWindowResetAtMillis: now < emailWindowResetAt ? emailWindowResetAt : now + 60 * 60 * 1000,
                attempts: 0,
                verifiedAt: admin.firestore.FieldValue.delete(),
                verifiedAtMillis: admin.firestore.FieldValue.delete(),
                verifiedExpiresAtMillis: admin.firestore.FieldValue.delete(),
                verifiedUid: admin.firestore.FieldValue.delete(),
                lastUid: context.auth?.uid || null,
                expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
            }, { merge: true });

            tx.set(ipRef, {
                sendCount: ipSendCount + 1,
                sendWindowResetAtMillis: now < ipWindowResetAt ? ipWindowResetAt : now + 60 * 60 * 1000,
                expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
            }, { merge: true });
        });

        const transporter = createTransporter();
        try {
            await transporter.sendMail({
                from: `Seconde Vie <${adminEmail}>`,
                to: email,
                subject: 'Votre code de validation Seconde Vie',
                html: buildEmailHtml(code)
            });
        } catch (error) {
            await clearOtpAfterMailFailure(emailRef, error).catch((cleanupError) => {
                console.error('Guest checkout OTP cleanup error:', cleanupError);
            });
            throw mapMailError(error);
        }

        return { success: true, expiresInSeconds: Math.floor(OTP_TTL_MS / 1000), resendAfterSeconds: Math.floor(MIN_RESEND_MS / 1000) };
    });

exports.verifyGuestCheckoutOtp = functions
    .runWith({ secrets: [GMAIL_PASSWORD] })
    .https.onCall(async (data, context) => {
        const email = normalizeEmail(data?.email);
        const code = normalizeCode(data?.code);
        const now = Date.now();
        const otpRef = getOtpRef(email);
        const checkoutOtpToken = createCheckoutOtpToken();
        const checkoutOtpTokenHash = sha256(checkoutOtpToken);

        await db.runTransaction(async (tx) => {
            const snap = await tx.get(otpRef);
            if (!snap.exists) {
                throw new functions.https.HttpsError('failed-precondition', 'Code invalide ou expire.');
            }

            const state = snap.data();
            if (!state.expiresAtMillis || now > state.expiresAtMillis) {
                throw new functions.https.HttpsError('deadline-exceeded', 'Code expire.');
            }
            if (Number(state.attempts || 0) >= MAX_VERIFY_ATTEMPTS) {
                throw new functions.https.HttpsError('resource-exhausted', 'Trop de tentatives. Demandez un nouveau code.');
            }

            const expectedHash = state.otpHash || '';
            const receivedHash = hashOtp(email, code);
            const isValid = expectedHash.length === receivedHash.length &&
                crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(receivedHash));

            if (!isValid) {
                tx.update(otpRef, {
                    attempts: admin.firestore.FieldValue.increment(1),
                    expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
                });
                throw new functions.https.HttpsError('permission-denied', 'Code invalide.');
            }

            tx.update(otpRef, {
                attempts: 0,
                verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                verifiedAtMillis: now,
                verifiedExpiresAtMillis: now + VERIFIED_TTL_MS,
                verifiedUid: context.auth?.uid || null,
                verifiedTokenHash: checkoutOtpTokenHash,
                otpHash: admin.firestore.FieldValue.delete(),
                expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
            });
        });

        return { success: true, checkoutOtpToken, verifiedForSeconds: Math.floor(VERIFIED_TTL_MS / 1000) };
    });

async function assertGuestCheckoutOtpVerified(uid, email, checkoutOtpToken) {
    const normalizedEmail = normalizeEmail(email);
    const snap = await getOtpRef(normalizedEmail).get();
    if (!snap.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'Veuillez valider votre email avant de passer commande.');
    }

    const state = snap.data();
    if (!state.verifiedExpiresAtMillis || Date.now() > state.verifiedExpiresAtMillis) {
        throw new functions.https.HttpsError('failed-precondition', 'Validation email expiree. Veuillez demander un nouveau code.');
    }

    if (uid && state.verifiedUid === uid) {
        return normalizedEmail;
    }

    const receivedTokenHash = checkoutOtpToken ? sha256(checkoutOtpToken) : '';
    if (!state.verifiedTokenHash || receivedTokenHash !== state.verifiedTokenHash) {
        throw new functions.https.HttpsError('failed-precondition', 'Veuillez valider votre email avant de passer commande.');
    }

    return normalizedEmail;
}

module.exports.assertGuestCheckoutOtpVerified = assertGuestCheckoutOtpVerified;
module.exports.normalizeGuestCheckoutEmail = normalizeEmail;
