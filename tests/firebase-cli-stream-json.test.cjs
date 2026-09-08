'use strict';

require('./commerce/helpers/no-network.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createRequire } = require('node:module');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { Readable } = require('node:stream');
const vm = require('node:vm');
const cliRequire = createRequire(require.resolve('firebase-tools/package.json'));
const importer = cliRequire('./lib/accountImporter');
const authImport = cliRequire('./lib/commands/auth-import').command;
const DatabaseImporter = cliRequire('./lib/database/import').default;

function authFixture(t, contents) {
  const directory = mkdtempSync(join(tmpdir(), 'sv-cli-auth-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, 'users.json');
  writeFileSync(file, contents);
  return file;
}

test('Firebase Auth import preserves users and 1000-user batches with stream-json 3', async (t) => {
  const users = Array.from({ length: 1001 }, (_, i) => ({ localId: `fixture-${i}`, email: `fixture-${i}@example.invalid` }));
  let received;
  t.mock.method(importer, 'serialImportUsers', async (project, options, batches) => {
    received = { project, batches };
  });
  await authImport.actionFn(authFixture(t, JSON.stringify({ users })), { project: 'demo-cli-compatibility' });
  assert.equal(received.project, 'demo-cli-compatibility');
  assert.deepEqual(received.batches.map(batch => batch.length), [1000, 1]);
  assert.deepEqual(received.batches.flat(), users);
});

test('Firebase Auth import rejects excessive nesting before sending users', async (t) => {
  const send = t.mock.method(importer, 'serialImportUsers', async () => assert.fail('Unexpected import'));
  const nested = '{"ignored":' + '['.repeat(1100) + '0' + ']'.repeat(1100) + ',"users":[]}';
  await assert.rejects(authImport.actionFn(authFixture(t, nested), { project: 'demo-cli-compatibility' }), /maxDepth/);
  assert.equal(send.mock.callCount(), 0);
});

test('Firebase Database import preserves filtered paths and values without network', async () => {
  const input = { keep: { first: { price: 450 }, second: { enabled: true } }, exclude: { price: 99 } };
  const instance = new DatabaseImporter(new URL('https://example.invalid/destination'), Readable.from([JSON.stringify(input)]), '/keep', 1024, 1);
  const writes = [];
  instance.doWriteBatch = async batch => { writes.push(batch); return { status: 200 }; };
  await instance.readAndWriteChunks();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].pathname, '/destination/keep');
  assert.deepEqual(writes[0].json, input.keep);
});

test('Firebase Database import rejects excessive nesting without writing', async () => {
  const nested = '{"item":' + '['.repeat(1100) + '0' + ']'.repeat(1100) + '}';
  const instance = new DatabaseImporter(new URL('https://example.invalid/destination'), Readable.from([nested]), '', 1024, 1);
  instance.doWriteBatch = async () => assert.fail('Unexpected database write');
  await assert.rejects(instance.readAndWriteChunks(), /maxDepth/);
});

test('Firebase Next dependency pipeline preserves the nested production dependency set', async () => {
  // Execute the installed CLI pipeline itself, with npm stdout supplied locally.
  const source = readFileSync(cliRequire.resolve('./lib/frameworks/next/index'), 'utf8');
  const block = source.slice(source.indexOf('const productionDeps ='));
  const expression = block.match(/const pipeline = ([\s\S]*?\n\s*\]\));/);
  assert.ok(expression, 'Installed Firebase dependency pipeline must be inspected when upstream changes');
  const bindings = {
    npmLs: { stdout: Readable.from([JSON.stringify({ dependencies: { alpha: { version: '1', dependencies: { beta: { version: '2' } } }, gamma: { version: '3' } } })]) },
    stream_chain_1: cliRequire('stream-chain'),
    stream_json_1: cliRequire('stream-json'),
    Pick_1: cliRequire('stream-json/filters/pick.js'),
    StreamObject_1: cliRequire('stream-json/streamers/stream-object.js'),
    utils_2: cliRequire('./lib/frameworks/next/utils'),
  };
  const pipeline = vm.runInThisContext(`(function (${Object.keys(bindings).join(',')}) { return ${expression[1]}; })`)(...Object.values(bindings));
  const names = [];
  for await (const name of pipeline) names.push(name);
  assert.deepEqual(names.sort(), ['alpha', 'beta', 'gamma']);
});

test('Firebase deployment commands and framework adapter load on Node 22', () => {
  for (const entry of ['./lib/commands/deploy', './lib/commands/apphosting-backends-get', './lib/frameworks/next/index']) {
    assert.doesNotThrow(() => cliRequire(entry));
  }
});
