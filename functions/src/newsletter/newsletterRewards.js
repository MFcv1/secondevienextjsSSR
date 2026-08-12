'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { getRateLimitClientIp } = require('../../helpers/clientIp');
const { regionalFunctions } = require('../../helpers/runtime');
const { getSiteUrl } = require('../../helpers/config');
const {
    GMAIL_EMAIL,
    GMAIL_PASSWORD,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    TRANSACTIONAL_EMAIL_PROVIDER
} = require('../../helpers/secrets');
const { createTransactionalEmailRuntime } = require('../email/transactionalEmailRuntime');
const {
    createRewardCode,
    drawRewardPercentage,
    normalizeCardIndex,
    normalizeConsent,
    normalizeEmail,
    normalizePlayId,
    rewardDocumentId,
    rewardPlayId,
    serializeReward,
    sha256,
    subscriberDocumentId
} = require('./newsletterRewardDomain');
const { newsletterRewardEmail } = require('./newsletterRewardEmail');

const db = admin.firestore();
const PLAYS_COLLECTION = 'newsletter_reward_plays';
const REWARDS_COLLECTION = 'newsletter_rewards';
const SUBSCRIBERS_COLLECTION = 'newsletter_subscribers';
const PLAY_TTL_MS = 20 * 60 * 1000;
const REWARD_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const EMAIL_LEASE_MS = 2 * 60 * 1000;
const PUBLIC_RUNTIME = { enforceAppCheck: true, timeoutSeconds: 60, memory: '256MB' };
const ACCOUNT_RUNTIME = { enforceAppCheck: true, timeoutSeconds: 30, memory: '256MB' };
const EMAIL_SECRETS = [GMAIL_EMAIL, GMAIL_PASSWORD, RESEND_API_KEY];

function callableError(error, fallback = 'Le jeu newsletter n’a pas pu être traité.') {
    if (error instanceof functions.https.HttpsError) return error;
    if (String(error?.code || '').startsWith('NEWSLETTER_')) {
        return new functions.https.HttpsError('invalid-argument', error.message);
    }
    console.error('Newsletter reward operation failed', {
        code: String(error?.code || error?.message || 'unknown').slice(0, 120)
    });
    return new functions.https.HttpsError('internal', fallback);
}

function clientIp(context) {
    return getRateLimitClientIp(context);
}

function rateLimitRef(scope, value) {
    return db.doc(`sys_ratelimit/newsletter_${scope}_${sha256(value)}`);
}

async function consumeRateLimit(scope, value, limit, windowMs) {
    const ref = rateLimitRef(scope, value);
    const now = admin.firestore.Timestamp.now();
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists ? snapshot.data() : {};
        const windowStartedAt = current.windowStartedAt?.toMillis?.() || 0;
        const sameWindow = windowStartedAt > 0 && now.toMillis() - windowStartedAt < windowMs;
        const count = sameWindow ? Number(current.count || 0) : 0;
        if (count >= limit) {
            throw new functions.https.HttpsError('resource-exhausted', 'Trop de tentatives. Réessayez un peu plus tard.');
        }
        transaction.set(ref, {
            scope,
            count: count + 1,
            windowStartedAt: sameWindow ? current.windowStartedAt : now,
            updatedAt: now,
            expiresAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + (2 * windowMs))
        });
    });
}

function requireVerifiedCustomer(context) {
    if (!context.auth?.uid || context.auth.token.email_verified !== true) {
        throw new functions.https.HttpsError('unauthenticated', 'Connectez-vous pour retrouver vos avantages.');
    }
    const email = normalizeEmail(context.auth.token.email);
    return { uid: context.auth.uid, email, emailHash: sha256(email) };
}

async function drawNewsletterRewardHandler(data, context) {
    try {
        const playId = normalizePlayId(data?.playId);
        const cardIndex = normalizeCardIndex(data?.cardIndex);
        const playRef = db.collection(PLAYS_COLLECTION).doc(rewardPlayId(playId));
        const existing = await playRef.get();
        if (existing.exists) {
            const value = existing.data();
            return { percentage: Number(value.percentage), expiresAt: value.expiresAt?.toDate?.().toISOString() || null };
        }

        await consumeRateLimit('draw_ip', clientIp(context), 20, 60 * 60 * 1000);
        const now = admin.firestore.Timestamp.now();
        const percentage = drawRewardPercentage(crypto.randomInt(0, 100));
        const document = {
            playHash: sha256(playId),
            cardIndex,
            percentage,
            status: 'awaiting_email',
            createdAt: now,
            expiresAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + PLAY_TTL_MS)
        };
        try {
            await playRef.create(document);
        } catch (error) {
            if (error?.code !== 6 && error?.code !== 'already-exists') throw error;
            const raced = await playRef.get();
            if (!raced.exists) throw error;
            return {
                percentage: Number(raced.data().percentage),
                expiresAt: raced.data().expiresAt?.toDate?.().toISOString() || null
            };
        }
        return { percentage, expiresAt: document.expiresAt.toDate().toISOString() };
    } catch (error) {
        throw callableError(error);
    }
}

async function claimNewsletterRewardHandler(data, context) {
    try {
        const playId = normalizePlayId(data?.playId);
        const email = normalizeEmail(data?.email);
        normalizeConsent(data?.consent);
        await Promise.all([
            consumeRateLimit('claim_email', email, 5, 24 * 60 * 60 * 1000),
            consumeRateLimit('claim_ip', clientIp(context), 20, 24 * 60 * 60 * 1000)
        ]);

        const playRef = db.collection(PLAYS_COLLECTION).doc(rewardPlayId(playId));
        const rewardRef = db.collection(REWARDS_COLLECTION).doc(rewardDocumentId(playId));
        const subscriberRef = db.collection(SUBSCRIBERS_COLLECTION).doc(subscriberDocumentId(email));
        const emailHash = sha256(email);
        const now = admin.firestore.Timestamp.now();
        let reward = null;
        let shouldSend = false;

        await db.runTransaction(async (transaction) => {
            const [playSnapshot, rewardSnapshot, subscriberSnapshot] = await Promise.all([
                transaction.get(playRef),
                transaction.get(rewardRef),
                transaction.get(subscriberRef)
            ]);
            if (!playSnapshot.exists) {
                throw new functions.https.HttpsError('not-found', 'Cette partie a expiré. Retournez une nouvelle carte.');
            }
            const play = playSnapshot.data();
            if ((play.expiresAt?.toMillis?.() || 0) < now.toMillis() && !rewardSnapshot.exists) {
                throw new functions.https.HttpsError('deadline-exceeded', 'Cette partie a expiré. Retournez une nouvelle carte.');
            }

            if (rewardSnapshot.exists) {
                reward = rewardSnapshot.data();
                if (reward.emailHash !== emailHash) {
                    throw new functions.https.HttpsError('failed-precondition', 'Cette carte a déjà été enregistrée.');
                }
                const delivery = reward.emailDelivery || {};
                const leaseIsFresh = delivery.status === 'sending'
                    && (delivery.startedAt?.toMillis?.() || 0) > now.toMillis() - EMAIL_LEASE_MS;
                shouldSend = delivery.status !== 'sent' && !leaseIsFresh;
                if (shouldSend) {
                    reward = {
                        ...reward,
                        emailDelivery: {
                            status: 'sending',
                            startedAt: now,
                            attemptCount: Number(delivery.attemptCount || 0) + 1
                        }
                    };
                    transaction.update(rewardRef, { emailDelivery: reward.emailDelivery, updatedAt: now });
                }
            } else {
                const authenticatedEmail = String(context.auth?.token?.email || '').trim().toLowerCase();
                const ownerUid = context.auth?.uid && authenticatedEmail === email
                    && context.auth.token.email_verified === true
                    ? context.auth.uid
                    : null;
                reward = {
                    code: createRewardCode(play.percentage),
                    percentage: Number(play.percentage),
                    campaign: 'newsletter_welcome_2026',
                    status: 'active',
                    emailLower: email,
                    emailHash,
                    ownerUid,
                    playId: playRef.id,
                    createdAt: now,
                    updatedAt: now,
                    expiresAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + REWARD_TTL_MS),
                    emailDelivery: { status: 'sending', startedAt: now, attemptCount: 1 }
                };
                transaction.create(rewardRef, reward);
                transaction.update(playRef, { status: 'claimed', claimedAt: now, rewardId: rewardRef.id });
                shouldSend = true;
            }

            const subscriberData = {
                contactInfo: email,
                emailLower: email,
                emailHash,
                source: 'gallery_game',
                consent: { newsletter: true, recordedAt: now },
                status: 'subscribed',
                lastRewardAt: now,
                updatedAt: now
            };
            if (!subscriberSnapshot.exists) subscriberData.createdAt = now;
            transaction.set(subscriberRef, subscriberData, { merge: true });
        });

        if (shouldSend) {
            try {
                const runtime = createTransactionalEmailRuntime({
                    provider: TRANSACTIONAL_EMAIL_PROVIDER.value(),
                    gmailUser: GMAIL_EMAIL.value(),
                    gmailPassword: GMAIL_PASSWORD.value(),
                    resendApiKey: RESEND_API_KEY.value(),
                    resendFromEmail: RESEND_FROM_EMAIL.value()
                });
                const result = await runtime.sender.send(
                    newsletterRewardEmail(reward, runtime.fromAddress, getSiteUrl()),
                    { idempotencyKey: `newsletter-reward/${rewardRef.id}` }
                );
                await rewardRef.set({
                    emailDelivery: {
                        status: 'sent',
                        provider: result.provider,
                        providerMessageId: result.id || null,
                        completedAt: admin.firestore.FieldValue.serverTimestamp()
                    },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                reward.emailDelivery = { status: 'sent' };
            } catch (error) {
                console.error('Newsletter reward email failed', {
                    rewardId: rewardRef.id,
                    code: String(error?.code || error?.message || 'unknown').slice(0, 120)
                });
                await rewardRef.set({
                    emailDelivery: {
                        status: 'failed',
                        errorCode: String(error?.code || 'SEND_FAILED').slice(0, 120),
                        completedAt: admin.firestore.FieldValue.serverTimestamp()
                    },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                reward.emailDelivery = { status: 'failed' };
            }
        }

        return { reward: serializeReward(rewardRef.id, reward) };
    } catch (error) {
        throw callableError(error);
    }
}

async function listMyNewsletterRewardsHandler(_data, context) {
    try {
        const customer = requireVerifiedCustomer(context);
        const snapshot = await db.collection(REWARDS_COLLECTION)
            .where('emailHash', '==', customer.emailHash)
            .limit(50)
            .get();
        const rewards = snapshot.docs
            .map((entry) => serializeReward(entry.id, entry.data()))
            .sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')))
            .slice(0, 20);
        return { rewards };
    } catch (error) {
        throw callableError(error, 'Vos avantages n’ont pas pu être chargés.');
    }
}

const drawNewsletterReward = regionalFunctions().runWith(PUBLIC_RUNTIME).https.onCall(drawNewsletterRewardHandler);
const claimNewsletterReward = regionalFunctions()
    .runWith({ ...PUBLIC_RUNTIME, secrets: EMAIL_SECRETS })
    .https.onCall(claimNewsletterRewardHandler);
const listMyNewsletterRewards = regionalFunctions().runWith(ACCOUNT_RUNTIME).https.onCall(listMyNewsletterRewardsHandler);

module.exports = {
    claimNewsletterReward,
    claimNewsletterRewardHandler,
    drawNewsletterReward,
    drawNewsletterRewardHandler,
    listMyNewsletterRewards,
    listMyNewsletterRewardsHandler
};
