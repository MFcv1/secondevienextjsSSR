'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const runnerPath = path.join(__dirname, 'runner', 'cli.cjs');
const manifestPath = path.join(__dirname, 'fixtures', 'sentinel-manifest.json');

function runSentinel(scenario, manifest = manifestPath) {
  return spawnSync(process.execPath, [
    runnerPath,
    '--manifest', manifest,
    '--suite', 'sentinel',
    '--scenario', scenario,
  ], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    timeout: 4000,
  });
}

test('runner accepts a complete passing scenario and emits machine counts', () => {
  const result = runSentinel('passing');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"expected":1/);
  assert.match(result.stdout, /"executed":1/);
  assert.match(result.stdout, /"assertions":1/);
});

for (const scenario of ['false-assertion', 'rejected-promise', 'timeout', 'incomplete']) {
  test(`runner observes ${scenario} with a non-zero exit`, () => {
    const result = runSentinel(scenario);
    assert.notEqual(result.status, 0, `sentinel ${scenario} unexpectedly passed\n${result.stdout}`);
  });
}

for (const scenario of ['skipped', 'todo', 'cancelled', 'open-handle']) {
  test(`runner refuses forbidden status ${scenario}`, () => {
    const result = runSentinel(scenario);
    assert.notEqual(result.status, 0, `forbidden sentinel ${scenario} unexpectedly passed\n${result.stdout}`);
  });
}

test('runner refuses an unknown scenario', () => {
  const result = runSentinel('unknown-scenario');
  assert.notEqual(result.status, 0);
});

test('runner refuses a suite containing zero tests', () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'commerce-zero-tests-'));
  const temporaryManifest = path.join(temporaryDirectory, 'manifest.json');
  fs.writeFileSync(temporaryManifest, JSON.stringify({
    schemaVersion: 1,
    runnerVersion: 'zero-tests',
    suites: {
      sentinel: {
        module: manifestPath.replace('sentinel-manifest.json', 'sentinel-scenarios.cjs'),
        timeoutMs: 100,
        scenarios: [],
      },
    },
  }));
  const result = spawnSync(process.execPath, [
    runnerPath,
    '--manifest', temporaryManifest,
    '--suite', 'sentinel',
  ], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
});

test('runner refuses a manifest that omits an executable scenario', () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'commerce-manifest-mismatch-'));
  const temporaryManifest = path.join(temporaryDirectory, 'manifest.json');
  fs.writeFileSync(temporaryManifest, JSON.stringify({
    schemaVersion: 1,
    runnerVersion: 'manifest-mismatch',
    suites: {
      sentinel: {
        module: manifestPath.replace('sentinel-manifest.json', 'sentinel-scenarios.cjs'),
        timeoutMs: 100,
        scenarios: ['passing'],
      },
    },
  }));
  const result = runSentinel('passing', temporaryManifest);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Manifest mismatch/);
});

test('the commerce ESLint configuration rejects a faulty external fixture', () => {
  const temporaryDirectory = path.join(repositoryRoot, 'test-results', 'commerce', 'eslint-sentinel');
  fs.mkdirSync(temporaryDirectory, { recursive: true });
  const faultyFixture = path.join(temporaryDirectory, 'faulty-commerce-fixture.cjs');
  fs.writeFileSync(faultyFixture, 'commerceLintSentinelUndeclared = 1;\n');
  const eslintPackage = require.resolve('eslint/package.json');
  const eslintBin = path.join(path.dirname(eslintPackage), 'bin', 'eslint.js');
  const result = spawnSync(process.execPath, [
    eslintBin,
    '--no-ignore',
    '--config', path.join(repositoryRoot, 'eslint.config.mjs'),
    faultyFixture,
  ], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.notEqual(result.status, 0, 'faulty ESLint sentinel unexpectedly passed');
  assert.match(`${result.stdout}\n${result.stderr}`, /no-undef/);
});
