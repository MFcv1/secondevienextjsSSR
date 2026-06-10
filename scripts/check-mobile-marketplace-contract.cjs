const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const files = {
  galleryServer: path.join(root, 'src', 'kit', 'marketplace', 'GalleryServerView.jsx'),
  galleryMobile: path.join(root, 'app', 'GalleryMobileShellIsland.jsx'),
  css: path.join(root, 'src', 'index.css'),
  alert: path.join(root, 'alertemobile.md'),
};

const read = (file) => fs.readFileSync(file, 'utf8');

const checks = [
  {
    label: 'alertemobile.md documents the Next gallery mobile contract',
    file: files.alert,
    pattern: /GalleryMobileShellIsland[\s\S]*GalleryServerView/,
  },
  {
    label: 'Next gallery mobile island keeps the mobile fixed shell contract',
    file: files.galleryMobile,
    pattern: /marketplace-mobile-scroll-lock/,
  },
  {
    label: 'Next gallery server view renders the fixed gallery shell',
    file: files.galleryServer,
    pattern: /marketplace-gallery-shell/,
  },
  {
    label: 'Next gallery server view exposes #marketplaceGalleryScroll',
    file: files.galleryServer,
    pattern: /id="marketplaceGalleryScroll"/,
  },
  {
    label: 'Next gallery server view marks detail-open state on the gallery scroller',
    file: files.galleryServer,
    pattern: /data-detail-open="false"/,
  },
  {
    label: 'Next gallery mobile island marks the gallery as a native isolated scroll region',
    file: files.galleryMobile,
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
    label: 'Next gallery server view no longer lazy-loads the legacy product detail overlay',
    file: files.galleryServer,
    pattern: /ProductDetail/,
    forbidden: true,
  },
  {
    label: 'Next gallery mobile island no longer lazy-loads the legacy product detail overlay',
    file: files.galleryMobile,
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
