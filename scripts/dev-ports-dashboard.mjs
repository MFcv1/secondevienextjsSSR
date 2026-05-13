#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(__filename), '..');
const DEFAULT_PORTS = [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180, 4173];
const AUTO_NETWORK_PORTS = [5174, 5173, 5175, 5176, 5177, 5178, 5179, 5180];

const ok = (message) => console.log(chalk.green(`  OK  ${message}`));
const warn = (message) => console.log(chalk.yellow(`  !!  ${message}`));
const info = (message) => console.log(chalk.gray(`  ${message}`));

function title() {
  console.clear();
  console.log('');
  console.log(chalk.bold('  DEV PORT DASHBOARD'));
  console.log(chalk.gray(`  ${ROOT_DIR}`));
  console.log('');
}

function runPowerShell(script) {
  return execFileSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { encoding: 'utf8', windowsHide: true },
  ).trim();
}

function parseJsonList(output) {
  if (!output) return [];
  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function shortProject(commandLine = '') {
  const normalizedRoot = ROOT_DIR.toLowerCase();
  const lower = commandLine.toLowerCase();

  if (lower.includes(normalizedRoot)) return 'Seconde Vie';

  const match = commandLine.match(/([A-Z]:\\.*?)(?:\\node_modules\\|\\\.bin\\)/i);
  if (match?.[1]) return path.basename(match[1]);

  if (lower.includes('vite')) return 'Vite';
  return 'Inconnu';
}

function shortCommand(commandLine = '') {
  if (!commandLine) return '';
  return commandLine
    .replaceAll(ROOT_DIR, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

function getListeningPorts(ports = DEFAULT_PORTS) {
  const portsLiteral = ports.join(',');
  const script = `
    $ports = @(${portsLiteral})
    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $ports -contains $_.LocalPort }

    $items = foreach ($connection in $connections) {
      $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction SilentlyContinue
      [pscustomobject]@{
        Port = $connection.LocalPort
        Address = $connection.LocalAddress
        Pid = $connection.OwningProcess
        Name = $process.Name
        CommandLine = $process.CommandLine
      }
    }

    $items | Sort-Object Port, Pid | ConvertTo-Json -Depth 4
  `;

  try {
    return parseJsonList(runPowerShell(script)).map((item) => ({
      ...item,
      Project: shortProject(item.CommandLine),
      ShortCommand: shortCommand(item.CommandLine),
    }));
  } catch (error) {
    warn(`Impossible de lire les ports : ${error.message}`);
    return [];
  }
}

function printPortTable(items) {
  if (!items.length) {
    ok('Aucun serveur detecte sur les ports Vite surveilles.');
    return;
  }

  console.log(chalk.bold('  Ports utilises'));
  console.log('');

  for (const item of items) {
    const projectColor = item.Project === 'Seconde Vie' ? chalk.cyan : chalk.yellow;
    console.log(
      `  ${chalk.bold(String(item.Port).padEnd(5))} ` +
      `${chalk.gray(String(item.Pid).padEnd(7))} ` +
      `${projectColor(item.Project.padEnd(16))} ` +
      `${chalk.gray(item.Name ?? 'process')}`,
    );
    if (item.ShortCommand) {
      console.log(chalk.gray(`        ${item.ShortCommand.slice(0, 150)}`));
    }
  }
}

async function pause() {
  await inquirer.prompt([{
    type: 'input',
    name: '_',
    message: chalk.gray('Appuie sur Entree pour revenir au menu...'),
  }]);
}

function uniquePids(items) {
  return [...new Set(items.map((item) => Number(item.Pid)).filter(Boolean))];
}

async function killProcesses(items, label) {
  const pids = uniquePids(items);
  if (!pids.length) {
    warn('Aucun processus a arreter.');
    return;
  }

  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Arreter ${label} ? PID: ${pids.join(', ')}`,
    default: false,
  }]);

  if (!confirm) {
    warn('Annule.');
    return;
  }

  try {
    runPowerShell(`Stop-Process -Id ${pids.join(',')} -Force -ErrorAction Stop`);
    ok(`${pids.length} processus arrete(s).`);
  } catch (error) {
    warn(`Arret incomplet : ${error.message}`);
  }
}

function forceKillProcesses(items, label) {
  const pids = uniquePids(items);
  if (!pids.length) return false;

  try {
    runPowerShell(`Stop-Process -Id ${pids.join(',')} -Force -ErrorAction Stop`);
    ok(`${label} libere. PID arrete(s) : ${pids.join(', ')}`);
    return true;
  } catch (error) {
    warn(`Impossible de liberer ${label} : ${error.message}`);
    return false;
  }
}

function findAvailablePort(ports = AUTO_NETWORK_PORTS) {
  for (const port of ports) {
    if (!getListeningPorts([port]).length) return port;
  }
  return null;
}

async function cleanPorts() {
  const items = getListeningPorts();
  printPortTable(items);
  console.log('');

  if (!items.length) return;

  const { scope } = await inquirer.prompt([{
    type: 'list',
    name: 'scope',
    message: 'Que veux-tu liberer ?',
    choices: [
      { name: 'Tous les ports Vite surveilles', value: 'all' },
      { name: 'Seulement les autres projets', value: 'foreign' },
      { name: 'Choisir un port precis', value: 'port' },
      { name: 'Annuler', value: 'cancel' },
    ],
  }]);

  if (scope === 'cancel') return;

  if (scope === 'all') {
    await killProcesses(items, 'tous les serveurs listes');
    return;
  }

  if (scope === 'foreign') {
    await killProcesses(items.filter((item) => item.Project !== 'Seconde Vie'), 'les autres projets');
    return;
  }

  const ports = [...new Set(items.map((item) => item.Port))];
  const { port } = await inquirer.prompt([{
    type: 'list',
    name: 'port',
    message: 'Quel port liberer ?',
    choices: ports.map((value) => ({ name: String(value), value })),
  }]);

  await killProcesses(items.filter((item) => item.Port === port), `le port ${port}`);
}

async function launchDev() {
  const { mode, host, port, cleanBefore } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Quel environnement lancer ?',
      choices: [
        { name: 'Sandbox local', value: 'sandbox' },
        { name: 'Production locale', value: 'production' },
      ],
    },
    {
      type: 'list',
      name: 'host',
      message: 'Quel host utiliser ?',
      choices: [
        { name: '127.0.0.1, le plus clair pour eviter localhost ambigu', value: '127.0.0.1' },
        { name: '0.0.0.0, accessible depuis le reseau local', value: '0.0.0.0' },
      ],
    },
    {
      type: 'input',
      name: 'port',
      message: 'Quel port ?',
      default: '5174',
      validate: (value) => Number.isInteger(Number(value)) && Number(value) > 0 ? true : 'Entre un port valide.',
    },
    {
      type: 'confirm',
      name: 'cleanBefore',
      message: 'Liberer ce port avant de lancer ?',
      default: true,
    },
  ]);

  const numericPort = Number(port);
  if (cleanBefore) {
    const items = getListeningPorts([numericPort]);
    if (items.length) {
      printPortTable(items);
      await killProcesses(items, `le port ${numericPort}`);
    }
  }

  launchVite({ mode, host, port: numericPort });
}

function launchVite({ mode, host, port, open = false }) {
  console.log('');
  console.log(chalk.bold(`  Lancement Seconde Vie sur http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/`));
  if (host === '0.0.0.0') {
    console.log(chalk.gray('  Vite affichera aussi les URLs Network disponibles.'));
  }
  console.log(chalk.gray('  Ferme ce serveur avec Ctrl+C dans ce terminal.'));
  console.log('');

  const args = ['vite', '--mode', mode, '--host', host, '--port', String(port), '--strictPort'];
  if (open) args.push('--open');

  const child = spawn(
    'npx',
    args,
    {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: true,
      env: process.env,
    },
  );

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

async function launchNetworkAuto() {
  const port = findAvailablePort();

  if (port) {
    ok(`Port libre trouve automatiquement : ${port}`);
    launchVite({ mode: 'sandbox', host: '0.0.0.0', port, open: true });
    return;
  }

  const fallbackPort = AUTO_NETWORK_PORTS[0];
  warn(`Aucun port libre entre ${AUTO_NETWORK_PORTS[0]} et ${AUTO_NETWORK_PORTS[AUTO_NETWORK_PORTS.length - 1]}.`);
  warn(`Je libere automatiquement le port ${fallbackPort} pour Seconde Vie.`);

  const items = getListeningPorts([fallbackPort]);
  printPortTable(items);
  console.log('');

  const freed = forceKillProcesses(items, `le port ${fallbackPort}`);
  if (!freed) {
    warn('Lancement annule : le port cible est toujours occupe.');
    await pause();
    return;
  }

  launchVite({ mode: 'sandbox', host: '0.0.0.0', port: fallbackPort, open: true });
}

async function showStatus() {
  const items = getListeningPorts();
  printPortTable(items);
  console.log('');
  info('Conseil : lance Seconde Vie avec un port fixe + --strictPort pour ne plus tomber sur un autre projet.');
}

async function main() {
  let running = true;

  while (running) {
    title();
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Que veux-tu faire ?',
      pageSize: 8,
      choices: [
        { name: 'Lancer Seconde Vie en reseau automatiquement', value: 'network-auto' },
        { name: 'Voir les ports utilises', value: 'status' },
        { name: 'Liberer des ports', value: 'clean' },
        { name: 'Lancer Seconde Vie sur un port choisi', value: 'launch' },
        { name: 'Quitter', value: 'quit' },
      ],
    }]);

    switch (action) {
      case 'network-auto':
        await launchNetworkAuto();
        running = false;
        break;
      case 'status':
        await showStatus();
        await pause();
        break;
      case 'clean':
        await cleanPorts();
        await pause();
        break;
      case 'launch':
        await launchDev();
        running = false;
        break;
      case 'quit':
        running = false;
        break;
    }
  }
}

main().catch((error) => {
  console.error(chalk.red(`\n  ERREUR : ${error.message}\n`));
  process.exit(1);
});
