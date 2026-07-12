import fs from 'node:fs';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const arg = (name, fallback) => {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) || fallback;
};
const baseUrl = arg('url', 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app').replace(/\/$/, '');
const iterations = Math.max(1, Number(arg('iterations', '30')) || 30);
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.resolve(arg('out', `logs/auth-phase0-ui-baseline-${runId}.json`));
const percentile = (values, ratio) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)];
};
const summarize = (values) => values.length ? {
  samples: values.length,
  minMs: Math.min(...values),
  p50Ms: percentile(values, 0.5),
  p95Ms: percentile(values, 0.95),
  maxMs: Math.max(...values),
  meanMs: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
} : { samples: 0 };

const samples = [];
const browser = await chromium.launch({ headless: true });
try {
  for (let index = 0; index < iterations; index += 1) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'fr-FR' });
    const page = await context.newPage();
    const sample = { iteration: index + 1, status: 'started' };
    try {
      const navigationStarted = Date.now();
      await page.goto(`${baseUrl}/?auth_phase0=${index + 1}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      sample.homeDomContentLoadedMs = Date.now() - navigationStarted;
      const trigger = page.getByRole('button', { name: /Ouvrir la connexion/i }).first();
      await expect(trigger).toBeVisible({ timeout: 30_000 });
      const coldStarted = Date.now();
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: /Connexion Seconde Vie/i });
      await expect(dialog).toBeVisible({ timeout: 30_000 });
      sample.coldModalMs = Date.now() - coldStarted;

      await dialog.getByRole('button', { name: /Fermer la connexion/i }).click();
      await expect(dialog).toBeHidden({ timeout: 10_000 });
      const warmStarted = Date.now();
      await trigger.click();
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      sample.warmModalMs = Date.now() - warmStarted;
      sample.status = 'passed';
    } catch (error) {
      sample.status = 'failed';
      sample.error = String(error?.message || error).split('\n')[0].slice(0, 240);
    } finally {
      samples.push(sample);
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const passed = samples.filter((sample) => sample.status === 'passed');
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  iterations,
  node: process.version,
  scope: 'Lecture UI uniquement: aucun formulaire rempli, aucun OTP envoye, aucune mutation Firebase.',
  results: {
    passed: passed.length,
    failed: samples.length - passed.length,
    homeDomContentLoaded: summarize(passed.map((sample) => sample.homeDomContentLoadedMs)),
    coldModal: summarize(passed.map((sample) => sample.coldModalMs)),
    warmModal: summarize(passed.map((sample) => sample.warmModalMs)),
  },
  samples,
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outputPath, ...report.results }, null, 2));
if (process.argv.includes('--assert') && passed.length !== iterations) process.exitCode = 1;
