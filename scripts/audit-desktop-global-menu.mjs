import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_BASE_URL = 'http://127.0.0.1:3001';
const VIEWPORT = { width: 1920, height: 1032 };

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
const pathSuffix = String(argv.get('path') || '/galerie');
const settleMs = Number(argv.get('settle') || 650);
const shouldAssert = argv.has('assert');
const outDir = path.resolve(String(argv.get('out') || 'logs/menu-desktop-audit'));
const runId = new Date().toISOString().replace(/[:.]/g, '-');

const classifyUrl = (url, resourceType = '') => {
  const lower = url.toLowerCase();
  if (lower.includes('identitytoolkit.googleapis.com') || lower.includes('firebase/auth')) return 'auth';
  if (lower.includes('firestore.googleapis.com') || lower.includes('google.firestore') || lower.includes('firebase/firestore')) return 'firestore';
  if (lower.includes('firebasestorage.googleapis.com') || lower.includes('storage.googleapis.com')) return 'image';
  if (lower.includes('appcheck') || lower.includes('recaptcha')) return 'appcheck';
  if (lower.includes('firebase') || lower.includes('appcheck') || lower.includes('recaptcha')) return 'firebase';
  if (lower.includes('/_next/static/') && lower.endsWith('.js')) return 'next-script';
  if (/\.(webp|png|jpe?g|avif|gif|svg)(\?|$)/i.test(lower) || resourceType === 'image') return 'image';
  return resourceType || 'other';
};

const shortUrl = (url) => {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.length > 80
      ? `${parsed.pathname.slice(0, 46)}...${parsed.pathname.slice(-24)}`
      : parsed.pathname;
    return `${parsed.hostname}${pathname}`;
  } catch {
    return url.slice(0, 120);
  }
};

const setupInstrumentation = async (page) => {
  await page.addInitScript(() => {
    window.__svMenuAudit = {
      segment: 'navigation',
      longTasks: [],
    };
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__svMenuAudit.longTasks.push({
            start: Math.round(entry.startTime),
            duration: Math.round(entry.duration),
            segment: window.__svMenuAudit.segment,
          });
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      window.__svMenuAudit.longTaskObserverUnavailable = true;
    }
  });
};

const collectMenuSnapshot = async (page, name) => page.evaluate((snapshotName) => {
  const shell = document.querySelector('[aria-label="Menu principal"]');
  const desktopContent = document.querySelector('.global-menu-desktop-content');
  const panel = document.querySelector('.global-menu-scrollbarless');
  const containers = Array.from(document.querySelectorAll('.global-menu-reveal-container')).map((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      opacity: Number(style.opacity),
      visible: rect.width > 0 && rect.height > 0 && Number(style.opacity) > 0.05,
    };
  });

  return {
    name: snapshotName,
    time: Math.round(performance.now()),
    url: window.location.href,
    shellRole: shell?.getAttribute('role') || '',
    shellAriaHidden: shell?.getAttribute('aria-hidden') || '',
    desktopMotionReady: desktopContent?.dataset.motionReady || '',
    desktopMotionState: desktopContent?.dataset.motionState || '',
    panelRect: panel ? (() => {
      const rect = panel.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        height: Math.round(rect.height),
        opacity: Number(getComputedStyle(panel).opacity),
      };
    })() : null,
    containerCount: containers.length,
    visibleContainerCount: containers.filter((item) => item.visible).length,
    containers,
    authUserKnown: Boolean(window.__svAuthUser),
    authAdminKnown: window.__svAuthIsAdmin === true,
  };
}, name);

const waitForVisibleContainers = async (page, expectedCount, timeout) => {
  await page.waitForFunction(
    (count) => {
      const nodes = Array.from(document.querySelectorAll('.global-menu-reveal-container'));
      return nodes.filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && Number(getComputedStyle(node).opacity) > 0.05;
      }).length >= count;
    },
    expectedCount,
    { timeout }
  );
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
  locale: 'fr-FR',
});
const page = await context.newPage();
await setupInstrumentation(page);

const requests = [];
page.on('requestfinished', async (request) => {
  requests.push({
    url: request.url(),
    shortUrl: shortUrl(request.url()),
    method: request.method(),
    resourceType: request.resourceType(),
    kind: classifyUrl(request.url(), request.resourceType()),
  });
});
page.on('requestfailed', (request) => {
  requests.push({
    url: request.url(),
    shortUrl: shortUrl(request.url()),
    method: request.method(),
    resourceType: request.resourceType(),
    kind: classifyUrl(request.url(), request.resourceType()),
    failed: true,
  });
});

let summary;
try {
  const targetUrl = `${baseUrl}${pathSuffix}`;
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  if (!response?.ok()) throw new Error(`Navigation failed for ${targetUrl}: ${response?.status()}`);
  await page.waitForSelector('button[aria-label="Ouvrir le menu"]', { timeout: 30_000 });
  await page.waitForTimeout(settleMs);

  const before = await collectMenuSnapshot(page, 'before-open');
  await page.evaluate(() => {
    window.__svMenuAudit.segment = 'menu-open';
    window.__svMenuAudit.openClickAt = performance.now();
  });
  const clickStart = Date.now();
  await page.locator('button[aria-label="Ouvrir le menu"]').click();
  await page.waitForSelector('[aria-label="Menu principal"][role="dialog"]', { timeout: 8_000 });
  const shellVisibleMs = Date.now() - clickStart;
  await waitForVisibleContainers(page, 1, 8_000);
  const firstContainerMs = Date.now() - clickStart;
  await waitForVisibleContainers(page, 5, 8_000).catch(() => null);
  const allContainersMs = Date.now() - clickStart;
  await page.waitForTimeout(350);
  const afterOpen = await collectMenuSnapshot(page, 'after-open');
  await fs.mkdir(outDir, { recursive: true });
  const screenshotPath = path.join(outDir, `${runId}-open.png`);
  await page.screenshot({ path: screenshotPath, type: 'png', fullPage: false });

  await page.locator('button[aria-label="Fermer le menu"]').first().click();
  await page.waitForTimeout(1_250);
  const afterClose = await collectMenuSnapshot(page, 'after-close');

  const audit = await page.evaluate(() => window.__svMenuAudit);
  const menuRequests = requests.filter((request) => request.kind !== 'image' || /menu|gallery-hero|before-after/.test(request.url));
  const firebaseRequests = requests.filter((request) => ['auth', 'firestore', 'appcheck', 'firebase'].includes(request.kind));
  const menuOpenLongTasks = audit.longTasks.filter((task) => task.segment === 'menu-open');

  const checks = [
    {
      name: 'menu shell visible after click',
      passed: shellVisibleMs < 900,
      detail: { shellVisibleMs },
    },
    {
      name: 'first desktop container visible quickly',
      passed: firstContainerMs < 1250,
      detail: { firstContainerMs },
    },
    {
      name: 'desktop menu containers rendered',
      passed: afterOpen.visibleContainerCount >= 5,
      detail: { visibleContainerCount: afterOpen.visibleContainerCount },
    },
    {
      name: 'public cold menu open does not request Firebase auth/firestore/appcheck',
      passed: firebaseRequests.length === 0,
      detail: { firebaseRequests: firebaseRequests.map(({ kind, shortUrl: url }) => ({ kind, url })) },
    },
    {
      name: 'menu closes after close button',
      passed: afterClose.shellRole !== 'dialog' || afterClose.shellAriaHidden === 'true',
      detail: afterClose,
    },
  ];

  summary = {
    baseUrl,
    pathSuffix,
    settleMs,
    generatedAt: new Date().toISOString(),
    timings: { shellVisibleMs, firstContainerMs, allContainersMs },
    snapshots: { before, afterOpen, afterClose },
    longTasks: {
      count: menuOpenLongTasks.length,
      totalMs: menuOpenLongTasks.reduce((total, task) => total + task.duration, 0),
      maxMs: Math.max(0, ...menuOpenLongTasks.map((task) => task.duration)),
      items: menuOpenLongTasks,
    },
    requests: {
      firebase: firebaseRequests.map(({ kind, shortUrl: url, failed }) => ({ kind, url, failed: Boolean(failed) })),
      menuRelated: menuRequests.map(({ kind, shortUrl: url, failed }) => ({ kind, url, failed: Boolean(failed) })).slice(0, 80),
    },
    screenshotPath,
    assertions: { passed: checks.every((check) => check.passed), checks },
  };
} finally {
  await context.close();
  await browser.close();
}

await fs.mkdir(outDir, { recursive: true });
const summaryPath = path.join(outDir, `${runId}-summary.json`);
await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ summaryPath, ...summary }, null, 2));

if (shouldAssert && !summary.assertions.passed) {
  console.error('Desktop global menu audit assertions failed.');
  process.exit(1);
}
