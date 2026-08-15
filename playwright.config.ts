import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Tests d'intégration : parcours utilisateur bout-en-bout dans un vrai
 * navigateur. `webServer` démarre le serveur de prod automatiquement (le
 * service worker Serwist n'est actif qu'en prod, voir CLAUDE.md/next.config.ts).
 * headless: false en local pour voir le navigateur s'ouvrir ; CI reste headless.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: !!process.env.CI,
      },
    },
  ],
  webServer: {
    command: `pnpm exec next build --webpack && pnpm exec next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
