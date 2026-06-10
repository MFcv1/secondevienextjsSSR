import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_BASE_URL = 'http://127.0.0.1:4300';
const DEFAULT_CATEGORY_PATH = '/categorie/buffets';

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
const categoryPath = String(argv.get('path') || process.env.CATEGORY_PATH || DEFAULT_CATEGORY_PATH);
const shouldAssert = argv.has('assert');
const outDir = path.resolve(String(argv.get('out') || 'logs/category-direct-audit'));
const targetUrl = `${baseUrl}${categoryPath.startsWith('/') ? categoryPath : `/${categoryPath}`}`;

const createContext = (browser, mode) => browser.newContext({
  viewport: mode === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  isMobile: mode === 'mobile',
  hasTouch: mode === 'mobile',
  deviceScaleFactor: mode === 'mobile' ? 3 : 1,
  locale: 'fr-FR',
});

const runMode = async (browser, mode) => {
  const context = await createContext(browser, mode);
  const page = await context.newPage();
  const consoleMessages = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      consoleMessages.push({ type: message.type(), text: message.text().slice(0, 260) });
    }
  });
  page.on('pageerror', (error) => consoleMessages.push({ type: 'pageerror', text: error.message.slice(0, 260) }));

  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  if (!response?.ok()) throw new Error(`Navigation failed for ${targetUrl}: ${response?.status()}`);
  await page.waitForSelector('[data-ssr-category]', { state: 'attached', timeout: 30_000 });
  await page.waitForTimeout(2_200);

  const dom = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim() || '',
    canonical: document.querySelector('link[rel="canonical"]')?.href || '',
    hasSsrCategory: Boolean(document.querySelector('[data-ssr-category]')),
    svClientHydrated: document.documentElement.dataset.svClientHydrated === 'true',
    hasMarketplaceGalleryShell: Boolean(document.querySelector('.marketplace-gallery-shell')),
    hasGalleryScroll: Boolean(document.querySelector('.marketplace-gallery-scroll')),
    productLinks: Array.from(document.querySelectorAll('a[href^="/produit/"]')).length,
    categoryLinks: Array.from(document.querySelectorAll('a[href^="/categorie/"]')).length,
    jsonLdCount: document.querySelectorAll('script[type="application/ld+json"]').length,
  }));

  const screenshot = await page.screenshot({ type: 'png', fullPage: false });
  await context.close();
  return { mode, finalUrl: page.url(), status: response.status(), dom, consoleMessages, screenshot };
};

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
let results;
try {
  results = [await runMode(browser, 'desktop'), await runMode(browser, 'mobile')];
} finally {
  await browser.close();
}

const checks = [];
const add = (name, passed, detail = {}) => checks.push({ name, passed, detail });
for (const result of results) {
  add(`${result.mode}: SSR category marker is present`, result.dom.hasSsrCategory === true, result.dom);
  add(`${result.mode}: legacy ClientApp hydration marker is absent`, result.dom.svClientHydrated === false, result.dom);
  add(`${result.mode}: gallery shell is absent`, result.dom.hasMarketplaceGalleryShell === false && result.dom.hasGalleryScroll === false, result.dom);
  add(`${result.mode}: category H1 is present`, result.dom.h1.length > 0, result.dom);
  add(`${result.mode}: product links are stable Next URLs`, result.dom.productLinks > 0, result.dom);
  add(`${result.mode}: structured data is present`, result.dom.jsonLdCount >= 2, result.dom);
}

const summary = {
  targetUrl,
  generatedAt: new Date().toISOString(),
  results: results.map(({ screenshot, ...result }) => result),
  assertions: { passed: checks.every((check) => check.passed), checks },
};
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const summaryPath = path.join(outDir, `${runId}-summary.json`);
await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
await Promise.all(results.map((result) => fs.writeFile(path.join(outDir, `${runId}-${result.mode}.png`), result.screenshot)));

console.log(JSON.stringify({ summaryPath, ...summary }, null, 2));
if (shouldAssert && !summary.assertions.passed) {
  console.error('Direct category audit assertions failed.');
  process.exit(1);
}
