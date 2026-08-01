import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  classifyGoogleAuthError,
  getGoogleAuthErrorMessage,
} from '../src/kit/auth/googleAuthDiagnostics.js';

const firebaseError = (code, message = '') => ({
  code,
  customData: message ? { message } : {},
});

test('Google diagnostics distinguish offline, fetch and popup transport failures', () => {
  const networkError = firebaseError('auth/network-request-failed');
  assert.equal(classifyGoogleAuthError(networkError, { online: false }), 'offline');
  assert.equal(classifyGoogleAuthError(
    firebaseError('auth/network-request-failed', 'TypeError: Failed to fetch'),
    { online: true },
  ), 'auth-fetch-failed');
  assert.equal(classifyGoogleAuthError(networkError, { online: true }), 'firebase-popup-transport');
});

test('Google diagnostics classify popup lifecycle errors explicitly', () => {
  assert.equal(classifyGoogleAuthError(firebaseError('auth/popup-blocked')), 'popup-blocked');
  assert.equal(classifyGoogleAuthError(firebaseError('auth/popup-closed-by-user')), 'popup-closed');
  assert.equal(classifyGoogleAuthError(firebaseError('auth/cancelled-popup-request')), 'popup-conflict');
});

test('network failures receive an actionable retry message without raw details', () => {
  const message = getGoogleAuthErrorMessage(
    firebaseError('auth/network-request-failed', 'sensitive internal URL'),
  );
  assert.match(message, /reessayez/i);
  assert.doesNotMatch(message, /sensitive|URL/);
});
