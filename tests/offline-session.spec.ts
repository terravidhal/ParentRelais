import { test, expect } from "@playwright/test";
import { skipFacilitatorOnboarding } from "./helpers";

/**
 * Complète offline.spec.ts (qui s'arrête à la navigation vers un module) :
 * anime une séance complète — présences, quiz, récap, écriture en local —
 * intégralement réseau coupé, puis vérifie que la séance survit à un
 * rechargement de page toujours hors-ligne.
 */
test.describe("Séance complète hors-ligne", () => {
  test("animer une séance de bout en bout réseau coupé, la séance persiste après reload", async ({
    page,
    context,
  }) => {
    // 1. Premier chargement en ligne : précache le service worker et les
    // routes /modules/1 et /modules/1/session.
    await page.goto("/login");
    await page.getByLabel("Votre nom").fill("Facilitateur Offline Séance");
    await page.getByLabel("Code PIN (4 chiffres)").fill("7788");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/");

    await page
      .waitForFunction(
        () => navigator.serviceWorker?.controller != null,
        { timeout: 15_000 },
      )
      .catch(() => {});
    await page.reload();
    await page.waitForLoadState("networkidle");
    await skipFacilitatorOnboarding(page);

    // 2. Couper le réseau.
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await page.reload();
    await expect(page.getByText("La perception de l'enfance")).toBeVisible({
      timeout: 10_000,
    });

    // 3. Animer une séance complète, toujours hors-ligne.
    await page.getByText("La perception de l'enfance").click();
    await expect(page).toHaveURL(/\/modules\/1$/);

    await page.getByRole("button", { name: "Animer une séance" }).click();
    await expect(page).toHaveURL(/\/modules\/1\/session$/);

    await page.getByRole("button", { name: "Continuer" }).click();
    await page
      .getByRole("button", { name: "Comprendre et expliquer calmement" })
      .click();
    await page
      .getByRole("button", { name: "Décisifs pour son cerveau" })
      .click();
    await page.getByRole("button", { name: "Terminer la séance" }).click();

    // Le récap doit s'afficher — la séance a été écrite en local sans réseau.
    await expect(page.getByText("Séance enregistrée")).toBeVisible();
    await expect(page.getByText(/Enregistré sur l.appareil/)).toBeVisible();

    // 4. Vérifier directement en base, avant tout retour à l'accueil.
    const outboxBeforeReload = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open("parentrelais");
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("outbox", "readonly");
          const getAll = tx.objectStore("outbox").getAll();
          getAll.onsuccess = () => resolve(getAll.result);
          getAll.onerror = () => reject(getAll.error);
        };
        req.onerror = () => reject(req.error);
      });
    });
    const sessionsBeforeReload = outboxBeforeReload as { status: string }[];
    expect(sessionsBeforeReload.length).toBeGreaterThan(0);
    expect(
      sessionsBeforeReload.every((s) => s.status === "pending"),
    ).toBe(true);

    // 5. Retour accueil puis rechargement, toujours hors-ligne : la séance
    // ne doit pas disparaître (persistance IndexedDB indépendante du service
    // worker/réseau). Un simple page.reload() ici rechargerait /modules/1/
    // session, qui remonte à l'étape 0 par design (état local du composant)
    // — pas un bug, mais pas ce qu'on veut vérifier.
    await page.getByRole("button", { name: "Revenir à l'accueil" }).click();
    await expect(page).toHaveURL("/");
    await page.reload();
    await expect(page.getByText("Modules de formation")).toBeVisible({
      timeout: 10_000,
    });

    const outboxAfterReload = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open("parentrelais");
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("outbox", "readonly");
          const getAll = tx.objectStore("outbox").getAll();
          getAll.onsuccess = () => resolve(getAll.result);
          getAll.onerror = () => reject(getAll.error);
        };
        req.onerror = () => reject(req.error);
      });
    });
    const sessionsAfterReload = outboxAfterReload as { status: string }[];
    expect(sessionsAfterReload.length).toBe(sessionsBeforeReload.length);

    await context.setOffline(false);
  });
});
