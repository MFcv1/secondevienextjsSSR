#!/usr/bin/env node

import process from 'node:process';

const command = String(process.argv[2] || 'unknown');
const forbidden = new Set(['e2e:hosted-stripe', 'e2e:refund-stripe']);

if (!forbidden.has(command)) {
  process.stderr.write(`QUARANTINED_E2E_COMMAND_UNKNOWN:${command}\n`);
  process.exit(2);
}

process.stderr.write(
  `DO_NOT_RUN:${command}:quarantined_by_functions_gen2_migration;use_commerce:e2e:gate7b_only_when_explicitly_authorized\n`
);
process.exit(1);
