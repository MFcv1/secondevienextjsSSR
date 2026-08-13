import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getFreshAdminIdToken,
  isAdminTokenNetworkError,
} from '../src/kit/admin/adminTokenRetry.js';

const networkError = () => Object.assign(
  new Error('Firebase: Error (auth/network-request-failed).'),
  { code: 'auth/network-request-failed' }
);

test('admin token refresh retries two transient network failures then succeeds', async () => {
  let calls = 0;
  const sleeps = [];
  const user = {
    async getIdToken(forceRefresh) {
      assert.equal(forceRefresh, true);
      calls += 1;
      if (calls < 3) throw networkError();
      return 'fresh-admin-token';
    },
  };

  const token = await getFreshAdminIdToken(user, {
    retryDelays: [10, 20],
    sleep: async (delay) => sleeps.push(delay),
  });

  assert.equal(token, 'fresh-admin-token');
  assert.equal(calls, 3);
  assert.deepEqual(sleeps, [10, 20]);
});

test('admin token refresh does not retry authorization failures', async () => {
  let calls = 0;
  const denied = Object.assign(new Error('User disabled'), { code: 'auth/user-disabled' });
  const user = {
    async getIdToken() {
      calls += 1;
      throw denied;
    },
  };

  await assert.rejects(
    getFreshAdminIdToken(user, {
      retryDelays: [10, 20],
      sleep: async () => assert.fail('sleep must not run'),
    }),
    (error) => error === denied
  );
  assert.equal(calls, 1);
  assert.equal(isAdminTokenNetworkError(denied), false);
});

test('admin token refresh remains bounded after three network attempts', async () => {
  let calls = 0;
  const user = {
    async getIdToken() {
      calls += 1;
      throw networkError();
    },
  };

  await assert.rejects(
    getFreshAdminIdToken(user, {
      retryDelays: [10, 20],
      sleep: async () => {},
    }),
    (error) => error.code === 'auth/network-request-failed'
  );
  assert.equal(calls, 3);
});
