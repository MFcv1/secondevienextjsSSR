'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
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
const PUBLIC_RUNTIME = { enforceAppCheck: true, timeoutSeconds: 60, memory: '256MB' };
const ACCOUNT_RUNTIME = { enforceAppCheck: true, timeoutSeconds: 30, memory: '256MB' };
const EMAIL_SECRETS = [GMAIL_EMAIL, GMAIL_PASSWORD, RESEND_API_KEY];
const NEWSLETTER_GEN2_RUNTIME = Object.freeze({
    region: 'europe-west1',
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: 'newsletter-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    enforceAppCheck: true
});

const { createNewsletterHandlers } = require('./newsletterHandlers.cjs');
const { drawNewsletterRewardHandler, claimNewsletterRewardHandler, listMyNewsletterRewardsHandler } = createNewsletterHandlers({
    admin, HttpsError: functions.https.HttpsError, getRateLimitClientIp, getSiteUrl,
    getEmailRuntime: () => createTransactionalEmailRuntime({
        provider: TRANSACTIONAL_EMAIL_PROVIDER.value(), gmailUser: GMAIL_EMAIL.value(),
        gmailPassword: GMAIL_PASSWORD.value(), resendApiKey: RESEND_API_KEY.value(), resendFromEmail: RESEND_FROM_EMAIL.value()
    })
});

const drawNewsletterReward = regionalFunctions().runWith(PUBLIC_RUNTIME).https.onCall(drawNewsletterRewardHandler);
const claimNewsletterReward = regionalFunctions()
    .runWith({ ...PUBLIC_RUNTIME, secrets: EMAIL_SECRETS })
    .https.onCall(claimNewsletterRewardHandler);
const listMyNewsletterRewards = regionalFunctions().runWith(ACCOUNT_RUNTIME).https.onCall(listMyNewsletterRewardsHandler);

module.exports = {
    claimNewsletterReward,
    claimNewsletterRewardGen2: onCall(
        { ...NEWSLETTER_GEN2_RUNTIME, secrets: EMAIL_SECRETS },
        async (request) => claimNewsletterRewardHandler(request.data, request)
    ),
    claimNewsletterRewardHandler,
    drawNewsletterReward,
    drawNewsletterRewardGen2: onCall(NEWSLETTER_GEN2_RUNTIME, async (request) => drawNewsletterRewardHandler(request.data, request)),
    drawNewsletterRewardHandler,
    listMyNewsletterRewards,
    listMyNewsletterRewardsGen2: onCall(
        { ...NEWSLETTER_GEN2_RUNTIME, timeoutSeconds: 30 },
        async (request) => listMyNewsletterRewardsHandler(request.data, request)
    ),
    listMyNewsletterRewardsHandler
};
