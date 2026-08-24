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

test('only missing AAL2 requests an admin login without clearing Firebase session', () => {
  const firebaseLazy = read('src/kit/config/firebaseLazy.js');
  const adminIsland = read('app/admin/AdminAppIsland.jsx');

  assert.match(firebaseLazy, /strong-auth-required/);
  assert.doesNotMatch(firebaseLazy, /recent-strong-auth-required|verified-passkey-required/);
  assert.match(firebaseLazy, /ADMIN_STEP_UP_REQUIRED_EVENT/);
  assert.match(adminIsland, /addEventListener\(ADMIN_STEP_UP_REQUIRED_EVENT/);
  assert.equal((adminIsland.match(/<LegacyLoginModalIsland/g) || []).length, 2);
  assert.doesNotMatch(adminIsland, /signOut\(/);
});

test('the gallery login is the only visible entry to the back-office', () => {
  const adminIsland = read('app/admin/AdminAppIsland.jsx');
  const header = read('src/kit/marketplace/HeaderAccountIsland.jsx');
  const modal = read('src/kit/marketplace/LegacyLoginModalFullIsland.jsx');

  assert.doesNotMatch(adminIsland, /LoginView/);
  assert.doesNotMatch(adminIsland, /Acces admin refuse/);
  assert.match(adminIsland, /!user[\s\S]*user\.isAnonymous[\s\S]*!isAdmin/);
  assert.match(adminIsland, /router\.replace\('\/'\)/);
  assert.match(header, /onAuthenticated=/);
  assert.match(header, /authState\.claimsStatus !== 'ready'/);
  assert.match(header, /if \(isAdmin\) router\.push\('\/admin'\)/);
  assert.match(modal, /onAuthenticated\?\.\(result\?\.user \|\| null\)/);
  assert.match(modal, /onAuthenticated\?\.\(userCredential\?\.user \|\| null\)/);
});

test('a background admin token refresh does not unmount an active publication flow', () => {
  const adminIsland = read('app/admin/AdminAppIsland.jsx');

  assert.match(adminIsland, /const adminAccessIsResolved = Boolean\(user && !user\.isAnonymous && isAdmin && hasStrongAuth\)/);
  assert.match(adminIsland, /if \(\(loading && !adminAccessIsResolved\) \|\| shouldRedirectToGallery\)/);
  assert.doesNotMatch(adminIsland, /if \(loading\) return/);
});

test('header, menu and cart consume the shared auth snapshot', () => {
  for (const relativePath of sourceFiles.slice(2)) {
    assert.match(read(relativePath), /useAuthState/, `${relativePath} must consume useAuthState`);
  }
});

test('Google popup is prepared before the user click and concurrent requests are blocked', () => {
  const context = read('src/kit/contexts/AuthContext.jsx');
  const modal = read('src/kit/marketplace/LegacyLoginModalFullIsland.jsx');

  assert.match(context, /googleRuntimeRef = React\.useRef/);
  assert.match(context, /preloadGoogleLogin = React\.useCallback/);
  assert.match(context, /const preparedRuntime = googleRuntimeRef\.current/);
  assert.match(context, /signInWithPopup\(auth, provider\)/);
  assert.match(modal, /void preloadGoogleLogin\(\)/);
  assert.match(modal, /googleStatus === 'pending' \|\| googleStatus === 'preparing'/);
  assert.match(modal, /disabled=\{googleStatus === 'preparing' \|\| googleStatus === 'pending'\}/);
  assert.match(modal, /setGoogleStatus\('preload-error'\)/);
  assert.match(context, /auth\/google-not-prepared/);
  assert.match(context, /recordGoogleAuthDiagnostic/);
});

test('Google failures are diagnosed without persisting raw Firebase details', () => {
  const diagnostics = read('src/kit/auth/googleAuthDiagnostics.js');
  assert.match(diagnostics, /auth\.google\.\$\{phase\}/);
  assert.match(diagnostics, /GOOGLE_AUTH_DIAGNOSTICS_LIMIT = 12/);
  assert.match(diagnostics, /classifyGoogleAuthError/);
  assert.doesNotMatch(diagnostics, /underlyingMessage[,}]/);
});

test('redirect state tolerates restricted session storage and expires its fallback', () => {
  const redirectState = read('src/kit/auth/redirectState.js');
  const authStore = read('src/kit/auth/authStore.js');
  assert.match(redirectState, /\['sessionStorage', 'localStorage'\]/);
  assert.match(redirectState, /const storage = window\[storageName\]/);
  assert.match(redirectState, /REDIRECT_STATE_TTL_MS = 10 \* 60 \* 1000/);
  assert.match(redirectState, /catch \{/);
  assert.match(authStore, /hasAuthRedirectPending\(\)/);
  assert.match(authStore, /clearAuthRedirectPending\(\)/);
});

test('sign out is committed only after Firebase signOut resolves', () => {
  const context = read('src/kit/contexts/AuthContext.jsx');
  const logout = context.slice(context.indexOf('const logout = async'), context.indexOf('const verifyEmail'));
  assert.ok(logout.indexOf('await authModule.signOut(auth)') < logout.indexOf('resetAuthStoreAfterSignOut()'));
});

test('passkey and OTP custom-token methods are attributed explicitly', () => {
  const context = read('src/kit/contexts/AuthContext.jsx');
  const resilientSignIn = read('src/kit/auth/customTokenSignIn.js');
  const modal = read('src/kit/marketplace/LegacyLoginModalFullIsland.jsx');
  assert.match(modal, /loginWithCustomToken\(result\.token, 'passkey'\)/);
  assert.match(modal, /loginWithCustomToken\(customToken, 'email_otp'\)/);
  assert.match(resilientSignIn, /CUSTOM_TOKEN_NETWORK_RETRY_DELAYS_MS = \[400, 1200\]/);
  assert.match(resilientSignIn, /error\?\.code !== 'auth\/network-request-failed'/);
  assert.match(context, /signInWithCustomTokenResilient\(\{ authModule, auth, token \}\)/);
  assert.match(modal, /otpCustomTokenRef\.current = customToken/);
  assert.match(modal, /Reessayez sans demander un nouveau code/);
  assert.match(modal, /isSignInFailure \? 'auth\.email\.signInWithCustomToken' : 'auth\.email\.verifyCustomerLoginOtp'/);
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
