import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import * as webauthn from '@simplewebauthn/server';
import passkeyCore from '../functions/src/auth/passkeyHandlers.cjs';
import { createPasskeyPost, PasskeyHttpError } from '../src/lib/server/passkeyHttp.mjs';
import { resolvePublicAuthClientIp } from '../src/lib/server/publicAuthClientIp.mjs';
import { PASSKEY_OPERATIONS, getPasskeyEndpoint } from '../shared/passkeyTransport.mjs';

const bodyModule = readFileSync(new URL('../src/lib/server/requestBody.js', import.meta.url), 'utf8')
  .replace("import 'server-only';", '');
const { readBoundedJsonBody } = await import(`data:text/javascript;base64,${Buffer.from(bodyModule).toString('base64')}`);
const origin = 'https://site.example';
const operation = 'generatePasskeyAuthenticationOptions';
function request({ data = {}, headers = {}, raw, method = 'POST' } = {}) {
  return new Request(`${origin}/api/auth/passkeys/${operation}`, {
    method,
    headers: { origin, 'content-type': 'application/json', 'x-firebase-appcheck': 'test-attestation', ...headers },
    ...(method === 'POST' ? { body: raw ?? JSON.stringify({ data }) } : {}),
  });
}
function setup(overrides = {}) {
  const calls = [];
  const handler = async (data, context) => { calls.push({ data, context }); return { options: { challenge: 'test-challenge' } }; };
  return {
    calls,
    post: createPasskeyPost({
      enabled: () => true, origin: () => origin,
      verifyAppCheck: async () => ({ appId: 'test-app' }),
      verifyIdToken: async () => ({ uid: 'test-user', email: 'test@example.com' }),
      resolveClientIp: () => '192.0.2.10', readBody: readBoundedJsonBody,
      getHandlers: async () => Object.fromEntries(Object.values(PASSKEY_OPERATIONS).map(name => [name, handler])),
      log: () => {}, ...overrides,
    }),
  };
}

test('closed transport registry keeps rollback and unmigrated operations on Functions', () => {
  for (const name of Object.keys(PASSKEY_OPERATIONS)) {
    assert.equal(getPasskeyEndpoint(name, 'apphosting'), `/api/auth/passkeys/${name}`);
    assert.equal(getPasskeyEndpoint(name, 'functions'), null);
    assert.equal(getPasskeyEndpoint(name, undefined), null);
  }
  for (const name of ['__proto__', 'constructor', 'createCheckoutV2', '../admin']) {
    assert.equal(getPasskeyEndpoint(name, 'apphosting'), null);
  }
});

test('direct handler preserves callable data, verified context and private headers', async () => {
  const { post, calls } = setup();
  const response = await post(request({ data: { email: 'test@example.com' } }), operation);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { options: { challenge: 'test-challenge' } } });
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  assert.equal(calls[0].context.auth, undefined);
  assert.equal(calls[0].context.app.appId, 'test-app');
  assert.equal(calls[0].context.rawRequest.ip, '192.0.2.10');
});

test('invalid operation, disabled rollout, origin and method are rejected before dependencies', async () => {
  const { post, calls } = setup({ verifyAppCheck: () => assert.fail('must not verify') });
  assert.equal((await post(request(), '__proto__')).status, 404);
  assert.equal((await post(request({ headers: { origin: 'https://evil.example' } }), operation)).status, 403);
  assert.equal((await post(request({ data: { origin: 'http://localhost:3000' } }), operation)).status, 403);
  assert.equal((await post(request({ method: 'GET' }), operation)).status, 405);
  assert.equal((await setup({ enabled: () => false }).post(request(), operation)).status, 503);
  assert.equal(calls.length, 0);
});

test('App Check and supplied Auth tokens fail closed before any business operation', async () => {
  for (const overrides of [
    { verifyAppCheck: async () => { throw Error('private attestation details'); } },
    { verifyIdToken: async () => { throw Error('revoked secret token'); } },
  ]) {
    const { post, calls } = setup(overrides);
    const response = await post(request({ headers: { authorization: 'Bearer test-token' } }), operation);
    assert.equal(response.status, 401);
    assert.equal(calls.length, 0);
    assert.doesNotMatch(await response.text(), /secret|private attestation/);
  }
  for (const headers of [{ 'x-firebase-appcheck': '' }, { authorization: 'Basic invalid' }]) {
    const { post, calls } = setup();
    assert.equal((await post(request({ headers }), operation)).status, 401);
    assert.equal(calls.length, 0);
  }
});

test('registration requires Auth; verified token reaches the shared registration guard', async () => {
  const { post, calls } = setup();
  assert.equal((await post(request(), 'generatePasskeyRegistrationOptions')).status, 401);
  const response = await post(request({ headers: { authorization: 'Bearer test-token' } }), 'generatePasskeyRegistrationOptions');
  assert.equal(response.status, 200);
  assert.equal(calls[0].context.auth.uid, 'test-user');
  assert.equal(calls[0].context.auth.token.email, 'test@example.com');
});

test('malformed, oversized and unsupported bodies never reach the handler', async () => {
  for (const [args, status] of [
    [{ raw: '{' }, 400], [{ raw: '{"data":{},"unexpected":true}' }, 400],
    [{ raw: '{"data":[]}' }, 400], [{ data: { large: 'x'.repeat(65536) } }, 413],
    [{ headers: { 'content-type': 'text/plain' } }, 415],
  ]) {
    const { post, calls } = setup();
    assert.equal((await post(request(args), operation)).status, status);
    assert.equal(calls.length, 0);
  }
});

test('unknown proxy configuration rejects requests instead of sharing an unknown limiter', async () => {
  const { post, calls } = setup({ resolveClientIp: () => null });
  assert.equal((await post(request(), operation)).status, 503);
  assert.equal(calls.length, 0);
});

test('domain errors keep Firebase error codes; unexpected errors are redacted and never retried', async () => {
  for (const error of [new PasskeyHttpError('aborted', 'Recommencez.'), new Error('private backend token')]) {
    let invoked = 0;
    const { post } = setup({ getHandlers: async () => ({
      generatePasskeyAuthenticationOptionsHandler: async () => { invoked++; throw error; },
    }) });
    const response = await post(request(), operation);
    assert.equal(invoked, 1);
    assert.equal(response.status, error instanceof PasskeyHttpError ? 409 : 500);
    const payload = await response.json();
    assert.equal(payload.error.status, error instanceof PasskeyHttpError ? 'ABORTED' : 'INTERNAL');
    assert.doesNotMatch(JSON.stringify(payload), /private backend token/);
  }
});

test('IP adapter selects the configured trusted suffix and canonicalizes IPv6', () => {
  const req = request({ headers: { 'x-forwarded-for': '198.51.100.99, 192.0.2.10, 203.0.113.1' } });
  assert.equal(resolvePublicAuthClientIp(req, 2), '192.0.2.10');
  for (const hops of [undefined, '', 0, 5, 1.5]) assert.equal(resolvePublicAuthClientIp(req, hops), null);
  assert.equal(resolvePublicAuthClientIp(request(), 2), null);
  assert.equal(resolvePublicAuthClientIp(request({ headers: { 'x-forwarded-for': 'garbage, 203.0.113.1' } }), 2), null);
  assert.equal(resolvePublicAuthClientIp(request({ headers: { 'x-forwarded-for': '2001:0db8::1, 203.0.113.1' } }), 2), '2001:db8::1');
});

test('shared passkey logic loads without initializing Firebase or importing Functions deployment modules', () => {
  const require = createRequire(import.meta.url);
  const before = new Set(Object.keys(require.cache));
  const core = require('../functions/src/auth/passkeyHandlers.cjs');
  assert.equal(typeof core.createPasskeyHandlers, 'function');
  const additions = Object.keys(require.cache).filter(path => !before.has(path));
  assert.ok(additions.every(path => !/node_modules/.test(path)));
});

function signedPasskeyRuntime() {
  const records = new Map();
  let tail = Promise.resolve();
  let minted = 0;
  const doc = (path) => ({
    path,
    get: async () => ({ exists: records.has(path), data: () => structuredClone(records.get(path)) }),
    set: async (data, options) => records.set(path, options?.merge ? { ...records.get(path), ...data } : data),
    update: async (data) => records.set(path, { ...records.get(path), ...data }),
    delete: async () => records.delete(path),
  });
  const db = {
    doc,
    collection: (path) => ({ get: async () => ({ docs: [...records.entries()]
      .filter(([key]) => key.startsWith(path + '/') && key.slice(path.length + 1).indexOf('/') < 0)
      .map(([key, value]) => ({ id: key.split('/').at(-1), data: () => structuredClone(value) })) }) }),
    runTransaction: (callback) => {
      const run = tail.then(() => callback({
        get: ref => ref.get(), set: (ref, data, options) => ref.set(data, options),
        update: (ref, data) => ref.update(data), delete: ref => ref.delete(),
      }));
      tail = run.catch(() => {});
      return run;
    },
  };
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = publicKey.export({ format: 'jwk' });
  // COSE EC2/P-256 key: kty=2, alg=-7, crv=1, x/y coordinates.
  const cose = Buffer.concat([
    Buffer.from('a5010203262001215820', 'hex'), Buffer.from(jwk.x, 'base64url'),
    Buffer.from('225820', 'hex'), Buffer.from(jwk.y, 'base64url'),
  ]);
  const credentialId = randomBytes(32).toString('base64url');
  const credentialPath = `users/test-user/passkeys/${credentialId}`;
  records.set(credentialPath, { credentialId, publicKey: cose.toString('base64url'), counter: 0 });
  const firestore = Object.assign(() => db, {
    FieldValue: { serverTimestamp: () => 'test-server-time' },
    Timestamp: { fromMillis: value => value },
  });
  const handlers = passkeyCore.createPasskeyHandlers({
    admin: {
      firestore,
      auth: () => ({
        getUserByEmail: async () => ({ uid: 'test-user' }),
        createCustomToken: async (uid, claims) => {
          assert.equal(uid, 'test-user');
          assert.equal(claims.userVerified, true);
          assert.equal(claims.authAssurance, 'aal2');
          minted++;
          return 'test-only-custom-token';
        },
      }),
    },
    HttpsError: PasskeyHttpError, webauthn, getSiteUrl: () => origin,
    getRateLimitClientIp: context => context.rawRequest.ip,
    authorizePasskeyRegistration: async () => assert.fail('authentication test'),
    createPasskeyTimer: () => () => {}, logFunctionPerf: () => {},
  });
  const { post } = setup({ getHandlers: async () => handlers });
  const assertion = (challenge, flags = 5) => {
    const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge, origin, crossOrigin: false }));
    const counter = Buffer.alloc(4);
    counter.writeUInt32BE(1);
    const authenticatorData = Buffer.concat([
      createHash('sha256').update('site.example').digest(), Buffer.from([flags]), counter,
    ]);
    const signed = Buffer.concat([authenticatorData, createHash('sha256').update(clientDataJSON).digest()]);
    return {
      id: credentialId, rawId: credentialId, type: 'public-key', clientExtensionResults: {},
      response: {
        clientDataJSON: clientDataJSON.toString('base64url'),
        authenticatorData: authenticatorData.toString('base64url'),
        signature: sign('sha256', signed, privateKey).toString('base64url'),
      },
    };
  };
  return { post, assertion, records, credentialPath, minted: () => minted };
}

test('real WebAuthn signature through HTTP consumes the shared challenge once, including concurrent replay', async () => {
  const runtime = signedPasskeyRuntime();
  const options = await runtime.post(request({ data: { email: 'test@example.com', origin } }), operation);
  assert.equal(options.status, 200);
  const challenge = (await options.json()).data.options.challenge;
  const data = { challenge, response: runtime.assertion(challenge) };
  const results = await Promise.all([0, 1].map(() => runtime.post(request({ data }), 'verifyPasskeyAuthentication')));
  assert.deepEqual(results.map(response => response.status).sort(), [200, 400]);
  assert.equal(runtime.minted(), 1);
  assert.equal(runtime.records.get(runtime.credentialPath).counter, 1);
  assert.equal((await runtime.post(request({ data }), 'verifyPasskeyAuthentication')).status, 400);
  assert.equal(runtime.minted(), 1);
});

test('real signed credential without user verification is refused without minting a token', async () => {
  const runtime = signedPasskeyRuntime();
  const options = await runtime.post(request({ data: { email: 'test@example.com', origin } }), operation);
  const challenge = (await options.json()).data.options.challenge;
  const response = await runtime.post(request({ data: {
    challenge, response: runtime.assertion(challenge, 1),
  } }), 'verifyPasskeyAuthentication');
  assert.equal(response.status, 403);
  assert.equal(runtime.minted(), 0);
  assert.equal(runtime.records.get(runtime.credentialPath).counter, 0);
});
