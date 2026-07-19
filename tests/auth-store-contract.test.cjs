const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const sourceFiles = [
  'src/kit/auth/authStore.js',
  'src/kit/contexts/AuthContext.jsx',
  'src/kit/marketplace/HeaderAccountIsland.jsx',
  'src/kit/marketplace/GlobalMenuTriggerIsland.jsx',
  'src/kit/marketplace/CartPanelIsland.jsx',
];

test('AuthStore owns the only Firebase auth observer', () => {
  const combined = sourceFiles.map(read).join('\n');
  assert.equal((combined.match(/onIdTokenChanged/g) || []).length, 2, 'import and invocation must live only in AuthStore');
  assert.equal((combined.match(/onAuthStateChanged/g) || []).length, 0, 'legacy observers must not return');
  assert.match(read('src/kit/auth/authStore.js'), /runtime\.unsubscribe = onIdTokenChanged/);
});

test('header, menu and cart consume the shared auth snapshot', () => {
  for (const relativePath of sourceFiles.slice(2)) {
    assert.match(read(relativePath), /useAuthState/, `${relativePath} must consume useAuthState`);
  }
});

test('sign out is committed only after Firebase signOut resolves', () => {
  const context = read('src/kit/contexts/AuthContext.jsx');
  const logout = context.slice(context.indexOf('const logout = async'), context.indexOf('const verifyEmail'));
  assert.ok(logout.indexOf('await authModule.signOut(auth)') < logout.indexOf('resetAuthStoreAfterSignOut()'));
});

test('passkey and OTP custom-token methods are attributed explicitly', () => {
  const modal = read('src/kit/marketplace/LegacyLoginModalFullIsland.jsx');
  assert.match(modal, /loginWithCustomToken\(result\.token, 'passkey'\)/);
  assert.match(modal, /loginWithCustomToken\(result\.data\.token, 'email_otp'\)/);
});

test('auth modal preserves essential keyboard and OTP accessibility contracts', () => {
  const modal = read('src/kit/marketplace/LegacyLoginModalFullIsland.jsx');

  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /closeButtonRef\.current\?\.focus/);
  assert.match(modal, /event\.key !== 'Tab'/);
  assert.match(modal, /button\[aria-label="Ouvrir le menu"\]/);
  assert.match(modal, /aria-label={`Chiffre \$\{index \+ 1\} du code`}/);
  assert.match(modal, /aria-label="Adresse email du compte"/);
  assert.match(modal, /role={otpStatus === 'error' \? 'alert' : 'status'}/);
  assert.match(modal, /aria-busy={isOtpBusy}/);
  assert.match(modal, /if \(otpSendInFlightRef\.current\) return/);
  assert.match(modal, /if \(otpVerifyInFlightRef\.current\) return/);
});
