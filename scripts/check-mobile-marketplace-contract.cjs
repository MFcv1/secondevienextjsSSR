const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const files = {
  galleryServer: path.join(root, 'src', 'kit', 'marketplace', 'GalleryServerView.jsx'),
  galleryMobile: path.join(root, 'app', 'GalleryMobileShellIsland.jsx'),
  viewportSync: path.join(root, 'app', 'ViewportHeightSyncIsland.jsx'),
  rootLayout: path.join(root, 'app', 'layout.jsx'),
  productDetail: path.join(root, 'src', 'kit', 'marketplace', 'ProductDetailShellIsland.jsx'),
  css: path.join(root, 'src', 'index.css'),
  contract: path.join(root, '_DOCS', 'ux', 'INTERFACE_NAVIGATION.md'),
};

const read = (file) => fs.readFileSync(file, 'utf8');

const checks = [
  {
    label: 'INTERFACE_NAVIGATION.md documents the Next gallery mobile contract',
    file: files.contract,
    pattern: /GalleryMobileShellIsland[\s\S]*GalleryServerView/,
  },
  {
    label: 'Next gallery mobile island keeps the mobile fixed shell contract',
    file: files.galleryMobile,
    pattern: /marketplace-mobile-scroll-lock/,
  },
  {
    label: 'Root layout keeps the visual viewport synchronizer mounted across routes',
    file: files.rootLayout,
    pattern: /<ViewportHeightSyncIsland\s*\/>/,
  },
  {
    label: 'Global viewport synchronizer owns the marketplace viewport height',
    file: files.viewportSync,
    pattern: /visualViewport[\s\S]*VIEWPORT_HEIGHT_PROPERTY[\s\S]*setProperty/,
  },
  {
    label: 'Global viewport synchronizer follows browser chrome and app resume changes',
    file: files.viewportSync,
    pattern: /addEventListener\('resize'[\s\S]*addEventListener\('scroll'[\s\S]*addEventListener\('pageshow'[\s\S]*addEventListener\('visibilitychange'/,
  },
  {
    label: 'Gallery mobile island no longer owns the global viewport height',
    file: files.galleryMobile,
    pattern: /--marketplace-viewport-height/,
    forbidden: true,
  },
  {
    label: 'Product detail consumes the shared dynamic viewport height',
    file: files.productDetail,
    pattern: /var\(--marketplace-viewport-height,\s*100dvh\)/,
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
