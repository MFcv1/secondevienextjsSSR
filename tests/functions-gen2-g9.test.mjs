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
  ACTIVE_OBSERVABILITY_EXPORTS,
  EXPECTED_CURRENT_CLOUD_COUNT,
  EXPECTED_CURRENT_SOURCE_COUNT,
  PARALLEL_MIGRATION_EXPORTS,
  PENDING_OBSERVABILITY_EXPORTS,
  extractLocalExports,
  waveFor
} from '../scripts/functions-gen2-inventory.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const LOGICAL = Object.freeze([
  'getCommerceOperationsStatusAdmin', 'rebuildCommerceOperationsAdmin',
  'cleanupFixtureRunAdmin', 'getStripeConnectStatus', 'startStripeConnectOnboarding',
  'syncStripeConnectAccount', 'requestStripeConnectReconnect',
  'confirmStripeConnectReconnect', 'createAdminPaymentLink', 'listAdminPaymentLinks',
  'extendAdminPaymentLink', 'regenerateAdminPaymentLink', 'recreateAdminPaymentLink',
  'cancelAdminPaymentLink', 'getAdminPaymentLinkPublic',
  'prepareAdminPaymentLinkPayment', 'resumeAdminPaymentLinkPayment',
  'createCheckoutV2', 'resumeCheckoutV2', 'requestRefundAdmin',
  'commerceOperationsReconciler', 'commerceOutboxDispatcher',
  'commerceReservationExpiryDispatcher', 'expireAdminPaymentLinks'
]);
const SCHEDULERS = new Set([
  'commerceOperationsReconciler', 'commerceOutboxDispatcher',
  'commerceReservationExpiryDispatcher', 'expireAdminPaymentLinks'
]);
const TARGETS = Object.freeze(LOGICAL.map((name) => `${name}Gen2`));

test('G9 preserve le Scheduler outbox HTTP existant pendant une remediation', () => {
  const target = GCLOUD_GEN2_TARGETS.commerceOutboxDispatcherGen2;
  assert.equal(target.schedulerUpdateRequired, false);
  assert.equal(
    target.expectedSchedulerAudience,
    'https://commerceoutboxdispatchergen2-evkkvyaaga-ew.a.run.app'
  );
  assert.equal(target.schedulerAttemptDeadline, '300s');
  assert.deepEqual(target.environmentVariables, [
    'SITE_URL=https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app'
  ]);
  const args = buildGcloudGen2DeployArgs({
    transport: 'gcloud-gen2-update',
    project: 'secondevienextjsssr',
    allowlist: ['commerceOutboxDispatcherGen2'],
    sourceUri: `gs://gcf-v2-sources-231220287936-europe-west1/g9/${'a'.repeat(64)}/function-source.zip`,
    commit: 'b'.repeat(40)
  });
  assert.ok(args.includes(
    '--set-env-vars=SITE_URL=https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app'
  ));
});

function createFakeDb() {
  const documents = new Map();
  let serial = Promise.resolve();
  return {
    documents,
    doc: (name) => ({ name }),
    runTransaction: (callback) => {
      const execute = async () => callback({
        get: async (reference) => ({
          exists: documents.has(reference.name),
          data: () => documents.get(reference.name)
        }),
        set: (reference, value, options = {}) => {
          const next = options.merge
            ? { ...(documents.get(reference.name) || {}), ...value }
            : value;
          documents.set(reference.name, next);
        }
      });
      const result = serial.then(execute, execute);
      serial = result.then(() => undefined, () => undefined);
      return result;
    }
  };
}

test('G9 exposes exactly 24 Gen2 targets after retirement of every matching Gen1', () => {
  const exported = require(path.join(ROOT, 'functions/index.js'));
  assert.equal(Object.keys(exported).length, 151);
  assert.equal(LOGICAL.length, 24);
  for (const name of LOGICAL) {
    assert.equal(exported[name], undefined, `${name} Gen1 encore exportee`);
    assert.equal(typeof exported[`${name}Gen2`], 'function', `${name}Gen2 absente`);
    assert.equal(waveFor(`${name}Gen2`, 'MIGRATION_PARALLEL'), 'G9');
  }
});

test('G9 inventory counts are recalculated from the complete source set', () => {
  const exports = extractLocalExports(ROOT);
  assert.equal(exports.length, 151);
  assert.equal(EXPECTED_CURRENT_SOURCE_COUNT, 151);
  assert.equal(EXPECTED_CURRENT_CLOUD_COUNT, 148);
  assert.equal(PARALLEL_MIGRATION_EXPORTS.size, 119);
  assert.deepEqual(
    exports.filter(({ name }) => name.endsWith('Gen2') && !PARALLEL_MIGRATION_EXPORTS.has(name) && !PENDING_OBSERVABILITY_EXPORTS.has(name) && !ACTIVE_OBSERVABILITY_EXPORTS.has(name)),
    []
  );
});

test('G9 deploy definitions bind one immutable archive, exact secrets and scheduler identities', () => {
  const digest = 'a'.repeat(64);
  const sourceUri = `gs://gcf-v2-sources-231220287936-europe-west1/g9/${digest}/function-source.zip`;
  for (const name of TARGETS) {
    const target = GCLOUD_GEN2_TARGETS[name];
    assert.equal(target?.g9, true, `${name}: definition G9 absente`);
    assert.equal(target.runtime, 'nodejs22');
    assert.equal(target.concurrency, '1');
    assert.equal(target.maxInstances, '1');
    const args = buildGcloudGen2DeployArgs({
      transport: 'gcloud-gen2-create', project: 'secondevienextjsssr',
      allowlist: [name], sourceUri, commit: 'b'.repeat(40)
    });
    assert.ok(args.includes(`--source=${sourceUri}`));
    assert.ok(args.includes(SCHEDULERS.has(name.slice(0, -4))
      ? '--no-allow-unauthenticated'
      : '--allow-unauthenticated'));
  }
  assert.deepEqual(GCLOUD_GEN2_TARGETS.expireAdminPaymentLinksGen2.secrets, [
    'STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4',
    'PAYMENT_LINK_HMAC_SECRET=PAYMENT_LINK_HMAC_SECRET:1'
  ]);
  assert.deepEqual(GCLOUD_GEN2_TARGETS.commerceOutboxDispatcherGen2.secrets, [
    'GMAIL_EMAIL=GMAIL_EMAIL:2', 'GMAIL_PASSWORD=GMAIL_PASSWORD:6',
    'RESEND_API_KEY=RESEND_API_KEY:1'
  ]);
});

test('G9 scheduler fence bounds a concurrent double invocation and uses a fencing token', async () => {
  const { createSchedulerFence } = require(path.join(
    ROOT,
    'functions/src/commerce/domain/schedulerFence.js'
  ));
  const db = createFakeDb();
  let now = 1000;
  let release;
  let started;
  const startedPromise = new Promise((resolve) => { started = resolve; });
  const releasePromise = new Promise((resolve) => { release = resolve; });
  const fence = createSchedulerFence({
    db,
    nowMillis: () => now,
    token: () => 'lease-token-g9'
  });
  const first = fence.run({ schedulerName: 'expireAdminPaymentLinks' }, async () => {
    started();
    await releasePromise;
    return { processed: 0 };
  });
  await startedPromise;
  const second = await fence.run(
    { schedulerName: 'expireAdminPaymentLinks' },
    async () => assert.fail('la seconde invocation ne doit pas entrer dans le handler')
  );
  assert.deepEqual(second, { skipped: true, reason: 'leased', fence: 1 });
  now = 1200;
  release();
  const firstResult = await first;
  assert.equal(firstResult.skipped, false);
  assert.equal(firstResult.fence, 1);
  const state = [...db.documents.values()][0];
  assert.equal(state.active, false);
  assert.equal(state.lastOutcome, 'completed');
  assert.equal(state.leaseToken, 'lease-token-g9');
});

test('G9 wrappers keep App Check and client registry cuts over only the 20 callables', () => {
  const wrapper = read('functions/src/commerce/gen2G9.js');
  const registry = read('src/kit/config/functionTargets.js');
  assert.match(wrapper, /legacyFunction\.run\(data, request\)/);
  assert.match(wrapper, /enforceAppCheck:\s*true/);
  assert.match(wrapper, /createSchedulerFence/);
  for (const name of LOGICAL) {
    if (SCHEDULERS.has(name)) {
      assert.doesNotMatch(registry, new RegExp(`${name}: '${name}Gen2'`));
    } else {
      assert.match(registry, new RegExp(`${name}: '${name}Gen2'`));
    }
  }
});
