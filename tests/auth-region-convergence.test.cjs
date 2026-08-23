const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('H6 targets private callable Functions to europe-west1 only', () => {
  const runtime = read('functions/helpers/runtime.js');

  assert.match(runtime, /PRIMARY_FUNCTIONS_REGION\s*=\s*'europe-west1'/);
  assert.match(runtime, /LEGACY_FUNCTIONS_REGION\s*=\s*'us-central1'/);
  assert.match(runtime, /FUNCTION_REGIONS\s*=\s*\[PRIMARY_FUNCTIONS_REGION\]/);
  assert.doesNotMatch(runtime, /FUNCTION_REGIONS\s*=\s*\[[^\]]*LEGACY_FUNCTIONS_REGION/);
});

test('H6 keeps the browser and unload beacon on the configured private region', () => {
  const appHosting = read('apphosting.yaml');
  const analyticsProvider = read('src/kit/shared/AnalyticsProvider.jsx');

  assert.match(appHosting, /NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION[\s\S]*?value:\s*"europe-west1"/);
  assert.match(analyticsProvider, /functionsRegion/);
  assert.match(analyticsProvider, /const beaconTarget = getFunctionTarget\('syncSessionBeacon'\)/);
  assert.match(analyticsProvider, /https:\/\/\$\{functionsRegion\}-\$\{functions\.app\.options\.projectId\}\.cloudfunctions\.net\/\$\{beaconTarget\}/);
  assert.doesNotMatch(analyticsProvider, /us-central1-[^`]*syncSessionBeacon/);
});

test('H6 routes Auth and protected admin callables through regionalFunctions', () => {
  const expectedExports = {
    'functions/src/auth/adminManagement.js': [
      'ensureAdminAccessRegistry',
      'syncSuperAdminClaim',
      'addAdminUser',
      'removeAdminUser',
      'logUserConnection',
      'getUserStats'
    ],
    'functions/src/analytics/adminIP.js': ['trackAdminIP'],
    'functions/src/analytics/updateUserSessions.js': ['updateUserSessions'],
    'functions/src/analytics/sessions.js': [
      'initLiveSession',
      'syncSession',
      'syncSessionBeacon'
    ],
    'functions/src/commerce/stripeConnect.js': [
      'getStripeConnectStatus',
      'startStripeConnectOnboarding',
      'syncStripeConnectAccount',
      'requestStripeConnectReconnect',
      'confirmStripeConnectReconnect'
    ],
    'functions/src/email/orderEmails.js': ['sendTestEmail', 'sendRefundStatusEmailAdmin']
  };

  for (const [relativePath, exportNames] of Object.entries(expectedExports)) {
    const source = read(relativePath);
    assert.match(source, /regionalFunctions/);
    for (const exportName of exportNames) {
      assert.match(
        source,
        new RegExp(`exports\\.${exportName}\\s*=\\s*regionalFunctions\\(\\)`),
        `${exportName} doit cibler la region privee configuree`
      );
    }
  }
});

test('catalog configuration no longer exposes a legacy public Function region', () => {
  const appHosting = read('apphosting.yaml');
  const serverEnv = read('src/lib/server/env.js');

  assert.doesNotMatch(appHosting, /PUBLIC_CATALOG_REGION|PUBLIC_CATALOG_SOURCE/);
  assert.doesNotMatch(serverEnv, /publicCatalogRegion|publicCatalogUrl/);
  assert.match(appHosting, /CATALOG_SNAPSHOT_BUCKET/);
});
