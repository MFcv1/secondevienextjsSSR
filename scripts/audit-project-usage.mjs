import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const codeRoots = ['app', 'src', 'functions'];
const auxiliaryRoots = ['deploy'];
const sourceExtensions = ['.js', '.jsx', '.mjs', '.cjs', '.json', '.css'];
const executableExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs']);
const manualRuntimeEntrypoints = new Set([
  'functions/src/commerce/v2Webhooks.js',
]);
const ignoredDirectories = new Set([
  '.firebase',
  '.git',
  '.next',
  'dist',
  'logs',
  'node_modules',
  'output',
  'playwright-report',
  'test-results',
  'tmp',
]);

const toPosix = (value) => value.split(path.sep).join('/');
const relativeToRoot = (value) => toPosix(path.relative(rootDir, value));

async function listFiles(directory) {
  const absolute = path.join(rootDir, directory);
  if (!existsSync(absolute)) return [];
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const child = path.join(absolute, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(relativeToRoot(child)));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

function extractSpecifiers(content) {
  const specifiers = [];
  const patterns = [
    /(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /@import\s+(?:url\()?\s*['"]([^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) specifiers.push(match[1]);
  }
  return [...new Set(specifiers)];
}

function resolveRelativeImport(fromFile, specifier, knownFiles) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base];
  if (!sourceExtensions.includes(path.extname(base))) {
    for (const extension of sourceExtensions) candidates.push(`${base}${extension}`);
    for (const extension of sourceExtensions) candidates.push(path.join(base, `index${extension}`));
  }
  return candidates.find((candidate) => knownFiles.has(candidate)) || null;
}

function packageName(specifier) {
  if (!specifier || specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) {
    return null;
  }
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function isNextEntrypoint(relativePath) {
  if (!relativePath.startsWith('app/')) return false;
  return /\/(?:page|layout|route|error|not-found|loading|sitemap|robots)\.(?:js|jsx|mjs|cjs)$/.test(`/${relativePath}`);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(rootDir, relativePath), 'utf8'));
}

async function main() {
  const [codeFiles, auxiliaryFiles, scriptFiles, testFiles, publicFiles, markdownFiles] = await Promise.all([
    Promise.all(codeRoots.map(listFiles)).then((groups) => groups.flat()),
    Promise.all(auxiliaryRoots.map(listFiles)).then((groups) => groups.flat()),
    listFiles('scripts'),
    listFiles('tests'),
    listFiles('public'),
    listFiles('.').then((files) => files.filter((file) => path.extname(file) === '.md')),
  ]);
  const rootConfigFiles = (await readdir(rootDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /\.(?:js|jsx|mjs|cjs)$/.test(entry.name))
    .map((entry) => path.join(rootDir, entry.name));
  const executableFiles = [...codeFiles, ...auxiliaryFiles, ...scriptFiles, ...testFiles, ...rootConfigFiles]
    .filter((file) => executableExtensions.has(path.extname(file)));
  const knownFiles = new Set([...codeFiles, ...auxiliaryFiles, ...scriptFiles, ...testFiles, ...rootConfigFiles]);
  const graph = new Map();
  const unresolvedRelativeImports = [];
  const importedPackages = new Map();
  const textByFile = new Map();

  for (const file of executableFiles) {
    const content = await readFile(file, 'utf8');
    textByFile.set(file, content);
    const dependencies = [];
    for (const specifier of extractSpecifiers(content)) {
      if (specifier.startsWith('.')) {
        const resolved = resolveRelativeImport(file, specifier, knownFiles);
        if (resolved) dependencies.push(resolved);
        else if (!relativeToRoot(file).startsWith('tests/') && !specifier.includes('/node_modules/')) {
          unresolvedRelativeImports.push({ file: relativeToRoot(file), specifier });
        }
        continue;
      }
      const dependency = packageName(specifier);
      if (!dependency) continue;
      const owners = importedPackages.get(dependency) || new Set();
      owners.add(relativeToRoot(file));
      importedPackages.set(dependency, owners);
    }
    graph.set(file, dependencies);
  }

  const entrypoints = new Set(codeFiles.filter((file) => isNextEntrypoint(relativeToRoot(file))));
  const functionsIndex = path.join(rootDir, 'functions', 'index.js');
  if (knownFiles.has(functionsIndex)) entrypoints.add(functionsIndex);
  for (const relativePath of manualRuntimeEntrypoints) {
    const absolutePath = path.join(rootDir, relativePath);
    if (knownFiles.has(absolutePath)) entrypoints.add(absolutePath);
  }
  const reachable = new Set();
  const visit = (file) => {
    if (reachable.has(file)) return;
    reachable.add(file);
    for (const dependency of graph.get(file) || []) visit(dependency);
  };
  for (const entrypoint of entrypoints) visit(entrypoint);

  const unreachableRuntimeFiles = codeFiles
    .filter((file) => executableExtensions.has(path.extname(file)))
    .filter((file) => !reachable.has(file));

  const packageJson = await readJson('package.json');
  const functionsPackageJson = await readJson('functions/package.json');
  const scriptsText = Object.values(packageJson.scripts || {}).join('\n');
  const documentationText = (await Promise.all([
    ...markdownFiles,
    path.join(rootDir, 'AGENTS.md'),
    path.join(rootDir, 'map.md'),
    path.join(rootDir, 'README.md'),
  ].filter(existsSync).map((file) => readFile(file, 'utf8')))).join('\n');
  const importedByOtherFile = new Set([...graph.values()].flat());
  const supportEntrypoints = [...scriptFiles, ...testFiles]
    .filter((file) => executableExtensions.has(path.extname(file)));
  const supportReachable = new Set();
  const visitSupport = (file) => {
    if (supportReachable.has(file)) return;
    supportReachable.add(file);
    for (const dependency of graph.get(file) || []) visitSupport(dependency);
  };
  for (const entrypoint of supportEntrypoints) visitSupport(entrypoint);
  const supportOnlyRuntimeModules = unreachableRuntimeFiles
    .filter((file) => supportReachable.has(file))
    .map(relativeToRoot)
    .sort();
  const unreachableRuntimeModules = unreachableRuntimeFiles
    .filter((file) => !supportReachable.has(file))
    .map(relativeToRoot)
    .sort();
  const unregisteredScripts = scriptFiles
    .filter((file) => executableExtensions.has(path.extname(file)))
    .filter((file) => !scriptsText.includes(relativeToRoot(file)))
    .filter((file) => !importedByOtherFile.has(file))
    .map((file) => ({
      file: relativeToRoot(file),
      documented: documentationText.includes(relativeToRoot(file)) || documentationText.includes(path.basename(file)),
    }))
    .sort((left, right) => left.file.localeCompare(right.file));

  const textFiles = [...codeFiles, ...auxiliaryFiles, ...scriptFiles, ...testFiles, ...rootConfigFiles]
    .filter((file) => ['.js', '.jsx', '.mjs', '.cjs', '.css', '.json'].includes(path.extname(file)));
  const searchableText = [
    ...await Promise.all(textFiles.map((file) => readFile(file, 'utf8'))),
    documentationText,
    JSON.stringify(packageJson),
  ].join('\n');
  const executableText = [...textByFile.values()].join('\n');
  const unreferencedPublicAssets = publicFiles
    .filter((file) => !/\.(?:html|json)$/i.test(file))
    .filter((file) => {
      const relative = relativeToRoot(file).replace(/^public\//, '');
      return !searchableText.includes(`/${relative}`) && !searchableText.includes(path.basename(file));
    })
    .map(relativeToRoot)
    .sort();

  const declaredRootDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  const packageConfigurationText = [
    scriptsText,
    ...await Promise.all(rootConfigFiles.map((file) => readFile(file, 'utf8'))),
  ].join('\n');
  const dependencyCommands = new Map([
    ['firebase-tools', 'firebase'],
    ['@playwright/test', 'playwright'],
    ['eslint', 'eslint'],
    ['next', 'next'],
    ['tailwindcss', 'tailwindcss'],
  ]);
  const declaredFunctionsDependencies = functionsPackageJson.dependencies || {};
  const rootDependencyCandidates = Object.keys(declaredRootDependencies)
    .filter((dependency) => !importedPackages.has(dependency))
    .filter((dependency) => !packageConfigurationText.includes(dependency))
    .filter((dependency) => {
      const command = dependencyCommands.get(dependency);
      return !command || !new RegExp(`(^|\\s)${command}(?:\\s|$)`, 'm').test(scriptsText);
    })
    .sort();
  const functionsImportText = executableFiles
    .filter((file) => relativeToRoot(file).startsWith('functions/'))
    .map((file) => textByFile.get(file) || '')
    .join('\n');
  const functionsDependenciesWithoutDirectImport = Object.keys(declaredFunctionsDependencies)
    .filter((dependency) => !functionsImportText.includes(`'${dependency}`) && !functionsImportText.includes(`"${dependency}`))
    .sort();
  const functionsDependenciesRetainedByContract = functionsDependenciesWithoutDirectImport
    .filter((dependency) => executableText.includes(dependency));
  const functionsDependencyCandidates = functionsDependenciesWithoutDirectImport
    .filter((dependency) => !functionsDependenciesRetainedByContract.includes(dependency));

  const report = {
    entrypointCount: entrypoints.size,
    reachableRuntimeModuleCount: codeFiles
      .filter((file) => executableExtensions.has(path.extname(file)))
      .filter((file) => reachable.has(file))
      .length,
    runtimeModuleCount: codeFiles.filter((file) => executableExtensions.has(path.extname(file))).length,
    supportOnlyRuntimeModules,
    unreachableRuntimeModules,
    unresolvedRelativeImports,
    unregisteredScripts,
    unreferencedPublicAssets,
    dependencyCandidates: {
      root: rootDependencyCandidates,
      functions: functionsDependencyCandidates,
      functionsRetainedByContract: functionsDependenciesRetainedByContract,
    },
    caveat: 'Only unreachableRuntimeModules, unregisteredScripts, unreferencedPublicAssets and dependencyCandidates are deletion candidates. Every candidate still requires manual verification of framework conventions, generated references, provider entry points, active migration plans and runtime data.',
  };
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
