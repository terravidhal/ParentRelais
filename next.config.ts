import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { SEED_MODULES } from "./lib/content/seed";

const nextConfig: NextConfig = {
  /* config options here */
};

/**
 * Documents HTML des routes (facilitator) à précacher explicitement au build.
 * @serwist/next ne scanne que les assets _next/static/* pour son manifest ;
 * les pages générées statiquement (generateStaticParams) ne sont PAS ajoutées
 * automatiquement. Sans ceci, la navigation vers /modules/{id} échouerait
 * hors-ligne tant que le facilitateur n'a pas visité la page au moins une
 * fois en ligne — incompatible avec CLAUDE.md règle 1 (précache intégral).
 */
const facilitatorPageUrls = [
  "/home",
  "/login",
  "/history",
  "/profile",
  "/downloads",
  ...SEED_MODULES.flatMap((m) => [`/modules/${m.id}`, `/modules/${m.id}/session`]),
];

// Médias de démo référencés par lib/content/seed.ts : mêmes raisons que
// ci-dessus, /public/audio|video/* ne sont pas des assets webpack et donc pas
// scannés automatiquement par le manifest de précache. Sans ceci, la vidéo
// ne serait précachée qu'après une première visite en ligne — contrairement
// à l'audio, régression silencieuse pour le mode offline.
function collectMediaUrls(
  pick: (t: (typeof SEED_MODULES)[number]["translations"][number]) => string | undefined,
): string[] {
  return Array.from(
    new Set(
      SEED_MODULES.flatMap((m) =>
        m.translations.map(pick).filter((url): url is string => !!url),
      ),
    ),
  );
}

const facilitatorAudioUrls = collectMediaUrls((t) => t.audio_url);
const facilitatorSubtitleUrls = collectMediaUrls((t) => t.subtitles_url);

const withSerwist = withSerwistInit({
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Les VIDÉOS sont volontairement absentes du précache obligatoire.
  //
  // Mesuré en production : avec elles, le service worker restait bloqué en
  // "installing" pendant 30 s sur une connexion rapide (31 Mo à télécharger
  // avant de pouvoir s'activer) — soit plusieurs minutes en 3G. Pendant tout
  // ce temps, aucune installation de la PWA n'est possible (un SW actif est
  // requis), le mode hors-ligne ne fonctionne pas, et l'app paraît inerte.
  //
  // Les pages, l'audio (1,5 Mo) et les sous-titres restent précachés : ils
  // sont légers et garantissent une app utilisable immédiatement hors-ligne.
  // Les vidéos passent par le gestionnaire de téléchargement, où
  // l'utilisateur décide et suit la progression (lib/downloads/manager.ts).
  additionalPrecacheEntries: [
    ...facilitatorPageUrls,
    ...facilitatorAudioUrls,
    ...facilitatorSubtitleUrls,
  ].map((url) => ({ url, revision: null })),
});

export default withSerwist(nextConfig);
