import { test, expect } from "@playwright/test";
import { skipFacilitatorOnboarding } from "./helpers";

/**
 * Test critique de la Definition of Done (CLAUDE.md) : l'app facilitateur
 * doit rester utilisable réseau coupé, précachée par le service worker.
 */
test.describe("Mode hors-ligne", () => {
  test("l'app reste utilisable après coupure réseau et rechargement", async ({
    page,
    context,
  }) => {
    // 1. Premier chargement en ligne : le service worker précache l'app.
    await page.goto("/login");
    await page.getByLabel("Votre nom").fill("Facilitateur Offline");
    await page.getByLabel("Code PIN (4 chiffres)").fill("5678");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/home");

    // Laisser le service worker terminer son installation/activation.
    await page
      .waitForFunction(
        () => navigator.serviceWorker?.controller != null,
        { timeout: 15_000 },
      )
      .catch(() => {
        // Si le SW n'est pas encore contrôlant, un reload suffit à l'activer.
      });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await skipFacilitatorOnboarding(page);

    // 2. Couper le réseau. context.setOffline() bloque les requêtes réseau
    // (niveau CDP) mais ne garantit pas que navigator.onLine bascule à false
    // dans tous les navigateurs — on force l'event pour piloter le hook
    // useOnlineStatus comme le ferait un vrai navigateur hors-ligne.
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));

    // 3. Recharger : la page doit continuer à s'afficher (précache Serwist)
    // — c'est le test critique. La bannière "Hors-ligne" dépend de
    // navigator.onLine, dont la fiabilité varie selon le navigateur/OS
    // (CLAUDE.md le note explicitement) ; le contenu précaché est la
    // garantie forte à vérifier ici.
    await page.reload();
    await expect(page.getByText("Modules de formation")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("La perception de l'enfance")).toBeVisible();

    // 4. Naviguer vers un module toujours hors-ligne.
    await page.getByText("La perception de l'enfance").click();
    await expect(page).toHaveURL(/\/module\?id=1$/);
    await expect(
      page.getByRole("heading", { name: "La perception de l'enfance" }),
    ).toBeVisible();

    await context.setOffline(false);
  });

  /**
   * Couvre TOUTES les routes de la zone facilitateur, pas seulement le
   * parcours principal : /downloads avait été créée sans être ajoutée au
   * précache (next.config.ts, facilitatorPageUrls) et échouait en
   * net::ERR_FAILED hors-ligne sans qu'aucun test ne le détecte.
   * Toute nouvelle route facilitateur doit être ajoutée ici ET au précache.
   */
  test("toutes les routes facilitateur répondent hors-ligne", async ({
    page,
    context,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Votre nom").fill("Offline Routes");
    await page.getByLabel("Code PIN (4 chiffres)").fill("4321");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/home");

    await page
      .waitForFunction(() => navigator.serviceWorker?.controller != null, {
        timeout: 15_000,
      })
      .catch(() => {});
    await page.reload();
    await page.waitForLoadState("networkidle");
    await skipFacilitatorOnboarding(page);

    await context.setOffline(true);

    const routes = [
      "/home",
      "/login",
      "/history",
      "/profile",
      "/downloads",
      "/module?id=1",
      "/module/session?id=1",
    ];

    // On vérifie que la page rend réellement du contenu applicatif, plutôt
    // que le code HTTP : une navigation servie par le service worker vers
    // l'URL courante peut ne renvoyer aucun objet Response à Playwright,
    // alors que la page s'affiche parfaitement. Le vrai critère offline est
    // "l'écran s'affiche", pas "le réseau a répondu 200".
    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 15_000 });
      await expect(page.locator("body"), `${route} doit s'afficher hors-ligne`)
        .not.toBeEmpty();
      const errorScreen = await page
        .getByText(/ERR_|Cette page ne fonctionne pas|No internet/i)
        .count();
      expect(errorScreen, `${route} affiche une erreur navigateur`).toBe(0);
    }

    await context.setOffline(false);
  });
});
