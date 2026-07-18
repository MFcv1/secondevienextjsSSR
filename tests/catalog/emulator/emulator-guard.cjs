const assert = require('node:assert/strict');

const PROJECT_ID = 'demo-secondevie-catalog';

function assertEmulatorEnvironment({ storage = true } = {}) {
  assert.equal(process.env.GCLOUD_PROJECT, PROJECT_ID);
  assert.match(process.env.GCLOUD_PROJECT, /^demo-/);
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'FIRESTORE_EMULATOR_HOST is required');
  if (storage) assert.ok(process.env.FIREBASE_STORAGE_EMULATOR_HOST, 'FIREBASE_STORAGE_EMULATOR_HOST is required');
}

module.exports = { PROJECT_ID, assertEmulatorEnvironment };
