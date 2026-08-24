'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const {
  BILLING_GUIDE_STEPS,
  assertBillingGuideTransition,
  isBillingGuideEligible,
  normalizeBillingAccountId,
  normalizeBillingGuideMode,
  normalizeBillingGuideStep,
} = require('../functions/src/onboarding/billingGuideContract');

test('unknown or missing server mode fails closed to disabled', () => {
  assert.equal(normalizeBillingGuideMode(), 'disabled');
  assert.equal(normalizeBillingGuideMode('unexpected'), 'disabled');
  assert.equal(normalizeBillingGuideMode(' TEST '), 'test');
  assert.equal(normalizeBillingGuideMode('completed'), 'completed');
});

test('test mode is limited to the exact configured test uid', () => {
  const base = { mode: 'test', isSuperAdmin: false, testUid: 'uid-test', liveUid: 'uid-live' };
  assert.equal(isBillingGuideEligible({ ...base, uid: 'uid-test' }), true);
  assert.equal(isBillingGuideEligible({ ...base, uid: 'uid-other' }), false);
  assert.equal(isBillingGuideEligible({ ...base, uid: 'uid-live' }), false);
  assert.equal(isBillingGuideEligible({ ...base, uid: 'uid-test', testUid: '' }), false);
});

test('live mode is limited to the exact configured client uid', () => {
  const base = { mode: 'live', isSuperAdmin: false, testUid: 'uid-test', liveUid: 'uid-client' };
  assert.equal(isBillingGuideEligible({ ...base, uid: 'uid-client' }), true);
  assert.equal(isBillingGuideEligible({ ...base, uid: 'uid-test' }), false);
});

test('super admin always bypasses active onboarding modes', () => {
  assert.equal(isBillingGuideEligible({
    mode: 'test',
    isSuperAdmin: true,
    uid: 'uid-owner',
    testUid: 'uid-owner',
    liveUid: '',
  }), false);
  assert.equal(isBillingGuideEligible({
    mode: 'live',
    isSuperAdmin: true,
    uid: 'uid-owner',
    testUid: '',
    liveUid: 'uid-owner',
  }), false);
});

test('billing account id is normalized and strictly validated', () => {
  assert.equal(normalizeBillingAccountId(' abc123-def456-ghi789 '), 'ABC123-DEF456-GHI789');
  assert.throws(() => normalizeBillingAccountId('1234-5678'), /invalide/);
  assert.throws(() => normalizeBillingAccountId('ABC123-DEF456-GHI78!'), /invalide/);
});

test('steps are allowlisted and cannot be skipped', () => {
  assert.deepEqual(BILLING_GUIDE_STEPS, [
    'welcome',
    'google_billing',
    'billing_id',
    'technical_access',
    'waiting_for_operator',
  ]);
  assert.equal(normalizeBillingGuideStep('billing_id'), 'billing_id');
  assert.throws(() => normalizeBillingGuideStep('arbitrary_step'), /inconnue/);
  assert.equal(assertBillingGuideTransition({
    currentRank: 0,
    furthestRank: 0,
    nextStepId: 'google_billing',
  }), 1);
  assert.throws(() => assertBillingGuideTransition({
    currentRank: 0,
    furthestRank: 0,
    nextStepId: 'technical_access',
  }), /dans l ordre/);
});

test('onboarding operator lives only in the dedicated account tab', () => {
  const root = path.resolve(__dirname, '..');
  const constantsSource = fs.readFileSync(path.join(root, 'src/kit/config/constants.js'), 'utf8');
  const adminIslandSource = fs.readFileSync(path.join(root, 'app/admin/AdminAppIsland.jsx'), 'utf8');
  const accountSource = fs.readFileSync(path.join(root, 'src/kit/admin/AdminAccount.jsx'), 'utf8');
  const operatorSource = fs.readFileSync(path.join(root, 'src/kit/admin/BillingOnboardingOperator.jsx'), 'utf8');

  assert.match(constantsSource, /\{ id: 'account',\s+label: 'Mon compte'/);
  assert.match(adminIslandSource, /tabs: \['account', 'users'\]/);
  assert.match(adminIslandSource, /adminCollection === 'account'/);
  assert.doesNotMatch(adminIslandSource, /BillingOnboardingOperator/);
  assert.match(accountSource, /import\('\.\/BillingOnboardingOperator'\)/);
  assert.doesNotMatch(operatorSource, /loadError\?\.message/);
  assert.match(operatorSource, /Le guide reste sans effet/);
});
