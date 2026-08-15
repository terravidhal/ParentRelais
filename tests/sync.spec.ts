import { test, expect } from "@playwright/test";

/**
 * Test de synchronisation réelle contre le vrai Supabase de dev (.env.local).
 * Complète facilitator-journey.spec.ts, qui s'arrête au récap sans jamais
 * cliquer sur "Synchroniser" ni vérifier le passage pending → synced.
 */
test.describe("Synchronisation", () => {
  test("une séance animée se synchronise et affiche un toast de succès", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Votre nom").fill("Test Sync Auto");
    await page.getByLabel("Code PIN (4 chiffres)").fill("2468");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/");

    // Animer une séance complète jusqu'au récap.
    await page.getByText("La perception de l'enfance").click();
    await page.getByRole("button", { name: "Animer une séance" }).click();
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
    await expect(page).toHaveURL("/");

    // La bannière doit indiquer une séance en attente de synchronisation.
    await expect(page.getByText(/1 à synchroniser/)).toBeVisible();

    // Déclencher la synchronisation manuellement.
    const syncButton = page.getByRole("button", { name: /Synchroniser/ });
    await expect(syncButton).toBeVisible();
    await syncButton.click();

    // Le toast de succès confirme l'upsert Supabase réussi de bout en bout.
    await expect(page.getByText(/séance.*synchronisée/)).toBeVisible({
      timeout: 10_000,
    });

    // La bannière ne doit plus afficher de séance en attente.
    await expect(page.getByText(/à synchroniser/)).not.toBeVisible();

    // Vérifier directement en base que la séance a bien changé de statut
    // dans Dexie (pending -> synced), pas seulement l'apparence du toast.
    const outbox = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open("parentrelais");
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("outbox", "readonly");
          const store = tx.objectStore("outbox");
          const getAll = store.getAll();
          getAll.onsuccess = () => resolve(getAll.result);
          getAll.onerror = () => reject(getAll.error);
        };
        req.onerror = () => reject(req.error);
      });
    });

    expect(Array.isArray(outbox)).toBe(true);
    const sessions = outbox as { status: string }[];
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.every((s) => s.status === "synced")).toBe(true);
  });
});
