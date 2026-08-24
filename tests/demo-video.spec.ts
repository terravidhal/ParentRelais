import { test, type Page } from "@playwright/test";
import { skipFacilitatorOnboarding } from "./helpers";

/**
 * Vidéo de démonstration destinée au jury.
 *
 * Filme l'application RÉELLE plutôt qu'une animation reconstituée : ce que
 * le jury voit est exactement ce qu'il obtiendra en testant lui-même.
 *
 * Rythme volontairement lent (1,5 à 2 s entre les actions) : ce n'est pas un
 * test, c'est un tutoriel. Chromium sans interface ne dessine pas de
 * curseur, on en injecte donc un, avec un effet visible au clic.
 *
 * Sortie WebM (seul format que Playwright produit), converti en MP4 par
 * scripts/build-demo-video.mjs.
 *
 * Lancement : pnpm demo:video
 */

test.use({
  viewport: { width: 390, height: 844 },
  // `video` est l'option de test ; le dossier de sortie et la taille sont
  // pilotés par la configuration Playwright (outputDir + viewport).
  video: { mode: "on", size: { width: 390, height: 844 } },
});

const PAUSE = 1600;

/** Curseur factice + calque d'annotations, réinjectés à chaque navigation. */
async function installOverlay(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      #demo-cursor {
        position: fixed; width: 26px; height: 26px; z-index: 2147483647;
        border-radius: 50%; background: rgba(12,124,154,.35);
        border: 2px solid #0C7C9A; pointer-events: none;
        transform: translate(-50%,-50%);
        transition: left .55s cubic-bezier(.22,.61,.36,1),
                    top .55s cubic-bezier(.22,.61,.36,1);
        left: 195px; top: 700px;
      }
      #demo-cursor.clicking { animation: demo-click .4s ease-out; }
      @keyframes demo-click {
        0% { transform: translate(-50%,-50%) scale(1); }
        45% { transform: translate(-50%,-50%) scale(.55);
              background: rgba(224,150,26,.75); }
        100% { transform: translate(-50%,-50%) scale(1); }
      }
      #demo-note {
        position: fixed; left: 16px; right: 16px; bottom: 26px;
        z-index: 2147483646; padding: 14px 16px; border-radius: 18px;
        background: rgba(22,36,31,.94); color: #fff;
        font: 600 15px/1.35 system-ui, sans-serif; text-align: center;
        opacity: 0; transition: opacity .35s ease;
        /* Sans ceci, le calque intercepte les clics : Playwright voit
           l'élément mais ne peut pas l'atteindre. */
        pointer-events: none;
        box-shadow: 0 18px 40px -18px rgba(0,0,0,.7);
      }
      #demo-note.on { opacity: 1; }
    `,
  });

  await page.evaluate(() => {
    if (!document.getElementById("demo-cursor")) {
      const c = document.createElement("div");
      c.id = "demo-cursor";
      document.body.appendChild(c);
    }
    if (!document.getElementById("demo-note")) {
      const n = document.createElement("div");
      n.id = "demo-note";
      document.body.appendChild(n);
    }
  });
}

/** Déplace le curseur jusqu'à un élément, puis clique réellement dessus. */
async function clickAt(page: Page, selector: string): Promise<void> {
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error(`Élément introuvable pour la vidéo : ${selector}`);

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.evaluate(
    ({ x, y }) => {
      const c = document.getElementById("demo-cursor");
      if (c) {
        c.style.left = `${x}px`;
        c.style.top = `${y}px`;
      }
    },
    { x, y },
  );
  await page.waitForTimeout(700);

  await page.evaluate(() => {
    document.getElementById("demo-cursor")?.classList.add("clicking");
  });
  await page.waitForTimeout(320);
  await page.evaluate(() => {
    document.getElementById("demo-cursor")?.classList.remove("clicking");
  });

  await target.click();
}

async function note(page: Page, text: string, hold = PAUSE): Promise<void> {
  await page.evaluate((t) => {
    const n = document.getElementById("demo-note");
    if (n) {
      n.textContent = t;
      n.classList.add("on");
    }
  }, text);
  await page.waitForTimeout(hold);
}

async function clearNote(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.getElementById("demo-note")?.classList.remove("on");
  });
  await page.waitForTimeout(300);
}

/** Carte plein écran entre deux étapes, pour découper le récit. */
async function titleCard(
  page: Page,
  step: string,
  title: string,
  subtitle: string,
  hold = 2100,
): Promise<void> {
  // Le défilement de la page est neutralisé le temps de la carte, sinon sa
  // barre reste visible sur les bords de la vidéo.
  await page.evaluate(() => {
    document.documentElement.style.overflow = "hidden";
  });
  await page.evaluate(
    ({ step, title, subtitle }) => {
      const card = document.createElement("div");
      card.id = "demo-card";
      // `100vw/100vh` plutôt que `inset:0` : la carte couvre le cadre entier
      // même si la page en dessous défile, et la barre de défilement de
      // l'arrière-plan n'apparaît plus dans l'image (constaté en capture).
      card.style.cssText = `
        position:fixed; top:0; left:0; width:100vw; height:100vh;
        z-index:2147483647; overflow:hidden;
        background:linear-gradient(160deg,#0C7C9A,#08596E);
        color:#fff; display:flex; flex-direction:column;
        align-items:center; justify-content:center; gap:14px; padding:32px;
        font-family:system-ui,sans-serif; text-align:center;
        opacity:0; transition:opacity .45s ease;
        /* Purement visuel : sans ceci, la carte bloque tout clic tant
           qu'elle n'est pas retirée du DOM. */
        pointer-events:none;`;
      card.innerHTML = `
        <div style="font:700 13px/1 system-ui;letter-spacing:.22em;opacity:.75">${step}</div>
        <div style="font:800 27px/1.2 system-ui">${title}</div>
        <div style="font:500 16px/1.45 system-ui;opacity:.9;max-width:300px">${subtitle}</div>`;
      document.body.appendChild(card);
      requestAnimationFrame(() => {
        card.style.opacity = "1";
      });
    },
    { step, title, subtitle },
  );

  await page.waitForTimeout(hold);
  await page.evaluate(() => {
    const c = document.getElementById("demo-card");
    if (c) c.style.opacity = "0";
  });
  await page.waitForTimeout(500);
  // Retiré du DOM une fois l'effacement terminé, sans setTimeout côté page :
  // un retrait différé laissait la carte présente au clic suivant.
  await page.evaluate(() => {
    document.getElementById("demo-card")?.remove();
    document.documentElement.style.overflow = "";
  });
  await page.waitForTimeout(200);
}

test("démonstration ParentRelais", async ({ page, context }) => {
  test.setTimeout(240_000);

  // ---------- Ouverture ----------
  await page.goto("/login");
  await installOverlay(page);
  await titleCard(
    page,
    "PARENTRELAIS",
    "L'outil de terrain qui fonctionne sans réseau",
    "UNICEF Cameroun × MINPROFF",
    2600,
  );

  await note(page, "Le facilitateur se connecte une seule fois, en ligne.");
  await clearNote(page);
  await clickAt(page, 'button:has-text("Se connecter")');
  await page.waitForURL("/home", { timeout: 25_000 });

  // Le guide interactif s'ouvre à la première visite et son voile bloque
  // tous les clics — il masquerait la démonstration elle-même.
  await skipFacilitatorOnboarding(page);
  await page.reload();
  await page.waitForTimeout(2200);
  await installOverlay(page);

  // ---------- Les modules ----------
  await titleCard(
    page,
    "ÉTAPE 1",
    "Les modules de formation",
    "Textes, audio et quiz, dans plusieurs langues",
  );
  await note(page, "Huit modules, consultables en français comme en anglais.");
  await clearNote(page);
  await page.waitForTimeout(900);

  await clickAt(page, 'h3:has-text("La perception de l\'enfance")');
  await page.waitForTimeout(1800);
  await installOverlay(page);
  await note(page, "Chaque module est écoutable : lire n'est pas nécessaire.");
  await clearNote(page);

  // ---------- Le hors-ligne ----------
  await titleCard(
    page,
    "ÉTAPE 2",
    "On coupe le réseau",
    "C'est ici que tout se joue",
    2400,
  );
  await context.setOffline(true);
  await page.waitForTimeout(900);
  await installOverlay(page);
  await note(page, "Réseau coupé — l'application continue de fonctionner.", 2200);
  await clearNote(page);

  // ---------- Animer une séance ----------
  await titleCard(
    page,
    "ÉTAPE 3",
    "Animer une séance",
    "Sans aucune connexion",
  );
  await clickAt(page, 'button:has-text("Animer une séance")');
  await page.waitForTimeout(1500);
  await installOverlay(page);

  await note(page, "Le facilitateur note les présences.");
  await clearNote(page);
  await clickAt(page, 'button:has-text("Continuer")');
  await page.waitForTimeout(1300);
  await installOverlay(page);

  await note(page, "Puis un court quiz clôt la séance.");
  await clearNote(page);
  await clickAt(page, 'button:has-text("Comprendre et expliquer calmement")');
  await page.waitForTimeout(800);
  await clickAt(page, 'button:has-text("Décisifs pour son cerveau")');
  await page.waitForTimeout(800);
  await clickAt(page, 'button:has-text("Terminer la séance")');
  await page.waitForTimeout(1600);
  await installOverlay(page);
  await note(page, "La séance est enregistrée sur l'appareil.", 2000);
  await clearNote(page);

  // ---------- La synchronisation ----------
  await titleCard(
    page,
    "ÉTAPE 4",
    "Le réseau revient",
    "La séance remonte toute seule",
  );
  await clickAt(page, 'button:has-text("Revenir à l\'accueil")');
  await page.waitForTimeout(1200);
  await context.setOffline(false);
  await page.waitForTimeout(2600);
  await installOverlay(page);
  await note(page, "Synchronisation automatique, sans action du facilitateur.", 2400);
  await clearNote(page);

  // ---------- Le pilotage ----------
  await titleCard(
    page,
    "ÉTAPE 5",
    "Côté UNICEF / MINPROFF",
    "Les séances alimentent le pilotage national",
  );
  await page.goto("/dashboard/login");
  await page.waitForTimeout(1200);
  await installOverlay(page);
  await clickAt(page, 'button:has-text("Se connecter")');
  await page.waitForURL(/\/dashboard$/, { timeout: 25_000 });
  await page.waitForTimeout(2200);
  await installOverlay(page);
  await note(page, "Familles touchées, localités couvertes, facilitateurs actifs.", 2600);
  await clearNote(page);

  await titleCard(
    page,
    "PARENTRELAIS",
    "Le réseau peut manquer. Le relais, lui, continue.",
    "parent-relais.vercel.app",
    3200,
  );
});
