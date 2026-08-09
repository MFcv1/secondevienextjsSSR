const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appBuildDir = path.join(root, '.next', 'server', 'app');

const readAppHostingValue = (variableName) => {
  const lines = fs.readFileSync(path.join(root, 'apphosting.yaml'), 'utf8').split(/\r?\n/);
  let currentVariable = '';
  for (const rawLine of lines) {
    const variableMatch = rawLine.match(/^\s*-\s+variable:\s*([^\s#]+)\s*$/);
    if (variableMatch) {
      currentVariable = variableMatch[1];
      continue;
    }
    if (currentVariable !== variableName) continue;
    const valueMatch = rawLine.match(/^\s+value:\s*(.+?)\s*$/);
    if (valueMatch) return valueMatch[1].replace(/^['"]|['"]$/g, '').replace(/\/$/, '');
  }
  return '';
};

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolutePath = path.join(directory, entry.name);
  if (entry.isDirectory()) return walk(absolutePath);
  return /\.(?:html|body)$/.test(entry.name) ? [absolutePath] : [];
});

const expectedOrigin = readAppHostingValue('NEXT_PUBLIC_SITE_URL');
const strictOrigin = readAppHostingValue('NEXT_STRICT_PUBLIC_ORIGIN');

assert.equal(strictOrigin, 'true', 'apphosting.yaml doit activer NEXT_STRICT_PUBLIC_ORIGIN');
assert.match(expectedOrigin, /^https:\/\//, 'l origine sandbox App Hosting doit etre HTTPS');
assert.equal(fs.existsSync(path.join(root, '.next', 'BUILD_ID')), true, 'le build Next manque (.next/BUILD_ID)');
assert.equal(fs.existsSync(appBuildDir), true, 'le rendu serveur Next manque (.next/server/app)');

const files = walk(appBuildDir);
assert.ok(files.length > 0, 'aucun artefact HTML/metadata a controler');

const localOriginPattern = /https?:\/\/(?:localhost|127\.0\.0\.1|\[?::1\]?)(?::\d+)?/i;
const leakingFiles = files.filter((filePath) => localOriginPattern.test(fs.readFileSync(filePath, 'utf8')));
assert.deepEqual(
  leakingFiles.map((filePath) => path.relative(root, filePath)),
  [],
  'un artefact public contient une origine locale',
);

const robotsPath = path.join(appBuildDir, 'robots.txt.body');
const sitemapPath = path.join(appBuildDir, 'sitemap.xml.body');
assert.equal(fs.existsSync(robotsPath), true, 'robots.txt prerendu absent');
assert.equal(fs.existsSync(sitemapPath), true, 'sitemap.xml prerendu absent');

const robots = fs.readFileSync(robotsPath, 'utf8');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
assert.match(robots, new RegExp(`Sitemap:\\s*${expectedOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap\\.xml`));

const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.ok(locations.length > 0, 'le sitemap ne contient aucune URL');
assert.deepEqual(
  locations.filter((location) => !location.startsWith(`${expectedOrigin}/`)),
  [],
  'le sitemap contient une URL hors de l origine App Hosting attendue',
);

console.log(`[seo:origin] ${files.length} artefacts verifies sur ${expectedOrigin}: OK`);
