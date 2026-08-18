const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const source = fs.readFileSync(path.resolve(__dirname, '../functions/src/auth/passkeys.js'), 'utf8');

test('all four passkey callables enforce App Check', () => {
  assert.equal((source.match(/runWith\(\{ enforceAppCheck: true \}\)\.https\.onCall/g) || []).length, 4);
  assert.match(source, /PASSKEY_AUTH_GEN2_RUNTIME[\s\S]*enforceAppCheck:\s*true/);
  assert.match(source, /PASSKEY_REGISTRATION_GEN2_RUNTIME[\s\S]*enforceAppCheck:\s*true/);
});

test('registration and authentication require local user verification', () => {
  const requiredOptions = source.match(/userVerification:\s*'required'/g) || [];
  const requiredVerifications = source.match(/requireUserVerification:\s*true/g) || [];

  assert.equal(requiredOptions.length, 2);
  assert.equal(requiredVerifications.length, 2);
  assert.doesNotMatch(source, /userVerification:\s*'preferred'/);
  assert.doesNotMatch(source, /requireUserVerification:\s*false/);
  assert.match(source, /ceremony === 'registration'[\s\S]*verification\?\.registrationInfo[\s\S]*verification\?\.authenticationInfo/);
  assert.match(source, /verificationInfo\?\.userVerified === true/);
  assert.match(source, /Confirmez votre identite avec Windows Hello, Face ID ou le code de votre appareil\./);
});

test('origins are exact and no hosted.app wildcard remains', () => {
  assert.match(source, /allowedOrigins\.has\(url\.origin\)/);
  assert.match(source, /secondevie-next-sandbox--\$\{projectId\}\.europe-west4\.hosted\.app/);
  assert.doesNotMatch(source, /endsWith\(['"]\.hosted\.app/);
});

test('temporary documents use five-minute Firestore TTL timestamps', () => {
  assert.match(source, /CHALLENGE_TTL_MS = 5 \* 60 \* 1000/);
  assert.ok((source.match(/Timestamp\.fromMillis\(expiresAtMillis\)/g) || []).length >= 2);
  assert.doesNotMatch(source, /SYSTEM_DOC_RETENTION_DAYS/);
});

test('challenge consumption and credential counters are transactional', () => {
  assert.ok((source.match(/db\.runTransaction/g) || []).length >= 4);
  assert.match(source, /assertActiveChallenge\(freshChallengeSnap/);
  assert.match(source, /transaction\.delete\(challengeRef\)/);
});

test('abuse limits and input bounds are explicit', () => {
  assert.match(source, /MAX_PASSKEYS_PER_USER = 10/);
  assert.match(source, /MAX_CHALLENGE_ATTEMPTS = 5/);
  assert.match(source, /authentication-ip:/);
  assert.match(source, /authentication-email:/);
  assert.match(source, /assertCredentialResponse/);
  assert.match(source, /BASE64URL_PATTERN/);
});

test('unknown users receive fake options without raw email challenge storage', () => {
  assert.match(source, /crypto\.randomBytes\(32\)/);
  const challengeWrite = source.slice(source.indexOf("db.doc(`sys_ratelimit/passkey_auth_"), source.indexOf("logFunctionPerf('generatePasskeyAuthenticationOptions'"));
  assert.doesNotMatch(challengeWrite, /\bemail\s*,/);
  assert.doesNotMatch(source, /Aucune passkey active pour cet email/);
});

test('custom-token mint has one idempotent retry without storing the token', () => {
  assert.match(source, /status: 'verified'/);
  assert.match(source, /status: 'failed_retryable'/);
  assert.match(source, /status: 'token_issued'/);
  assert.match(source, /Number\(operation\.retryCount \|\| 0\) < 1/);
  assert.match(source, /operation\.responseHash === responseHash/);
  assert.doesNotMatch(source, /token\s*:\s*token/);
});
