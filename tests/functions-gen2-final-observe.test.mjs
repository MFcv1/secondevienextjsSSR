import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FINAL_OBSERVATION,
  buildCheckpoint,
  classifyLogMessage,
  summarizeFailureLogs,
  validateFinalFunction,
  validateInventory,
  validateSources,
  validateTraffic
} from '../scripts/functions-gen2-final-observe.mjs';

const gen2Rows = Array.from({ length: 134 }, (_, index) => ({
  name: `projects/p/locations/europe-west1/functions/gen2-${index}`,
  environment: 'GEN_2',
  state: 'ACTIVE',
  updateTime: '2026-08-22T00:00:00Z'
}));
gen2Rows[0] = {
  ...gen2Rows[0],
  name: `projects/p/locations/europe-west1/functions/${FINAL_OBSERVATION.functionName}`,
  updateTime: '2026-08-23T01:46:24.611705732Z'
};
const inventoryRows = [
  ...gen2Rows,
  ...['grantAdminOnAuth', 'onRegisteredUserCreated', 'onRegisteredUserDeleted'].map((name) => ({
    name: `projects/p/locations/europe-west1/functions/${name}`,
    status: 'ACTIVE',
    updateTime: '2026-08-22T00:00:00Z'
  }))
];
const functionRow = {
  state: 'ACTIVE',
  buildConfig: {
    runtime: 'nodejs22',
    serviceAccount: FINAL_OBSERVATION.config.buildServiceAccount
  },
  serviceConfig: {
    revision: FINAL_OBSERVATION.revision,
    serviceAccountEmail: FINAL_OBSERVATION.config.runtimeServiceAccount,
    availableMemory: '512Mi',
    availableCpu: '167m',
    timeoutSeconds: 60,
    maxInstanceCount: 2,
    maxInstanceRequestConcurrency: 1
  }
};
const service = {
  status: {
    latestCreatedRevisionName: FINAL_OBSERVATION.revision,
    latestReadyRevisionName: FINAL_OBSERVATION.revision,
    traffic: [{ revisionName: FINAL_OBSERVATION.revision, percent: 100 }]
  }
};
const sourceRows = FINAL_OBSERVATION.sources.map((source) => ({
  generation: source.generation,
  size: source.size,
  temporary_hold: true
}));

test('le collecteur F6 accepte uniquement la topologie finale exacte', () => {
  assert.equal(validateFinalFunction(functionRow).revision, FINAL_OBSERVATION.revision);
  assert.equal(validateInventory(inventoryRows).gen2Active, 134);
  assert.equal(validateTraffic(service).trafficPercent, 100);
  assert.equal(validateSources(sourceRows).every(({ temporaryHold }) => temporaryHold), true);
  assert.throws(() => validateFinalFunction({
    ...functionRow,
    serviceConfig: { ...functionRow.serviceConfig, maxInstanceCount: 3 }
  }), /Derive Function finale/);
  assert.throws(() => validateInventory(inventoryRows.map((row, index) => index === 1
    ? { ...row, updateTime: '2026-08-24T00:00:00Z' }
    : row)), /Derive inventaire final/);
});

test('le collecteur F6 classe les erreurs sans recopier leur contenu', () => {
  assert.equal(classifyLogMessage('The request was aborted because there was no available instance.'), 'NO_AVAILABLE_INSTANCE');
  assert.equal(classifyLogMessage('secret-looking arbitrary failure').startsWith('REDACTED_'), true);
  const summary = summarizeFailureLogs([
    {
      timestamp: '2026-08-23T02:00:00Z', severity: 'WARNING',
      resource: { labels: { service_name: 'svc', revision_name: 'rev' } },
      httpRequest: { status: 429 }, textPayload: 'no available instance'
    },
    {
      timestamp: '2026-08-23T02:01:00Z', severity: 'ERROR',
      resource: { labels: { service_name: 'svc', revision_name: 'rev' } },
      httpRequest: { status: 500 }, textPayload: 'secret-looking arbitrary failure'
    }
  ]);
  assert.equal(summary.request429, 1);
  assert.equal(summary.request5xx, 1);
  assert.equal(summary.errorSeverityEntries, 1);
  assert.equal(JSON.stringify(summary).includes('secret-looking'), false);
  const gen1Summary = summarizeFailureLogs([{
    timestamp: '2026-08-23T02:02:00Z', severity: 'ERROR',
    resource: { labels: { function_name: 'grantAdminOnAuth' } },
    textPayload: 'unknown auth trigger failure'
  }]);
  assert.equal(gen1Summary.groups[0].service, 'grantAdminOnAuth');
  assert.equal(gen1Summary.groups[0].messageClass.startsWith('REDACTED_'), true);
});

test('le checkpoint F6 ne ferme pas la fenetre avant 604800 secondes', () => {
  const before = buildCheckpoint({
    now: new Date('2026-08-30T12:24:18.325Z'), functionRow, inventoryRows, service, sourceRows, logRows: []
  });
  const after = buildCheckpoint({
    now: new Date('2026-08-30T12:24:20.325Z'), functionRow, inventoryRows, service, sourceRows, logRows: []
  });
  assert.equal(before.fullDurationReached, false);
  assert.equal(after.fullDurationReached, true);
  assert.equal(after.runtimeQuiet, true);
});
