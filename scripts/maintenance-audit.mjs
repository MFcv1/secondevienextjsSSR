import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const functionsDir = path.join(rootDir, 'functions');
const outputPath = path.join(rootDir, '.maintenance', 'audit.json');
const vulnerabilityLevels = ['info', 'low', 'moderate', 'high', 'critical', 'total'];

async function readJson(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function declaredVersion(packageJson, name) {
  return packageJson?.dependencies?.[name] || packageJson?.devDependencies?.[name] || null;
}

function pnpmImporterVersions(lockText) {
  const versions = new Map();
  const lines = String(lockText || '').split(/\r?\n/);
  let inRootImporter = false;
  let currentPackage = null;
  for (const line of lines) {
    if (line === '  .:') {
      inRootImporter = true;
      continue;
    }
    if (inRootImporter && line === 'packages:') break;
    if (!inRootImporter) continue;
    const packageMatch = line.match(/^ {6}(.+):$/);
    if (packageMatch) {
      currentPackage = packageMatch[1].replace(/^['"]|['"]$/g, '');
      continue;
    }
    const versionMatch = currentPackage ? line.match(/^ {8}version:\s+([^\s(]+)/) : null;
    if (versionMatch) versions.set(currentPackage, versionMatch[1].replace(/^['"]|['"]$/g, ''));
  }
  return versions;
}

function npmLockVersion(lockJson, name) {
  return lockJson?.packages?.[`node_modules/${name}`]?.version || null;
}

function normalizeVia(via) {
  if (!Array.isArray(via)) return [];
  return via.map((entry) => {
    if (typeof entry === 'string') return entry;
    return [entry.name, entry.title].filter(Boolean).join(': ');
  }).filter(Boolean);
}

function parseJsonOutput(stdout, stderr) {
  const text = String(stdout || stderr || '').trim();
  if (!text) return { payload: null, parseError: 'empty audit output' };
  try {
    return { payload: JSON.parse(text), parseError: null };
  } catch (error) {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return { payload: JSON.parse(text.slice(firstBrace, lastBrace + 1)), parseError: null };
      } catch {
        // Report the original parse error below.
      }
    }
    return { payload: null, parseError: error.message };
  }
}

function runCommand(label, command, args, cwd, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: options.shell === true,
  });
  const parsed = parseJsonOutput(result.stdout, result.stderr);
  const hasAuditShape = Boolean(
    parsed.payload?.metadata?.vulnerabilities
    && (parsed.payload?.vulnerabilities || parsed.payload?.advisories)
  );
  return {
    label,
    command: options.displayCommand || [command, ...args].join(' '),
    exitCode: Number.isInteger(result.status) ? result.status : null,
    completed: hasAuditShape,
    payload: parsed.payload,
    parseError: hasAuditShape ? null : (result.error?.message || parsed.parseError || 'invalid audit payload'),
  };
}

function runRootAudit() {
  const pnpmCli = process.env.npm_execpath;
  if (pnpmCli && /pnpm/i.test(pnpmCli)) {
    return runCommand('application', process.execPath, [pnpmCli, 'audit', '--prod', '--json'], rootDir, {
      displayCommand: 'pnpm audit --prod --json',
    });
  }
  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  return runCommand('application', pnpmCommand, ['audit', '--prod', '--json'], rootDir, {
    displayCommand: 'pnpm audit --prod --json',
    shell: process.platform === 'win32',
  });
}

function runFunctionsAudit() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return runCommand('functions', npmCommand, ['audit', '--omit=dev', '--json'], functionsDir, {
    displayCommand: 'npm audit --omit=dev --json (functions/)',
    shell: process.platform === 'win32',
  });
}

function summarizeAudit(results) {
  const counts = Object.fromEntries(vulnerabilityLevels.map((level) => [level, 0]));
  const vulnerabilities = [];
  for (const result of results) {
    const resultCounts = result.payload?.metadata?.vulnerabilities || {};
    vulnerabilityLevels.filter((level) => level !== 'total').forEach((level) => {
      counts[level] += Number(resultCounts[level] || 0);
    });
    Object.entries(result.payload?.vulnerabilities || {}).forEach(([name, item]) => {
      vulnerabilities.push({
        source: result.label,
        name,
        severity: item.severity || 'unknown',
        range: item.range || null,
        fixAvailable: item.fixAvailable || false,
        via: normalizeVia(item.via).slice(0, 4),
        effects: Array.isArray(item.effects) ? item.effects : [],
      });
    });
    Object.values(result.payload?.advisories || {}).forEach((item) => {
      vulnerabilities.push({
        source: result.label,
        name: item.module_name || `advisory-${item.id}`,
        severity: item.severity || 'unknown',
        range: item.vulnerable_versions || null,
        fixAvailable: item.patched_versions || false,
        via: [item.title, item.github_advisory_id].filter(Boolean),
        effects: [],
      });
    });
  }
  counts.total = counts.info + counts.low + counts.moderate + counts.high + counts.critical;
  const order = { critical: 5, high: 4, moderate: 3, low: 2, info: 1, unknown: 0 };
  vulnerabilities.sort((left, right) => (order[right.severity] || 0) - (order[left.severity] || 0));
  return {
    commands: results.map(({ label, command, exitCode, completed, parseError }) => ({
      label, command, exitCode, completed, parseError,
    })),
    completed: results.every((result) => result.completed),
    counts,
    total: counts.total,
    vulnerabilities: vulnerabilities.slice(0, 20),
  };
}

async function main() {
  const [rootPackage, rootLockText, functionsPackage, functionsLock] = await Promise.all([
    readJson(path.join(rootDir, 'package.json')),
    readFile(path.join(rootDir, 'pnpm-lock.yaml'), 'utf8'),
    readJson(path.join(functionsDir, 'package.json')),
    readJson(path.join(functionsDir, 'package-lock.json')),
  ]);
  const rootVersions = pnpmImporterVersions(rootLockText);
  const audit = summarizeAudit([runRootAudit(), runFunctionsAudit()]);
  const status = !audit.completed
    ? 'audit_failed'
    : (audit.total > 0 ? 'vulnerability_detected' : 'OK');
  const version = (packageJson, installed, name) => ({
    declared: declaredVersion(packageJson, name),
    installed: installed(name),
  });
  const report = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    status,
    statusLabel: status === 'OK'
      ? 'OK'
      : (status === 'audit_failed' ? 'audit incomplet' : 'vulnerabilite detectee'),
    versions: {
      next: version(rootPackage, (name) => rootVersions.get(name) || null, 'next'),
      react: version(rootPackage, (name) => rootVersions.get(name) || null, 'react'),
      reactDom: version(rootPackage, (name) => rootVersions.get(name) || null, 'react-dom'),
      firebaseClient: version(rootPackage, (name) => rootVersions.get(name) || null, 'firebase'),
      firebaseAdminRoot: version(rootPackage, (name) => rootVersions.get(name) || null, 'firebase-admin'),
      firebaseAdminFunctions: version(functionsPackage, (name) => npmLockVersion(functionsLock, name), 'firebase-admin'),
      firebaseFunctions: version(functionsPackage, (name) => npmLockVersion(functionsLock, name), 'firebase-functions'),
    },
    audit,
    procedure: {
      docPath: '_DOCS/operations/EXPLOITATION.md',
      updateCommand: 'pnpm update next react react-dom firebase firebase-admin',
      auditCommand: 'pnpm maintenance:audit',
      rollbackRule: 'revenir au dernier commit/deploiement App Hosting stable puis redeployer la sandbox',
      securityRule: 'patcher Next rapidement en cas d advisory securite',
    },
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Private maintenance audit written to ${path.relative(rootDir, outputPath)}`);
  if (audit.total > 0) console.log(`Vulnerabilities: ${audit.total}`);
  if (!audit.completed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
