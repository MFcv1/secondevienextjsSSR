#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import process from 'node:process';

const PROJECT_ID = 'secondevienextjsssr';
const DATABASE_ID = 'restore-drill-20260815-a';
const POLL_MS = 30_000;
const MAX_POLLS = 120;

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) throw new Error(`G1_RESTORE_WAIT_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function readOperation() {
  const output = execFileSync('gcloud', [
    'firestore', 'operations', 'list',
    `--database=${DATABASE_ID}`,
    `--project=${PROJECT_ID}`,
    '--format=json'
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const operations = JSON.parse(output || '[]');
  const operation = operations.find((entry) => entry.metadata?.database?.endsWith(`/databases/${DATABASE_ID}`));
  if (!operation) throw new Error('G1_RESTORE_OPERATION_MISSING');
  return operation;
}

function sleep(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.get('project') !== PROJECT_ID || args.get('database') !== DATABASE_ID) {
    throw new Error('G1_RESTORE_WAIT_TARGET_INVALID');
  }
  let previous = null;
  for (let poll = 1; poll <= MAX_POLLS; poll += 1) {
    const operation = readOperation();
    const state = operation.metadata?.operationState || 'UNKNOWN';
    const completed = Number(operation.metadata?.progressPercentage?.completedWork || 0);
    const estimated = Number(operation.metadata?.progressPercentage?.estimatedWork || 0);
    const progress = operation.response?.sourceInfo?.progress || null;
    const current = `${state}:${completed}:${estimated}:${progress}`;
    if (current !== previous) {
      process.stdout.write(`${JSON.stringify({ poll, state, completed, estimated, progress })}\n`);
      previous = current;
    }
    if (operation.error) throw new Error(`G1_RESTORE_OPERATION_ERROR:${operation.error.status || 'UNKNOWN'}`);
    if (state === 'SUCCESSFUL' && progress === 'COMPLETED') return;
    await sleep(POLL_MS);
  }
  throw new Error('G1_RESTORE_WAIT_TIMEOUT');
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ status: 'ERROR', code: String(error?.message || error) })}\n`);
  process.exitCode = 1;
}
