import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_BASE_URL = 'http://127.0.0.1:4300';
const argv = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) continue;
  const [key, inlineValue] = arg.slice(2).split('=');
  const value = inlineValue ?? process.argv[index + 1];
  argv.set(key, value === undefined || value.startsWith('--') ? true : value);
  if (inlineValue === undefined && value && !value.startsWith('--')) index += 1;
}

const baseUrl = String(argv.get('url') || process.env.NEXT_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const shouldAssert = argv.has('assert');
const outDir = path.resolve(String(argv.get('out') || 'logs/gallery-direct-audit'));

const createContext = (browser, mode) => browser.newContext({
  viewport: mode === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  isMobile: mode === 'mobile',
  hasTouch: mode === 'mobile',
  deviceScaleFactor: mode === 'mobile' ? 3 : 1,
  locale: 'fr-FR',
});

const collectDom = () => ({
  title: document.title,
  h1: document.querySelector('h1')?.textContent?.trim() || '',
  canonical: document.querySelector('link[rel="canonical"]')?.href || '',
  ogUrl: document.querySelector('meta[property="og:url"]')?.content || '',
  jsonLdCount: document.querySelectorAll('script[type="application/ld+json"]').length,
  hasSsrHome: Boolean(document.querySelector('[data-ssr-home]')),
  hasSsrGallery: Boolean(document.querySelector('[data-ssr-gallery]')),
  svClientHydrated: document.documentElement.dataset.svClientHydrated === 'true',
  forceGalleryEntry: document.documentElement.dataset.svForceGalleryEntry === 'true',
  hasGalleryLauncherOverlay: Boolean(document.querySelector('.sv-gallery-launcher-overlay')),
  hasMarketplaceGalleryShell: Boolean(document.querySelector('.marketplace-gallery-shell')),
  hasGalleryScroll: Boolean(document.querySelector('.marketplace-gallery-scroll')),
  hasNativeScrollRegion: Boolean(document.querySelector('[data-native-scroll-region]')),
  productLinks: Array.from(document.querySelectorAll('a[href^="/produit/"]')).length,
  categoryLinks: Array.from(document.querySelectorAll('a[href^="/categorie/"]')).length,
  quoteLinks: Array.from(document.querySelectorAll('a[href="/devis"], button')).filter((node) => /devis/i.test(node.textContent || '')).length,
});

const isGalleryPath = (pathSuffix) => pathSuffix === '/' || pathSuffix === '/galerie' || pathSuffix.includes('page=gallery');

const checkRedirect = async (pathSuffix) => {
  const response = await fetch(`${baseUrl}${pathSuffix}`, { redirect: 'manual' });
  return {
    pathSuffix,
    status: response.status,
    location: response.headers.get('location') || '',
  };
};

const runMode = async (browser, mode, pathSuffix) => {
  const context = await createContext(browser, mode);
  const page = await context.newPage();
  const consoleMessages = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      consoleMessages.push({ type: message.type(), text: message.text().slice(0, 260) });
    }
  });
  page.on('pageerror', (error) => consoleMessages.push({ type: 'pageerror', text: error.message.slice(0, 260) }));

  const targetUrl = `${baseUrl}${pathSuffix}`;
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  if (!response?.ok()) throw new Error(`Navigation failed for ${targetUrl}: ${response?.status()}`);
  if (isGalleryPath(pathSuffix)) {
    await page.waitForSelector('[data-ssr-gallery]', { state: 'attached', timeout: 30_000 });
    await page.waitForSelector('.marketplace-gallery-shell', { state: 'attached', timeout: 45_000 });
  }
  await page.waitForTimeout(2_500);
  const dom = await page.evaluate(collectDom);
  const screenshot = await page.screenshot({ type: 'png', fullPage: false });
  await context.close();
  return { mode, pathSuffix, finalUrl: page.url(), status: response.status(), dom, consoleMessages, screenshot };
};

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
let results;
let rootRedirect;
let legacyRedirect;
try {
  rootRedirect = await checkRedirect('/');
  legacyRedirect = await checkRedirect('/?page=gallery');
  results = [
    await runMode(browser, 'desktop', '/'),
    await runMode(browser, 'mobile', '/'),
    await runMode(browser, 'desktop', '/galerie'),
    await runMode(browser, 'mobile', '/galerie'),
  ];
} finally {
  await browser.close();
}

const checks = [];
const add = (name, passed, detail = {}) => checks.push({ name, passed, detail });
const getUrlPathname = (href) => {
  try {
    return new URL(href, baseUrl).pathname;
  } catch {
    return '';
  }
};
for (const result of results) {
  add(`${result.mode} gallery entry: gallery SSR marker is present`, result.dom.hasSsrGallery === true, result.dom);
  add(`${result.mode} gallery entry: legacy home marker is absent`, result.dom.hasSsrHome === false, result.dom);
  add(`${result.mode} gallery entry: legacy ClientApp marker is absent`, result.dom.svClientHydrated === false, result.dom);
  add(`${result.mode} gallery entry: gallery shell is present`, result.dom.hasMarketplaceGalleryShell === true && result.dom.hasGalleryScroll === true, result.dom);
  add(`${result.mode} gallery entry: product/category links are stable URLs`, result.dom.productLinks > 0 && result.dom.categoryLinks > 0, result.dom);
  add(`${result.mode} gallery entry: canonical targets /galerie`, getUrlPathname(result.dom.canonical) === '/galerie', result.dom);
  add(`${result.mode} gallery entry: structured data is present`, result.dom.jsonLdCount >= 1, result.dom);
  add(`${result.mode} gallery entry: legacy launcher overlay is absent`, result.dom.hasGalleryLauncherOverlay === false, result.dom);
  if (result.pathSuffix === '/') {
    add(`${result.mode} root entry: final URL is /galerie`, getUrlPathname(result.finalUrl) === '/galerie', result.dom);
  }
}
add('root entry: returns a permanent redirect', rootRedirect.status === 308, rootRedirect);
add('root entry: redirect target is /galerie', getUrlPathname(rootRedirect.location) === '/galerie', rootRedirect);
add('legacy gallery query: returns a permanent redirect', legacyRedirect.status === 308, legacyRedirect);
add('legacy gallery query: redirect target is /galerie', getUrlPathname(legacyRedirect.location) === '/galerie', legacyRedirect);

const summary = {
  baseUrl,
  generatedAt: new Date().toISOString(),
  rootRedirect,
  legacyRedirect,
  results: results.map(({ screenshot, ...result }) => result),
  assertions: { passed: checks.every((check) => check.passed), checks },
};
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const summaryPath = path.join(outDir, `${runId}-summary.json`);
await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
await Promise.all(results.map((result) => fs.writeFile(
  path.join(outDir, `${runId}-${result.mode}-${result.pathSuffix === '/' ? 'root-gallery' : 'gallery'}.png`),
  result.screenshot
)));

console.log(JSON.stringify({ summaryPath, ...summary }, null, 2));
if (shouldAssert && !summary.assertions.passed) {
  console.error('Direct gallery audit assertions failed.');
  process.exit(1);
}
