import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const outputPath = path.join(rootDir, 'public', 'maintenance', 'audit.json');

async function readJson(filePath) {
  if (!existsSync(filePath)) return null;
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function declaredVersion(packageJson, name) {
  return packageJson?.dependencies?.[name] || packageJson?.devDependencies?.[name] || null;
}

function installedVersion(lockJson, name) {
  return lockJson?.packages?.[`node_modules/${name}`]?.version || null;
}

function normalizeVia(via) {
  if (!Array.isArray(via)) return [];
  return via.map((entry) => {
    if (typeof entry === 'string') return entry;
    return [entry.name, entry.title].filter(Boolean).join(': ');
  }).filter(Boolean);
}

function runAudit() {
  const npmCli = process.env.npm_execpath
    || path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  const result = spawnSync(process.execPath, [npmCli, 'audit', '--omit=dev', '--json'], {
    cwd: rootDir,
    encoding: 'utf8',
  });

  const payloadText = result.stdout || result.stderr || '{}';
  try {
    return {
      ok: result.status === 0,
      exitCode: result.status,
      payload: JSON.parse(payloadText),
    };
  } catch (error) {
    return {
      ok: false,
      exitCode: result.status,
      payload: null,
      parseError: error.message,
      raw: payloadText.slice(0, 2000),
    };
  }
}

function summarizeAudit(auditResult) {
  const vulnerabilities = auditResult.payload?.vulnerabilities || {};
  const counts = auditResult.payload?.metadata?.vulnerabilities || {};
  const total = Number(counts.total || 0);
  const top = Object.entries(vulnerabilities)
    .map(([name, item]) => ({
      name,
      severity: item.severity || 'unknown',
      range: item.range || null,
      fixAvailable: item.fixAvailable || false,
      via: normalizeVia(item.via).slice(0, 4),
      effects: Array.isArray(item.effects) ? item.effects : [],
    }))
    .sort((a, b) => {
      const order = { critical: 5, high: 4, moderate: 3, low: 2, info: 1, unknown: 0 };
      return (order[b.severity] || 0) - (order[a.severity] || 0);
    })
    .slice(0, 12);

  return {
    command: 'npm audit --omit=dev',
    exitCode: auditResult.exitCode,
    ok: auditResult.ok,
    counts,
    total,
    vulnerabilities: top,
    parseError: auditResult.parseError || null,
  };
}

async function main() {
  const [
    rootPackage,
    rootLock,
    functionsPackage,
    functionsLock,
    publicFunctionsPackage,
    publicFunctionsLock,
  ] = await Promise.all([
    readJson(path.join(rootDir, 'package.json')),
    readJson(path.join(rootDir, 'package-lock.json')),
    readJson(path.join(rootDir, 'functions', 'package.json')),
    readJson(path.join(rootDir, 'functions', 'package-lock.json')),
    readJson(path.join(rootDir, 'functions-public', 'package.json')),
    readJson(path.join(rootDir, 'functions-public', 'package-lock.json')),
  ]);

  const audit = summarizeAudit(runAudit());
  const status = audit.total > 0
    ? 'vulnerability_detected'
    : 'OK';

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status,
    statusLabel: status === 'OK' ? 'OK' : 'vulnerabilite detectee',
    versions: {
      next: {
        declared: declaredVersion(rootPackage, 'next'),
        installed: installedVersion(rootLock, 'next'),
      },
      react: {
        declared: declaredVersion(rootPackage, 'react'),
        installed: installedVersion(rootLock, 'react'),
      },
      reactDom: {
        declared: declaredVersion(rootPackage, 'react-dom'),
        installed: installedVersion(rootLock, 'react-dom'),
      },
      firebaseClient: {
        declared: declaredVersion(rootPackage, 'firebase'),
        installed: installedVersion(rootLock, 'firebase'),
      },
      firebaseAdminRoot: {
        declared: declaredVersion(rootPackage, 'firebase-admin'),
        installed: installedVersion(rootLock, 'firebase-admin'),
      },
      firebaseAdminFunctions: {
        declared: declaredVersion(functionsPackage, 'firebase-admin'),
        installed: installedVersion(functionsLock, 'firebase-admin'),
      },
      firebaseAdminPublicFunctions: {
        declared: declaredVersion(publicFunctionsPackage, 'firebase-admin'),
        installed: installedVersion(publicFunctionsLock, 'firebase-admin'),
      },
      firebaseFunctions: {
        declared: declaredVersion(functionsPackage, 'firebase-functions'),
        installed: installedVersion(functionsLock, 'firebase-functions'),
      },
      firebaseFunctionsPublic: {
        declared: declaredVersion(publicFunctionsPackage, 'firebase-functions'),
        installed: installedVersion(publicFunctionsLock, 'firebase-functions'),
      },
    },
    audit,
    procedure: {
      docPath: '_DOCS/maintenance-next.md',
      updateCommand: 'npm update next react react-dom firebase firebase-admin',
      auditCommand: 'npm run maintenance:audit',
      rollbackRule: 'revenir au dernier commit/deploiement App Hosting stable puis redeployer la sandbox',
      securityRule: 'patcher Next rapidement en cas d advisory securite',
    },
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Maintenance audit written to ${path.relative(rootDir, outputPath)}`);
  if (audit.total > 0) {
    console.log(`Vulnerabilities: ${audit.total}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
