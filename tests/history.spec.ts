import { test, expect } from "@playwright/test";
import { skipFacilitatorOnboarding } from "./helpers";

/**
 * /history lit uniquement Dexie.outbox (jamais Supabase) — doit rester
 * accessible hors-ligne comme le reste de la zone facilitateur, et refléter
 * une séance tout juste animée sans avoir besoin de sync.
 */
test.describe("Historique des séances (facilitateur)", () => {
  test("une séance animée apparaît dans l'historique, y compris hors-ligne", async ({
    page,
    context,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Votre nom").fill("Facilitateur Historique");
    await page.getByLabel("Code PIN (4 chiffres)").fill("4321");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/home");

    await page
      .waitForFunction(
        () => navigator.serviceWorker?.controller != null,
        { timeout: 15_000 },
      )
      .catch(() => {});
    await page.reload();
    await page.waitForLoadState("networkidle");
    await skipFacilitatorOnboarding(page);
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Avant toute séance : l'écran affiche l'état vide.
    await page.getByRole("button", { name: /Mes séances/ }).click();
    await expect(page).toHaveURL(/\/history$/);
    await expect(page.getByText(/Aucune séance animée/)).toBeVisible();

    await page.getByRole("button", { name: "Retour" }).click();
    await expect(page).toHaveURL("/home");

    // Couper le réseau puis animer une séance complète hors-ligne.
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await page.reload();
    await expect(page.getByText("La perception de l'enfance")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByText("La perception de l'enfance").click();
    await expect(page).toHaveURL(/\/modules\/1$/);
    await page.getByRole("button", { name: "Animer une séance" }).click();
    await expect(page).toHaveURL(/\/modules\/1\/session$/);

    await page.getByRole("button", { name: "Continuer" }).click();
    await page
      .getByRole("button", { name: "Comprendre et expliquer calmement" })
      .click();
    await page
      .getByRole("button", { name: "Décisifs pour son cerveau" })
      .click();
    await page.getByRole("button", { name: "Terminer la séance" }).click();
    await expect(page.getByText("Séance enregistrée")).toBeVisible();

    await page.getByRole("button", { name: "Revenir à l'accueil" }).click();
    await expect(page).toHaveURL("/home");

    // /history doit refléter la séance tout juste écrite, toujours hors-ligne.
    await page.getByRole("button", { name: /Mes séances/ }).click();
    await expect(page).toHaveURL(/\/history$/);
    await expect(page.getByText("En attente").first()).toBeVisible();
    await expect(
      page.getByText(/quiz \d\/\d/).first(),
    ).toBeVisible();

    await context.setOffline(false);
  });
});
