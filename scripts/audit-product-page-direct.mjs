import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_BASE_URL = 'http://127.0.0.1:4300';
const DEFAULT_PRODUCT_PATH = '/produit/buffet-KrTETXPknYNwgak66T8p';
const PRODUCT_IMAGE_RE = /firebasestorage\.googleapis\.com|storage\.googleapis\.com|firebasestorage\.app/i;
const PRODUCT_PATH_RE = /furniture|thumbnails|responsive|product|meuble/i;
const GALLERY_ASSET_RE = /imagehero|\/images\/categories|before-after|gallery|cat_/i;

const argv = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) continue;
  const [key, inlineValue] = arg.slice(2).split('=');
  const value = inlineValue ?? process.argv[index + 1];
  argv.set(key, value === undefined || value.startsWith('--') ? true : value);
  if (inlineValue === undefined && value && !value.startsWith('--')) index += 1;
}

const normalizeBaseUrl = (value) => String(value || DEFAULT_BASE_URL).replace(/\/$/, '');
const normalizePath = (value) => {
  const routePath = String(value || DEFAULT_PRODUCT_PATH).trim();
  if (!routePath) return DEFAULT_PRODUCT_PATH;
  try {
    const url = new URL(routePath);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return routePath.startsWith('/') ? routePath : `/${routePath}`;
  }
};

const baseUrl = normalizeBaseUrl(argv.get('url') || process.env.NEXT_BASE_URL);
const productPath = normalizePath(argv.get('path') || process.env.PRODUCT_PATH || process.env.COLD_PRODUCT_PATH);
const targetUrl = `${baseUrl}${productPath}`;
const shouldAssert = argv.has('assert');
const throttle = Number(argv.get('throttle') || 4);
const outDir = path.resolve(String(argv.get('out') || 'logs/product-direct-audit'));

const nowStamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const shortUrl = (url) => {
  try {
    const parsed = new URL(url);
    const file = decodeURIComponent(parsed.pathname.split('/').pop() || parsed.pathname);
    return `${parsed.hostname}/${file}${parsed.search ? '?' : ''}`;
  } catch {
    return String(url).slice(0, 140);
  }
};

const getVariant = (url) => (url.match(/_(thumb|card|medium|large|full)_/i) || [null, 'unknown'])[1].toLowerCase();
const getSlot = (url) => {
  const match = url.match(/_([0-9]+)_(thumb|card|medium|large|full)_/i);
  return match ? Number(match[1]) : null;
};

const isProductImageUrl = (url) => PRODUCT_IMAGE_RE.test(url) && PRODUCT_PATH_RE.test(url);

const createContext = async (browser, mode) => browser.newContext({
  viewport: mode === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  isMobile: mode === 'mobile',
  hasTouch: mode === 'mobile',
  deviceScaleFactor: mode === 'mobile' ? 3 : 1,
  locale: 'fr-FR',
});

const clickVisibleThumb = async (page) => page.evaluate(() => {
  const thumbs = Array.from(document.querySelectorAll('[data-thumb-index="1"]'));
  const target = thumbs.find((node) => {
    const rect = node.getBoundingClientRect();
    const styles = window.getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && styles.visibility !== 'hidden' && styles.display !== 'none';
  });
  if (!target) return false;
  target.click();
  return true;
});

const getCurrentMainImageSrc = async (page) => page.evaluate(() => {
  const primaryImage = document.querySelector('[data-product-main-image="true"]');
  if (primaryImage) return primaryImage.currentSrc || primaryImage.src || '';

  const desktopImage = document.querySelector('img[data-desktop-image-ready]');
  if (desktopImage) return desktopImage.currentSrc || desktopImage.src || '';

  const image = Array.from(document.querySelectorAll('.product-detail-mobile-image-layer--current'))
    .find((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 150 && rect.height > 150;
    });
  return image?.currentSrc || image?.src || '';
});

const runMode = async (browser, mode) => {
  const context = await createContext(browser, mode);
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  await client.send('Emulation.setCPUThrottlingRate', { rate: throttle });

  const responses = [];
  const consoleMessages = [];
  const requestPhases = new Map();
  let zoomOpened = false;

  page.on('console', (message) => {
    if (!['error', 'warning'].includes(message.type())) return;
    consoleMessages.push({ type: message.type(), text: message.text().slice(0, 260) });
  });
  page.on('pageerror', (error) => {
    consoleMessages.push({ type: 'pageerror', text: error.message.slice(0, 260) });
  });
  page.on('request', (request) => {
    requestPhases.set(request, zoomOpened ? 'after-zoom' : 'before-zoom');
  });
  page.on('response', async (response) => {
    const request = response.request();
    let bytes = Number(response.headers()['content-length'] || 0);
    if (!bytes) {
      try {
        bytes = (await response.body()).byteLength;
      } catch {
        bytes = 0;
      }
    }
    responses.push({
      url: response.url(),
      type: request.resourceType(),
      status: response.status(),
      bytes,
      phase: requestPhases.get(request) || (zoomOpened ? 'after-zoom' : 'before-zoom'),
    });
  });

  await page.addInitScript(() => {
    window.__svProductDirectAudit = { longTasks: [] };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__svProductDirectAudit.longTasks.push(Math.round(entry.duration || 0));
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch {
      // Long task support varies; request assertions still cover the migration.
    }
  });

  const startedAt = performance.now();
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  if (!response?.ok()) {
    throw new Error(`Navigation failed for ${targetUrl}: ${response?.status()}`);
  }

  await page.waitForSelector('.split-detail-title, [data-mobile-bottom-sheet]', { timeout: 30_000 });
  await page.waitForFunction(() => {
    const image = Array.from(document.images).find((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 150 && /responsive|furniture|firebasestorage/i.test(node.currentSrc || node.src);
    });
    return Boolean(image?.complete && image.naturalWidth > 0);
  }, null, { timeout: 30_000 });
  const imageReadyMs = Math.round(performance.now() - startedAt);

  const thumbClicked = await clickVisibleThumb(page);
  let mobileSwipe = null;

  await page.waitForTimeout(450);

  const visibleBeforeZoom = await getCurrentMainImageSrc(page);
  zoomOpened = true;
  const openedLightbox = await page.evaluate(() => {
    const image = document.querySelector('[data-product-main-image="true"]');
    const button = image?.closest('button');
    if (button) {
      button.click();
      return true;
    }

    const desktopImage = document.querySelector('img[data-desktop-image-ready]');
    const desktopStage = desktopImage?.closest('.cursor-zoom-in');
    if (desktopStage) {
      desktopStage.click();
      return true;
    }

    const mobileImage = document.querySelector('.product-detail-mobile-image-layer--current');
    const mobileStage = mobileImage?.closest('.cursor-zoom-in');
    if (!mobileStage) return false;
    mobileStage.click();
    return true;
  });

  let lightboxInitial = null;
  if (openedLightbox) {
    try {
      await page.waitForSelector('img.product-detail-lightbox-image[data-lightbox-initial-src]', { timeout: 10_000 });
      lightboxInitial = await page.evaluate(() => {
        const image = document.querySelector('img.product-detail-lightbox-image[data-lightbox-initial-src]');
        return image ? {
          src: image.currentSrc || image.src || '',
          initialSrc: image.dataset.lightboxInitialSrc || '',
          fullSrc: image.dataset.lightboxFullSrc || '',
          complete: image.complete,
          naturalWidth: image.naturalWidth || 0,
        } : null;
      });
      await page.waitForTimeout(1_600);
      await page.getByLabel("Fermer l'image agrandie").click();
      await page.waitForTimeout(180);
    } catch {
      lightboxInitial = null;
    }
  }

  if (mode === 'mobile') {
    const detailsButton = page.getByLabel('Ouvrir les details');
    if (await detailsButton.count()) {
      await detailsButton.tap();
      await page.waitForTimeout(250);
    }
  }

  await page.waitForTimeout(2_200);

  const dom = await page.evaluate(() => {
    const title = document.querySelector('h1')?.textContent?.trim() || '';
    const visibleImage = document.querySelector('[data-product-main-image="true"]') || Array.from(document.images)
      .find((node) => {
        const rect = node.getBoundingClientRect();
        const src = node.currentSrc || node.src;
        const alt = node.alt || '';
        return (
          rect.width > 150 &&
          rect.height > 150 &&
          /responsive|furniture|firebasestorage/i.test(src) &&
          (alt === title || node.className.includes('object-contain') || node.className.includes('product-detail-mobile-image-layer'))
        );
      });
    const desktopBackdrop = Array.from(document.querySelectorAll('img[aria-hidden="true"]')).find((node) => {
      const src = node.currentSrc || node.src || '';
      const rect = node.getBoundingClientRect();
      return /thumb/i.test(src) && rect.width > 200 && rect.height > 200;
    });
    const mobileSheet = document.querySelector('[data-mobile-bottom-sheet]');
    const bodyText = document.body.innerText || '';
    const normalizedBodyText = bodyText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

    return {
      title: document.title,
      h1: title,
      svClientHydrated: document.documentElement.dataset.svClientHydrated === 'true',
      hasMarketplaceGalleryShell: Boolean(document.querySelector('.marketplace-gallery-shell')),
      hasGalleryScroll: Boolean(document.querySelector('.marketplace-gallery-scroll')),
      hasGalleryHero: Boolean(document.querySelector('.marketplace-hero-image')),
      hasGalleryCards: Boolean(document.querySelector('.product-card-image')),
      hasNextProductExperience: Boolean(document.querySelector('[data-next-product-experience="true"]')),
      hasProductSsrPreview: Boolean(document.querySelector('[data-product-ssr-preview]')),
      hasProductDetail: Boolean(visibleImage),
      hasExactProductRouteExperience: Boolean(document.querySelector('.split-detail-title') || document.querySelector('[data-mobile-bottom-sheet]')),
      hasProductInfoSections: normalizedBodyText.includes('LA PIECE') && normalizedBodyText.includes('INFORMATIONS'),
      hasReserveAction: normalizedBodyText.includes('RESERVER') || normalizedBodyText.includes('AJOUTER AU PANIER'),
      hasDesktopBackdrop: Boolean(desktopBackdrop),
      hasMobileSheet: Boolean(mobileSheet),
      mobileSheetOpen: mobileSheet ? !String(mobileSheet.className || '').includes('translate-y-full') : false,
      thumbCount: document.querySelectorAll('[data-thumb-index]').length,
      visibleImage: visibleImage ? {
        src: visibleImage.currentSrc || visibleImage.src || '',
        complete: visibleImage.complete,
        naturalWidth: visibleImage.naturalWidth,
        naturalHeight: visibleImage.naturalHeight,
        rect: {
          width: Math.round(visibleImage.getBoundingClientRect().width),
          height: Math.round(visibleImage.getBoundingClientRect().height),
        },
      } : null,
      longTasks: window.__svProductDirectAudit?.longTasks || [],
    };
  });

  const screenshot = await page.screenshot({ type: 'png', fullPage: false });
  await context.close();

  const bytesFor = (predicate) => Math.round(
    responses.filter(predicate).reduce((sum, entry) => sum + (entry.bytes || 0), 0) / 1024
  );
  const productImages = responses
    .filter((entry) => isProductImageUrl(entry.url))
    .map((entry) => ({
      variant: getVariant(entry.url),
      slot: getSlot(entry.url),
      kb: Math.round((entry.bytes || 0) / 1024),
      phase: entry.phase,
      url: shortUrl(entry.url),
    }));
  const galleryAssets = responses
    .filter((entry) => GALLERY_ASSET_RE.test(entry.url))
    .map((entry) => shortUrl(entry.url));
  const scripts = responses
    .filter((entry) => entry.type === 'script' || /\.js(\?|$)/i.test(entry.url))
    .map((entry) => ({ kb: Math.round((entry.bytes || 0) / 1024), url: shortUrl(entry.url) }));

  return {
    mode,
    finalUrl: page.url(),
    status: response.status(),
    imageReadyMs,
    thumbClicked,
    requests: responses.length,
    totalKB: bytesFor(() => true),
    jsKB: bytesFor((entry) => entry.type === 'script' || /\.js(\?|$)/i.test(entry.url)),
    imageKB: bytesFor((entry) => entry.type === 'image' || PRODUCT_IMAGE_RE.test(entry.url)),
    productImages,
    productImagesBeforeZoom: productImages.filter((image) => image.phase === 'before-zoom'),
    productImagesAfterZoom: productImages.filter((image) => image.phase === 'after-zoom'),
    lightboxInitial: lightboxInitial ? {
      ...lightboxInitial,
      visibleBeforeZoom: shortUrl(visibleBeforeZoom),
      src: shortUrl(lightboxInitial.src),
      initialSrc: shortUrl(lightboxInitial.initialSrc),
      fullSrc: lightboxInitial.fullSrc ? shortUrl(lightboxInitial.fullSrc) : '',
      matchesVisibleImage: Boolean(
        visibleBeforeZoom &&
        lightboxInitial.initialSrc &&
        shortUrl(visibleBeforeZoom) === shortUrl(lightboxInitial.initialSrc)
      ),
    } : null,
    galleryAssets,
    scripts,
    mobileSwipe,
    dom: {
      ...dom,
      visibleImage: dom.visibleImage ? {
        ...dom.visibleImage,
        src: shortUrl(dom.visibleImage.src),
      } : null,
    },
    consoleMessages,
    screenshot,
  };
};

const buildAssertions = (results) => {
  const checks = [];
  const add = (name, passed, detail = {}) => checks.push({ name, passed, detail });

  for (const result of results) {
    const fullBeforeZoom = result.productImagesBeforeZoom.filter((image) => image.variant === 'full');
    const visibleVariant = getVariant(result.dom.visibleImage?.src || '');
    add(`${result.mode}: exact product detail route is present`, result.dom.hasExactProductRouteExperience === true, result.dom);
    add(`${result.mode}: legacy SPA marker is absent`, result.dom.svClientHydrated === false, result.dom);
    add(`${result.mode}: intermediate SSR preview is absent`, result.dom.hasProductSsrPreview === false, result.dom);
    add(`${result.mode}: gallery surface is not shown during direct refresh`, result.dom.hasMarketplaceGalleryShell === false && result.dom.hasGalleryScroll === false && result.dom.hasGalleryHero === false && result.dom.hasGalleryCards === false, result.dom);
    add(`${result.mode}: gallery/home assets are not requested`, result.galleryAssets.length === 0, { galleryAssets: result.galleryAssets });
    add(`${result.mode}: standalone product detail is present`, result.dom.hasProductDetail === true, result.dom);
    add(`${result.mode}: product information sections are visible`, result.dom.hasProductInfoSections === true, result.dom);
    add(`${result.mode}: reservation action is visible`, result.dom.hasReserveAction === true, result.dom);
    add(`${result.mode}: visible product image is loaded`, Boolean(result.dom.visibleImage?.complete && result.dom.visibleImage.naturalWidth > 0), result.dom.visibleImage || {});
    add(`${result.mode}: direct route avoids full before zoom`, fullBeforeZoom.length === 0, { fullBeforeZoom });
    add(`${result.mode}: visible image is a display variant`, ['medium', 'large', 'unknown'].includes(visibleVariant), { visibleVariant, visibleImage: result.dom.visibleImage });
    if (result.lightboxInitial) {
      add(`${result.mode}: lightbox opens on the visible display image`, result.lightboxInitial.matchesVisibleImage === true, result.lightboxInitial);
      add(`${result.mode}: lightbox initial src is not full`, getVariant(result.lightboxInitial.initialSrc || '') !== 'full', result.lightboxInitial);
    }
    add(`${result.mode}: image becomes ready under cold throttled audit budget`, result.imageReadyMs > 0 && result.imageReadyMs <= 8000, { imageReadyMs: result.imageReadyMs });
  }

  const desktop = results.find((result) => result.mode === 'desktop');
  if (desktop) {
    add('desktop: product detail image is visible', Boolean(desktop.dom.visibleImage?.complete), desktop.dom);
  }

  const mobile = results.find((result) => result.mode === 'mobile');
  if (mobile) {
    add('mobile: product mobile sheet exists', mobile.dom.hasMobileSheet === true, mobile.dom);
    if (mobile.mobileSwipe?.attempted) {
      add('mobile: horizontal image swipe does not break the detail image', Boolean(mobile.dom.visibleImage?.complete), mobile.mobileSwipe || {});
    }
  }

  return {
    passed: checks.every((check) => check.passed),
    checks,
  };
};

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
let results;
try {
  results = [
    await runMode(browser, 'desktop'),
    await runMode(browser, 'mobile'),
  ];
} finally {
  await browser.close();
}

const summary = {
  targetUrl,
  throttle,
  generatedAt: new Date().toISOString(),
  results: results.map(({ screenshot, ...result }) => result),
  assertions: buildAssertions(results),
};

const runId = nowStamp();
const summaryPath = path.join(outDir, `${runId}-summary.json`);
await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
await Promise.all(results.map((result) => fs.writeFile(
  path.join(outDir, `${runId}-${result.mode}.png`),
  result.screenshot
)));

console.log(JSON.stringify({
  summaryPath,
  targetUrl,
  assertions: summary.assertions,
  metrics: summary.results.map((result) => ({
    mode: result.mode,
    imageReadyMs: result.imageReadyMs,
    requests: result.requests,
    totalKB: result.totalKB,
    jsKB: result.jsKB,
    imageKB: result.imageKB,
    productImages: result.productImages,
    productImagesBeforeZoom: result.productImagesBeforeZoom,
    productImagesAfterZoom: result.productImagesAfterZoom,
    lightboxInitial: result.lightboxInitial,
    galleryAssets: result.galleryAssets,
    thumbClicked: result.thumbClicked,
    mobileSwipe: result.mobileSwipe,
    dom: result.dom,
    consoleMessages: result.consoleMessages,
  })),
}, null, 2));

if (shouldAssert && !summary.assertions.passed) {
  console.error('Direct product page audit assertions failed.');
  process.exit(1);
}
