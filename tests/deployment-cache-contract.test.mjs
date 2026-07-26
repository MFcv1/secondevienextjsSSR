import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDeploymentId,
  ensureDeploymentId,
} from '../scripts/deployment-id.mjs';

test('createDeploymentId produit un identifiant unique et compatible Next', () => {
  const first = createDeploymentId({
    now: () => 1_722_000_000_000,
    entropy: () => '010203040506',
  });
  const second = createDeploymentId({
    now: () => 1_722_000_000_000,
    entropy: () => 'a1a2a3a4a5a6',
  });

  assert.match(first, /^[A-Za-z0-9_-]+$/);
  assert.notEqual(first, second);
});

test('ensureDeploymentId conserve un identifiant fourni par le pipeline', () => {
  const environment = { NEXT_DEPLOYMENT_ID: 'sandbox-rollout-123' };
  const result = ensureDeploymentId(environment);

  assert.deepEqual(result, {
    deploymentId: 'sandbox-rollout-123',
    generated: false,
  });
  assert.equal(environment.NEXT_DEPLOYMENT_ID, 'sandbox-rollout-123');
});

test('ensureDeploymentId refuse un identifiant incompatible avec les URL', () => {
  assert.throws(
    () => ensureDeploymentId({ NEXT_DEPLOYMENT_ID: 'rollout avec espaces' }),
    /uniquement des lettres, chiffres, tirets ou underscores/,
  );
});

test('next.config active la protection de version et borne le stale ISR', async () => {
  const previousDeploymentId = process.env.NEXT_DEPLOYMENT_ID;
  process.env.NEXT_DEPLOYMENT_ID = 'contract-deployment-123';

  try {
    const { default: nextConfig } = await import(
      `../next.config.mjs?deployment-cache-contract=${Date.now()}`
    );

    assert.equal(nextConfig.deploymentId, 'contract-deployment-123');
    assert.equal(nextConfig.expireTime, 300);
  } finally {
    if (previousDeploymentId === undefined) {
      delete process.env.NEXT_DEPLOYMENT_ID;
    } else {
      process.env.NEXT_DEPLOYMENT_ID = previousDeploymentId;
    }
  }
});
