import { test, expect } from "@playwright/test";

/**
 * Flow 9 (FLOW.md) — lecture vidéo avec piste de sous-titres, jamais couvert.
 * Le module 1 a video_url/subtitles_url définis dans lib/content/seed.ts ;
 * le module 2 n'en a pas, pour vérifier le fallback placeholder.
 */
test.describe("Lecteur vidéo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Votre nom").fill("Test Vidéo");
    await page.getByLabel("Code PIN (4 chiffres)").fill("9876");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/");
  });

  test("le module avec video_url affiche un vrai lecteur <video> avec sous-titres", async ({
    page,
  }) => {
    await page.getByText("La perception de l'enfance").click();
    await expect(page).toHaveURL(/\/modules\/1$/);

    const video = page.locator("video");
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute(
      "aria-label",
      "Vidéo d'exemple",
    );

    // La piste de sous-titres doit être présente dans le DOM.
    const track = video.locator("track");
    await expect(track).toHaveAttribute("kind", "subtitles");
    await expect(track).toHaveAttribute("src", "/video/module-1-fr.vtt");

    // Le fichier vidéo est réellement accessible (pas un lien mort).
    const videoSrc = await video.locator("source").getAttribute("src");
    expect(videoSrc).toBe("/video/module-1.mp4");
    const videoResponse = await page.request.get(videoSrc!);
    expect(videoResponse.ok()).toBe(true);

    // Le fichier de sous-titres est réellement accessible.
    const vttResponse = await page.request.get("/video/module-1-fr.vtt");
    expect(vttResponse.ok()).toBe(true);
    const vttBody = await vttResponse.text();
    expect(vttBody).toContain("WEBVTT");
  });

  test("le module sans video_url affiche toujours le placeholder statique", async ({
    page,
  }) => {
    await page.getByText("Développement de l'enfant").click();
    await expect(page).toHaveURL(/\/modules\/2$/);

    await expect(page.locator("video")).toHaveCount(0);
    await expect(page.getByText(/Vidéo d.exemple/)).toBeVisible();
  });
});
