const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'app');
const NEXT_SERVER_APP_DIR = path.join(ROOT, '.next', 'server', 'app');
const NEXT_PRERENDER_MANIFEST = path.join(ROOT, '.next', 'prerender-manifest.json');

let failureCount = 0;

const fail = (message) => {
  console.error(`Route classification failed: ${message}`);
  failureCount += 1;
};

const ok = (message) => {
  console.log(`OK ${message}`);
};

const warn = (message) => {
  console.warn(`SKIP ${message}`);
};

const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));
const toPosix = (filePath) => filePath.replace(/\\/g, '/');

const assertExists = (relativePath, label) => {
  if (!exists(relativePath)) {
    fail(`${label} missing: ${relativePath}`);
    return;
  }
  ok(`${label}: ${relativePath}`);
};

const assertSourceIncludes = (relativePath, pattern, label) => {
  const content = read(relativePath);
  if (!pattern.test(content)) {
    fail(`${label} missing in ${relativePath}`);
    return;
  }
  ok(`${label}: ${relativePath}`);
};

const assertSourceExcludes = (relativePath, pattern, label) => {
  const content = stripComments(read(relativePath));
  if (pattern.test(content)) {
    fail(`${label} found in ${relativePath}`);
    return;
  }
  ok(`${label} absent: ${relativePath}`);
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return entry.isFile() ? [absolute] : [];
  });
};

const stripComments = (content) => (
  content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
);

const sourceExtensions = ['', '.js', '.jsx', '.mjs', '.cjs'];

const resolveLocalImport = (fromRelativePath, specifier) => {
  if (!specifier.startsWith('.')) return null;

  const fromDir = path.dirname(path.join(ROOT, fromRelativePath));
  const rawTarget = path.resolve(fromDir, specifier);
  const candidates = [
    ...sourceExtensions.map((extension) => `${rawTarget}${extension}`),
    ...sourceExtensions
      .filter(Boolean)
      .map((extension) => path.join(rawTarget, `index${extension}`)),
  ];

  const match = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  return match ? toPosix(path.relative(ROOT, match)) : null;
};

const getLocalImports = (relativePath) => {
  const content = stripComments(read(relativePath));
  const imports = [];
  const importPattern = /\b(?:import|export)\s+(?:[^'"]*?\s+from\s*)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = importPattern.exec(content)) !== null) {
    const specifier = match[1] || match[2];
    const resolved = resolveLocalImport(relativePath, specifier);
    if (resolved) imports.push(resolved);
  }

  return imports;
};

const collectReachableSourceFiles = (entryRelativePath) => {
  const seen = new Set();
  const stack = [entryRelativePath];

  while (stack.length) {
    const relativePath = stack.pop();
    if (!relativePath || seen.has(relativePath) || !exists(relativePath)) continue;
    if (!/\.(js|jsx|mjs|cjs)$/.test(relativePath)) continue;

    seen.add(relativePath);
    for (const importedPath of getLocalImports(relativePath)) {
      if (!seen.has(importedPath)) stack.push(importedPath);
    }
  }

  return [...seen].sort();
};

const publicSeoRoutes = [
  { route: '/', file: 'app/page.jsx', artifact: 'index.html', revalidate: 3600 },
  { route: '/galerie', file: 'app/galerie/page.jsx', artifact: 'galerie.html', revalidate: 300, forceStatic: true },
  { route: '/a-propos', file: 'app/a-propos/page.jsx', artifact: 'a-propos.html', revalidate: 300 },
  { route: '/categorie/[categoryId]', file: 'app/categorie/[categoryId]/page.jsx', revalidate: 300, staticParams: true },
  { route: '/produit/[slugOrId]', file: 'app/produit/[slugOrId]/page.jsx', revalidate: 300, staticParams: true },
  { route: '/devis', file: 'app/devis/page.jsx', artifact: 'devis.html', revalidate: 300 },
];

const publicMetadataRoutes = [
  { route: '/sitemap.xml', file: 'app/sitemap.js', artifact: 'sitemap.xml.body', revalidate: 300 },
  { route: '/robots.txt', file: 'app/robots.js' },
];

const requestTimePublicEntries = [
  { route: 'root layout', file: 'app/layout.jsx' },
  ...publicSeoRoutes,
  ...publicMetadataRoutes,
];

const dynamicRouteAllowlist = [
  { route: '/admin', file: 'app/admin/page.jsx' },
  { route: '/checkout', file: 'app/checkout/page.jsx' },
  { route: '/wishlist', file: 'app/wishlist/page.jsx' },
  { route: '/mes-commandes', file: 'app/mes-commandes/page.jsx' },
  { route: '/api/revalidate-catalog', file: 'app/api/revalidate-catalog/route.js' },
];

const forbiddenPublicImports = [
  /from\s+['"][^'"]*ClientApp['"]/,
  /<ClientApp\b/,
  /from\s+['"][^'"]*src\/app(?:\.jsx)?['"]/,
  /from\s+['"][^'"]*Router(?:\.jsx)?['"]/,
  /from\s+['"][^'"]*HomeView['"]/,
  /from\s+['"][^'"]*CategoryLegacyExperienceIsland['"]/,
  /from\s+['"][^'"]*AboutVitrineIsland['"]/,
];

const forbiddenRequestTimePatterns = [
  { pattern: /\bfrom\s+['"]next\/headers['"]/, label: 'next/headers import' },
  { pattern: /\bcookies\s*\(/, label: 'cookies() call' },
  { pattern: /\bheaders\s*\(/, label: 'headers() call' },
  { pattern: /\bdraftMode\s*\(/, label: 'draftMode() call' },
];

if (!fs.existsSync(NEXT_SERVER_APP_DIR)) {
  warn('.next/server/app is missing; post-build artifact checks require npm run build');
} else {
  assertExists('.next/server/app/index.html', 'home static artifact');
  assertExists('.next/server/app/galerie.html', 'gallery static artifact');
  assertExists('.next/server/app/a-propos.html', 'about static artifact');
  assertExists('.next/server/app/devis.html', 'quote static artifact');
  assertExists('.next/server/app/sitemap.xml.body', 'sitemap static artifact');
}

if (fs.existsSync(NEXT_PRERENDER_MANIFEST)) {
  const manifest = JSON.parse(fs.readFileSync(NEXT_PRERENDER_MANIFEST, 'utf8'));
  for (const route of [...publicSeoRoutes, ...publicMetadataRoutes].filter((entry) => entry.artifact)) {
    const manifestRoute = manifest.routes?.[route.route];
    if (!manifestRoute) {
      fail(`post-build prerender manifest missing public static route ${route.route}`);
      continue;
    }
    if (route.revalidate && manifestRoute.initialRevalidateSeconds !== route.revalidate) {
      fail(`${route.route} revalidate expected ${route.revalidate}, got ${manifestRoute.initialRevalidateSeconds}`);
      continue;
    }
    ok(`post-build prerender route ${route.route}`);
  }
} else {
  warn('.next/prerender-manifest.json is missing; post-build route classification skipped');
}

assertSourceIncludes('app/galerie/page.jsx', /dynamic\s*=\s*['"]force-static['"]/, 'gallery force-static export');
for (const route of publicSeoRoutes) {
  assertSourceIncludes(route.file, new RegExp(`revalidate\\s*=\\s*${route.revalidate}`), `${route.route} ISR revalidate`);
  assertSourceExcludes(route.file, /dynamic\s*=\s*['"]force-dynamic['"]/, `${route.route} force-dynamic export`);
  if (route.staticParams) {
    assertSourceIncludes(route.file, /generateStaticParams/, `${route.route} SSG static params`);
  }
  if (route.forceStatic) {
    assertSourceIncludes(route.file, /dynamic\s*=\s*['"]force-static['"]/, `${route.route} force-static export`);
  }
}

for (const route of dynamicRouteAllowlist) {
  assertSourceIncludes(route.file, /dynamic\s*=\s*['"]force-dynamic['"]/, `${route.route} explicit force-dynamic tunnel`);
}

const publicRouteFiles = [...publicSeoRoutes, ...publicMetadataRoutes].map((route) => route.file);

const legacyCheckStartFailures = failureCount;
for (const relativePath of publicRouteFiles) {
  const content = read(relativePath);
  for (const pattern of forbiddenPublicImports) {
    if (pattern.test(content)) {
      fail(`legacy public import matched ${pattern} in ${relativePath}`);
    }
  }
}
if (failureCount === legacyCheckStartFailures) {
  ok('public route files do not import legacy SPA shells');
}

for (const route of publicSeoRoutes) {
  const content = stripComments(read(route.file));
  if (/\bsearchParams\b/.test(content)) {
    fail(`${route.route} must not declare, await, or pass searchParams in ${route.file}`);
  } else {
    ok(`${route.route} does not use page searchParams`);
  }
}

const requestTimeCheckStartFailures = failureCount;
for (const entry of requestTimePublicEntries) {
  const reachableFiles = collectReachableSourceFiles(entry.file);
  for (const relativePath of reachableFiles) {
    const content = stripComments(read(relativePath));
    for (const { pattern, label } of forbiddenRequestTimePatterns) {
      if (pattern.test(content)) {
        fail(`${entry.route} reaches request-time API (${label}) through ${relativePath}`);
      }
    }
  }
}
if (failureCount === requestTimeCheckStartFailures) {
  ok('public SEO route dependency graphs do not reach next/headers request-time APIs');
}

const activeSourceFiles = walk(APP_DIR)
  .filter((filePath) => /\.(js|jsx)$/.test(filePath))
  .map((filePath) => toPosix(path.relative(ROOT, filePath)));

for (const relativePath of activeSourceFiles) {
  const content = read(relativePath);
  if (/CategoryLegacyExperienceIsland|HomeView|AboutVitrineIsland/.test(content) && publicRouteFiles.includes(relativePath)) {
    fail(`legacy route reference in ${relativePath}`);
  }
}

if (failureCount) {
  console.error(`Next route classification gate failed with ${failureCount} issue(s).`);
  process.exit(1);
}
console.log('OK Next route classification gate passed.');
