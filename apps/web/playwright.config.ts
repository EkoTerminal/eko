import { defineConfig, devices } from '@playwright/test';

const API_PORT = Number(process.env.E2E_API_PORT ?? 8720);
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 5190);

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  testIgnore: /v1-reads\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e/.artifacts/report' }]],
  outputDir: 'e2e/.artifacts/results',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Uses the locally installed Google Chrome (no browser download). Override with PW_CHANNEL.
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL ?? 'chrome', viewport: { width: 1440, height: 900 } }, testIgnore: /mobile|fork|screenshots/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: process.env.PW_CHANNEL ?? 'chrome' }, testMatch: /mobile\.spec\.ts/ },
    { name: 'shots-desktop', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL ?? 'chrome', viewport: { width: 1487, height: 1058 }, deviceScaleFactor: 2 }, testMatch: /screenshots\.spec\.ts/ },
    { name: 'shots-mobile', use: { ...devices['Pixel 7'], channel: process.env.PW_CHANNEL ?? 'chrome', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 }, testMatch: /screenshots\.spec\.ts/ },
    { name: 'live-fork', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL ?? 'chrome', viewport: { width: 1440, height: 900 } }, testMatch: /live\.fork\.spec\.ts/ },
  ],
  webServer: [
    {
      command: `pnpm --filter @eko/server exec tsx src/index.ts`,
      cwd: '../..',
      port: API_PORT,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        PORT: String(API_PORT),
        PUBLIC_ORIGIN: `http://localhost:${WEB_PORT}`,
        MARKET_DATA_SOURCE: 'demo',
        ENABLE_DEV_ROUTES: 'true',
        PGLITE_DIR: ':memory:',
        SESSION_SECRET: 'e2e'.repeat(12),
        RH_TESTNET_RPC_URL: 'http://127.0.0.1:9',
        RH_MAINNET_RPC_URL: process.env.E2E_MAINNET_RPC ?? 'http://127.0.0.1:9',
        LIVE_TRADING_ENABLED: process.env.E2E_LIVE ?? 'false',
        LOG_LEVEL: 'warn',
      },
    },
    {
      command: `pnpm exec vite --port ${WEB_PORT} --strictPort`,
      port: WEB_PORT,
      timeout: 60_000,
      reuseExistingServer: false,
      env: { EKO_API: `http://localhost:${API_PORT}`, WEB_PORT: String(WEB_PORT) },
    },
  ],
});
