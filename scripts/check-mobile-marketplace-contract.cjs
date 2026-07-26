const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const files = {
  galleryServer: path.join(root, 'src', 'kit', 'marketplace', 'GalleryServerView.jsx'),
  galleryMobile: path.join(root, 'app', 'GalleryMobileShellIsland.jsx'),
  viewportSync: path.join(root, 'app', 'ViewportHeightSyncIsland.jsx'),
  rootLayout: path.join(root, 'app', 'layout.jsx'),
  productDetail: path.join(root, 'src', 'kit', 'marketplace', 'ProductDetailShellIsland.jsx'),
  productReturn: path.join(root, 'src', 'kit', 'marketplace', 'ProductReturnRestoreIsland.jsx'),
  catalogVersionSync: path.join(root, 'src', 'kit', 'marketplace', 'CatalogVersionSyncIsland.jsx'),
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
    label: 'Product detail history fallback only replaces a still-open product route',
    file: files.productDetail,
    pattern: /router\.back\(\)[\s\S]*window\.location\.pathname\.startsWith\('\/produit\/'\)[\s\S]*router\.replace\(targetHref\)/,
  },
  {
    label: 'Product return restoration is atomic and no longer polls visible frames',
    file: files.productReturn,
    pattern: /applyAtomicRestore\(\);[\s\S]*requestAnimationFrame[\s\S]*applyAtomicRestore\(\);[\s\S]*requestAnimationFrame[\s\S]*finishRestore\(\)/,
  },
  {
    label: 'Product return restoration has no fixed multi-frame retry loop',
    file: files.productReturn,
    pattern: /RESTORE_FRAME_LIMIT|retryFrame/,
    forbidden: true,
  },
  {
    label: 'Product return cleanup only removes the record it actually consumed',
    file: files.productReturn,
    pattern: /consumedReturnSavedAt[\s\S]*const consumedSavedAt = consumedReturnSavedAt[\s\S]*Number\(current\?\.savedAt\) === consumedSavedAt[\s\S]*removeItem\(RETURN_KEY\)/,
  },
  {
    label: 'Catalog version checks abort stale route work',
    file: files.catalogVersionSync,
    pattern: /new AbortController\(\)[\s\S]*activeRef\.current[\s\S]*checkAbortRef\.current\?\.abort\(\)/,
  },
  {
    label: 'Gallery pull refresh ignores an in-progress product return',
    file: files.galleryMobile,
    pattern: /PRODUCT_RETURN_PENDING_ATTRIBUTE[\s\S]*root\.hasAttribute\(PRODUCT_RETURN_PENDING_ATTRIBUTE\)/,
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
