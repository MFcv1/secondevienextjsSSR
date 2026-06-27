const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const NEXT_DIR = path.join(ROOT, '.next');
const STATIC_DIR = path.join(NEXT_DIR, 'static');
const APP_BUILD_MANIFEST = path.join(NEXT_DIR, 'app-build-manifest.json');
const SERVER_APP_DIR = path.join(NEXT_DIR, 'server', 'app');
const PUBLIC_ROBOTS = path.join(ROOT, 'public', 'robots.txt');

const KB = 1024;
const OLD_HOST = 'secondevie-a0745.web.app';

const routeBudgets = [
  {
    label: 'root gallery redirect route',
    keys: ['/layout', '/page'],
    maxInitialJsGzipKb: 135,
    maxInitialCssGzipKb: 55,
  },
  {
    label: 'product SSR route exact detail island',
    keys: ['/layout', '/produit/[slugOrId]/page'],
    maxInitialJsGzipKb: 215,
    maxInitialCssGzipKb: 55,
  },
  {
    label: 'gallery SSR route',
    keys: ['/layout', '/galerie/page'],
    maxInitialJsGzipKb: 190,
    maxInitialCssGzipKb: 55,
  },
  {
    label: 'category SSR route',
    keys: ['/layout', '/categorie/[categoryId]/page'],
    maxInitialJsGzipKb: 130,
    maxInitialCssGzipKb: 55,
  },
  {
    label: 'about native SSR route',
    keys: ['/layout', '/a-propos/page'],
    maxInitialJsGzipKb: 170,
    maxInitialCssGzipKb: 55,
  },
  {
    label: 'quote SSR route',
    keys: ['/layout', '/devis/page'],
    maxInitialJsGzipKb: 125,
    maxInitialCssGzipKb: 55,
  },
  {
    label: 'admin client tunnel',
    keys: ['/layout', '/admin/page'],
    maxInitialJsGzipKb: 135,
    maxInitialCssGzipKb: 60,
  },
];

const staticBudgets = {
  maxLargestJsGzipKb: 130,
  maxLargestCssGzipKb: 55,
};

const fail = (message) => {
  console.error(`Performance budget failed: ${message}`);
  process.exitCode = 1;
};

const assertFile = (filePath, message) => {
  if (!fs.existsSync(filePath)) {
    fail(message);
    return false;
  }
  return true;
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(absolutePath);
    if (!entry.isFile()) return [];
    return [absolutePath];
  });
};

const gzipSizeKb = (filePath) => zlib.gzipSync(fs.readFileSync(filePath)).length / KB;
const rawSizeKb = (filePath) => fs.statSync(filePath).size / KB;
const formatKb = (value) => `${value.toFixed(2)} kB`;
const relative = (filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/');

const loadJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const resolveStaticAsset = (assetPath) => {
  const normalized = assetPath.replace(/^\/_next\//, '').replace(/^\/+/, '');
  const absolutePath = path.join(NEXT_DIR, normalized);
  return fs.existsSync(absolutePath) ? absolutePath : null;
};

const uniqueFiles = (files) => [...new Set(files.filter(Boolean))];

const sumGzip = (files) => files.reduce((total, filePath) => total + gzipSizeKb(filePath), 0);

const manifestFilesForKeys = (manifest, keys) => {
  const pages = manifest.pages || {};
  const assets = keys.flatMap((key) => pages[key] || []);
  return uniqueFiles([
    ...assets.map(resolveStaticAsset),
    ...keys.flatMap(clientReferenceFilesForKey),
  ]);
};

const clientReferencePathForKey = (key) => {
  if (!key.endsWith('/page')) return null;
  return path.join(SERVER_APP_DIR, `${key.replace(/^\/+/, '')}_client-reference-manifest.js`);
};

const readClientReferenceManifest = (key) => {
  const manifestPath = clientReferencePathForKey(key);
  if (!manifestPath || !fs.existsSync(manifestPath)) return null;

  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(manifestPath, 'utf8'), sandbox, { filename: manifestPath });
  return sandbox.__RSC_MANIFEST?.[key] || null;
};

const clientReferenceFilesForKey = (key) => {
  const manifest = readClientReferenceManifest(key);
  if (!manifest) return [];

  const chunkPaths = Object.values(manifest.clientModules || {})
    .flatMap((clientModule) => clientModule.chunks || [])
    .filter((chunkPath) => typeof chunkPath === 'string' && chunkPath.startsWith('static/'));
  const cssPaths = Object.values(manifest.entryCSSFiles || {})
    .flatMap((files) => files || [])
    .map((file) => file.path)
    .filter(Boolean);

  return uniqueFiles([...chunkPaths, ...cssPaths].map(resolveStaticAsset));
};

const collectServerTextFiles = () =>
  walk(SERVER_APP_DIR).filter((filePath) => /\.(html|xml|txt|json|rsc)$/i.test(filePath));

if (
  !assertFile(NEXT_DIR, '.next is missing. Run npm run build first.') ||
  !assertFile(APP_BUILD_MANIFEST, '.next/app-build-manifest.json is missing. Run npm run build first.')
) {
  process.exit(process.exitCode || 1);
}

const appBuildManifest = loadJson(APP_BUILD_MANIFEST);
const staticFiles = walk(STATIC_DIR);
const jsFiles = staticFiles.filter((filePath) => filePath.endsWith('.js'));
const cssFiles = staticFiles.filter((filePath) => filePath.endsWith('.css'));

console.log('Next performance budget report');

for (const budget of routeBudgets) {
  const files = manifestFilesForKeys(appBuildManifest, budget.keys);
  const js = files.filter((filePath) => filePath.endsWith('.js'));
  const css = files.filter((filePath) => filePath.endsWith('.css'));
  const jsGzip = sumGzip(js);
  const cssGzip = sumGzip(css);

  const jsStatus = jsGzip <= budget.maxInitialJsGzipKb ? 'OK' : 'FAIL';
  const cssStatus = cssGzip <= budget.maxInitialCssGzipKb ? 'OK' : 'FAIL';
  console.log(
    `${jsStatus} ${budget.label}: ${formatKb(jsGzip)} JS gzip across ${js.length} initial files`,
  );
  console.log(
    `${cssStatus} ${budget.label}: ${formatKb(cssGzip)} CSS gzip across ${css.length} initial files`,
  );

  if (!files.length) {
    fail(`${budget.label} assets not found for keys: ${budget.keys.join(', ')}`);
  }
  if (jsGzip > budget.maxInitialJsGzipKb) {
    fail(
      `${budget.label} initial JS is ${formatKb(jsGzip)}, max ${formatKb(
        budget.maxInitialJsGzipKb,
      )}`,
    );
  }
  if (cssGzip > budget.maxInitialCssGzipKb) {
    fail(
      `${budget.label} initial CSS is ${formatKb(cssGzip)}, max ${formatKb(
        budget.maxInitialCssGzipKb,
      )}`,
    );
  }
}

const largestJs = jsFiles
  .map((filePath) => ({ filePath, gzip: gzipSizeKb(filePath), raw: rawSizeKb(filePath) }))
  .sort((a, b) => b.gzip - a.gzip)[0];
const largestCss = cssFiles
  .map((filePath) => ({ filePath, gzip: gzipSizeKb(filePath), raw: rawSizeKb(filePath) }))
  .sort((a, b) => b.gzip - a.gzip)[0];

if (largestJs) {
  const status = largestJs.gzip <= staticBudgets.maxLargestJsGzipKb ? 'OK' : 'FAIL';
  console.log(
    `${status} largest deferred/static JS: ${formatKb(largestJs.raw)} raw / ${formatKb(
      largestJs.gzip,
    )} gzip (${relative(largestJs.filePath)})`,
  );
  if (largestJs.gzip > staticBudgets.maxLargestJsGzipKb) {
    fail(
      `largest JS chunk is ${formatKb(largestJs.gzip)}, max ${formatKb(
        staticBudgets.maxLargestJsGzipKb,
      )}`,
    );
  }
}

if (largestCss) {
  const status = largestCss.gzip <= staticBudgets.maxLargestCssGzipKb ? 'OK' : 'FAIL';
  console.log(
    `${status} largest CSS file: ${formatKb(largestCss.raw)} raw / ${formatKb(
      largestCss.gzip,
    )} gzip (${relative(largestCss.filePath)})`,
  );
  if (largestCss.gzip > staticBudgets.maxLargestCssGzipKb) {
    fail(
      `largest CSS file is ${formatKb(largestCss.gzip)}, max ${formatKb(
        staticBudgets.maxLargestCssGzipKb,
      )}`,
    );
  }
}

const serverTextFiles = collectServerTextFiles();
for (const filePath of serverTextFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(OLD_HOST)) {
    fail(`${OLD_HOST} is still present in ${relative(filePath)}`);
  }
  if (content.includes('/_next/image')) {
    fail(`${relative(filePath)} references /_next/image while Firebase variants are the chosen image pipeline`);
  }
}

if (fs.existsSync(PUBLIC_ROBOTS)) {
  fail('public/robots.txt exists and can override app/robots.js');
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('OK Next performance budget passed.');
