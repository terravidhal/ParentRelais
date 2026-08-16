import type { Page } from "@playwright/test";

/**
 * Marque le guide interactif (driver.js) comme déjà vu dans Dexie, pour que
 * les tests qui ne testent pas explicitement l'onboarding ne se heurtent pas
 * à son overlay bloquant. Doit être appelé après un premier chargement réussi
 * de la zone facilitateur (Dexie déjà ouvert).
 *
 * N'effectue PAS de reload lui-même : dans les tests qui enchaînent avec une
 * coupure réseau (context.setOffline), un reload superflu ici peut interférer
 * avec le moment où le service worker prend le contrôle de la page — laisser
 * l'appelant décider quand recharger (généralement le prochain reload prévu
 * par le test suffit à faire lire le nouveau flag par le composant).
 */
export async function skipFacilitatorOnboarding(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open("parentrelais");
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("meta", "readwrite");
        tx.objectStore("meta").put({ key: "onboarding_seen", value: "true" });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  });
}
