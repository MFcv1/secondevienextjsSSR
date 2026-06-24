const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();

const readText = (relativePath) => {
  const fullPath = path.join(ROOT, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
};

const parseDotEnvKeys = (relativePath) => {
  const content = readText(relativePath);
  const keys = new Set();
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (match) keys.add(match[1]);
  }
  return keys;
};

const parseDotEnvValues = (relativePath) => {
  const content = readText(relativePath);
  const values = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return values;
};

const readJson = (relativePath) => {
  try {
    const content = readText(relativePath);
    return content ? JSON.parse(content) : null;
  } catch {
    return null;
  }
};

const parseAppHostingEnv = () => {
  const content = readText('apphosting.yaml');
  const entries = [];
  let current = null;
  let inAvailability = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    const variableMatch = line.match(/^-\s+variable:\s*(.+)$/);
    if (variableMatch) {
      current = {
        variable: variableMatch[1].replace(/^["']|["']$/g, ''),
        value: '',
        secret: '',
        availability: []
      };
      entries.push(current);
      inAvailability = false;
      continue;
    }

    if (!current) continue;

    const valueMatch = line.match(/^value:\s*(.*)$/);
    if (valueMatch) {
      current.value = valueMatch[1].replace(/^["']|["']$/g, '');
      inAvailability = false;
      continue;
    }

    const secretMatch = line.match(/^secret:\s*(.*)$/);
    if (secretMatch) {
      current.secret = secretMatch[1].replace(/^["']|["']$/g, '');
      inAvailability = false;
      continue;
    }

    if (line === 'availability:') {
      inAvailability = true;
      continue;
    }

    const availabilityMatch = inAvailability ? line.match(/^-\s*(BUILD|RUNTIME)$/) : null;
    if (availabilityMatch) current.availability.push(availabilityMatch[1]);
  }

  return entries;
};

const scanEnvUsage = (roots) => {
  const usage = new Map();
  const stack = roots.map((relativePath) => path.join(ROOT, relativePath));
  const ignoredDirs = new Set(['.git', '.next', 'node_modules', 'dist', 'logs', '.firebase']);
  const allowedExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs']);
  const envPattern = /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g;
  const secretPattern = /defineSecret\(\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\)/g;

  while (stack.length) {
    const currentPath = stack.pop();
    if (!fs.existsSync(currentPath)) continue;
    const stat = fs.statSync(currentPath);
    if (stat.isDirectory()) {
      if (ignoredDirs.has(path.basename(currentPath))) continue;
      for (const child of fs.readdirSync(currentPath)) stack.push(path.join(currentPath, child));
      continue;
    }
    if (!allowedExtensions.has(path.extname(currentPath))) continue;

    const relative = path.relative(ROOT, currentPath).replace(/\\/g, '/');
    const content = fs.readFileSync(currentPath, 'utf8');
    for (const pattern of [envPattern, secretPattern]) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content))) {
        if (!usage.has(match[1])) usage.set(match[1], new Set());
        usage.get(match[1]).add(relative);
      }
    }
  }

  return Object.fromEntries(
    [...usage.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, files]) => [key, [...files].sort()])
  );
};

const hasAny = (set, keys) => keys.some((key) => set.has(key));

const appHostingEntries = parseAppHostingEnv();
const appHostingByName = new Map(appHostingEntries.map((entry) => [entry.variable, entry]));
const sandboxExample = parseDotEnvKeys('.env.sandbox.example');
const productionExample = parseDotEnvKeys('.env.production.example');
const sandboxEnv = parseDotEnvValues('.env.sandbox');
const productionEnv = parseDotEnvValues('.env.production');
const firebaseRc = readJson('.firebaserc') || {};
const firebaseJson = readJson('firebase.json') || {};
const envUsage = scanEnvUsage(['app', 'src', 'functions', 'functions-public']);
const firebaseIgnore = readText('.firebaseignore');

const findings = [];
const addFinding = (level, area, message) => findings.push({ level, area, message });

const requireAppHostingVar = (name, area) => {
  if (!appHostingByName.has(name)) addFinding('error', area, `apphosting.yaml missing ${name}`);
};

const warnAppHostingVar = (name, area) => {
  if (!appHostingByName.has(name)) addFinding('warn', area, `apphosting.yaml missing ${name}`);
};

requireAppHostingVar('NEXT_PUBLIC_SITE_URL', 'site-url');
requireAppHostingVar('NEXT_PUBLIC_RECAPTCHA_SITE_KEY', 'app-check');
warnAppHostingVar('NEXT_PUBLIC_STRIPE_PUBLIC_KEY', 'stripe');

const siteUrl = appHostingByName.get('NEXT_PUBLIC_SITE_URL')?.value || '';
if (siteUrl && !/^https:\/\/.+/.test(siteUrl)) {
  addFinding('error', 'site-url', `NEXT_PUBLIC_SITE_URL should be an absolute https URL for deployed App Hosting, got "${siteUrl}"`);
}
if (siteUrl && !siteUrl.includes('secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app')) {
  addFinding('warn', 'site-url', `apphosting.yaml currently points NEXT_PUBLIC_SITE_URL to "${siteUrl}", expected sandbox hosted.app until prod is configured`);
}

const appCheckSource = readText('src/kit/config/firebaseLazy.js');
if (!appCheckSource.includes('initializeAppCheck') || !appCheckSource.includes('ReCaptchaV3Provider')) {
  addFinding('error', 'app-check', 'src/kit/config/firebaseLazy.js does not initialize Firebase App Check with ReCaptchaV3Provider');
}
if (!appCheckSource.includes('NEXT_PUBLIC_RECAPTCHA_SITE_KEY')) {
  addFinding('error', 'app-check', 'Firebase App Check code does not read NEXT_PUBLIC_RECAPTCHA_SITE_KEY');
}
if (!hasAny(sandboxExample, ['NEXT_PUBLIC_RECAPTCHA_SITE_KEY', 'VITE_RECAPTCHA_SITE_KEY'])) {
  addFinding('error', 'app-check', '.env.sandbox.example missing reCAPTCHA site key placeholder');
}
if (!hasAny(productionExample, ['NEXT_PUBLIC_RECAPTCHA_SITE_KEY', 'VITE_RECAPTCHA_SITE_KEY'])) {
  addFinding('error', 'app-check', '.env.production.example missing reCAPTCHA site key placeholder');
}

const serverSuperAdmin = appHostingByName.get('SUPER_ADMIN_EMAIL');
const publicSuperAdmin = appHostingByName.get('NEXT_PUBLIC_SUPER_ADMIN_EMAIL');
if (!serverSuperAdmin) addFinding('error', 'admin-security', 'apphosting.yaml missing server-only SUPER_ADMIN_EMAIL used by /api/revalidate-catalog');
if (serverSuperAdmin?.value) {
  addFinding('error', 'admin-security', 'SUPER_ADMIN_EMAIL must be referenced as a Secret Manager secret, not stored as a plain apphosting.yaml value');
}
if (publicSuperAdmin) {
  addFinding(
    'error',
    'admin-security',
    'NEXT_PUBLIC_SUPER_ADMIN_EMAIL must not be exposed; admin UI must rely on Firebase custom claims and server-only SUPER_ADMIN_EMAIL'
  );
}

const firebaseIgnoreLines = new Set(
  firebaseIgnore
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
);
const firebaseIgnoreRequired = ['.env*', 'service-account.json', '*.pem', '*.key'];
for (const pattern of firebaseIgnoreRequired) {
  if (!firebaseIgnoreLines.has(pattern)) {
    addFinding('error', 'secret-hygiene', `.firebaseignore missing explicit exclusion "${pattern}"`);
  }
}

const businessPublicKeys = [
  'NEXT_PUBLIC_BUSINESS_EMAIL',
  'NEXT_PUBLIC_BUSINESS_PHONE',
  'NEXT_PUBLIC_BUSINESS_ADDRESS',
  'NEXT_PUBLIC_BUSINESS_IBAN',
  'NEXT_PUBLIC_BUSINESS_BIC',
  'NEXT_PUBLIC_INVOICE_COMPANY_NAME',
  'NEXT_PUBLIC_INVOICE_ADDRESS',
  'NEXT_PUBLIC_INVOICE_PHONE',
  'NEXT_PUBLIC_INVOICE_SIREN',
  'NEXT_PUBLIC_INVOICE_LEGAL',
  'NEXT_PUBLIC_BANK_HOLDER',
  'NEXT_PUBLIC_CONTACT_NAME',
  'NEXT_PUBLIC_REVIEW_URL'
];
const missingBusinessKeys = businessPublicKeys.filter((key) => envUsage[key] && !appHostingByName.has(key));
if (missingBusinessKeys.length) {
  addFinding('warn', 'public-next', `App Hosting lacks public business/contact/invoice keys used by UI: ${missingBusinessKeys.join(', ')}`);
}

const modelOnlyViteKeys = [...sandboxExample]
  .filter((key) => key.startsWith('VITE_'))
  .map((key) => `NEXT_PUBLIC_${key.slice('VITE_'.length)}`)
  .filter((nextKey) => envUsage[nextKey] && !sandboxExample.has(nextKey));
if (modelOnlyViteKeys.length) {
  addFinding(
    'warn',
    'local-env-models',
    `Local examples rely on scripts/with-env.mjs to map VITE_* to NEXT_PUBLIC_* for: ${modelOnlyViteKeys.join(', ')}`
  );
}

const getFirstEnvValue = (env, keys) => {
  for (const key of keys) {
    if (env[key]) return env[key];
  }
  return '';
};

const classifyUrl = (value) => {
  if (!value) return 'missing';
  if (/localhost|127\.0\.0\.1/i.test(value)) return 'local';
  if (/secondevie-next-sandbox--secondevienextjsssr\.europe-west4\.hosted\.app/i.test(value)) return 'sandbox-hosted-app';
  if (/secondevie-a0745/i.test(value)) return 'legacy-hosting';
  if (/^https:\/\//i.test(value)) return 'https-candidate';
  return 'non-https-or-unknown';
};

const classifyStripePublicKey = (value) => {
  if (!value) return 'missing';
  if (value.startsWith('pk_test_')) return 'pk_test';
  if (value.startsWith('pk_live_')) return 'pk_live';
  return 'unknown-format';
};

const classifyPresence = (value) => (value ? 'present' : 'missing');

const firebaseProjects = firebaseRc.projects || {};
const appHostingConfigs = Array.isArray(firebaseJson.apphosting) ? firebaseJson.apphosting : [];
const localBackendIds = appHostingConfigs.map((backend) => backend.backendId).filter(Boolean);
const prodBackendIds = localBackendIds.filter((backendId) => !/sandbox/i.test(backendId));
const appHostingSiteUrl = appHostingByName.get('NEXT_PUBLIC_SITE_URL')?.value || '';
const appHostingStripeKey = appHostingByName.get('NEXT_PUBLIC_STRIPE_PUBLIC_KEY')?.value || '';
const sandboxProjectId = getFirstEnvValue(sandboxEnv, ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID']);
const productionProjectId = getFirstEnvValue(productionEnv, ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID']);
const productionSiteUrl = getFirstEnvValue(productionEnv, ['NEXT_PUBLIC_SITE_URL', 'VITE_SITE_URL', 'SITE_URL']);
const productionStripePublicKey = getFirstEnvValue(productionEnv, ['NEXT_PUBLIC_STRIPE_PUBLIC_KEY', 'VITE_STRIPE_PUBLIC_KEY']);
const productionRecaptchaKey = getFirstEnvValue(productionEnv, ['NEXT_PUBLIC_RECAPTCHA_SITE_KEY', 'VITE_RECAPTCHA_SITE_KEY']);
const productionAuthDomain = getFirstEnvValue(productionEnv, ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN']);
const productionStorageBucket = getFirstEnvValue(productionEnv, ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET']);
const explicitProdAlias = firebaseProjects.prod || firebaseProjects.production || '';
const defaultProject = firebaseProjects.default || '';

const prodRailReasons = [];
if (!explicitProdAlias) prodRailReasons.push('.firebaserc has no prod/production alias');
if (!prodBackendIds.length) prodRailReasons.push('firebase.json has no non-sandbox App Hosting backend');
if (classifyUrl(appHostingSiteUrl) === 'sandbox-hosted-app') prodRailReasons.push('apphosting.yaml NEXT_PUBLIC_SITE_URL points to sandbox hosted.app');
if (classifyStripePublicKey(appHostingStripeKey) === 'pk_test') prodRailReasons.push('apphosting.yaml uses a Stripe test public key');
if (!productionProjectId) prodRailReasons.push('.env.production lacks a concrete Firebase project id');
if (productionProjectId && sandboxProjectId && productionProjectId === sandboxProjectId) {
  prodRailReasons.push('.env.production Firebase project id matches sandbox');
}
if (classifyUrl(productionSiteUrl) !== 'https-candidate') {
  prodRailReasons.push('.env.production SITE_URL/NEXT_PUBLIC_SITE_URL is not a distinct https production candidate');
}
if (classifyStripePublicKey(productionStripePublicKey) !== 'pk_live') {
  prodRailReasons.push('.env.production Stripe public key is not classified as pk_live');
}
if (!productionRecaptchaKey) prodRailReasons.push('.env.production lacks a concrete App Check reCAPTCHA site key');

const railProd = {
  decision: prodRailReasons.length ? 'prod-absent-or-not-wired' : 'prod-candidate-local-env-present',
  currentRail: {
    firebaseDefaultProject: defaultProject || 'missing',
    firebaseProdAlias: explicitProdAlias || 'missing',
    appHostingBackendIds: localBackendIds,
    appHostingSiteUrlClass: classifyUrl(appHostingSiteUrl),
    appHostingStripePublicKeyClass: classifyStripePublicKey(appHostingStripeKey)
  },
  localProductionEnv: {
    fileExists: fs.existsSync(path.join(ROOT, '.env.production')),
    projectIdClass: productionProjectId
      ? (sandboxProjectId && productionProjectId === sandboxProjectId ? 'same-as-sandbox' : 'present')
      : 'missing',
    siteUrlClass: classifyUrl(productionSiteUrl),
    authDomain: classifyPresence(productionAuthDomain),
    storageBucket: classifyPresence(productionStorageBucket),
    recaptchaSiteKey: classifyPresence(productionRecaptchaKey),
    stripePublicKeyClass: classifyStripePublicKey(productionStripePublicKey)
  },
  requiredBeforeProdRail: [
    'Create or select the production Firebase project and add a prod/production alias in .firebaserc.',
    'Create a dedicated production App Hosting backend and do not reuse secondevie-next-sandbox.',
    'Set NEXT_PUBLIC_SITE_URL/VITE_SITE_URL to the final HTTPS production domain.',
    'Register the final production domain in Firebase Auth authorized domains.',
    'Create a production App Check Web reCAPTCHA v3 key for the production web app and keep debug tokens out of prod.',
    'Set PUBLIC_ALLOWED_ORIGINS and any Functions CORS/origin allowlists to the production domain.',
    'Create separate Stripe live secrets: NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_*, STRIPE_SECRET_KEY=sk_live_*, STRIPE_WH_SECRET=whsec_* for the live endpoint.',
    'Create/separate Gmail or email provider secrets for production if email sending is enabled.',
    'Verify Storage bucket, Firestore rules/indexes, Functions codebases and App Hosting runtime env in the Firebase Console before deploy.',
    'Run prod gates intentionally: npm run build:prod, npm run next:routes, npm run infra:env, then prod smoke tests only after explicit approval.'
  ],
  reasons: prodRailReasons
};

if (railProd.decision === 'prod-absent-or-not-wired') {
  addFinding(
    'warn',
    'prod-rail',
    `Production rail is not configured locally: ${prodRailReasons.join('; ')}`
  );
}

const map = {
  publicNext: Object.keys(envUsage).filter((key) => key.startsWith('NEXT_PUBLIC_')),
  appHosting: appHostingEntries.map((entry) => ({
    variable: entry.variable,
    availability: entry.availability.length ? entry.availability : ['BUILD', 'RUNTIME'],
    source: entry.secret ? 'secret' : 'value'
  })),
  functionsMain: Object.keys(envUsage).filter((key) => (
    ['SUPER_ADMIN_EMAIL', 'SITE_URL', 'NEXT_PUBLIC_SITE_URL', 'GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT'].includes(key) ||
    ['GMAIL_EMAIL', 'GMAIL_PASSWORD', 'STRIPE_SECRET_KEY', 'STRIPE_WH_SECRET'].includes(key)
  )),
  functionsPublic: Object.keys(envUsage).filter((key) => key.startsWith('PUBLIC_') || key === 'APP_ID'),
  stripe: ['NEXT_PUBLIC_STRIPE_PUBLIC_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WH_SECRET'].filter((key) => envUsage[key]),
  email: ['GMAIL_EMAIL', 'GMAIL_PASSWORD'].filter((key) => envUsage[key]),
  revalidation: ['SUPER_ADMIN_EMAIL', 'FIREBASE_SERVICE_ACCOUNT_JSON', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_PROJECT_ID'].filter((key) => envUsage[key]),
  adminSecurity: ['SUPER_ADMIN_EMAIL'].filter((key) => envUsage[key])
};

const output = {
  ok: !findings.some((finding) => finding.level === 'error'),
  findings,
  manualChecks: [
    'Verify Firebase Console App Check registration/enforcement for sandbox and prod web apps; this static audit only checks client initialization and env wiring.',
    'Verify App Hosting rollout environment values in Firebase Console, because console values override apphosting.yaml.',
    'Verify Functions secrets values and separation per Firebase project: STRIPE_SECRET_KEY, STRIPE_WH_SECRET, GMAIL_EMAIL, GMAIL_PASSWORD.',
    'Verify railProd.requiredBeforeProdRail before creating or validating a production App Hosting rail.'
  ],
  railProd,
  map,
  envUsage
};

console.log(JSON.stringify(output, null, 2));
if (!output.ok) process.exitCode = 1;
