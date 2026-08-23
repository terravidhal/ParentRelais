import { test, expect } from "@playwright/test";
import { skipFacilitatorOnboarding } from "./helpers";

/**
 * Flow 2 (FLOW.md) — lecture audio effective, jamais couvert : les tests
 * précédents vérifiaient seulement la navigation vers le module, pas le
 * clic sur le bouton play ni l'état réel de l'élément <audio>.
 */
test.describe("Lecteur audio", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Votre nom").fill("Test Audio");
    await page.getByLabel("Code PIN (4 chiffres)").fill("5566");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/home");
    await skipFacilitatorOnboarding(page);
    await page.reload();
  });

  test("cliquer sur play lance réellement la lecture, cliquer à nouveau la met en pause", async ({
    page,
  }) => {
    await page.getByText("La perception de l'enfance").click();
    await expect(page).toHaveURL(/\/module\?id=1$/);

    const audio = page.locator("audio");
    await expect(audio).toHaveCount(1);

    // Le fichier référencé doit être réellement accessible (pas un lien mort).
    // La langue par défaut est le français : l'ancien seed local réutilisait
    // un fichier unique pour toutes les langues, le contenu Supabase a un
    // audio par langue — d'où le fichier -fr et non -en.
    const src = await audio.getAttribute("src");
    expect(src).toBe("/audio/module-1-fr.mp3");
    const audioResponse = await page.request.get(src!);
    expect(audioResponse.ok()).toBe(true);

    const playButton = page.getByLabel("Lire l'audio");
    await expect(playButton).toBeVisible();

    await playButton.click();

    // Le bouton bascule en "pause" et l'élément <audio> n'est plus en pause.
    await expect(page.getByLabel("Mettre en pause")).toBeVisible();
    const isPaused = await audio.evaluate(
      (el: HTMLAudioElement) => el.paused,
    );
    expect(isPaused).toBe(false);

    await page.getByLabel("Mettre en pause").click();
    await expect(page.getByLabel("Lire l'audio")).toBeVisible();
    const isPausedAfter = await audio.evaluate(
      (el: HTMLAudioElement) => el.paused,
    );
    expect(isPausedAfter).toBe(true);
  });

  test("la barre de progression avance pendant la lecture", async ({
    page,
  }) => {
    await page.getByText("La perception de l'enfance").click();
    await expect(page).toHaveURL(/\/module\?id=1$/);

    await page.getByLabel("Lire l'audio").click();

    // Poll actif plutôt qu'un délai fixe : sous exécution parallèle (workers
    // concurrents), le décodage/démarrage audio peut prendre plus de temps
    // qu'un waitForTimeout arbitraire — waitForFunction réessaie jusqu'à ce
    // que currentTime avance réellement, preuve que la lecture progresse
    // vraiment, pas seulement que l'état React "playing" a changé.
    await page.waitForFunction(
      () => {
        const audio = document.querySelector("audio");
        return !!audio && audio.currentTime > 0;
      },
      { timeout: 10_000 },
    );

    const currentTime = await page
      .locator("audio")
      .evaluate((el: HTMLAudioElement) => el.currentTime);
    expect(currentTime).toBeGreaterThan(0);
  });
});
