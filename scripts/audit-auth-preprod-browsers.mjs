import fs from 'node:fs';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const baseUrl = (process.argv.find((value) => value.startsWith('--url='))?.slice(6)
  || 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app').replace(/\/$/, '');
const outputPath = path.resolve(process.argv.find((value) => value.startsWith('--out='))?.slice(6)
  || 'logs/auth-h8-preprod-browser-smoke.json');

const targets = [
  { name: 'Chrome', executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
  { name: 'Edge', executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
  { name: 'Brave', executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe' }
];

const results = [];
for (const target of targets) {
  const result = {
    browser: target.name,
    executablePath: target.executablePath,
    status: 'started',
    pageErrors: [],
    consoleWarnings: [],
    httpErrors: []
  };
  let browser;
  try {
    if (!fs.existsSync(target.executablePath)) throw new Error(`Navigateur absent: ${target.executablePath}`);
    browser = await chromium.launch({ executablePath: target.executablePath, headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'fr-FR' });
    const page = await context.newPage();
    page.on('pageerror', (error) => result.pageErrors.push(String(error?.message || error).slice(0, 240)));
    page.on('console', (message) => {
      if (message.type() === 'error') result.consoleWarnings.push(message.text().slice(0, 240));
    });
    page.on('response', (response) => {
      if (response.status() < 400) return;
      const url = new URL(response.url());
      result.httpErrors.push(`${response.status()} ${url.origin}${url.pathname}`);
    });

    result.stage = 'home';
    await page.goto(`${baseUrl}/?e2e_run=auth-h8-${target.name.toLowerCase()}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000
    });
    result.stage = 'auth-trigger';
    const trigger = page.getByRole('button', { name: /Ouvrir la connexion/i }).first();
    await expect(trigger).toBeVisible({ timeout: 30_000 });
    const modalStartedAt = Date.now();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: /Connexion Seconde Vie/i });
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    result.modalVisibleMs = Date.now() - modalStartedAt;
    result.stage = 'auth-google';
    await expect(dialog.getByRole('button', { name: /Continuer avec Google/i })).toBeVisible();
    result.stage = 'auth-fallback';
    await expect(dialog.getByRole('button', { name: /Recevoir (mon code|un code par email)/i })).toBeVisible();
    result.stage = 'auth-email';
    const emailInput = dialog.locator('input[type="email"]');
    await expect(emailInput).toHaveCount(1);
    await expect(emailInput).toBeVisible();

    result.stage = 'devis';
    await page.goto(`${baseUrl}/devis?e2e_run=auth-h8-${target.name.toLowerCase()}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000
    });
    await expect(page.getByRole('heading', { name: /Demandez un devis de restauration/i })).toBeVisible({ timeout: 30_000 });
    await context.close();

    result.stage = 'complete';
    result.status = result.pageErrors.length ? 'failed' : 'passed';
  } catch (error) {
    result.status = 'failed';
    result.failure = String(error?.message || error).split('\n')[0].slice(0, 300);
  } finally {
    if (browser) await browser.close();
    results.push(result);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  baseUrl,
  scope: 'Smoke lecture seule: aucun formulaire soumis, aucun OTP envoye, aucune mutation Firebase.',
  results
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (results.some((result) => result.status !== 'passed')) process.exitCode = 1;
