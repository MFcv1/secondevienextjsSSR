const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'app');
const NEXT_SERVER_APP_DIR = path.join(ROOT, '.next', 'server', 'app');

const fail = (message) => {
  console.error(`Route classification failed: ${message}`);
  process.exitCode = 1;
};

const ok = (message) => {
  console.log(`OK ${message}`);
};

const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));

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

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return entry.isFile() ? [absolute] : [];
  });
};

const publicRouteFiles = [
  'app/page.jsx',
  'app/galerie/page.jsx',
  'app/a-propos/page.jsx',
  'app/categorie/[categoryId]/page.jsx',
  'app/produit/[slugOrId]/page.jsx',
  'app/devis/page.jsx',
  'app/sitemap.js',
  'app/robots.js',
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

if (!fs.existsSync(NEXT_SERVER_APP_DIR)) {
  fail('.next/server/app is missing. Run npm run build first.');
} else {
  assertExists('.next/server/app/index.html', 'home static artifact');
  assertExists('.next/server/app/galerie.html', 'gallery static artifact');
  assertExists('.next/server/app/a-propos.html', 'about static artifact');
  assertExists('.next/server/app/devis.html', 'quote static artifact');
  assertExists('.next/server/app/sitemap.xml.body', 'sitemap static artifact');
}

assertSourceIncludes('app/galerie/page.jsx', /dynamic\s*=\s*['"]force-static['"]/, 'gallery force-static export');
assertSourceIncludes('app/galerie/page.jsx', /revalidate\s*=\s*300/, 'gallery ISR revalidate');
assertSourceIncludes('app/a-propos/page.jsx', /revalidate\s*=\s*300/, 'about ISR revalidate');
assertSourceIncludes('app/devis/page.jsx', /revalidate\s*=\s*300/, 'quote ISR revalidate');
assertSourceIncludes('app/categorie/[categoryId]/page.jsx', /generateStaticParams/, 'category SSG static params');
assertSourceIncludes('app/produit/[slugOrId]/page.jsx', /generateStaticParams/, 'product SSG static params');

for (const relativePath of publicRouteFiles) {
  const content = read(relativePath);
  for (const pattern of forbiddenPublicImports) {
    if (pattern.test(content)) {
      fail(`legacy public import matched ${pattern} in ${relativePath}`);
    }
  }
}
ok('public route files do not import legacy SPA shells');

const activeSourceFiles = walk(APP_DIR)
  .filter((filePath) => /\.(js|jsx)$/.test(filePath))
  .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'));

for (const relativePath of activeSourceFiles) {
  const content = read(relativePath);
  if (/CategoryLegacyExperienceIsland|HomeView|AboutVitrineIsland/.test(content) && publicRouteFiles.includes(relativePath)) {
    fail(`legacy route reference in ${relativePath}`);
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log('OK Next route classification gate passed.');
