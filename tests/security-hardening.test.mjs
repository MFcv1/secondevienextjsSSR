import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

const listJavaScriptFiles = (directory) => readdirSync(join(root, directory), { withFileTypes: true })
  .flatMap((entry) => {
    const relativePath = join(directory, entry.name);
    if (entry.isDirectory()) return listJavaScriptFiles(relativePath);
    return /\.(?:cjs|js|mjs)$/.test(entry.name) ? [relativePath] : [];
  });

const runtimeEnforcesAppCheck = (source, runtimeName, seen = new Set()) => {
  if (seen.has(runtimeName)) return false;
  seen.add(runtimeName);

  const escapedName = runtimeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const declaration = source.match(new RegExp(
    `(?:const|let)\\s+${escapedName}\\s*=\\s*\\{([\\s\\S]*?)\\};`
  ));
  if (!declaration) return false;
  if (/enforceAppCheck\s*:\s*true/.test(declaration[1])) return true;

  return [...declaration[1].matchAll(/\.\.\.([A-Za-z_$][\w$]*)/g)]
    .some((match) => runtimeEnforcesAppCheck(source, match[1], seen));
};

const callableEnforcesAppCheck = (source, onCallIndex) => {
  const runWithIndex = source.lastIndexOf('.runWith(', onCallIndex);
  const previousTransportIndex = Math.max(
    source.lastIndexOf('.https.onCall', onCallIndex - 1),
    source.lastIndexOf('.https.onRequest', onCallIndex - 1)
  );
  if (runWithIndex <= previousTransportIndex) return false;

  const runtimeChain = source.slice(runWithIndex, onCallIndex);
  if (/enforceAppCheck\s*:\s*true/.test(runtimeChain)) return true;

  const runtimeNames = new Set([
    ...[...runtimeChain.matchAll(/\.runWith\(\s*([A-Za-z_$][\w$]*)\s*\)/g)].map((match) => match[1]),
    ...[...runtimeChain.matchAll(/\.\.\.([A-Za-z_$][\w$]*)/g)].map((match) => match[1]),
  ]);
  return [...runtimeNames].some((runtimeName) => runtimeEnforcesAppCheck(source, runtimeName));
};

test('real environment and credential files are not tracked', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  const forbidden = tracked.filter((file) => (
    /(^|\/)\.env(?:\.|$)/.test(file)
    && !/\.example$/.test(file)
  ) || /(^|\/)(?:service-account\.json|[^/]+\.(?:pem|key))$/.test(file));
  assert.deepEqual(forbidden, []);
});

test('the Vite compatibility bridge is allowlist-only and blocks banking data', () => {
  const source = read('scripts/with-env.mjs');
  assert.match(source, /PUBLIC_ENV_BRIDGE_ALLOWLIST/);
  assert.match(source, /if \(PUBLIC_ENV_BRIDGE_ALLOWLIST\.has\(key\)\)/);
  assert.doesNotMatch(source, /key\.startsWith\('VITE_'\) && !PUBLIC_ENV/);
  for (const key of ['NEXT_PUBLIC_SUPER_ADMIN_EMAIL', 'NEXT_PUBLIC_BUSINESS_IBAN', 'NEXT_PUBLIC_BUSINESS_BIC', 'NEXT_PUBLIC_BANK_HOLDER']) {
    assert.match(source, new RegExp(`['"]${key}['"]`));
  }
});

test('App Hosting upload context excludes secrets explicitly', () => {
  const config = JSON.parse(read('firebase.json'));
  const ignored = new Set(config.apphosting?.[0]?.ignore || []);
  for (const pattern of ['.env*', '**/.env*', 'service-account.json', '**/service-account.json', '*.pem', '*.key']) {
    assert.equal(ignored.has(pattern), true, `missing App Hosting ignore: ${pattern}`);
  }
});

test('Storage is private by default and public roots are explicit', () => {
  const rules = read('storage.rules');
  assert.match(rules, /publicRoot in \['gallery', 'homepage'\]/);
  assert.match(rules, /match \/\{allPaths=\*\*\} \{\s*allow read, write: if false;/);
  assert.doesNotMatch(rules, /allow read: if topLevel !=/);
});

test('Next admin routes require revoked-token checks, AAL2 and the active registry', () => {
  const authorization = read('src/lib/server/adminAuthorization.js');
  const routes = [
    read('app/api/admin/catalog-publication-status/route.js'),
    read('app/api/admin/function-metrics/route.js'),
    read('app/api/revalidate-catalog/route.js'),
  ].join('\n');
  assert.match(authorization, /verifyIdToken\(token, true\)/);
  assert.match(authorization, /verifyToken\(appCheckToken\)/);
  assert.match(authorization, /hasAal2\(decoded\)/);
  assert.match(authorization, /sys_admin_access/);
  assert.match(routes, /authorizeAdminRequest/);
  assert.doesNotMatch(routes, /SUPER_ADMIN_EMAIL|decoded\.email/);
});

test('operational Functions authorization never falls back to an email', () => {
  const security = read('functions/helpers/security.js');
  const adminManagement = read('functions/src/auth/adminManagement.js');
  assert.match(security, /checkConfiguredSuperAdminBootstrap/);
  assert.doesNotMatch(security.match(/function checkIsAdmin[\s\S]*?\n\}/)?.[0] || '', /getSuperAdminEmail|token\.email/);
  assert.doesNotMatch(security.match(/function checkIsSuperAdmin[\s\S]*?\n\}/)?.[0] || '', /getSuperAdminEmail|token\.email/);
  assert.match(adminManagement, /addAdminUser[\s\S]*?checkActiveStrongSuperAdmin\(context\)/);
  assert.match(adminManagement, /removeAdminUser[\s\S]*?checkActiveStrongSuperAdmin\(context\)/);
});

test('customer order history has no Firestore email fallback', () => {
  const orderView = read('src/kit/commerce/MyOrdersView.jsx');
  const rules = read('firestore.rules');
  assert.match(orderView, /listMyOrdersV2/);
  assert.doesNotMatch(orderView, /where\(['"]userEmail['"]/);
  // History still uses the authorized callable. The new refund signal is
  // explicitly bounded and owned by UID, never an email-based fallback.
  assert.match(orderView, /const liveQuery = query\(\s*collection\(db, 'orders'\),\s*where\('userId', '==', user\.uid\),\s*where\('updatedAt', '>', Timestamp\.fromMillis\(ordersLiveSince\)\),\s*orderBy\('updatedAt', 'asc'\),\s*limit\(25\)/);
  assert.equal([...orderView.matchAll(/collection\(db, ['"]orders['"]\)/g)].length, 1);
  assert.match(orderView, /if \(!user\?\.uid \|\| user\.isAnonymous \|\| !ordersLiveSince\) return undefined/);
  assert.match(orderView, /return onSnapshot\(liveQuery/);
  assert.match(rules, /request\.auth\.uid == resource\.data\.userId/);
  assert.doesNotMatch(rules, /request\.auth\.token\.email == resource\.data\.userEmail/);
});

test('every callable transport under functions/src enforces App Check', () => {
  const failures = [];
  let callableCount = 0;

  for (const file of listJavaScriptFiles('functions/src')) {
    const source = read(file);
    for (const match of source.matchAll(/\.https\.onCall/g)) {
      callableCount += 1;
      if (callableEnforcesAppCheck(source, match.index)) continue;
      const line = source.slice(0, match.index).split('\n').length;
      failures.push(`${file}:${line}`);
    }
  }

  assert.ok(callableCount > 0, 'no callable transport discovered');
  assert.deepEqual(failures, [], `callables without enforceAppCheck: ${failures.join(', ')}`);
});

test('every HTTP Function transport is inventoried with its non-App-Check boundary', () => {
  const discovered = [];
  for (const file of listJavaScriptFiles('functions/src')) {
    const source = read(file);
    for (const _match of source.matchAll(/\.https\.onRequest/g)) discovered.push(file);
  }
  assert.deepEqual(discovered.sort(), [
    'functions/src/analytics/sessions.js',
    'functions/src/commerce/v2Webhooks.js',
    'functions/src/commerce/v2Webhooks.js',
    'functions/src/integrations/meta.js',
    'functions/src/integrations/meta.js',
  ].sort());

  const beacon = read('functions/src/analytics/sessions.js');
  assert.match(beacon, /originAllowed/);
  assert.match(beacon, /req\.rawBody\.length > 64 \* 1024/);
  assert.match(beacon, /verifySessionSyncToken/);

  const v2Webhooks = read('functions/src/commerce/v2Webhooks.js');
  assert.match(v2Webhooks, /webhookIngress\.ingest/);
  assert.match(v2Webhooks, /stripe-signature/);

  const meta = read('functions/src/integrations/meta.js');
  assert.match(meta, /parseAndVerifyOAuthState/);
  assert.match(meta, /transaction\.update\(stateRef, \{ status: 'processing'/);
});

test('the complete Next API inventory is public-bounded or strongly authorized', () => {
  const routeFiles = listJavaScriptFiles('app/api').filter((file) => file.endsWith('/route.js')).sort();
  assert.deepEqual(routeFiles, [
    'app/api/admin/catalog-publication-status/route.js',
    'app/api/admin/function-metrics/route.js',
    'app/api/catalog/route.js',
    'app/api/catalog/version/route.js',
    'app/api/revalidate-catalog/route.js',
    'app/api/search/route.js',
  ]);

  const adminStatus = read('app/api/admin/catalog-publication-status/route.js');
  const metrics = read('app/api/admin/function-metrics/route.js');
  assert.match(metrics, /await authorizeAdminRequest\(request\)/);
  assert.match(metrics, /if \(!authorization\.ok\) return/);
  assert.match(metrics, /Object\.hasOwn\(PERIODS, period\)/);
  assert.match(metrics, /no-store, max-age=0/);
  const revalidation = read('app/api/revalidate-catalog/route.js');
  const catalog = read('app/api/catalog/route.js');
  const search = read('app/api/search/route.js');
  assert.match(adminStatus, /authorizeAdminRequest/);
  assert.match(adminStatus, /maxBytes:\s*4096/);
  assert.match(revalidation, /verifyCatalogMachineSignature/);
  assert.match(revalidation, /authorizeAdminRequest/);
  assert.match(revalidation, /maxBytes:\s*512 \* 1024/);
  assert.match(catalog, /Math\.min\(value, 120\)/);
  assert.match(search, /slice\(0, 80\)/);
});

test('analytics does not send visitor IPs to an external cleartext geo API', () => {
  const sessions = read('functions/src/analytics/sessions.js');
  assert.doesNotMatch(sessions, /ip-api\.com|fetch\(`http:\/\//);
  assert.doesNotMatch(sessions, /type === 'admin'/);
  assert.match(sessions, /originAllowed/);
});

test('admin claim and transactional email logs do not expose account identifiers', () => {
  const grantAdmin = read('functions/src/auth/grantAdmin.js');
  const orderEmails = read('functions/src/email/orderEmails.js');
  const grantAdminLogs = [...grantAdmin.matchAll(/console\.(?:log|warn|error)\([\s\S]*?\);/g)]
    .map((match) => match[0])
    .join('\n');
  const orderEmailLogs = [...orderEmails.matchAll(/console\.(?:log|warn|error)\([\s\S]*?\);/g)]
    .map((match) => match[0])
    .join('\n');

  assert.doesNotMatch(grantAdminLogs, /user\.(?:email|uid)/);
  assert.doesNotMatch(orderEmailLogs, /clientEmail|safeEmail/);
  assert.match(orderEmails, /function operationalErrorSummary/);
  assert.doesNotMatch(orderEmailLogs, /:\s*(?:e|error)\s*\)/);
});

test('retired E2E mutation endpoints are absent after G12-B:G3', () => {
  for (const file of ['functions/src/commerce/e2eCheckoutProof.js', 'functions/src/commerce/e2eStripeHardeningProof.js']) {
    assert.equal(existsSync(join(root, file)), false);
  }
});

test('Functions declare Firebase Admin optional runtimes explicitly for Cloud Build', () => {
  const functionsPackage = JSON.parse(read('functions/package.json'));
  assert.equal(typeof functionsPackage.dependencies?.['@google-cloud/firestore'], 'string');
  assert.equal(typeof functionsPackage.dependencies?.['@google-cloud/storage'], 'string');
});

test('browser hardening and self-XSS warning stay enabled', () => {
  const config = read('next.config.mjs');
  const layout = read('app/layout.jsx');
  for (const header of ['Cross-Origin-Opener-Policy', 'Cross-Origin-Resource-Policy', 'Origin-Agent-Cluster', 'X-Permitted-Cross-Domain-Policies']) {
    assert.match(config, new RegExp(header));
  }
  assert.match(config, /script-src-attr 'none'/);
  assert.match(config, /X-Robots-Tag/);
  assert.match(layout, /Ne collez jamais de code dans cette console/);
  assert.match(layout, /assistant IA/);
});
