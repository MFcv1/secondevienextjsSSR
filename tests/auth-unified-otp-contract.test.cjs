const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const source = fs.readFileSync(
  path.resolve(__dirname, '../functions/src/auth/customerLoginOtp.js'),
  'utf8'
);

test('OTP login does not reject administrator emails', () => {
  assert.doesNotMatch(source, /Connexion par code reservee aux comptes clients/);
  assert.doesNotMatch(source, /isAdminEmail\(email/);
});

test('OTP login only assigns the client role to newly created users', () => {
  assert.match(source, /let created = false/);
  assert.match(source, /created = true/);
  assert.match(source, /if \(created\) userProfile\.role = 'client'/);
  assert.doesNotMatch(source, /set\(\{[\s\S]{0,120}role: 'client'/);
});

test('OTP verification keeps App Check and one-time challenge consumption', () => {
  assert.match(source, /verifyCustomerLoginOtp[\s\S]*enforceAppCheck: true/);
  assert.match(source, /usedAtMillis: now/);
  assert.match(source, /otpHash: admin\.firestore\.FieldValue\.delete\(\)/);
});
