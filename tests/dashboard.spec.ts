import { test, expect, type Page } from "@playwright/test";

/**
 * Zone (dashboard) — connexion admin (Supabase Auth) puis affichage des
 * KPIs, de la matrice de contenu, des facilitateurs et de l'upload.
 * Utilise le compte de démonstration créé pour le jury du concours.
 */
async function loginAsAdmin(page: Page) {
  await page.goto("/dashboard/login");
  await page.getByLabel("Email").fill("demo@parentrelais.app");
  await page
    .getByRole("textbox", { name: "Mot de passe" })
    .fill("ParentRelais2026!");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
  // Laisser le cookie de session Supabase (server-side) se propager avant
  // une nouvelle navigation qui redéclenche la vérification d'auth côté
  // serveur — sans ce délai, une page suivante peut retomber sur /login.
  await page.waitForLoadState("networkidle");
}

test.describe("Tableau de bord admin", () => {
  test("connexion admin puis affichage des KPIs de couverture", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await expect(
      page.getByRole("heading", { name: "Couverture du programme" }),
    ).toBeVisible();

    // .first() : "Familles touchées" apparaît deux fois (StatCard + graphique
    // de couverture, qui affichent délibérément la même donnée deux fois —
    // voir le commentaire dans dashboard/page.tsx), seule la présence compte ici.
    await expect(page.getByText("Familles touchées", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Séances animées")).toBeVisible();
    await expect(
      page.getByText("Dont en situation de handicap"),
    ).toBeVisible();
  });

  test("la matrice de contenu affiche les modules et leurs langues", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/dashboard/content");
    await expect(page).toHaveURL(/\/dashboard\/content$/, { timeout: 10_000 });
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

  test("l'icône œil bascule la visibilité du mot de passe sans soumettre le formulaire", async ({
    page,
  }) => {
    await page.goto("/dashboard/login");

    const passwordInput = page.getByRole("textbox", { name: "Mot de passe" });
    await passwordInput.fill("un-mot-de-passe-secret");
    await expect(passwordInput).toHaveAttribute("type", "password");

    const toggle = page.getByRole("button", { name: "Afficher le mot de passe" });
    await toggle.click();

    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(passwordInput).toHaveValue("un-mot-de-passe-secret");
    // Toujours sur /login : cliquer l'icône ne doit jamais soumettre le formulaire.
    await expect(page).toHaveURL(/\/dashboard\/login$/);

    await page.getByRole("button", { name: "Masquer le mot de passe" }).click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("la liste des facilitateurs affiche les séances et mène au détail", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/dashboard/facilitators");
    await expect(page).toHaveURL(/\/dashboard\/facilitators$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Facilitateurs" })).toBeVisible();

    // Nécessite la séance de démo déterministe (voir
    // supabase/migrations/0012_seed_demo_session.sql) pour qu'au moins une
    // ligne existe.
    const firstRow = page.locator('a[href^="/dashboard/facilitators/"]').first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    await expect(page).toHaveURL(/\/dashboard\/facilitators\/[\w-]+$/);
    await expect(page.getByText("Historique des séances")).toBeVisible();
  });

  test("téléverser un fichier fait passer une case de « à venir » à « prêt »", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/dashboard/content");
    await page.waitForLoadState("networkidle");

    // Cible la case (module 1, langue des signes), connue "pending" grâce
    // au seed (0011_seed_ff_sign_shell_rows.sql) — aria-label unique par
    // cellule permet de cibler précisément sans dépendre de l'ordre visuel.
    const uploadButton = page.getByLabel("Téléverser un fichier — module 1, sign");
    const fileInput = uploadButton
      .locator("xpath=following-sibling::input[@type='file']")
      .first();

    await fileInput.setInputFiles({
      name: "test-sign-language.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from("fake-video-content"),
    });

    await expect(page.getByLabel("Prêt").first()).toBeVisible({ timeout: 10_000 });
  });
});
