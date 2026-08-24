/**
 * Convertit l'enregistrement Playwright (WebM) en MP4.
 *
 * Playwright ne produit que du WebM/VP8 ; les navigateurs et lecteurs
 * attendus par un jury lisent tous le MP4/H.264. La conversion est donc
 * obligatoire, pas cosmétique.
 *
 * Prérequis : ffmpeg dans le PATH.
 * Usage : node scripts/build-demo-video.mjs
 */
import { execFileSync } from "node:child_process";
import { readdirSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Playwright écrit dans son dossier de résultats, pas dans un dossier dédié.
const RAW_DIR = "test-results";
const OUT_DIR = "public/demo";
const OUT_FILE = join(OUT_DIR, "parentrelais-demo.mp4");

function newestWebm(dir) {
  // L'enregistrement est rangé dans un sous-dossier par test.
  const files = readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => ({ path: join(dir, f), time: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.time - a.time);
  if (files.length === 0) {
    throw new Error(
      `Aucun enregistrement dans ${dir}/. Lancez d'abord : pnpm demo:record`,
    );
  }
  return files[0].path;
}

const source = newestWebm(RAW_DIR);
mkdirSync(OUT_DIR, { recursive: true });

console.log(`Conversion de ${source}…`);
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i", source,
    "-c:v", "libx264",
    "-crf", "24",
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    // `faststart` place l'index en tête : la vidéo démarre sans avoir été
    // entièrement téléchargée, ce qui compte sur une connexion lente.
    "-movflags", "+faststart",
    // Dimensions paires exigées par H.264.
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    OUT_FILE,
  ],
  { stdio: "inherit" },
);

const size = (statSync(OUT_FILE).size / (1024 * 1024)).toFixed(1);
console.log(`\nVidéo prête : ${OUT_FILE} (${size} Mo)`);
