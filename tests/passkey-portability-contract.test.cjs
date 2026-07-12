const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const modalPath = path.resolve(__dirname, '../src/kit/marketplace/LegacyLoginModalFullIsland.jsx');
const source = fs.readFileSync(modalPath, 'utf8');

test('authentication capability accepts remote and roaming authenticators', () => {
  assert.match(source, /navigator\.credentials\?\.get/);
  assert.match(source, /navigator\.credentials\?\.create/);
  assert.doesNotMatch(source, /isUserVerifyingPlatformAuthenticatorAvailable\s*\(/);
});

test('prepared authentication challenge expires client-side after four minutes', () => {
  assert.match(source, /PASSKEY_PREPARED_TTL_MS = 4 \* 60 \* 1000/);
  assert.match(source, /createdAt: Date\.now\(\)/);
  assert.match(source, /preparedAuthentication\.createdAt/);
});

test('email-first UX only exposes quick login for a locally activated account', () => {
  assert.match(source, /showPasskeyFirst = passkeySupported[\s\S]*localPasskeyEmails\.includes\(normalizedEmailValue\)/);
  assert.doesNotMatch(source, />\s*Utiliser une passkey\s*</);
  assert.match(source, /autoComplete="username webauthn"/);
});

test('passkey registration no longer redirects to the gallery root', () => {
  assert.doesNotMatch(source, /router\.(push|replace)\(['"]\/['"]\)/);
});
