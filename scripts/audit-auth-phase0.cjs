const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = process.cwd();
const read = (relativePath) => {
  try {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};
const hasCommand = (command, windowsCandidates = []) => {
  const candidates = process.platform === 'win32'
    ? [command, `${command}.cmd`, ...windowsCandidates]
    : [command];
  for (const candidate of candidates) {
    if (path.isAbsolute(candidate)) {
      if (fs.existsSync(candidate)) return true;
      continue;
    }
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore', timeout: 3000, shell: process.platform === 'win32' });
      return true;
    } catch {
      // Try the next supported command location.
    }
  }
  return false;
};
const envKeys = (relativePath) => new Set(
  read(relativePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => line.slice(0, line.indexOf('=')).trim())
);
const count = (text, pattern) => [...text.matchAll(pattern)].length;

const apphosting = read('apphosting.yaml');
const firebaseCore = read('src/kit/config/firebaseCore.js');
const passkeys = read('functions/src/auth/passkeys.js');
const mailEnv = envKeys('logs/e2e-mail.env');
const passkeyExports = [
  'generatePasskeyRegistrationOptions',
  'verifyPasskeyRegistration',
  'generatePasskeyAuthenticationOptions',
  'verifyPasskeyAuthentication',
];
const protectedPasskeyExports = passkeyExports.filter((name) => {
  const exportIndex = passkeys.indexOf(`exports.${name}`);
  if (exportIndex < 0) return false;
  const declaration = passkeys.slice(Math.max(0, exportIndex - 180), exportIndex + 180);
  return /enforceAppCheck\s*:\s*true/.test(declaration);
});
const sandboxUrl = apphosting.match(/https:\/\/[^"\s]+\.hosted\.app/)?.[0] || null;
const challengeTtl = passkeys.match(/CHALLENGE_TTL_MS\s*=\s*([^;\r\n]+)/)?.[1]?.trim() || null;

const existingRuns = [];
const logsDir = path.join(root, 'logs');
if (fs.existsSync(logsDir)) {
  for (const name of fs.readdirSync(logsDir)) {
    if (!/^auth-email-otp-e2e-.*\.json$/i.test(name)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(logsDir, name), 'utf8'));
      existingRuns.push({ file: name, status: data.status || 'unknown' });
    } catch {
      existingRuns.push({ file: name, status: 'unreadable' });
    }
  }
}

const blockers = [];
if (sandboxUrl) blockers.push('AUTH-000: le domaine canonique et le RP ID de production ne sont pas fixes; apphosting.yaml cible encore le sandbox.');
if (/endsWith\(['"]\.hosted\.app['"]\)/.test(passkeys)) blockers.push('AUTH-000: les origines passkey autorisent encore la wildcard de famille .hosted.app.');
if (protectedPasskeyExports.length !== passkeyExports.length) blockers.push(`AUTH-001/AUTH-300: App Check n'est visible que sur ${protectedPasskeyExports.length}/${passkeyExports.length} callables passkey.`);
if (process.version.split('.')[0] !== 'v22') blockers.push(`Gate locale: audit execute sous ${process.version}; le projet exige Node 22.x.`);

const manualChecks = [
  'Firebase Auth: fournisseurs actifs, politique un compte par email et domaines autorises.',
  'Google OAuth: redirect URIs exactes pour sandbox et production.',
  'App Check: application web enregistree, enforcement par produit et token debug reserve aux tests.',
  'Firestore/Functions: regions reelles, politiques TTL, quotas et alertes.',
  'Identity Platform/MFA: activation et politique retenue.',
];

const report = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  projectNodeRequirement: '22.x',
  repository: {
    sandboxUrl,
    authDomainConfigured: /NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN/.test(apphosting),
    functionsRegionConfigured: /NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION/.test(apphosting) || /europe-west1/.test(firebaseCore),
    passkeyHostedAppWildcard: /endsWith\(['"]\.hosted\.app['"]\)/.test(passkeys),
    passkeyCallableCount: passkeyExports.filter((name) => passkeys.includes(`exports.${name}`)).length,
    passkeyAppCheckProtectedCount: protectedPasskeyExports.length,
    challengeTtlExpression: challengeTtl,
    temporaryChallengeExpiryWrites: count(passkeys, /expiresAtMillis\s*:/g),
  },
  testReadiness: {
    mailboxUserPresent: mailEnv.has('E2E_MAILBOX_USER'),
    gmailApplicationPasswordPresent: mailEnv.has('E2E_GMAIL_APP_PASSWORD'),
    appCheckDebugTokenPresent: mailEnv.has('E2E_APPCHECK_DEBUG_TOKEN'),
    existingEmailOtpRuns: existingRuns,
  },
  tooling: {
    firebaseCliAvailable: hasCommand('firebase', [
      path.join(process.env.LOCALAPPDATA || '', 'nvm', 'v22.23.1', 'firebase.cmd'),
      path.join(process.env.APPDATA || '', 'npm', 'firebase.cmd'),
    ]),
    gcloudCliAvailable: hasCommand('gcloud', [
      path.join(process.env.LOCALAPPDATA || '', 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin', 'gcloud.cmd'),
    ]),
  },
  phase0Conclusive: blockers.length === 0 && manualChecks.length === 0,
  blockers,
  manualChecks,
  note: 'Aucune valeur de secret, adresse de test, UID ou code OTP n est incluse.',
};

console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--assert') && !report.phase0Conclusive) process.exitCode = 1;
