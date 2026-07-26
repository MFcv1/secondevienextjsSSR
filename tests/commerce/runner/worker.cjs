'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { createEffectLedger } = require('./effect-ledger.cjs');
const { installNetworkGuard } = require('./network-guard.cjs');

const RESULT_PREFIX = 'COMMERCE_SCENARIO_RESULT=';

class ScenarioStatusError extends Error {
  constructor(status, message) {
    super(message || status);
    this.name = 'ScenarioStatusError';
    this.status = status;
  }
}

function parseArguments(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Invalid worker argument near ${key || '<end>'}`);
    }
    parsed[key.slice(2)] = value;
  }
  return parsed;
}

function createContext() {
  let assertions = 0;
  const count = (operation) => (...args) => {
    assertions += 1;
    return operation(...args);
  };

  return {
    equal: count(assert.equal),
    deepEqual: count(assert.deepEqual),
    ok: count(assert.ok),
    match: count(assert.match),
    rejects: count(assert.rejects),
    assertions: () => assertions,
    effects: createEffectLedger(),
    skip: (reason) => { throw new ScenarioStatusError('skipped', reason); },
    todo: (reason) => { throw new ScenarioStatusError('todo', reason); },
    cancel: (reason) => { throw new ScenarioStatusError('cancelled', reason); },
    incomplete: (reason) => { throw new ScenarioStatusError('incomplete', reason); },
  };
}

async function run() {
  const args = parseArguments(process.argv.slice(2));
  const modulePath = path.resolve(args.module);
  const scenarioId = args.scenario;
  const timeoutMs = Number(args.timeout);
  if (!scenarioId || !Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('Worker requires a scenario and a positive timeout');
  }

  installNetworkGuard({ allowLocalEmulator: process.env.COMMERCE_ALLOW_LOCAL_EMULATOR === '1' });

  const suite = require(modulePath);
  const scenario = suite.scenarios?.[scenarioId];
  if (typeof scenario !== 'function') {
    throw new Error(`Unknown scenario ${scenarioId} in ${modulePath}`);
  }

  const context = createContext();
  let timeout;
  let status = 'passed';
  let error = null;

  try {
    await Promise.race([
      Promise.resolve().then(() => scenario(context)),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new ScenarioStatusError('timeout', `${scenarioId} exceeded ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } catch (caught) {
    status = caught instanceof ScenarioStatusError ? caught.status : 'failed';
    error = caught instanceof Error ? caught.message : String(caught);
  } finally {
    clearTimeout(timeout);
  }

  const result = {
    id: scenarioId,
    status,
    assertions: context.assertions(),
    effects: context.effects.snapshot(),
    error,
  };
  process.stdout.write(`${RESULT_PREFIX}${JSON.stringify(result)}\n`);
  if (status !== 'passed') process.exitCode = 1;
}

let asynchronousFailure = null;
process.on('unhandledRejection', (reason) => {
  asynchronousFailure = reason instanceof Error ? reason : new Error(String(reason));
  process.stderr.write(`Unhandled rejection: ${asynchronousFailure.message}\n`);
  process.exitCode = 1;
});
process.on('uncaughtException', (error) => {
  asynchronousFailure = error;
  process.stderr.write(`Uncaught exception: ${error.message}\n`);
  process.exitCode = 1;
});

run().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
}).finally(() => {
  if (asynchronousFailure) process.exitCode = 1;
});
