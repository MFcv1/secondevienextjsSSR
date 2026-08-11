import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

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

test('sensitive callable and analytics paths enforce App Check', () => {
  const expected = [
    ['functions/src/analytics/sessions.js', 'initLiveSession'],
    ['functions/src/analytics/sessions.js', 'syncSession'],
    ['functions/src/analytics/sessions.js', 'deleteSession'],
    ['functions/src/analytics/sessions.js', 'clearAllSessions'],
    ['functions/src/analytics/sessions.js', 'clearAllAffiliateClicks'],
    ['functions/src/analytics/updateUserSessions.js', 'updateUserSessions'],
    ['functions/src/analytics/adminIP.js', 'trackAdminIP'],
    ['functions/src/email/orderEmails.js', 'sendTestEmail'],
    ['functions/src/email/orderEmails.js', 'sendRefundStatusEmailAdmin'],
    ['functions/src/auth/adminManagement.js', 'logUserConnection'],
    ['functions/src/auth/adminManagement.js', 'getUserStats'],
  ];
  for (const [file, exportName] of expected) {
    const source = read(file);
    const start = source.indexOf(`exports.${exportName}`);
    assert.notEqual(start, -1, `${exportName} missing`);
    assert.match(source.slice(start, start + 320), /enforceAppCheck:\s*true/, `${exportName} must enforce App Check`);
  }
});

test('analytics does not send visitor IPs to an external cleartext geo API', () => {
  const sessions = read('functions/src/analytics/sessions.js');
  assert.doesNotMatch(sessions, /ip-api\.com|fetch\(`http:\/\//);
  assert.doesNotMatch(sessions, /type === 'admin'/);
  assert.match(sessions, /originAllowed/);
});

test('E2E mutation endpoints need both the sandbox project and an explicit enable flag', () => {
  for (const file of ['functions/src/commerce/e2eCheckoutProof.js', 'functions/src/commerce/e2eStripeHardeningProof.js']) {
    const source = read(file);
    const guard = source.match(/function isE2eProofAllowed\(\) \{[\s\S]*?\n\}/)?.[0] || '';
    assert.match(guard, /secondevienextjsssr/);
    assert.match(guard, /E2E_PROOF_ENABLED/);
    assert.match(guard, /&&/);
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
