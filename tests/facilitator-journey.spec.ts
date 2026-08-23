import { test, expect } from "@playwright/test";
import { skipFacilitatorOnboarding, loginAsDemoFacilitator } from "./helpers";

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
    // 1. Connexion (première fois : compte réel + PIN local)
    await loginAsDemoFacilitator(page, "1234");
    await skipFacilitatorOnboarding(page);
    await page.reload();
    await expect(
      // Le nom vient désormais du COMPTE (user_metadata), plus d'une saisie
      // libre : c'est ce qui rend l'identité vérifiable côté serveur.
      page.getByRole("heading", { name: "Bonjour, Facilitateur Démo" }),
    ).toBeVisible();

    // 2. Les modules de démo sont visibles
    await expect(page.getByText("La perception de l'enfance")).toBeVisible();
    await expect(page.getByText("Développement de l'enfant")).toBeVisible();

    // 3. Ouvrir le premier module
    await page.getByText("La perception de l'enfance").click();
    await expect(page).toHaveURL(/\/module\?id=1$/);
    await expect(
      page.getByRole("heading", { name: "La perception de l'enfance" }),
    ).toBeVisible();

    // 4. Animer une séance
    await page.getByRole("button", { name: "Animer une séance" }).click();
    await expect(page).toHaveURL(/\/module\/session\?id=1$/);

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
    await expect(page).toHaveURL("/home");
  });
});
