const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();

const readText = (relativePath) => {
  const fullPath = path.join(ROOT, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
};

const readJson = (relativePath) => {
  const content = readText(relativePath);
  return content ? JSON.parse(content) : null;
};

const findings = [];
const addFinding = (level, area, message) => findings.push({ level, area, message });

const firebaserc = readJson('.firebaserc') || {};
const firebaseJson = readJson('firebase.json') || {};
const apphosting = readText('apphosting.yaml');
const firebaseIgnore = readText('.firebaseignore');
const functionsIndex = readText('functions/index.js');
const functionsPublicIndex = readText('functions-public/index.js');
const firestoreRules = readText('firestore.rules');
const storageRules = readText('storage.rules');

const defaultProject = firebaserc.projects?.default;
if (defaultProject !== 'secondevienextjsssr') {
  addFinding('error', 'firebase-project', `.firebaserc default should stay sandbox secondevienextjsssr, got "${defaultProject || 'missing'}"`);
}
if (firebaserc.projects && Object.keys(firebaserc.projects).some((alias) => alias !== 'default')) {
  addFinding('warn', 'firebase-project', 'Additional project aliases exist; verify no prod deploy command can use the sandbox dashboard by accident');
}

const appHostingBackend = firebaseJson.apphosting?.[0];
if (!appHostingBackend) {
  addFinding('error', 'app-hosting', 'firebase.json missing apphosting backend config');
} else {
  if (appHostingBackend.backendId !== 'secondevie-next-sandbox') {
    addFinding('error', 'app-hosting', `App Hosting backend should stay sandbox-only, got "${appHostingBackend.backendId}"`);
  }
  const ignored = new Set(appHostingBackend.ignore || []);
  for (const pattern of ['functions', 'functions-public', '.next', 'logs', 'test-results', 'playwright-report']) {
    if (!ignored.has(pattern)) addFinding('error', 'app-hosting', `App Hosting ignore missing "${pattern}"`);
  }
}

if (!apphosting.includes('NEXT_PUBLIC_SITE_URL')) {
  addFinding('error', 'app-hosting-env', 'apphosting.yaml missing NEXT_PUBLIC_SITE_URL');
}
if (apphosting.includes('STRIPE_SECRET_KEY') || apphosting.includes('STRIPE_WH_SECRET') || apphosting.includes('GMAIL_PASSWORD')) {
  addFinding('error', 'app-hosting-env', 'App Hosting config must not contain Functions secrets');
}
if (!apphosting.includes('secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app')) {
  addFinding('warn', 'app-hosting-env', 'NEXT_PUBLIC_SITE_URL does not point to the documented sandbox hosted.app URL');
}

const functionsCodebases = new Map((firebaseJson.functions || []).map((entry) => [entry.codebase, entry.source]));
if (functionsCodebases.get('main') !== 'functions') {
  addFinding('error', 'functions', 'firebase.json must keep main codebase at functions');
}
if (functionsCodebases.get('public') !== 'functions-public') {
  addFinding('error', 'functions', 'firebase.json must keep public codebase at functions-public');
}
if (!functionsPublicIndex.includes('exports.publicCatalog')) {
  addFinding('error', 'functions-public', 'functions-public/index.js must export publicCatalog');
}
if (functionsPublicIndex.includes('STRIPE') || functionsPublicIndex.includes('GMAIL')) {
  addFinding('error', 'functions-public', 'functions-public must not reference Stripe or Gmail secrets');
}
if (!functionsIndex.includes('exports.stripeWebhook') || !functionsIndex.includes('exports.createOrder')) {
  addFinding('error', 'functions-main', 'functions/index.js missing commerce exports');
}
if (!functionsIndex.includes('exports.sendTestEmail')) {
  addFinding('warn', 'functions-main', 'functions/index.js should export sendTestEmail while admin diagnostic button exists');
}

if (firebaseJson.firestore?.rules !== 'firestore.rules') {
  addFinding('error', 'firestore', 'firebase.json firestore.rules path mismatch');
}
if (firebaseJson.firestore?.indexes !== 'firestore.indexes.json') {
  addFinding('error', 'firestore', 'firebase.json firestore.indexes path mismatch');
}
if (!firestoreRules.includes('artifacts/{appId}/public/data')) {
  addFinding('warn', 'firestore', 'firestore.rules should be reviewed for public catalog path artifacts/{appId}/public/data');
}
if (firebaseJson.storage?.rules !== 'storage.rules') {
  addFinding('error', 'storage', 'firebase.json storage.rules path mismatch');
}
if (!storageRules.includes('allow read')) {
  addFinding('warn', 'storage', 'storage.rules should be reviewed for public image read access');
}

const firebaseIgnoreLines = new Set(firebaseIgnore.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
for (const pattern of ['.env*', 'service-account.json', '*.pem', '*.key']) {
  if (!firebaseIgnoreLines.has(pattern)) addFinding('error', 'secret-hygiene', `.firebaseignore missing "${pattern}"`);
}

if (firebaseJson.hosting?.rewrites?.some((rewrite) => rewrite.function)) {
  addFinding('warn', 'legacy-hosting', 'Firebase Hosting rewrites still point to legacy SEO Functions; keep documented until removed deliberately');
}

const output = {
  ok: !findings.some((finding) => finding.level === 'error'),
  findings,
  summary: {
    firebaseDefaultProject: defaultProject || null,
    appHostingBackendId: appHostingBackend?.backendId || null,
    functionsCodebases: Object.fromEntries(functionsCodebases),
    legacyHostingRewriteFunctions: (firebaseJson.hosting?.rewrites || [])
      .filter((rewrite) => rewrite.function)
      .map((rewrite) => `${rewrite.source} -> ${rewrite.function}`)
  }
};

console.log(JSON.stringify(output, null, 2));
if (!output.ok) process.exitCode = 1;
