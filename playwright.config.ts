import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  fullyParallel: true,
  use: { viewport: { width: 390, height: 844 }, screenshot: 'only-on-failure', trace: 'retain-on-failure', baseURL: 'http://127.0.0.1:4173' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: { executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium', args: ['--no-sandbox'] } } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: { command: 'python3 -m http.server 4173 --directory dist-web', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
