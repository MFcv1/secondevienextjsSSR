const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(DIST, 'assets');
const INDEX_HTML = path.join(DIST, 'index.html');

const KB = 1024;

const budgets = [
  { label: 'app shell', pattern: /^index-(?!es-).*\.js$/, maxGzipKb: 90, required: true, pick: 'largest' },
  { label: 'firebase public', pattern: /^firebase-.*\.js$/, maxGzipKb: 160, required: true },
  { label: 'gallery route', pattern: /^GalleryView-.*\.js$/, maxGzipKb: 25, required: true },
  { label: 'product detail route', pattern: /^ProductDetail-.*\.js$/, maxGzipKb: 18, required: true },
  { label: 'category route', pattern: /^CategoryPage-.*\.js$/, maxGzipKb: 9, required: true },
  { label: 'category catalog loader', pattern: /^categoryCatalogLoader-.*\.js$/, maxGzipKb: 2, required: true },
  { label: 'firebase storage admin chunk', pattern: /^firebase-storage-.*\.js$/, maxGzipKb: 10, required: true },
  { label: 'orders route without invoice generator', pattern: /^MyOrdersView-.*\.js$/, maxGzipKb: 8, required: true },
  { label: 'stripe checkout modal', pattern: /^CheckoutStripeModal-.*\.js$/, maxGzipKb: 9, required: true },
  { label: 'customer testimonials deferred', pattern: /^CustomerTestimonialsCarousel-.*\.js$/, maxGzipKb: 4, required: true },
];

const forbiddenInitialChunkMarkers = [
  'ProductDetail-',
  'firebase-storage-',
  'categoryCatalogLoader-',
  'CustomerTestimonialsCarousel-',
  'generateInvoice-',
  'CheckoutStripeModal-',
];

const fail = (message) => {
  console.error(`Performance budget failed: ${message}`);
  process.exitCode = 1;
};

if (!fs.existsSync(ASSETS) || !fs.existsSync(INDEX_HTML)) {
  fail('dist is missing. Run npm run build first.');
  process.exit();
}

const files = fs.readdirSync(ASSETS);
const gzipSizeKb = (file) => zlib.gzipSync(fs.readFileSync(path.join(ASSETS, file))).length / KB;
const rawSizeKb = (file) => fs.statSync(path.join(ASSETS, file)).size / KB;

const pickFile = (matches, pick = 'first') => {
  if (!matches.length) return null;
  if (pick !== 'largest') return matches[0];
  return matches.slice().sort((a, b) => rawSizeKb(b) - rawSizeKb(a))[0];
};

console.log('Performance budget report');
budgets.forEach((budget) => {
  const matches = files.filter((file) => budget.pattern.test(file));
  const file = pickFile(matches, budget.pick);

  if (!file) {
    if (budget.required) fail(`${budget.label} chunk not found`);
    return;
  }

  const gzipKb = gzipSizeKb(file);
  const rawKb = rawSizeKb(file);
  const status = gzipKb <= budget.maxGzipKb ? 'OK' : 'FAIL';
  console.log(`${status} ${budget.label}: ${rawKb.toFixed(2)} kB raw / ${gzipKb.toFixed(2)} kB gzip (${file})`);

  if (gzipKb > budget.maxGzipKb) {
    fail(`${budget.label} is ${gzipKb.toFixed(2)} kB gzip, max ${budget.maxGzipKb} kB`);
  }
});

const indexHtml = fs.readFileSync(INDEX_HTML, 'utf8');
forbiddenInitialChunkMarkers.forEach((marker) => {
  if (indexHtml.includes(marker)) {
    fail(`${marker} is referenced by dist/index.html and may load on first paint`);
  }
});

if (/Material\+Symbols|material-symbols/i.test(indexHtml)) {
  fail('Material Symbols stylesheet is still present in dist/index.html');
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('OK first-paint chunk references stay clean.');
