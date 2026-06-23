const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const SCAN_ROOTS = ['app', 'src'];
const IGNORED_DIRS = new Set(['.git', '.next', 'node_modules', 'dist', 'logs', '.firebase']);
const ALLOWED_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs']);
const FIREBASE_SERVICES = ['firestore', 'functions', 'storage', 'auth', 'app-check'];
const ALLOWED_FIREBASE_IMPORT_FILES = new Set([
  'src/kit/config/firebaseLazy.js',
  'src/kit/config/firebaseCore.js',
]);

const toRelative = (filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/');

const walk = (start) => {
  const files = [];
  const stack = [path.join(ROOT, start)];

  while (stack.length) {
    const current = stack.pop();
    if (!fs.existsSync(current)) continue;
    const stat = fs.statSync(current);

    if (stat.isDirectory()) {
      if (IGNORED_DIRS.has(path.basename(current))) continue;
      for (const child of fs.readdirSync(current)) stack.push(path.join(current, child));
      continue;
    }

    if (ALLOWED_EXTENSIONS.has(path.extname(current))) files.push(current);
  }

  return files;
};

const findMatches = () => {
  const findings = [];
  const importPattern = /(?:from\s+['"]firebase\/([^'"]+)['"]|import\(\s*['"]firebase\/([^'"]+)['"]\s*\))/g;
  const legacyConfigPattern = /(?:from\s+['"][^'"]*config\/firebase['"]|import\(\s*['"][^'"]*config\/firebase['"]\s*\))/g;

  for (const file of SCAN_ROOTS.flatMap(walk)) {
    const relative = toRelative(file);
    const content = fs.readFileSync(file, 'utf8');

    if (relative !== 'src/kit/config/firebase.js' && legacyConfigPattern.test(content)) {
      findings.push({
        service: 'legacy-config',
        file: relative,
        import: 'config/firebase',
        guidance: 'Remplacer db/functions synchrones par getDb/getCallableFunction/getFunctionsInstance depuis firebaseLazy.'
      });
    }

    importPattern.lastIndex = 0;
    let match;
    while ((match = importPattern.exec(content))) {
      const service = match[1] || match[2] || '';
      const serviceRoot = service.split('/')[0];
      if (!FIREBASE_SERVICES.includes(serviceRoot)) continue;
      if (ALLOWED_FIREBASE_IMPORT_FILES.has(relative)) continue;
      if (serviceRoot === 'storage') {
        const lineStart = content.lastIndexOf('\n', match.index) + 1;
        const lineEnd = content.indexOf('\n', match.index);
        const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);
        if (!line.includes('getStorage')) continue;
      }
      findings.push({
        service: serviceRoot,
        file: relative,
        import: `firebase/${service}`,
        guidance: serviceRoot === 'storage'
          ? 'Garder les helpers storage, mais obtenir l instance via getStorageInstance() avant ref/upload/delete.'
          : 'Passer par firebaseLazy pour initialiser App Check avant l instance Firebase.'
      });
    }
  }

  return findings.sort((a, b) => (
    a.service.localeCompare(b.service)
    || a.file.localeCompare(b.file)
    || a.import.localeCompare(b.import)
  ));
};

const findings = findMatches();
const grouped = findings.reduce((acc, finding) => {
  if (!acc[finding.service]) acc[finding.service] = [];
  acc[finding.service].push(finding);
  return acc;
}, {});

const output = {
  ok: findings.length === 0,
  findingCount: findings.length,
  grouped
};

console.log(JSON.stringify(output, null, 2));
if (!output.ok) process.exitCode = 1;
