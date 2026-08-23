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

/**
 * Connecte le facilitateur de démonstration.
 *
 * Depuis la migration 0017, la première connexion vérifie un vrai compte
 * Supabase (email + mot de passe) au lieu de créer une identité locale
 * arbitraire : c'est ce qui permet aux politiques RLS de lier chaque séance
 * à `auth.uid()`.
 *
 * Le PIN reste choisi localement et suffit ensuite, même hors-ligne.
 */
export async function loginAsDemoFacilitator(
  page: Page,
  pin = "1234",
): Promise<void> {
  await page.goto("/login");

  // Le formulaire a DEUX états : première connexion (email + mot de passe +
  // PIN) ou reconnexion (PIN seul, si une session locale existe déjà). Un
  // test qui suppose toujours le premier échoue dès qu'un test précédent a
  // laissé une session dans Dexie — constaté en suite complète, où l'échec
  // se déplaçait d'un fichier à l'autre selon l'ordre d'exécution.
  const emailField = page.getByLabel("Votre email");
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill("facilitateur.demo@parentrelais.app");
    await page.getByLabel("Mot de passe").fill("DemoTerrain2026!");
  }

  await page.getByLabel("Code PIN (4 chiffres)").fill(pin);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("/home", { timeout: 20_000 });
}
