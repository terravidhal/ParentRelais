import { test, expect } from "@playwright/test";
import { skipFacilitatorOnboarding, loginAsDemoFacilitator } from "./helpers";

/**
 * Flow 7 (FLOW.md) — changement de langue via LangPills, jamais couvert :
 * FR/EN actifs, Fulfulde désactivé sans effet au clic.
 */
test.describe("Changement de langue", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoFacilitator(page, "4321");
    await skipFacilitatorOnboarding(page);
    await page.reload();
  });

  test("passer de FR à EN change le contenu affiché sur l'accueil", async ({
    page,
  }) => {
    await expect(page.getByText("La perception de l'enfance")).toBeVisible();

    await page.getByRole("button", { name: "EN", exact: true }).click();

    await expect(page.getByText("How we see childhood")).toBeVisible();
    await expect(
      page.getByText("La perception de l'enfance"),
    ).not.toBeVisible();
  });

  test("une langue sans traduction est grisée sur le module concerné", async ({
    page,
  }) => {
    // La disponibilité dépend du MODULE, plus d'une liste figée : le
    // Fulfulde du module 1 est vide (grisé), celui du module 2 est prêt
    // (actif). L'ancienne version le grisait partout, cachant un contenu
    // réellement présent en base.
    await page.goto("/module?id=1");
    const fulfuldeM1 = page.getByRole("button", { name: /Fulfulde/ });
    await expect(fulfuldeM1).toBeDisabled();

    // Le contenu FR reste affiché même après une tentative de clic.
    await fulfuldeM1.click({ force: true }).catch(() => {});
    await expect(page.getByText("La perception de l'enfance")).toBeVisible();

    await page.goto("/module?id=2");
    await expect(page.getByRole("button", { name: /Fulfulde/ })).toBeEnabled();
  });

  test("le changement de langue se reflète aussi sur la page module", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page.getByText("How we see childhood").click();

    await expect(page).toHaveURL(/\/module\?id=1$/);
    await expect(
      page.getByRole("heading", { name: "How we see childhood" }),
    ).toBeVisible();
  });
});
