const crypto = require('crypto');
const admin = require('firebase-admin');
const { functions, regionalFunctions, logFunctionPerf } = require('../../helpers/runtime');
const { OTP_HMAC_SECRET } = require('../../helpers/secrets');
const { getSiteUrl } = require('../../helpers/config');
const { timestampFromNow, SYSTEM_DOC_RETENTION_DAYS } = require('../analytics/constants');
const {
    TRANSACTIONAL_EMAIL_SECRETS,
    getTransactionalEmailRuntime
} = require('../email/transactionalEmailRuntime');
const { renderOtpEmail } = require('../email/otpEmailTemplates');

const db = admin.firestore();

const OTP_TTL_MS = 10 * 60 * 1000;
const MIN_RESEND_MS = 60 * 1000;
const MAX_EMAIL_SENDS_PER_HOUR = 5;
const MAX_IP_SENDS_PER_HOUR = 20;
const MAX_VERIFY_ATTEMPTS = 5;
const OPERATION_LEASE_MS = 30 * 1000;
const MAX_OPERATION_RETRIES = 1;

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

function hashOtp(email, code) {
    const secret = OTP_HMAC_SECRET.value();
    if (!secret) {
        throw new functions.https.HttpsError('failed-precondition', 'Configuration OTP incomplete.');
    }
    return crypto
        .createHmac('sha256', secret)
        .update(`customer-login:${email}:${code}`)
        .digest('hex');
}

function hashVerificationResponse(email, code) {
    const secret = OTP_HMAC_SECRET.value();
    if (!secret) {
        throw new functions.https.HttpsError('failed-precondition', 'Configuration OTP incomplete.');
    }
    return crypto
        .createHmac('sha256', secret)
        .update(`customer-login-response:${email}:${code}`)
        .digest('hex');
}

function timingSafeHashEqual(expected, received) {
    return typeof expected === 'string'
        && expected.length === received.length
        && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

function getOtpRef(email) {
    return db.doc(`sys_ratelimit/customer_login_otp_${sha256(email)}`);
}

function getIpRef(context) {
    const ip = context.rawRequest?.ip || context.rawRequest?.headers?.['x-forwarded-for'] || 'unknown';
    return db.doc(`sys_ratelimit/customer_login_otp_ip_${sha256(ip)}`);
}

function buildEmailHtml(code) {
    return renderOtpEmail({
        variant: 'login',
        code,
        siteUrl: getSiteUrl()
    }).html;
}

function buildEmailText(code) {
    return renderOtpEmail({
        variant: 'login',
        code,
        siteUrl: getSiteUrl()
    }).text;
}

async function clearOtpAfterMailFailure(emailRef, error) {
    await emailRef.set({
        otpHash: admin.firestore.FieldValue.delete(),
        expiresAtMillis: admin.firestore.FieldValue.delete(),
        nextSendAtMillis: admin.firestore.FieldValue.delete(),
        lastMailErrorAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMailErrorCode: error?.code || null,
        lastMailErrorResponseCode: error?.responseCode || null,
        expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
    }, { merge: true });
}

function mapMailError(error) {
    console.error('Customer login OTP mail error:', {
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

async function getOrCreateCustomerUser(email) {
    let userRecord = null;
    let created = false;
    try {
        userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
        if (error?.code !== 'auth/user-not-found') {
            console.error('Customer OTP user lookup error:', {
                code: error?.code || null,
                message: error?.message || null
            });
            throw new functions.https.HttpsError('unavailable', 'Connexion indisponible pour le moment.');
        }
    }

    if (!userRecord) {
        userRecord = await admin.auth().createUser({
            email,
            emailVerified: true
        });
        created = true;
    } else if (!userRecord.emailVerified) {
        userRecord = await admin.auth().updateUser(userRecord.uid, { emailVerified: true });
    }

    const userProfile = {
        email,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (created) userProfile.role = 'client';

    // Never downgrade an existing admin (or any future role) during OTP login.
    await db.collection('users').doc(userRecord.uid).set(userProfile, { merge: true });

    return userRecord;
}

exports.sendCustomerLoginOtp = regionalFunctions()
    .runWith({ enforceAppCheck: true, secrets: [...TRANSACTIONAL_EMAIL_SECRETS, OTP_HMAC_SECRET] })
    .https.onCall(async (data, context) => {
        const startedAt = Date.now();
        const email = normalizeEmail(data?.email);
        const emailHash = sha256(email);
        let emailRuntime;
        try {
            emailRuntime = getTransactionalEmailRuntime();
        } catch (error) {
            console.error('Customer login email provider configuration error:', error?.code || error?.message || error);
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
                expiresAtMillis,
                nextSendAtMillis: now + MIN_RESEND_MS,
                sendCount: emailSendCount + 1,
                sendWindowResetAtMillis: now < emailWindowResetAt ? emailWindowResetAt : now + 60 * 60 * 1000,
                attempts: 0,
                status: 'active',
                responseHash: admin.firestore.FieldValue.delete(),
                operationUid: admin.firestore.FieldValue.delete(),
                operationStage: admin.firestore.FieldValue.delete(),
                operationLeaseUntilMillis: admin.firestore.FieldValue.delete(),
                operationExpiresAtMillis: expiresAtMillis,
                retryCount: 0,
                tokenIssueCount: 0,
                usedAtMillis: admin.firestore.FieldValue.delete(),
                expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
            }, { merge: true });

            tx.set(ipRef, {
                sendCount: ipSendCount + 1,
                sendWindowResetAtMillis: now < ipWindowResetAt ? ipWindowResetAt : now + 60 * 60 * 1000,
                expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
            }, { merge: true });
        });

        try {
            await emailRuntime.sender.send({
                from: `Seconde Vie <${emailRuntime.fromAddress}>`,
                to: email,
                subject: renderOtpEmail({
                    variant: 'login',
                    code,
                    siteUrl: getSiteUrl()
                }).subject,
                text: buildEmailText(code),
                html: buildEmailHtml(code)
            }, {
                idempotencyKey: `customer-login-otp/${emailHash}/${expiresAtMillis}`
            });
        } catch (error) {
            await clearOtpAfterMailFailure(emailRef, error).catch((cleanupError) => {
                console.error('Customer login OTP cleanup error:', cleanupError);
            });
            logFunctionPerf('sendCustomerLoginOtp', startedAt, {
                phase: 'mail_error',
                emailHash,
                code: error?.code || null,
                responseCode: error?.responseCode || null
            });
            throw mapMailError(error);
        }

        logFunctionPerf('sendCustomerLoginOtp', startedAt, {
            phase: 'success',
            emailHash
        });
        return { success: true, expiresInSeconds: Math.floor(OTP_TTL_MS / 1000), resendAfterSeconds: Math.floor(MIN_RESEND_MS / 1000) };
    });

exports.verifyCustomerLoginOtp = regionalFunctions()
    .runWith({ enforceAppCheck: true, secrets: [OTP_HMAC_SECRET] })
    .https.onCall(async (data) => {
        const startedAt = Date.now();
        const email = normalizeEmail(data?.email);
        const emailHash = sha256(email);
        const code = normalizeCode(data?.code);
        const now = Date.now();
        const otpRef = getOtpRef(email);
        const responseHash = hashVerificationResponse(email, code);

        const verificationResult = await db.runTransaction(async (tx) => {
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

            const status = state.status || (state.usedAtMillis ? 'token_issued' : 'active');
            if (status !== 'active') {
                if (!timingSafeHashEqual(state.responseHash, responseHash)) {
                    throw new functions.https.HttpsError('failed-precondition', 'Code deja utilise.');
                }
                if (!state.operationExpiresAtMillis || now > state.operationExpiresAtMillis) {
                    throw new functions.https.HttpsError('deadline-exceeded', 'Operation de connexion expiree.');
                }
                if (status === 'issuing' && now <= Number(state.operationLeaseUntilMillis || 0)) {
                    throw new functions.https.HttpsError('unavailable', 'Connexion en cours. Reessayez dans quelques secondes.');
                }
                if (Number(state.retryCount || 0) >= MAX_OPERATION_RETRIES) {
                    throw new functions.https.HttpsError('failed-precondition', 'Code deja utilise. Demandez un nouveau code.');
                }

                tx.update(otpRef, {
                    status: 'issuing',
                    operationStage: state.operationUid ? 'token' : 'user',
                    operationLeaseUntilMillis: now + OPERATION_LEASE_MS,
                    retryCount: admin.firestore.FieldValue.increment(1),
                    expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
                });
                return { success: true, uid: state.operationUid || null, resumed: true };
            }

            const expectedHash = state.otpHash || '';
            const receivedHash = hashOtp(email, code);
            const isValid = timingSafeHashEqual(expectedHash, receivedHash);

            if (!isValid) {
                tx.update(otpRef, {
                    attempts: admin.firestore.FieldValue.increment(1),
                    expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
                });
                return {
                    success: false,
                    error: new functions.https.HttpsError('permission-denied', 'Code invalide.')
                };
            }

            tx.update(otpRef, {
                attempts: 0,
                status: 'issuing',
                verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                responseHash,
                operationStage: 'user',
                operationLeaseUntilMillis: now + OPERATION_LEASE_MS,
                operationExpiresAtMillis: state.expiresAtMillis,
                retryCount: 0,
                tokenIssueCount: 0,
                otpHash: admin.firestore.FieldValue.delete(),
                expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
            });

            return { success: true, uid: null, resumed: false };
        });

        if (!verificationResult.success) {
            throw verificationResult.error;
        }

        let uid = verificationResult.uid;
        if (!uid) {
            try {
                const userRecord = await getOrCreateCustomerUser(email);
                uid = userRecord.uid;
                await otpRef.update({
                    operationUid: uid,
                    operationStage: 'token',
                    operationLeaseUntilMillis: Date.now() + OPERATION_LEASE_MS,
                    expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
                });
            } catch (error) {
                await otpRef.update({
                    status: 'failed_retryable',
                    operationStage: 'user',
                    operationLeaseUntilMillis: admin.firestore.FieldValue.delete(),
                    lastOperationErrorCode: error?.code || 'user-step-failed',
                    expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
                }).catch(() => {});
                throw new functions.https.HttpsError('unavailable', 'Connexion interrompue. Ressaisissez le meme code.');
            }
        }

        let token;
        try {
            token = await admin.auth().createCustomToken(uid, {
                signInProvider: 'email_otp',
                authMethod: 'email_otp',
                authAssurance: 'aal1',
                userVerified: false
            });
            await otpRef.update({
                status: 'token_issued',
                usedAtMillis: Date.now(),
                operationStage: admin.firestore.FieldValue.delete(),
                operationLeaseUntilMillis: admin.firestore.FieldValue.delete(),
                tokenIssueCount: admin.firestore.FieldValue.increment(1),
                tokenIssuedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastOperationErrorCode: admin.firestore.FieldValue.delete(),
                expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
            });
        } catch (error) {
            await otpRef.update({
                status: 'failed_retryable',
                operationUid: uid,
                operationStage: 'token',
                operationLeaseUntilMillis: admin.firestore.FieldValue.delete(),
                lastOperationErrorCode: error?.code || 'token-step-failed',
                expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
            }).catch(() => {});
            throw new functions.https.HttpsError('unavailable', 'Connexion interrompue. Ressaisissez le meme code.');
        }

        logFunctionPerf('verifyCustomerLoginOtp', startedAt, {
            phase: 'success',
            emailHash,
            resumed: verificationResult.resumed === true
        });
        return { success: true, token };
    });
