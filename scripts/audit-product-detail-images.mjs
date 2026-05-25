import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_URL = 'http://127.0.0.1:4300/';
const PRODUCT_IMAGE_RE = /firebasestorage\.googleapis\.com|storage\.googleapis\.com|firebasestorage\.app/i;
const PRODUCT_PATH_RE = /furniture|thumbnails|responsive|product|meuble/i;

const argv = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) continue;
  const [key, inlineValue] = arg.slice(2).split('=');
  const value = inlineValue ?? process.argv[index + 1];
  argv.set(key, value === undefined || value.startsWith('--') ? true : value);
  if (inlineValue === undefined && value && !value.startsWith('--')) index += 1;
}

const targetUrl = String(argv.get('url') || DEFAULT_URL);
const shouldAssert = argv.has('assert');
const throttle = Number(argv.get('throttle') || 4);
const outDir = path.resolve(String(argv.get('out') || 'logs/product-image-audit'));

const nowStamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const shortUrl = (url) => {
  try {
    const parsed = new URL(url);
    const file = decodeURIComponent(parsed.pathname.split('/').pop() || parsed.pathname);
    return `${parsed.hostname}/${file}${parsed.search ? '?' : ''}`;
  } catch {
    return url.slice(0, 140);
  }
};

const getVariant = (url) => (url.match(/_(thumb|card|medium|large|full)_/i) || [null, 'unknown'])[1].toLowerCase();
const getSlot = (url) => {
  const match = url.match(/_([0-9]+)_(thumb|card|medium|large|full)_/i);
  return match ? Number(match[1]) : null;
};
const isProductImageUrl = (url) => PRODUCT_IMAGE_RE.test(url) && PRODUCT_PATH_RE.test(url);
const isDetailVariant = (url) => /\/responsive\//i.test(url) || /%2Fresponsive%2F/i.test(url);

const waitForReady = async (page) => {
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  if (!response?.ok()) {
    throw new Error(`Navigation failed for ${targetUrl}: ${response?.status()}`);
  }
  await page.waitForSelector('.product-card-media', { timeout: 30000 });
  await page.waitForTimeout(900);
};

const createContext = async (browser, mode) => {
  const mobile = mode === 'mobile';
  return browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: mobile ? 3 : 1,
    locale: 'fr-FR',
  });
};

const collectVisibleDetailState = async (page) => page.evaluate(() => {
  const mobileFrame = document.querySelector('.product-detail-mobile-image-frame');
  const mobileImage = document.querySelector('.product-detail-mobile-image-layer--current');
  const desktopMain = Array.from(document.querySelectorAll('main img')).find((image) => {
    const rect = image.getBoundingClientRect();
    const className = String(image.className || '');
    return className.includes('max-h-[92%]') && rect.width > 100 && rect.height > 100;
  });
  const desktopBackdrop = Array.from(document.querySelectorAll('img[aria-hidden="true"]')).find((image) => {
    const className = String(image.className || '');
    return className.includes('blur-[80px]');
  });
  const image = mobileImage || desktopMain;
  const rect = image?.getBoundingClientRect();

  return {
    mobileShell: Boolean(mobileFrame),
    desktopMain: Boolean(desktopMain),
    desktopBackdrop: Boolean(desktopBackdrop),
    currentSrc: image?.currentSrc || image?.src || '',
    complete: Boolean(image?.complete),
    naturalWidth: image?.naturalWidth || 0,
    naturalHeight: image?.naturalHeight || 0,
    rect: rect ? {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top),
      left: Math.round(rect.left),
    } : null,
    thumbImages: Array.from(document.querySelectorAll('button img'))
      .map((img) => img.currentSrc || img.src || '')
      .filter(Boolean)
      .slice(0, 16),
  };
});

const runMode = async (browser, mode) => {
  const context = await createContext(browser, mode);
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  await client.send('Emulation.setCPUThrottlingRate', { rate: throttle });

  const consoleMessages = [];
  page.on('console', (message) => {
    if (!['error', 'warning'].includes(message.type())) return;
    consoleMessages.push({ type: message.type(), text: message.text().slice(0, 300) });
  });
  page.on('pageerror', (error) => {
    consoleMessages.push({ type: 'pageerror', text: error.message.slice(0, 300) });
  });

  await page.addInitScript(() => {
    window.__productImageAudit = { marks: [], longTasks: [] };
    window.__productImageAudit.mark = (name) => {
      window.__productImageAudit.marks.push({ name, at: performance.now() });
    };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__productImageAudit.longTasks.push({
            start: entry.startTime,
            duration: entry.duration,
          });
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch {
      // Browser support varies; this audit can still validate requests.
    }
  });

  await waitForReady(page);

  const firstCard = page.locator('a:has(.product-card-media)').first();
  const href = await firstCard.evaluate((node) => node.href);

  await page.evaluate(() => window.__productImageAudit.mark('before-open'));
  if (mode === 'mobile') {
    await firstCard.tap();
  } else {
    await firstCard.hover();
    await page.waitForTimeout(250);
    await firstCard.click();
  }
  await page.evaluate(() => window.__productImageAudit.mark('after-click'));

  await page.waitForFunction(() => {
    const mobileImage = document.querySelector('.product-detail-mobile-image-layer--current');
    const desktopImage = Array.from(document.querySelectorAll('main img')).find((image) => {
      const rect = image.getBoundingClientRect();
      const className = String(image.className || '');
      return className.includes('max-h-[92%]') && rect.width > 100 && rect.height > 100;
    });
    const image = mobileImage || desktopImage;
    return Boolean(image?.complete && image.naturalWidth > 0);
  }, null, { timeout: 30000 });
  await page.evaluate(() => window.__productImageAudit.mark('first-detail-image-ready'));

  await page.waitForTimeout(2800);

  const state = await collectVisibleDetailState(page);
  const audit = await page.evaluate(() => {
    const marks = window.__productImageAudit?.marks || [];
    const afterClick = marks.find((mark) => mark.name === 'after-click')?.at || 0;
    return {
      marks,
      longTasks: window.__productImageAudit?.longTasks || [],
      resourcesAfterClick: performance.getEntriesByType('resource')
        .filter((entry) => entry.startTime >= afterClick)
        .map((entry) => ({
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
          transferSize: entry.transferSize || 0,
          initiatorType: entry.initiatorType,
        })),
    };
  });
  const screenshot = await page.screenshot({ type: 'png', fullPage: false });
  const title = await page.title();
  const finalUrl = page.url();
  await context.close();

  const afterClick = audit.marks.find((mark) => mark.name === 'after-click')?.at || 0;
  const ready = audit.marks.find((mark) => mark.name === 'first-detail-image-ready')?.at || 0;
  const productImagesAfterClick = audit.resourcesAfterClick
    .filter((resource) => isProductImageUrl(resource.name))
    .map((resource) => ({
      at: Math.round(resource.startTime - afterClick),
      duration: Math.round(resource.duration),
      transferKB: Math.round((resource.transferSize || 0) / 1024),
      variant: getVariant(resource.name),
      slot: getSlot(resource.name),
      detailVariant: isDetailVariant(resource.name),
      url: shortUrl(resource.name),
    }));

  return {
    mode,
    title,
    finalUrl,
    href,
    readyAfterClickMs: Math.round(ready - afterClick),
    consoleMessages,
    state: {
      ...state,
      currentSrc: shortUrl(state.currentSrc),
      thumbImages: state.thumbImages.map(shortUrl),
    },
    productImagesAfterClick,
    productImageKB: productImagesAfterClick.reduce((sum, item) => sum + item.transferKB, 0),
    longTasksAfterClick: audit.longTasks
      .filter((task) => task.start >= afterClick)
      .map((task) => Math.round(task.duration)),
    screenshot,
  };
};

const buildAssertions = (results) => {
  const checks = [];
  const add = (name, passed, detail = {}) => checks.push({ name, passed, detail });
  const mobile = results.find((result) => result.mode === 'mobile');
  const desktop = results.find((result) => result.mode === 'desktop');

  if (mobile) {
    const fullMobileDetail = mobile.productImagesAfterClick.filter((image) => image.detailVariant && image.variant === 'full');
    const activeMediumDetail = mobile.productImagesAfterClick.filter((image) => image.detailVariant && image.variant === 'medium' && image.slot === 0);
    add('mobile detail does not request full variants before zoom', fullMobileDetail.length === 0, { fullMobileDetail });
    add('mobile does not re-request the active medium detail variant', activeMediumDetail.length <= 1, { activeMediumDetail });
    add('mobile renders the mobile detail shell', mobile.state.mobileShell && !mobile.state.desktopMain, mobile.state);
    add('mobile visible detail image is loaded', mobile.state.complete && mobile.state.naturalWidth > 0, mobile.state);
    add('mobile first visible detail image is ready quickly', mobile.readyAfterClickMs > 0 && mobile.readyAfterClickMs <= 1600, { readyAfterClickMs: mobile.readyAfterClickMs });
  }

  if (desktop) {
    const fullDesktopDetail = desktop.productImagesAfterClick.filter((image) => image.detailVariant && image.variant === 'full');
    add('desktop detail does not request full variants before zoom', fullDesktopDetail.length === 0, { fullDesktopDetail });
    add('desktop keeps the blurred backdrop', desktop.state.desktopBackdrop === true, desktop.state);
    add('desktop renders only the desktop detail branch', desktop.state.desktopMain && !desktop.state.mobileShell, desktop.state);
    add('desktop first visible detail image is ready quickly', desktop.readyAfterClickMs > 0 && desktop.readyAfterClickMs <= 1800, { readyAfterClickMs: desktop.readyAfterClickMs });
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
    readyAfterClickMs: result.readyAfterClickMs,
    productImageKB: result.productImageKB,
    productImagesAfterClick: result.productImagesAfterClick.map((image) => ({
      at: image.at,
      variant: image.variant,
      slot: image.slot,
      detailVariant: image.detailVariant,
      url: image.url,
    })),
    longTasksAfterClick: result.longTasksAfterClick,
    consoleMessages: result.consoleMessages,
  })),
}, null, 2));

if (shouldAssert && !summary.assertions.passed) {
  console.error('Product detail image audit assertions failed.');
  process.exit(1);
}
