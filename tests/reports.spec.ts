import { test, expect } from "@playwright/test";

/**
 * /dashboard/reports — export CSV généré côté client (Blob + lien), sans
 * route API dédiée (CLAUDE.md règle 5). On vérifie que le clic déclenche
 * réellement un téléchargement, pas seulement que le bouton existe.
 */
test.describe("Rapports (export CSV)", () => {
  test("le bouton d'export déclenche le téléchargement d'un CSV", async ({
    page,
  }) => {
    await page.goto("/dashboard/login");
    await page.getByLabel("Email").fill("demo@parentrelais.app");
    await page
      .getByRole("textbox", { name: "Mot de passe" })
      .fill("ParentRelais2026!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    await page.goto("/dashboard/reports");
    await expect(page).toHaveURL(/\/dashboard\/reports$/, { timeout: 10_000 });

    const exportButton = page.getByRole("button", { name: /Exporter en CSV/ });
    await expect(exportButton).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      exportButton.click(),
    ]);

    expect(download.suggestedFilename()).toMatch(
      /^parentrelais-sessions-\d{4}-\d{2}-\d{2}\.csv$/,
    );

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const content = Buffer.concat(chunks).toString("utf-8");
    expect(content.split("\n")[0]).toBe(
      "client_uuid,facilitator_id,region,locality,parents_total,women,disability_count,quiz_score,quiz_max,held_at,synced_at",
    );
  });
});
