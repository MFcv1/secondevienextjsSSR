const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const files = {
  router: path.join(root, 'src', 'Router.jsx'),
  css: path.join(root, 'src', 'index.css'),
  alert: path.join(root, 'alertemobile.md'),
};

const read = (file) => fs.readFileSync(file, 'utf8');

const checks = [
  {
    label: 'alertemobile.md exists and documents the invariant',
    file: files.alert,
    pattern: /shouldUseMobileGalleryScroll\s*=\s*view\s*===\s*'gallery'\s*\|\|\s*isGalleryDetailOverlay/,
  },
  {
    label: 'Router keeps the gallery mobile fixed shell contract',
    file: files.router,
    pattern: /const\s+shouldUseMobileGalleryScroll\s*=\s*view\s*===\s*'gallery'\s*\|\|\s*isGalleryDetailOverlay\s*;/,
  },
  {
    label: 'Router still renders the fixed gallery shell',
    file: files.router,
    pattern: /marketplace-gallery-shell/,
  },
  {
    label: 'Router still exposes #marketplaceGalleryScroll',
    file: files.router,
    pattern: /id="marketplaceGalleryScroll"/,
  },
  {
    label: 'Router still marks detail-open state on the gallery scroller',
    file: files.router,
    pattern: /data-detail-open=\{isGalleryDetailOverlay\s*\?\s*'true'\s*:\s*'false'\}/,
  },
  {
    label: 'Router still marks the gallery as a native isolated scroll region',
    file: files.router,
    pattern: /data-native-scroll-region/,
  },
  {
    label: 'CSS freezes the gallery scroller while detail is open',
    file: files.css,
    pattern: /\.marketplace-gallery-scroll\[data-detail-open="true"\][\s\S]*?overflow-y:\s*hidden[\s\S]*?touch-action:\s*none/,
  },
  {
    label: 'CSS disables native momentum during detail-open freeze',
    file: files.css,
    pattern: /\.marketplace-gallery-scroll\[data-detail-open="true"\][\s\S]*?-webkit-overflow-scrolling:\s*auto/,
  },
  {
    label: 'Router no longer lazy-loads the legacy product detail overlay',
    file: files.router,
    pattern: /ProductDetail/,
    forbidden: true,
  },
];

const failures = [];

checks.forEach((check) => {
  let source = '';
  try {
    source = read(check.file);
  } catch (error) {
    failures.push(`${check.label}: cannot read ${path.relative(root, check.file)} (${error.message})`);
    return;
  }

  const matches = check.pattern.test(source);
  if (check.forbidden ? matches : !matches) {
    const reason = check.forbidden ? 'forbidden legacy marker found' : 'missing expected contract';
    failures.push(`${check.label}: ${reason} in ${path.relative(root, check.file)}`);
  }
});

if (failures.length) {
  console.error('Mobile marketplace contract check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mobile marketplace contract check');
checks.forEach((check) => console.log(`OK ${check.label}`));
