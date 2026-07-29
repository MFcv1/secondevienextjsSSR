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

test('admin dashboard consumes resolved claims without forcing a token refresh on mount', () => {
  const adminIsland = read('app/admin/AdminAppIsland.jsx');
  const dashboard = read('src/kit/admin/AdminDashboard.jsx');

  assert.match(adminIsland, /<AdminDashboard[\s\S]*isSuperAdmin={isSuperAdmin}/);
  assert.match(dashboard, /const AdminDashboard = \(\{[\s\S]*isSuperAdmin = false,[\s\S]*commerceStatus =/);
  assert.match(dashboard, /loading={financialLoading}/);
  assert.match(dashboard, /registeredUsers: cachedUserCount/);
  assert.doesNotMatch(dashboard, /getIdTokenResult/);
  assert.doesNotMatch(dashboard, /ensureAdminAccessRegistry/);
  assert.doesNotMatch(dashboard, /syncSuperAdminClaim/);
});

test('stale sensitive admin calls request a step-up without clearing Firebase session', () => {
  const firebaseLazy = read('src/kit/config/firebaseLazy.js');
  const adminIsland = read('app/admin/AdminAppIsland.jsx');

  assert.match(firebaseLazy, /recent-strong-auth-required/);
  assert.match(firebaseLazy, /ADMIN_STEP_UP_REQUIRED_EVENT/);
  assert.match(adminIsland, /addEventListener\(ADMIN_STEP_UP_REQUIRED_EVENT/);
  assert.equal((adminIsland.match(/<LegacyLoginModalIsland/g) || []).length, 2);
  assert.doesNotMatch(adminIsland, /signOut\(/);
});

test('header, menu and cart consume the shared auth snapshot', () => {
  for (const relativePath of sourceFiles.slice(2)) {
    assert.match(read(relativePath), /useAuthState/, `${relativePath} must consume useAuthState`);
  }
});

test('Google popup is prepared before the user click and concurrent requests are blocked', () => {
  const context = read('src/kit/contexts/AuthContext.jsx');
  const modal = read('src/kit/marketplace/LegacyLoginModalFullIsland.jsx');
  const adminLogin = read('src/kit/commerce/LoginView.jsx');

  assert.match(context, /googleRuntimeRef = React\.useRef/);
  assert.match(context, /preloadGoogleLogin = React\.useCallback/);
  assert.match(context, /const preparedRuntime = googleRuntimeRef\.current/);
  assert.match(context, /signInWithPopup\(auth, provider\)/);
  assert.match(modal, /void preloadGoogleLogin\(\)/);
  assert.match(modal, /googleStatus === 'pending' \|\| googleStatus === 'preparing'/);
  assert.match(modal, /disabled=\{googleStatus === 'preparing' \|\| googleStatus === 'pending'\}/);
  assert.match(adminLogin, /void preloadGoogleLogin\(\)/);
  assert.match(adminLogin, /disabled=\{googleStatus !== 'ready'\}/);
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
