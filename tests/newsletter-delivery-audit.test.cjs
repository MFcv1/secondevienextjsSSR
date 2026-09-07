'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const crypto = require('node:crypto');
const domain = require('../functions/src/newsletter/newsletterRewardDomain');

function harness({ initialStatus = 'failed', acknowledgement = { id: 'local-message', provider: 'fake' }, loseCommitResponse = false } = {}) {
    const email = 'local@example.test';
    const playId = 'a'.repeat(32);
    const rewardId = domain.rewardDocumentId(playId);
    const records = new Map([
        [`plays/${domain.rewardPlayId(playId)}`, {}],
        [`rewards/${rewardId}`, {
            code: 'SV5-LOCAL', emailHash: domain.sha256(email),
            emailDelivery: { status: initialStatus, startedAt: { toMillis: () => 1 } }
        }]
    ]);
    let sends = 0;
    let lost = false;
    const db = {
        collection: (name) => ({ doc: (id) => `${name}/${id}` }),
        runTransaction: async (run) => {
            const writes = [];
            const result = await run({
                get: async (ref) => ({ exists: records.has(ref), data: () => records.get(ref) }),
                set: (ref, value) => writes.push([ref, value]),
                update: (ref, value) => writes.push([ref, value])
            });
            for (const [ref, value] of writes) records.set(ref, { ...records.get(ref), ...value });
            if (loseCommitResponse && !lost && writes.some(([, value]) => value.emailDelivery?.status === 'sent')) {
                lost = true;
                throw new Error('lost success response');
            }
            return result;
        }
    };
    const secret = { value: () => '' };
    const scope = vm.createContext({
        ...domain, db, crypto, PLAYS_COLLECTION: 'plays', REWARDS_COLLECTION: 'rewards', SUBSCRIBERS_COLLECTION: 'subscribers',
        EMAIL_LEASE_MS: 120000, REWARD_TTL_MS: 1000000,
        admin: { firestore: { Timestamp: { now: () => ({ toMillis: () => 1000000, toDate: () => new Date(1000000) }) }, FieldValue: { serverTimestamp: () => 'now' } } },
        consumeRateLimit: async () => {}, clientIp: () => 'local', ensurePromotionMaterialized: async () => {},
        TRANSACTIONAL_EMAIL_PROVIDER: secret, GMAIL_EMAIL: secret, GMAIL_PASSWORD: secret, RESEND_API_KEY: secret, RESEND_FROM_EMAIL: secret,
        newsletterRewardEmail: () => ({}), getSiteUrl: () => 'https://example.test',
        createTransactionalEmailRuntime: () => ({ sender: { send: async () => { sends++; return acknowledgement; } } }),
        callableError: (error) => error, console: { error() {} }
    });
    const source = fs.readFileSync('functions/src/newsletter/newsletterRewards.js', 'utf8');
    vm.runInContext(source.slice(source.indexOf('async function claimNewsletterRewardHandler('), source.indexOf('async function listMyNewsletterRewardsHandler(')), scope);
    return {
        invoke: () => scope.claimNewsletterRewardHandler({ email, playId, consent: true }, {}),
        record: () => records.get(`rewards/${rewardId}`), sends: () => sends
    };
}

test('expired newsletter send claims are frozen and never resent', async () => {
    const h = harness({ initialStatus: 'sending' });
    await h.invoke();
    await h.invoke();
    assert.equal(h.record().emailDelivery.status, 'delivery_unknown');
    assert.equal(h.sends(), 0);
});

test('newsletter invalid acknowledgements and lost database responses preserve delivery uncertainty or durable success', async () => {
    for (const options of [{ acknowledgement: null }, { loseCommitResponse: true }]) {
        const h = harness(options);
        await h.invoke();
        await h.invoke();
        assert.equal(h.record().emailDelivery.status, options.loseCommitResponse ? 'sent' : 'delivery_unknown');
        assert.equal(h.sends(), 1);
    }
});
