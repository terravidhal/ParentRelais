import { test, expect, type Page } from "@playwright/test";

async function loginAdmin(page: Page) {
  await page.goto("/dashboard/login");
  await page.getByLabel("Email").fill("demo@parentrelais.app");
  await page.getByRole("textbox", { name: "Mot de passe" }).fill("ParentRelais2026!");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 45000 });
  await page.evaluate(() =>
    window.localStorage.setItem("parentrelais_dashboard_onboarding_seen", "true"),
  );
}

test.use({ viewport: { width: 1440, height: 900 } });

/**
 * Non-régression sur les politiques RLS du bucket Storage.
 *
 * L'upload utilise `upsert: true` : sur un fichier DÉJÀ présent, Supabase
 * effectue un UPDATE, pas un INSERT. Tant que seule une politique INSERT
 * existait, tout remplacement échouait en 403 « new row violates row-level
 * security policy » — bug rencontré en production, corrigé par la migration
 * 0013_storage_update_delete_policies.sql.
 *
 * Le test dépose DEUX fois de suite : le premier envoi crée le fichier
 * (INSERT), le second le remplace (UPDATE) — c'est ce second appel qui
 * échouait. Un test sur une case vide passerait même sans la migration et
 * ne protégerait de rien.
 *
 * Il écrit sur la case Fulfulde du module 2, réservée aux tests : écraser
 * un média réellement servi à l'app faisait échouer downloads-resume.spec.ts,
 * qui vérifie la reprise sur ce même fichier.
 */

test("remplacer un fichier deja depose via l'interface reelle", async ({ page }) => {
  const storageCalls: { status: number; corps: string }[] = [];
  page.on("response", async (r) => {
    if (r.url().includes("/storage/v1/object/media/")) {
      storageCalls.push({
        status: r.status(),
        corps: r.status() >= 400 ? (await r.text().catch(() => "")).slice(0, 140) : "",
      });
    }
  });

  await loginAdmin(page);
  await page.goto("/dashboard/content");
  await page.waitForLoadState("networkidle");

  // Deux dépôts successifs : le second passe forcément par un UPDATE,
  // le cas précis qui échouait avant la migration 0013.
  const btn = page.getByLabel("Téléverser un fichier — module 2, ff");
  const input = btn.locator("xpath=following-sibling::input[@type='file']").first();
  await input.setInputFiles({
    name: "audio.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("premier depot de test"),
  });
  await page.waitForTimeout(5000);

  await input.setInputFiles({
    name: "audio.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("remplacement de test"),
  });
  await page.waitForTimeout(5000);

  const erreurAffichee = await page.evaluate(() => {
    const el = document.querySelector('[role="alert"]');
    return el ? (el.textContent || "").trim().slice(0, 160) : null;
  });

  console.log("APPELS_STORAGE: " + JSON.stringify(storageCalls));
  console.log("ERREUR_AFFICHEE: " + JSON.stringify(erreurAffichee));

  const echecs = storageCalls.filter((c) => c.status >= 400);
  expect(echecs, "aucun appel Storage ne doit echouer").toEqual([]);
});
