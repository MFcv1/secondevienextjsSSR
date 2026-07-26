'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RESULT_PREFIX = 'COMMERCE_SCENARIO_RESULT=';
const FORBIDDEN_STATUSES = new Set(['skipped', 'todo', 'cancelled', 'incomplete', 'unknown', 'timeout']);

function parseArguments(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Invalid runner argument near ${key || '<end>'}`);
    }
    parsed[key.slice(2)] = value;
  }
  return parsed;
}

function readManifest(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.schemaVersion !== 1 || typeof manifest.runnerVersion !== 'string') {
    throw new Error('Commerce manifest schema or runner version is invalid');
  }
  if (!manifest.suites || typeof manifest.suites !== 'object') {
    throw new Error('Commerce manifest has no suites');
  }
  return manifest;
}

function gitSha(cwd) {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : 'unknown';
}

function validateSuite(manifestDirectory, suiteName, suiteDefinition) {
  if (!suiteDefinition || typeof suiteDefinition.module !== 'string') {
    throw new Error(`Manifest suite ${suiteName} has no module`);
  }
  if (!Array.isArray(suiteDefinition.scenarios) || suiteDefinition.scenarios.length === 0) {
    throw new Error(`Manifest suite ${suiteName} must contain at least one scenario`);
  }
  if (new Set(suiteDefinition.scenarios).size !== suiteDefinition.scenarios.length) {
    throw new Error(`Manifest suite ${suiteName} contains duplicate scenario IDs`);
  }
  const modulePath = path.resolve(manifestDirectory, suiteDefinition.module);
  const suite = require(modulePath);
  const actualIds = Object.keys(suite.scenarios || {}).sort();
  const expectedIds = [...suiteDefinition.scenarios].sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    throw new Error(`Manifest mismatch for ${suiteName}: expected=${JSON.stringify(expectedIds)} module=${JSON.stringify(actualIds)}`);
  }
  for (const scenarioId of actualIds) {
    if (typeof suite.scenarios[scenarioId] !== 'function') {
      throw new Error(`Scenario ${suiteName}/${scenarioId} is not executable`);
    }
  }
  const timeoutMs = Number(suiteDefinition.timeoutMs);
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`Manifest suite ${suiteName} has an invalid timeout`);
  }
  return { modulePath, timeoutMs };
}

function parseWorkerResult(stdout, suiteName, scenarioId) {
  const line = String(stdout || '').split(/\r?\n/).find((entry) => entry.startsWith(RESULT_PREFIX));
  if (!line) {
    return {
      id: scenarioId,
      suite: suiteName,
      status: 'incomplete',
      assertions: 0,
      effects: {},
      error: 'worker returned no machine result',
    };
  }
  return { suite: suiteName, ...JSON.parse(line.slice(RESULT_PREFIX.length)) };
}

function writeReport(report, manifestPath, selectedSuite) {
  const root = path.resolve(path.dirname(manifestPath), '..', '..');
  const reportDirectory = path.join(root, 'test-results', 'commerce');
  fs.mkdirSync(reportDirectory, { recursive: true });
  const suffix = selectedSuite || 'all';
  const reportPath = path.join(reportDirectory, `${suffix}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

function main() {
  const args = parseArguments(process.argv.slice(2));
  const cwd = process.cwd();
  const manifestPath = path.resolve(args.manifest || 'tests/commerce/manifest.json');
  const manifestDirectory = path.dirname(manifestPath);
  const manifest = readManifest(manifestPath);
  const suiteNames = args.suite ? [args.suite] : Object.keys(manifest.suites);
  if (suiteNames.length === 0) throw new Error('Commerce manifest resolved to zero suites');

  const results = [];
  let expected = 0;

  for (const suiteName of suiteNames) {
    const suiteDefinition = manifest.suites[suiteName];
    if (!suiteDefinition) throw new Error(`Unknown suite requested: ${suiteName}`);
    const validated = validateSuite(manifestDirectory, suiteName, suiteDefinition);
    const scenarioIds = args.scenario ? [args.scenario] : suiteDefinition.scenarios;
    for (const scenarioId of scenarioIds) {
      if (!suiteDefinition.scenarios.includes(scenarioId)) {
        throw new Error(`Unknown scenario requested: ${suiteName}/${scenarioId}`);
      }
      expected += 1;
      const worker = spawnSync(process.execPath, [
        path.join(__dirname, 'worker.cjs'),
        '--module', validated.modulePath,
        '--scenario', scenarioId,
        '--timeout', String(validated.timeoutMs),
      ], {
        cwd,
        encoding: 'utf8',
        env: {
          ...process.env,
          COMMERCE_TEST_NETWORK_DISABLED: '1',
        },
        timeout: validated.timeoutMs + 1200,
      });
      const result = parseWorkerResult(worker.stdout, suiteName, scenarioId);
      if (worker.error?.code === 'ETIMEDOUT') {
        result.status = result.status === 'passed' ? 'open_handle' : 'timeout';
        result.error = result.error || 'worker did not exit after scenario completion';
      } else if (worker.status !== 0 && result.status === 'passed') {
        result.status = 'failed';
        result.error = String(worker.stderr || '').trim() || `worker exited ${worker.status}`;
      }
      results.push(result);
      process.stdout.write(String(worker.stdout || '').replace(/^COMMERCE_SCENARIO_RESULT=.*(?:\r?\n|$)/m, ''));
      if (worker.stderr) process.stderr.write(worker.stderr);
    }
  }

  const executed = results.length;
  const assertions = results.reduce((sum, result) => sum + Number(result.assertions || 0), 0);
  const forbidden = results.filter((result) => FORBIDDEN_STATUSES.has(result.status) || result.status === 'open_handle');
  const failed = results.filter((result) => result.status !== 'passed');
  const report = {
    schemaVersion: 1,
    runnerVersion: manifest.runnerVersion,
    gitSha: gitSha(cwd),
    manifest: path.relative(cwd, manifestPath).replaceAll('\\', '/'),
    suites: suiteNames,
    expected,
    executed,
    assertions,
    statuses: Object.fromEntries([...new Set(results.map((result) => result.status))].map((status) => [
      status,
      results.filter((result) => result.status === status).length,
    ])),
    results,
  };
  const reportPath = writeReport(report, manifestPath, args.suite);
  process.stdout.write(`COMMERCE_RUNNER_REPORT ${JSON.stringify({
    runnerVersion: report.runnerVersion,
    gitSha: report.gitSha,
    suites: report.suites,
    expected,
    executed,
    assertions,
    statuses: report.statuses,
    reportPath: path.relative(cwd, reportPath).replaceAll('\\', '/'),
  })}\n`);

  if (expected <= 0 || executed !== expected || assertions <= 0 || forbidden.length > 0 || failed.length > 0) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`COMMERCE_RUNNER_FATAL ${error.stack || error.message}\n`);
  process.exitCode = 1;
}
