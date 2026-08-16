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
    await expect(page).toHaveURL("/");

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
    await expect(page).toHaveURL(/\/modules\/1$/);
    await expect(
      page.getByRole("heading", { name: "La perception de l'enfance" }),
    ).toBeVisible();

    await context.setOffline(false);
  });
});
