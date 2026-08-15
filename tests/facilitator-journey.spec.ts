import { test, expect } from "@playwright/test";

/**
 * Parcours facilitateur complet — reflète la Definition of Done de CLAUDE.md :
 * connexion, consultation d'un module, animation d'une séance stockée en
 * local, puis synchronisation.
 */
test.describe("Parcours facilitateur", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("connexion, consultation d'un module et animation d'une séance", async ({
    page,
  }) => {
    // 1. Connexion (première fois : nom + région + PIN)
    await page.getByLabel("Votre nom").fill("Aïcha Test");
    await page.getByLabel("Code PIN (4 chiffres)").fill("1234");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "Bonjour, Aïcha Test" }),
    ).toBeVisible();

    // 2. Les modules de démo sont visibles
    await expect(page.getByText("La perception de l'enfance")).toBeVisible();
    await expect(page.getByText("Développement de l'enfant")).toBeVisible();

    // 3. Ouvrir le premier module
    await page.getByText("La perception de l'enfance").click();
    await expect(page).toHaveURL(/\/modules\/1$/);
    await expect(
      page.getByRole("heading", { name: "La perception de l'enfance" }),
    ).toBeVisible();

    // 4. Animer une séance
    await page.getByRole("button", { name: "Animer une séance" }).click();
    await expect(page).toHaveURL(/\/modules\/1\/session$/);

    // Étape présences : village + steppers (valeurs par défaut acceptées)
    await page.getByRole("button", { name: "Continuer" }).click();

    // Étape quiz : sélection par texte des bonnes réponses du quiz de démo
    await page
      .getByRole("button", { name: "Comprendre et expliquer calmement" })
      .click();
    await page
      .getByRole("button", { name: "Décisifs pour son cerveau" })
      .click();

    await page.getByRole("button", { name: "Terminer la séance" }).click();

    // Étape récap
    await expect(page.getByText("Séance enregistrée")).toBeVisible();
    await expect(
      page.getByText("Enregistré sur l'appareil"),
    ).toBeVisible();

    // 5. Retour accueil — la séance doit apparaître comme à synchroniser
    await page.getByRole("button", { name: "Revenir à l'accueil" }).click();
    await expect(page).toHaveURL("/");
  });
});
