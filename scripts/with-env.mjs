import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);

const [, , envFileArg, command, ...args] = process.argv;

if (!envFileArg || !command) {
  console.error('Usage: node scripts/with-env.mjs <env-file> <command> [...args]');
  process.exit(1);
}

const envPath = resolve(process.cwd(), envFileArg);

const parseEnv = (content) => {
  const parsed = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
};

const loaded = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
const env = { ...process.env, ...loaded };

for (const [key, value] of Object.entries(loaded)) {
  if (key.startsWith('VITE_')) {
    env[`NEXT_PUBLIC_${key.slice('VITE_'.length)}`] = value;
  }
}

env.NEXT_TELEMETRY_DISABLED = env.NEXT_TELEMETRY_DISABLED || '1';

const isNextCommand = command === 'next';
const commandPath = isNextCommand ? process.execPath : command;
const commandArgs = isNextCommand ? [require.resolve('next/dist/bin/next'), ...args] : args;

const child = spawn(commandPath, commandArgs, {
  stdio: 'inherit',
  shell: false,
  env
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
