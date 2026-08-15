import { test, expect } from "@playwright/test";

/**
 * Zone (dashboard) jamais couverte par les tests existants — connexion
 * admin (Supabase Auth) puis affichage des KPIs et de la matrice de contenu.
 * Utilise le compte de démonstration créé pour le jury du concours.
 */
test.describe("Tableau de bord admin", () => {
  test("connexion admin puis affichage des KPIs de couverture", async ({
    page,
  }) => {
    await page.goto("/dashboard/login");

    await page.getByLabel("Email").fill("demo@parentrelais.app");
    await page
      .getByRole("textbox", { name: "Mot de passe" })
      .fill("ParentRelais2026!");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Couverture du programme" }),
    ).toBeVisible();

    await expect(page.getByText("Familles touchées", { exact: true })).toBeVisible();
    await expect(page.getByText("Séances animées")).toBeVisible();
    await expect(
      page.getByText("Dont en situation de handicap"),
    ).toBeVisible();
  });

  test("la matrice de contenu affiche les modules et leurs langues", async ({
    page,
  }) => {
    await page.goto("/dashboard/login");
    await page.getByLabel("Email").fill("demo@parentrelais.app");
    await page
      .getByRole("textbox", { name: "Mot de passe" })
      .fill("ParentRelais2026!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });

    await page.goto("/dashboard/content");
    await expect(
      page.getByRole("heading", { name: /Contenus.*langues/ }),
    ).toBeVisible();
    await expect(page.getByText("Module").first()).toBeVisible();
  });

  test("un utilisateur non authentifié est redirigé vers la page de connexion", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard\/login$/, { timeout: 10_000 });
  });
});
