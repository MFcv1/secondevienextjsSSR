'use strict';

const { execFileSync } = require('node:child_process');
const dns = require('node:dns');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PROJECT = 'secondevienextjsssr';
const BACKEND = 'secondevie-next-sandbox';
const OPERATOR = 'matthis.fradin2@gmail.com';

dns.setDefaultResultOrder('ipv4first');

const fail = (code) => {
  throw new Error(`APPHOSTING_SANDBOX_${code}`);
};

const cliArgs = process.argv.slice(2);
const projectIndex = cliArgs.indexOf('--project');
const inlineProject = cliArgs.find((arg) => arg.startsWith('--project='))?.slice('--project='.length);
const project = inlineProject || (projectIndex >= 0 ? cliArgs[projectIndex + 1] : null);
if (project !== PROJECT) fail('PROJECT_MISMATCH');

const readCommand = cliArgs[0] === 'apphosting:backends:get'
  && cliArgs[1] === BACKEND;
const deployCommand = cliArgs[0] === 'deploy'
  && cliArgs.includes('--non-interactive')
  && cliArgs.some((arg, index) => (
    arg === `--only=apphosting:${BACKEND}`
    || (arg === '--only' && cliArgs[index + 1] === `apphosting:${BACKEND}`)
  ));
if (!readCommand && !deployCommand) fail('COMMAND_NOT_ALLOWLISTED');

const output = (args) => execFileSync('gcloud', args, {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
}).trim();

const operator = output(['config', 'get-value', 'account']);
if (operator !== OPERATOR) fail('OPERATOR_MISMATCH');

const token = output(['auth', 'print-access-token', `--account=${OPERATOR}`]);
if (token.length < 100 || /\s/.test(token)) fail('ACCESS_TOKEN_INVALID');

const apiv2Path = path.join(ROOT, 'node_modules/firebase-tools/lib/apiv2.js');
const firebaseBin = path.join(ROOT, 'node_modules/firebase-tools/lib/bin/firebase.js');
require(apiv2Path).setAccessToken(token);

// This non-secret sentinel makes requireAuth skip its unavailable OAuth refresh.
// API requests still use only the short-lived gcloud access token held in memory.
process.env.FIREBASE_TOKEN = 'gcloud-access-token-preloaded-in-memory';
process.argv = [process.execPath, firebaseBin, ...cliArgs];
require(firebaseBin);
