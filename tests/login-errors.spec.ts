import { test, expect } from "@playwright/test";

/**
 * Cas d'erreur au login facilitateur, jamais couverts : PIN trop court à la
 * première connexion, et PIN incorrect à la reconnexion (voir login/page.tsx,
 * la logique diffère entre "aucune session locale" et "session existante").
 */
test.describe("Erreurs de connexion facilitateur", () => {
  test("un PIN incomplet affiche une erreur sans soumettre", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Votre nom").fill("Test PIN Court");
    await page.getByLabel("Code PIN (4 chiffres)").fill("12");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(
      page.getByText("Le code PIN doit contenir 4 chiffres."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("un PIN incorrect à la reconnexion est rejeté sans changer de session", async ({
    page,
  }) => {
    // Première connexion : crée une session locale avec le PIN 1357.
    await page.goto("/login");
    await page.getByLabel("Votre nom").fill("Test Reconnexion");
    await page.getByLabel("Code PIN (4 chiffres)").fill("1357");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/");

    // Se déconnecter en revenant sur /login (session toujours en Dexie).
    await page.goto("/login");

    // Le formulaire ne doit plus demander nom/région (session déjà connue).
    await expect(page.getByLabel("Votre nom")).not.toBeVisible();

    // Mauvais PIN.
    await page.getByLabel("Code PIN (4 chiffres)").fill("0000");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByText("Code PIN incorrect.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    // Le bon PIN doit toujours fonctionner ensuite.
    await page.getByLabel("Code PIN (4 chiffres)").fill("1357");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/");
  });
});
