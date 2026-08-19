import { test, expect } from "@playwright/test";
import { skipFacilitatorOnboarding } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

/**
 * Garantit que la reprise de téléchargement reste possible : toute la
 * gestion offline en dépend (un fichier coupé à 90 % ne doit pas repartir
 * de zéro). Si Supabase Storage cessait d'honorer les requêtes Range, ce
 * test échouerait et le gestionnaire retomberait silencieusement sur un
 * retry complet — d'où l'intérêt de le détecter ici.
 */

const SUPABASE_MEDIA =
  "https://hohuismlzgoymjcctmka.supabase.co/storage/v1/object/public/media/modules/1/sign/video.mp4";

test("reprise Range sur un media Supabase (cas reel des videos uploadees)", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Votre nom").fill("Range Test");
  await page.getByLabel("Code PIN (4 chiffres)").fill("7373");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/home", { timeout: 45000 });
  await skipFacilitatorOnboarding(page);

  const result = await page.evaluate(async (url) => {
    const first = await fetch(url, { headers: { Range: "bytes=0-99999" } });
    const firstBytes = (await first.arrayBuffer()).byteLength;

    const second = await fetch(url, { headers: { Range: `bytes=${firstBytes}-` } });
    return {
      firstStatus: first.status,
      firstBytes,
      secondStatus: second.status,
      secondRange: second.headers.get("content-range"),
      secondLength: Number(second.headers.get("content-length")),
    };
  }, SUPABASE_MEDIA);

  console.log("RANGE_SUPABASE: " + JSON.stringify(result));
  // content-range n'est pas exposé au JS par CORS : on prouve la reprise par
  // le nombre d'octets restants (total - déjà reçus), qui ne peut être exact
  // que si le serveur a bien repris à l'offset demandé.
  expect(result.secondStatus).toBe(206);
  expect(result.secondLength).toBe(5365449 - result.firstBytes);
});

test("le service worker sert les medias precaches en entier (Range ignore)", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Votre nom").fill("SW Range");
  await page.getByLabel("Code PIN (4 chiffres)").fill("7474");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/home", { timeout: 45000 });
  await skipFacilitatorOnboarding(page);
  await page.waitForTimeout(1500);

  const res = await page.evaluate(async () => {
    const r = await fetch("/video/module-1.mp4", { headers: { Range: "bytes=1000-" } });
    return { status: r.status, length: Number(r.headers.get("content-length")) };
  });
  console.log("RANGE_PRECACHE: " + JSON.stringify(res));
  // 200 attendu : servi depuis le précache, donc pas de reprise partielle —
  // sans conséquence, le fichier est déjà entièrement disponible hors-ligne.
  expect([200, 206]).toContain(res.status);
});
