import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import {
  GCLOUD_GEN2_TARGETS,
  buildGcloudGen2DeployArgs
} from '../scripts/deploy-functions-targeted.mjs';
import {
  EXPECTED_CURRENT_CLOUD_COUNT,
  EXPECTED_CURRENT_SOURCE_COUNT,
  extractLocalExports,
  waveFor
} from '../scripts/functions-gen2-inventory.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const TARGETS = Object.freeze(['stripeWebhookV2Gen2', 'stripeConnectWebhookV2Gen2']);

test('G10 manifest preserves its historical counts while current inventory is fully retired', () => {
  const exported = require(path.join(ROOT, 'functions/index.js'));
  const local = extractLocalExports(ROOT);
  const g10 = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g10.json'));
  assert.equal(g10.metadata.sourceCountAfter, 275);
  assert.equal(g10.metadata.cloudCountObserved, 272);
  assert.equal(Object.keys(exported).length, 150);
  assert.equal(local.length, 150);
  assert.equal(EXPECTED_CURRENT_SOURCE_COUNT, 150);
  assert.equal(EXPECTED_CURRENT_CLOUD_COUNT, 147);
  assert.equal(waveFor('stripeWebhookV2Gen2', 'MIGRATION_PARALLEL'), 'G10');
  assert.equal(waveFor('stripeConnectWebhookV2Gen2', 'MIGRATION_PARALLEL'), 'G10');
  assert.equal(exported.stripeWebhookV2, undefined);
  assert.equal(exported.stripeConnectWebhookV2, undefined);
  assert.equal(exported.stripeWebhook, undefined);
  assert.equal(exported.stripeConnectWebhook, undefined);
  assert.equal(GCLOUD_GEN2_TARGETS.stripeWebhookV2Gen2.entryPoint, 'stripeWebhookV2');
  assert.equal(GCLOUD_GEN2_TARGETS.stripeConnectWebhookV2Gen2.entryPoint, 'stripeConnectWebhookV2');
});

test('G10 targeted deploys bind the one immutable archive and both rollback secrets', () => {
  const digest = 'a'.repeat(64);
  const sourceUri = `gs://gcf-v2-sources-231220287936-europe-west1/g10/${digest}/function-source.zip`;
  for (const name of TARGETS) {
    const target = GCLOUD_GEN2_TARGETS[name];
    assert.equal(target?.g10, true);
    assert.equal(target.runtime, 'nodejs22');
    assert.equal(target.concurrency, '1');
    assert.equal(target.maxInstances, '1');
    assert.deepEqual(target.secrets, [
      'STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4',
      'STRIPE_WH_SECRET=STRIPE_WH_SECRET:3',
      'STRIPE_CONNECT_WH_SECRET=STRIPE_CONNECT_WH_SECRET:1',
      'STRIPE_WH_SECRET_G10=STRIPE_WH_SECRET_G10:1',
      'STRIPE_CONNECT_WH_SECRET_G10=STRIPE_CONNECT_WH_SECRET_G10:1'
    ]);
    const args = buildGcloudGen2DeployArgs({
      transport: 'gcloud-gen2-create',
      project: 'secondevienextjsssr',
      allowlist: [name],
      sourceUri,
      commit: 'b'.repeat(40)
    });
    assert.ok(args.includes(`--source=${sourceUri}`));
    assert.ok(args.includes('--allow-unauthenticated'));
    assert.ok(args.includes(`--entry-point=${name.slice(0, -4)}`));
  }
});

test('G10 accepts the previous and new signing secrets without changing raw bytes', () => {
  const { verifyStripeEventWithSecrets } = require(path.join(
    ROOT,
    'functions/src/commerce/domain/v2Runtime.js'
  ));
  const rawBody = Buffer.from('{"id":"evt_g10_raw","type":"payment_intent.succeeded"}');
  const attempts = [];
  const event = verifyStripeEventWithSecrets({
    webhooks: {
      constructEvent(body, signature, secret) {
        attempts.push({ body, signature, secret });
        if (secret !== 'whsec_g10') throw new Error('signature mismatch');
        return { id: 'evt_g10_raw' };
      }
    }
  }, rawBody, 't=1,v1=g10', ['whsec_previous', 'whsec_g10']);
  assert.equal(event.id, 'evt_g10_raw');
  assert.deepEqual(attempts.map(({ secret }) => secret), ['whsec_previous', 'whsec_g10']);
  assert.ok(attempts.every(({ body }) => body === rawBody));
});

test('G10 HTTP handler rejects unsigned requests before runtime and preserves rawBody', async () => {
  const { createWebhookHandler } = require(path.join(
    ROOT,
    'functions/src/commerce/v2Webhooks.js'
  ));
  let runtimeCalls = 0;
  const replies = [];
  const response = {
    status(code) {
      replies.push({ code });
      return this;
    },
    json(body) {
      replies.at(-1).body = body;
      return this;
    }
  };
  await createWebhookHandler('platform', () => {
    runtimeCalls += 1;
    return {};
  })({ method: 'POST', headers: {}, rawBody: Buffer.from('{}') }, response);
  assert.equal(runtimeCalls, 0);
  assert.deepEqual(replies, [{ code: 400, body: { received: false } }]);

  const rawBody = Buffer.from('{"id":"evt_g10_handler"}');
  let observed = null;
  replies.length = 0;
  await createWebhookHandler('platform', () => ({
    webhookIngress: {
      async ingest(input) {
        observed = input;
        return { ignored: true, eventId: 'evt_g10_handler' };
      }
    },
    webhookWorker: { process: async () => assert.fail('ignored event must not run worker') }
  }))({
    method: 'POST',
    headers: { 'stripe-signature': 't=1,v1=g10' },
    rawBody
  }, response);
  assert.equal(observed.rawBody, rawBody);
  assert.equal(observed.signature, 't=1,v1=g10');
  assert.deepEqual(replies, [{
    code: 200,
    body: { received: true, ignored: true, eventId: 'evt_g10_handler' }
  }]);
});

test('G10 manifest classifies both legacy endpoints from provider and traffic evidence', () => {
  const manifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g10.json'));
  assert.equal(manifest.metadata.wave, 'G10');
  assert.equal(manifest.metadata.w, 0);
  assert.equal(manifest.gates.classificationComplete, true);
  assert.deepEqual(
    manifest.legacy.map(({ name, decision }) => [name, decision.classification]),
    [
      ['stripeWebhook', 'RETIRE_G12_A'],
      ['stripeConnectWebhook', 'RETIRE_G12_A']
    ]
  );
});
