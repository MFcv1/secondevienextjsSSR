import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/kit/marketplace/LegacyLoginModalFullIsland.jsx', import.meta.url), 'utf8');
const handler = source.slice(source.indexOf('  const verifyCustomerLoginCode ='), source.indexOf('  const handleOtpDigitChange ='));
function harness(cached) {
  const signedIn = [];
  const verified = [];
  const activeRef = { current: true };
  const context = {
    activeRef, otpVerifyInFlightRef: { current: false }, loginOperationRef: { current: false }, otpSendInFlightRef: { current: false },
    otpCustomTokenRef: { current: cached }, emailValue: 'second@example.test', otpDigits: ['1','2','3','4','5','6'],
    normalizeEmailValue: value => value.trim().toLowerCase(), functions: {}, getFunctionTarget: value => value,
    httpsCallable: () => async payload => { verified.push(payload); return { data: { token: 'fresh-token' } }; },
    loginWithCustomToken: async token => { signedIn.push(token); return { user: { uid: 'second' } }; },
    toast() {}, setOtpStatus() {}, setOtpMessage() {}, logClientPerf() {}, startClientPerf() {},
    onAuthenticated() {}, offerPasskeyOrClose() {},
  };
  return { run: vm.runInNewContext(handler + '\nverifyCustomerLoginCode', context), signedIn, verified, activeRef };
}

test('OTP retry cannot reuse a verified token from another email or code', async () => {
  for (const cached of [
    { email: 'first@example.test', code: '123456', token: 'first-token' },
    { email: 'second@example.test', code: '654321', token: 'old-token' },
  ]) {
    const h = harness(cached);
    await h.run();
    assert.deepEqual(h.signedIn, ['fresh-token']);
    assert.equal(h.verified.length, 1);
  }
});

test('same OTP attempt reuses its token after network failure; closed dialog does not sign in', async () => {
  const cached = { email: 'second@example.test', code: '123456', token: 'retry-token' };
  const h = harness(cached);
  await h.run();
  assert.deepEqual(h.signedIn, ['retry-token']);
  assert.equal(h.verified.length, 0);
  const closed = harness(cached);
  closed.activeRef.current = false;
  await closed.run();
  assert.equal(closed.signedIn.length, 0);
});
