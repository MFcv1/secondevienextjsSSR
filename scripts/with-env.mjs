import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { networkInterfaces } from 'node:os';
import { basename, resolve } from 'node:path';
import { ensureDeploymentId } from './deployment-id.mjs';

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
const selectedEnvFile = basename(envPath);
const siblingEnvFile = selectedEnvFile === '.env.sandbox'
  ? '.env.production'
  : selectedEnvFile === '.env.production'
    ? '.env.sandbox'
    : null;
const siblingEnvPath = siblingEnvFile ? resolve(process.cwd(), siblingEnvFile) : null;
const sibling = siblingEnvPath && existsSync(siblingEnvPath)
  ? parseEnv(readFileSync(siblingEnvPath, 'utf8'))
  : {};

const PUBLIC_ENV_BRIDGE_DENYLIST = new Set([
  'VITE_SUPER_ADMIN_EMAIL',
]);

const FORBIDDEN_PUBLIC_OWNER_KEYS = [
  'VITE_SUPER_ADMIN_EMAIL',
  'NEXT_PUBLIC_SUPER_ADMIN_EMAIL',
];
const PRESERVED_PARENT_KEYS = new Set(['GOOGLE_APPLICATION_CREDENTIALS']);

for (const [key, value] of Object.entries(loaded)) {
  if (key.startsWith('VITE_') && !PUBLIC_ENV_BRIDGE_DENYLIST.has(key)) {
    env[`NEXT_PUBLIC_${key.slice('VITE_'.length)}`] = value;
  }
}

const hasSelectedEquivalent = (key) => (
  key in loaded ||
  (key.startsWith('NEXT_PUBLIC_') && `VITE_${key.slice('NEXT_PUBLIC_'.length)}` in loaded) ||
  (key.startsWith('VITE_') && `NEXT_PUBLIC_${key.slice('VITE_'.length)}` in loaded)
);

for (const key of Object.keys(sibling)) {
  if (PRESERVED_PARENT_KEYS.has(key) && process.env[key]) continue;
  if (!hasSelectedEquivalent(key)) {
    env[key] = '';
  }
  if (key.startsWith('VITE_')) {
    const nextKey = `NEXT_PUBLIC_${key.slice('VITE_'.length)}`;
    if (!hasSelectedEquivalent(key)) {
      env[nextKey] = '';
    }
  }
}

for (const key of FORBIDDEN_PUBLIC_OWNER_KEYS) {
  env[key] = '';
}

env.NEXT_TELEMETRY_DISABLED = env.NEXT_TELEMETRY_DISABLED || '1';

const isNextCommand = command === 'next';
const isNextBuild = isNextCommand && args[0] === 'build';

if (isNextBuild) {
  const { deploymentId, generated } = ensureDeploymentId(env);
  console.log(
    `[build] NEXT_DEPLOYMENT_ID ${generated ? 'genere' : 'fourni'}: ${deploymentId}`,
  );
}

const readOption = (sourceArgs, optionNames, fallback) => {
  const optionIndex = sourceArgs.findIndex((arg) => optionNames.includes(arg));
  return optionIndex >= 0 && sourceArgs[optionIndex + 1] ? sourceArgs[optionIndex + 1] : fallback;
};

const isPrivateIpv4 = (address) => (
  /^10\./.test(address)
  || /^192\.168\./.test(address)
  || /^172\.(1[6-9]|2\d|3[01])\./.test(address)
);

const getPreferredLanAddress = () => {
  const virtualInterfacePattern = /docker|vethernet|virtual|vmware|wsl|tailscale|loopback/i;
  const candidates = Object.entries(networkInterfaces())
    .flatMap(([interfaceName, addresses]) => (addresses || []).map((address) => ({
      ...address,
      interfaceName,
    })))
    .filter((address) => (
      !address.internal
      && (address.family === 'IPv4' || address.family === 4)
      && !address.address.startsWith('169.254.')
    ))
    .sort((left, right) => {
      const score = (candidate) => (
        (/wi-?fi|wireless|wlan/i.test(candidate.interfaceName) ? 100 : 0)
        + (isPrivateIpv4(candidate.address) ? 50 : 0)
        - (virtualInterfacePattern.test(candidate.interfaceName) ? 200 : 0)
      );
      return score(right) - score(left);
    });

  return candidates[0]?.address || null;
};

const isNetworkDevServer = isNextCommand
  && args[0] === 'dev'
  && ['0.0.0.0', '::'].includes(readOption(args, ['-H', '--hostname'], ''));

const canListenOnPort = (port, host) => new Promise((resolvePort, rejectPort) => {
  const server = createServer();
  server.unref();
  server.once('error', (error) => {
    if (error?.code === 'EADDRINUSE' || error?.code === 'EACCES') {
      resolvePort(false);
      return;
    }
    rejectPort(error);
  });
  server.listen({ port, host, exclusive: true }, () => {
    server.close(() => resolvePort(true));
  });
});

const findAvailablePort = async ({
  host,
  startPort = 3000,
  attempts = 100,
}) => {
  for (let offset = 0; offset < attempts; offset += 1) {
    const candidate = startPort + offset;
    if (await canListenOnPort(candidate, host)) return candidate;
  }
  throw new Error(`Aucun port libre trouve entre ${startPort} et ${startPort + attempts - 1}.`);
};

const resolvedArgs = [...args];
const requestedPort = readOption(resolvedArgs, ['-p', '--port'], '3000');

if (isNetworkDevServer && requestedPort === 'auto') {
  const hostname = readOption(resolvedArgs, ['-H', '--hostname'], '0.0.0.0');
  const portOptionIndex = resolvedArgs.findIndex((arg) => ['-p', '--port'].includes(arg));
  const availablePort = await findAvailablePort({
    host: hostname === '::' ? '::' : '0.0.0.0',
  });
  resolvedArgs[portOptionIndex + 1] = String(availablePort);
}

const commandPath = isNextCommand ? process.execPath : command;
const commandArgs = isNextCommand
  ? [require.resolve('next/dist/bin/next'), ...resolvedArgs]
  : resolvedArgs;

if (isNetworkDevServer) {
  const lanAddress = getPreferredLanAddress();
  const port = readOption(resolvedArgs, ['-p', '--port'], '3000');
  const desktopUrl = `http://localhost:${port}`;
  console.log('\n  Liens du serveur local (Ctrl + clic pour ouvrir)');
  console.log(`  Bureau                 : ${desktopUrl}`);
  if (lanAddress) {
    console.log(`  Telephone (meme Wi-Fi) : http://${lanAddress}:${port}\n`);
  } else {
    console.log('  Telephone               : IPv4 locale non detectee. Verifie avec ipconfig.\n');
  }
}

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
