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
  // La vidéo de démonstration n'est pas un test : elle dure des minutes et
  // ne vérifie rien. Elle est donc exclue de la suite, sauf quand on la
  // lance explicitement (`pnpm demo:video`, qui pose DEMO_VIDEO=1).
  // Détecté depuis la ligne de commande plutôt qu'une variable
  // d'environnement : évite d'ajouter cross-env pour un seul usage, et
  // fonctionne à l'identique sous Windows et sous Unix.
  testIgnore: process.argv.some((a) => a.includes("demo-video"))
    ? []
    : ["**/demo-video.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    // Désactive le guide interactif (driver.js) pour la suite existante : son
    // overlay bloque les clics tant qu'on n'interagit pas avec lui, ce que la
    // plupart des tests ne testent pas. Un test dédié à l'onboarding peut
    // toujours l'exercer explicitement en vidant ce flag au préalable.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE_URL,
          localStorage: [
            { name: "parentrelais_dashboard_onboarding_seen", value: "true" },
          ],
        },
      ],
    },
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
