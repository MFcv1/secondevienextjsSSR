import assert from 'node:assert/strict';
import { test } from 'node:test';

import { signInWithCustomTokenResilient } from '../src/kit/auth/customTokenSignIn.js';

const networkError = () => Object.assign(new Error('transient network failure'), {
  code: 'auth/network-request-failed',
});

test('custom-token sign-in retries bounded network failures with the same token', async () => {
  const attempts = [];
  const waits = [];
  const auth = { name: 'fixture-auth' };
  const authModule = {
    signInWithCustomToken: async (receivedAuth, token) => {
      attempts.push([receivedAuth, token]);
      if (attempts.length < 3) throw networkError();
      return { user: { uid: 'fixture-user' } };
    },
  };

  const result = await signInWithCustomTokenResilient({
    authModule,
    auth,
    token: 'fixture-token',
    retryDelays: [10, 20],
    wait: async (delay) => waits.push(delay),
  });

  assert.equal(result.user.uid, 'fixture-user');
  assert.deepEqual(waits, [10, 20]);
  assert.deepEqual(attempts, [
    [auth, 'fixture-token'],
    [auth, 'fixture-token'],
    [auth, 'fixture-token'],
  ]);
});

test('custom-token sign-in does not retry a non-network Firebase error', async () => {
  let attempts = 0;
  const invalidTokenError = Object.assign(new Error('invalid token'), {
    code: 'auth/invalid-custom-token',
  });

  await assert.rejects(
    signInWithCustomTokenResilient({
      authModule: {
        signInWithCustomToken: async () => {
          attempts += 1;
          throw invalidTokenError;
        },
      },
      auth: {},
      token: 'fixture-token',
      wait: async () => assert.fail('wait must not run for a non-network error'),
    }),
    invalidTokenError,
  );
  assert.equal(attempts, 1);
});

test('custom-token sign-in stops after the configured network retry budget', async () => {
  let attempts = 0;
  const waits = [];

  await assert.rejects(
    signInWithCustomTokenResilient({
      authModule: {
        signInWithCustomToken: async () => {
          attempts += 1;
          throw networkError();
        },
      },
      auth: {},
      token: 'fixture-token',
      retryDelays: [10, 20],
      wait: async (delay) => waits.push(delay),
    }),
    { code: 'auth/network-request-failed' },
  );
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [10, 20]);
});
