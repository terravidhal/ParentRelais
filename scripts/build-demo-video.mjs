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
import { readdirSync, mkdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

// Playwright écrit dans son dossier de résultats, pas dans un dossier dédié.
const RAW_DIR = "test-results";
const OUT_DIR = "public/demo";
const OUT_FILE = join(OUT_DIR, "parentrelais-demo.mp4");
const MUSIC = "assets/demo-music.mp3";

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

const hasMusic = existsSync(MUSIC);
console.log(`Conversion de ${source}${hasMusic ? " (avec musique)" : ""}…`);

const videoArgs = [
  "-c:v", "libx264",
  "-crf", "24",
  "-preset", "slow",
  "-pix_fmt", "yuv420p",
  // `faststart` place l'index en tête : la vidéo démarre sans avoir été
  // entièrement téléchargée, ce qui compte sur une connexion lente.
  "-movflags", "+faststart",
  // Dimensions paires exigées par H.264.
  "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
];

// La piste est plus longue que la vidéo : on la coupe sur la durée de
// l'image (`-shortest`), avec un fondu de sortie pour éviter une coupure
// brutale. Mono 64 kbps : la musique n'est qu'un fond, et chaque mégaoctet
// compte sur une connexion de terrain.
const audioArgs = hasMusic
  ? [
      "-i", MUSIC,
      "-filter_complex", "[1:a]volume=0.22,afade=t=out:st=%FADE%:d=3[a]",
      "-map", "0:v",
      "-map", "[a]",
      "-c:a", "aac",
      "-b:a", "64k",
      "-ac", "1",
      "-shortest",
    ]
  : [];

// Durée de la vidéo, pour caler le début du fondu.
const duration = Number(
  execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    source,
  ]).toString().trim(),
);

const resolvedAudio = audioArgs.map((a) =>
  a.replace("%FADE%", String(Math.max(0, duration - 3).toFixed(1))),
);

execFileSync(
  "ffmpeg",
  ["-y", "-i", source, ...resolvedAudio, ...videoArgs, OUT_FILE],
  { stdio: "inherit" },
);

const size = (statSync(OUT_FILE).size / (1024 * 1024)).toFixed(1);
console.log(`\nVidéo prête : ${OUT_FILE} (${size} Mo)`);
