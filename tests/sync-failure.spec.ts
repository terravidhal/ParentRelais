import { test, expect } from "@playwright/test";
import { skipFacilitatorOnboarding, loginAsDemoFacilitator } from "./helpers";

/**
 * Flow 8 (FLOW.md) — échec de synchronisation, jamais couvert. Intercepte la
 * requête Supabase (route mocking) pour simuler un échec réseau/serveur sans
 * dépendre d'un vrai état d'erreur côté base — sync.spec.ts couvre déjà le
 * chemin heureux contre le vrai Supabase de dev.
 */
test.describe("Échec de synchronisation", () => {
  test("un upsert Supabase en échec affiche un toast d'erreur et garde la séance en pending", async ({
    page,
  }) => {
    // Intercepte toute requête vers la table sessions et force un 500.
    await page.route("**/rest/v1/sessions**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          code: "XXXXX",
          message: "simulated failure",
        }),
      }),
    );

    await loginAsDemoFacilitator(page, "1212");
    await skipFacilitatorOnboarding(page);
    await page.reload();

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
    await page.getByRole("button", { name: "Revenir à l'accueil" }).click();
    await expect(page).toHaveURL("/home");

    const syncButton = page.getByRole("button", { name: /Envoyer maintenant/ });
    await expect(syncButton).toBeVisible();
    await syncButton.click();

    // Toast d'erreur explicite, jamais un échec silencieux.
    await expect(
      page.getByText("Synchronisation impossible pour le moment. Réessayez plus tard."),
    ).toBeVisible({ timeout: 10_000 });

    // La bannière doit toujours indiquer une séance en attente.
    await expect(page.getByText(/à synchroniser/)).toBeVisible();

    // La séance reste "pending" en local — rien n'est perdu ni marqué à tort.
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

    const sessions = outbox as { status: string }[];
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.every((s) => s.status === "pending")).toBe(true);
  });
});
