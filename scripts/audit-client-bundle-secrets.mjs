import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const buildRoot = join(root, '.next');
const staticRoot = join(buildRoot, 'static');

if (!existsSync(buildRoot)) {
  console.error('[security:bundle] .next is missing; run a production build first.');
  process.exit(1);
}

const parseEnv = (file) => {
  if (!existsSync(file)) return {};
  const values = {};
  for (const rawLine of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = rawLine.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return values;
};

const sensitiveKey = /(SECRET|PASSWORD|PRIVATE|TOKEN|HMAC|IBAN|BIC|BANK|SUPER_ADMIN|GMAIL|SERVICE_ACCOUNT|STRIPE_(?:WH|SECRET)|META_APP_SECRET|ENCRYPTION)/i;
const ignoredValues = /^(?:changeme|placeholder|example|todo|none|null|false|true|0|1|your[_-]|<)/i;
const sensitiveValues = new Map();

for (const file of ['.env.sandbox', '.env.production', 'functions/.env.secondevienextjsssr']) {
  const env = parseEnv(join(root, file));
  for (const [key, value] of Object.entries(env)) {
    if (!sensitiveKey.test(key) || value.length < 8 || ignoredValues.test(value)) continue;
    sensitiveValues.set(key, value);
  }
}

const textExtensions = new Set(['.js', '.json', '.html', '.css', '.txt', '.map']);
const files = [];
const stack = [buildRoot];
while (stack.length) {
  const current = stack.pop();
  let stat;
  try { stat = lstatSync(current); } catch { continue; }
  if (stat.isSymbolicLink()) continue;
  if (stat.isDirectory()) {
    for (const child of readdirSync(current)) stack.push(join(current, child));
  } else if (textExtensions.has(extname(current))) {
    files.push(current);
  }
}

const leaks = [];
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const [key, value] of sensitiveValues) {
    if (content.includes(value)) leaks.push({ key, file: relative(root, file) });
  }
}

const publicSourceMaps = existsSync(staticRoot)
  ? files.filter((file) => file.startsWith(staticRoot) && extname(file) === '.map')
  : [];

if (leaks.length || publicSourceMaps.length) {
  for (const leak of leaks) console.error(`[security:bundle] sensitive value for ${leak.key} found in ${leak.file}`);
  for (const file of publicSourceMaps) console.error(`[security:bundle] public source map found: ${relative(root, file)}`);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  filesScanned: files.length,
  sensitiveKeysChecked: sensitiveValues.size,
  publicSourceMaps: 0,
}));
