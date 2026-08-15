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
  "/",
  "/login",
  ...SEED_MODULES.flatMap((m) => [`/modules/${m.id}`, `/modules/${m.id}/session`]),
];

// Audios de démo référencés par lib/content/seed.ts : mêmes raisons que
// ci-dessus, /public/audio/*.mp3 ne sont pas des assets webpack et donc pas
// scannés automatiquement par le manifest de précache.
const facilitatorAudioUrls = Array.from(
  new Set(
    SEED_MODULES.flatMap((m) =>
      m.translations.map((t) => t.audio_url).filter((url): url is string => !!url),
    ),
  ),
);

const withSerwist = withSerwistInit({
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [...facilitatorPageUrls, ...facilitatorAudioUrls].map(
    (url) => ({ url, revision: null }),
  ),
});

export default withSerwist(nextConfig);
