import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'product-detail-touch.spec.mjs',
  timeout: 60_000,
  use: {
    baseURL: process.env.NEXT_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'android-chromium', use: { ...devices['Pixel 5'] } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } },
  ],
});
