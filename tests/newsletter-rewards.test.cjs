'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  createRewardCode,
  drawRewardPercentage,
  normalizeEmail,
  rewardDocumentId,
  serializeReward,
  subscriberDocumentId,
} = require('../functions/src/newsletter/newsletterRewardDomain');
const { newsletterRewardEmail } = require('../functions/src/newsletter/newsletterRewardEmail');

const root = path.resolve(__dirname, '..');
const source = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('newsletter: le tirage pondéré est borné et décidé par le domaine serveur', () => {
  assert.equal(drawRewardPercentage(0), 5);
  assert.equal(drawRewardPercentage(54), 5);
  assert.equal(drawRewardPercentage(55), 10);
  assert.equal(drawRewardPercentage(84), 10);
  assert.equal(drawRewardPercentage(85), 15);
  assert.equal(drawRewardPercentage(99), 15);
  assert.throws(() => drawRewardPercentage(100), /Tirage invalide/);
});

test('newsletter: identifiants et code ne révèlent pas l’adresse e-mail', () => {
  const email = normalizeEmail(' Client@Example.com ');
  assert.equal(email, 'client@example.com');
  assert.match(subscriberDocumentId(email), /^subscriber_[a-f0-9]{40}$/);
  assert.doesNotMatch(subscriberDocumentId(email), /client|example/);
  assert.match(rewardDocumentId('123e4567-e89b-12d3-a456-426614174000'), /^reward_[a-f0-9]{40}$/);
  const code = createRewardCode(10, () => Buffer.from([0, 1, 2, 3, 4, 5]));
  assert.equal(code, 'SV10-ABCDEF');
});

test('newsletter: la projection client reste minimale', () => {
  const reward = serializeReward('reward_123', {
    code: 'SV15-Z9K7PX',
    percentage: 15,
    emailLower: 'client@example.com',
    emailHash: 'secret-hash',
    status: 'active',
    emailDelivery: { status: 'sent', providerMessageId: 'provider-secret' },
    createdAt: '2026-08-10T10:00:00.000Z',
    expiresAt: '2026-09-09T10:00:00.000Z',
  });
  assert.deepEqual(reward, {
    rewardId: 'reward_123',
    code: 'SV15-Z9K7PX',
    percentage: 15,
    status: 'active',
    campaign: 'newsletter_welcome_2026',
    emailStatus: 'sent',
    createdAt: '2026-08-10T10:00:00.000Z',
    expiresAt: '2026-09-09T10:00:00.000Z',
  });
});

test('newsletter: le message livre le même code et mène vers les avantages client', () => {
  const message = newsletterRewardEmail({
    code: 'SV10-ABCDEF',
    percentage: 10,
    emailLower: 'client@example.com',
    expiresAt: '2026-09-09T10:00:00.000Z',
  }, 'sender@example.com', 'https://sandbox.example');
  assert.equal(message.to, 'client@example.com');
  assert.match(message.subject, /10 %/);
  assert.match(message.html, /SV10-ABCDEF/);
  assert.match(message.html, /mes-commandes#avantages/);
  assert.doesNotMatch(message.html, /providerMessageId|emailHash/);
});

test('newsletter: interface, Functions et Rules utilisent le parcours durable', () => {
  const interactions = source('src/kit/marketplace/GalleryFixedSectionsInteractions.jsx');
  const account = source('src/kit/commerce/MyOrdersView.jsx');
  const functionsIndex = source('functions/index.js');
  const rules = source('firestore.rules');

  assert.match(interactions, /drawNewsletterReward/);
  assert.match(interactions, /claimNewsletterReward/);
  assert.doesNotMatch(interactions, /drawPrizeLocally/);
  assert.doesNotMatch(interactions, /SV\$\{prize\}/);
  assert.match(account, /listMyNewsletterRewards/);
  assert.match(account, /id="avantages"/);
  for (const callable of ['drawNewsletterReward', 'claimNewsletterReward', 'listMyNewsletterRewards']) {
    assert.match(functionsIndex, new RegExp(`exports\\.${callable}`));
  }
  assert.match(rules, /match \/newsletter_reward_plays\/\{docId\} \{\s*allow read, write: if false;/);
  assert.match(rules, /match \/newsletter_rewards\/\{docId\} \{\s*allow read, write: if false;/);
});
